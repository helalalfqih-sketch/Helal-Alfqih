import crypto from "crypto";
import type {
  IncidentIngestionPayload,
  IncidentLevel,
  IncidentRecord,
} from "@/features/runtime-incidents/types/incident.types";

/**
 * Sanitize sensitive keys and values from context payloads.
 * Redacts passwords, bearer tokens, API keys, and signed URLs.
 */
export function sanitizeContextData(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeContextData(item));
  }

  const sanitized: Record<string, any> = {};
  const sensitiveKeys = new Set([
    "password",
    "token",
    "secret",
    "authorization",
    "apikey",
    "key",
    "signature",
  ]);

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (
      sensitiveKeys.has(lowerKey) ||
      lowerKey.includes("secret") ||
      lowerKey.includes("password") ||
      lowerKey.includes("token")
    ) {
      sanitized[key] = "[REDACTED_SENSITIVE_DATA]";
    } else if (typeof value === "string") {
      // Redact signed URL parameters
      sanitized[key] = value.replace(/(token|sig|X-Amz-Signature|apiKey)=[^&]+/gi, "$1=[REDACTED]");
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeContextData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Generate a deterministic SHA-256 fingerprint for deduplication.
 */
export function generateIncidentFingerprint(
  level: string,
  source: string,
  message: string,
  stack?: string,
): string {
  const normalizedMsg = message.replace(/0x[0-9a-fA-F]+/g, "[HEX]").replace(/\d+/g, "[NUM]");
  const firstStackLine = stack ? stack.split("\n")[0] || "" : "";
  const raw = `${level}:${source}:${normalizedMsg}:${firstStackLine}`;
  return crypto.createHash("sha256").update(raw).digest("hex").substring(0, 32);
}

/**
 * Check if the payload is an expected auth redirect flow, which should NOT be logged as a runtime crash incident.
 */
export function isExpectedAuthRedirect(payload: IncidentIngestionPayload): boolean {
  const msg = payload.message || "";
  const stack = payload.stackTrace || "";
  const ctxStr = JSON.stringify(payload.context || {});

  if (msg.includes("Unauthorized: No authorization header provided")) return true;
  if (msg.includes("Unauthorized: No token provided")) return true;
  if (msg.includes("REDIRECT_TO_AUTH")) return true;
  if (ctxStr.includes("/auth?next=")) return true;
  if (payload.statusCode === 401 && (msg.includes("redirect") || msg.includes("login")))
    return true;

  return false;
}

/**
 * Process and ingest an incident into DB with deduplication.
 */
export async function processIngestedIncident(
  db: any,
  tenantId: string | null,
  payload: IncidentIngestionPayload,
): Promise<{ ingested: boolean; recordId?: string; reason?: string }> {
  // 1. Ignore normal auth redirects
  if (isExpectedAuthRedirect(payload)) {
    return { ingested: false, reason: "EXPECTED_AUTH_REDIRECT_FILTERED" };
  }

  // 2. Classify semantic failures: HTTP 200 containing error payload
  let level: IncidentLevel = payload.level || "error";
  let title = payload.title || "Runtime Failure";
  let message = payload.message;

  if (payload.statusCode === 200 && payload.responseBody?.error) {
    level = "error";
    title = `Semantic Failure (HTTP 200 with Error Payload)`;
    message = `Application error in 200 response: ${payload.responseBody.error}`;
  }

  const sanitizedContext = sanitizeContextData(payload.context || {});
  const fingerprint = generateIncidentFingerprint(
    level,
    payload.source || "server",
    message,
    payload.stackTrace,
  );

  // 3. Upsert incident record for deduplication
  const { data: existing } = await db
    .from("runtime_incidents")
    .select("id, occurrences_count")
    .eq("fingerprint", fingerprint)
    .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
    .maybeSingle();

  if (existing) {
    const { error: updateErr } = await db
      .from("runtime_incidents")
      .update({
        occurrences_count: (existing.occurrences_count || 1) + 1,
        last_seen_at: new Date().toISOString(),
        context: sanitizedContext,
      })
      .eq("id", existing.id);

    if (updateErr) throw new Error(`Failed to update incident: ${updateErr.message}`);
    return { ingested: true, recordId: existing.id, reason: "DEDUPLICATED_INCREMENT" };
  }

  const insertPayload = {
    tenant_id: tenantId,
    fingerprint,
    level,
    title,
    message,
    stack_trace: payload.stackTrace || null,
    source: payload.source || "server",
    context: sanitizedContext,
    occurrences_count: 1,
    first_seen_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    status: "open",
  };

  const { data: inserted, error: insertErr } = await db
    .from("runtime_incidents")
    .insert(insertPayload)
    .select("id")
    .single();

  if (insertErr) {
    throw new Error(`Failed to insert runtime incident: ${insertErr.message}`);
  }

  return { ingested: true, recordId: inserted?.id };
}
