-- Migration: Ensure media_files.sequence_number column exists with proper default, trigger, and indexes
BEGIN;

-- 1. Add sequence_number column if not exists
ALTER TABLE public.media_files
  ADD COLUMN IF NOT EXISTS sequence_number INT DEFAULT 0;

-- 2. Backfill existing records without sequence_number per tenant
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at ASC) as seq
  FROM public.media_files
  WHERE sequence_number IS NULL OR sequence_number = 0
)
UPDATE public.media_files m
SET sequence_number = n.seq
FROM numbered n
WHERE m.id = n.id AND (m.sequence_number IS NULL OR m.sequence_number = 0);

-- 3. Auto-increment trigger per tenant
CREATE OR REPLACE FUNCTION public.set_media_sequence_number()
RETURNS TRIGGER AS $$
DECLARE
  max_seq INT;
BEGIN
  IF NEW.sequence_number IS NULL OR NEW.sequence_number = 0 THEN
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

-- 4. Composite index for tenant-isolated sequence sorting
CREATE INDEX IF NOT EXISTS idx_media_files_tenant_sequence
  ON public.media_files (tenant_id, sequence_number DESC);

-- 5. PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

COMMIT;
