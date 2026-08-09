-- Indexes Store — residual production security hardening
-- Target Supabase project: wtudcippyxbaobqzbmok
-- Must run after 20260731000000_p0_production_hardening.sql.
--
-- This migration:
--   * replaces open CMS/audit RLS policies with tenant-scoped access;
--   * removes public Storage listing/writes and scopes staff uploads by tenant path;
--   * removes externally callable SECURITY DEFINER functions from public;
--   * fixes the two remaining mutable function search_path findings.
--
-- Leaked-password protection is an Auth service setting and cannot be enabled by
-- PostgreSQL DDL. Enable it separately in Dashboard > Authentication > Settings.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

do $preflight$
declare
  missing_objects text[];
begin
  select array_agg(object_name)
    into missing_objects
  from (
    values
      ('public.cms_pages'::text),
      ('public.cms_page_versions'),
      ('public.tenant_audit_logs'),
      ('public.tenant_members'),
      ('public.user_roles'),
      ('public.reviews'),
      ('public.orders'),
      ('storage.objects')
  ) as required(object_name)
  where to_regclass(object_name) is null;

  if missing_objects is not null then
    raise exception
      'Residual hardening aborted; required objects are missing: %',
      array_to_string(missing_objects, ', ');
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'media_files'
      and column_name = 'thumbnail_url'
  ) then
    raise exception
      'Residual hardening aborted; apply 20260731000000_p0_production_hardening.sql first';
  end if;
end
$preflight$;

-- ---------------------------------------------------------------------------
-- 1. Authorization helpers
--
-- The old helpers needed SECURITY DEFINER because tenant_members policies called
-- back into tenant_members. Make membership reads self-only first, remove direct
-- membership writes, then safely use SECURITY INVOKER helpers.
-- ---------------------------------------------------------------------------

drop policy if exists "Members view their memberships"
  on public.tenant_members;
drop policy if exists "Owners and admins add members"
  on public.tenant_members;
drop policy if exists "Owners and admins remove members"
  on public.tenant_members;
drop policy if exists "Owners and admins update members"
  on public.tenant_members;
drop policy if exists "P0 members read own membership"
  on public.tenant_members;

alter table public.tenant_members enable row level security;

revoke insert, update, delete, truncate, references, trigger
  on table public.tenant_members from anon, authenticated;
grant select on table public.tenant_members to authenticated;
grant all on table public.tenant_members to service_role;

create policy "P0 members read own membership"
  on public.tenant_members
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
  );

drop policy if exists "Authenticated can view roles"
  on public.user_roles;
drop policy if exists "P0 users read own roles"
  on public.user_roles;

create policy "P0 users read own roles"
  on public.user_roles
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
  );

create or replace function public.has_role(
  _user_id uuid,
  _role public.app_role
)
returns boolean
language plpgsql
stable
security invoker
set search_path = pg_catalog, public
as $function$
begin
  if _user_id is null
     or (select auth.uid()) is null
     or _user_id <> (select auth.uid()) then
    return false;
  end if;

  return exists (
      select 1
      from public.user_roles as ur
      where ur.user_id = _user_id
        and ur.role = _role
  );
end;
$function$;

create or replace function public.is_tenant_member(
  _tenant_id uuid,
  _user_id uuid
)
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, public
as $function$
  select
    _tenant_id is not null
    and _user_id is not null
    and (select auth.uid()) is not null
    and _user_id = (select auth.uid())
    and exists (
      select 1
      from public.tenant_members as tm
      where tm.tenant_id = _tenant_id
        and tm.user_id = _user_id
    );
$function$;

create or replace function public.has_tenant_role(
  _tenant_id uuid,
  _user_id uuid,
  _role public.tenant_role
)
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, public
as $function$
  select
    _tenant_id is not null
    and _user_id is not null
    and (select auth.uid()) is not null
    and _user_id = (select auth.uid())
    and exists (
      select 1
      from public.tenant_members as tm
      where tm.tenant_id = _tenant_id
        and tm.user_id = _user_id
        and tm.role = _role
    );
$function$;

create or replace function public.has_tenant_permission(
  _tenant_id uuid,
  _user_id uuid,
  _required_role public.tenant_role
)
returns boolean
language plpgsql
stable
security invoker
set search_path = pg_catalog, public
as $function$
declare
  user_tenant_role public.tenant_role;
