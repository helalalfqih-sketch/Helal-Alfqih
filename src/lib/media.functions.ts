import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { resolveTenantId } from "@/lib/saas/tenant-context";
import { checkTenantPermission } from "@/lib/users.functions";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface MediaFileRecord {
  id: string;
  tenant_id: string;
  file_name: string;
  file_path: string;
  file_url: string;
  file_type: "image" | "video" | "other";
  mime_type: string;
  size_bytes: number;
  sequence_number?: number | null;
  thumbnail_url?: string | null;
  dimensions?: { width?: number; height?: number } | null;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "svg"]);
export const ALLOWED_VIDEO_EXTENSIONS = new Set(["mp4", "webm"]);
export const BANNED_EXTENSIONS = new Set([
  "exe",
  "js",
  "html",
  "htm",
  "sh",
  "bat",
  "cmd",
  "php",
  "vbs",
  "jar",
]);

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
const MEDIA_BUCKET = "product-images";

/** Validate file upload type and size */
export function validateMediaFile(file: { name: string; size: number; type: string }): {
  valid: boolean;
  error?: string;
} {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  if (BANNED_EXTENSIONS.has(ext)) {
    return { valid: false, error: `نوع الملف (.${ext}) غير مسموح به لأسباب أمنية.` };
  }

  const isImage = file.type.startsWith("image/") || ALLOWED_IMAGE_EXTENSIONS.has(ext);
  const isVideo = file.type.startsWith("video/") || ALLOWED_VIDEO_EXTENSIONS.has(ext);

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: "يسمح فقط برفع الصور (JPG, PNG, WebP, SVG) أو الفيديوهات (MP4, WebM).",
    };
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: "الحد الأقصى لحجم الصورة هو 10 ميجابايت." };
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return { valid: false, error: "الحد الأقصى لحجم الفيديو هو 50 ميجابايت." };
  }

  return { valid: true };
}

/** Server Fn: List media files with search & filter (Tenant-Isolated) */
export const listMediaFiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(
    (data: {
      search?: string;
      type?: string;
      source?: string;
      category?: string;
      sort?: string;
      limit?: number;
    }) => data,
  )
  .handler(
    async ({
      data: { search, type, source, category, sort = "newest", limit = 200 },
      context,
    }: {
      data: any;
      context: any;
    }): Promise<MediaFileRecord[]> => {
      const ctx = context;
      const db = ctx?.supabase || supabase;
      const tenantId = await resolveTenantId(db, { userId: ctx.userId });

      let q = db
        .from("media_files")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (type && type !== "all") {
        q = q.eq("file_type", type);
      }

      const { data: rows, error } = await q;

      if (error) {
        console.error("[Media] Supabase media_files query error:", error.message);
        throw new Error(`فشل تحميل مكتبة الوسائط: ${error.message}`);
      }

      let results = (rows as unknown as MediaFileRecord[]) || [];

      // Filter by Search (Name or Tags)
      if (search && search.trim()) {
        const query = search.trim().toLowerCase();
        results = results.filter((file: any) => {
          const nameMatch = file.file_name?.toLowerCase().includes(query);
          const tags = (file.metadata?.tags as string[]) || [];
          const tagsMatch = tags.some((tag) => tag.toLowerCase().includes(query));
          const captionMatch = (file.metadata?.caption as string)?.toLowerCase().includes(query);
          return nameMatch || tagsMatch || captionMatch;
        });
      }

      // Filter by Source
      if (source && source !== "all") {
        results = results.filter((file: any) => {
          const itemSource = file.source || file.metadata?.source || "upload";
          return itemSource === source;
        });
      }

      // Filter by Category
      if (category && category !== "all") {
        results = results.filter((file: any) => {
          const itemCategory = file.metadata?.category || "وسائط متنوعة";
          return itemCategory === category;
        });
      }

      // Sort Results
      results.sort((a: any, b: any) => {
        if (sort === "oldest") {
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        }
        if (sort === "seq_asc") {
          return (a.sequence_number || 0) - (b.sequence_number || 0);
        }
        if (sort === "seq_desc") {
          return (b.sequence_number || 0) - (a.sequence_number || 0);
        }
        if (sort === "largest") {
          return (b.size_bytes || 0) - (a.size_bytes || 0);
        }
        if (sort === "smallest") {
          return (a.size_bytes || 0) - (b.size_bytes || 0);
        }
        if (sort === "name_asc") {
          return (a.file_name || "").localeCompare(b.file_name || "", "ar");
        }
        if (sort === "name_desc") {
          return (b.file_name || "").localeCompare(a.file_name || "", "ar");
        }
        // default: newest
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });

      return results;
    },
  );

