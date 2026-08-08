-- =============================================================================
-- RECOVERY MIGRATION: Link all images for 8 Base64-affected products
-- Branch: fix/catalog-supabase-source-of-truth
-- Migration: 20260809000001_base64_media_recovery_and_link.sql
--
-- SCOPE:
--   Step 1  — Preflight assertions (abort on any mismatch)
--   Step 2  — Direct product_media inserts for 32 image positions
--              (Base64-recovered + HTTPS siblings resolved to media_files UUIDs)
--   Step 3  — Postflight assertions (abort on any mismatch)
--
-- NO writes to products.images. NO DELETEs. NO permanent functions.
-- Idempotent: WHERE NOT EXISTS guards every INSERT.
-- UNIQUE(product_id, media_id) constraint on product_media is respected;
--   e6a29622 pos=1 omitted (identical SHA-256 as pos=0; same media_files.id).
-- =============================================================================

BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '180s';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1 — PREFLIGHT ASSERTIONS
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_partial          INTEGER;
  v_recovered        INTEGER;
  v_products_present INTEGER;
  v_cur_products     INTEGER;
  v_cur_pm           INTEGER;
BEGIN
  -- 1a. Zero partial storage locators
  SELECT COUNT(*) INTO v_partial
  FROM public.media_files
  WHERE NOT (
    (storage_provider IS NULL AND storage_bucket IS NULL AND object_key IS NULL)
    OR (
      nullif(btrim(storage_provider), '') IS NOT NULL
      AND nullif(btrim(storage_bucket), '') IS NOT NULL
      AND nullif(btrim(object_key),    '') IS NOT NULL
    )
  );
  IF v_partial > 0 THEN
    RAISE EXCEPTION 'PREFLIGHT ABORT: % partial storage locators found.', v_partial;
  END IF;

  -- 1b. Exactly 10 source=historical_media_recovery rows with complete locators
  SELECT COUNT(*) INTO v_recovered
  FROM public.media_files
  WHERE source = 'historical_media_recovery'
    AND storage_provider = 'supabase'
    AND storage_bucket   = 'product-images'
    AND object_key LIKE 'recovered/%';
  IF v_recovered <> 10 THEN
    RAISE EXCEPTION 'PREFLIGHT ABORT: Expected 10 recovered media_files, found %.', v_recovered;
  END IF;

  -- 1c. All 8 target products exist
  SELECT COUNT(*) INTO v_products_present
  FROM public.products
  WHERE id IN (
    '3160e374-d077-4eec-a61c-a89c518b68b8',
    'd33ef8a3-a883-4a54-b77a-27768243a768',
    'a0257286-8c37-43b2-aba2-6cf21bd0f283',
    '6d1eaacb-6107-4511-8e6d-76d18808622d',
    'fbc5a35c-06f5-41cd-843a-0664c3f6435b',
    'e6a29622-68a6-4a8e-af70-665c73a34efa',
    'f3f25366-0b09-4051-a603-1c2b38f2c396',
    'd589b585-46bd-444e-9beb-1eda80ad28c1'
  );
  IF v_products_present <> 8 THEN
    RAISE EXCEPTION 'PREFLIGHT ABORT: Expected 8 target products, found %.', v_products_present;
  END IF;

  -- 1d. products count = 375 (no unexpected additions/deletions)
  SELECT COUNT(*) INTO v_cur_products FROM public.products;
  IF v_cur_products <> 375 THEN
    RAISE EXCEPTION 'PREFLIGHT ABORT: Expected 375 products, found %. Investigate before proceeding.', v_cur_products;
  END IF;

  -- 1e. product_media count = 958 (baseline before this migration)
  SELECT COUNT(*) INTO v_cur_pm FROM public.product_media;
  IF v_cur_pm <> 958 THEN
    RAISE EXCEPTION 'PREFLIGHT ABORT: Expected 958 product_media rows, found %. Check state.', v_cur_pm;
  END IF;

  RAISE NOTICE 'PREFLIGHT PASSED: partial=%, recovered=%, target_products=%, cur_products=%, cur_pm=%',
    v_partial, v_recovered, v_products_present, v_cur_products, v_cur_pm;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2 — INSERT 32 product_media ROWS (DIRECT UUID PAIRS, IDEMPOTENT)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.product_media (tenant_id, product_id, media_id, sort_order)
