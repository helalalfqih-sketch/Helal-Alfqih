import { getAdminDb } from "@/lib/ai-agent.functions";
import { savePersistentExecutionEvent } from "./journal.service";
import { AgentTaskState } from "./agent.state";

export interface ExecutionControllerOptions {
  taskId: string;
  tenantId: string;
  sessionId: string;
  userId?: string;
}

export async function approvePlan(options: ExecutionControllerOptions): Promise<{ success: boolean; taskId: string }> {
  const db = await getAdminDb({});
  const { taskId, tenantId, sessionId } = options;

  await db
    .from("ai_agent_tasks")
    .update({
      status: "executing",
      user_approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("tenant_id", tenantId);

  await db
    .from("ai_agent_sessions")
    .update({ task_status: "executing", updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("tenant_id", tenantId);

  await savePersistentExecutionEvent({
    sessionId,
    taskId,
    tenantId,
    eventType: "STATE_CHANGE",
    state: AgentTaskState.WAITING_APPROVAL,
    message: "✓ Engineering plan approved. Execution controller initialized.",
    progress: 55,
  });

  return { success: true, taskId };
}

export async function startExecution(options: ExecutionControllerOptions): Promise<{ success: boolean; output: string }> {
  const { executeApprovedTask } = await import("@/lib/ai-agent.functions");
  const { taskId, tenantId, sessionId } = options;

  await savePersistentExecutionEvent({
    sessionId,
    taskId,
    tenantId,
    eventType: "STATE_CHANGE",
    state: AgentTaskState.EXECUTING,
    message: "⚙️ Starting autonomous step dispatcher execution...",
    progress: 60,
  });

  // Execute approved steps
  const res = (await executeApprovedTask({ data: { taskId } })) as any;
  return res;
}

export async function resumeExecution(options: ExecutionControllerOptions): Promise<{ success: boolean; output: string }> {
  return startExecution(options);
}

export async function cancelExecution(options: ExecutionControllerOptions): Promise<{ success: boolean }> {
  const db = await getAdminDb({});
  const { taskId, tenantId, sessionId } = options;

  await db
    .from("ai_agent_tasks")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("tenant_id", tenantId);

  await savePersistentExecutionEvent({
    sessionId,
    taskId,
    tenantId,
    eventType: "STATE_CHANGE",
    state: AgentTaskState.FAILED,
    message: "🛑 Execution cancelled by user",
    progress: 0,
  });

  return { success: true };
}