/**
 * Upload base64 data URL to Supabase Storage.
 * NO runtime bucket creation — buckets must exist.
 * NO base64 fallbacks — throws on failure.
 */
async function uploadDataUrlToStorage(
  passedDb: any,
  storagePath: string,
  dataUrl: string,
  mimeType: string,
): Promise<string> {
  const db = passedDb;

  const base64Data = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const binaryStr = atob(base64Data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const { error: storageError } = await db.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, bytes.buffer, {
      contentType: mimeType,
      upsert: true,
      cacheControl: "2592000",
    });

  if (storageError) {
    throw new Error(`فشل رفع الملف إلى التخزين: ${storageError.message}`);
  }

  const { data: urlData } = db.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);
  const publicUrl = urlData?.publicUrl;
  if (!publicUrl) {
    throw new Error("فشل الحصول على رابط التخزين العريض بعد الرفع.");
  }

  return publicUrl;
}

/** Server Fn: Record newly uploaded media file with Supabase Storage upload */
export const recordMediaFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (data: {
      file_name: string;
      file_path: string;
      file_url: string;
      file_type: "image" | "video" | "other";
      mime_type: string;
      size_bytes: number;
      dimensions?: { width?: number; height?: number };
      metadata?: Record<string, any>;
    }) => data,
  )
  .handler(async ({ data, context }: { data: any; context: any }): Promise<MediaFileRecord> => {
    const ctx = context;
    const hasPerm = await checkTenantPermission("cms", ctx);
    if (!hasPerm) {
      throw new Error("صلاحية مرفوضة: تتطلب صلاحية رفع ومكتبة الوسائط.");
    }

    const db = ctx.supabase || supabase;
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    let finalUrl = data.file_url;
    let storagePath = data.file_path;

    const isDataUrl = data.file_url.startsWith("data:");
    if (isDataUrl) {
      const safeName = data.file_name.replace(/[^a-zA-Z0-9._\-\u0600-\u06FF]/g, "-");
      storagePath = `uploads/${tenantId}/${Date.now()}_${safeName}`;
      // Throws on storage error — NEVER persists Base64 data: URLs into DB
      finalUrl = await uploadDataUrlToStorage(db, storagePath, data.file_url, data.mime_type);
    }

    // Safety check: ensure file_url is NEVER a data: URL when inserting into DB
    if (finalUrl.startsWith("data:")) {
      throw new Error("فشل الرفع: لا يمكن تعقّب ملف بصيغة Base64 غير مرفوعة.");
    }

    const source: string = (data.metadata?.source as string) || "upload";
    const payload: any = {
      tenant_id: tenantId,
      file_name: data.file_name,
      file_path: storagePath,
      file_url: finalUrl,
      file_type: data.file_type,
      mime_type: data.mime_type,
      size_bytes: data.size_bytes,
      dimensions: data.dimensions || null,
      source,
      metadata: data.metadata || {},
      created_by: ctx.userId || null,
    };

    const { data: record, error } = await db
      .from("media_files")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throw new Error(`فشل تسجيل ملف الوسائط: ${error.message}`);
    }

    return record as unknown as MediaFileRecord;
  });

/** Server Fn: Delete media file (Tenant-Isolated) */
export const deleteMediaFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string; filePath?: string }) => data)
  .handler(async ({ data: { id }, context }: { data: any; context: any }) => {
    const ctx = context;
    const hasPerm = await checkTenantPermission("cms", ctx);
    if (!hasPerm) {
      throw new Error("صلاحية مرفوضة: تتطلب صلاحية حذف الوسائط.");
    }

    const db = ctx.supabase || supabase;
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    const { error } = await db.from("media_files").delete().eq("id", id).eq("tenant_id", tenantId);
    if (error) throw new Error(error.message);

    await db.from("tenant_audit_logs").insert({
      tenant_id: tenantId,
      actor_id: ctx.userId || null,
      actor_email: ctx.claims?.email || null,
      action: "media_delete",
      details: { file_id: id } as any,
    });

    return { ok: true };
  });

