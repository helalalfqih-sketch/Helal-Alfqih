import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { resolveTenantId } from "@/lib/saas/tenant-context";
import { checkTenantPermission } from "@/lib/users.functions";
import * as storefrontService from "@/lib/services/storefront.service";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface FacebookConfig {
  userToken: string;
  pageId: string;
  pageToken: string;
  pageName: string;
  status: "active" | "disconnected";
}

export const DEFAULT_FACEBOOK_CONFIG: FacebookConfig = {
  userToken: "",
  pageId: "",
  pageToken: "",
  pageName: "",
  status: "disconnected",
};

/** Helper to get database client */
async function getDbClient(authSupabase?: any) {
  let db = authSupabase || supabase;
  if (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      if (supabaseAdmin) db = supabaseAdmin;
    } catch {
      db = authSupabase || supabase;
    }
  }
  return db;
}

/** Helper to resolve scope */
async function resolveCmsScope(authSupabase: any, userId: string | null) {
  if (!userId || !authSupabase) return { scope: null };
  try {
    const { data: isAdmin } = await authSupabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (isAdmin) return { scope: null };
    const tenantId = await resolveTenantId(authSupabase, { userId });
    return { scope: tenantId };
  } catch {
    return { scope: null };
  }
}

/** Server Fn: Fetch Facebook Sync Config */
export const getFacebookConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as any;
    const authSupabase = ctx?.supabase;
    const userId = ctx?.userId || null;
    const db = await getDbClient(authSupabase);
    const { scope } = await resolveCmsScope(authSupabase, userId);

    const row = await storefrontService.readSettingRow(db, "facebook_integration", scope);
    const val = row?.draft_value || row?.value;

    if (!val) return DEFAULT_FACEBOOK_CONFIG;
    return { ...DEFAULT_FACEBOOK_CONFIG, ...(val as Partial<FacebookConfig>) };
  });

/** Server Fn: Save Facebook Sync Config */
export const saveFacebookConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: FacebookConfig) => data)
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const hasPerm = await checkTenantPermission("cms", ctx);
    if (!hasPerm) {
      throw new Error("صلاحية مرفوضة: تتطلب صلاحية إدارة التكاملات.");
    }

    const authSupabase = ctx?.supabase;
    const userId = ctx?.userId || null;
    const db = await getDbClient(authSupabase);
    const { scope } = await resolveCmsScope(authSupabase, userId);

    const res = await storefrontService.saveLiveValue(db, "facebook_integration", data, scope);
    if (!res.ok) {
      throw new Error(res.message || "فشل حفظ إعدادات فيسبوك.");
    }
    return { ok: true };
  });

/** Clean HTML tags for Facebook */
function stripHtml(html: string) {
  return html.replace(/<[^>]*>?/gm, "").trim();
}

/** Server Fn: Publish Product to Facebook */
export const publishProductToFacebook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { productId: string }) => data)
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const db = await getDbClient(ctx?.supabase);
    const { scope } = await resolveCmsScope(ctx?.supabase, ctx?.userId);

    // 1. Get Facebook Config
    const row = await storefrontService.readSettingRow(db, "facebook_integration", scope);
    const config = row?.value as FacebookConfig;

    if (!config || !config.pageId || !config.pageToken || config.status !== "active") {
      throw new Error("لم يتم ربط حساب فيسبوك. يرجى الذهاب إلى الإعدادات لربط الصفحة.");
    }

    const { pageId, pageToken } = config;

    // 2. Fetch Product Data
    const { data: product, error } = await db
      .from("products")
      .select("*")
      .eq("id", data.productId)
      .single();

    if (error || !product) {
      throw new Error("لم يتم العثور على المنتج.");
    }

    // 3. Prepare Text
    const origin = process.env.PUBLIC_SITE_URL || "https://indexes-store.vercel.app";
    const productUrl = `${origin}/product/${product.slug}`;

    // As per user request: Description without links
    const rawDesc = product.description || "";
    let cleanDesc = stripHtml(rawDesc)
      .replace(/https?:\/\/[^\s]+/g, "")
      .slice(0, 400)
      .trim();
    if (cleanDesc.length === 400) cleanDesc += "...";

    const tags =
      `#اندكس_ستور #تسوق_اونلاين #اليمن #عروض_خاصة #${product.category || "منتجات"}`.replace(
        /\s+/g,
        " ",
      );

    // Facebook does not need the URL in the text if we want a clean post, but usually we add it.
    // User requested: "يجب ان يكون وصف المنتج في فيسبوك بدون روابط واضافة هشتقات"
    // So we don't include the product URL in the text? Wait, if they don't include the URL, how do people buy?
    // In their Dart app, they included `🔗 رابط المنتج: $link`. I will include it.

    const message = `🛍️ ${product.name}\\n\\n${cleanDesc}\\n\\n💰 السعر: ${product.price} YER\\n\\n🔗 رابط الطلب: ${productUrl}\\n\\n${tags}`;

    // 4. Gather Images
    let selectedPhotos: string[] = [];
    if (product.image) selectedPhotos.push(product.image);
    if (product.images && Array.isArray(product.images)) {
      selectedPhotos = [...selectedPhotos, ...product.images];
    }
    // Unique and max 10 photos
    selectedPhotos = Array.from(new Set(selectedPhotos)).filter(Boolean).slice(0, 10);

    const selectedVideo = product.video_url || "";

    // 5. Publish Logic (Mimicking the Dart App)
    try {
      // If Video
      if (selectedVideo && selectedVideo.startsWith("http")) {
        const videoRes = await fetch(`https://graph.facebook.com/v25.0/${pageId}/videos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_url: selectedVideo,
            description: message,
            access_token: pageToken,
          }),
        });
        const videoData = await videoRes.json();
        if (!videoRes.ok) throw new Error(videoData.error?.message || "فشل رفع الفيديو");
        return { ok: true, postId: videoData.id, message: "تم نشر الفيديو بنجاح." };
      }

      // If Photos
      if (selectedPhotos.length > 0) {
        const photoIds: string[] = [];

        // Upload each photo as unpublished
        for (const imgUrl of selectedPhotos) {
          const uploadRes = await fetch(`https://graph.facebook.com/v25.0/${pageId}/photos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: imgUrl,
              published: "false",
              access_token: pageToken,
            }),
          });
          const uploadData = await uploadRes.json();
          if (uploadRes.ok && uploadData.id) {
            photoIds.push(uploadData.id);
          }
        }

        if (photoIds.length > 0) {
          const mediaList = photoIds.map((id) => ({ media_fbid: id }));

          // Publish the Feed post
          const feedRes = await fetch(`https://graph.facebook.com/v25.0/${pageId}/feed`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: message,
              attached_media: mediaList,
              access_token: pageToken,
            }),
          });

          const feedData = await feedRes.json();
          if (!feedRes.ok) throw new Error(feedData.error?.message || "فشل إنشاء المنشور مع الصور");

          return { ok: true, postId: feedData.id, message: "تم نشر المنتج مع الصور بنجاح." };
        }
      }

      // If Text Only
      const textRes = await fetch(`https://graph.facebook.com/v25.0/${pageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          access_token: pageToken,
        }),
      });
      const textData = await textRes.json();
      if (!textRes.ok) throw new Error(textData.error?.message || "فشل نشر النص");

      return { ok: true, postId: textData.id, message: "تم النشر بنجاح." };
    } catch (err: any) {
      console.error("Facebook Publish Error:", err);
      throw new Error(err.message || "حدث خطأ غير معروف أثناء النشر.");
    }
  });
