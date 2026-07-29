-- Migration: Create runtime_incidents table for Production Incident Center
BEGIN;

CREATE TABLE IF NOT EXISTS public.runtime_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'error' CHECK (level IN ('error', 'warn', 'fatal', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  stack_trace TEXT,
  source TEXT NOT NULL DEFAULT 'server',
  context JSONB DEFAULT '{}'::jsonb,
  occurrences_count INT NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'ignored')),

  -- Deduplication constraint per tenant
  UNIQUE (tenant_id, fingerprint)
);

-- Enable RLS
ALTER TABLE public.runtime_incidents ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy for read operations
CREATE POLICY "tenant_members_read_runtime_incidents"
  ON public.runtime_incidents
  FOR SELECT TO authenticated
  USING (
    tenant_id IS NULL OR tenant_id IN (
      SELECT tm.tenant_id FROM public.tenant_members tm
      WHERE tm.user_id = auth.uid()
    )
  );

-- Service Role full access
CREATE POLICY "service_role_runtime_incidents"
  ON public.runtime_incidents
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_runtime_incidents_tenant_last_seen
  ON public.runtime_incidents (tenant_id, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_runtime_incidents_status
  ON public.runtime_incidents (status)
  WHERE status IN ('open', 'investigating');

NOTIFY pgrst, 'reload schema';

COMMIT;
