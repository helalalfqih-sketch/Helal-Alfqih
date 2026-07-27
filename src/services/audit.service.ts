/**
 * Audit & Compliance Activity Service
 */
import { createServerFn } from "@tanstack/react-start";

export interface UserAuditLogEntry {
  id: string;
  userEmail: string;
  action: string;
  targetResource: string;
  ipAddress: string;
  result: "SUCCESS" | "FAILED";
  timestamp: string;
}

const mockAuditLogs: UserAuditLogEntry[] = [
  {
    id: "AUDIT-001",
    userEmail: "admin@indexes-store.com",
    action: "UPDATE_PRODUCT",
    targetResource: "Product #PROD-9021",
    ipAddress: "192.168.1.1",
    result: "SUCCESS",
    timestamp: new Date().toISOString(),
  },
  {
    id: "AUDIT-002",
    userEmail: "developer@indexes-store.com",
    action: "EXECUTE_AI_REPAIR_PATCH",
    targetResource: "src/routes/product.$slug.tsx",
    ipAddress: "10.0.0.4",
    result: "SUCCESS",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

export async function getAuditLogsHandler() {
  return [...mockAuditLogs];
}

export const getAuditLogsFn = createServerFn({ method: "GET" }).handler(async () => {
  return getAuditLogsHandler();
});
