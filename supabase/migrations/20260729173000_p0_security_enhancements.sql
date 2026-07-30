BEGIN;

-- 1. WhatsApp Integrations Table
CREATE TABLE IF NOT EXISTS public.whatsapp_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  phone_number_id TEXT NOT NULL,
  waba_id TEXT,
  display_phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT whatsapp_integrations_status_check
    CHECK (status IN ('active', 'disabled', 'error'))
);

CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_integrations_phone_number_id_uq 
  ON public.whatsapp_integrations(phone_number_id);

CREATE INDEX IF NOT EXISTS whatsapp_integrations_tenant_idx 
  ON public.whatsapp_integrations(tenant_id);

ALTER TABLE public.whatsapp_integrations ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON public.whatsapp_integrations FROM anon;

-- 2. Webhook Events Table (Service Gateway Only)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'received',
  attempts INTEGER NOT NULL DEFAULT 1,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  CONSTRAINT webhook_events_status_check
    CHECK (status IN ('received', 'processing', 'processed', 'failed', 'ignored'))
);

CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_provider_external_uq 
  ON public.webhook_events(provider, external_event_id);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.webhook_events FROM anon, authenticated;

-- 3. AI Agent Plans & Tasks Approval Metadata
ALTER TABLE public.ai_agent_plans 
  ADD COLUMN IF NOT EXISTS revision INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS plan_hash TEXT,
  ADD COLUMN IF NOT EXISTS approved_plan_hash TEXT,
  ADD COLUMN IF NOT EXISTS approved_revision INTEGER,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approval_source TEXT;

ALTER TABLE public.ai_agent_tasks
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.ai_agent_plans(id),
  ADD COLUMN IF NOT EXISTS plan_revision INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS approved_revision INTEGER,
  ADD COLUMN IF NOT EXISTS execution_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS execution_completed_at TIMESTAMPTZ;

-- 4. Atomic Execution Lock RPC (Service Role ONLY)
CREATE OR REPLACE FUNCTION public.acquire_ai_task_execution_lock(
  p_task_id TEXT,
  p_tenant_id UUID,
  p_revision INTEGER
)
RETURNS TABLE (
  acquired BOOLEAN,
  message TEXT,
  task_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task RECORD;
BEGIN
  SELECT * INTO v_task
  FROM public.ai_agent_tasks
  WHERE id = p_task_id
    AND tenant_id = p_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'TASK_NOT_FOUND'::text, NULL::jsonb;
    RETURN;
  END IF;

  IF v_task.status = 'executing' THEN
    RETURN QUERY SELECT false, 'EXECUTION_ALREADY_STARTED'::text, to_jsonb(v_task);
    RETURN;
  END IF;

  IF v_task.status <> 'approved' THEN
    RETURN QUERY SELECT false, 'TASK_NOT_APPROVED'::text, to_jsonb(v_task);
    RETURN;
  END IF;

  UPDATE public.ai_agent_tasks
  SET status = 'executing',
      execution_started_at = NOW(),
      updated_at = NOW()
  WHERE id = p_task_id
    AND tenant_id = p_tenant_id
    AND status = 'approved'
    AND (approved_revision = p_revision OR p_revision IS NULL)
  RETURNING * INTO v_task;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'PLAN_REVISION_MISMATCH'::text, NULL::jsonb;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'SUCCESS'::text, to_jsonb(v_task);
END;
$$;

REVOKE ALL ON FUNCTION public.acquire_ai_task_execution_lock(text, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_ai_task_execution_lock(text, uuid, integer) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