/** Server Fn: Find unused media files scanner (Tenant-Isolated) */
export const findUnusedMediaFiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: { context: any }): Promise<MediaFileRecord[]> => {
    const ctx = context;
    const db = ctx.supabase || supabase;
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    const { data: mediaRows, error: mediaErr } = await db
      .from("media_files")
      .select("*")
      .eq("tenant_id", tenantId);
    if (mediaErr) throw new Error(`Database error: ${mediaErr.message}`);
    if (!mediaRows || mediaRows.length === 0) return [];

    const { data: products } = await db
      .from("products")
      .select("images, model_3d_url")
      .eq("tenant_id", tenantId);
    const usedUrls = new Set<string>();

    products?.forEach((p: any) => {
      if (Array.isArray(p.images)) {
        p.images.forEach((img: string) => usedUrls.add(img));
      }
      if (p.model_3d_url) usedUrls.add(p.model_3d_url);
    });

    const { data: categories } = await db
      .from("categories")
      .select("image_url")
      .eq("tenant_id", tenantId);
    categories?.forEach((c: any) => {
      if (c.image_url) usedUrls.add(c.image_url);
    });

    const unused = mediaRows.filter(
      (m: any) => !usedUrls.has(m.file_url) && !usedUrls.has(m.file_path),
    );
    return unused as unknown as MediaFileRecord[];
  });

/** Core tenant-isolated media files lookup logic */
export async function fetchMediaFilesByIdsCore(
  db: any,
  tenantId: string,
  ids: string[],
): Promise<MediaFileRecord[]> {
  if (!ids || ids.length === 0) return [];

  const { data: rows, error } = await db
    .from("media_files")
    .select("*")
    .eq("tenant_id", tenantId)
    .in("id", ids)
    .order("sequence_number", { ascending: true });

  if (error) {
    if (error.code === "42703") {
      throw new Error(
        "MEDIA_SEQUENCE_SCHEMA_MISSING: PostgreSQL 42703 column sequence_number does not exist in schema",
      );
    }
    throw new Error(`Failed to fetch media records: ${error.message}`);
  }

  return (rows as unknown as MediaFileRecord[]) || [];
}

/**
 * Server Fn: Get media files by IDs (Strict Tenant Isolation & Schema Safety)
 */
export const getMediaFilesByIds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      ids: z.array(z.string().uuid()).max(100),
    }),
  )
  .handler(
    async ({
      data: { ids },
      context,
    }: {
      data: { ids: string[] };
      context: any;
    }): Promise<MediaFileRecord[]> => {
      if (!ids || ids.length === 0) return [];
      const ctx = context;
      const db = ctx?.supabase || supabase;
      const tenantId = await resolveTenantId(db, { userId: ctx.userId });
      return fetchMediaFilesByIdsCore(db, tenantId, ids);
    },
  );

/** Server Fn: Link product to media files in product_media table (Tenant-Isolated) */
export const linkProductMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { productId: string; mediaIds: string[] }) => data)
  .handler(async ({ data: { productId, mediaIds }, context }: { data: any; context: any }) => {
    if (!productId || !mediaIds || mediaIds.length === 0) return { ok: true };
    const ctx = context;
    const db = ctx?.supabase || supabase;

    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    const records = mediaIds.map((mediaId: string, idx: number) => ({
      tenant_id: tenantId,
      product_id: productId,
      media_id: mediaId,
      sort_order: idx + 1,
    }));

    const { error } = await db
      .from("product_media")
      .upsert(records, { onConflict: "product_id,media_id" });
    if (error) {
      throw new Error(`فشل ربط ملفات المنتج: ${error.message}`);
    }

    return { ok: true };
  });

/** Server Fn: Bulk delete media files (Tenant-Isolated) */
export const bulkDeleteMediaFiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { ids: string[] }) => data)
  .handler(async ({ data: { ids }, context }: { data: any; context: any }) => {
    if (!ids || ids.length === 0) return { ok: true };
    const ctx = context;
    const hasPerm = await checkTenantPermission("cms", ctx);
    if (!hasPerm) {
      throw new Error("صلاحية مرفوضة: تتطلب صلاحية حذف الوسائط.");
    }

    const db = ctx?.supabase || supabase;
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    const { error } = await db.from("media_files").delete().in("id", ids).eq("tenant_id", tenantId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });

/** Server Fn: Search existing products for linking media (Tenant-Isolated) */
export const searchExistingProductsForLink = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: { query?: string }) => data)
  .handler(async ({ data: { query }, context }: { data: any; context: any }) => {
    const ctx = context;
    const db = ctx?.supabase || supabase;
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    let q = db
      .from("products")
      .select("id, name, price, currency, images, sku, is_published")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (query && query.trim()) {
      q = q.ilike("name", `%${query.trim()}%`);
    }

    const { data: products, error } = await q;
    if (error) {
      throw new Error(`فشل البحث عن المنتجات: ${error.message}`);
    }

    return products || [];
  });

