-- Migration: Harden AI Agent RLS policies & revoke public RPC access
BEGIN;

-- 1. Create atomic execution lock RPC if not existing
CREATE OR REPLACE FUNCTION public.acquire_ai_task_execution_lock(
  p_task_id TEXT,
  p_tenant_id UUID,
  p_expected_hash TEXT,
  p_expected_revision INT
)
RETURNS JSONB AS $$
DECLARE
  v_task RECORD;
BEGIN
  -- Lock row for update
  SELECT id, status, approved_plan_hash, approved_revision, approved_by, approved_at
  INTO v_task
  FROM public.ai_agent_tasks
  WHERE id = p_task_id AND tenant_id = p_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'TASK_NOT_FOUND');
  END IF;

  IF v_task.status != 'approved' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'TASK_NOT_APPROVED', 'status', v_task.status);
  END IF;

  IF v_task.approved_by IS NULL OR v_task.approved_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'MISSING_APPROVAL_METADATA');
  END IF;

  IF v_task.approved_plan_hash != p_expected_hash OR v_task.approved_revision != p_expected_revision THEN
    RETURN jsonb_build_object('success', false, 'reason', 'HASH_REVISION_MISMATCH');
  END IF;

  -- Perform atomic transition
  UPDATE public.ai_agent_tasks
  SET status = 'executing', updated_at = now()
  WHERE id = p_task_id AND tenant_id = p_tenant_id;

  RETURN jsonb_build_object('success', true, 'task_id', p_task_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Restrict RPC access exclusively to service_role (backend server execution gateway)
REVOKE ALL ON FUNCTION public.acquire_ai_task_execution_lock(TEXT, UUID, TEXT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.acquire_ai_task_execution_lock(TEXT, UUID, TEXT, INT) FROM anon;
REVOKE ALL ON FUNCTION public.acquire_ai_task_execution_lock(TEXT, UUID, TEXT, INT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_ai_task_execution_lock(TEXT, UUID, TEXT, INT) TO service_role;

-- 3. Replace permissive USING (true) policies on ai_agent_tasks with tenant-scoped policies
DROP POLICY IF EXISTS "Allow all access to ai_agent_tasks" ON public.ai_agent_tasks;
DROP POLICY IF EXISTS "tenant_isolation_ai_agent_tasks" ON public.ai_agent_tasks;

ALTER TABLE public.ai_agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_ai_agent_tasks_select"
  ON public.ai_agent_tasks
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT tm.tenant_id FROM public.tenant_members tm
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_isolation_ai_agent_tasks_write"
  ON public.ai_agent_tasks
  FOR ALL TO authenticated
  USING (
    tenant_id IN (
      SELECT tm.tenant_id FROM public.tenant_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tm.tenant_id FROM public.tenant_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'manager')
    )
  );

-- Service Role full access
CREATE POLICY "service_role_ai_agent_tasks"
  ON public.ai_agent_tasks
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