SELECT v.tenant_id, v.product_id, v.media_id, v.sort_order
FROM (VALUES
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, '3160e374-d077-4eec-a61c-a89c518b68b8'::uuid, 'af14bce6-a432-4c6e-845b-29b42accc284'::uuid, 0),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, '3160e374-d077-4eec-a61c-a89c518b68b8'::uuid, '9956e141-37c1-4c77-9744-2b1546970dff'::uuid, 1),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, '3160e374-d077-4eec-a61c-a89c518b68b8'::uuid, '65dbdbc4-e602-4826-9d33-9d1955a4d103'::uuid, 2),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, '3160e374-d077-4eec-a61c-a89c518b68b8'::uuid, '842e312b-f097-436c-a2de-787bff9adf22'::uuid, 3),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, '3160e374-d077-4eec-a61c-a89c518b68b8'::uuid, '19c30ab8-710e-490d-94f2-2f40ec694eea'::uuid, 4),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, '3160e374-d077-4eec-a61c-a89c518b68b8'::uuid, '8c16cc68-18b8-48a7-ad60-4c7a61d2f250'::uuid, 5),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, '3160e374-d077-4eec-a61c-a89c518b68b8'::uuid, 'c4cb2964-4a8c-4ef8-92a2-922676818dda'::uuid, 6),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, '3160e374-d077-4eec-a61c-a89c518b68b8'::uuid, '6230d3c3-8c57-4096-bfa7-b11134896681'::uuid, 7),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, '3160e374-d077-4eec-a61c-a89c518b68b8'::uuid, '141d4a1c-7005-4b14-be25-a144a5efb16d'::uuid, 8),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, '3160e374-d077-4eec-a61c-a89c518b68b8'::uuid, 'd1861237-f921-4174-ade1-4b4e2bf743f7'::uuid, 9),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, '6d1eaacb-6107-4511-8e6d-76d18808622d'::uuid, 'e56d19ec-e2a3-4cf3-a21c-5a40d3993f77'::uuid, 0),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, '6d1eaacb-6107-4511-8e6d-76d18808622d'::uuid, '3a6cf3a1-fe08-40be-9daa-476a751b8e3b'::uuid, 1),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, 'a0257286-8c37-43b2-aba2-6cf21bd0f283'::uuid, '589e4b51-5bb8-4d07-ae5f-ebcd69f67b37'::uuid, 0),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, 'a0257286-8c37-43b2-aba2-6cf21bd0f283'::uuid, '9ba44c48-fa2a-438d-a897-a521fd35f3d7'::uuid, 1),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, 'a0257286-8c37-43b2-aba2-6cf21bd0f283'::uuid, '98a07d3a-e419-4ec2-9f7a-b2863857c1e4'::uuid, 2),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, 'a0257286-8c37-43b2-aba2-6cf21bd0f283'::uuid, '9220e537-1dba-4d28-932d-f0de7bb2e81a'::uuid, 3),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, 'a0257286-8c37-43b2-aba2-6cf21bd0f283'::uuid, '4fd24611-1c31-43c3-bdc4-24a148037f0f'::uuid, 4),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, 'd33ef8a3-a883-4a54-b77a-27768243a768'::uuid, '8c808ca8-7020-461f-a2ac-16c22ee77033'::uuid, 0),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, 'd33ef8a3-a883-4a54-b77a-27768243a768'::uuid, '8c8fcb48-b7ac-4d48-a92a-f2b8609c5bcd'::uuid, 1),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, 'd589b585-46bd-444e-9beb-1eda80ad28c1'::uuid, '33853cce-27a7-4161-b8fe-821f7cda9170'::uuid, 0),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, 'd589b585-46bd-444e-9beb-1eda80ad28c1'::uuid, '75b10462-1b5d-46c2-b3f2-5575d8af4686'::uuid, 1),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, 'd589b585-46bd-444e-9beb-1eda80ad28c1'::uuid, 'd125f0c0-c48e-45be-addb-d552f8488afa'::uuid, 2),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, 'd589b585-46bd-444e-9beb-1eda80ad28c1'::uuid, '33f29586-cc06-4971-a206-c679f395ac5d'::uuid, 3),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, 'e6a29622-68a6-4a8e-af70-665c73a34efa'::uuid, '9b9dbca4-7c98-4697-a4f6-085207286efc'::uuid, 0),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, 'e6a29622-68a6-4a8e-af70-665c73a34efa'::uuid, '808300a2-9ce4-4b8f-810d-6a0157306197'::uuid, 2),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, 'e6a29622-68a6-4a8e-af70-665c73a34efa'::uuid, 'f4d7c8ef-063c-4fd4-b6c3-d1be44367dbd'::uuid, 3),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, 'e6a29622-68a6-4a8e-af70-665c73a34efa'::uuid, '35a1724d-8db5-41df-bee6-a8addbcc8d56'::uuid, 4),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, 'f3f25366-0b09-4051-a603-1c2b38f2c396'::uuid, '7659afd6-7bc4-401e-8917-94220718c287'::uuid, 0),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, 'f3f25366-0b09-4051-a603-1c2b38f2c396'::uuid, 'ebc72bab-d61f-4aa0-a101-12397117cd03'::uuid, 1),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, 'f3f25366-0b09-4051-a603-1c2b38f2c396'::uuid, '93b0cae9-68dd-48a4-a255-23663a2971f7'::uuid, 2),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, 'fbc5a35c-06f5-41cd-843a-0664c3f6435b'::uuid, 'ea96670a-6167-4845-8c84-2111306f3f5e'::uuid, 0),
  ('9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a'::uuid, 'fbc5a35c-06f5-41cd-843a-0664c3f6435b'::uuid, '47d582c2-1b5b-4bb9-9596-32f54efb62f6'::uuid, 1)
) AS v(tenant_id, product_id, media_id, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_media pm
  WHERE pm.product_id = v.product_id AND pm.media_id = v.media_id
);


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3 — POSTFLIGHT ASSERTIONS
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_partial_final   INTEGER;
  v_new_pm          INTEGER;
  v_total_pm        INTEGER;
  v_total_products  INTEGER;
  v_pm_rec          RECORD;
