import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

interface CatalogProduct {
  id?: string;
  external_id?: string;
  title?: string;
  name?: string;
  slug?: string;
  price?: number | string;
  description?: string;
  status?: string;
  images?: string[];
  image_url?: string;
}

interface SyncPayload {
  tenant_id?: string;
  catalog_url?: string;
  products?: CatalogProduct[];
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_TENANT_ID = "9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let payload: SyncPayload = {};
    if (req.method === "POST") {
      try {
        payload = (await req.json()) as SyncPayload;
      } catch {
        payload = {};
      }
    }

    const tenantId = payload.tenant_id || DEFAULT_TENANT_ID;
    const catalogUrl = payload.catalog_url || Deno.env.get("FIREBASE_CATALOG_CSV_URL");

    console.log(`[sync-firebase-catalog] Processing catalog sync for tenant: ${tenantId}`);

    let syncedProductsCount = 0;
    let syncedMediaCount = 0;
    let syncedProductMediaCount = 0;

    if (catalogUrl) {
      const csvResponse = await fetch(catalogUrl);
      if (!csvResponse.ok) {
        throw new Error(`Failed to fetch catalog CSV: ${csvResponse.statusText}`);
      }
      const csvText = await csvResponse.text();
      // Parsing logic for catalog CSV if provided...
    }

    // Process catalog items payload if passed directly
    if (Array.isArray(payload.products)) {
      for (const item of payload.products) {
        if (!item.title && !item.name) continue;

        const externalId = item.external_id || item.id || null;
        const slug =
          item.slug ||
          (item.title
            ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
            : `prod-${Date.now()}`);

        // 1. Find or insert product
        let productId: string | null = null;
        if (externalId) {
          const { data: existing } = await supabase
            .from("products")
            .select("id")
            .eq("tenant_id", tenantId)
            .eq("external_id", externalId)
            .limit(1);
          if (existing && existing.length > 0) {
            productId = existing[0].id;
          }
        }

        if (!productId && slug) {
          const { data: existing } = await supabase
            .from("products")
            .select("id")
            .eq("tenant_id", tenantId)
            .eq("slug", slug)
            .limit(1);
          if (existing && existing.length > 0) {
            productId = existing[0].id;
          }
        }

        if (!productId) {
          const { data: newProd, error: prodErr } = await supabase
            .from("products")
            .insert({
              tenant_id: tenantId,
              title: item.title || item.name,
              slug,
              external_id: externalId,
              price: Number(item.price) || 0,
              description: item.description || null,
              status: item.status || "active",
            })
            .select("id")
            .single();

          if (prodErr) {
            console.error(
              `[sync-firebase-catalog] Failed to insert product ${slug}:`,
              prodErr.message,
            );
            continue;
          }
          productId = newProd.id;
          syncedProductsCount++;
        }

        // 2. Process product media URLs
        const imageUrls: string[] = Array.isArray(item.images)
          ? item.images
          : typeof item.image_url === "string"
            ? [item.image_url]
            : [];

        for (let i = 0; i < imageUrls.length; i++) {
          const rawUrl = imageUrls[i];
          if (!rawUrl || typeof rawUrl !== "string") continue;

          let mediaId: string | null = null;

          // Deterministic duplicate check on tenant_id + file_url without maybeSingle() exception
          const { data: existingMedia } = await supabase
            .from("media_files")
            .select("id, storage_provider, storage_bucket, object_key")
            .eq("tenant_id", tenantId)
            .eq("file_url", rawUrl)
            .order("created_at", { ascending: true })
            .limit(1);

          if (existingMedia && existingMedia.length > 0) {
            mediaId = existingMedia[0].id;
          } else {
            // FIX FOR media_files_storage_locator_complete CONSTRAINT:
            // External Firebase media URLs whose bytes have NOT been copied to Supabase Storage must have:
            // storage_provider = null, storage_bucket = null, object_key = null.
            const isSupabaseStorageUrl = rawUrl.includes(
              ".supabase.co/storage/v1/object/public/product-images/",
            );
            const objectKeyMatch = isSupabaseStorageUrl
              ? rawUrl.split("/storage/v1/object/public/product-images/")[1]
              : null;

            const rawFileName = rawUrl.split("/").pop() || `media-${Date.now()}`;
            const mediaPayload = {
              tenant_id: tenantId,
              file_name: rawFileName,
              file_url: rawUrl,
              file_path: objectKeyMatch || rawUrl,
              file_type: "image",
              source: "firebase_catalog",
              // Locator fields: ALL NULL for uncopied external media, or ALL valid values for Supabase Storage objects
              storage_provider: isSupabaseStorageUrl ? "supabase" : null,
              storage_bucket: isSupabaseStorageUrl ? "product-images" : null,
              object_key: isSupabaseStorageUrl ? objectKeyMatch : null,
            };

            const { data: insertedMedia, error: mediaInsertErr } = await supabase
              .from("media_files")
              .insert(mediaPayload)
              .select("id")
              .single();

            if (mediaInsertErr) {
              console.error(
                `[sync-firebase-catalog] Failed to insert media_files for URL ${rawUrl}:`,
                mediaInsertErr.message,
              );
              continue;
            }
            mediaId = insertedMedia.id;
            syncedMediaCount++;
          }

          // 3. Link via product_media
          if (productId && mediaId) {
            const { data: existingLink } = await supabase
              .from("product_media")
              .select("id")
              .eq("tenant_id", tenantId)
              .eq("product_id", productId)
              .eq("media_id", mediaId)
              .limit(1);

            if (!existingLink || existingLink.length === 0) {
              const { error: linkErr } = await supabase.from("product_media").insert({
                tenant_id: tenantId,
                product_id: productId,
                media_id: mediaId,
                sort_order: i,
              });

              if (!linkErr) {
                syncedProductMediaCount++;
              }
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        tenant_id: tenantId,
        synced_products: syncedProductsCount,
        synced_media: syncedMediaCount,
        synced_product_media: syncedProductMediaCount,
      }),
      {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Sync error";
    console.error("[sync-firebase-catalog] Edge function error:", errMessage);
    return new Response(JSON.stringify({ success: false, error: errMessage }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
