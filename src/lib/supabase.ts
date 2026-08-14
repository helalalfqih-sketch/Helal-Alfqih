import { supabase } from "../integrations/supabase/client";
import { Product, Category, OrderStatus } from "../types";
import type { Database } from "../integrations/supabase/types";

type DbOrderStatus = Database["public"]["Enums"]["order_status"];

function mapAppStatusToDbStatus(status: OrderStatus["status"]): DbOrderStatus {
  if (status === "received") return "pending";
  if (status === "out_for_delivery") return "shipped";
  return status;
}

function mapDbStatusToAppStatus(
  dbStatus?: string | null,
): OrderStatus["status"] {
  if (dbStatus === "pending") return "received";
  if (dbStatus === "shipped") return "shipped";
  if (dbStatus === "delivered") return "delivered";
  if (dbStatus === "cancelled") return "cancelled";
  if (dbStatus === "processing") return "processing";
  return "processing";
}

export { supabase };

export const isSupabaseConfigured = true;

const LOCAL_PRODUCTS_KEY = "indexes_store_supabase_products";
const LOCAL_ORDERS_KEY = "indexes_store_supabase_orders";

import { getSmartProductFallbackImage, isSvgFallbackOrEmpty } from "@/lib/product-fallback-image";

const NEUTRAL_SVG_FALLBACK = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="#181825"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#71717a" font-family="sans-serif" font-size="16">لا تتوفر صورة</text></svg>',
)}`;

export interface LinkedMedia {
  images: string[];
  videoUrl?: string;
  videoPlaybackId?: string;
  posterUrl?: string;
}

async function fetchMediaForProducts(
  productIds: string[],
): Promise<Map<string, LinkedMedia>> {
  const result = new Map<string, LinkedMedia>();
  if (productIds.length === 0) return result;

  try {
    const { data: pmLinks, error: pmErr } = await supabase
      .from("product_media")
      .select("product_id, media_id, sort_order")
      .in("product_id", productIds)
      .order("sort_order", { ascending: true });

    if (pmErr || !pmLinks || pmLinks.length === 0) {
      return result;
    }

    const mediaIds = [
      ...new Set(
        pmLinks
          .map((l: Record<string, unknown>) => String(l.media_id || ""))
          .filter(Boolean),
      ),
    ];
    if (mediaIds.length === 0) return result;

    const { data: files, error: filesErr } = await supabase
      .from("media_files")
      .select("id, file_url, file_type, thumbnail_url, sequence_number")
      .in("id", mediaIds);

    if (filesErr || !files || files.length === 0) {
      return result;
    }

    const filesById = new Map<string, Record<string, unknown>>(
      files.map((f: Record<string, unknown>) => [String(f.id), f]),
    );

    for (const link of pmLinks) {
      const file = filesById.get(String(link.media_id));
      if (!file) continue;

      const prodId = String(link.product_id);
      let current = result.get(prodId);
      if (!current) {
        current = { images: [] };
        result.set(prodId, current);
      }

      const url = file.file_url;
      const fileType = file.file_type || "";
      const isVideo =
        fileType === "video" ||
        (typeof url === "string" &&
          (url.endsWith(".mp4") ||
            url.endsWith(".webm") ||
            url.includes("video")));

      if (isVideo) {
        if (
          !current.videoUrl &&
          typeof url === "string" &&
          url.startsWith("http")
        ) {
          current.videoUrl = url;
        }
        if (
          !current.posterUrl &&
          typeof file.thumbnail_url === "string" &&
          file.thumbnail_url.startsWith("http")
        ) {
          current.posterUrl = file.thumbnail_url;
        }
      } else if (typeof url === "string" && url.startsWith("http")) {
        current.images.push(url);
      }
    }
  } catch (err) {
    console.warn("[Media fetch note]:", err);
  }

  return result;
}

export function mapSupabaseProductToAppProduct(
  row: Record<string, unknown>,
  linkedMediaMap?: Map<string, LinkedMedia>,
): Product {
  const prodId = String(row.id);
  const linked = linkedMediaMap?.get(prodId);

  const price = (row.priceYER as number) ?? (row.price as number) ?? 0;
  const originalPrice =
    (row.originalPriceYER as number) ??
    (row.old_price as number) ??
    (row.compare_at_price as number) ??
    price;

  const isValidImage = (img: unknown): boolean =>
    typeof img === "string" &&
    img.trim().length > 5 &&
    (img.startsWith("http://") ||
      img.startsWith("https://") ||
      img.startsWith("data:image/") ||
      img.startsWith("/"));

  // Process raw images column from row (Priority 2)
  let rowImages: string[] = [];
  if (Array.isArray(row.images)) {
    rowImages = row.images.filter(isValidImage) as string[];
  } else if (isValidImage(row.images)) {
    rowImages = [row.images as string];
  } else if (isValidImage(row.image)) {
    rowImages = [row.image as string];
  }

  // Priority 1: media_files images; Priority 2: products.images column
  const mediaImages =
    linked?.images && linked.images.length > 0 ? linked.images : [];
  const combinedImages = [...mediaImages, ...rowImages];

  let mainImage = combinedImages[0];
  const secondaryImage = combinedImages[1] || undefined;

  // Priority 3: Video thumbnail/poster if no direct image
  if (!mainImage && linked?.posterUrl) {
    mainImage = linked.posterUrl;
  }

  // Priority 4: Smart Contextual Fallback
  if (!mainImage || isSvgFallbackOrEmpty(mainImage)) {
    mainImage = getSmartProductFallbackImage(
      String(row.name || ""),
      String(row.category || row.category_id || ""),
      prodId
    );
  }

  const gallery = combinedImages.length > 0 ? combinedImages : [mainImage];

  // Video resolution
  let resolvedVideoUrl = linked?.videoUrl;
  if (
    !resolvedVideoUrl &&
    typeof row.source_url === "string" &&
    (row.source_url.endsWith(".mp4") ||
      row.source_url.endsWith(".webm") ||
      row.source_url.includes("video"))
  ) {
    resolvedVideoUrl = row.source_url;
  }

  let resolvedPlaybackId = linked?.videoPlaybackId;
  if (
    !resolvedPlaybackId &&
    typeof row.video_playback_id === "string" &&
    row.video_playback_id.trim().length > 0
  ) {
    resolvedPlaybackId = row.video_playback_id.trim();
  }

  const stock = typeof row.stock === "number" ? row.stock : undefined;
  const inStock =
    row.inStock !== undefined
      ? Boolean(row.inStock)
      : stock !== undefined
        ? stock > 0
        : true;
  const isLowStock =
    typeof row.isLowStock === "boolean"
      ? row.isLowStock
      : stock !== undefined && stock <= 3 && stock > 0;

  return {
    id: prodId,
    name: String(row.name || "منتج"),
    subtitle: String(
      row.subtitle ||
        (row.description ? String(row.description).slice(0, 50) : ""),
    ),
    description: String(row.description || ""),
    priceYER: Number(price),
    originalPriceYER: Number(originalPrice),
    discountBadge: row.discountBadge
      ? String(row.discountBadge)
      : row.badge
        ? String(row.badge)
        : undefined,
    rating: Number(row.rating || 5.0),
    reviewsCount: Number(row.reviews_count ?? row.reviewsCount ?? 0),
    image: mainImage,
    secondaryImage: secondaryImage,
    gallery: gallery,
    videoUrl: resolvedVideoUrl || undefined,
    video_playback_id: resolvedPlaybackId || undefined,
    videoPlaybackId: resolvedPlaybackId || undefined,
    category: String(row.category || row.category_id || "all"),
    inStock,
    stockCount:
      row.stockCount !== undefined ? Number(row.stockCount) : stock,
    isLowStock,
    isBestOffer: Boolean(row.isBestOffer ?? row.is_deal ?? false),
    isBestSeller: Boolean(row.isBestSeller ?? false),
    isNewArrival: Boolean(row.isNewArrival ?? false),
    isFeatured: Boolean(row.isFeatured ?? row.featured ?? false),
    specs:
      typeof row.specs === "object" && row.specs !== null
        ? (row.specs as Record<string, string>)
        : undefined,
    colors: Array.isArray(row.colors) ? (row.colors as string[]) : undefined,
  } as unknown as Product;
}

// Global In-Memory Caching and Quota Guard
let isQuotaExceeded = false;
let memoryProductsCache: Product[] | null = null;
let memoryHasMoreCache = false;
let memoryErrorCache: string | null = null;

function checkQuotaExceeded(errorMsg?: string, status?: number) {
  if (
    status === 402 ||
    (errorMsg &&
      (errorMsg.includes("exceed_egress_quota") ||
        errorMsg.includes("restricted") ||
        errorMsg.includes("402") ||
        errorMsg.includes("Payment Required")))
  ) {
    isQuotaExceeded = true;
  }
}

/**
 * Fetch products directly from Supabase DB with pagination (24 per page), lightweight selection, and memory caching
 */
export async function fetchProductsFromSupabase(options?: {
  page?: number;
  pageSize?: number;
}): Promise<{ products: Product[]; hasMore: boolean; error: string | null }> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 24;

  // 1. Quota Guard: If quota was exceeded previously, do NOT attempt new network calls to prevent retry loops
  if (isQuotaExceeded) {
    return {
      products: memoryProductsCache || [],
      hasMore: false,
      error: "تم تجاوُز حد نقل البيانات لمشروع Supabase (HTTP 402)",
    };
  }

  // 2. Memory Cache Return for Page 1 if already loaded
  if (
    page === 1 &&
    memoryProductsCache !== null &&
    memoryProductsCache.length > 0
  ) {
    return {
      products: memoryProductsCache,
      hasMore: memoryHasMoreCache,
      error: memoryErrorCache,
    };
  }

  try {
    const fromIndex = (page - 1) * pageSize;
    const toIndex = page * pageSize - 1;

    // 1. Fetch 24 products with required columns
    const { data, error, status } = await supabase
      .from("products")
      .select(
        "id, name, description, price, old_price, compare_at_price, badge, rating, reviews_count, images, category_id, stock, featured, is_deal, video_playback_id, source_url",
      )
      .range(fromIndex, toIndex);

    if (error) {
      checkQuotaExceeded(error.message, status);
      const errMsg = isQuotaExceeded
        ? "تم تجاوُز حد نقل البيانات لمشروع Supabase (HTTP 402)"
        : error.message;
      if (page === 1) memoryErrorCache = errMsg;
      return {
        products: memoryProductsCache || [],
        hasMore: false,
        error: errMsg,
      };
    }

    if (!data || data.length === 0) {
      return {
        products: memoryProductsCache || [],
        hasMore: false,
        error: null,
      };
    }

    // 2. Fetch linked media_files for this exact batch of 24 products
    const productIds = data.map((p) => String(p.id));
    const linkedMediaMap = await fetchMediaForProducts(productIds);

    // 3. Map products linking media by product_id
    const mapped = data.map((row) =>
      mapSupabaseProductToAppProduct(row, linkedMediaMap),
    );
    const hasMore = mapped.length === pageSize;

    if (page === 1) {
      memoryProductsCache = mapped;
      memoryHasMoreCache = hasMore;
      memoryErrorCache = null;
    } else if (memoryProductsCache) {
      // Append new page to existing memory cache without duplicating
      const existingIds = new Set(memoryProductsCache.map((p) => p.id));
      const newItems = mapped.filter((p) => !existingIds.has(p.id));
      memoryProductsCache = [...memoryProductsCache, ...newItems];
      memoryHasMoreCache = hasMore;
    }

    return {
      products: memoryProductsCache || mapped,
      hasMore,
      error: null,
    };
  } catch (err: unknown) {
    const errObj = err as { message?: string } | null;
    checkQuotaExceeded(errObj?.message);
    const errMsg = isQuotaExceeded
      ? "تم تجاوُز حد نقل البيانات لمشروع Supabase (HTTP 402)"
      : errObj?.message || "خطأ في اتصال Supabase";
    return {
      products: memoryProductsCache || [],
      hasMore: false,
      error: errMsg,
    };
  }
}

export async function seedInitialProductsIfNeeded(): Promise<Product[]> {
  try {
    const { products, error } = await fetchProductsFromSupabase({
      page: 1,
      pageSize: 24,
    });
    if (!error && products.length > 0) return products;
    return [];
  } catch {
    return [];
  }
}

/**
 * Fetch categories directly from Supabase DB
 */
export async function fetchCategoriesFromSupabase(): Promise<{
  categories: Category[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase.from("categories").select("*");
    if (error || !data) {
      return { categories: [], error: error?.message || null };
    }
    const mapped: Category[] = data.map((c: Record<string, unknown>) => ({
      id: String(c.id || c.slug || ""),
      name: String(c.name || ""),
      icon: String(c.icon || "Grid"),
      count: 0,
    }));
    return { categories: mapped, error: null };
  } catch (err: unknown) {
    const errObj = err as { message?: string } | null;
    return { categories: [], error: errObj?.message || null };
  }
}

/**
 * Get products from local storage fallback
 */
function getLocalProducts(): Product[] {
  try {
    const saved = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("LocalStorage products read note:", err);
  }
  return [];
}

/**
 * Save products to local storage fallback
 */
function saveLocalProducts(products: Product[]) {
  try {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
  } catch (err) {
    console.warn("LocalStorage products write note:", err);
  }
}

/**
 * Get orders from local storage fallback
 */
function getLocalOrders(): OrderStatus[] {
  try {
    const saved = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn("LocalStorage orders read note:", err);
  }
  return [];
}

/**
 * Save orders to local storage fallback
 */
function saveLocalOrders(orders: OrderStatus[]) {
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
  } catch (err) {
    console.warn("LocalStorage orders write note:", err);
  }
}

/**
 * Subscribe to products from Supabase (One-time REST fetch without Realtime websocket overhead)
 */
export function subscribeToProducts(
  callback: (res: {
    products: Product[];
    hasMore: boolean;
    error: string | null;
    isMock: boolean;
  }) => void,
) {
  // One-time REST fetch using 24 products limit
  fetchProductsFromSupabase({ page: 1, pageSize: 24 }).then(
    ({ products, hasMore, error }) => {
      if (error) {
        const local = getLocalProducts();
        callback({
          products: local,
          hasMore: false,
          error,
          isMock: false,
        });
      } else {
        if (products.length > 0) {
          saveLocalProducts(products);
        }
        callback({ products, hasMore, error: null, isMock: false });
      }
    },
  );

  // Return no-op cleanup (Realtime disabled for bandwidth optimization)
  return () => {};
}

/**
 * Fetch orders from Supabase (One-time fetch without Realtime websocket overhead)
 */
export function subscribeToOrders(callback: (orders: OrderStatus[]) => void) {
  if (isQuotaExceeded || !supabase) {
    callback(getLocalOrders());
    return () => {};
  }

  // Initial one-time fetch
  (async () => {
    try {
      const { data, error, status } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        checkQuotaExceeded(error.message, status);
        callback(getLocalOrders());
      } else if (!data || data.length === 0) {
        callback(getLocalOrders());
      } else {
        const ordersList = (data as Record<string, unknown>[]).map(
          (d: Record<string, unknown>) => ({
            id: String(d.id || ""),
            orderNumber: String(d.orderNumber || d.order_number || d.id || ""),
            customerName: String(d.customerName || d.customer_name || ""),
            phone: String(d.phone || d.customer_phone || ""),
            governorate: String(d.governorate || ""),
            address: String(d.address || d.customer_address || ""),
            items: (d.items as OrderStatus["items"]) || [],
            totalPriceYER: Number(d.totalPriceYER || d.total_price_yer || 0),
            status: mapDbStatusToAppStatus(d.status as string),
            statusLabel: String(
              d.statusLabel || d.status_label || "جاري معالجة الطلب ⏳",
            ),
            date: String(
              d.date || d.created_at || new Date().toLocaleDateString("ar-EG"),
            ),
            paymentMethod: String(
              d.paymentMethod || d.payment_method || "الدفع عند الاستلام",
            ),
          }),
        ) as OrderStatus[];

        saveLocalOrders(ordersList);
        callback(ordersList);
      }
    } catch (err: unknown) {
      const errObj = err as { message?: string } | null;
      checkQuotaExceeded(errObj?.message);
      callback(getLocalOrders());
    }
  })();

  return () => {};
}

/**
 * Create a new order
 */
export async function createSupabaseOrder(
  orderData: Omit<OrderStatus, "id">,
): Promise<string> {
  const newId = `ord_${Date.now()}`;
  const fullOrder: OrderStatus = {
    ...orderData,
    id: newId,
  };

  // Update local storage
  const currentOrders = getLocalOrders();
  saveLocalOrders([fullOrder, ...currentOrders]);

  if (supabase) {
    try {
      const orderRow: Record<string, unknown> = {
        id: newId,
        order_number: orderData.orderNumber,
        customer_name: orderData.customerName,
        customer_phone: orderData.phone,
        governorate: orderData.governorate,
        customer_address: orderData.address,
        items: orderData.items,
        total_price_yer: orderData.totalPriceYER,
        status: mapAppStatusToDbStatus(orderData.status),
        status_label: orderData.statusLabel,
        payment_method: orderData.paymentMethod,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from("orders").insert([orderRow as any]);
      if (error) console.warn("Supabase order creation note:", error.message);
    } catch (err) {
      console.warn("Supabase create order note:", err);
    }
  }

  return newId;
}

/**
 * Save or update a product
 */
export async function saveSupabaseProduct(product: Product): Promise<void> {
  const currentProds = getLocalProducts();
  const idx = currentProds.findIndex((p) => p.id === product.id);
  let updated: Product[];
  if (idx >= 0) {
    updated = [...currentProds];
    updated[idx] = product;
  } else {
    updated = [product, ...currentProds];
  }
  saveLocalProducts(updated);

  if (supabase) {
    try {
      const dbRow: Record<string, unknown> = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.priceYER,
        old_price: product.originalPriceYER,
        badge: product.discountBadge,
        rating: product.rating,
        reviews_count: product.reviewsCount,
        images:
          product.gallery && product.gallery.length > 0
            ? product.gallery
            : [product.image],
        category_id: product.category,
        stock: product.stockCount ?? (product.inStock ? 10 : 0),
        featured: product.isFeatured || false,
        is_deal: product.isBestOffer || false,
      };
      const { error } = await supabase
        .from("products")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert(dbRow as any, { onConflict: "id" });
      if (error) console.warn("Supabase product save note:", error.message);
    } catch (err) {
      console.warn("Supabase save product note:", err);
    }
  }
}

/**
 * Delete a product
 */
export async function deleteSupabaseProduct(productId: string): Promise<void> {
  const currentProds = getLocalProducts().filter((p) => p.id !== productId);
  saveLocalProducts(currentProds);

  if (supabase) {
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);
      if (error) console.warn("Supabase product delete note:", error.message);
    } catch (err) {
      console.warn("Supabase delete product note:", err);
    }
  }
}

/**
 * Update order status
 */
export async function updateSupabaseOrderStatus(
  orderId: string,
  status: OrderStatus["status"],
  statusLabel: string,
): Promise<void> {
  const currentOrders = getLocalOrders().map((o) =>
    o.id === orderId ? { ...o, status, statusLabel } : o,
  );
  saveLocalOrders(currentOrders);

  if (supabase) {
    try {
      const dbStatus = mapAppStatusToDbStatus(status);
      const { error } = await supabase
        .from("orders")
        .update({ status: dbStatus })
        .eq("id", orderId);
      if (error)
        console.warn("Supabase order status update note:", error.message);
    } catch (err) {
      console.warn("Supabase update order status note:", err);
    }
  }
}

/**
 * Delete an order
 */
export async function deleteSupabaseOrder(orderId: string): Promise<void> {
  const currentOrders = getLocalOrders().filter((o) => o.id !== orderId);
  saveLocalOrders(currentOrders);

  if (supabase) {
    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);
      if (error) console.warn("Supabase order delete note:", error.message);
    } catch (err) {
      console.warn("Supabase delete order note:", err);
    }
  }
}

// Backward-compatible export aliases for existing imports
export const createFirestoreOrder = createSupabaseOrder;
export const saveFirestoreProduct = saveSupabaseProduct;
export const deleteFirestoreProduct = deleteSupabaseProduct;
export const updateFirestoreOrderStatus = updateSupabaseOrderStatus;
export const deleteFirestoreOrder = deleteSupabaseOrder;
