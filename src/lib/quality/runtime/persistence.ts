/**
 * Phase 4.5 & Phase 9.5 — Runtime Event Persistence Layer
 * Aggregates runtime events with occurrence counts, session context & timestamps
 * Production Mode: Stores events in-memory / DB adapter (bypassing serverless fs ENOENT errors)
 * Development Mode: Stores events to local disk (/reports/runtime-events)
 */
import fs from "fs";
import path from "path";
import { isProductionEnvironment } from "../history";

export interface PersistedRuntimeEvent {
  id: string;
  type: "CONSOLE_ERROR" | "NETWORK_404" | "NETWORK_500" | "USER_FLOW_FAILURE";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  route?: string;
  component?: string;
  message: string;
  evidence: string;
  occurrences: number;
  firstSeenAt: string;
  lastSeenAt: string;
  userFlowSession?: string[];
  metadata?: Record<string, any>;
}

const inMemoryEvents: PersistedRuntimeEvent[] = [];
const EVENTS_DIR = path.resolve(process.cwd(), "reports", "runtime-events");

function ensureEventsDir() {
  if (isProductionEnvironment()) return;
  if (!fs.existsSync(EVENTS_DIR)) {
    fs.mkdirSync(EVENTS_DIR, { recursive: true });
  }
}

export function saveRuntimeEvents(events: PersistedRuntimeEvent[]): void {
  // Always update in-memory cache
  inMemoryEvents.length = 0;
  inMemoryEvents.push(...events);

  if (isProductionEnvironment()) {
    // In production Vercel serverless, bypass filesystem writes
    return;
  }

  try {
    ensureEventsDir();
    const filePath = path.join(EVENTS_DIR, "events-log.json");
    fs.writeFileSync(filePath, JSON.stringify(events, null, 2));
  } catch (err) {
    console.warn("[RuntimePersistence] Soft warning saving runtime events:", err);
  }
}

export function loadRuntimeEvents(): PersistedRuntimeEvent[] {
  if (inMemoryEvents.length > 0) return inMemoryEvents;

  if (isProductionEnvironment()) {
    return inMemoryEvents;
  }

  try {
    const filePath = path.join(EVENTS_DIR, "events-log.json");
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}
