import { z } from "zod";
import { resolveCurrentTenant } from "@/lib/saas/tenant-resolver";
import { computeShippingFee, normalizeYemeniPhone } from "@/lib/shipping";
import { yemeniPhoneSchema } from "@/lib/validation/phone";
import type { SupabaseAdminClient } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

// ---------- validation ----------

export const createOrderInput = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "معرّف المنتج مطلوب"),
        quantity: z.number().int().min(1).max(999),
      }),
    )
    .min(1)
    .max(100),
  customerName: z.string().trim().min(2, "الاسم مطلوب (حرفان على الأقل)").max(200),
  customerPhone: yemeniPhoneSchema,
  customerAddress: z.string().trim().min(3, "العنوان مطلوب").max(500),
  customerEmail: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().trim().email().max(200).optional(),
  ),
  notes: z.string().trim().max(1000).optional(),
  couponCode: z.string().trim().max(60).optional(),
  paymentProvider: z.string().trim().max(60).optional(),
  /** Client-generated key/UUID to prevent duplicate order creation. */
  idempotencyKey: z.string().trim().min(1).max(100).optional(),
});

export type CreateOrderPayload = z.infer<typeof createOrderInput>;

export interface CreateOrderResult {
  orderId: string;
  total: number;
  currency: string;
  itemsCount: number;
}

export interface OrderCreationOptions {
  userId?: string | null;
  authHeader?: string | null;
  req?: Request | { headers?: { get: (header: string) => string | null } } | null;
  adminClient?: SupabaseAdminClient;
}

// ---------- helpers ----------

