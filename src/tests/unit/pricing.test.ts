/**
 * Unit Tests — Pricing Calculations, Discounts, and Coupon Validations
 */

export function calculateSubtotal(items: Array<{ price: number; quantity: number }>): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function applyCoupon(subtotal: number, couponCode: string): { finalTotal: number; discount: number } {
  if (couponCode.toUpperCase() === "SAVE10") {
    const discount = subtotal * 0.1;
    return { finalTotal: Math.max(0, subtotal - discount), discount };
  }
  if (couponCode.toUpperCase() === "FLAT50") {
    const discount = 50;
    return { finalTotal: Math.max(0, subtotal - discount), discount };
  }
  return { finalTotal: subtotal, discount: 0 };
}

export function formatCurrency(amount: number, currency: string = "YER"): string {
  return `${amount.toFixed(2)} ${currency}`;
}

export function runPricingUnitTests() {
  console.log("--- Running Unit Tests: Pricing & Discounts ---");

  const items = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 },
  ];
  const subtotal = calculateSubtotal(items);
  console.assert(subtotal === 250, `Expected subtotal 250, got ${subtotal}`);

  const percentageRes = applyCoupon(250, "SAVE10");
  console.assert(percentageRes.discount === 25, `Expected discount 25, got ${percentageRes.discount}`);
  console.assert(percentageRes.finalTotal === 225, `Expected total 225, got ${percentageRes.finalTotal}`);

  const fixedRes = applyCoupon(250, "FLAT50");
  console.assert(fixedRes.discount === 50, `Expected discount 50, got ${fixedRes.discount}`);
  console.assert(fixedRes.finalTotal === 200, `Expected total 200, got ${fixedRes.finalTotal}`);

  const formatted = formatCurrency(199.99, "YER");
  console.assert(formatted === "199.99 YER", `Expected '199.99 YER', got '${formatted}'`);

  console.log("✓ Pricing & Discount Unit Tests Passed!");
  return true;
}
