/**
 * Phase 5 — Repair Patch Planner
 * Formulates RepairProposals with before/after diffs & risk assessment
 */
import { RootCauseReport } from "./root-cause-engine";

export interface RepairProposal {
  proposalId: string;
  incidentId: string;
  title: string;
  targetFile: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  beforeCodeSnippet: string;
  afterCodeSnippet: string;
  commitMessage: string;
  requiredVerification: string[];
  requiresApproval: boolean;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "EXECUTED" | "ROLLED_BACK";
  createdAt: string;
}

export function generateRepairProposal(report: RootCauseReport): RepairProposal {
  const proposalId = `PROP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  let beforeCodeSnippet = `<img src={product.image_url} />`;
  let afterCodeSnippet = `<img src={product.media_urls?.[0] || product.image_url} />`;

  if (report.targetFile.includes("product")) {
    beforeCodeSnippet = `const assetUrl = "/assets/product._slug-BR0ZjJtf.js";`;
    afterCodeSnippet = `const assetUrl = import.meta.env.BASE_URL + "assets/product._slug.js";`;
  }

  return {
    proposalId,
    incidentId: report.incidentId,
    title: `Repair Patch: ${report.title}`,
    targetFile: report.targetFile,
    riskLevel: report.severity === "CRITICAL" ? "HIGH" : "LOW",
    beforeCodeSnippet,
    afterCodeSnippet,
    commitMessage: `fix(quality): auto-repair ${report.incidentId} in ${report.targetFile}`,
    requiredVerification: ["npm run typecheck", "Quality Engine Audit"],
    requiresApproval: true,
    status: "PENDING_APPROVAL",
    createdAt: new Date().toISOString(),
  };
}
