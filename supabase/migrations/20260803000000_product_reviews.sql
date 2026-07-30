CREATE TABLE IF NOT EXISTS public.product_reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id    uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  rating        integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       text,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_tenant ON public.product_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews(product_id);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Public can view only approved reviews for active tenants
CREATE POLICY "Public view approved reviews"
  ON public.product_reviews FOR SELECT TO anon, authenticated
  USING (
    status = 'approved'
    AND EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND t.status = 'active')
  );

-- Store staff/managers/owners can view all reviews for their tenant
CREATE POLICY "Store staff view all reviews"
  ON public.product_reviews FOR SELECT TO authenticated
  USING (public.has_tenant_permission(tenant_id, auth.uid(), 'staff'::public.tenant_role));

-- Store managers/owners can update/moderate reviews
CREATE POLICY "Store managers moderate reviews"
  ON public.product_reviews FOR UPDATE TO authenticated
  USING (public.has_tenant_permission(tenant_id, auth.uid(), 'manager'::public.tenant_role))
  WITH CHECK (public.has_tenant_permission(tenant_id, auth.uid(), 'manager'::public.tenant_role));

CREATE POLICY "Store managers delete reviews"
  ON public.product_reviews FOR DELETE TO authenticated
  USING (public.has_tenant_permission(tenant_id, auth.uid(), 'manager'::public.tenant_role));

GRANT SELECT ON public.product_reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;
GRANT ALL ON public.product_reviews TO service_role;