async function getOptionalUserId(
  admin: {
    auth: {
      getUser: (jwt: string) => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
    };
  },
  options?: OrderCreationOptions,
): Promise<string | null> {
  if (options?.userId !== undefined) {
    return options.userId;
  }
  try {
    let authHeader = options?.authHeader;
    if (!authHeader) {
      const req = options?.req ?? (await getTanstackRequestSafely());
      authHeader = req?.headers?.get?.("authorization") ?? null;
    }
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token || token.split(".").length !== 3) return null;
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

async function getTanstackRequestSafely() {
  try {
    const pkgName = "@tanstack/react-start/server";
    const { getRequest } = await import(/* @vite-ignore */ pkgName);
    return getRequest();
  } catch {
    return null;
  }
}

async function loadShippingSettings(
  tenantId: string,
  db: SupabaseAdminClient,
): Promise<{ freeShippingThreshold: number; defaultShippingFee: number }> {
  try {
    const selectSetting = async (scopedTenantId: string | null) => {
      let query = db.from("storefront_settings").select("value").eq("key", "cart_config");
      query = scopedTenantId ? query.eq("tenant_id", scopedTenantId) : query.is("tenant_id", null);
      return query.maybeSingle();
    };

    let { data } = await selectSetting(tenantId);
    if (!data) ({ data } = await selectSetting(null));

    const val = (data?.value as Record<string, any>) || {};
    const freeShippingThreshold = Number(
      val.freeShippingThreshold ?? val.free_shipping_threshold ?? 30000,
    );
    const defaultShippingFee = Number(
      val.defaultShippingFee ?? val.default_shipping_fee ?? 3000,
    );

    return {
      freeShippingThreshold: isNaN(freeShippingThreshold) ? 30000 : freeShippingThreshold,
      defaultShippingFee: isNaN(defaultShippingFee) ? 3000 : defaultShippingFee,
    };
  } catch {
    return {
      freeShippingThreshold: 30000,
      defaultShippingFee: 3000,
    };
  }
}

// ---------- framework-independent order creation service ----------

/**
 * Creates an order safely with database pricing, stock validation, idempotency, and tenant resolution.
 * Framework-independent: can be called from TanStack Start server functions, Express endpoints, or CLI scripts.
 */
export async function createOrderService(
  rawPayload: unknown,
  options?: OrderCreationOptions,
): Promise<CreateOrderResult> {
  const data = createOrderInput.parse(rawPayload);

  const supabaseAdmin =
    options?.adminClient ?? (await import("@/integrations/supabase/client.server")).getSupabaseAdmin();

  // 0. Idempotency check
  if (data.idempotencyKey) {
    const { data: existing } = await supabaseAdmin
      .from("orders")
      .select("id, total, currency")
      .eq("idempotency_key", data.idempotencyKey)
      .maybeSingle();
    if (existing) {
      return {
        orderId: existing.id,
        total: existing.total ?? 0,
        currency: existing.currency ?? "YER",
        itemsCount: data.items.length,
      };
    }
  }

  // 0b. Normalize Yemeni phone number
  const normalizedPhone = normalizeYemeniPhone(data.customerPhone);
  const customerPhone = normalizedPhone ?? data.customerPhone;

  // 1. Verified user id from token or null
  const userId = await getOptionalUserId(supabaseAdmin, options);

  // 2. Resolve storefront tenant
  let tenantId = await resolveCurrentTenant(supabaseAdmin, { userId });

  const { data: tenant } = await supabaseAdmin
    .from("tenants")
    .select("id, status")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant || tenant.status !== "active") {
    const { data: activeTenant } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (activeTenant) {
      tenantId = activeTenant.id;
    }
  }

  // 3. Resolve products strictly without fallbacks, defaults, or published product substitution
  const productIds = Array.from(new Set(data.items.map((i) => i.productId)));
  const matchedProductMap = new Map<
    string,
    {
      id: string;
      name: string;
      price: number;
      currency: string | null;
      sku: string | null;
      vendor_id: string | null;
      tenant_id: string;
      stock: number | null;
    }
  >();

  for (const rawPid of productIds) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawPid);

    const queries = [];
    if (isUuid) {
      queries.push(
        supabaseAdmin
          .from("products")
          .select("id, name, price, currency, sku, external_id, tenant_id, stock")
          .eq("id", rawPid),
      );
    }
    queries.push(
      supabaseAdmin
        .from("products")
        .select("id, name, price, currency, sku, external_id, tenant_id, stock")
        .eq("external_id", rawPid),
    );
    queries.push(
      supabaseAdmin
        .from("products")
        .select("id, name, price, currency, sku, external_id, tenant_id, stock")
        .eq("sku", rawPid),
    );

    const queryResults = await Promise.all(queries);
    const combinedMatches: any[] = [];
    const seenIds = new Set<string>();

    for (const res of queryResults) {
      if (res.error) {
        if (
          res.error.message?.includes("external_id") ||
          res.error.message?.includes("column") ||
          res.error.code === "PGRST204"
        ) {
          continue;
        }
        console.error(`[createOrder] Error querying product for identifier "${rawPid}":`, res.error);
        const err = new Error(`خطأ أثناء التحقق من المنتج (${rawPid}): ${res.error.message}`);
        (err as any).status = 422;
        (err as any).statusCode = 422;
        throw err;
      }
      if (res.data) {
        for (const row of res.data) {
          if (!seenIds.has(row.id)) {
            seenIds.add(row.id);
            combinedMatches.push(row);
          }
        }
      }
    }

    if (combinedMatches.length === 0) {
      const err = new Error(`المنتج غير موجود أو لم يتم العثور عليه: ${rawPid}`);
      (err as any).status = 422;
      (err as any).statusCode = 422;
      throw err;
    }

    if (combinedMatches.length > 1) {
      const err = new Error(`تم العثور على أكثر من منتج مطابق للمعرّف: ${rawPid}`);
      (err as any).status = 422;
      (err as any).statusCode = 422;
      throw err;
    }

    const p = combinedMatches[0];
    matchedProductMap.set(rawPid, {
      id: p.id,
      name: p.name,
      price: Number(p.price),
      currency: p.currency ?? "YER",
      sku: p.sku ?? null,
      vendor_id: p.vendor_id ?? null,
      tenant_id: p.tenant_id,
      stock: p.stock ?? 0,
    });
  }

  // 4. Build line items + totals
  let currency = "YER";
  let subtotal = 0;
  let hasRestockNeededItem = false;
  const stockErrors: string[] = [];

  const itemRows = data.items.map((i) => {
    const p = matchedProductMap.get(i.productId);
    if (!p) {
      const err = new Error(`المنتج غير موجود: ${i.productId}`);
      (err as any).status = 422;
      (err as any).statusCode = 422;
      throw err;
    }

    currency = p.currency ?? currency;
    const unitPrice = Number(p.price ?? 0);

    if (isNaN(unitPrice) || unitPrice <= 0) {
      const err = new Error(`المنتج "${p.name}" سعره غير صالح. يرجى التواصل مع الإدارة.`);
      (err as any).status = 422;
      (err as any).statusCode = 422;
      throw err;
    }

    const lineTotal = unitPrice * i.quantity;
    subtotal += lineTotal;

    const availableStock = p.stock ?? 0;
    if (availableStock <= 0) {
      hasRestockNeededItem = true;
    } else if (i.quantity > availableStock) {
      stockErrors.push(
        `الكمية المطلوبة من "${p.name}" (${i.quantity}) أكبر من المخزون المتاح (${availableStock}).`,
      );
    }

    if (p.tenant_id) {
      tenantId = p.tenant_id;
    }

    return {
      tenant_id: p.tenant_id || tenantId,
      product_id: p.id,
      quantity: i.quantity,
      unit_price: unitPrice,
      total_price: lineTotal,
      product_name_snapshot: p.name,
      product_sku_snapshot: p.sku ?? null,
      vendor_id: p.vendor_id ?? null,
    };
  });

  if (stockErrors.length > 0) {
    const err = new Error(stockErrors.join("\n"));
    (err as any).status = 422;
    (err as any).statusCode = 422;
    throw err;
  }

  const validatedDiscount = 0;

  const shippingSettings = await loadShippingSettings(tenantId, supabaseAdmin);
  const shippingFee = computeShippingFee(
    subtotal - validatedDiscount,
    shippingSettings.freeShippingThreshold,
    shippingSettings.defaultShippingFee,
  );

  const total = Math.max(0, subtotal - validatedDiscount + shippingFee);

  let finalNotes = data.notes ?? "";
  if (hasRestockNeededItem) {
    finalNotes = finalNotes
      ? `${finalNotes} | [طلب توفير كمية - المخزون 0]`
      : "[طلب توفير كمية - المخزون 0]";
  }

  // 5. Insert order
  const orderInsert: Database["public"]["Tables"]["orders"]["Insert"] = {
    tenant_id: tenantId,
    user_id: userId,
    customer_name: data.customerName ?? null,
    customer_phone: customerPhone,
    customer_address: data.customerAddress ?? null,
    customer_email: data.customerEmail ?? null,
    notes: finalNotes || null,
    status: "pending",
    payment_status: "pending",
    payment_provider: data.paymentProvider ?? null,
    subtotal,
    shipping_fee: shippingFee,
    total,
    currency,
    coupon_code: data.couponCode ?? null,
    discount_amount: validatedDiscount,
  };

  if (data.idempotencyKey) {
    orderInsert.idempotency_key = data.idempotencyKey;
  }

  let { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .insert(orderInsert)
    .select("id")
    .single();

  if (orderErr || !order) {
    if (
      orderErr?.message?.includes("schema cache") ||
      orderErr?.message?.includes("idempotency") ||
      orderErr?.message?.includes("column") ||
      orderErr?.message?.includes("shipping_fee") ||
      orderErr?.message?.includes("subtotal") ||
      orderErr?.code === "PGRST204"
    ) {
      console.warn(
        "[createOrder] Live DB orders table schema discrepancy, retrying with guaranteed legacy columns:",
        orderErr.message,
      );
      const legacyInsert = {
        tenant_id: tenantId,
        customer_name: data.customerName ?? null,
        customer_phone: customerPhone,
        customer_address: data.customerAddress ?? null,
        customer_email: data.customerEmail ?? null,
        notes: finalNotes || null,
        status: "pending",
        payment_status: "pending",
        payment_provider: data.paymentProvider ?? null,
        total,
        currency,
        coupon_code: data.couponCode ?? null,
        discount_amount: validatedDiscount,
      };
      const retryRes = await (supabaseAdmin as any)
        .from("orders")
        .insert(legacyInsert)
        .select("id")
        .single();
      order = retryRes.data;
      orderErr = retryRes.error;
    }
  }

  if (orderErr || !order) {
    console.error("[createOrder] Order Insert Failure:", orderErr);
    if (
      (orderErr?.code === "23505" || orderErr?.message?.includes("idempotency")) &&
      data.idempotencyKey
    ) {
      const { data: existing } = await supabaseAdmin
        .from("orders")
        .select("id, total, currency")
        .eq("idempotency_key", data.idempotencyKey)
        .maybeSingle();

      if (existing) {
        return {
          orderId: existing.id,
          total: existing.total ?? total,
          currency: existing.currency ?? currency,
          itemsCount: data.items.length,
        };
      }
    }
    throw new Error(`تعذّر إنشاء الطلب: ${orderErr?.message || "خطأ في قاعدة البيانات"}`);
  }

  // 6. Insert items
  let { data: insertedItems, error: itemsErr } = await supabaseAdmin
    .from("order_items")
    .insert(itemRows.map(({ vendor_id, ...r }) => ({ ...r, order_id: order.id })))
    .select("id, order_id, product_id, quantity, unit_price, total_price");

  if (itemsErr || !insertedItems) {
    console.error("[createOrder] Order Items Insert Error:", itemsErr?.message);
  }

  // 6b. Multi-vendor order splitting
  try {
    const { splitOrderIntoVendorOrders } = await import("@/lib/services/vendor-order.service");
    const orderItemsWithVendor = (insertedItems ?? []).map((item) => {
      const matchingRow = itemRows.find((r) => r.product_id === item.product_id);
      return {
        ...item,
        vendor_id: matchingRow?.vendor_id ?? null,
      };
    });

    await splitOrderIntoVendorOrders(supabaseAdmin, {
      tenantId,
      orderId: order.id,
      items: orderItemsWithVendor,
    });
  } catch (splitEx) {
    console.warn("[createOrder] multi-vendor order split notice:", splitEx);
  }

  // 7. Audit history entry
  try {
    const { error: histErr } = await supabaseAdmin.from("order_status_history").insert({
      order_id: order.id,
      tenant_id: tenantId,
      from_status: null,
      to_status: "pending",
      changed_by: userId,
      note: hasRestockNeededItem
        ? "Order created — يحتوي على طلب توفير كمية (المخزون 0)"
        : "Order created via checkout",
    });
    if (histErr) console.warn("[createOrder] status history notice:", histErr.message);
  } catch (histEx) {
    console.warn("[createOrder] status history skipped:", histEx);
  }

  return { orderId: order.id, total, currency, itemsCount: itemRows.length };
}

export { createOrderService as createOrder };
