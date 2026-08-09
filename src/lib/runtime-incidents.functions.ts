import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveTenantId } from "@/lib/saas/tenant-context";
import { processIngestedIncident } from "@/services/runtime-incidents/incident-ingestion.service";
import type { IncidentRecord, IncidentStats } from "@/features/runtime-incidents/types/incident.types";

/** Server Fn: List all production runtime incidents for tenant */
export const listRuntimeIncidents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: { context: any }): Promise<{ incidents: IncidentRecord[]; stats: IncidentStats }> => {
    const ctx = context;
    const db = ctx?.supabase || supabase;
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    const { data, error } = await db
      .from("runtime_incidents")
      .select("*")
      .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
      .order("last_seen_at", { ascending: false })
      .limit(100);

    if (error) {
      throw new Error(`فشل استعلام حوادث التشغيل: ${error.message}`);
    }

    const incidents = (data as unknown as IncidentRecord[]) || [];

    const stats: IncidentStats = {
      total: incidents.length,
      open: incidents.filter((i) => i.status === "open").length,
      fatal: incidents.filter((i) => i.level === "fatal").length,
      warning: incidents.filter((i) => i.level === "warn").length,
      resolved: incidents.filter((i) => i.status === "resolved").length,
    };

    return { incidents, stats };
  });

/** Server Fn: Ingest a runtime incident (Sanitized, Fingerprinted, Deduplicated) */
export const ingestRuntimeIncident = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      level: z.enum(["error", "warn", "fatal", "info"]).optional(),
      title: z.string().optional(),
      message: z.string().min(1),
      stackTrace: z.string().optional(),
      source: z.string().optional(),
      context: z.record(z.any()).optional(),
      statusCode: z.number().optional(),
      responseBody: z.any().optional(),
    })
  )
  .handler(async ({ data, context }: { data: any; context: any }) => {
    const ctx = context;
    const db = ctx?.supabase || supabase;
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    const result = await processIngestedIncident(db, tenantId, data);
    return result;
  });
