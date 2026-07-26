-- ========================================================
-- Migration: AI Execution History Table (Phase 7.2)
-- Enables full execution tracking, build results, rollback state & execution time.
-- ========================================================

CREATE TABLE IF NOT EXISTS public.ai_execution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  task_id TEXT NOT NULL,
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'rolled_back', 'running', 'testing')),
  files_changed TEXT[] DEFAULT '{}',
  typecheck_passed BOOLEAN DEFAULT false,
  build_passed BOOLEAN DEFAULT false,
  build_output TEXT,
  rollback_status TEXT DEFAULT 'none',
  error_message TEXT,
  execution_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for rapid multi-tenant filtering
CREATE INDEX IF NOT EXISTS idx_ai_execution_history_tenant ON public.ai_execution_history(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_execution_history_task ON public.ai_execution_history(task_id);

-- Enable RLS
ALTER TABLE public.ai_execution_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Tenant Isolation
CREATE POLICY tenant_isolation_ai_execution_history ON public.ai_execution_history
  FOR ALL USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id') OR tenant_id = 'default');
