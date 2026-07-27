/**
 * Phase 8.1 — Workflow Engine & State Machine
 * Orchestrates engineering task state transitions
 */
import { EngineeringTask } from "./task-orchestrator";

export type TaskState = EngineeringTask["status"];

export function transitionTaskState(
  task: EngineeringTask,
  nextState: TaskState
): EngineeringTask {
  const allowedTransitions: Record<TaskState, TaskState[]> = {
    DETECTED: ["ANALYZED"],
    ANALYZED: ["WAITING_APPROVAL"],
    WAITING_APPROVAL: ["EXECUTING", "ANALYZED"],
    EXECUTING: ["VERIFIED"],
    VERIFIED: ["COMPLETED"],
    COMPLETED: [],
  };

  const validNextStates = allowedTransitions[task.status] || [];
  if (!validNextStates.includes(nextState)) {
    throw new Error(`Invalid state transition: Cannot transition task ${task.taskId} from ${task.status} to ${nextState}`);
  }

  return {
    ...task,
    status: nextState,
  };
}
