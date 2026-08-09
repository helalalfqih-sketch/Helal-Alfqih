-- Migration: Fix Supabase Storage RLS Policies for media & product-images buckets
-- Allows public reads and enables authenticated/service_role upload to storage.objects

-- 1. Ensure buckets exist and are public
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop legacy restrictive policies on storage.objects if present
DROP POLICY IF EXISTS "Public Storage Read" ON storage.objects;
DROP POLICY IF EXISTS "Allow Storage Insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow Storage Update" ON storage.objects;
DROP POLICY IF EXISTS "Allow Storage Delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;

-- 3. Create permissive policies for media storage buckets
CREATE POLICY "Public Storage Read"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('product-images', 'media', 'uploads', 'public'));

CREATE POLICY "Allow Storage Insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('product-images', 'media', 'uploads', 'public'));

CREATE POLICY "Allow Storage Update"
  ON storage.objects FOR UPDATE
  USING (bucket_id IN ('product-images', 'media', 'uploads', 'public'));

CREATE POLICY "Allow Storage Delete"
  ON storage.objects FOR DELETE
  USING (bucket_id IN ('product-images', 'media', 'uploads', 'public'));
