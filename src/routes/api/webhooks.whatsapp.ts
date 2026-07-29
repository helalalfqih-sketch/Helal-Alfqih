import { createFileRoute } from "@tanstack/react-router";
import crypto from "crypto";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeFileName, extractCategoryAndTagsFromCaption } from "@/lib/whatsapp.functions";

const STORAGE_BUCKET = "product-images";

/** Get standard DB client */
async function getWebhookDb() {
  return supabase;
}

/** Verify Meta X-Hub-Signature-256 signature using timing-safe comparison */
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

/** Dynamic Tenant Resolution from WhatsApp phone_number_id */
async function resolveTenantFromPhoneNumberId(db: any, phoneNumberId: string): Promise<string | null> {
  try {
    // 1. Check whatsapp_integrations or storefront_settings
    const { data: integration } = await db
      .from("whatsapp_integrations")
      .select("tenant_id")
      .eq("phone_number_id", phoneNumberId)
      .maybeSingle();

    if (integration?.tenant_id) return integration.tenant_id;

    // 2. Query tenants table by phone_number_id in metadata
    const { data: tenant } = await db
      .from("tenants")
      .select("id")
      .eq("metadata->>whatsapp_phone_number_id", phoneNumberId)
      .maybeSingle();

    if (tenant?.id) return tenant.id;

    // 3. Fallback: first active tenant in DB if single-tenant environment
    const { data: firstTenant } = await db.from("tenants").select("id").limit(1).maybeSingle();
    return firstTenant?.id || null;
  } catch (err) {
    console.error("[WA] resolveTenantFromPhoneNumberId error:", err);
    return null;
  }
}

/** Check if WhatsApp message was already processed (Idempotency) */
async function isMessageAlreadyProcessed(db: any, tenantId: string, messageId: string): Promise<boolean> {
  try {
    const { data } = await db
      .from("media_files")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("metadata->>whatsapp_message_id", messageId)
      .maybeSingle();

    return !!data;
  } catch {
    return false;
  }
}

/** Fetch Meta CDN URL */
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

