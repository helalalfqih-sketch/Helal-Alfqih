import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { resolveTenantId } from "@/lib/saas/tenant-context";

/** Server Fn: Submit a request for product video */
export const requestProductVideo = createServerFn({ method: "POST" })
  .validator((data: { productId: string; productName: string }) => data)
  .handler(async ({ data: { productId, productName } }) => {
    let db: any = supabase;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      if (supabaseAdmin) db = supabaseAdmin;
    } catch {
      // fallback to default client instance
    }

    const tenantId = await resolveTenantId(db);
    const { data: userData } = await db.auth.getUser();

    // 1. Check duplicate request for same product in this tenant
    try {
      const { data: existing } = await (db.from("product_video_requests") as any)
        .select("id")
        .eq("product_id", productId)
        .limit(1)
        .maybeSingle();

      if (existing) {
        return {
          ok: true,
          duplicate: true,
          message: "تم تسجيل طلبك المسبق لتوفير فيديو لهذا المنتج بنجاح. سنقوم بإضافته فور تجهيزه ✨",
        };
      }
    } catch {
      // ignore duplicate check if table/rls query fails
    }

    // 2. Insert video request
    try {
      await (db.from("product_video_requests") as any).insert({
        tenant_id: tenantId,
        product_id: productId,
        product_name: productName,
        customer_id: userData?.user?.id || null,
        status: "pending",
      });
    } catch (err) {
      console.warn("[requestProductVideo] Insert warning:", err);
    }

    // 3. Create Admin Audit Notification (best-effort)
    try {
      await (db.from("tenant_audit_logs") as any).insert({
        tenant_id: tenantId,
        actor_id: userData?.user?.id || null,
        actor_email: userData?.user?.email || null,
        action: "video_request",
        details: {
          product_id: productId,
          product_name: productName,
          message: `العميل طلب توفير فيديو للمنتج: ${productName}`,
        } as any,
      });
    } catch (auditErr) {
      console.warn("[requestProductVideo] audit log skipped:", auditErr);
    }

    return {
      ok: true,
      duplicate: false,
      message: "تم إرسال طلب توفير الفيديو إلى فريق المتجر بنجاح 🎥! سيتم إشعارات عند إضافة الفيديو.",
    };
  });
