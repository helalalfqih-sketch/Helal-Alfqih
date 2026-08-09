import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface RecoveryResult {
  productsTotal: number;
  productsWithProductMedia: number;
  productsWithoutProductMedia: number;
  mediaFilesTotal: number;
  productMediaTotal: number;
  base64RefsDiscovered: number;
  base64RefsUploaded: number;
  base64Failures: number;
  firebaseRefsDiscovered: number;
  metaProductsDiscovered: number;
  metaExactMatches: number;
  metaAmbiguousMatches: number;
  metaUnmatchedProducts: number;
  metaImagesDownloaded: number;
  supabaseObjectsUploaded: number;
  completeLocators: number;
  partialLocators: number;
  missingMetaCredentials: string[];
}

const SUPPORTED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

/**
 * Validates Base64 image payload server-side.
 */
export function parseAndValidateBase64Image(base64Str: string): {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  sha256: string;
  sizeBytes: number;
} | null {
  try {
    const matches = base64Str.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return null;
    }

    const mimeType = matches[1].toLowerCase();
    const extension = SUPPORTED_MIME_TYPES[mimeType];
    if (!extension) {
      console.warn(`[Base64Recovery] Unsupported MIME type: ${mimeType}`);
      return null;
    }

    const buffer = Buffer.from(matches[2], "base64");
    if (buffer.length === 0 || buffer.length > 15 * 1024 * 1024) {
      console.warn(`[Base64Recovery] Invalid payload size: ${buffer.length} bytes`);
      return null;
    }

    const sha256 = createHash("sha256").update(buffer).digest("hex");
    return {
      buffer,
      mimeType,
      extension,
      sha256,
      sizeBytes: buffer.length,
    };
  } catch (err) {
    console.error("[Base64Recovery] Error parsing base64 image:", err);
    return null;
  }
}

/**
 * Check securely for server-side Meta/WhatsApp credentials without exposing secrets.
 */
export function checkMetaCredentials(): {
  hasCredentials: boolean;
  missingNames: string[];
} {
  const requiredKeys = ["WHATSAPP_API_TOKEN", "WHATSAPP_BUSINESS_ACCOUNT_ID"];
  const missingNames: string[] = [];

  for (const key of requiredKeys) {
    const val = typeof process !== "undefined" ? process.env[key] : undefined;
    if (!val || val.trim() === "" || val.includes("your-")) {
      missingNames.push(key);
    }
  }

  return {
    hasCredentials: missingNames.length === 0,
    missingNames,
  };
}

/**
 * Recover embedded Base64 images into Supabase Storage.
 */
export async function recoverBase64Media(supabase: SupabaseClient): Promise<{
  discovered: number;
  uploaded: number;
  failures: number;
}> {
  let discovered = 0;
  let uploaded = 0;
  let failures = 0;

  // 1. Query products with images array
  const { data: products, error } = await supabase
    .from("products")
    .select("id, tenant_id, images, name, external_id");

  if (error || !products) {
    console.error("[Base64Recovery] Failed to fetch products:", error?.message);
    return { discovered, uploaded, failures };
  }

  for (const product of products) {
    if (!Array.isArray(product.images) || product.images.length === 0) continue;

    for (let pos = 0; pos < product.images.length; pos++) {
      const imgRef = product.images[pos];
      if (typeof imgRef !== "string" || !imgRef.startsWith("data:image/")) continue;

      discovered++;
      const validated = parseAndValidateBase64Image(imgRef);
      if (!validated) {
        failures++;
        continue;
      }

      const tenantId = product.tenant_id;
      const productId = product.id;
      const objectKey = `recovered/${tenantId}/${productId}/${validated.sha256}.${validated.extension}`;
      const bucketName = "product-images";

      try {
        // Check if object already exists in Storage
        const { data: existingObjects } = await supabase.storage
          .from(bucketName)
          .list(`recovered/${tenantId}/${productId}`, {
            search: `${validated.sha256}.${validated.extension}`,
          });

        let objectVerified = existingObjects && existingObjects.length > 0;

        if (!objectVerified) {
          // Upload bytes to Supabase Storage
          const { error: uploadErr } = await supabase.storage
            .from(bucketName)
            .upload(objectKey, validated.buffer, {
              contentType: validated.mimeType,
              upsert: true,
            });

          if (uploadErr) {
            console.error(
              `[Base64Recovery] Storage upload failed for ${objectKey}:`,
              uploadErr.message,
            );
            failures++;
            continue;
          }

          // Verify uploaded Storage object exists
          const { data: verifyList } = await supabase.storage
            .from(bucketName)
            .list(`recovered/${tenantId}/${productId}`, {
              search: `${validated.sha256}.${validated.extension}`,
            });
          objectVerified = Boolean(verifyList && verifyList.length > 0);
        }

        if (!objectVerified) {
          console.error(`[Base64Recovery] Failed storage verification for object ${objectKey}`);
          failures++;
          continue;
        }

        // Get public delivery URL
        const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(objectKey);
        const deliveryUrl = urlData.publicUrl;

        // Create or reuse media_files record with COMPLETE locator
        let mediaId: string | null = null;
        const { data: existingMedia } = await supabase
          .from("media_files")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("storage_provider", "supabase")
          .eq("storage_bucket", bucketName)
          .eq("object_key", objectKey)
          .limit(1);

        if (existingMedia && existingMedia.length > 0) {
          mediaId = existingMedia[0].id;
        } else {
          const fileName = `${validated.sha256}.${validated.extension}`;
          const { data: newMedia, error: mediaErr } = await supabase
            .from("media_files")
            .insert({
              tenant_id: tenantId,
              file_name: fileName,
              file_url: deliveryUrl,
              file_path: objectKey,
              file_type: "image",
              mime_type: validated.mimeType,
              size_bytes: validated.sizeBytes,
              source: "historical_media_recovery",
              storage_provider: "supabase",
              storage_bucket: bucketName,
              object_key: objectKey,
            })
            .select("id")
            .single();

          if (mediaErr) {
            console.error(
              `[Base64Recovery] media_files insert failed for ${objectKey}:`,
              mediaErr.message,
            );
            failures++;
            continue;
          }
          mediaId = newMedia.id;
        }

        // Link in product_media preserving original products.images order
        if (mediaId) {
          const { data: existingPm } = await supabase
            .from("product_media")
            .select("id")
            .eq("tenant_id", tenantId)
            .eq("product_id", productId)
            .eq("media_id", mediaId)
            .limit(1);

          if (!existingPm || existingPm.length === 0) {
            const { error: pmErr } = await supabase.from("product_media").insert({
              tenant_id: tenantId,
              product_id: productId,
              media_id: mediaId,
              sort_order: pos,
            });

            if (pmErr) {
              console.error(
                `[Base64Recovery] product_media insert failed for product ${productId}:`,
                pmErr.message,
              );
              failures++;
              continue;
            }
          }
          uploaded++;
        }
      } catch (err) {
        console.error(
          `[Base64Recovery] Exception processing base64 image for product ${productId}:`,
          err,
        );
        failures++;
      }
    }
  }

  return { discovered, uploaded, failures };
}
