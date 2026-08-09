-- ================================================================
-- Migration: 20260809000000_production_remediation.sql
-- Purpose: Complete Production Remediation (Checkout Schema, RLS Hardening,
--          Product Media, System Live Logs, Function Search Paths)
-- Safety: Idempotent, non-destructive, forward-only PostgreSQL script.
-- ================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. ORDERS SCHEMA RECONCILIATION & INDEXING
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Unique constraint for idempotency key to prevent duplicate checkout submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_idempotency_key_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_orders_idempotency_key_unique
      ON public.orders (idempotency_key)
      WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';
  END IF;
END $$;

-- Indexes for orders table queries
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON public.orders(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Foreign key indexes for order child tables
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);

-- ────────────────────────────────────────────────────────────────
-- 2. PRODUCT MEDIA TABLE RECONCILIATION & BACKFILL
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.product_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  media_file_id UUID REFERENCES public.media_files(id) ON DELETE SET NULL,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video', '3d', 'other')),
  url TEXT,
  storage_path TEXT,
  poster_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  alt_text TEXT,
  playback_provider TEXT CHECK (playback_provider IN ('mux', 'direct', 'youtube', 'vimeo', 'other')),
  playback_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index product_media lookups
CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON public.product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_media_file_id ON public.product_media(media_file_id) WHERE media_file_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_media_sort_order ON public.product_media(product_id, sort_order);

-- Enable RLS on product_media
ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;

-- Drop permissive or duplicate product_media policies if existing
DROP POLICY IF EXISTS "public_read_product_media" ON public.product_media;
DROP POLICY IF EXISTS "admin_manage_product_media" ON public.product_media;

-- Public read access for published product media
CREATE POLICY "public_read_product_media"
  ON public.product_media
  FOR SELECT TO anon, authenticated
  USING (true);

-- Admin/Service Role manage access
CREATE POLICY "admin_manage_product_media"
  ON public.product_media
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Backfill product_media from products.images array if empty
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.products WHERE images IS NOT NULL AND jsonb_array_length(images) > 0) THEN
    INSERT INTO public.product_media (product_id, url, media_type, sort_order)
    SELECT 
      p.id AS product_id,
      img.val AS url,
      'image' AS media_type,
      (img.ordinality - 1) AS sort_order
    FROM public.products p
    CROSS JOIN LATERAL jsonb_array_elements_text(p.images) WITH ORDINALITY AS img(val, ordinality)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.product_media pm WHERE pm.product_id = p.id AND pm.url = img.val
    );
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────
-- 3. RLS SECURITY HARDENING
-- ────────────────────────────────────────────────────────────────

-- 3.1 Orders Table Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone_insert_orders" ON public.orders;
DROP POLICY IF EXISTS "public_insert_orders" ON public.orders;
DROP POLICY IF EXISTS "users_read_own_orders" ON public.orders;

-- Authenticated customers can read only their own orders
CREATE POLICY "users_read_own_orders"
  ON public.orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Service role / Admin full access for orders
DROP POLICY IF EXISTS "service_role_orders_all" ON public.orders;
CREATE POLICY "service_role_orders_all"
  ON public.orders
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 3.2 Order Items Security
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone_read_order_items" ON public.order_items;
DROP POLICY IF EXISTS "public_read_order_items" ON public.order_items;
DROP POLICY IF EXISTS "users_read_own_order_items" ON public.order_items;

CREATE POLICY "users_read_own_order_items"
  ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "service_role_order_items_all" ON public.order_items;
CREATE POLICY "service_role_order_items_all"
  ON public.order_items
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 3.3 Profiles Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;

CREATE POLICY "users_read_own_profile"
  ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_update_own_profile"
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "service_role_profiles_all" ON public.profiles;
CREATE POLICY "service_role_profiles_all"
  ON public.profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 3.4 System Live Logs Security
ALTER TABLE public.system_live_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone_insert_live_logs" ON public.system_live_logs;
DROP POLICY IF EXISTS "authenticated_update_live_logs" ON public.system_live_logs;
DROP POLICY IF EXISTS "authenticated_delete_live_logs" ON public.system_live_logs;
DROP POLICY IF EXISTS "authenticated_read_live_logs" ON public.system_live_logs;

-- Service Role full access to live logs
DROP POLICY IF EXISTS "service_role_system_live_logs" ON public.system_live_logs;
CREATE POLICY "service_role_system_live_logs"
  ON public.system_live_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users (admin) read-only access to live logs
CREATE POLICY "authenticated_read_live_logs"
  ON public.system_live_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'owner', 'manager')
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 4. SECURITY DEFINER FUNCTION HARDENING
-- ────────────────────────────────────────────────────────────────

DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname IN (
        'apply_inventory_movement',
        'attach_tenant_owner',
        'create_notification',
        'record_sale',
        'update_order_branch',
        'has_role',
        'has_tenant_permission',
        'has_tenant_role',
        'is_tenant_member',
        'can_manage_tenant'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public, pg_temp;', func_record.proname, func_record.args);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon;', func_record.proname, func_record.args);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
