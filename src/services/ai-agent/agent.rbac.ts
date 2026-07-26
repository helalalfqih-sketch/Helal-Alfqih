/**
 * Agent RBAC & Authentication Security Service (Phase S1)
 *
 * Provides strict Role-Based Access Control (RBAC) and Auth checks for AI Agent operations.
 * Enforces Multi-Tenant RLS isolation and role hierarchy:
 *   owner > admin > developer > viewer
 */

import type { AgentRole } from "./agent.permissions";
import { resolveAgentRole, getAdminDb } from "@/lib/ai-agent.functions";
import { resolveTenantId } from "@/lib/saas/tenant-context";

// ─────────────────────────────────────────────────
// Role Hierarchy Matrix
// ─────────────────────────────────────────────────

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
}

/**
 * Check if the user's role meets or exceeds the required minimum role.
 */
export function hasMinimumRole(userRole: AgentRole, minRole: AgentRole): boolean {
  return (ROLE_RANK[userRole] ?? 0) >= (ROLE_RANK[minRole] ?? 0);
}

/**
 * Authenticate request context and resolve user's RBAC role for the active tenant.
 */
export async function authenticateAgentContext(context: any): Promise<AuthContext> {
  const userId = context?.userId;
  if (!userId) {
    throw new Error("401: غير مصرح. يرجى تسجيل الدخول أولاً.");
  }

  const db = await getAdminDb(context);
  const tenantId = await resolveTenantId(db, { userId });
  if (!tenantId) {
    throw new Error("400: تعذر تحديد معرف المتجر (Tenant ID).");
  }

  const role = await resolveAgentRole(db, userId, tenantId);

  return {
    userId,
    tenantId,
    role,
  };
}

/**
 * Enforce minimum RBAC role requirement on a server function handler.
 * Throws a formatted error if unauthorized.
 */
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
