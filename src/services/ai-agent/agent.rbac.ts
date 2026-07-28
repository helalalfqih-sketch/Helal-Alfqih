/**
 * Agent RBAC & Permission Model Service
 * Enforces Multi-Tenant RLS isolation and role hierarchy:
 *   owner > admin > developer > viewer
 *
 * Operation Modes:
 *   OWNER_MODE: Full modification of code, SQL, migrations, builds, git commit/rollback.
 *   SAFE_MODE: Analysis & suggestions only (read-only, no disk mutations or destructive tasks).
 */

import type { AgentRole } from "./agent.permissions";
import { resolveAgentRole, getAgentDb } from "@/lib/ai-agent.functions";
import { resolveTenantId } from "@/lib/saas/tenant-context";

export type AgentOperationMode = "OWNER_MODE" | "SAFE_MODE";

const ROLE_RANK: Record<AgentRole, number> = {
  owner: 4,
  admin: 3,
  developer: 2,
  viewer: 1,
};

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: AgentRole;
  mode: AgentOperationMode;
}

export function getAgentOperationMode(role: AgentRole): AgentOperationMode {
  if (role === "owner" || role === "admin") {
    return "OWNER_MODE";
  }
  return "SAFE_MODE";
}

export function isModificationAllowed(mode: AgentOperationMode): boolean {
  return mode === "OWNER_MODE";
}

export function hasMinimumRole(userRole: AgentRole, minRole: AgentRole): boolean {
  return (ROLE_RANK[userRole] ?? 0) >= (ROLE_RANK[minRole] ?? 0);
}

export async function authenticateAgentContext(context: any): Promise<AuthContext> {
  const userId = context?.userId;
  if (!userId) {
    throw new Error("401: غير مصرح. يرجى تسجيل الدخول أولاً.");
  }

  const db = await getAgentDb(context);
  const tenantId = await resolveTenantId(db, { userId });
  if (!tenantId) {
    throw new Error("400: تعذر تحديد معرف المتجر (Tenant ID).");
  }

  const role = await resolveAgentRole(db, userId, tenantId);
  const mode = getAgentOperationMode(role);

  return {
    userId,
    tenantId,
    role,
    mode,
  };
}

export async function enforceAgentRole(
  context: any,
  minRole: AgentRole = "admin",
): Promise<AuthContext> {
  const auth = await authenticateAgentContext(context);

  if (!hasMinimumRole(auth.role, minRole)) {
    throw new Error(
      `403: ليس لديك صلاحية تنفيذ هذا الإجراء. الصلاحية المطلوبة: "${minRole}" أو أعلى (صلاحيتك الحالية: "${auth.role}").`,
    );
  }

  return auth;
}