BEGIN
  -- 3a. Zero partial locators still
  SELECT COUNT(*) INTO v_partial_final
  FROM public.media_files
  WHERE NOT (
    (storage_provider IS NULL AND storage_bucket IS NULL AND object_key IS NULL)
    OR (
      nullif(btrim(storage_provider), '') IS NOT NULL
      AND nullif(btrim(storage_bucket), '') IS NOT NULL
      AND nullif(btrim(object_key),    '') IS NOT NULL
    )
  );
  IF v_partial_final > 0 THEN
    RAISE EXCEPTION 'POSTFLIGHT ABORT: % partial locators after insert.', v_partial_final;
  END IF;

  -- 3b. Total product_media = 990
  SELECT COUNT(*) INTO v_total_pm FROM public.product_media;
  IF v_total_pm <> 990 THEN
    RAISE EXCEPTION 'POSTFLIGHT ABORT: Expected 990 product_media rows, found %.', v_total_pm;
  END IF;

  -- 3c. products still = 375
  SELECT COUNT(*) INTO v_total_products FROM public.products;
  IF v_total_products <> 375 THEN
    RAISE EXCEPTION 'POSTFLIGHT ABORT: Products changed! Expected 375, found %.', v_total_products;
  END IF;

  -- 3d. All 8 target products now have product_media rows
  FOR v_pm_rec IN
    SELECT p.id, COUNT(pm.id) AS cnt
    FROM public.products p
    LEFT JOIN public.product_media pm ON pm.product_id = p.id
    WHERE p.id IN (
      '3160e374-d077-4eec-a61c-a89c518b68b8',
      'd33ef8a3-a883-4a54-b77a-27768243a768',
      'a0257286-8c37-43b2-aba2-6cf21bd0f283',
      '6d1eaacb-6107-4511-8e6d-76d18808622d',
      'fbc5a35c-06f5-41cd-843a-0664c3f6435b',
      'e6a29622-68a6-4a8e-af70-665c73a34efa',
      'f3f25366-0b09-4051-a603-1c2b38f2c396',
      'd589b585-46bd-444e-9beb-1eda80ad28c1'
    )
    GROUP BY p.id
  LOOP
    IF v_pm_rec.cnt = 0 THEN
      RAISE EXCEPTION 'POSTFLIGHT ABORT: product % has 0 product_media rows after insert.', v_pm_rec.id;
    END IF;
  END LOOP;

  v_new_pm := v_total_pm - 958;
  IF v_new_pm < 32 THEN
    RAISE EXCEPTION 'POSTFLIGHT ABORT: Only % new rows inserted (expected 32).', v_new_pm;
  END IF;

  RAISE NOTICE 'POSTFLIGHT PASSED: total_pm=%, new_pm=%, products=%, partial_locators=%',
    v_total_pm, v_new_pm, v_total_products, v_partial_final;
END $$;

COMMIT;
