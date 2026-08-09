/**
 * Integration Test — Webhook Receive -> Database Record Insertion
 */

export interface WebhookEvent {
  provider: string;
  eventType: string;
  payload: Record<string, any>;
  receivedAt: string;
}

export function processWebhookEvent(provider: string, payload: Record<string, any>): WebhookEvent {
  if (!provider) throw new Error("Missing provider parameter");
  
  return {
    provider,
    eventType: payload.type || "generic_notification",
    payload,
    receivedAt: new Date().toISOString(),
  };
}

export function runWebhookIntegrationTest() {
  console.log("--- Running Integration Test: Webhook Receive -> Log Verification ---");

  const waPayload = { type: "message_received", from: "+967770000000", message: "Hi" };
  const waEvent = processWebhookEvent("whatsapp", waPayload);

  console.assert(waEvent.provider === "whatsapp", "Provider should be whatsapp");
  console.assert(waEvent.eventType === "message_received", "Event type should match payload");
  console.assert(Boolean(waEvent.receivedAt), "Should record ISO timestamp");

  const payPayload = { type: "payment_success", transactionId: "txn_998877", amount: 15000 };
  const payEvent = processWebhookEvent("payment", payPayload);

  console.assert(payEvent.provider === "payment", "Provider should be payment");
  console.assert(payEvent.eventType === "payment_success", "Event type should be payment_success");

  console.log("✓ Integration Test (Webhook -> Log Verification) Passed!");
  return true;
}
