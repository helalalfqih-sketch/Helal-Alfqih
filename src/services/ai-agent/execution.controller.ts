import { getAdminDb } from "@/lib/ai-agent.functions";
import { savePersistentExecutionEvent, logExecutionJournal } from "./journal.service";
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

  try {
    await db
      .from("ai_agent_tasks")
      .update({
        status: "executing",
        user_approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId);
  } catch (e) {
    console.warn("[ExecutionController] approvePlan update warning:", e);
  }

  await savePersistentExecutionEvent({
    sessionId: sessionId || "default",
    taskId,
    tenantId: tenantId || "default",
    eventType: "STATE_CHANGE",
    state: AgentTaskState.WAITING_APPROVAL,
    message: "✓ Engineering plan approved. Execution controller initialized.",
    progress: 55,
  });

  return { success: true, taskId };
}

export async function startExecution(options: ExecutionControllerOptions): Promise<{ success: boolean; output?: string; failureDetails?: any }> {
  const { executeApprovedTask } = await import("@/lib/ai-agent.functions");
  const { taskId, tenantId, sessionId } = options;

  await logExecutionJournal({
    taskId,
    tenantId: tenantId || "default",
    action: "EXECUTION_STARTED",
    tool: "startExecution",
    input: { taskId, sessionId },
    output: { status: "started" },
    status: "PENDING",
  });

  await savePersistentExecutionEvent({
    sessionId: sessionId || "default",
    taskId,
    tenantId: tenantId || "default",
    eventType: "STATE_CHANGE",
    state: AgentTaskState.EXECUTING,
    message: "⚙️ Executing tasks via Execution Controller Orchestrator...",
    progress: 60,
  });

  try {
    const res = (await executeApprovedTask({ data: { taskId } })) as any;

    if (res?.success) {
      await logExecutionJournal({
        taskId,
        tenantId: tenantId || "default",
        action: "EXECUTION_COMPLETED",
        tool: "startExecution",
        input: { taskId },
        output: { status: "all_steps_passed", output: res.buildOutput },
        status: "SUCCESS",
      });

      await savePersistentExecutionEvent({
        sessionId: sessionId || "default",
        taskId,
        tenantId: tenantId || "default",
        eventType: "COMPLETION",
        state: AgentTaskState.COMPLETED,
        message: "🎉 All engineering steps applied & build validation passed cleanly!",
        progress: 100,
      });

      return { success: true, output: res.buildOutput };
    } else {
      await logExecutionJournal({
        taskId,
        tenantId: tenantId || "default",
        action: "EXECUTION_FAILED",
        tool: "startExecution",
        input: { taskId },
        output: { status: "build_failed", failureDetails: res?.failureDetails },
        status: "FAILED",
      });

      await savePersistentExecutionEvent({
        sessionId: sessionId || "default",
        taskId,
        tenantId: tenantId || "default",
        eventType: "ERROR",
        state: AgentTaskState.FAILED,
        message: `❌ Task execution failed: ${res?.failureDetails?.reason || "Verification error"}`,
        progress: 95,
      });

      return res;
    }
  } catch (err: any) {
    const errorMsg = err.message || String(err);
    await logExecutionJournal({
      taskId,
      tenantId: tenantId || "default",
      action: "EXECUTION_FAILED",
      tool: "startExecution",
      input: { taskId },
      output: { error: errorMsg },
      status: "FAILED",
    });

    await savePersistentExecutionEvent({
      sessionId: sessionId || "default",
      taskId,
      tenantId: tenantId || "default",
      eventType: "ERROR",
      state: AgentTaskState.FAILED,
      message: `❌ Execution orchestrator exception: ${errorMsg}`,
      progress: 0,
    });

    throw err;
  }
}

export async function resumeExecution(options: ExecutionControllerOptions): Promise<{ success: boolean; output?: string }> {
  return startExecution(options);
}

export async function cancelExecution(options: ExecutionControllerOptions): Promise<{ success: boolean }> {
  const db = await getAdminDb({});
  const { taskId, tenantId, sessionId } = options;

  try {
    await db
      .from("ai_agent_tasks")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", taskId);
  } catch (e) {
    console.warn("[ExecutionController] cancelExecution warning:", e);
  }

  await savePersistentExecutionEvent({
    sessionId: sessionId || "default",
    taskId,
    tenantId: tenantId || "default",
    eventType: "STATE_CHANGE",
    state: AgentTaskState.FAILED,
    message: "🛑 Execution cancelled by user",
    progress: 0,
  });

  return { success: true };
}
