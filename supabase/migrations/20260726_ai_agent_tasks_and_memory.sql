-- =====================================================
-- Migration: ai_agent_tasks
-- Planning + Approval Engine — Task Tracking Table
-- =====================================================
-- Tracks every Agent task: plan, approval, execution, result.
-- Enforces Multi-Tenant isolation via RLS.

CREATE TABLE IF NOT EXISTS public.ai_agent_tasks (
  id            TEXT PRIMARY KEY,              -- e.g. TASK-020
  session_id    UUID NOT NULL REFERENCES public.ai_agent_sessions(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL,
  user_id       UUID,

  -- Status lifecycle
  status        TEXT NOT NULL DEFAULT 'analyzing'
                  CHECK (status IN (
                    'analyzing', 'planning', 'waiting_approval',
                    'executing', 'testing', 'completed', 'failed', 'cancelled'
                  )),

  -- The AI-generated plan (array of steps)
  plan          JSONB DEFAULT '[]'::jsonb,

  -- Files that will be changed
  affected_files TEXT[] DEFAULT '{}',

  -- Risk assessment
  risk_level    TEXT NOT NULL DEFAULT 'low'
                  CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),

  -- User interaction
  user_approved_at  TIMESTAMPTZ,
  user_rejected_at  TIMESTAMPTZ,
  rejection_reason  TEXT,

  -- Execution diffs (keyed by step index)
  diffs         JSONB DEFAULT '{}'::jsonb,

  -- Build / typecheck output
  build_output  TEXT,
  build_success BOOLEAN,

  -- Final report
  result        JSONB DEFAULT '{}'::jsonb,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS ai_agent_tasks_session_idx  ON public.ai_agent_tasks (session_id);
CREATE INDEX IF NOT EXISTS ai_agent_tasks_tenant_idx   ON public.ai_agent_tasks (tenant_id);
CREATE INDEX IF NOT EXISTS ai_agent_tasks_status_idx   ON public.ai_agent_tasks (status);

-- ─── Auto-update updated_at ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_ai_agent_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_agent_tasks_updated_at_trigger ON public.ai_agent_tasks;
CREATE TRIGGER ai_agent_tasks_updated_at_trigger
  BEFORE UPDATE ON public.ai_agent_tasks
  FOR EACH ROW EXECUTE FUNCTION update_ai_agent_tasks_updated_at();

-- ─── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.ai_agent_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_agent_tasks_tenant_isolation ON public.ai_agent_tasks;
CREATE POLICY ai_agent_tasks_tenant_isolation
  ON public.ai_agent_tasks
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_roles
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.user_roles
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- Migration: ai_task_memory
-- Long-Term Task Memory — Problems & Solutions
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_task_memory (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL,

  -- Link to task (optional)
  task_id       TEXT REFERENCES public.ai_agent_tasks(id) ON DELETE SET NULL,

  -- Problem/Solution pair
  problem       TEXT NOT NULL,
  solution      TEXT NOT NULL,
  category      TEXT DEFAULT 'general'
                  CHECK (category IN (
                    'general', 'bug_fix', 'performance', 'architecture',
                    'security', 'ui', 'database', 'ai_provider'
                  )),

  -- Git reference (if applicable)
  commit_hash   TEXT,
  affected_files TEXT[] DEFAULT '{}',

  -- Tags for search
  tags          TEXT[] DEFAULT '{}',

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS ai_task_memory_tenant_idx   ON public.ai_task_memory (tenant_id);
CREATE INDEX IF NOT EXISTS ai_task_memory_category_idx ON public.ai_task_memory (category);
CREATE INDEX IF NOT EXISTS ai_task_memory_tags_idx     ON public.ai_task_memory USING GIN (tags);

-- ─── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.ai_task_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_task_memory_tenant_isolation ON public.ai_task_memory;
CREATE POLICY ai_task_memory_tenant_isolation
  ON public.ai_task_memory
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_roles
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.user_roles
      WHERE user_id = auth.uid()
    )
  );
