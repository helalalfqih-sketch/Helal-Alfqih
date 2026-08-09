-- =====================================================
-- Migration: ai_builder_foundation
-- Phase 1 AI Builder Foundation Schema
-- Adds ai_project_files & ai_code_changes with Multi-Tenant RLS
-- =====================================================

-- ─── 1. Project Intelligence Index Table ──────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_project_files (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL,
  session_id       UUID REFERENCES public.ai_agent_sessions(id) ON DELETE CASCADE,
  file_path        TEXT NOT NULL,
  file_name        TEXT NOT NULL,
  file_type        TEXT NOT NULL,
  content_hash     TEXT NOT NULL,
  content_summary  TEXT,
  dependencies     TEXT[] DEFAULT '{}',
  exports          TEXT[] DEFAULT '{}',
  imports          TEXT[] DEFAULT '{}',
  symbols          JSONB DEFAULT '[]'::jsonb,
  metadata         JSONB DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS ai_project_files_tenant_idx ON public.ai_project_files (tenant_id);
CREATE INDEX IF NOT EXISTS ai_project_files_session_idx ON public.ai_project_files (session_id);
CREATE INDEX IF NOT EXISTS ai_project_files_path_idx ON public.ai_project_files (file_path);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_project_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_project_files_updated_at_trigger ON public.ai_project_files;
CREATE TRIGGER ai_project_files_updated_at_trigger
  BEFORE UPDATE ON public.ai_project_files
  FOR EACH ROW EXECUTE FUNCTION update_ai_project_files_updated_at();

-- Multi-Tenant RLS Policy
ALTER TABLE public.ai_project_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_project_files_tenant_isolation ON public.ai_project_files;
CREATE POLICY ai_project_files_tenant_isolation
  ON public.ai_project_files
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  );

-- ─── 2. Code Changes & Git-like Patch Lifecycle Table ─────────────
CREATE TABLE IF NOT EXISTS public.ai_code_changes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID NOT NULL REFERENCES public.ai_agent_sessions(id) ON DELETE CASCADE,
  tenant_id        UUID NOT NULL,
  file_path        TEXT NOT NULL,
  operation        TEXT NOT NULL CHECK (operation IN ('create', 'modify', 'delete')),
  before_content   TEXT,
  after_content    TEXT,
  diff             TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'APPLIED', 'FAILED')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for change records
CREATE INDEX IF NOT EXISTS ai_code_changes_tenant_idx ON public.ai_code_changes (tenant_id);
CREATE INDEX IF NOT EXISTS ai_code_changes_session_idx ON public.ai_code_changes (session_id);
CREATE INDEX IF NOT EXISTS ai_code_changes_status_idx ON public.ai_code_changes (status);

-- Multi-Tenant RLS Policy
ALTER TABLE public.ai_code_changes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_code_changes_tenant_isolation ON public.ai_code_changes;
CREATE POLICY ai_code_changes_tenant_isolation
  ON public.ai_code_changes
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  );
