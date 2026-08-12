import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveCurrentTenant } from "@/lib/saas/tenant-resolver";

export interface ReviewRow {
  id: string;
  product_id: string;
  product_name: string;
  customer_name: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export const listTenantReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReviewRow[]> => {
    const { supabase, userId } = context as unknown as { supabase: any; userId: string };
    const tenantId = await resolveCurrentTenant(supabase, { userId });
    
    const { data: allowed } = await supabase.rpc("has_tenant_permission", {
      _tenant_id: tenantId,
      _user_id: userId,
      _required_role: "staff",
    });
    
    if (!allowed) return [];

    const { data, error } = await supabase
      .from("product_reviews")
      .select(`
        id,
        product_id,
        customer_name,
        rating,
        comment,
        status,
        created_at,
        products ( name )
      `)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((r: any) => ({
      id: r.id,
      product_id: r.product_id,
      product_name: r.products?.name || "منتج غير معروف",
      customer_name: r.customer_name,
      rating: r.rating,
      comment: r.comment || "",
      status: r.status,
      created_at: r.created_at,
    }));
  });

export const moderateReview = createServerFn({ method: "POST" })
  .validator((raw: unknown) => 
    z.object({
      id: z.string().uuid(),
      status: z.enum(["approved", "rejected"]),
    }).parse(raw)
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ success: boolean; message?: string }> => {
    const { supabase, userId } = context as unknown as { supabase: any; userId: string };
    const tenantId = await resolveCurrentTenant(supabase, { userId });
    
    const { data: allowed } = await supabase.rpc("has_tenant_permission", {
      _tenant_id: tenantId,
      _user_id: userId,
      _required_role: "manager",
    });
    
    if (!allowed) {
      return { success: false, message: "غير مصرح لك بمراجعة التقييمات" };
    }

    const { error } = await supabase
      .from("product_reviews")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("tenant_id", tenantId);

    if (error) {
      return { success: false, message: "فشل تحديث التقييم" };
    }
    return { success: true };
  });

export const deleteReview = createServerFn({ method: "POST" })
  .validator((raw: unknown) => 
    z.object({
      id: z.string().uuid(),
    }).parse(raw)
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ success: boolean; message?: string }> => {
    const { supabase, userId } = context as unknown as { supabase: any; userId: string };
    const tenantId = await resolveCurrentTenant(supabase, { userId });
    
    const { data: allowed } = await supabase.rpc("has_tenant_permission", {
      _tenant_id: tenantId,
      _user_id: userId,
      _required_role: "manager",
    });
    
    if (!allowed) {
      return { success: false, message: "غير مصرح لك بحذف التقييمات" };
    }

    const { error } = await supabase
      .from("product_reviews")
      .delete()
      .eq("id", data.id)
      .eq("tenant_id", tenantId);

    if (error) {
      return { success: false, message: "فشل حذف التقييم" };
    }
    return { success: true };
  });
