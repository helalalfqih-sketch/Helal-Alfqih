/**
 * Integration Test — Cart Add -> Order Creation -> Inventory Update Flow
 */
import { canReserveStock, reserveStock, type ProductStock } from "../unit/inventory.test";
import { calculateSubtotal, applyCoupon } from "../unit/pricing.test";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export function processCheckout(
  cart: CartItem[],
  inventoryMap: Map<string, ProductStock>,
  couponCode?: string
) {
  for (const item of cart) {
    const stockInfo = inventoryMap.get(item.productId);
    if (!stockInfo || !canReserveStock(stockInfo, item.quantity)) {
      throw new Error(`Out of stock for item: ${item.name}`);
    }
  }

  const subtotal = calculateSubtotal(cart);
  const { finalTotal, discount } = applyCoupon(subtotal, couponCode || "");

  const updatedInventory = new Map<string, ProductStock>();
  for (const item of cart) {
    const currentStock = inventoryMap.get(item.productId)!;
    const newStock = reserveStock(currentStock, item.quantity);
    updatedInventory.set(item.productId, newStock);
  }

  return {
    orderId: `ord_${Date.now()}`,
    subtotal,
    discount,
    total: finalTotal,
    itemsCount: cart.length,
    status: "confirmed",
    updatedInventory,
  };
}

export function runCheckoutIntegrationTest() {
  console.log("--- Running Integration Test: Cart Add -> Order Creation -> Stock Update ---");

  const inventoryMap = new Map<string, ProductStock>([
    ["prod_1", { id: "prod_1", stock: 20, reservedStock: 0 }],
    ["prod_2", { id: "prod_2", stock: 5, reservedStock: 1 }],
  ]);

  const cart: CartItem[] = [
    { productId: "prod_1", name: "Smart Watch", price: 150, quantity: 2 },
    { productId: "prod_2", name: "Earbuds", price: 50, quantity: 1 },
  ];

  const order = processCheckout(cart, inventoryMap, "SAVE10");

  console.assert(order.status === "confirmed", "Order status should be confirmed");
  console.assert(order.subtotal === 350, `Subtotal expected 350, got ${order.subtotal}`);
  console.assert(order.discount === 35, `Discount expected 35, got ${order.discount}`);
  console.assert(order.total === 315, `Final total expected 315, got ${order.total}`);

  const updatedProd1 = order.updatedInventory.get("prod_1");
  console.assert(updatedProd1?.reservedStock === 2, `Product 1 reserved stock should be 2, got ${updatedProd1?.reservedStock}`);

  console.log("✓ Integration Test (Cart -> Order -> Inventory) Passed!");
  return true;
}
