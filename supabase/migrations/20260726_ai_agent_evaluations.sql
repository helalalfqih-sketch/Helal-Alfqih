-- ========================================================
-- Migration: AI Agent Evaluations Table (Phase 9)
-- Stores quality intelligence scores: Planning, Execution, Verification, Efficiency & Final Score.
-- ========================================================

CREATE TABLE IF NOT EXISTS public.ai_agent_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  task_id TEXT NOT NULL,
  planning_score INTEGER NOT NULL DEFAULT 100,
  execution_score INTEGER NOT NULL DEFAULT 100,
  verification_score INTEGER NOT NULL DEFAULT 100,
  efficiency_score INTEGER NOT NULL DEFAULT 100,
  final_score INTEGER NOT NULL DEFAULT 100,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for rapid multi-tenant performance analytics
CREATE INDEX IF NOT EXISTS idx_ai_agent_evaluations_tenant ON public.ai_agent_evaluations(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_agent_evaluations_task ON public.ai_agent_evaluations(task_id);

-- Enable RLS
ALTER TABLE public.ai_agent_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Multi-Tenant Isolation
CREATE POLICY tenant_isolation_ai_agent_evaluations ON public.ai_agent_evaluations
  FOR ALL USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id') OR tenant_id = 'default');
