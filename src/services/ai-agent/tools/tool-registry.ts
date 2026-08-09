import { z } from "zod";
import type { AgentRole } from "../agent.permissions";

export type ToolCategory = "repository" | "database" | "validation" | "execution" | "git";
export type ToolExecutionMode = "read" | "proposal" | "mutation";
export type ToolRiskLevel = "low" | "medium" | "high" | "critical";
export type Environment = "development" | "preview" | "production";

export interface AgentToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<TInput>;
  execute: (input: TInput, context: any) => Promise<TOutput>;
  category: ToolCategory;
  minimumRole: AgentRole;
  executionMode: ToolExecutionMode;
  risk: ToolRiskLevel;
  requiresApproval: boolean;
  approvalScope?: string;
  serverOnly: boolean;
  timeoutMs: number;
  allowedEnvironments: Array<Environment>;
  redactOutput?: boolean;
}

export const TOOL_REGISTRY = new Map<string, AgentToolDefinition>();

export function registerTool<TInput = any, TOutput = any>(
  tool: AgentToolDefinition<TInput, TOutput>,
) {
  if (TOOL_REGISTRY.has(tool.name)) {
    throw new Error(`Tool ${tool.name} is already registered. Dual-registration detected.`);
  }
  TOOL_REGISTRY.set(tool.name, tool as AgentToolDefinition);
}

export function getToolDefinition(name: string): AgentToolDefinition | undefined {
  return TOOL_REGISTRY.get(name);
}

export function getAllTools(): AgentToolDefinition[] {
  return Array.from(TOOL_REGISTRY.values());
}

// Generates the ToolSet for the AI SDK `streamText` function
export function buildCanonicalAiSdkTools(
  agentRole: AgentRole,
  tenantId: string,
  sendEvent: (e: any) => void,
  context: any = {},
) {
  const aiTools: Record<string, any> = {};

  const ROLE_RANK: Record<AgentRole, number> = { owner: 4, admin: 3, developer: 2, viewer: 1 };
  const userRank = ROLE_RANK[agentRole] || 0;

  for (const [name, tool] of TOOL_REGISTRY.entries()) {
    const requiredRank = ROLE_RANK[tool.minimumRole] || 0;

    // Enforce strictly fail-closed RBAC: only generate tool if user has minimum required role
    if (userRank >= requiredRank) {
      aiTools[name] = {
        description: tool.description,
        inputSchema: tool.inputSchema,
        execute: async (input: any) => {
          // Log execution start based on Tool definition metadata
          sendEvent({
            type: "tool_call",
            tool: name,
            message: `🛠️ ${tool.description}`,
            metadata: {
              category: tool.category,
              risk: tool.risk,
              requiresApproval: tool.requiresApproval,
            },
          });

          try {
            return await tool.execute(input, { ...context, tenantId, agentRole, sendEvent });
          } catch (e: any) {
            return { error: `TOOL_EXECUTION_FAILED: ${e.message}` };
          }
        },
      };
    }
  }

  // Double check that NO human-control approval tools leak into the SDK model's tools
  const blockedTools = [
    "approve_execution_plan",
    "reject_execution_plan",
    "startApprovedExecution",
    "gitPush",
    "applyMigration",
    "deployProduction",
  ];

  for (const blocked of blockedTools) {
    if (aiTools[blocked]) {
      throw new Error(
        `SECURITY_VIOLATION: Human-control tool '${blocked}' leaked into AI SDK tool list.`,
      );
    }
  }

  return aiTools;
}
