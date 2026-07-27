/**
 * Phase 4 — Runtime Network Monitor
 * Captures 404/500 HTTP failures and network asset errors
 */

export interface NetworkErrorEvent {
  id: string;
  url: string;
  status: number;
  method: string;
  route?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  timestamp: string;
}

const networkErrorBuffer: NetworkErrorEvent[] = [];

export function recordNetworkError(event: Omit<NetworkErrorEvent, "id" | "timestamp">) {
  networkErrorBuffer.push({
    ...event,
    id: `NET-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  });
  if (networkErrorBuffer.length > 50) networkErrorBuffer.shift();
}

export function getNetworkErrors(): NetworkErrorEvent[] {
  return [...networkErrorBuffer];
}

export function clearNetworkErrors(): void {
  networkErrorBuffer.length = 0;
}
