import { createFileRoute } from "@tanstack/react-router";
import crypto from "crypto";

const STORAGE_BUCKET = "product-images";

// ── HMAC Verification (Mandatory) ──────────────────────────────────────────

function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const secret = process.env.META_APP_SECRET;
  if (!secret) return false;

  const expectedSignature = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  try {
    const signatureBuffer = Buffer.from(signatureHeader);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (signatureBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

// ── Service Role DB (Narrow Gateway — only after HMAC + integration verified) ──

async function getWebhookServiceDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (!supabaseAdmin) {
    throw new Error("503: Service Role client unavailable for webhook processing");
  }
  return supabaseAdmin;
}

// ── Tenant Resolution (Strict — No Fallback) ──────────────────────────────

async function resolveTenantFromPhoneNumberId(db: any, phoneNumberId: string): Promise<string | null> {
  // Only resolve through active whatsapp_integrations record
  const { data: integration, error } = await db
    .from("whatsapp_integrations")
    .select("tenant_id, status")
    .eq("phone_number_id", phoneNumberId)
    .maybeSingle();

  if (error) {
    console.error("[WA] Integration lookup DB error (not logged in detail for security)");
    return null;
  }

  if (!integration) return null;

  // Only active integrations are valid
  if (integration.status && integration.status !== "active") return null;

  return integration.tenant_id || null;
  // NO first-tenant fallback
  // NO metadata fallback
  // NO default-tenant fallback
}

// ── Atomic Idempotency via webhook_events ──────────────────────────────────

async function checkAndInsertWebhookEvent(
  db: any,
  tenantId: string,
  messageId: string,
): Promise<{ isNew: boolean; error?: string }> {
  // Atomic insert — unique constraint on (provider, external_event_id, tenant_id)
  const { error } = await db.from("webhook_events").insert({
    provider: "whatsapp",
    external_event_id: messageId,
    tenant_id: tenantId,
    status: "received",
    received_at: new Date().toISOString(),
  });

  if (error) {
    // Unique constraint violation = already processed
    if (error.code === "23505") {
      return { isNew: false };
    }
    // Actual DB error = block processing
    return { isNew: false, error: `DB idempotency check failed: ${error.message}` };
  }

  return { isNew: true };
}

async function updateWebhookEventStatus(
  db: any,
  tenantId: string,
  messageId: string,
  status: "processing" | "processed" | "failed" | "ignored",
) {
  await db
    .from("webhook_events")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("provider", "whatsapp")
    .eq("external_event_id", messageId)
    .eq("tenant_id", tenantId);
}

// ── Meta API Helpers ──────────────────────────────────────────────────────

async function fetchMetaMediaUrl(mediaId: string, waToken: string): Promise<string | null> {
  try {
    const res = await fetch(`https://graph.facebook.com/v25.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${waToken}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.url || null;
  } catch {
    return null;
  }
}

async function downloadBinary(
  metaUrl: string,
  waToken: string,
): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
  try {
    const res = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${waToken}` },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength === 0) return null;
    return { buffer, contentType };
  } catch {
    return null;
  }
}

// ── Storage Upload ────────────────────────────────────────────────────────

async function uploadToStorage(
  db: any,
  storagePath: string,
  buffer: ArrayBuffer,
  contentType: string,
): Promise<string | null> {
  const { error } = await db.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: true, cacheControl: "2592000" });

  if (error) {
    console.error("[WA Storage] Upload failed (details redacted for security)");
    return null;
  }

  const { data: urlData } = db.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  return urlData?.publicUrl || null;
}

// ── Safe file name helper ─────────────────────────────────────────────────

function sanitizeFileName(name: string, mimeType: string): string {
  const clean = name
    .replace(/[^\w\s.-]/gi, "_")
    .replace(/\s+/g, "_")
    .substring(0, 100);

  if (clean && /\.[a-z0-9]{2,5}$/i.test(clean)) return clean;

  const ext = mimeType.split("/")[1]?.split(";")[0] || "bin";
  return `${clean || "media"}.${ext}`;
}

// ── Hash helper for PII protection ────────────────────────────────────────

function hashForStorage(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").substring(0, 12);
}

// ── Route Definition ──────────────────────────────────────────────────────

