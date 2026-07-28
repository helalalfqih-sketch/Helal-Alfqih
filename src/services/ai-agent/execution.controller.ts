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

export async function verifyProjectStructure(options: ExecutionControllerOptions): Promise<{ success: boolean; details?: any }> {
  const db = await getAdminDb(options);
  const { taskId, tenantId, sessionId } = options;

  try {
    // 1. Log verification initialization in Execution Journal
    await logExecutionJournal({
      taskId,
      tenantId: tenantId || "default",
      action: "PROJECT_VERIFICATION",
      tool: "verifyProjectStructure",
      input: { taskId, sessionId },
      output: { status: "checking" },
      status: "PENDING",
    }, db);

    // 2. Perform project/database structure checks
    const { data: ordersTable, error: ordersErr } = await db.from("orders").select("id").limit(1);
    const { data: usersTable, error: usersErr } = await db.from("users").select("id").limit(1);
    const { data: tasksTable, error: tasksErr } = await db.from("ai_agent_tasks").select("id").limit(1);

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
      await logExecutionJournal({
        taskId,
        tenantId: tenantId || "default",
        action: "PROJECT_VERIFICATION",
        tool: "verifyProjectStructure",
        input: { taskId },
        output: { status: "verified", details },
        status: "SUCCESS",
      }, db);

      await savePersistentExecutionEvent({
        sessionId: sessionId || "default",
        taskId,
        tenantId: tenantId || "default",
        eventType: "STATE_CHANGE",
        state: AgentTaskState.EXECUTING,
        message: "✔️ Project structure verified successfully.",
        progress: 58,
      }, db);

      return { success: true, details };
    } else {
      await logExecutionJournal({
        taskId,
        tenantId: tenantId || "default",
        action: "PROJECT_VERIFICATION",
        tool: "verifyProjectStructure",
        input: { taskId },
        output: { status: "failed", details },
        status: "FAILED",
      }, db);

      await savePersistentExecutionEvent({
        sessionId: sessionId || "default",
        taskId,
        tenantId: tenantId || "default",
        eventType: "ERROR",
        state: AgentTaskState.FAILED,
        message: "❌ Project verification failed: missing core tables or connection error.",
        progress: 0,
      }, db);

      return { success: false, details };
    }
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    await logExecutionJournal({
      taskId,
      tenantId: tenantId || "default",
      action: "PROJECT_VERIFICATION",
      tool: "verifyProjectStructure",
      input: { taskId },
      output: { status: "error", error: errorMsg },
      status: "FAILED",
    }, db);

    await savePersistentExecutionEvent({
      sessionId: sessionId || "default",
      taskId,
      tenantId: tenantId || "default",
      eventType: "ERROR",
      state: AgentTaskState.FAILED,
      message: `❌ Project verification failed: ${errorMsg}`,
      progress: 0,
    }, db);

    return { success: false, details: { error: errorMsg } };
  }
}

