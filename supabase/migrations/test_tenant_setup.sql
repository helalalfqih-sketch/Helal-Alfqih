-- ============================================================================
-- QA TEST TENANT SETUP & VERIFICATION SCRIPT
-- File: supabase/migrations/test_tenant_setup.sql
-- ============================================================================

-- 1. Create QA Tenant
INSERT INTO public.tenants (slug, name, plan, status, settings)
VALUES (
  'test-tenant-qa',
  'QA Test Tenant',
  'enterprise',
  'active',
  '{"environment": "testing", "is_qa": true}'::jsonb
)
ON CONFLICT (slug) DO UPDATE
SET status = 'active', settings = EXCLUDED.settings;

-- 2. Verify Tenant Creation & Helper Functions
DO $$
DECLARE
  v_tenant_id uuid;
  v_prod_count integer;
BEGIN
  SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'test-tenant-qa';
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'QA Tenant creation failed!';
  END IF;

  -- Seed QA Categories
  INSERT INTO public.categories (tenant_id, slug, name, description, is_active)
  VALUES (
    v_tenant_id,
    'qa-category',
    'QA Test Category',
    'Category dedicated to automated integration testing',
    true
  )
  ON CONFLICT (tenant_id, slug) DO NOTHING;

  -- Seed QA Product
  INSERT INTO public.products (
    tenant_id, slug, name, description, price, stock, is_published, images
  )
  VALUES (
    v_tenant_id,
    'qa-product-01',
    'Automated Test Product',
    'Product seeded for QA workflow validation',
    99.99,
    100,
    true,
    ARRAY['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800']
  )
  ON CONFLICT (tenant_id, slug) DO NOTHING;

  SELECT count(*) INTO v_prod_count FROM public.products WHERE tenant_id = v_tenant_id;
  RAISE NOTICE 'QA Tenant ID % initialized with % products.', v_tenant_id, v_prod_count;
END
$$;
