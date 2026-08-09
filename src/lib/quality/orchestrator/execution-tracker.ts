/**
 * Phase 8.1 — Execution Tracker
 * Logs execution progress and verification metrics for engineering tasks
 */

export interface ExecutionLogEntry {
  taskId: string;
  stepName: string;
  status: "STARTED" | "PASSED" | "FAILED";
  durationMs: number;
  logOutput?: string;
  timestamp: string;
}

const executionTrackerLogs: ExecutionLogEntry[] = [];

export function logTaskExecutionStep(log: Omit<ExecutionLogEntry, "timestamp">) {
  executionTrackerLogs.push({
    ...log,
    timestamp: new Date().toISOString(),
  });
}

export function getTaskExecutionLogs(taskId: string): ExecutionLogEntry[] {
  return executionTrackerLogs.filter((l) => l.taskId === taskId);
}