begin
  if _tenant_id is null
     or _user_id is null
     or (select auth.uid()) is null
     or _user_id <> (select auth.uid()) then
    return false;
  end if;

  if public.has_role(_user_id, 'admin'::public.app_role) then
    return true;
  end if;

  select tm.role
    into user_tenant_role
  from public.tenant_members as tm
  where tm.tenant_id = _tenant_id
    and tm.user_id = _user_id;

  if user_tenant_role is null then
    return false;
  end if;

  return case _required_role
    when 'viewer'::public.tenant_role then true
    when 'staff'::public.tenant_role
      then user_tenant_role in (
        'staff'::public.tenant_role,
        'owner'::public.tenant_role
      )
    when 'owner'::public.tenant_role
      then user_tenant_role = 'owner'::public.tenant_role
    else false
  end;
end;
$function$;

create or replace function public.can_manage_tenant(
  _tenant_id uuid,
  _user_id uuid
)
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, public
as $function$
  select
    _tenant_id is not null
    and _user_id is not null
    and (select auth.uid()) is not null
    and _user_id = (select auth.uid())
    and (
      public.has_role(_user_id, 'admin'::public.app_role)
      or public.is_tenant_member(_tenant_id, _user_id)
    );
$function$;

revoke all on function public.has_role(uuid, public.app_role)
  from public, anon, authenticated;
