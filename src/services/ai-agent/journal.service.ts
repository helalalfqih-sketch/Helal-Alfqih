import { getAdminDb } from "@/lib/ai-agent.functions";

export interface ExecutionJournalLog {
  id?: string;
  taskId?: string;
  tenantId: string;
  action: string;
  tool?: string;
  input?: any;
  output?: any;
  status: "SUCCESS" | "FAILED" | "PENDING";
  createdAt?: string;
}

export async function logExecutionJournal(log: ExecutionJournalLog): Promise<void> {
  try {
    const db = await getAdminDb({});
    await db.from("agent_execution_logs").insert({
      task_id: log.taskId || null,
      tenant_id: log.tenantId || "default",
      action: log.action,
      tool: log.tool || null,
      input: typeof log.input === "object" ? log.input : { detail: log.input },
      output: typeof log.output === "object" ? log.output : { detail: log.output },
      status: log.status,
      created_at: log.createdAt || new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[ExecutionJournal] Failed to log journal entry:", err);
  }
}

export async function fetchExecutionJournalLogs(tenantId: string, limit = 50): Promise<ExecutionJournalLog[]> {
  try {
    const db = await getAdminDb({});
    const { data } = await db
      .from("agent_execution_logs")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return (data || []).map((row: any) => ({
      id: row.id,
      taskId: row.task_id,
      tenantId: row.tenant_id,
      action: row.action,
      tool: row.tool,
      input: row.input,
      output: row.output,
      status: row.status as "SUCCESS" | "FAILED" | "PENDING",
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.warn("[ExecutionJournal] Failed to fetch journal logs:", err);
    return [];
  }
}

export interface PersistentExecutionEvent {
  id?: string;
  sessionId: string;
  taskId?: string;
  tenantId: string;
  eventType: "STATE_CHANGE" | "TOOL_CALL" | "PROGRESS" | "ERROR" | "COMPLETION";
  state?: string;
  message: string;
  progress?: number;
  metadata?: any;
  createdAt?: string;
}

export async function savePersistentExecutionEvent(event: PersistentExecutionEvent): Promise<void> {
  try {
    const db = await getAdminDb({});
    await db.from("agent_execution_events").insert({
      session_id: event.sessionId,
      task_id: event.taskId || null,
      tenant_id: event.tenantId || "default",
      event_type: event.eventType,
      state: event.state || null,
      message: event.message,
      progress: event.progress || 0,
      metadata: typeof event.metadata === "object" ? event.metadata : { detail: event.metadata },
      created_at: event.createdAt || new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[ExecutionEvents] Failed to save persistent event:", err);
  }
}

export async function listSessionExecutionEvents(sessionId: string, limit = 100): Promise<PersistentExecutionEvent[]> {
  try {
    const db = await getAdminDb({});
    const { data } = await db
      .from("agent_execution_events")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(limit);

    return (data || []).map((row: any) => ({
      id: row.id,
      sessionId: row.session_id,
      taskId: row.task_id,
      tenantId: row.tenant_id,
      eventType: row.event_type as any,
      state: row.state,
      message: row.message,
      progress: row.progress,
      metadata: row.metadata,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.warn("[ExecutionEvents] Failed to fetch session execution events:", err);
    return [];
  }
}
