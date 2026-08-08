-- =============================================================================
-- SECURITY REMEDIATION: Close anon write exposure
-- Branch: fix/catalog-supabase-source-of-truth
-- Migration: 20260809000002_media_files_storage_security_hardening.sql
--
-- Closes:
--   1. Anon INSERT on public.media_files (empirically confirmed live)
--   2. Anon INSERT/UPDATE/DELETE on storage.objects for product-images bucket
--      (via the open "Allow Storage Insert" policy from 20260724000004)
--
-- Preserves:
--   - authenticated users managing media_files (staff/owner)
--   - service_role full access to both tables
--   - public SELECT on media_files and storage objects (storefront reads)
--   - authenticated uploads to product-images (storefront admin uploads)
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CLOSE ANON INSERT ON public.media_files
-- ─────────────────────────────────────────────────────────────────────────────

-- Re-revoke INSERT from anon
REVOKE INSERT, UPDATE, DELETE ON TABLE public.media_files FROM anon;

-- Drop permissive open policies that may have survived prior migrations
DROP POLICY IF EXISTS "Allow public insert media files"           ON public.media_files;
DROP POLICY IF EXISTS "Allow authenticated manage media files"    ON public.media_files;
DROP POLICY IF EXISTS "Allow all authenticated users to manage media files" ON public.media_files;

-- Ensure scoped policies from P0 hardening are present
DROP POLICY IF EXISTS "P0 media staff insert" ON public.media_files;
CREATE POLICY "P0 media staff insert"
  ON public.media_files
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  );

DROP POLICY IF EXISTS "P0 media staff update" ON public.media_files;
CREATE POLICY "P0 media staff update"
  ON public.media_files
  FOR UPDATE TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  );

DROP POLICY IF EXISTS "P0 media owner delete" ON public.media_files;
CREATE POLICY "P0 media owner delete"
  ON public.media_files
  FOR DELETE TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'owner'::public.tenant_role
    )
  );

-- Ensure public/anon read remains (storefront needs it)
DROP POLICY IF EXISTS "Public read media files"       ON public.media_files;
DROP POLICY IF EXISTS "Allow public to read media files" ON public.media_files;
CREATE POLICY "Public read media files"
  ON public.media_files FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CLOSE ANON INSERT/UPDATE/DELETE ON storage.objects FOR product-images
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop the open no-role policies
DROP POLICY IF EXISTS "Allow Storage Insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow Storage Update" ON storage.objects;
DROP POLICY IF EXISTS "Allow Storage Delete" ON storage.objects;

-- Keep public read (storefront product image display)
DROP POLICY IF EXISTS "Public Storage Read" ON storage.objects;
CREATE POLICY "Public Storage Read"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('product-images', 'media', 'uploads', 'public'));

-- Restore authenticated upload (admin product image management)
DROP POLICY IF EXISTS "Authenticated Upload Products & Media" ON storage.objects;
CREATE POLICY "Authenticated Upload Products & Media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('products', 'media', 'product-images', 'uploads'));

DROP POLICY IF EXISTS "Authenticated Delete Products & Media" ON storage.objects;
CREATE POLICY "Authenticated Delete Products & Media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('products', 'media', 'product-images', 'uploads'));

DO $$
BEGIN
  RAISE NOTICE 'Security remediation applied successfully.';
END $$;

COMMIT;
