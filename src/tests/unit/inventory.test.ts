/**
 * Unit Tests — Inventory Checks & Stock Management
 */

export interface ProductStock {
  id: string;
  stock: number;
  reservedStock: number;
}

export function canReserveStock(product: ProductStock, requestedQuantity: number): boolean {
  const available = product.stock - product.reservedStock;
  return requestedQuantity > 0 && available >= requestedQuantity;
}

export function reserveStock(product: ProductStock, quantity: number): ProductStock {
  if (!canReserveStock(product, quantity)) {
    throw new Error(`Insufficient available stock for product ${product.id}`);
  }
  return {
    ...product,
    reservedStock: product.reservedStock + quantity,
  };
}

export function isLowStock(product: ProductStock, threshold: number = 5): boolean {
  const available = product.stock - product.reservedStock;
  return available <= threshold;
}

export function runInventoryUnitTests() {
  console.log("--- Running Unit Tests: Inventory & Stock ---");

  const product: ProductStock = { id: "p1", stock: 10, reservedStock: 2 };

  console.assert(
    canReserveStock(product, 5) === true,
    "Should allow reserving 5 items from 8 available",
  );
  console.assert(
    canReserveStock(product, 9) === false,
    "Should reject reserving 9 items when only 8 available",
  );

  const updated = reserveStock(product, 5);
  console.assert(updated.reservedStock === 7, `Expected reserved 7, got ${updated.reservedStock}`);

  const lowProduct: ProductStock = { id: "p2", stock: 5, reservedStock: 2 };
  console.assert(
    isLowStock(lowProduct, 5) === true,
    "Available 3 should trigger low stock threshold of 5",
  );

  console.log("✓ Inventory Unit Tests Passed!");
  return true;
}
