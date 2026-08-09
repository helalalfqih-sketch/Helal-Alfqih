-- ==========================================
-- AI Agent Execution Persistence Layer
-- Migration: 20260727000000_create_ai_execution_persistence.sql
-- ==========================================

-- 1. Create agent_execution_logs table
CREATE TABLE IF NOT EXISTS public.agent_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id TEXT,
    session_id TEXT,
    tenant_id TEXT DEFAULT 'default',
    action TEXT NOT NULL,
    tool TEXT,
    status TEXT NOT NULL,
    input JSONB DEFAULT '{}'::jsonb,
    output JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create agent_execution_events table
CREATE TABLE IF NOT EXISTS public.agent_execution_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id TEXT,
    session_id TEXT NOT NULL,
    tenant_id TEXT DEFAULT 'default',
    event_type TEXT DEFAULT 'STATE_CHANGE',
    state TEXT,
    message TEXT NOT NULL,
    progress INT DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Performance & Search Indexes
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_task ON public.agent_execution_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_tenant ON public.agent_execution_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_events_task ON public.agent_execution_events(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_events_session ON public.agent_execution_events(session_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.agent_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_execution_events ENABLE ROW LEVEL SECURITY;

-- 5. Role Grants (service_role, authenticated, anon, postgres)
GRANT ALL ON TABLE public.agent_execution_logs TO service_role, authenticated, anon, postgres;
GRANT ALL ON TABLE public.agent_execution_events TO service_role, authenticated, anon, postgres;

-- 6. Open RLS Policies for Admin Panel & Execution Controller
DROP POLICY IF EXISTS "admin read execution logs" ON public.agent_execution_logs;
DROP POLICY IF EXISTS "Allow full access to agent_execution_logs" ON public.agent_execution_logs;
CREATE POLICY "admin read execution logs"
    ON public.agent_execution_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "admin read execution events" ON public.agent_execution_events;
DROP POLICY IF EXISTS "Allow full access to agent_execution_events" ON public.agent_execution_events;
CREATE POLICY "admin read execution events"
    ON public.agent_execution_events
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 7. Force PostgREST to reload schema cache instantly (Fix PGRST205)
NOTIFY pgrst, 'reload schema';
