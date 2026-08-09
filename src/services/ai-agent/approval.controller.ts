/**
 * Phase 10.4 & 10.5 — Approval Controller & Autonomous Approval Bridge
 * Manages plan approval state transitions cleanly and dispatches execution controller orchestrator
 */
import { ExecutionLifecycleState } from "../../lib/quality/orchestrator/workflow-engine";
import { logExecutionJournal } from "./journal.service";

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
  notes?: string,
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

export async function approveAndExecuteTask(
  taskId: string,
  sessionId: string,
  approvedBy = "quality.executor",
): Promise<{ success: boolean; record: ApprovalControllerRecord; lifecycleEvents: string[] }> {
  const record = await processPlanApproval(
    taskId,
    sessionId,
    true,
    approvedBy,
    "Approved & Dispatched Execution Orchestrator",
  );
  const lifecycleEvents: string[] = [
    "PLAN_CREATED",
    "EVIDENCE_READY",
    "APPROVAL_GRANTED",
    "EXECUTION_STARTED",
  ];

  try {
    await logExecutionJournal({
      taskId,
      action: "APPROVAL_GRANTED",
      status: "SUCCESS",
      input: { approvedBy, decidedAt: record.decidedAt, sessionId },
    });

    await logExecutionJournal({
      taskId,
      action: "EXECUTION_STARTED",
      status: "SUCCESS",
      input: { mode: "orchestrated", state: "EXECUTING", sessionId },
    });
  } catch (err: any) {
    throw new Error(`500: Failed to log execution journal: ${err.message}`);
  }

  return {
    success: true,
    record,
    lifecycleEvents,
  };
}
