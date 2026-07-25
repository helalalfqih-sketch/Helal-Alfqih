-- ============================================================
-- Indexes Store — AI Provider Management & Agent Schema
-- Migration: 20260726010000_ai_provider_management.sql
-- Description: Creates ai_provider_configs table and ensures all AI Agent tables exist in production.
-- ============================================================

-- 1. ai_provider_configs — Dynamic AI Provider Management (SaaS Multi-Tenant & Global)
CREATE TABLE IF NOT EXISTS ai_provider_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('gemini', 'lovable', 'openai', 'openrouter', 'vertex')),
  api_key text,
  model text NOT NULL,
  enabled boolean DEFAULT true,
  priority integer DEFAULT 100,
  base_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_provider_tenant_unique 
  ON ai_provider_configs (COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), provider);

CREATE INDEX IF NOT EXISTS idx_ai_provider_priority ON ai_provider_configs (priority ASC, enabled);
CREATE INDEX IF NOT EXISTS idx_ai_provider_tenant ON ai_provider_configs (tenant_id);

-- 2. ai_agent_sessions — lightweight session metadata
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

-- 3. ai_agent_messages — normalized messages
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

-- 4. ai_agent_memory — project memory
CREATE TABLE IF NOT EXISTS ai_agent_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'general',
  key text NOT NULL,
  value text NOT NULL,
  embedding text,
  embedding_model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, category, key)
);

CREATE INDEX IF NOT EXISTS idx_ai_memory_tenant ON ai_agent_memory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_category ON ai_agent_memory(tenant_id, category);

-- 5. ai_agent_audit_logs — every AI operation recorded
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

-- 6. ai_agent_usage — token and cost tracking
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

ALTER TABLE ai_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_usage ENABLE ROW LEVEL SECURITY;

-- Provider Configs: authenticated users (admins) can read and manage provider configs
DROP POLICY IF EXISTS "ai_provider_configs_access" ON ai_provider_configs;
DROP POLICY IF EXISTS "ai_provider_configs_authenticated_all" ON ai_provider_configs;
CREATE POLICY "ai_provider_configs_authenticated_all" ON ai_provider_configs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Sessions: user can only access their own sessions
DROP POLICY IF EXISTS "ai_sessions_tenant_access" ON ai_agent_sessions;
DROP POLICY IF EXISTS "ai_sessions_user_access" ON ai_agent_sessions;
CREATE POLICY "ai_sessions_user_access" ON ai_agent_sessions FOR ALL
  USING (user_id = auth.uid());

-- Messages: user can only access messages in their own sessions
DROP POLICY IF EXISTS "ai_messages_tenant_access" ON ai_agent_messages;
DROP POLICY IF EXISTS "ai_messages_user_access" ON ai_agent_messages;
CREATE POLICY "ai_messages_user_access" ON ai_agent_messages FOR ALL
  USING (session_id IN (SELECT id FROM ai_agent_sessions WHERE user_id = auth.uid()));

-- Memory: tenant members access
DROP POLICY IF EXISTS "ai_memory_tenant_access" ON ai_agent_memory;
CREATE POLICY "ai_memory_tenant_access" ON ai_agent_memory FOR ALL
  USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM tenant_members WHERE tenant_id = ai_agent_memory.tenant_id AND user_id = auth.uid())
  );

-- Audit logs: tenant members read OR action creator
DROP POLICY IF EXISTS "ai_audit_tenant_access" ON ai_agent_audit_logs;
CREATE POLICY "ai_audit_tenant_access" ON ai_agent_audit_logs FOR ALL
  USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM tenant_members WHERE tenant_id = ai_agent_audit_logs.tenant_id AND user_id = auth.uid())
    OR user_id = auth.uid()
  );

-- Usage: tenant members read OR usage creator
DROP POLICY IF EXISTS "ai_usage_tenant_access" ON ai_agent_usage;
CREATE POLICY "ai_usage_tenant_access" ON ai_agent_usage FOR ALL
  USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM tenant_members WHERE tenant_id = ai_agent_usage.tenant_id AND user_id = auth.uid())
    OR user_id = auth.uid()
  );

-- ============ Role Permissions ============
GRANT ALL ON TABLE ai_provider_configs TO authenticated;
GRANT ALL ON TABLE ai_provider_configs TO service_role;

GRANT ALL ON TABLE ai_agent_sessions TO authenticated;
GRANT ALL ON TABLE ai_agent_sessions TO service_role;

GRANT ALL ON TABLE ai_agent_messages TO authenticated;
GRANT ALL ON TABLE ai_agent_messages TO service_role;

GRANT ALL ON TABLE ai_agent_memory TO authenticated;
GRANT ALL ON TABLE ai_agent_memory TO service_role;

GRANT ALL ON TABLE ai_agent_audit_logs TO authenticated;
GRANT ALL ON TABLE ai_agent_audit_logs TO service_role;

GRANT ALL ON TABLE ai_agent_usage TO authenticated;
GRANT ALL ON TABLE ai_agent_usage TO service_role;

-- Grant SELECT on related tables used in RLS policies
GRANT SELECT ON TABLE tenants TO authenticated;
GRANT SELECT ON TABLE tenant_members TO authenticated;
