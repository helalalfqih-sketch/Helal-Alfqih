-- Migration: ai_agent_trust_foundation
-- Description: Adds strict RBAC and approval controls to AI execution tables

-- Add approval metadata to AI Tasks
ALTER TABLE public.ai_agent_tasks 
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS approved_plan_hash TEXT,
  ADD COLUMN IF NOT EXISTS approval_source TEXT CHECK (approval_source IN ('user_ui', 'api', 'system')) DEFAULT 'user_ui',
  ADD COLUMN IF NOT EXISTS approval_comment TEXT,
  ADD COLUMN IF NOT EXISTS approved_revision INTEGER DEFAULT 1;

-- Add plan hashes and revisions to AI Plans
ALTER TABLE public.ai_agent_plans
  ADD COLUMN IF NOT EXISTS plan_hash TEXT,
  ADD COLUMN IF NOT EXISTS revision INTEGER DEFAULT 1;

-- Stricter RLS for ai_agent_tasks execution status
-- Explicit execution block: only users with proper membership can insert/update executing status
DROP POLICY IF EXISTS "Users can update their own tenant tasks" ON public.ai_agent_tasks;
CREATE POLICY "Users can update their own tenant tasks" 
ON public.ai_agent_tasks 
FOR UPDATE 
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  (status != 'executing' AND status != 'APPROVED') OR 
  (
    status IN ('executing', 'APPROVED') AND 
    approved_by IS NOT NULL AND 
    approved_plan_hash IS NOT NULL
  )
);

-- Ensure AI audit logs capture privileged operations correctly
ALTER TABLE public.ai_agent_audit_logs
  ADD COLUMN IF NOT EXISTS operation_risk_level TEXT;

-- Restrict who can view other tenants' AI activity completely
DROP POLICY IF EXISTS "Users can view audit logs for their tenants" ON public.ai_agent_audit_logs;
CREATE POLICY "Users can view audit logs for their tenants"
ON public.ai_agent_audit_logs
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()
  )
);
