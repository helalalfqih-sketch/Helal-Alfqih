/**
 * Notification Service for NOQTA Enterprise Admin
 */
import { createServerFn } from "@tanstack/react-start";

export interface AdminNotification {
  id: string;
  category: "ORDERS" | "INVENTORY" | "PAYMENTS" | "AI_TASKS" | "SECURITY" | "DEPLOYMENT";
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  read: boolean;
  timestamp: string;
}

const mockNotificationsBuffer: AdminNotification[] = [
  {
    id: "NOTIF-001",
    category: "ORDERS",
    title: "طلب جديد #ORD-9982",
    message: "تم استلام طلب جديد بقيمة 350 SAR من العميل أحمد علي",
    severity: "INFO",
    read: false,
    timestamp: new Date().toISOString(),
  },
  {
    id: "NOTIF-002",
    category: "AI_TASKS",
    title: "تم اكتمال المهمة الهندسيّة TASK-00192",
    message: "قام الذكاء الاصطناعي بإصلاح تحميل صور المنتجات وحقق اختبار typecheck PASS",
    severity: "INFO",
    read: false,
    timestamp: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: "NOTIF-003",
    category: "INVENTORY",
    title: "تنبيه انخفاض المخزون",
    message: "المنتج 'ساعة ذكية ألترا' شارف على النفاد (المتبقي: 2 قطعة)",
    severity: "WARNING",
    read: false,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

export async function getNotificationsHandler() {
  return [...mockNotificationsBuffer];
}

export async function markNotificationReadHandler(id: string) {
  const notif = mockNotificationsBuffer.find((n) => n.id === id);
  if (notif) notif.read = true;
  return { success: true };
}

export const getNotificationsFn = createServerFn({ method: "GET" }).handler(async () => {
  return getNotificationsHandler();
});

export const markNotificationReadFn = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    return markNotificationReadHandler(data.id);
  });
