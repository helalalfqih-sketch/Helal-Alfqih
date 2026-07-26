import { getAdminDb } from "@/lib/ai-agent.functions";
import { savePersistentExecutionEvent, logExecutionJournal, hasExecutionStartedLog, type AgentExecutionError } from "./journal.service";
import { AgentTaskState } from "./agent.state";

export interface ExecutionControllerOptions {
  taskId: string;
  tenantId: string;
  sessionId: string;
  userId?: string;
  skipPlanCheck?: boolean;
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
  const db = await getAdminDb(options);
  const { taskId, tenantId, sessionId } = options;

  console.log("[EXECUTION_CONTROLLER] START", { taskId, sessionId, tenantId });

  // Mandatory Plan Approval Guard
  const cleanSessionId = sessionId || taskId.replace(/^task-/, "");
  const { data: approvedPlan } = await db
    .from("ai_agent_plans")
    .select("id, status")
    .or(`id.eq.${taskId},session_id.eq.${cleanSessionId}`)
    .eq("status", "APPROVED")
    .maybeSingle();

  if (!approvedPlan && !options.skipPlanCheck) {
    console.warn("[EXECUTION_CONTROLLER] Execution blocked: Engineering plan approval required for task", taskId);
    return {
      success: false,
      output: "Execution blocked: Engineering plan approval required",
      failureDetails: {
        reason: "Execution blocked: Engineering plan approval required",
        errorType: "PLAN_REQUIRED",
      },
    };
  }

  // 1. Deduplication guard — prevent duplicate EXECUTION_STARTED logs
  const alreadyStarted = await hasExecutionStartedLog(taskId, db);
  if (!alreadyStarted) {
    // 2. Atomic initialization: Log EXECUTION_STARTED as PENDING
    await logExecutionJournal({
      taskId,
      tenantId: tenantId || "default",
      action: "EXECUTION_STARTED",
      tool: "startExecution",
      input: { taskId, sessionId },
      output: { status: "started" },
      status: "PENDING",
    }, db);

    await savePersistentExecutionEvent({
      sessionId: sessionId || "default",
      taskId,
      tenantId: tenantId || "default",
      eventType: "STATE_CHANGE",
      state: AgentTaskState.EXECUTING,
      message: "⚙️ Executing tasks via Execution Controller Orchestrator...",
      progress: 60,
    }, db);
  }

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
      }, db);

      await savePersistentExecutionEvent({
        sessionId: sessionId || "default",
        taskId,
        tenantId: tenantId || "default",
        eventType: "COMPLETION",
        state: AgentTaskState.COMPLETED,
        message: "🎉 All engineering steps applied & build validation passed cleanly!",
        progress: 100,
      }, db);

      return { success: true, output: res.buildOutput };
    } else {
      const errDetails: AgentExecutionError = {
        message: res?.failureDetails?.reason || res?.buildOutput || "Verification / Build Error",
        stack: res?.failureDetails?.stack,
        stdout: res?.failureDetails?.stdout,
        stderr: res?.failureDetails?.stderr,
        failed_step: res?.failureDetails?.failed_step || "BUILD_VALIDATION",
        tool_name: res?.failureDetails?.tool_name || "npm_build",
      };

      await logExecutionJournal({
        taskId,
        tenantId: tenantId || "default",
        action: "EXECUTION_FAILED",
        tool: "startExecution",
        input: { taskId },
        output: { status: "build_failed", failureDetails: errDetails },
        status: "FAILED",
      }, db);

      await savePersistentExecutionEvent({
        sessionId: sessionId || "default",
        taskId,
        tenantId: tenantId || "default",
        eventType: "ERROR",
        state: AgentTaskState.FAILED,
        message: `❌ Task execution failed: ${errDetails.message}`,
        progress: 95,
      }, db);

      return { ...res, failureDetails: errDetails };
    }
  } catch (err: any) {
    const errDetails: AgentExecutionError = {
      message: err.message || String(err),
      stack: err.stack,
      stdout: err.stdout,
      stderr: err.stderr,
      failed_step: err.failed_step || "startExecution",
      tool_name: err.tool_name || "startExecution",
    };

    await logExecutionJournal({
      taskId,
      tenantId: tenantId || "default",
      action: "EXECUTION_FAILED",
      tool: "startExecution",
      input: { taskId },
      output: { error: errDetails },
      status: "FAILED",
    }, db);

    await savePersistentExecutionEvent({
      sessionId: sessionId || "default",
      taskId,
      tenantId: tenantId || "default",
      eventType: "ERROR",
      state: AgentTaskState.FAILED,
      message: `❌ Execution orchestrator exception: ${errDetails.message}`,
      progress: 0,
    }, db);

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
