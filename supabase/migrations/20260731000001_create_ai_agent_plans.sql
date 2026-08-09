-- =====================================================================
-- AI AGENT ARCHITECTURAL PLANS LAYER
-- Migration: 20260731000001_create_ai_agent_plans.sql
-- Stores detailed architectural engineering plans before execution
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.ai_agent_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    tenant_id TEXT DEFAULT 'default',
    objective TEXT NOT NULL,
    affected_files JSONB DEFAULT '[]'::jsonb,
    affected_tables JSONB DEFAULT '[]'::jsonb,
    implementation_steps JSONB DEFAULT '[]'::jsonb,
    risks JSONB DEFAULT '[]'::jsonb,
    validation_commands JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'PLAN_CREATED',
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_agent_plans_session ON public.ai_agent_plans(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_plans_tenant ON public.ai_agent_plans(tenant_id);

ALTER TABLE public.ai_agent_plans ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.ai_agent_plans TO service_role, authenticated, anon, postgres;

DROP POLICY IF EXISTS "Allow all access to ai_agent_plans" ON public.ai_agent_plans;
CREATE POLICY "Allow all access to ai_agent_plans"
    ON public.ai_agent_plans
    FOR ALL
    USING (true)
    WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
