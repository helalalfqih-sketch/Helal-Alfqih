-- =====================================================================
-- INDEXES AUTONOMOUS ENGINEERING CORE — MASTER DATABASE MIGRATION
-- Migration: 20260731_ai_agent_execution_complete.sql
-- Complete schema for AI Sessions, Tasks, Execution Logs, Steps, Events, Artifacts, and Tool Calls.
-- =====================================================================

-- 1. ai_agent_sessions
CREATE TABLE IF NOT EXISTS public.ai_agent_sessions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    title TEXT NOT NULL,
    task_status TEXT NOT NULL DEFAULT 'active',
    task_plan JSONB DEFAULT '[]'::jsonb,
    affected_files JSONB DEFAULT '[]'::jsonb,
    risk_level TEXT DEFAULT 'low',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ai_agent_tasks
CREATE TABLE IF NOT EXISTS public.ai_agent_tasks (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL DEFAULT 'default',
    tenant_id TEXT NOT NULL DEFAULT 'default',
    status TEXT NOT NULL DEFAULT 'waiting_approval',
    plan JSONB DEFAULT '[]'::jsonb,
    affected_files JSONB DEFAULT '[]'::jsonb,
    risk_level TEXT DEFAULT 'low',
    diffs JSONB DEFAULT '{}'::jsonb,
    build_success BOOLEAN DEFAULT false,
    build_output TEXT DEFAULT '',
    user_approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. agent_execution_logs (Audit Journal)
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

-- 4. agent_execution_steps (Step Dispatcher Tracker)
CREATE TABLE IF NOT EXISTS public.agent_execution_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id TEXT NOT NULL,
    step_order INT NOT NULL,
    action TEXT NOT NULL,
    target_file TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    result JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. agent_execution_events (Persistent Event Stream)
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

-- 6. agent_execution_artifacts (Code Proposals & Diffs)
CREATE TABLE IF NOT EXISTS public.agent_execution_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    tenant_id TEXT DEFAULT 'default',
    artifact_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    content TEXT NOT NULL,
    diff TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. agent_tool_calls (Full Tool Registry Call Trace)
CREATE TABLE IF NOT EXISTS public.agent_tool_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    task_id TEXT,
    tool_category TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    arguments JSONB DEFAULT '{}'::jsonb,
    result JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'SUCCESS',
    execution_time_ms INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_ai_agent_sessions_tenant ON public.ai_agent_sessions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_agent_tasks_session ON public.ai_agent_tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_tasks_tenant ON public.ai_agent_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_task ON public.agent_execution_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_tenant ON public.agent_execution_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_steps_task ON public.agent_execution_steps(task_id, step_order);
CREATE INDEX IF NOT EXISTS idx_agent_execution_events_session ON public.agent_execution_events(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_artifacts_task ON public.agent_execution_artifacts(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_tool_calls_session ON public.agent_tool_calls(session_id);

-- 9. Enable Row Level Security
ALTER TABLE public.ai_agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_execution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_execution_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_execution_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tool_calls ENABLE ROW LEVEL SECURITY;

-- 10. Role Grants (Full operational permissions)
GRANT ALL ON TABLE public.ai_agent_sessions TO service_role, authenticated, anon, postgres;
GRANT ALL ON TABLE public.ai_agent_tasks TO service_role, authenticated, anon, postgres;
GRANT ALL ON TABLE public.agent_execution_logs TO service_role, authenticated, anon, postgres;
GRANT ALL ON TABLE public.agent_execution_steps TO service_role, authenticated, anon, postgres;
GRANT ALL ON TABLE public.agent_execution_events TO service_role, authenticated, anon, postgres;
GRANT ALL ON TABLE public.agent_execution_artifacts TO service_role, authenticated, anon, postgres;
GRANT ALL ON TABLE public.agent_tool_calls TO service_role, authenticated, anon, postgres;

-- 11. Open RLS Policies
DROP POLICY IF EXISTS "Allow all access to ai_agent_sessions" ON public.ai_agent_sessions;
CREATE POLICY "Allow all access to ai_agent_sessions" ON public.ai_agent_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to ai_agent_tasks" ON public.ai_agent_tasks;
CREATE POLICY "Allow all access to ai_agent_tasks" ON public.ai_agent_tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to agent_execution_logs" ON public.agent_execution_logs;
CREATE POLICY "Allow all access to agent_execution_logs" ON public.agent_execution_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to agent_execution_steps" ON public.agent_execution_steps;
CREATE POLICY "Allow all access to agent_execution_steps" ON public.agent_execution_steps FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to agent_execution_events" ON public.agent_execution_events;
CREATE POLICY "Allow all access to agent_execution_events" ON public.agent_execution_events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to agent_execution_artifacts" ON public.agent_execution_artifacts;
CREATE POLICY "Allow all access to agent_execution_artifacts" ON public.agent_execution_artifacts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to agent_tool_calls" ON public.agent_tool_calls;
CREATE POLICY "Allow all access to agent_tool_calls" ON public.agent_tool_calls FOR ALL USING (true) WITH CHECK (true);

-- 12. Instant PostgREST Schema Cache Reload
NOTIFY pgrst, 'reload schema';
