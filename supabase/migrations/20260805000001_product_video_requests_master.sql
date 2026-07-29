BEGIN;

-- 1. Create product_video_requests table if not exists
CREATE TABLE IF NOT EXISTS public.product_video_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_video_requests_status_check
    CHECK (status IN ('pending', 'processing', 'completed', 'rejected'))
);

-- 2. Create unique index to prevent duplicate pending requests per tenant/product/customer
CREATE UNIQUE INDEX IF NOT EXISTS product_video_requests_tenant_product_customer_uq
  ON public.product_video_requests (tenant_id, product_id, customer_id);

-- 3. Enable RLS
ALTER TABLE public.product_video_requests ENABLE ROW LEVEL SECURITY;

-- 4. Clean up legacy policies
DROP POLICY IF EXISTS product_video_requests_insert ON public.product_video_requests;
DROP POLICY IF EXISTS product_video_requests_public_insert ON public.product_video_requests;
DROP POLICY IF EXISTS product_video_requests_tenant_read ON public.product_video_requests;
DROP POLICY IF EXISTS product_video_requests_customer_insert ON public.product_video_requests;
DROP POLICY IF EXISTS product_video_requests_tenant_staff_read ON public.product_video_requests;

-- 5. Customer Insert Policy (Authenticated users only for their own tenant products)
CREATE POLICY product_video_requests_customer_insert
  ON public.product_video_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    (customer_id = auth.uid() OR customer_id IS NULL)
    AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND p.tenant_id = tenant_id
    )
  );

-- 6. Staff Select Policy (Tenant staff only)
CREATE POLICY product_video_requests_tenant_staff_read
  ON public.product_video_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = product_video_requests.tenant_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'manager', 'staff', 'employee')
    )
  );

-- 7. Revoke public permissions
REVOKE ALL ON public.product_video_requests FROM anon;

-- 8. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
