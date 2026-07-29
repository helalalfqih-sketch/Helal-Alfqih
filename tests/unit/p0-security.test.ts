import { describe, it, expect, vi } from "vitest";

// Hoisted mock for tenant-context
vi.mock("@/lib/saas/tenant-context", () => ({
  resolveTenantId: vi.fn(async (client: any, opts: any) => {
    if (opts?.userId === "fail_tenant") throw new Error("Tenant error");
    if (!opts?.userId) return null;
    return "test-tenant-uuid";
  }),
}));

import { checkTenantPermission, PermissionDeniedError, ConfigurationError } from "@/lib/users.functions";

describe("P0 Security Suite — Tenant RBAC & Authorization (Fail-Closed)", () => {
  it("should throw PermissionDeniedError when no userId or session exists", async () => {
    await expect(checkTenantPermission("products", {})).rejects.toThrow(PermissionDeniedError);
  });

  it("should throw ConfigurationError when tenant resolution fails", async () => {
    const mockContext = {
      userId: "fail_tenant",
      supabase: {
        auth: { getUser: async () => ({ data: { user: { id: "fail_tenant" } } }) },
      },
    };

    await expect(checkTenantPermission("products", mockContext)).rejects.toThrow(ConfigurationError);
  });

  it("should allow tenant owners full permission", async () => {
    const userId = "owner_user_id";

    const mockClient = {
      from: (table: string) => {
        if (table === "user_roles") {
          return { select: () => ({ eq: () => Promise.resolve({ data: [] }) }) };
        }
        if (table === "tenants") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { owner_user_id: userId } }),
              }),
            }),
          };
        }
        return {};
      },
    };

    const mockContext = { userId, supabase: mockClient };
    const result = await checkTenantPermission("products", mockContext);
    expect(result).toBe(true);
  });

  it("should deny non-members with PermissionDeniedError", async () => {
    const userId = "non_member_user_id";

    const mockClient = {
      from: (table: string) => {
        if (table === "user_roles") {
          return { select: () => ({ eq: () => Promise.resolve({ data: [] }) }) };
        }
        if (table === "tenants") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { owner_user_id: "other_owner" } }),
              }),
            }),
          };
        }
        if (table === "tenant_members") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      },
    };

    const mockContext = { userId, supabase: mockClient };
    await expect(checkTenantPermission("settings", mockContext)).rejects.toThrow(PermissionDeniedError);
  });
});
