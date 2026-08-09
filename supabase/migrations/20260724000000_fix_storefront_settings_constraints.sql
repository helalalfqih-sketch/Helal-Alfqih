-- =========================================================
-- Fix storefront_settings unique constraints & draft_value column (Idempotent)
-- =========================================================

-- 1. Ensure draft_value column exists on storefront_settings table
ALTER TABLE public.storefront_settings 
  ADD COLUMN IF NOT EXISTS draft_value jsonb DEFAULT NULL;

-- 2. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

DO $$
DECLARE
  _con text;
BEGIN
  -- Drop single-column UNIQUE constraint on `key` if it exists under any constraint name
  FOR _con IN (
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.storefront_settings'::regclass
      AND c.contype = 'u'
      AND array_length(c.conkey, 1) = 1
      AND c.conkey[1] = (
        SELECT a.attnum FROM pg_attribute a
        WHERE a.attrelid = 'public.storefront_settings'::regclass AND a.attname = 'key'
      )
  ) LOOP
    EXECUTE format('ALTER TABLE public.storefront_settings DROP CONSTRAINT IF EXISTS %I', _con);
  END LOOP;
END $$;

-- Drop legacy non-partial index on key if it exists as an index
DROP INDEX IF EXISTS public.storefront_settings_key_key;

-- 3. Ensure partial UNIQUE index for GLOBAL settings (tenant_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS storefront_settings_global_key_uniq
  ON public.storefront_settings(key)
  WHERE tenant_id IS NULL;

-- 4. Ensure partial UNIQUE index for TENANT settings (tenant_id IS NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS storefront_settings_tenant_key_uniq
  ON public.storefront_settings(tenant_id, key)
  WHERE tenant_id IS NOT NULL;

