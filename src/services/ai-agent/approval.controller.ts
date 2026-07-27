/**
 * Phase 10.4 — Approval Controller & Auto-Approve Gate
 * Manages plan approval state transitions cleanly (WAITING_APPROVAL -> APPROVED -> EXECUTING)
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { transitionExecutionState, ExecutionLifecycleState } from "../../lib/quality/orchestrator/workflow-engine";

export interface ApprovalControllerRecord {
  taskId: string;
  sessionId: string;
  state: ExecutionLifecycleState;
  approvedBy: string;
  notes?: string;
  decidedAt: string;
}

const activePlanApprovals: Map<string, ApprovalControllerRecord> = new Map();

export async function processPlanApproval(
  taskId: string,
  sessionId: string,
  approved: boolean,
  approvedBy = "quality.executor",
  notes?: string
): Promise<ApprovalControllerRecord> {
  const nextState: ExecutionLifecycleState = approved ? "APPROVED" : "FAILED";
  const record: ApprovalControllerRecord = {
    taskId,
    sessionId,
    state: nextState,
    approvedBy,
    notes: notes || (approved ? "Approved by human engineer" : "Rejected by human engineer"),
    decidedAt: new Date().toISOString(),
  };

  activePlanApprovals.set(taskId, record);
  return record;
}

export async function evaluateAutoApproveGate(
  taskId: string,
  sessionId: string,
  executionMode: "AUTO" | "MANUAL",
  confidenceScore: number,
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
): Promise<{ autoApproved: boolean; record: ApprovalControllerRecord }> {
  const shouldAutoApprove = executionMode === "AUTO" && confidenceScore >= 85 && riskLevel === "LOW";
  const record = await processPlanApproval(
    taskId,
    sessionId,
    shouldAutoApprove,
    shouldAutoApprove ? "auto.gate" : "quality.executor",
    shouldAutoApprove ? "Auto-approved by policy gate (High Confidence & Low Risk)" : "Pending human review"
  );

  return {
    autoApproved: shouldAutoApprove,
    record,
  };
}

export const approvePlanFn = createServerFn({ method: "POST" })
  .validator(z.object({ taskId: z.string(), sessionId: z.string() }))
  .handler(async ({ data }) => {
    const record = await processPlanApproval(data.taskId, data.sessionId, true);
    return { success: true, record };
  });

export const rejectPlanFn = createServerFn({ method: "POST" })
  .validator(z.object({ taskId: z.string(), sessionId: z.string(), reason: z.string().optional() }))
  .handler(async ({ data }) => {
    const record = await processPlanApproval(data.taskId, data.sessionId, false, "quality.executor", data.reason);
    return { success: true, record };
  });