/** Server Fn: Attach selected media files to an existing product (Tenant-Isolated) */
export const attachMediaToExistingProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { productId: string; mediaIds: string[] }) => data)
  .handler(async ({ data: { productId, mediaIds }, context }: { data: any; context: any }) => {
    if (!productId || !mediaIds || mediaIds.length === 0) {
      throw new Error("يرجى تحديد المنتج والوسائط المراد ربطها.");
    }
    const ctx = context;
    const db = ctx?.supabase || supabase;
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    // Fetch selected media files WITH tenant isolation
    const { data: mediaRows, error: mediaErr } = await db
      .from("media_files")
      .select("*")
      .eq("tenant_id", tenantId)
      .in("id", mediaIds);

    if (mediaErr) throw new Error(`فشل استعلام الوسائط: ${mediaErr.message}`);
    if (!mediaRows || mediaRows.length === 0) {
      throw new Error("لم يتم العثور على الملفات المحددة للربط");
    }

    // Fetch existing product WITH tenant isolation
    const { data: product, error: prodErr } = await db
      .from("products")
      .select("images, source_url, video_playback_id")
      .eq("id", productId)
      .eq("tenant_id", tenantId)
      .single();

    if (prodErr || !product) {
      throw new Error("المنتج المحدد غير موجود");
    }

    const sortedMedia = [...mediaRows].sort(
      (a: any, b: any) => (a.sequence_number || 0) - (b.sequence_number || 0),
    );

    const newImageUrls = sortedMedia
      .filter((m: any) => m.file_type === "image")
      .map((m: any) => m.file_url);
    const firstVideo = sortedMedia.find((m: any) => m.file_type === "video");

    const currentImages = Array.isArray(product.images) ? product.images : [];
    const combinedImages = Array.from(new Set([...currentImages, ...newImageUrls]));

    const updatePayload: any = {
      images: combinedImages,
      updated_at: new Date().toISOString(),
    };

    if (firstVideo) {
      updatePayload.source_url = firstVideo.file_url;
    }

    const { error: updateErr } = await db
      .from("products")
      .update(updatePayload)
      .eq("id", productId)
      .eq("tenant_id", tenantId);
    if (updateErr) {
      throw new Error(`فشل تحديث المنتج: ${updateErr.message}`);
    }

    const pmRecords = mediaIds.map((mediaId: string, idx: number) => ({
      tenant_id: tenantId,
      product_id: productId,
      media_id: mediaId,
      sort_order: idx + 1,
    }));

    await db.from("product_media").upsert(pmRecords, { onConflict: "product_id,media_id" });

    return { ok: true, linkedCount: mediaIds.length, imagesAdded: newImageUrls.length };
  });

/** Server Fn: Fetch last 50 WhatsApp media files for Diagnostics (Tenant-Isolated) */
export const getWhatsAppDiagnosticsMedia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: { context: any }) => {
    const ctx = context;
    const db = ctx?.supabase || supabase;
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    const { data, error } = await db
      .from("media_files")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("source", "whatsapp")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`فشل تشخيصات ميديا واتساب: ${error.message}`);
    }

    return (data as unknown as MediaFileRecord[]) || [];
  });

/** Server Fn: Update thumbnail_url for a media file (Tenant-Isolated) */
export const updateMediaFileThumbnail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { mediaId: string; thumbnailUrl: string }) => data)
  .handler(async ({ data: { mediaId, thumbnailUrl }, context }: { data: any; context: any }) => {
    const ctx = context;
    const db = ctx?.supabase || supabase;
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    const { error } = await db
      .from("media_files")
      .update({ thumbnail_url: thumbnailUrl })
      .eq("id", mediaId)
      .eq("tenant_id", tenantId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Server Fn: Backfill video thumbnails for all media files lacking thumbnail_url (Tenant-Isolated) */
export const backfillVideoThumbnails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: { context: any }) => {
    const ctx = context;
    const db = ctx?.supabase || supabase;
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    const { data: missingVideos, error } = await db
      .from("media_files")
      .select("id, file_url")
      .eq("tenant_id", tenantId)
      .eq("file_type", "video")
      .is("thumbnail_url", null);

    if (error) throw new Error(error.message);

    return {
      count: missingVideos ? missingVideos.length : 0,
      videos: missingVideos || [],
    };
  });
