-- ──────────────────────────────────────────────────────────────
-- Indexes AI Agent Execution Steps Table
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.agent_execution_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id TEXT NOT NULL,
    step_order INT NOT NULL DEFAULT 1,
    action TEXT NOT NULL,
    target_file TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'EXECUTING', 'COMPLETED', 'FAILED')),
    result JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_execution_steps_task_id ON public.agent_execution_steps (task_id);

ALTER TABLE public.agent_execution_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read agent_execution_steps"
    ON public.agent_execution_steps
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow service_role full agent_execution_steps"
    ON public.agent_execution_steps
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
