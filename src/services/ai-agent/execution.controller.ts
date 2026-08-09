import { getAgentDb } from "@/lib/ai-agent.functions";
import {
  savePersistentExecutionEvent,
  logExecutionJournal,
  hasExecutionStartedLog,
  type AgentExecutionError,
} from "./journal.service";
import { AgentTaskState } from "./agent.state";

export interface ExecutionControllerOptions {
  taskId: string;
  tenantId: string;
  sessionId: string;
  userId?: string;
  skipPlanCheck?: boolean;
}

export async function verifyProjectStructure(
  options: ExecutionControllerOptions,
): Promise<{ success: boolean; details?: any }> {
  const db = await getAgentDb(options);
  const { taskId, tenantId, sessionId } = options;

  try {
    // 1. Log verification initialization in Execution Journal
    await logExecutionJournal(
      {
        taskId,
        tenantId: tenantId || "default",
        action: "PROJECT_VERIFICATION",
        tool: "verifyProjectStructure",
        input: { taskId, sessionId },
        output: { status: "checking" },
        status: "PENDING",
      },
      db,
    );

    // 2. Perform project/database structure checks
    const { data: ordersTable, error: ordersErr } = await db.from("orders").select("id").limit(1);
    const { data: usersTable, error: usersErr } = await db.from("users").select("id").limit(1);
    const { data: tasksTable, error: tasksErr } = await db
      .from("ai_agent_tasks")
      .select("id")
      .limit(1);

    const ordersTableExists = !ordersErr;
    const usersTableExists = !usersErr;
    const tasksTableExists = !tasksErr;

    const isSuccess = tasksTableExists || ordersTableExists || usersTableExists;
    const details = {
      ordersTableExists,
      usersTableExists,
      tasksTableExists,
      errors: [ordersErr, usersErr, tasksErr].filter(Boolean).map((e: any) => e?.message),
    };

    if (isSuccess) {
      await logExecutionJournal(
        {
          taskId,
          tenantId: tenantId || "default",
          action: "PROJECT_VERIFICATION",
          tool: "verifyProjectStructure",
          input: { taskId },
          output: { status: "verified", details },
          status: "SUCCESS",
        },
        db,
      );

      await savePersistentExecutionEvent(
        {
          sessionId: sessionId || "default",
          taskId,
          tenantId: tenantId || "default",
          eventType: "STATE_CHANGE",
          state: AgentTaskState.EXECUTING,
          message: "✔️ Project structure verified successfully.",
          progress: 58,
        },
        db,
      );

      return { success: true, details };
    } else {
      await logExecutionJournal(
        {
          taskId,
          tenantId: tenantId || "default",
          action: "PROJECT_VERIFICATION",
          tool: "verifyProjectStructure",
          input: { taskId },
          output: { status: "failed", details },
          status: "FAILED",
        },
        db,
      );

      await savePersistentExecutionEvent(
        {
          sessionId: sessionId || "default",
          taskId,
          tenantId: tenantId || "default",
          eventType: "ERROR",
          state: AgentTaskState.FAILED,
          message: "❌ Project verification failed: missing core tables or connection error.",
          progress: 0,
        },
        db,
      );

      return { success: false, details };
    }
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    await logExecutionJournal(
      {
        taskId,
        tenantId: tenantId || "default",
        action: "PROJECT_VERIFICATION",
        tool: "verifyProjectStructure",
        input: { taskId },
        output: { status: "error", error: errorMsg },
        status: "FAILED",
      },
      db,
    );

    await savePersistentExecutionEvent(
      {
        sessionId: sessionId || "default",
        taskId,
        tenantId: tenantId || "default",
        eventType: "ERROR",
        state: AgentTaskState.FAILED,
        message: `❌ Project verification failed: ${errorMsg}`,
        progress: 0,
      },
      db,
    );

    return { success: false, details: { error: errorMsg } };
  }
}

