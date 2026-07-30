-- =========================================================
-- Migration: 20260806000000_harden_orders_and_quality_audit_tables.sql
-- Description:
--   1. Harden RLS policies on orders, order_items, order_status_history
--      to deny direct anonymous INSERTs (all orders flow through createOrder).
--   2. Create quality_audit_runs table with tenant_id, created_by, status, commit_sha.
-- =========================================================

-- 1. Orders RLS Security Hardening
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;

-- Revoke direct anon writes on order tables (Server Function uses service_role)
REVOKE INSERT, UPDATE ON public.orders FROM anon;
REVOKE INSERT, UPDATE ON public.order_items FROM anon;
REVOKE INSERT ON public.order_status_history FROM anon;

-- Ensure service_role has full access for createOrder server function
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;
GRANT ALL ON public.order_status_history TO service_role;

-- 2. Quality Audit Runs Table (Enhanced Audit Schema)
CREATE TABLE IF NOT EXISTS public.quality_audit_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'PASS',
  commit_sha TEXT,
  environment TEXT NOT NULL DEFAULT 'production',
  schema_version TEXT NOT NULL DEFAULT '1.0.0',
  overall_score INT NOT NULL DEFAULT 100,
  grade TEXT NOT NULL DEFAULT 'A+',
  duration_ms INT NOT NULL DEFAULT 0,
  audits_count INT NOT NULL DEFAULT 0,
  passed_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  warning_count INT NOT NULL DEFAULT 0,
  not_measured_count INT NOT NULL DEFAULT 0,
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
  ran_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for quality_audit_runs
ALTER TABLE public.quality_audit_runs ENABLE ROW LEVEL SECURITY;

-- Admins and platform managers can read audit history
CREATE POLICY "Admins can read quality audit runs"
  ON public.quality_audit_runs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_members.user_id = auth.uid()
      AND tenant_members.tenant_id = quality_audit_runs.tenant_id
      AND tenant_members.role IN ('owner', 'manager')
    )
  );

-- Service role full access
GRANT ALL ON public.quality_audit_runs TO service_role;
