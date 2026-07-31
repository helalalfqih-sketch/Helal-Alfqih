/**
 * Shipping Configuration — SINGLE SOURCE OF TRUTH.
 *
 * Used by:
 *  - cart.tsx (UI display + threshold banner)
 *  - order.actions.ts / order.functions.ts (server-side calculation)
 *  - WhatsApp order message
 *  - Announcement bar
 *  - Order tracking / details pages
 *
 * The threshold and default fee can be overridden via Storefront Settings
 * (`cart_config.freeShippingThreshold`). These constants are the platform
 * defaults when no storefront setting is available.
 */

/** Default free-shipping threshold in YER (platform fallback). */
export const DEFAULT_FREE_SHIPPING_THRESHOLD = 30_000;

/** Default shipping fee in YER when the threshold is NOT met (platform fallback). */
export const DEFAULT_SHIPPING_FEE = 3_000;

/** Currency code. */
export const SHIPPING_CURRENCY = "YER";

/**
 * Compute the shipping fee for a given subtotal.
 *
 * @param subtotal       - Cart subtotal in YER (server-recomputed, never from client).
 * @param threshold      - Free-shipping threshold (from storefront settings or default).
 * @param configuredFee  - Configured flat fee when threshold is not met.
 * @returns The shipping fee (0 when free shipping applies).
 */
export function computeShippingFee(
  subtotal: number,
  threshold: number = DEFAULT_FREE_SHIPPING_THRESHOLD,
  configuredFee: number = DEFAULT_SHIPPING_FEE,
): number {
  if (threshold > 0 && subtotal >= threshold) return 0;
  return configuredFee;
}

/**
 * How much more the customer needs to qualify for free shipping.
 * Returns 0 if already qualified or if free shipping is disabled (threshold=0).
 */
export function amountToFreeShipping(
  subtotal: number,
  threshold: number = DEFAULT_FREE_SHIPPING_THRESHOLD,
): number {
  if (threshold <= 0) return 0;
  const remaining = threshold - subtotal;
  return remaining > 0 ? remaining : 0;
}

/**
 * Normalize a Yemeni phone number to international format: 967XXXXXXXXX.
 * Handles inputs like: 771370740, 0771370740, +967771370740, 00967771370740, 967771370740.
 * Returns null if the input is not a recognizable Yemeni number.
 */
export function normalizeYemeniPhone(raw: string): string | null {
  // Strip all non-digit characters
  let digits = raw.replace(/\D/g, "");

  // Remove leading 00 (international prefix)
  if (digits.startsWith("00")) digits = digits.slice(2);

  // If starts with 967 and has 12 digits total → already normalized
  if (digits.startsWith("967") && digits.length === 12) return digits;

  // If starts with 0 (local format like 0771...) remove leading 0
  if (digits.startsWith("0")) digits = digits.slice(1);

  // Should now be 9 digits (7XXXXXXXX)
  if (digits.length === 9 && /^[1-9]/.test(digits)) {
    return `967${digits}`;
  }

  // If it's 12 digits starting with 967, accept
  if (digits.length === 12 && digits.startsWith("967")) {
    return digits;
  }

  return null;
}
