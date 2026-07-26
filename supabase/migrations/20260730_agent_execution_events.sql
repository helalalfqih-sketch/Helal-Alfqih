-- ──────────────────────────────────────────────────────────────
-- Indexes AI Agent Persistent Execution Events Table
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.agent_execution_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    task_id TEXT,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    event_type TEXT NOT NULL, -- STATE_CHANGE, TOOL_CALL, PROGRESS, ERROR, COMPLETION
    state TEXT,
    message TEXT NOT NULL,
    progress INT DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_exec_events_session ON public.agent_execution_events (session_id);
CREATE INDEX IF NOT EXISTS idx_agent_exec_events_task ON public.agent_execution_events (task_id);
CREATE INDEX IF NOT EXISTS idx_agent_exec_events_tenant ON public.agent_execution_events (tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_exec_events_created ON public.agent_execution_events (created_at ASC);

ALTER TABLE public.agent_execution_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read agent_execution_events"
    ON public.agent_execution_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow service_role full agent_execution_events"
    ON public.agent_execution_events FOR ALL TO service_role USING (true) WITH CHECK (true);
