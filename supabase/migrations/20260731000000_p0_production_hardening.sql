-- Indexes Store — production P0 hardening
-- Target Supabase project: wtudcippyxbaobqzbmok
-- Generated from a read-only inspection of the live schema on 2026-07-31.
--
-- IMPORTANT
-- 1. Run the companion preflight/verification file before and after this file.
-- 2. Run in Supabase SQL Editor as the postgres owner.
-- 3. This migration intentionally does not copy Supabase migration-history rows.
-- 4. Direct client writes to orders and AI execution tables are closed.
-- 5. Server Functions that mutate these tables must use the server-only
--    service_role/secret key. Never expose that key to the browser.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

-- ---------------------------------------------------------------------------
-- 0. Preconditions: stop instead of partially applying to an unexpected schema
-- ---------------------------------------------------------------------------
do $preflight$
declare
  missing_tables text[];
begin
  select array_agg(required_table)
    into missing_tables
  from (
    values
      ('public.orders'::text),
      ('public.order_items'),
      ('public.order_status_history'),
      ('public.media_files'),
      ('public.ai_provider_configs'),
      ('public.ai_agent_plans'),
      ('public.ai_agent_sessions'),
      ('public.tenant_members'),
      ('public.user_roles')
  ) as required(required_table)
  where to_regclass(required_table) is null;

  if missing_tables is not null then
    raise exception 'P0 migration aborted; required tables are missing: %',
      array_to_string(missing_tables, ', ');
  end if;
end
$preflight$;

