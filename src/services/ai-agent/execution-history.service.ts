/**
 * AI Execution History Service — Phase 7.2 📜
 *
 * Tracks every AI execution run:
 *   - Task ID & Session ID
 *   - Files modified
 *   - Execution duration (ms)
 *   - Verification results (typecheck & build)
 *   - Rollback status
 *   - Error logs
 */

import { getAdminDb } from "@/lib/ai-agent.functions";

export interface ExecutionHistoryRecord {
  id?: string;
  tenant_id: string;
  task_id: string;
  session_id?: string | null;
  user_id?: string | null;
  status: "success" | "failed" | "rolled_back" | "running" | "testing";
  files_changed: string[];
  typecheck_passed: boolean;
  build_passed: boolean;
  build_output?: string | null;
  rollback_status?: string | null;
  error_message?: string | null;
  execution_time_ms: number;
  created_at?: string;
}

/**
 * Record an execution run in ai_execution_history
 */
export async function recordExecutionHistory(
  entry: ExecutionHistoryRecord,
): Promise<ExecutionHistoryRecord | null> {
  try {
    const db = await getAdminDb({});
    const { data, error } = await (db as any)
      .from("ai_execution_history")
      .insert({
        tenant_id: entry.tenant_id,
        task_id: entry.task_id,
        session_id: entry.session_id || null,
        user_id: entry.user_id || null,
        status: entry.status,
        files_changed: entry.files_changed ?? [],
        typecheck_passed: entry.typecheck_passed,
        build_passed: entry.build_passed,
        build_output: entry.build_output || null,
        rollback_status: entry.rollback_status || "none",
        error_message: entry.error_message || null,
        execution_time_ms: entry.execution_time_ms,
      })
      .select()
      .single();

    if (error) {
      console.warn("[ExecutionHistory] Failed to record execution:", error.message);
      return null;
    }
    return data as ExecutionHistoryRecord;
  } catch (e) {
    console.warn("[ExecutionHistory] Error recording execution:", e);
    return null;
  }
}

/**
 * List recent execution history entries for a tenant
 */
export async function listExecutionHistory(
  tenantId: string,
  limit = 20,
): Promise<ExecutionHistoryRecord[]> {
  try {
    const db = await getAdminDb({});
    const { data, error } = await (db as any)
      .from("ai_execution_history")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data as ExecutionHistoryRecord[]) ?? [];
  } catch {
    return [];
  }
}
