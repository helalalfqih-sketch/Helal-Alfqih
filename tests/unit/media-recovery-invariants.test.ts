import { describe, expect, it } from "vitest";
import {
  checkMetaCredentials,
  parseAndValidateBase64Image,
} from "../../src/services/media/recovery.service";
import { runMetaCatalogRecovery } from "../../src/services/media/meta-recovery.service";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("Media Recovery Invariants & Safety Gates", () => {
  it("checkMetaCredentials identifies missing Meta/WhatsApp environment variables safely", () => {
    const creds = checkMetaCredentials();
    expect(creds.hasCredentials).toBe(false);
    expect(creds.missingNames).toContain("WHATSAPP_API_TOKEN");
    expect(creds.missingNames).toContain("WHATSAPP_BUSINESS_ACCOUNT_ID");
  });

  it("runMetaCatalogRecovery halts safely when credentials are missing without throwing", async () => {
    const mockSupabase = {} as unknown as SupabaseClient;
    const report = await runMetaCatalogRecovery(mockSupabase, { dryRun: true });
    expect(report.hasCredentials).toBe(false);
    expect(report.missingCredentials.length).toBeGreaterThan(0);
    expect(report.exactMatches).toBe(0);
    expect(report.storageObjectsUploaded).toBe(0);
  });

  it("parseAndValidateBase64Image validates valid Base64 payloads server-side", () => {
    const sampleBase64 =
      "data:image/png;base64,iVBORw0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAAANSU0KGgoAAA==";
    const validated = parseAndValidateBase64Image(sampleBase64);
    expect(validated).not.toBeNull();
    if (validated) {
      expect(validated.mimeType).toBe("image/png");
      expect(validated.extension).toBe("png");
      expect(validated.sha256.length).toBe(64);
      expect(validated.sizeBytes).toBeGreaterThan(0);
    }
  });

  it("parseAndValidateBase64Image rejects malformed or invalid MIME strings", () => {
    expect(parseAndValidateBase64Image("not-a-base64-image")).toBeNull();
    expect(parseAndValidateBase64Image("data:image/unsupported;base64,1234")).toBeNull();
  });
});