-- ---------------------------------------------------------------------------
-- 1. Schema compatibility: execution journal + media thumbnail
-- ---------------------------------------------------------------------------
create table if not exists public.agent_execution_logs (
  id uuid primary key default gen_random_uuid(),
  task_id text,
  session_id text,
  tenant_id text default 'default',
  action text not null,
  tool text,
  status text not null,
  input jsonb default '{}'::jsonb,
  output jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.agent_execution_events (
  id uuid primary key default gen_random_uuid(),
  task_id text,
  session_id text not null,
  tenant_id text default 'default',
  event_type text default 'STATE_CHANGE',
  state text,
  message text not null,
  progress integer default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.media_files
  add column if not exists thumbnail_url text;

comment on column public.media_files.thumbnail_url is
  'Optional public or signed thumbnail URL; added by P0 compatibility migration.';

create index if not exists idx_agent_execution_logs_session_created
  on public.agent_execution_logs (session_id, created_at desc);

create index if not exists idx_agent_execution_logs_task_created
  on public.agent_execution_logs (task_id, created_at desc);

create index if not exists idx_agent_execution_events_session_created
  on public.agent_execution_events (session_id, created_at desc);

create index if not exists idx_agent_execution_events_task_created
  on public.agent_execution_events (task_id, created_at desc);

alter table public.agent_execution_logs enable row level security;
alter table public.agent_execution_events enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Orders: no direct Data API access. All access goes through reviewed
--    server functions using service_role. This also closes the live PII reads.
-- ---------------------------------------------------------------------------
drop policy if exists "Public can insert orders" on public.orders;
drop policy if exists "Public can view orders" on public.orders;

drop policy if exists "Public can insert order items" on public.order_items;
drop policy if exists "Anyone can insert order items" on public.order_items;
drop policy if exists "Public can view order items" on public.order_items;

drop policy if exists "Public can insert order status history"
  on public.order_status_history;
drop policy if exists "Public can view order status history"
  on public.order_status_history;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

revoke all on table public.orders from anon, authenticated;
revoke all on table public.order_items from anon, authenticated;
revoke all on table public.order_status_history from anon, authenticated;

grant all on table public.orders to service_role;
grant all on table public.order_items to service_role;
grant all on table public.order_status_history to service_role;

-- ---------------------------------------------------------------------------
-- 3. Media: keep public read compatibility, but make writes tenant-scoped.
-- ---------------------------------------------------------------------------
drop policy if exists "Allow public insert media files" on public.media_files;
drop policy if exists "Allow authenticated manage media files"
  on public.media_files;
drop policy if exists "P0 media staff insert" on public.media_files;
drop policy if exists "P0 media staff update" on public.media_files;
drop policy if exists "P0 media owner delete" on public.media_files;

alter table public.media_files enable row level security;

revoke insert, update, delete, truncate, references, trigger
  on table public.media_files from anon;
revoke truncate, references, trigger
  on table public.media_files from authenticated;

grant select on table public.media_files to anon, authenticated;
grant insert, update, delete on table public.media_files to authenticated;
grant all on table public.media_files to service_role;

create policy "P0 media staff insert"
  on public.media_files
  for insert
  to authenticated
  with check (
    (select auth.uid()) is not null
    and public.has_tenant_permission(
      tenant_id,
      (select auth.uid()),
      'staff'::public.tenant_role
    )
  );

create policy "P0 media staff update"
  on public.media_files
  for update
  to authenticated
  using (
    (select auth.uid()) is not null
    and public.has_tenant_permission(
      tenant_id,
      (select auth.uid()),
      'staff'::public.tenant_role
    )
  )
  with check (
    (select auth.uid()) is not null
    and public.has_tenant_permission(
      tenant_id,
      (select auth.uid()),
      'staff'::public.tenant_role
    )
  );

create policy "P0 media owner delete"
  on public.media_files
  for delete
  to authenticated
  using (
    (select auth.uid()) is not null
    and public.has_tenant_permission(
      tenant_id,
      (select auth.uid()),
      'owner'::public.tenant_role
    )
  );

-- ---------------------------------------------------------------------------
-- 4. AI provider secrets: service role only.
--    The live table contains api_key text, so no direct authenticated SELECT.
-- ---------------------------------------------------------------------------
drop policy if exists "ai_provider_configs_authenticated_all"
  on public.ai_provider_configs;
drop policy if exists "ai_provider_configs_read_all"
  on public.ai_provider_configs;
drop policy if exists "ai_provider_configs_write_authenticated"
  on public.ai_provider_configs;
drop policy if exists "ai_provider_configs_read_tenant_or_admin"
  on public.ai_provider_configs;
drop policy if exists "ai_provider_configs_write_tenant_or_admin"
  on public.ai_provider_configs;

alter table public.ai_provider_configs enable row level security;

revoke all on table public.ai_provider_configs from anon, authenticated;
grant all on table public.ai_provider_configs to service_role;

comment on column public.ai_provider_configs.api_key is
  'LEGACY SENSITIVE FIELD: service-role only. Move secrets to server environment or a secrets manager.';

-- ---------------------------------------------------------------------------
-- 5. AI plans and execution journal:
--    - users may read plans/logs/events for sessions they own
--    - all writes are service-role only
-- ---------------------------------------------------------------------------
drop policy if exists "Allow all access to ai_agent_plans"
  on public.ai_agent_plans;
drop policy if exists "Admins and tenant owners can access ai_agent_plans"
  on public.ai_agent_plans;
drop policy if exists "P0 own-session plans read"
  on public.ai_agent_plans;

drop policy if exists "admin read execution logs"
  on public.agent_execution_logs;
drop policy if exists "Allow all access to agent_execution_logs"
  on public.agent_execution_logs;
drop policy if exists "Allow all full access to agent_execution_logs"
  on public.agent_execution_logs;
drop policy if exists "P0 own-session execution logs read"
  on public.agent_execution_logs;

drop policy if exists "admin read execution events"
  on public.agent_execution_events;
drop policy if exists "Allow all access to agent_execution_events"
  on public.agent_execution_events;
drop policy if exists "Allow all full access to agent_execution_events"
  on public.agent_execution_events;
drop policy if exists "P0 own-session execution events read"
  on public.agent_execution_events;

alter table public.ai_agent_plans enable row level security;
alter table public.agent_execution_logs enable row level security;
alter table public.agent_execution_events enable row level security;

revoke all on table public.ai_agent_plans from anon, authenticated;
revoke all on table public.agent_execution_logs from anon, authenticated;
revoke all on table public.agent_execution_events from anon, authenticated;

grant select on table public.ai_agent_plans to authenticated;
grant select on table public.agent_execution_logs to authenticated;
grant select on table public.agent_execution_events to authenticated;

grant all on table public.ai_agent_plans to service_role;
grant all on table public.agent_execution_logs to service_role;
grant all on table public.agent_execution_events to service_role;

create policy "P0 own-session plans read"
  on public.ai_agent_plans
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.ai_agent_sessions as s
      where s.id::text = ai_agent_plans.session_id
        and s.user_id = (select auth.uid())
    )
    or public.has_role((select auth.uid()), 'admin'::public.app_role)
  );

