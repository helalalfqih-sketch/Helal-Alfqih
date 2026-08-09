-- Post-deployment verification for:
--   20260731000001_residual_security_hardening.sql
--
-- This script is read-only. Every dangerous_count result must be 0.
-- Supabase Auth leaked-password protection must also be enabled separately in
-- Dashboard > Authentication > Settings, then confirmed in Security Advisor.

-- 1. Required schema compatibility
select
  to_regclass('public.agent_execution_logs') is not null
    as agent_execution_logs_exists,
  to_regclass('public.agent_execution_events') is not null
    as agent_execution_events_exists,
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'media_files'
      and column_name = 'thumbnail_url'
  ) as thumbnail_url_exists;

-- 2. No always-true write policies on residual-hardening targets
select count(*) as dangerous_count
from pg_policies
where (
    schemaname = 'public'
    and tablename in (
      'cms_pages',
      'cms_page_versions',
      'tenant_audit_logs'
    )
  )
  and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  and (
    coalesce(trim(qual), '') in ('true', '(true)')
    or coalesce(trim(with_check), '') in ('true', '(true)')
  );

-- 3. No broad public listing/writing policy on product-images
select count(*) as dangerous_count
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and 'public' = any(roles)
  and (
    qual ilike '%product-images%'
    or with_check ilike '%product-images%'
  );

-- 4. No SECURITY DEFINER function in public executable by anon/authenticated
select count(*) as dangerous_count
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
  and (
    has_function_privilege('anon', p.oid, 'EXECUTE')
    or has_function_privilege('authenticated', p.oid, 'EXECUTE')
  );

-- 5. The two previously reported functions have a fixed search_path
select count(*) as dangerous_count
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'update_storefront_settings_updated_at',
    'update_ai_agent_tasks_updated_at'
  )
  and not exists (
    select 1
    from unnest(coalesce(p.proconfig, array[]::text[])) as setting
    where setting like 'search_path=%'
  );

-- 6. Confirm expected policies and grants
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where (
    schemaname = 'public'
    and tablename in (
      'cms_pages',
      'cms_page_versions',
      'tenant_audit_logs',
      'tenant_members',
      'user_roles'
    )
  )
  or (
    schemaname = 'storage'
    and tablename = 'objects'
    and policyname like 'P0 product images%'
  )
order by schemaname, tablename, policyname;

-- 7. Re-run Supabase Security Advisor after this SQL.
-- Expected database-linter result: no WARN findings covered by this migration.
-- The Auth leaked-password warning only clears after enabling the Auth setting.
