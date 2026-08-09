-- Migration: Harden product_video_requests RLS policies
BEGIN;

-- 1. Create table idempotently if not exists
CREATE TABLE IF NOT EXISTS public.product_video_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_email TEXT,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'processing', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.product_video_requests ENABLE ROW LEVEL SECURITY;

-- 3. Remove all previous insecure USING (true) policies
DROP POLICY IF EXISTS "Allow public video requests" ON public.product_video_requests;
DROP POLICY IF EXISTS "public_insert_product_video_requests" ON public.product_video_requests;
DROP POLICY IF EXISTS "tenant_staff_read_video_requests" ON public.product_video_requests;

-- 4. Authenticated users can submit video requests for products
CREATE POLICY "authenticated_insert_product_video_requests"
  ON public.product_video_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id = auth.uid()
  );

-- 5. Tenant staff/owners can view video requests for their tenant
CREATE POLICY "tenant_staff_select_video_requests"
  ON public.product_video_requests
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT tm.tenant_id FROM public.tenant_members tm
      WHERE tm.user_id = auth.uid()
    )
  );

-- 6. Service Role full access
CREATE POLICY "service_role_video_requests"
  ON public.product_video_requests
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
