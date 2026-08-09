-- ================================================================
-- Migration: 20260807000000_production_schema_alignment.sql
-- Purpose: Align production schema with application code contracts.
-- Safety: All statements use IF NOT EXISTS / IF EXISTS guards.
--         This migration is safe to apply to databases where some
--         columns already exist.
-- ================================================================

-- 1. orders.user_id
--    Nullable UUID linking authenticated customer to order.
--    NULL = guest checkout (allowed and expected).
--    FK to auth.users(id) ON DELETE SET NULL — order is preserved if user is deleted.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id UUID
    REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for customer order history lookups (only non-NULL values)
CREATE INDEX IF NOT EXISTS orders_user_id_idx
  ON public.orders (user_id)
  WHERE user_id IS NOT NULL;

COMMENT ON COLUMN public.orders.user_id IS
  'Authenticated customer UUID from auth.users. NULL for guest orders.';

-- 2. orders.idempotency_key (ensure it exists — also in 20260731000002)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS idempotency_key UUID;

CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_unique
  ON public.orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

COMMENT ON COLUMN public.orders.idempotency_key IS
  'Client-generated UUID used to make checkout retries idempotent.';

-- 3. products.vendor_id
--    Nullable UUID for multi-vendor marketplace support.
--    No FK constraint added yet: vendor/tenant table name is unconfirmed.
--    FK will be added in a follow-up migration once vendor table is confirmed.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS vendor_id UUID;

COMMENT ON COLUMN public.products.vendor_id IS
  'Optional vendor/tenant UUID for multi-vendor marketplace mode. No FK enforced yet.';

-- 4. product_media ↔ media_files relationship
--    Verify that product_media.media_file_id references media_files(id).
--    This ensures PostgREST can serve embedded queries.
--    Guard: add FK only if product_media and media_files both exist.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_media'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'media_files'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'product_media'
      AND ccu.table_name = 'media_files'
  ) THEN
    ALTER TABLE public.product_media
      ADD CONSTRAINT product_media_media_file_id_fkey
      FOREIGN KEY (media_file_id)
      REFERENCES public.media_files(id)
      ON DELETE CASCADE;
  END IF;
END;
$$;

-- 5. Grant service_role access to new columns (already has table-level grants)
-- No action needed — service_role inherits table grants.

-- 6. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