/** Download Binary from Meta CDN */
async function downloadBinary(
  metaUrl: string,
  waToken: string
): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
  try {
    const res = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${waToken}` },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();
    return { buffer, contentType };
  } catch {
    return null;
  }
}

/** Upload binary to Supabase Storage */
async function uploadToStorage(
  db: any,
  storagePath: string,
  buffer: ArrayBuffer,
  contentType: string
): Promise<string | null> {
  try {
    const { error } = await db.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, { contentType, upsert: true, cacheControl: "2592000" });

    if (error) {
      console.error(`[WA Storage] Bucket upload error: ${error.message}`);
      return null;
    }

    const { data: urlData } = db.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
    return urlData?.publicUrl || null;
  } catch (err: any) {
    console.error("[WA Storage] Exception during upload:", err?.message || err);
    return null;
  }
}

export const Route = createFileRoute("/api/webhooks/whatsapp")({
  server: {
    handlers: {
      // ── GET: Meta Webhook Handshake Verification ─────────────────────────
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;
        if (!expectedToken) {
          console.error("[WA Webhook] ❌ WHATSAPP_VERIFY_TOKEN env var is not configured");
          return new Response("Integration not configured", { status: 503 });
        }

        if (mode === "subscribe" && token === expectedToken) {
          console.log("[WA Webhook] ✅ Handshake verified");
          return new Response(challenge || "OK", { status: 200 });
        }

        console.warn("[WA Webhook] ❌ Verification failed: token mismatch");
        return new Response("Forbidden", { status: 403 });
      },

      // ── POST: Full Media Pipeline with Signature & Auth Verification ─────
      POST: async ({ request }) => {
        // 1. Read raw body text BEFORE parsing JSON
        const rawBody = await request.text();

        // 2. Verify Meta X-Hub-Signature-256 HMAC Signature
        const signature = request.headers.get("X-Hub-Signature-256");
        if (process.env.NODE_ENV === "production" || process.env.META_APP_SECRET) {
          if (!signature) {
            return new Response("Forbidden: Missing signature header", { status: 403 });
          }
          if (!verifyMetaSignature(rawBody, signature)) {
            return new Response("Forbidden: Invalid signature", { status: 403 });
          }
        }

        // 3. Parse JSON
        let body: any;
        try {
          body = JSON.parse(rawBody);
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const entry = body?.entry?.[0];
        const change = entry?.changes?.[0];
        const field = change?.field;
        const value = change?.value;

        if (field && field !== "messages") {
          return Response.json({ status: "acknowledged", field }, { status: 200 });
        }

        const messages = value?.messages;
        if (!messages?.length) {
          return Response.json({ status: "ignored", reason: "no messages" }, { status: 200 });
        }

        const message = messages[0];
        const senderPhone: string = message.from || "unknown";
        const messageType: string = message.type;

        if (!["image", "video", "document"].includes(messageType)) {
          return Response.json({ status: "ignored", reason: `non-media type: ${messageType}` }, { status: 200 });
        }

        // 4. Resolve Tenant from phone_number_id — NOT default hardcoded tenant
        const phoneNumberId = value?.metadata?.phone_number_id;
        if (!phoneNumberId) {
          return Response.json({ error: "Missing phone_number_id" }, { status: 400 });
        }

        const db = await getWebhookDb();
        const tenantId = await resolveTenantFromPhoneNumberId(db, phoneNumberId);
        if (!tenantId) {
          return Response.json({ error: "Tenant not found for this phone_number_id" }, { status: 404 });
        }

        // 5. Check Idempotency
        const messageId = message.id;
        if (messageId && await isMessageAlreadyProcessed(db, tenantId, messageId)) {
          return Response.json({ status: "already_processed", messageId }, { status: 200 });
        }

        // 6. Verify Integration Tokens
        const waToken = process.env.WHATSAPP_API_TOKEN;
        if (!waToken) {
          return Response.json({ error: "Integration not configured: WHATSAPP_API_TOKEN missing" }, { status: 503 });
        }

        const mediaObj = message[messageType] || {};
        const mediaId: string = mediaObj.id || "";
        if (!mediaId) {
          return Response.json({ error: "Missing media_id in message payload" }, { status: 400 });
        }

        // 7. Download & Storage Upload Pipeline (Fail-Closed)
        const metaTempUrl = await fetchMetaMediaUrl(mediaId, waToken);
        if (!metaTempUrl) {
          return Response.json({ error: "Media download failed: Meta CDN URL unreachable" }, { status: 502 });
        }

        const binary = await downloadBinary(metaTempUrl, waToken);
        if (!binary || binary.buffer.byteLength === 0) {
          return Response.json({ error: "Media download failed: Empty binary received from Meta" }, { status: 502 });
        }

        const caption: string = mediaObj.caption || "";
        const mimeType: string = binary.contentType;
        const fileName = sanitizeFileName(caption || mediaObj.filename || `wa_${messageType}_${Date.now()}`, mimeType);
        const { category, tags } = extractCategoryAndTagsFromCaption(caption || fileName);
        const storagePath = `whatsapp/${senderPhone}/${Date.now()}_${fileName}`;

        const permanentUrl = await uploadToStorage(db, storagePath, binary.buffer, mimeType);
        if (!permanentUrl) {
          return Response.json({ error: "Storage upload failed: Could not store media binary" }, { status: 502 });
        }

        // 8. Insert into media_files ONLY AFTER successful storage upload
        const insertPayload = {
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
            sender_phone: senderPhone,
            whatsapp_media_id: mediaId,
            caption,
            category,
            tags,
            thumbnail_url: messageType === "video" ? null : permanentUrl,
            upload_success: true,
            received_at: new Date().toISOString(),
          },
        };

        const { data: mediaRecord, error: insertError } = await db
          .from("media_files")
          .insert(insertPayload)
          .select("id")
          .single();

        if (insertError) {
          console.error("[WA] Database record insert error:", insertError.message);
          return Response.json({ error: "Database record creation failed" }, { status: 500 });
        }

        return Response.json(
          {
            status: "success",
            mediaFileId: mediaRecord?.id,
            fileName,
            permanentUrl,
            category,
            tags,
            bytes: binary.buffer.byteLength,
          },
          { status: 200 }
        );
      },
    },
  },
});