revoke all on function public.is_tenant_member(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.has_tenant_role(uuid, uuid, public.tenant_role)
  from public, anon, authenticated;
revoke all on function public.has_tenant_permission(uuid, uuid, public.tenant_role)
  from public, anon, authenticated;
revoke all on function public.can_manage_tenant(uuid, uuid)
  from public, anon, authenticated;

-- has_role is retained for anon because public catalog policies may call it.
-- It is SECURITY INVOKER and returns false before reading user_roles when
-- auth.uid() is null.
grant execute on function public.has_role(uuid, public.app_role)
  to anon, authenticated, service_role;
grant execute on function public.is_tenant_member(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.has_tenant_role(uuid, uuid, public.tenant_role)
  to authenticated, service_role;
grant execute on function public.has_tenant_permission(uuid, uuid, public.tenant_role)
  to authenticated, service_role;
grant execute on function public.can_manage_tenant(uuid, uuid)
  to authenticated, service_role;

-- Privileged mutators remain SECURITY DEFINER but are no longer Data API
-- endpoints for authenticated users.
revoke all on function public.update_order_branch(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.update_order_branch(uuid, uuid)
  to service_role;

revoke all on function public.increment_review_helpful(uuid)
  from public, anon, authenticated;
grant execute on function public.increment_review_helpful(uuid)
  to service_role;

-- ---------------------------------------------------------------------------
-- 2. CMS: public reads only published pages. Tenant staff may manage pages and
--    create/read versions. Version updates are prohibited; only owners delete.
-- ---------------------------------------------------------------------------

drop policy if exists "Allow all authenticated users to manage cms pages"
  on public.cms_pages;
drop policy if exists "P0 CMS staff read"
  on public.cms_pages;
drop policy if exists "P0 CMS staff insert"
  on public.cms_pages;
drop policy if exists "P0 CMS staff update"
  on public.cms_pages;
drop policy if exists "P0 CMS owner delete"
  on public.cms_pages;

alter table public.cms_pages enable row level security;

revoke all on table public.cms_pages from anon, authenticated;
grant select on table public.cms_pages to anon, authenticated;
grant insert, update, delete on table public.cms_pages to authenticated;
grant all on table public.cms_pages to service_role;

create policy "P0 CMS staff read"
  on public.cms_pages
  for select
  to authenticated
  using (
    public.has_tenant_permission(
      tenant_id,
      (select auth.uid()),
      'staff'::public.tenant_role
    )
  );

create policy "P0 CMS staff insert"
  on public.cms_pages
  for insert
  to authenticated
  with check (
    public.has_tenant_permission(
      tenant_id,
      (select auth.uid()),
      'staff'::public.tenant_role
    )
  );

create policy "P0 CMS staff update"
  on public.cms_pages
  for update
  to authenticated
  using (
    public.has_tenant_permission(
      tenant_id,
      (select auth.uid()),
      'staff'::public.tenant_role
    )
  )
  with check (
    public.has_tenant_permission(
      tenant_id,
      (select auth.uid()),
      'staff'::public.tenant_role
    )
  );

create policy "P0 CMS owner delete"
  on public.cms_pages
  for delete
  to authenticated
  using (
    public.has_tenant_permission(
      tenant_id,
      (select auth.uid()),
      'owner'::public.tenant_role
    )
  );

drop policy if exists "Allow authenticated users to manage cms page versions"
  on public.cms_page_versions;
drop policy if exists "P0 CMS versions staff read"
  on public.cms_page_versions;
drop policy if exists "P0 CMS versions staff insert"
  on public.cms_page_versions;
drop policy if exists "P0 CMS versions owner delete"
  on public.cms_page_versions;

alter table public.cms_page_versions enable row level security;

revoke all on table public.cms_page_versions from anon, authenticated;
grant select, insert, delete on table public.cms_page_versions to authenticated;
grant all on table public.cms_page_versions to service_role;

create policy "P0 CMS versions staff read"
  on public.cms_page_versions
  for select
  to authenticated
  using (
    public.has_tenant_permission(
      tenant_id,
      (select auth.uid()),
      'staff'::public.tenant_role
    )
  );

create policy "P0 CMS versions staff insert"
  on public.cms_page_versions
  for insert
  to authenticated
  with check (
    public.has_tenant_permission(
      tenant_id,
      (select auth.uid()),
      'staff'::public.tenant_role
    )
    and edited_by = (select auth.uid())
    and exists (
      select 1
      from public.cms_pages as page
      where page.id = cms_page_versions.page_id
        and page.tenant_id = cms_page_versions.tenant_id
    )
  );

create policy "P0 CMS versions owner delete"
  on public.cms_page_versions
  for delete
  to authenticated
  using (
    public.has_tenant_permission(
      tenant_id,
      (select auth.uid()),
      'owner'::public.tenant_role
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Audit logs: tenant staff may read; all writes are server-only.
-- ---------------------------------------------------------------------------

drop policy if exists "Allow authenticated users to manage audit logs"
  on public.tenant_audit_logs;
drop policy if exists "P0 tenant staff read audit logs"
  on public.tenant_audit_logs;

alter table public.tenant_audit_logs enable row level security;

revoke all on table public.tenant_audit_logs from anon, authenticated;
grant select on table public.tenant_audit_logs to authenticated;
grant all on table public.tenant_audit_logs to service_role;

create policy "P0 tenant staff read audit logs"
  on public.tenant_audit_logs
  for select
  to authenticated
  using (
    public.has_tenant_permission(
      tenant_id,
      (select auth.uid()),
      'staff'::public.tenant_role
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Storage: product-images remains a public delivery bucket, so public object
--    URLs continue to work. Remove SQL SELECT/ALL policies to stop listing.
--    Client writes are only allowed under uploads/{tenant_id}/...
-- ---------------------------------------------------------------------------

drop policy if exists "Public Read and Write" on storage.objects;
drop policy if exists "P0 product images staff list" on storage.objects;
drop policy if exists "P0 product images staff insert" on storage.objects;
drop policy if exists "P0 product images staff update" on storage.objects;
drop policy if exists "P0 product images owner delete" on storage.objects;

create policy "P0 product images staff list"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = 'uploads'
    and case
      when (storage.foldername(name))[2] ~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then public.has_tenant_permission(
        ((storage.foldername(name))[2])::uuid,
        (select auth.uid()),
        'staff'::public.tenant_role
      )
      else false
    end
  );

create policy "P0 product images staff insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = 'uploads'
    and case
      when (storage.foldername(name))[2] ~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then public.has_tenant_permission(
        ((storage.foldername(name))[2])::uuid,
        (select auth.uid()),
        'staff'::public.tenant_role
      )
      else false
    end
  );

create policy "P0 product images staff update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = 'uploads'
    and case
      when (storage.foldername(name))[2] ~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then public.has_tenant_permission(
        ((storage.foldername(name))[2])::uuid,
        (select auth.uid()),
        'staff'::public.tenant_role
      )
      else false
    end
  )
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = 'uploads'
    and case
      when (storage.foldername(name))[2] ~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then public.has_tenant_permission(
        ((storage.foldername(name))[2])::uuid,
        (select auth.uid()),
        'staff'::public.tenant_role
      )
      else false
    end
  );

create policy "P0 product images owner delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = 'uploads'
    and case
      when (storage.foldername(name))[2] ~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then public.has_tenant_permission(
        ((storage.foldername(name))[2])::uuid,
        (select auth.uid()),
        'owner'::public.tenant_role
      )
      else false
    end
  );

-- ---------------------------------------------------------------------------
-- 5. Remaining mutable search paths
-- ---------------------------------------------------------------------------

alter function public.update_storefront_settings_updated_at()
  set search_path = pg_catalog, public;
alter function public.update_ai_agent_tasks_updated_at()
  set search_path = pg_catalog, public;

notify pgrst, 'reload schema';

commit;
