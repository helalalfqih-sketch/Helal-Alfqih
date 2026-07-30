-- Migration: Create webhook_events table for atomic idempotency
-- P0 Security: Replace media_files-based idempotency check with proper atomic webhook event tracking

BEGIN;

-- 1. Create webhook_events table
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('whatsapp', 'stripe', 'meta', 'other')),
  external_event_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processing', 'processed', 'failed', 'ignored')),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Atomic idempotency: unique constraint prevents duplicate processing
  UNIQUE (provider, external_event_id, tenant_id)
);

-- 2. Enable RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- 3. No browser access — webhook_events is service_role only
REVOKE ALL ON public.webhook_events FROM PUBLIC;
REVOKE ALL ON public.webhook_events FROM anon;
REVOKE ALL ON public.webhook_events FROM authenticated;

-- 4. Service Role full access (webhook processing gateway)
CREATE POLICY "service_role_full_access"
  ON public.webhook_events
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Authenticated admin read-only (for diagnostics dashboard)
CREATE POLICY "admin_read_webhook_events"
  ON public.webhook_events
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT tm.tenant_id FROM public.tenant_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'manager')
    )
  );

-- 6. Performance indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_tenant_provider
  ON public.webhook_events (tenant_id, provider);

CREATE INDEX IF NOT EXISTS idx_webhook_events_status
  ON public.webhook_events (status)
  WHERE status IN ('received', 'processing', 'failed');

-- 7. Updated_at trigger
CREATE OR REPLACE FUNCTION public.webhook_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_events_updated_at_trigger ON public.webhook_events;
CREATE TRIGGER webhook_events_updated_at_trigger
  BEFORE UPDATE ON public.webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION public.webhook_events_updated_at();

-- 8. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

COMMIT;
