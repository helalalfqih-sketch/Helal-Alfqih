/**
 * Phase 4.5 — Runtime Event Persistence Layer
 * Aggregates runtime events with occurrence counts, session context & timestamps
 */
import fs from "fs";
import path from "path";

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

const EVENTS_DIR = path.resolve(process.cwd(), "reports", "runtime-events");

function ensureEventsDir() {
  if (!fs.existsSync(EVENTS_DIR)) {
    fs.mkdirSync(EVENTS_DIR, { recursive: true });
  }
}

export function saveRuntimeEvents(events: PersistedRuntimeEvent[]): void {
  try {
    ensureEventsDir();
    const filePath = path.join(EVENTS_DIR, "events-log.json");
    fs.writeFileSync(filePath, JSON.stringify(events, null, 2));
  } catch (err) {
    console.warn("[RuntimePersistence] Soft warning saving runtime events:", err);
  }
}

export function loadRuntimeEvents(): PersistedRuntimeEvent[] {
  try {
    const filePath = path.join(EVENTS_DIR, "events-log.json");
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}
