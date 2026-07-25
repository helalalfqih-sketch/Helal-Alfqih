-- Migration: Add sequence_number to media_files and create product_media table
-- Enables Media-to-Product creation workflow and multi-media mapping per tenant

-- 1. Add sequence_number column to media_files
ALTER TABLE public.media_files
  ADD COLUMN IF NOT EXISTS sequence_number bigint;

-- 2. Populate sequence_number for existing records based on created_at per tenant
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at ASC) as seq
  FROM public.media_files
)
UPDATE public.media_files m
SET sequence_number = n.seq
FROM numbered n
WHERE m.id = n.id AND m.sequence_number IS NULL;

-- 3. Create function and trigger for auto-incrementing sequence_number per tenant
CREATE OR REPLACE FUNCTION public.set_media_sequence_number()
RETURNS TRIGGER AS $$
DECLARE
  max_seq bigint;
BEGIN
  IF NEW.sequence_number IS NULL THEN
    SELECT COALESCE(MAX(sequence_number), 0) + 1 INTO max_seq
    FROM public.media_files
    WHERE tenant_id = NEW.tenant_id;
    
    NEW.sequence_number := max_seq;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_media_sequence_number ON public.media_files;
CREATE TRIGGER trigger_media_sequence_number
  BEFORE INSERT ON public.media_files
  FOR EACH ROW
  EXECUTE FUNCTION public.set_media_sequence_number();

-- 4. Create index for fast sorting by sequence_number
CREATE INDEX IF NOT EXISTS idx_media_files_sequence
  ON public.media_files(tenant_id, sequence_number DESC);

-- 5. Create product_media relation table
CREATE TABLE IF NOT EXISTS public.product_media (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id   uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  media_id     uuid NOT NULL REFERENCES public.media_files(id) ON DELETE CASCADE,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, media_id)
);

CREATE INDEX IF NOT EXISTS idx_product_media_product ON public.product_media(product_id, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_product_media_tenant ON public.product_media(tenant_id);

-- 6. Enable RLS and permissions on product_media
ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read product_media" ON public.product_media;
CREATE POLICY "Public read product_media"
  ON public.product_media FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Tenant members manage product_media" ON public.product_media;
CREATE POLICY "Tenant members manage product_media"
  ON public.product_media FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_tenant_member(tenant_id, auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_tenant_member(tenant_id, auth.uid())
  );

GRANT ALL ON public.product_media TO postgres;
GRANT ALL ON public.product_media TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_media TO authenticated;
GRANT SELECT ON public.product_media TO anon;

-- 7. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
