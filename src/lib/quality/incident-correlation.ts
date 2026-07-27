/**
 * Phase 3 — Incident Correlation Engine
 * Aggregates runtime failures & build changes into unified incidents
 */
import { EnrichedAuditResult } from "./evidence-engine";

export interface CorrelatedIncident {
  id: string;
  title: string;
  auditCount: number;
  primaryAuditId: string;
  evidenceSummary: string;
  correlatedAt: string;
}

export function correlateRuntimeIncidents(results: EnrichedAuditResult[]): CorrelatedIncident[] {
  const failedResults = results.filter((r) => r.status === "FAIL");
  if (failedResults.length === 0) return [];

  return [
    {
      id: `CORR-INC-${Date.now()}`,
      title: `Correlated ${failedResults.length} failing audits in current run`,
      auditCount: failedResults.length,
      primaryAuditId: failedResults[0].auditId,
      evidenceSummary: failedResults.map((r) => r.name).join(", "),
      correlatedAt: new Date().toISOString(),
    },
  ];
}
