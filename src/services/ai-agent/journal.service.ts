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
