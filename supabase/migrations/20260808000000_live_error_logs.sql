-- Migration: Create system_live_logs table for Live Error Logging
BEGIN;

CREATE TABLE IF NOT EXISTS public.system_live_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  error_name TEXT NOT NULL,
  error_type TEXT NOT NULL DEFAULT 'System', -- 'Admin UI', 'Storefront UI', 'Supabase DB', 'GitHub Integration', 'Server Function', 'Network/API'
  level TEXT NOT NULL DEFAULT 'error' CHECK (level IN ('error', 'warn', 'fatal', 'info')),
  location TEXT NOT NULL,
  cause TEXT NOT NULL,
  suggested_fix TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_live_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow reading live logs for authenticated users (admins / tenant members)
CREATE POLICY "authenticated_read_live_logs"
  ON public.system_live_logs
  FOR SELECT TO authenticated
  USING (true);

-- Policy: Allow inserting live logs for both anonymous (store visitors) and authenticated users
CREATE POLICY "anyone_insert_live_logs"
  ON public.system_live_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Policy: Allow updating log status for authenticated users (resolving/investigating)
CREATE POLICY "authenticated_update_live_logs"
  ON public.system_live_logs
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow deleting logs for authenticated admins
CREATE POLICY "authenticated_delete_live_logs"
  ON public.system_live_logs
  FOR DELETE TO authenticated
  USING (true);

-- Service Role full access
CREATE POLICY "service_role_system_live_logs"
  ON public.system_live_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_live_logs_created_at
  ON public.system_live_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_live_logs_type_status
  ON public.system_live_logs (error_type, status);

CREATE INDEX IF NOT EXISTS idx_system_live_logs_tenant
  ON public.system_live_logs (tenant_id)
  WHERE tenant_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
