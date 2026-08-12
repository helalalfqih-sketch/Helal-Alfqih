import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getMyOrders as getMyOrdersFromDb,
  getMyOrderDetails as getMyOrderDetailsFromDb,
  trackOrder as trackOrderFromDb,
  type MyOrderSummary,
  type MyOrderDetails,
} from "@/lib/services/order-history.service";
import { normalizeOrderNumber } from "@/lib/order-status";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  createOrderService,
  createOrderInput,
  type CreateOrderPayload,
  type CreateOrderResult,
} from "@/services/order-creation.service";

export { createOrderInput, type CreateOrderPayload, type CreateOrderResult };

/**
 * Order server functions — the AUTH BOUNDARY for orders (spec Phase 5).
 *
 *  - createOrder:        creates orders for guests OR authenticated customers via
 *                        the framework-independent order-creation service.
 *  - getMyOrders:        signed-in customer's own orders (RLS-scoped client).
 *  - getMyOrderDetails:  one of the caller's own orders (RLS-scoped client).
 *  - getTrackedOrder:    public tracking lookup (order number + phone last-4)
 *                        via the service role with explicit ownership checks.
 */

// ---------- server functions ----------

async function callCreateOrderApi(rawInput: unknown): Promise<CreateOrderResult> {
  const payload = (rawInput && typeof rawInput === "object" && "data" in rawInput && (rawInput as any).data)
    ? (rawInput as any).data
    : rawInput;

  const items = Array.isArray(payload?.items)
    ? payload.items.map((it: any) => {
        const prodObj = typeof it.product === "object" && it.product ? (it.product as any) : null;
        return {
          productId: String(it.productId || it.id || it.product_id || prodObj?.id || it.productName || ""),
          quantity: Number(it.quantity || 1),
        };
      })
    : [];

  const formattedPayload = {
    items,
    customerName: String(payload?.customerName || payload?.name || "").trim(),
    customerPhone: String(payload?.customerPhone || payload?.phone || "").trim(),
    customerAddress: String(payload?.customerAddress || payload?.address || "").trim(),
    customerEmail: payload?.customerEmail || payload?.email,
    notes: payload?.notes || payload?.deliveryInstruction,
    couponCode: payload?.couponCode,
    paymentProvider: payload?.paymentProvider || payload?.paymentMethod,
    idempotencyKey: payload?.idempotencyKey,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    const { supabase } = await import("@/integrations/supabase/client");
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        headers["Authorization"] = `Bearer ${data.session.access_token}`;
      }
    }
  } catch {
    // ignore session retrieval error
  }

  const res = await fetch("/api/orders", {
    method: "POST",
    headers,
    body: JSON.stringify(formattedPayload),
  });

  const resData = await res.json().catch(() => ({}));

  if (!res.ok || !resData.orderId) {
    throw new Error(resData.error || `فشل إنشاء الطلب (${res.status})`);
  }

  return {
    orderId: resData.orderId,
    total: resData.total ?? 0,
    currency: resData.currency ?? "YER",
    itemsCount: resData.itemsCount ?? items.length,
  };
}

/**
 * Create an order (guest or authenticated).
 * Uses /api/orders endpoint on the client or directly invokes createOrderService on the server.
 */
export const createOrder = async (rawInput: unknown): Promise<CreateOrderResult> => {
  if (typeof window !== "undefined") {
    return callCreateOrderApi(rawInput);
  }
  const payload = (rawInput && typeof rawInput === "object" && "data" in rawInput && (rawInput as any).data)
    ? (rawInput as any).data
    : rawInput;
  return createOrderService(payload);
};

/**
 * List the signed-in customer's orders (Phase 4 + Phase 5).
 */
export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyOrderSummary[]> => {
    const { supabase, userId } = context as unknown as {
      supabase: SupabaseClient<Database>;
      userId: string;
    };
    return getMyOrdersFromDb(supabase, userId);
  });

/**
 * Details for one of the caller's own orders (Phase 4 + Phase 5).
 */
export const getMyOrderDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ orderId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }): Promise<MyOrderDetails | null> => {
    const { supabase, userId } = context as unknown as {
      supabase: SupabaseClient<Database>;
      userId: string;
    };
    return getMyOrderDetailsFromDb(supabase, userId, data.orderId);
  });

/**
 * Public tracking lookup: order number (ORD-XXXXXXXX / 8 hex / full uuid) +
 * last 4 digits of the customer phone. Service-role read with explicit
 * ownership checks inside the service — never an open RLS policy. The
 * response never contains name / email / address / full phone / tenant data.
 */
export const getTrackedOrder = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        orderNumber: z.string().trim().min(8).max(45),
        phoneLast4: z
          .string()
          .trim()
          .regex(/^\d{4}$/, "أدخل آخر 4 أرقام من هاتفك"),
      })
      .parse(raw),
  )
  .handler(async ({ data }): Promise<MyOrderDetails | null> => {
    const normalized = normalizeOrderNumber(data.orderNumber);
    if (!normalized) return null;
    const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin = getSupabaseAdmin();
    return trackOrderFromDb(supabaseAdmin, normalized, data.phoneLast4);
  });
