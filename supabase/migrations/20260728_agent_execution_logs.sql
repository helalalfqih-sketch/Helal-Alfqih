-- ──────────────────────────────────────────────────────────────
-- Indexes AI Agent Execution Journal (Production Audit Log)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.agent_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id TEXT,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    action TEXT NOT NULL,
    tool TEXT,
    input JSONB DEFAULT '{}'::jsonb,
    output JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast tenant & task queries
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_task_id ON public.agent_execution_logs (task_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_tenant_id ON public.agent_execution_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_created_at ON public.agent_execution_logs (created_at DESC);

-- Enable RLS
ALTER TABLE public.agent_execution_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view execution logs
CREATE POLICY "Allow authenticated read agent_execution_logs"
    ON public.agent_execution_logs
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow service_role to manage agent_execution_logs
CREATE POLICY "Allow service_role full agent_execution_logs"
    ON public.agent_execution_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
