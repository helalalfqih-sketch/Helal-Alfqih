import { requireTenantPermission } from "../../lib/users.functions";
import { verifyApproval } from "../../lib/ai-agent.functions";

/**
 * P0 Security Regression Test Suite
 * Asserts fail-closed behavior across authorization modules.
 */
export async function runP0SecurityTestSuite(): Promise<{ passed: boolean; results: string[] }> {
  const results: string[] = [];

  // Test 1: Unauthenticated user rejected
  try {
    const mockDb: any = {};
    await requireTenantPermission({
      db: mockDb,
      userId: "",
      tenantId: "tenant-123",
      permission: "cms",
    });
    throw new Error("FAIL: Unauthenticated call did not throw!");
  } catch (err: any) {
    if (err.message.includes("FAIL:")) throw err;
    results.push("✔ Pass: Unauthenticated access rejected as expected");
  }

  // Test 2: Missing tenant rejected
  try {
    const mockDb: any = {};
    await requireTenantPermission({
      db: mockDb,
      userId: "user-123",
      tenantId: "",
      permission: "cms",
    });
    throw new Error("FAIL: Missing tenant call did not throw!");
  } catch (err: any) {
    if (err.message.includes("FAIL:")) throw err;
    results.push("✔ Pass: Missing tenant rejected as expected");
  }

  // Test 3: Unapproved plan execution blocked
  try {
    const mockDb: any = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  approved_by: "user-1",
                  approved_at: new Date().toISOString(),
                  status: "DRAFT",
                },
                error: null,
              }),
            }),
          }),
        }),
      }),
    };

    await verifyApproval(mockDb, "task-1", "tenant-1");
    throw new Error("FAIL: Unapproved plan did not throw!");
  } catch (err: any) {
    if (err.message.includes("FAIL:")) throw err;
    results.push("✔ Pass: DRAFT plan execution blocked as expected");
  }

  return { passed: true, results };
}