export async function startExecution(
  options: ExecutionControllerOptions,
): Promise<{ success: boolean; output?: string; failureDetails?: any }> {
  const { executeApprovedTask } = await import("@/lib/ai-agent.functions");
  const db = await getAgentDb(options);
  const { taskId, tenantId, sessionId } = options;

  console.log("[EXECUTION_CONTROLLER] START", { taskId, sessionId, tenantId });

  // 1. Strict Atomic Execution Lock
  // Only transition if the status is exactly 'approved'.
  // If it's already 'executing' or 'queued', this update will return no rows or fail.
  const { data: updatedTask, error: lockErr } = await db
    .from("ai_agent_tasks")
    .update({
      status: "executing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("tenant_id", tenantId)
    .eq("status", "approved")
    .select("id, approved_plan_hash, approved_revision, approved_by")
    .maybeSingle();

  if (lockErr || !updatedTask) {
    // Determine the actual state to return a precise error
    const { data: currentTask } = await db
      .from("ai_agent_tasks")
      .select("status")
      .eq("id", taskId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!currentTask) {
      return {
        success: false,
        output: "Task not found",
        failureDetails: { errorType: "TASK_NOT_FOUND" },
      };
    }

    if (currentTask.status === "executing" || currentTask.status === "queued") {
      return {
        success: false,
        output: "EXECUTION_ALREADY_STARTED",
        failureDetails: { errorType: "EXECUTION_ALREADY_STARTED" },
      };
    }

    return {
      success: false,
      output: "PLAN_CHANGED_REAPPROVAL_REQUIRED",
      failureDetails: { errorType: "PLAN_CHANGED_REAPPROVAL_REQUIRED" },
    };
  }

  // At this point, we hold the lock.
  const approvedTask = updatedTask;

  // 2. Atomic initialization: Log EXECUTION_STARTED as PENDING
  await logExecutionJournal(
    {
      taskId,
      tenantId: tenantId || "default",
      action: "EXECUTION_STARTED",
      tool: "startExecution",
      input: {
        taskId,
        sessionId,
        revision: approvedTask.approved_revision,
        hash: approvedTask.approved_plan_hash,
      },
      output: { status: "started" },
      status: "PENDING",
    },
    db,
  );

  await savePersistentExecutionEvent(
    {
      sessionId: sessionId || "default",
      taskId,
      tenantId: tenantId || "default",
      eventType: "STATE_CHANGE",
      state: AgentTaskState.EXECUTING,
      message: "⚙️ Executing tasks via Execution Controller Orchestrator...",
      progress: 60,
    },
    db,
  );

  // Project Verification Step
  const verificationResult = await verifyProjectStructure(options);
  if (!verificationResult.success) {
    console.warn(
      "[EXECUTION_CONTROLLER] Execution halted: Project structure verification failed",
      verificationResult.details,
    );
    return {
      success: false,
      output: "Execution blocked: Project structure verification failed",
      failureDetails: {
        reason: "Project structure verification failed",
        errorType: "VERIFICATION_FAILED",
        details: verificationResult.details,
      },
    };
  }

  // Gen 2 Agentic Engine: Create Sandbox Snapshot for ALL affected project files
  const { createSandboxSnapshot, executeAutomaticRollback } = await import("./sandbox-recovery");
  const targetSnapshotFiles: string[] =
    Array.isArray(approvedTask?.affected_files) && approvedTask.affected_files.length > 0
      ? approvedTask.affected_files
      : ["src/routes/admin.ai-developer.tsx", "src/services/ai-agent/execution.controller.ts"];

  const snapshot = await createSandboxSnapshot(taskId, targetSnapshotFiles);
  await savePersistentExecutionEvent(
    {
      sessionId: sessionId || "default",
      taskId,
      tenantId: tenantId || "default",
      eventType: "STATE_CHANGE",
      state: AgentTaskState.EXECUTING,
      message: `🛡️ Sandbox Snapshot created for ${Object.keys(snapshot.files).length} files — Auto-Rollback active`,
      progress: 65,
    },
    db,
  );

  try {
    const res = (await executeApprovedTask({ data: { taskId } })) as any;

    if (res?.success) {
      await logExecutionJournal(
        {
          taskId,
          tenantId: tenantId || "default",
          action: "EXECUTION_COMPLETED",
          tool: "startExecution",
          input: { taskId },
          output: { status: "all_steps_passed", output: res.buildOutput },
          status: "SUCCESS",
        },
        db,
      );

      await savePersistentExecutionEvent(
        {
          sessionId: sessionId || "default",
          taskId,
          tenantId: tenantId || "default",
          eventType: "COMPLETION",
          state: AgentTaskState.COMPLETED,
          message: "🎉 All engineering steps applied & build validation passed cleanly!",
          progress: 100,
        },
        db,
      );

      return { success: true, output: res.buildOutput };
    } else {
      // Trigger Automatic Rollback on failure
      const rollbackResult = await executeAutomaticRollback(taskId);
      const rollbackMsg = rollbackResult.success
        ? ` (🔄 Auto-Rollback restored ${rollbackResult.restoredFiles.length} files)`
        : "";

      const errDetails: AgentExecutionError = {
        message:
          (res?.failureDetails?.reason || res?.buildOutput || "Verification / Build Error") +
          rollbackMsg,
        stack: res?.failureDetails?.stack,
        stdout: res?.failureDetails?.stdout,
        stderr: res?.failureDetails?.stderr,
        failed_step: res?.failureDetails?.failed_step || "BUILD_VALIDATION",
        tool_name: res?.failureDetails?.tool_name || "npm_build",
      };

      await logExecutionJournal(
        {
          taskId,
          tenantId: tenantId || "default",
          action: "EXECUTION_FAILED",
          tool: "startExecution",
          input: { taskId },
          output: { status: "build_failed", failureDetails: errDetails, rollback: rollbackResult },
          status: "FAILED",
        },
        db,
      );

      await savePersistentExecutionEvent(
        {
          sessionId: sessionId || "default",
          taskId,
          tenantId: tenantId || "default",
          eventType: "ERROR",
          state: AgentTaskState.FAILED,
          message: `❌ Task execution failed: ${errDetails.message}`,
          progress: 95,
        },
        db,
      );

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

    await logExecutionJournal(
      {
        taskId,
        tenantId: tenantId || "default",
        action: "EXECUTION_FAILED",
        tool: "startExecution",
        input: { taskId },
        output: { error: errDetails },
        status: "FAILED",
      },
      db,
    );

    await savePersistentExecutionEvent(
      {
        sessionId: sessionId || "default",
        taskId,
        tenantId: tenantId || "default",
        eventType: "ERROR",
        state: AgentTaskState.FAILED,
        message: `❌ Execution orchestrator exception: ${errDetails.message}`,
        progress: 0,
      },
      db,
    );

    throw err;
  }
}

export async function resumeExecution(
  options: ExecutionControllerOptions,
): Promise<{ success: boolean; output?: string }> {
  return startExecution(options);
}

export async function cancelExecution(
  options: ExecutionControllerOptions,
): Promise<{ success: boolean }> {
  const db = await getAgentDb({});
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