create policy "P0 own-session execution logs read"
  on public.agent_execution_logs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.ai_agent_sessions as s
      where s.id::text = agent_execution_logs.session_id
        and s.user_id = (select auth.uid())
    )
    or public.has_role((select auth.uid()), 'admin'::public.app_role)
  );

create policy "P0 own-session execution events read"
  on public.agent_execution_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.ai_agent_sessions as s
      where s.id::text = agent_execution_events.session_id
        and s.user_id = (select auth.uid())
    )
    or public.has_role((select auth.uid()), 'admin'::public.app_role)
  );

-- ---------------------------------------------------------------------------
-- 6. SECURITY DEFINER hardening
-- ---------------------------------------------------------------------------

-- Trigger-only functions do not need Data API EXECUTE privileges.
revoke all on function public.apply_inventory_movement() from public, anon, authenticated;
revoke all on function public.attach_tenant_owner() from public, anon, authenticated;
grant execute on function public.apply_inventory_movement() to service_role;
grant execute on function public.attach_tenant_owner() to service_role;

alter function public.apply_inventory_movement()
  set search_path = pg_catalog, public;
alter function public.attach_tenant_owner()
  set search_path = pg_catalog, public;

-- Authorization helpers: only answer questions about the caller.
create or replace function public.has_role(
  _user_id uuid,
  _role public.app_role
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select
    _user_id is not null
    and (select auth.uid()) is not null
    and _user_id = (select auth.uid())
    and exists (
      select 1
      from public.user_roles as ur
      where ur.user_id = _user_id
        and ur.role = _role
    );
$function$;

revoke all on function public.has_role(uuid, public.app_role)
  from public, anon, authenticated;
-- anon is retained only because public catalog policies call has_role(auth.uid()).
-- The function returns false when auth.uid() is null and cannot inspect another user.
grant execute on function public.has_role(uuid, public.app_role)
  to anon, authenticated, service_role;

create or replace function public.is_tenant_member(
  _tenant_id uuid,
  _user_id uuid
)
returns boolean
language sql
stable
security definer
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
security definer
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
security definer
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
security definer
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

revoke all on function public.is_tenant_member(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.has_tenant_role(uuid, uuid, public.tenant_role)
  from public, anon, authenticated;
revoke all on function public.has_tenant_permission(uuid, uuid, public.tenant_role)
  from public, anon, authenticated;
revoke all on function public.can_manage_tenant(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.is_tenant_member(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.has_tenant_role(uuid, uuid, public.tenant_role)
  to authenticated, service_role;
grant execute on function public.has_tenant_permission(uuid, uuid, public.tenant_role)
  to authenticated, service_role;
grant execute on function public.can_manage_tenant(uuid, uuid)
  to authenticated, service_role;

-- Mutating/privileged RPCs.
revoke all on function public.create_notification(
  uuid, uuid, public.notification_type, text, text, jsonb, text, text
) from public, anon, authenticated;
grant execute on function public.create_notification(
  uuid, uuid, public.notification_type, text, text, jsonb, text, text
) to service_role;
alter function public.create_notification(
  uuid, uuid, public.notification_type, text, text, jsonb, text, text
) set search_path = pg_catalog, public;

revoke all on function public.record_sale(
  uuid, uuid, uuid, integer, numeric, numeric, uuid
) from public, anon, authenticated;
grant execute on function public.record_sale(
  uuid, uuid, uuid, integer, numeric, numeric, uuid
) to service_role;
alter function public.record_sale(
  uuid, uuid, uuid, integer, numeric, numeric, uuid
) set search_path = pg_catalog, public;

revoke all on function public.get_best_sellers(uuid, integer, integer)
  from public, anon, authenticated;
grant execute on function public.get_best_sellers(uuid, integer, integer)
  to service_role;
alter function public.get_best_sellers(uuid, integer, integer)
  set search_path = pg_catalog, public;

revoke all on function public.update_order_branch(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.update_order_branch(uuid, uuid)
  to authenticated, service_role;
alter function public.update_order_branch(uuid, uuid)
  set search_path = pg_catalog, public;

revoke all on function public.increment_review_helpful(uuid)
  from public, anon, authenticated;
grant execute on function public.increment_review_helpful(uuid)
  to authenticated, service_role;
alter function public.increment_review_helpful(uuid)
  set search_path = pg_catalog, public;

-- ---------------------------------------------------------------------------
-- 7. Finish
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';

commit;