export const Route = createFileRoute("/api/webhooks/whatsapp")({
  server: {
    handlers: {
      // GET: Meta Webhook Handshake Verification
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;
        if (!expectedToken) {
          console.error("[WA Webhook] WHATSAPP_VERIFY_TOKEN env var is not configured");
          return new Response("Integration not configured", { status: 503 });
        }

        if (mode === "subscribe" && token === expectedToken) {
          return new Response(challenge || "OK", { status: 200 });
        }

        return new Response("Forbidden", { status: 403 });
      },

      // POST: Signed, Tenant-Scoped, Idempotent Media Pipeline
      POST: async ({ request }) => {
        // 1. Read raw body BEFORE JSON parsing (required for HMAC)
        const rawBody = await request.text();

        // 2. HMAC Verification — MANDATORY (no dev bypass)
        const appSecret = process.env.META_APP_SECRET;
        if (!appSecret) {
          return new Response("Service Unavailable: META_APP_SECRET not configured", { status: 503 });
        }

        const signature = request.headers.get("X-Hub-Signature-256");
        if (!signature) {
          return new Response("Forbidden: Missing signature header", { status: 403 });
        }
        if (!verifyMetaSignature(rawBody, signature)) {
          return new Response("Forbidden: Invalid signature", { status: 403 });
        }

        // 3. Parse JSON
        let body: any;
        try {
          body = JSON.parse(rawBody);
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        // 4. Process ALL entries and changes (not just index 0)
        const entries = body?.entry || [];
        if (!Array.isArray(entries) || entries.length === 0) {
          return Response.json({ status: "ignored", reason: "no entries" }, { status: 200 });
        }

        const results: Array<{ messageId: string; status: string }> = [];

        for (const entry of entries) {
          const changes = entry?.changes || [];
          for (const change of changes) {
            if (change?.field && change.field !== "messages") {
              continue;
            }

            const value = change?.value;
            const messages = value?.messages;
            if (!messages?.length) continue;

            const phoneNumberId = value?.metadata?.phone_number_id;
            if (!phoneNumberId) {
              results.push({ messageId: "unknown", status: "missing_phone_number_id" });
              continue;
            }

            // 5. Service Role DB — only after HMAC verified
            let db: any;
            try {
              db = await getWebhookServiceDb();
            } catch {
              return Response.json({ error: "Service unavailable" }, { status: 503 });
            }

            // 6. Tenant Resolution — strict, no fallback
            const tenantId = await resolveTenantFromPhoneNumberId(db, phoneNumberId);
            if (!tenantId) {
              results.push({ messageId: "unknown", status: "tenant_not_found" });
              continue;
            }

            // 7. Process each message in this change
            for (const message of messages) {
              const messageId = message.id || `unknown_${Date.now()}`;
              const messageType: string = message.type;

              if (!["image", "video", "document"].includes(messageType)) {
                results.push({ messageId, status: "non_media_ignored" });
                continue;
              }

              // 8. Atomic Idempotency Check
              const idempotency = await checkAndInsertWebhookEvent(db, tenantId, messageId);
              if (idempotency.error) {
                return Response.json({ error: "Service unavailable: idempotency check failed" }, { status: 503 });
              }
              if (!idempotency.isNew) {
                results.push({ messageId, status: "already_processed" });
                continue;
              }

              // 9. Mark processing
              await updateWebhookEventStatus(db, tenantId, messageId, "processing");

              // 10. Verify Integration Token
              const waToken = process.env.WHATSAPP_API_TOKEN;
              if (!waToken) {
                await updateWebhookEventStatus(db, tenantId, messageId, "failed");
                results.push({ messageId, status: "integration_token_missing" });
                continue;
              }

              const mediaObj = message[messageType] || {};
              const mediaId: string = mediaObj.id || "";
              if (!mediaId) {
                await updateWebhookEventStatus(db, tenantId, messageId, "failed");
                results.push({ messageId, status: "missing_media_id" });
                continue;
              }

              // 11. Download Pipeline
              const metaTempUrl = await fetchMetaMediaUrl(mediaId, waToken);
              if (!metaTempUrl) {
                await updateWebhookEventStatus(db, tenantId, messageId, "failed");
                results.push({ messageId, status: "meta_cdn_unreachable" });
                continue;
              }

              const binary = await downloadBinary(metaTempUrl, waToken);
              if (!binary) {
                await updateWebhookEventStatus(db, tenantId, messageId, "failed");
                results.push({ messageId, status: "download_failed" });
                continue;
              }

              // 12. Storage Upload — hash phone number for privacy
              const senderPhone = message.from || "unknown";
              const senderHash = hashForStorage(senderPhone);
              const caption: string = mediaObj.caption || "";
              const mimeType: string = binary.contentType;
              const fileName = sanitizeFileName(
                caption || mediaObj.filename || `wa_${messageType}_${Date.now()}`,
                mimeType,
              );
              const storagePath = `whatsapp/${senderHash}/${Date.now()}_${fileName}`;

              const permanentUrl = await uploadToStorage(db, storagePath, binary.buffer, mimeType);
              if (!permanentUrl) {
                await updateWebhookEventStatus(db, tenantId, messageId, "failed");
                results.push({ messageId, status: "storage_upload_failed" });
                continue;
              }

              // 13. Insert media_files ONLY after Storage success
              const { error: insertError } = await db
                .from("media_files")
                .insert({
                  tenant_id: tenantId,
                  file_name: fileName,
                  file_path: storagePath,
                  file_url: permanentUrl,
                  file_type: (messageType === "video" ? "video" : "image") as "image" | "video" | "other",
                  mime_type: mimeType,
                  size_bytes: binary.buffer.byteLength,
                  source: "whatsapp",
                  metadata: {
                    whatsapp_message_id: messageId,
                    sender_hash: senderHash,
                    whatsapp_media_id: mediaId,
                    caption,
                    upload_success: true,
                    received_at: new Date().toISOString(),
                  },
                });

              if (insertError) {
                // Compensating cleanup: remove Storage object on DB failure
                try {
                  await db.storage.from(STORAGE_BUCKET).remove([storagePath]);
                } catch {
                  console.error("[WA] Compensating Storage cleanup failed (orphan may exist)");
                }
                await updateWebhookEventStatus(db, tenantId, messageId, "failed");
                results.push({ messageId, status: "db_insert_failed" });
                continue;
              }

              // 14. Mark processed
              await updateWebhookEventStatus(db, tenantId, messageId, "processed");
              results.push({ messageId, status: "success" });
            }
          }
        }

        // Safe response — no Storage paths, no URLs, no PII
        return Response.json(
          { status: "completed", processed: results.length, results },
          { status: 200 },
        );
      },
    },
  },
});
