-- ============================================================
-- Indexes AI Engineering Agent — Database Schema
-- Phase 1: Sessions, Messages, Memory, Audit Logs, Usage
-- ============================================================

-- 1. ai_agent_sessions — lightweight session metadata
CREATE TABLE IF NOT EXISTS ai_agent_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'جلسة جديدة',
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','archived','completed')),
  
  -- Task tracking
  task_id text,
  task_status text DEFAULT 'idle'
    CHECK (task_status IN ('idle','planning','approved','running','testing','completed','failed')),
  task_plan jsonb,
  task_report jsonb,
  
  -- Analysis context
  affected_files jsonb DEFAULT '[]'::jsonb,
  risk_level text DEFAULT 'low'
    CHECK (risk_level IN ('low','medium','high','critical')),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_sessions_tenant ON ai_agent_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user ON ai_agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_status ON ai_agent_sessions(status);

-- 2. ai_agent_messages — normalized messages (NOT stored as JSONB blob)
CREATE TABLE IF NOT EXISTS ai_agent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES ai_agent_sessions(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_session ON ai_agent_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_tenant ON ai_agent_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created ON ai_agent_messages(created_at);

-- 3. ai_agent_memory — project memory, pgvector-ready
-- Column "embedding" is typed as vector(1536) when pgvector is enabled.
-- For now we use a nullable text column to store serialized embeddings
-- and will ALTER to vector(1536) once `CREATE EXTENSION vector` is run.
CREATE TABLE IF NOT EXISTS ai_agent_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'general',
  key text NOT NULL,
  value text NOT NULL,
  embedding text,  -- future: ALTER COLUMN embedding TYPE vector(1536) USING embedding::vector
  embedding_model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, category, key)
);

CREATE INDEX IF NOT EXISTS idx_ai_memory_tenant ON ai_agent_memory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_category ON ai_agent_memory(tenant_id, category);

-- 4. ai_agent_audit_logs — every AI operation recorded
CREATE TABLE IF NOT EXISTS ai_agent_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id uuid REFERENCES ai_agent_sessions(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_audit_tenant ON ai_agent_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_session ON ai_agent_audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_action ON ai_agent_audit_logs(action);

-- 5. ai_agent_usage — token and cost tracking per request
CREATE TABLE IF NOT EXISTS ai_agent_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id uuid REFERENCES ai_agent_sessions(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  model_name text NOT NULL DEFAULT 'gemini-2.5-flash',
  provider text NOT NULL DEFAULT 'vertex',
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  estimated_cost_usd numeric(10,6) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_tenant ON ai_agent_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_session ON ai_agent_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_agent_usage(created_at);

-- ============ RLS Policies ============

ALTER TABLE ai_agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_usage ENABLE ROW LEVEL SECURITY;

-- Sessions: tenant members can access
CREATE POLICY "ai_sessions_tenant_access" ON ai_agent_sessions FOR ALL
  USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM tenant_members WHERE tenant_id = ai_agent_sessions.tenant_id AND user_id = auth.uid())
  );

-- Messages: tenant members can access
CREATE POLICY "ai_messages_tenant_access" ON ai_agent_messages FOR ALL
  USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM tenant_members WHERE tenant_id = ai_agent_messages.tenant_id AND user_id = auth.uid())
  );

-- Memory: tenant members can access
CREATE POLICY "ai_memory_tenant_access" ON ai_agent_memory FOR ALL
  USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM tenant_members WHERE tenant_id = ai_agent_memory.tenant_id AND user_id = auth.uid())
  );

-- Audit logs: tenant members can read
CREATE POLICY "ai_audit_tenant_access" ON ai_agent_audit_logs FOR ALL
  USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM tenant_members WHERE tenant_id = ai_agent_audit_logs.tenant_id AND user_id = auth.uid())
  );

-- Usage: tenant members can read
CREATE POLICY "ai_usage_tenant_access" ON ai_agent_usage FOR ALL
  USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM tenant_members WHERE tenant_id = ai_agent_usage.tenant_id AND user_id = auth.uid())
  );
