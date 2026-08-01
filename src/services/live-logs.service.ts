import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export type ErrorTypeCategory =
  | "Admin UI"
  | "Storefront UI"
  | "Supabase DB"
  | "GitHub Integration"
  | "Server Function"
  | "Network/API"
  | "System";

export type ErrorLevel = "error" | "warn" | "fatal" | "info";
export type ErrorStatus = "open" | "investigating" | "resolved";

export interface SystemLiveLogEntry {
  id: string;
  tenantId?: string | null;
  errorName: string;
  errorType: ErrorTypeCategory | string;
  level: ErrorLevel;
  location: string;
  cause: string;
  suggestedFix: string;
  stackTrace?: string | null;
  context?: Record<string, any>;
  status: ErrorStatus;
  createdAt: string;
}

export interface LiveLogsStats {
  total: number;
  open: number;
  fatal: number;
  adminUi: number;
  storefrontUi: number;
  supabaseDb: number;
  githubIntegration: number;
  serverFunction: number;
}

/**
 * Smart suggested fix engine based on error patterns, location, and stack traces.
 */
export function generateSuggestedFix(
  errorName: string,
  cause: string,
  location: string,
  stackTrace?: string | null,
  errorType?: string
): string {
  const lowerName = (errorName || "").toLowerCase();
  const lowerCause = (cause || "").toLowerCase();
  const lowerStack = (stackTrace || "").toLowerCase();
  const lowerLoc = (location || "").toLowerCase();
  const typeStr = (errorType || "").toLowerCase();

  // 1. Supabase RLS / Permission Errors
  if (
    lowerCause.includes("row-level security") ||
    lowerCause.includes("rls") ||
    lowerCause.includes("permission denied") ||
    typeStr.includes("supabase")
  ) {
    return "💡 اقتراح الإصلاح: تحقق من سياسات RLS (Row Level Security) في Supabase للجدول المستهدف، وتأكد من منح صلاحيات الوصول للمستخدم أو الاستعانة بـ Service Role لعمليات الخادم الحساسة.";
  }

  // 2. Authentication & JWT Expired
  if (
    lowerCause.includes("jwt") ||
    lowerCause.includes("unauthorized") ||
    lowerCause.includes("auth") ||
    lowerCause.includes("token expired")
  ) {
    return "💡 اقتراح الإصلاح: الجلسة انتهت أو أن رمز JWT غير صالح. قم بعمل تحديث للجلسة (Refresh Session) أو اطلب من المستخدم إعادات تسجيل الدخول.";
  }

  // 3. GitHub API Integration Errors
  if (
    typeStr.includes("github") ||
    lowerLoc.includes("github") ||
    lowerCause.includes("github") ||
    lowerCause.includes("rate limit") ||
    lowerCause.includes("bad credentials")
  ) {
    return "💡 اقتراح الإصلاح: تحقق من صحة رمز GitHub Personal Access Token (PAT) في المتغيرات البيئية وتأكد من منح صلاحيات repo/workflow، أو انتظر تجديد حد الطلبات (Rate Limit).";
  }

  // 4. Network / Failed to Fetch / CORS
  if (
    lowerCause.includes("failed to fetch") ||
    lowerCause.includes("networkerror") ||
    lowerCause.includes("cors") ||
    lowerName.includes("typeerror: failed to fetch")
  ) {
    return "💡 اقتراح الإصلاح: تعذر الاتصال بـ API أو السيرفر. تحقق من اتصال الشبكة، أو إعدادات CORS على النطاق المستهدف، وتأكد من أن السيرفر الخلفي متصل ومشتغل.";
  }

  // 5. Null Pointer / React Rendering Error
  if (
    lowerCause.includes("cannot read properties of undefined") ||
    lowerCause.includes("cannot read properties of null") ||
    lowerCause.includes("is not a function") ||
    typeStr.includes("ui")
  ) {
    return "💡 اقتراح الإصلاح: افحص متغيرات الحالة (State) الممررة للمكون المذكور واكتشف الحقول غير المهيأة. استخدم التمرير الآمن (Optional Chaining `?.`) وقيم fallback افترضية.";
  }

  // 6. Database Foreign Key / Unique Constraint
  if (lowerCause.includes("violates foreign key") || lowerCause.includes("duplicate key")) {
    return "💡 اقتراح الإصلاح: تعارض قيود قاعدة البيانات. تحقق من وجود السجل الأب (Foreign Key) أو منع تكرار قيمة الحقل الفريد قبل الإدخال.";
  }

  // 7. Route / 404 / Missing API Endpoint
  if (lowerCause.includes("404") || lowerCause.includes("not found")) {
    return "💡 اقتراح الإصلاح: المسار المطلوب غير دقيق أو غير موجود. تحقق من مطابقة اسم المسار في ملفات TanStack Router أو موجهات الـ Server API.";
  }

  // Default Fallback
  return "💡 اقتراح الإصلاح: راجع سطر الـ Stack Trace المحدد في الكود أدناه لتحديد دالة الاستدعاء وتدقيق معلمات الإدخال الممرضة.";
}

