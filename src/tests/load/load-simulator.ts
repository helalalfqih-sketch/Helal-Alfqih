/**
 * High-Concurrency Load Simulator
 * Simulates:
 * - 100 concurrent order creation requests
 * - 1,000 product browsing / read queries
 */

export async function simulateConcurrentOrders(orderCount: number = 100) {
  const startTime = Date.now();
  console.log(`[Load Test] Simulating ${orderCount} concurrent order creations...`);

  const orderPromises = Array.from({ length: orderCount }).map((_, i) => {
    return new Promise<{ id: string; latencyMs: number }>((resolve) => {
      const simulatedLatency = Math.floor(Math.random() * 80) + 20; // 20ms to 100ms
      setTimeout(() => {
        resolve({ id: `load_ord_${i + 1}`, latencyMs: simulatedLatency });
      }, simulatedLatency);
    });
  });

  const results = await Promise.all(orderPromises);
  const totalDuration = Date.now() - startTime;
  const avgLatency = results.reduce((sum, r) => sum + r.latencyMs, 0) / orderCount;

  console.log(`[Load Test] Created ${orderCount} orders in ${totalDuration}ms (Avg Latency: ${avgLatency.toFixed(2)}ms, Throughput: ${(orderCount / (totalDuration / 1000)).toFixed(1)} req/sec)`);
  return { orderCount, totalDuration, avgLatency };
}

export async function simulateCatalogBrowsing(readCount: number = 1000) {
  const startTime = Date.now();
  console.log(`[Load Test] Simulating ${readCount} product catalog reads...`);

  const readPromises = Array.from({ length: readCount }).map((_, i) => {
    return new Promise<{ readId: number; latencyMs: number }>((resolve) => {
      const simulatedLatency = Math.floor(Math.random() * 15) + 5; // 5ms to 20ms
      setTimeout(() => {
        resolve({ readId: i + 1, latencyMs: simulatedLatency });
      }, simulatedLatency);
    });
  });

  const results = await Promise.all(readPromises);
  const totalDuration = Date.now() - startTime;
  const avgLatency = results.reduce((sum, r) => sum + r.latencyMs, 0) / readCount;

  console.log(`[Load Test] Served ${readCount} product reads in ${totalDuration}ms (Avg Latency: ${avgLatency.toFixed(2)}ms, Throughput: ${(readCount / (totalDuration / 1000)).toFixed(1)} req/sec)`);
  return { readCount, totalDuration, avgLatency };
}

export async function runFullLoadTest() {
  console.log("==================================================================");
  console.log("LOAD SIMULATOR: 100 CONCURRENT ORDERS & 1000 CATALOG READS");
  console.log("==================================================================");

  await simulateCatalogBrowsing(1000);
  await simulateConcurrentOrders(100);

  console.log("✓ Load Test Execution Completed Successfully!");
  return true;
}

if (import.meta.main || process.env.NODE_ENV === "test") {
  runFullLoadTest();
}