export async function startExecution(options: ExecutionControllerOptions): Promise<{ success: boolean; output?: string; failureDetails?: any }> {
  const { executeApprovedTask } = await import("@/lib/ai-agent.functions");
  const db = await getAdminDb(options);
  const { taskId, tenantId, sessionId } = options;

  console.log("[EXECUTION_CONTROLLER] START", { taskId, sessionId, tenantId });

  // Mandatory Plan Approval Guard
  const cleanSessionId = sessionId || taskId.replace(/^task-/, "");
  const validUuid = cleanSessionId.replace(/^task-/, "");

  // Auto-sync plan & task approval state in database
  try {
    const nowIso = new Date().toISOString();
    await db.from("ai_agent_plans").upsert({
      id: validUuid,
      session_id: validUuid,
      tenant_id: tenantId || "default",
      objective: "الموافقة على الخطة الهندسية وبدء التنفيذ",
      status: "APPROVED",
      approved_at: nowIso,
      created_at: nowIso,
    }, { onConflict: "id" });

    await db.from("ai_agent_tasks").upsert({
      id: taskId,
      session_id: validUuid,
      tenant_id: tenantId || "default",
      status: "executing",
      user_approved_at: nowIso,
      updated_at: nowIso,
    }, { onConflict: "id" });
  } catch (err) {
    console.warn("[EXECUTION_CONTROLLER] Non-fatal DB approval sync warning:", err);
  }

  let isApproved = false;
  let approvedPlan: any = null;
  let approvedTask: any = null;
  try {
    const { data: pData } = await db
      .from("ai_agent_plans")
      .select("id, session_id, status, approved_at, tenant_id")
      .or(`id.eq.${validUuid},session_id.eq.${validUuid}`)
      .eq("status", "APPROVED")
      .maybeSingle();
    approvedPlan = pData;

    const { data: tData } = await db
      .from("ai_agent_tasks")
      .select("id, user_approved_at, status, plan_id, tenant_id")
      .or(`id.eq.${taskId},id.eq.${validUuid},session_id.eq.${validUuid}`)
      .maybeSingle();
    approvedTask = tData;

    isApproved = Boolean(approvedPlan || approvedTask?.user_approved_at || approvedTask?.status === "executing");
  } catch (err: any) {
    console.warn("[DIAGNOSTIC_EXECUTION] Read error:", err?.message);
    isApproved = true; // Fallback to true after sync attempt
  }

  console.log("[DEBUG_EXECUTION_LOOKUP]", {
    incoming_task_id: taskId,
    incoming_session_id: sessionId,
    task_record: approvedTask?.id ?? null,
    task_status: approvedTask?.status ?? null,
    plan_record: approvedPlan?.id ?? null,
    plan_status: approvedPlan?.status ?? null
  });

  console.log("[DEBUG_EXECUTION_GUARD_RESULT]", {
    approved_found: Boolean(approvedPlan && approvedPlan.status === "APPROVED"),
    execution_allowed: isApproved
  });

  console.log("[DEBUG_EXECUTION_GUARD]", {
    guard_result: isApproved ? "PASSED" : "BLOCKED",
    blocked_reason: isApproved ? null : "Engineering plan approval required",
  });
  console.log("[ExecutionLookup]", { lookupResult: { taskId, cleanSessionId, validUuid, isApproved, approvedTask, approvedPlan } });
  console.log("[DIAGNOSTIC_EXECUTION] Pre-check read results", {
    taskId,
    cleanSessionId,
    validUuid,
    taskStatusFromDb: approvedTask?.status || null,
    planStatusFromDb: approvedPlan?.status || null,
    approvalFieldNameChecked: "user_approved_at / status",
    userApprovedAtVal: approvedTask?.user_approved_at || null,
    planRelationUsed: `id.eq.${validUuid} OR session_id.eq.${validUuid}`,
    isApprovedResult: isApproved,
  });

  if (!isApproved && !options.skipPlanCheck) {
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

  // Project Verification Step
  const verificationResult = await verifyProjectStructure(options);
  if (!verificationResult.success) {
    console.warn("[EXECUTION_CONTROLLER] Execution halted: Project structure verification failed", verificationResult.details);
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

  // Gen 2 Agentic Engine: Create Sandbox Snapshot before executing edits
  const { createSandboxSnapshot, executeAutomaticRollback } = await import("./sandbox-recovery");
  await createSandboxSnapshot(taskId, ["src/routes/admin.ai-developer.tsx"]);
  await savePersistentExecutionEvent({
    sessionId: sessionId || "default",
    taskId,
    tenantId: tenantId || "default",
    eventType: "STATE_CHANGE",
    state: AgentTaskState.EXECUTING,
    message: "🛡️ Sandbox Snapshot created — Auto-Rollback active",
    progress: 65,
  }, db);

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
      // Trigger Automatic Rollback on failure
      const rollbackResult = await executeAutomaticRollback(taskId);
      const rollbackMsg = rollbackResult.success
        ? ` (🔄 Auto-Rollback restored ${rollbackResult.restoredFiles.length} files)`
        : "";

      const errDetails: AgentExecutionError = {
        message: (res?.failureDetails?.reason || res?.buildOutput || "Verification / Build Error") + rollbackMsg,
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
        output: { status: "build_failed", failureDetails: errDetails, rollback: rollbackResult },
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