/**
 * Server Fn: List system live logs with filtering and analytics.
 */
export const listLiveLogsFn = createServerFn({ method: "GET" })
  .validator(
    z.object({
      search: z.string().optional(),
      errorType: z.string().optional(),
      level: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().optional().default(100),
    })
  )
  .handler(
    async ({ data }): Promise<{ logs: SystemLiveLogEntry[]; stats: LiveLogsStats }> => {
      let query = (supabase as any)
        .from("system_live_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(data.limit || 100);

      if (data.errorType && data.errorType !== "ALL") {
        query = query.eq("error_type", data.errorType);
      }

      if (data.level && data.level !== "ALL") {
        query = query.eq("level", data.level);
      }

      if (data.status && data.status !== "ALL") {
        query = query.eq("status", data.status);
      }

      if (data.search && data.search.trim()) {
        const searchStr = `%${data.search.trim()}%`;
        query = query.or(
          `error_name.ilike.${searchStr},cause.ilike.${searchStr},location.ilike.${searchStr},suggested_fix.ilike.${searchStr}`
        );
      }

      const { data: dbData, error } = await query;

      if (error) {
        // Fallback gracefully if table doesn't exist yet or query fails
        console.error("Failed to query system_live_logs:", error);
        return {
          logs: [],
          stats: {
            total: 0,
            open: 0,
            fatal: 0,
            adminUi: 0,
            storefrontUi: 0,
            supabaseDb: 0,
            githubIntegration: 0,
            serverFunction: 0,
          },
        };
      }

      const logs: SystemLiveLogEntry[] = (dbData || []).map((row: any) => ({
        id: row.id,
        tenantId: row.tenant_id,
        errorName: row.error_name,
        errorType: row.error_type,
        level: row.level,
        location: row.location,
        cause: row.cause,
        suggestedFix: row.suggested_fix || generateSuggestedFix(row.error_name, row.cause, row.location, row.stack_trace, row.error_type),
        stackTrace: row.stack_trace,
        context: row.context,
        status: row.status,
        createdAt: row.created_at,
      }));

      const stats: LiveLogsStats = {
        total: logs.length,
        open: logs.filter((l) => l.status === "open").length,
        fatal: logs.filter((l) => l.level === "fatal").length,
        adminUi: logs.filter((l) => l.errorType === "Admin UI").length,
        storefrontUi: logs.filter((l) => l.errorType === "Storefront UI").length,
        supabaseDb: logs.filter((l) => l.errorType === "Supabase DB").length,
        githubIntegration: logs.filter((l) => l.errorType === "GitHub Integration").length,
        serverFunction: logs.filter((l) => l.errorType === "Server Function").length,
      };

      return { logs, stats };
    }
  );

/**
 * Server Fn: Record a new error into system_live_logs.
 */
export const logLiveErrorFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      errorName: z.string().min(1),
      errorType: z.string().default("System"),
      level: z.enum(["error", "warn", "fatal", "info"]).default("error"),
      location: z.string().min(1),
      cause: z.string().min(1),
      suggestedFix: z.string().optional(),
      stackTrace: z.string().optional(),
      context: z.record(z.any()).optional(),
      tenantId: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const fix =
      data.suggestedFix ||
      generateSuggestedFix(data.errorName, data.cause, data.location, data.stackTrace, data.errorType);

    const payload = {
      error_name: data.errorName,
      error_type: data.errorType,
      level: data.level,
      location: data.location,
      cause: data.cause,
      suggested_fix: fix,
      stack_trace: data.stackTrace || null,
      context: data.context || {},
      tenant_id: data.tenantId || null,
      status: "open",
    };

    const { data: inserted, error } = await (supabase as any)
      .from("system_live_logs")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Failed to insert live log:", error);
      return { success: false, error: error.message };
    }

    return { success: true, log: inserted };
  });

/**
 * Server Fn: Update status of a live log (e.g. resolve or investigate).
 */
export const updateLiveLogStatusFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["open", "investigating", "resolved"]),
    })
  )
  .handler(async ({ data }) => {
    const { error } = await (supabase as any)
      .from("system_live_logs")
      .update({ status: data.status })
      .eq("id", data.id);

    if (error) {
      throw new Error(`فشل تحديث حالة الخطأ: ${error.message}`);
    }

    return { success: true };
  });

/**
 * Server Fn: Clear resolved logs or clear all logs.
 */
export const clearLiveLogsFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      clearMode: z.enum(["resolved_only", "all"]),
    })
  )
  .handler(async ({ data }) => {
    let query = (supabase as any).from("system_live_logs").delete();

    if (data.clearMode === "resolved_only") {
      query = query.eq("status", "resolved");
    } else {
      query = query.neq("id", "00000000-0000-0000-0000-000000000000"); // Match all
    }

    const { error } = await query;

    if (error) {
      throw new Error(`فشل تفريغ سجلات الأخطاء: ${error.message}`);
    }

    return { success: true };
  });
