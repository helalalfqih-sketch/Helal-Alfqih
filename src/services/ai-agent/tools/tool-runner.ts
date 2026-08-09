import { getToolDefinition, type AgentToolDefinition } from "./tool-registry";
import { enforceAgentRole, authenticateAgentContext } from "../agent.rbac";
import { logAudit } from "@/lib/ai-agent.functions";

export async function executeTool(toolName: string, input: any, context: any) {
  const tool = getToolDefinition(toolName);
  
  if (!tool) {
    throw new Error(`TOOL_NOT_ALLOWED: The tool '${toolName}' is not registered or known.`);
  }

  // Phase 3: Input validation
  const parsedInput = tool.inputSchema.parse(input);

  // Phase 3: Auth & RBAC
  const auth = await enforceAgentRole(context, tool.minimumRole);

  // Environment Check
  const currentEnv = process.env.NODE_ENV === "production" ? "production" : (process.env.VERCEL_ENV === "preview" ? "preview" : "development");
  if (!tool.allowedEnvironments.includes(currentEnv as any)) {
    throw new Error(`EXECUTION_ENVIRONMENT_UNAVAILABLE: Tool '${toolName}' is not allowed in environment '${currentEnv}'.`);
  }

  // Audit Start
  // Assuming context contains db connection
  const db = context.supabase;
  
  if (db) {
    await logAudit(db, auth.tenantId, auth.userId, "tool_execution_started", context.sessionId, { toolName, input: parsedInput });
  }

  // Timeout Enforcement
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error(`TOOL_TIMEOUT: Tool '${toolName}' exceeded ${tool.timeoutMs}ms.`)), tool.timeoutMs)
  );

  try {
    const result = await Promise.race([
      tool.execute(parsedInput, context),
      timeoutPromise
    ]);

    // Redact Output if needed
    let safeResult = result;
    if (tool.redactOutput) {
       safeResult = "[REDACTED_OUTPUT_FOR_SECURITY]";
    }

    if (db) {
      await logAudit(db, auth.tenantId, auth.userId, "tool_execution_success", context.sessionId, { toolName });
    }

    return safeResult;
  } catch (error: any) {
    if (db) {
      await logAudit(db, auth.tenantId, auth.userId, "tool_execution_failed", context.sessionId, { toolName, error: error.message });
    }
    throw error;
  }
}
