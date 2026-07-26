-- =====================================================
-- Migration: Fix RLS Policies for AI Agent Tables
-- Full operational access for authenticated & service_role
-- =====================================================

-- 1. public.ai_agent_tasks
ALTER TABLE public.ai_agent_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_agent_tasks_tenant_isolation ON public.ai_agent_tasks;
DROP POLICY IF EXISTS "Allow authenticated full access to ai_agent_tasks" ON public.ai_agent_tasks;
DROP POLICY IF EXISTS "Allow service_role full access to ai_agent_tasks" ON public.ai_agent_tasks;

CREATE POLICY "Allow authenticated full access to ai_agent_tasks"
  ON public.ai_agent_tasks
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service_role full access to ai_agent_tasks"
  ON public.ai_agent_tasks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. public.ai_agent_sessions
ALTER TABLE public.ai_agent_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_agent_sessions_tenant_isolation ON public.ai_agent_sessions;
DROP POLICY IF EXISTS "Allow authenticated full access to ai_agent_sessions" ON public.ai_agent_sessions;
DROP POLICY IF EXISTS "Allow service_role full access to ai_agent_sessions" ON public.ai_agent_sessions;

CREATE POLICY "Allow authenticated full access to ai_agent_sessions"
  ON public.ai_agent_sessions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service_role full access to ai_agent_sessions"
  ON public.ai_agent_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. public.agent_execution_logs
ALTER TABLE public.agent_execution_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access to agent_execution_logs" ON public.agent_execution_logs;
DROP POLICY IF EXISTS "Allow service_role full access to agent_execution_logs" ON public.agent_execution_logs;

CREATE POLICY "Allow authenticated full access to agent_execution_logs"
  ON public.agent_execution_logs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service_role full access to agent_execution_logs"
  ON public.agent_execution_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. public.agent_execution_steps
ALTER TABLE public.agent_execution_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access to agent_execution_steps" ON public.agent_execution_steps;
DROP POLICY IF EXISTS "Allow service_role full access to agent_execution_steps" ON public.agent_execution_steps;

CREATE POLICY "Allow authenticated full access to agent_execution_steps"
  ON public.agent_execution_steps
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service_role full access to agent_execution_steps"
  ON public.agent_execution_steps
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. public.agent_execution_events
ALTER TABLE public.agent_execution_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access to agent_execution_events" ON public.agent_execution_events;
DROP POLICY IF EXISTS "Allow service_role full access to agent_execution_events" ON public.agent_execution_events;

CREATE POLICY "Allow authenticated full access to agent_execution_events"
  ON public.agent_execution_events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service_role full access to agent_execution_events"
  ON public.agent_execution_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Explicit PostgreSQL Table Role Grants
GRANT ALL ON TABLE public.ai_agent_tasks TO authenticated, service_role, postgres;
GRANT ALL ON TABLE public.ai_agent_sessions TO authenticated, service_role, postgres;
GRANT ALL ON TABLE public.agent_execution_logs TO authenticated, service_role, postgres;
GRANT ALL ON TABLE public.agent_execution_steps TO authenticated, service_role, postgres;
GRANT ALL ON TABLE public.agent_execution_events TO authenticated, service_role, postgres;
