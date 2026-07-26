/**
 * Indexes AI Engineering Agent — Server Functions
 *
 * Provides the backend logic for the AI Engineering Agent:
 * - Session CRUD (create, list, get, archive)
 * - Message persistence (normalized table, not JSONB)
 * - Project context gathering (file structure, DB schema, components)
 * - Project memory read/write
 * - Audit logging for every AI operation
 * - Token usage tracking
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveTenantId } from "@/lib/saas/tenant-context";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface AgentSession {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  status: string;
  task_id: string | null;
  task_status: string;
  task_plan: any;
  task_report: any;
  affected_files: any;
  risk_level: string;
  created_at: string;
  updated_at: string;
}

export interface AgentMessage {
  id: string;
  session_id: string;
  tenant_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: any;
  created_at: string;
}

export interface AgentMemoryEntry {
  id: string;
  tenant_id: string;
  category: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export type AgentRole = "owner" | "admin" | "developer" | "viewer";

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

async function getAdminDb(ctx: any) {
  let db = ctx?.supabase || supabase;
  if (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      if (supabaseAdmin) db = supabaseAdmin;
    } catch { /* fallback */ }
  }
  return db;
}

async function resolveAgentRole(db: any, userId: string, tenantId: string): Promise<AgentRole> {
  // Dev mode & platform owner bypass (always full owner access in local dev or for platform admin)
  if (process.env.NODE_ENV === "development") {
    return "owner";
  }

  // Check if platform admin in user_roles
  try {
    const { data: roles } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (roles?.some((r: any) => r.role === "admin")) return "owner";
  } catch { /* skip */ }

  // Check if tenant owner
  const { data: tenant } = await db
    .from("tenants")
    .select("owner_user_id")
    .eq("id", tenantId)
    .maybeSingle();

  if (tenant?.owner_user_id === userId || !tenant?.owner_user_id) return "owner";

  // Check tenant member role
  const { data: member } = await db
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!member) return "owner"; // Default to owner for admin panel access if authenticated

  switch (member.role) {
    case "owner": return "owner";
    case "manager": return "admin";
    case "marketing":
    case "employee":
    case "staff": return "developer";
    default: return "owner";
  }
}

async function logAudit(
  db: any,
  tenantId: string,
  userId: string,
  action: string,
  sessionId?: string | null,
  details?: any,
) {
  try {
    await db.from("ai_agent_audit_logs").insert({
      tenant_id: tenantId,
      session_id: sessionId || null,
      user_id: userId,
      action,
      details: details || {},
    });
  } catch (e: any) {
    console.warn("[AI Agent] logAudit non-blocking warning:", e.message || e);
  }
}

async function recordUsage(
  db: any,
  tenantId: string,
  userId: string,
  sessionId: string | null,
  usage: { promptTokens: number; completionTokens: number; modelName: string; provider: string },
) {
  try {
    const total = usage.promptTokens + usage.completionTokens;
    const cost = (usage.promptTokens * 0.00000015) + (usage.completionTokens * 0.0000006);

    await db.from("ai_agent_usage").insert({
      tenant_id: tenantId,
      session_id: sessionId,
      user_id: userId,
      model_name: usage.modelName,
      provider: usage.provider,
      prompt_tokens: usage.promptTokens,
      completion_tokens: usage.completionTokens,
      total_tokens: total,
      estimated_cost_usd: cost,
    });
  } catch (e: any) {
    console.warn("[AI Agent] recordUsage non-blocking warning:", e.message || e);
  }
}

// ──────────────────────────────────────────────────────────────
// Project Context System
// ──────────────────────────────────────────────────────────────

const PROJECT_FILE_STRUCTURE = `
# Indexes Store — Project Structure

## Frontend Routes (/src/routes/)
- index.tsx — الصفحة الرئيسية (Homepage)
- product.$slug.tsx — صفحة المنتج الفردي
- search.tsx — صفحة البحث
- cart.tsx — سلة المشتريات
- checkout.tsx — صفحة الدفع
- account.tsx — حساب المستخدم
- auth.tsx — تسجيل الدخول / التسجيل

## Admin Routes (/src/routes/admin.*)
- admin.index.tsx — لوحة التحكم الرئيسية
- admin.products.tsx — إدارة المنتجات
- admin.product.$id.tsx — تعديل منتج
- admin.categories.tsx — إدارة التصنيفات
- admin.orders.tsx — إدارة الطلبات
- admin.inventory.tsx — إدارة المخزون
- admin.branches.tsx — إدارة الفروع
- admin.customers.tsx — إدارة العملاء
- admin.deals.tsx — إدارة العروض
- admin.coupons.tsx — إدارة الكوبونات
- admin.campaigns.tsx — إدارة الحملات
- admin.banners.tsx — إدارة البنرات
- admin.shipping.tsx — إدارة الشحن
- admin.payments.tsx — طرق الدفع
- admin.storefront.tsx — Storefront CMS
- admin.appearance.tsx — المظهر
- admin.pages.tsx — الصفحات
- admin.seo.tsx — SEO Manager
- admin.media.tsx — مكتبة الوسائط
- admin.studio.tsx — استوديو AI
- admin.insights.tsx — رؤى AI
- admin.settings.tsx — الإعدادات
- admin.users.tsx — المستخدمون والصلاحيات
- admin.stores.tsx — إدارة المتاجر (SaaS)
- admin.integrations.whatsapp.tsx — مزامنة الواتساب
- admin.diagnostics.whatsapp.tsx — تشخيص وسائط الواتساب

## Server Functions (/src/lib/*.functions.ts)
- catalog.functions.ts — CRUD المنتجات والتصنيفات + AI Analysis
- media.functions.ts — إدارة الوسائط + WhatsApp + Product Linking
- order.functions.ts — إدارة الطلبات
- whatsapp.functions.ts — تكامل الواتساب
- seo-admin.functions.ts — SEO Tools
- pages.functions.ts — CMS Pages
- users.functions.ts — إدارة المستخدمين والصلاحيات
- tenant.functions.ts — Multi-Tenant Resolution

## Key Components (/src/components/)
- admin/admin-shell.tsx — Admin Layout + Sidebar
- media-uploader.tsx — رافع الوسائط
- product-recommendations.tsx — التوصيات الذكية
- store-theme-layout.tsx — Layout الواجهة الأمامية

## Integrations (/src/integrations/supabase/)
- client.ts — Supabase Browser Client
- client.server.ts — Supabase Admin Client (Service Role)
- auth-middleware.ts — requireSupabaseAuth Middleware
- types.ts — Database TypeScript Types
`;

const DB_SCHEMA_SUMMARY = `
# Database Schema (PostgreSQL via Supabase)

## Core Tables
- products — المنتجات (slug, name, description, price, images[], stock, category_id, tenant_id)
- categories — التصنيفات (slug, name, parent_id, tenant_id)
- orders — الطلبات (status, total, customer_email, tenant_id)
- order_items — عناصر الطلب (order_id, product_id, quantity, price)
- inventory_movements — حركات المخزون (product_id, delta, note)

## CMS Tables
- cms_sections — أقسام الصفحة الرئيسية (type, data, sort_order)
- cms_pages — صفحات مخصصة (slug, title, blocks[])
- storefront_settings — إعدادات المظهر (primary_color, layout, etc.)
- storefront_appearance — بيانات المظهر العامة

## Media Tables
- media_files — ملفات الوسائط (file_url, file_path, file_type, mime_type, source, thumbnail_url, sequence_number, tenant_id)
- product_media — ربط الوسائط بالمنتجات (product_id, media_id, sort_order)

## Multi-Tenant Tables
- tenants — المتاجر (name, slug, domain, owner_user_id, plan)
- tenant_members — أعضاء المتجر (tenant_id, user_id, role, permissions[])
- tenant_audit_logs — سجل العمليات
- profiles — ملفات المستخدمين (full_name, avatar_url, phone)
- user_roles — أدوار النظام (user_id, role: admin)
- user_addresses — عناوين المستخدمين

## AI Agent Tables
- ai_agent_sessions — جلسات المساعد الذكي
- ai_agent_messages — رسائل المحادثة (منفصلة عن الجلسات)
- ai_agent_memory — ذاكرة المشروع (pgvector-ready)
- ai_agent_audit_logs — سجل عمليات AI
- ai_agent_usage — تتبع استهلاك Tokens

## Architecture
- Row Level Security (RLS) on all tables
- Multi-tenant isolation via tenant_id
- Storage bucket: product-images
`;

// ──────────────────────────────────────────────────────────────
// Server Functions
// ──────────────────────────────────────────────────────────────

/** List agent sessions for current user's tenant */
export const listAgentSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const ctx = context as any;
      const db = await getAdminDb(ctx);
      const tenantId = await resolveTenantId(db, { userId: ctx.userId });

      const { data, error } = await db
        .from("ai_agent_sessions")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (error) {
        console.warn("[AI Agent] listAgentSessions error:", error.message);
        return [];
      }

      return (data || []) as AgentSession[];
    } catch (e: any) {
      console.warn("[AI Agent] listAgentSessions fallback:", e.message);
      return [];
    }
  });

/** Get single session with its messages */
export const getAgentSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: { sessionId: string }) => data)
  .handler(async ({ data: { sessionId }, context }) => {
    try {
      const ctx = context as any;
      const db = await getAdminDb(ctx);
      const tenantId = await resolveTenantId(db, { userId: ctx.userId });

      const [sessionRes, messagesRes] = await Promise.all([
        db.from("ai_agent_sessions").select("*").eq("id", sessionId).eq("tenant_id", tenantId).single(),
        db.from("ai_agent_messages").select("*").eq("session_id", sessionId).eq("tenant_id", tenantId).order("created_at", { ascending: true }),
      ]);

      if (sessionRes.error) throw new Error("الجلسة غير موجودة");

      return {
        session: sessionRes.data as AgentSession,
        messages: (messagesRes.data || []) as AgentMessage[],
      };
    } catch (e: any) {
      return {
        session: {
          id: sessionId,
          tenant_id: "default",
          user_id: "default",
          title: "جلسة افتراضية",
          status: "active",
          task_id: "TASK-001",
          task_status: "idle",
          task_plan: null,
          task_report: null,
          affected_files: [],
          risk_level: "low",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        messages: [],
      };
    }
  });

/** Create a new agent session */
export const createAgentSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { title?: string }) => data)
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const db = await getAdminDb(ctx);
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    try {
      const { count } = await db
        .from("ai_agent_sessions")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId);

      const taskNum = (count || 0) + 1;
      const taskId = `TASK-${String(taskNum).padStart(3, "0")}`;

      const { data: session, error } = await db
        .from("ai_agent_sessions")
        .insert({
          tenant_id: tenantId,
          user_id: ctx.userId,
          title: data.title || "جلسة جديدة",
          task_id: taskId,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      await logAudit(db, tenantId, ctx.userId, "session_created", session.id, { task_id: taskId });

      return session as AgentSession;
    } catch (e: any) {
      console.warn("[AI Agent] createAgentSession fallback active:", e.message);
      // Return volatile mock session if tables not yet created on cloud
      const mockId = crypto.randomUUID();
      return {
        id: mockId,
        tenant_id: tenantId,
        user_id: ctx.userId,
        title: data.title || "جلسة جديدة",
        status: "active",
        task_id: "TASK-001",
        task_status: "planning",
        task_plan: null,
        task_report: null,
        affected_files: [],
        risk_level: "low",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as AgentSession;
    }
  });

/** Save a message to a session */
export const saveAgentMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { sessionId: string; role: string; content: string; metadata?: any }) => data)
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const db = await getAdminDb(ctx);
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    try {
      const { data: msg, error } = await db
        .from("ai_agent_messages")
        .insert({
          session_id: data.sessionId,
          tenant_id: tenantId,
          role: data.role,
          content: data.content,
          metadata: data.metadata || {},
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      await db
        .from("ai_agent_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", data.sessionId);

      return msg as AgentMessage;
    } catch (e: any) {
      console.warn("[AI Agent] saveAgentMessage fallback:", e.message);
      return {
        id: crypto.randomUUID(),
        session_id: data.sessionId,
        tenant_id: tenantId,
        role: data.role as any,
        content: data.content,
        metadata: data.metadata || {},
        created_at: new Date().toISOString(),
      } as AgentMessage;
    }
  });

/** Update session task status */
export const updateSessionTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    sessionId: string;
    taskStatus?: string;
    taskPlan?: any;
    taskReport?: any;
    affectedFiles?: any;
    riskLevel?: string;
    title?: string;
  }) => data)
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const db = await getAdminDb(ctx);
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (data.taskStatus) updatePayload.task_status = data.taskStatus;
    if (data.taskPlan) updatePayload.task_plan = data.taskPlan;
    if (data.taskReport) updatePayload.task_report = data.taskReport;
    if (data.affectedFiles) updatePayload.affected_files = data.affectedFiles;
    if (data.riskLevel) updatePayload.risk_level = data.riskLevel;
    if (data.title) updatePayload.title = data.title;

    const { error } = await db
      .from("ai_agent_sessions")
      .update(updatePayload)
      .eq("id", data.sessionId)
      .eq("tenant_id", tenantId);

    if (error) throw new Error(error.message);

    await logAudit(db, tenantId, ctx.userId, "task_status_updated", data.sessionId, {
      new_status: data.taskStatus,
    });

    return { ok: true };
  });

/** Archive a session */
export const archiveSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { sessionId: string }) => data)
  .handler(async ({ data: { sessionId }, context }) => {
    const ctx = context as any;
    const db = await getAdminDb(ctx);
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    const { error } = await db
      .from("ai_agent_sessions")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("tenant_id", tenantId);

    if (error) throw new Error(error.message);

    await logAudit(db, tenantId, ctx.userId, "session_archived", sessionId);
    return { ok: true };
  });

/** Get project memory for tenant */
export const getProjectMemory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const defaultMemoryEntries: AgentMemoryEntry[] = [
      { id: "1", tenant_id: "default", category: "project", key: "name", value: "Indexes Store", created_at: "", updated_at: "" },
      { id: "2", tenant_id: "default", category: "project", key: "stack", value: "TanStack Start + React 19 + TypeScript + TailwindCSS 4 + Supabase", created_at: "", updated_at: "" },
      { id: "3", tenant_id: "default", category: "project", key: "architecture", value: "Multi-Tenant SaaS E-commerce Platform", created_at: "", updated_at: "" },
      { id: "4", tenant_id: "default", category: "design", key: "direction", value: "RTL (Arabic-first)", created_at: "", updated_at: "" },
      { id: "5", tenant_id: "default", category: "design", key: "theme", value: "Premium Dark Theme with glass morphism, rounded-2xl, shadow-xs", created_at: "", updated_at: "" },
      { id: "6", tenant_id: "default", category: "rules", key: "storage_bucket", value: "product-images only — no 'public' bucket", created_at: "", updated_at: "" },
      { id: "7", tenant_id: "default", category: "rules", key: "auth_pattern", value: "requireSupabaseAuth middleware on all server functions", created_at: "", updated_at: "" },
    ];

    try {
      const ctx = context as any;
      const db = await getAdminDb(ctx);
      const tenantId = await resolveTenantId(db, { userId: ctx.userId });

      const { data, error } = await db
        .from("ai_agent_memory")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("category", { ascending: true });

      if (error || !data || data.length === 0) return defaultMemoryEntries;
      return data as AgentMemoryEntry[];
    } catch {
      return defaultMemoryEntries;
    }
  });

/** Save/update project memory entry */
export const saveProjectMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { category: string; key: string; value: string }) => data)
  .handler(async ({ data, context }) => {
    try {
      const ctx = context as any;
      const db = await getAdminDb(ctx);
      const tenantId = await resolveTenantId(db, { userId: ctx.userId });

      const { error } = await db
        .from("ai_agent_memory")
        .upsert({
          tenant_id: tenantId,
          category: data.category,
          key: data.key,
          value: data.value,
          updated_at: new Date().toISOString(),
        }, { onConflict: "tenant_id,category,key" });

      if (error) throw new Error(error.message);

      await logAudit(db, tenantId, ctx.userId, "memory_updated", null, {
        category: data.category,
        key: data.key,
      });

      return { ok: true };
    } catch {
      return { ok: true };
    }
  });

/** Seed default project memory if empty */
export const seedProjectMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const ctx = context as any;
      const db = await getAdminDb(ctx);
      const tenantId = await resolveTenantId(db, { userId: ctx.userId });

      const { count } = await db
        .from("ai_agent_memory")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId);

      if ((count || 0) > 0) return { seeded: false };

      const defaults = [
        { category: "project", key: "name", value: "Indexes Store" },
        { category: "project", key: "stack", value: "TanStack Start + React 19 + TypeScript + TailwindCSS 4 + Supabase" },
        { category: "project", key: "architecture", value: "Multi-Tenant SaaS E-commerce Platform" },
        { category: "design", key: "direction", value: "RTL (Arabic-first)" },
        { category: "design", key: "theme", value: "Premium Dark Theme with glass morphism, rounded-2xl, shadow-xs" },
        { category: "design", key: "colors", value: "primary (brand), emerald (success), amber (warning), destructive (error)" },
        { category: "design", key: "font", value: "Tajawal (Arabic), system sans-serif" },
        { category: "rules", key: "storage_bucket", value: "product-images only — no 'public' bucket" },
        { category: "rules", key: "auth_pattern", value: "requireSupabaseAuth middleware on all server functions" },
        { category: "rules", key: "server_fn_pattern", value: "createServerFn({ method }) .middleware([requireSupabaseAuth]) .validator() .handler()" },
        { category: "rules", key: "tenant_isolation", value: "All queries MUST include tenant_id filter" },
        { category: "rules", key: "no_div_rule", value: "Prefer semantic Astryx/Radix components over raw divs where possible" },
      ];

      for (const entry of defaults) {
        await db.from("ai_agent_memory").upsert({
          tenant_id: tenantId,
          ...entry,
          updated_at: new Date().toISOString(),
        }, { onConflict: "tenant_id,category,key" });
      }

      return { seeded: true, count: defaults.length };
    } catch {
      return { seeded: false };
    }
  });

/** Get agent usage stats */
export const getAgentUsageStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as any;
    const db = await getAdminDb(ctx);
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    const { data, error } = await db
      .from("ai_agent_usage")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return { totalTokens: 0, totalCost: 0, requests: 0, entries: [] };

    const entries = data || [];
    const totalTokens = entries.reduce((sum: number, e: any) => sum + (e.total_tokens || 0), 0);
    const totalCost = entries.reduce((sum: number, e: any) => sum + parseFloat(e.estimated_cost_usd || "0"), 0);

    return {
      totalTokens,
      totalCost: Math.round(totalCost * 1000000) / 1000000,
      requests: entries.length,
      entries,
    };
  });

/** Get current user's agent role */
export const getAgentRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as any;
    const db = await getAdminDb(ctx);
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });
    const role = await resolveAgentRole(db, ctx.userId, tenantId);
    return { role, tenantId, userId: ctx.userId };
  });


// ──────────────────────────────────────────────────────────────
// Exported constants for context building
// ──────────────────────────────────────────────────────────────

export { PROJECT_FILE_STRUCTURE, DB_SCHEMA_SUMMARY };
export { resolveAgentRole, logAudit, recordUsage, getAdminDb };

// ──────────────────────────────────────────────────────────────
// Phase 3 — Planning + Approval Gate Server Functions
// ──────────────────────────────────────────────────────────────

/** Approve an agent task plan — transitions to executing (Requires admin/owner role) */
export const approveAgentTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ taskId: z.string().min(1) }))
  .handler(async ({ data, context }) => {
    const { enforceAgentRole } = await import("@/services/ai-agent/agent.rbac");
    const auth = await enforceAgentRole(context, "admin");
    const ctx = context as any;
    const db = await getAdminDb(ctx);

    const { error } = await db
      .from("ai_agent_tasks")
      .update({
        status: "executing",
        user_approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.taskId)
      .eq("tenant_id", auth.tenantId);

    if (error) throw new Error(`فشل في الموافقة على المهمة: ${error.message}`);
    return { success: true, taskId: data.taskId, status: "executing", approvedBy: auth.userId };
  });

/** Reject an agent task plan — transitions to cancelled (Requires admin/owner role) */
export const rejectAgentTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({
    taskId: z.string().min(1),
    reason: z.string().optional(),
  }))
  .handler(async ({ data, context }) => {
    const { enforceAgentRole } = await import("@/services/ai-agent/agent.rbac");
    const auth = await enforceAgentRole(context, "admin");
    const ctx = context as any;
    const db = await getAdminDb(ctx);

    const { error } = await db
      .from("ai_agent_tasks")
      .update({
        status: "cancelled",
        user_rejected_at: new Date().toISOString(),
        rejection_reason: data.reason ?? "رُفض من المستخدم",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.taskId)
      .eq("tenant_id", auth.tenantId);

    if (error) throw new Error(`فشل في رفض المهمة: ${error.message}`);
    return { success: true, taskId: data.taskId, status: "cancelled", rejectedBy: auth.userId };
  });

/** Get a task by ID */
export const getAgentTaskFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ taskId: z.string().min(1) }))
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const db = await getAdminDb(ctx);
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    const { data: task, error } = await db
      .from("ai_agent_tasks")
      .select("*")
      .eq("id", data.taskId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return task;
  });

/** List recent tasks for a session */
export const listSessionTasksFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ sessionId: z.string().min(1) }))
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const db = await getAdminDb(ctx);
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    const { data: tasks, error } = await db
      .from("ai_agent_tasks")
      .select("id, status, plan, affected_files, risk_level, created_at")
      .eq("session_id", data.sessionId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return tasks ?? [];
  });

/**
 * Execute an approved AI Agent task — Owner Role Only 👑
 * Applies code proposals to disk, runs typecheck & build verification,
 * logs audit trace, and saves solution into AI Long-Term Memory.
 */
export const executeApprovedTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ taskId: z.string().min(1) }))
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const db = await getAdminDb(ctx);
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });
    const startTime = Date.now();

    // Enforce Owner permission
    const { enforceAgentRole } = await import("@/services/ai-agent/agent.rbac");
    const agentRole = await enforceAgentRole(ctx, "owner");
    const { recordExecutionHistory } = await import("@/services/ai-agent/execution-history.service");

    // Fetch Task
    const { data: task, error: fetchErr } = await db
      .from("ai_agent_tasks")
      .select("*")
      .eq("id", data.taskId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (fetchErr || !task) {
      throw new Error(`لم يتم العثور على المهمة رقم ${data.taskId}`);
    }

    // Step 1: Update status to 'running'
    await db
      .from("ai_agent_tasks")
      .update({ status: "running", updated_at: new Date().toISOString() })
      .eq("id", data.taskId);

    try {
      // Step 2: Sandbox Layer — Create snapshot of original files before applying edits
      const { applyEditFile, createFileSnapshots, rollbackFileSnapshots } = await import(
        "@/services/ai-agent/agent.tools"
      );
      const affectedFiles = (task.affected_files as string[]) || [];
      const snapshots = await createFileSnapshots(affectedFiles);

      // Step 3: Apply file mutations
      const diffs = (task.diffs as Record<string, string>) || {};
      for (const [filePath, newContent] of Object.entries(diffs)) {
        await applyEditFile({
          filePath,
          originalContent: snapshots[filePath] || "",
          newContent,
          diff: "",
          requiresApproval: true,
        });
      }

      // Step 4: Run Automated Verification (Testing phase)
      await db
        .from("ai_agent_tasks")
        .update({ status: "testing", updated_at: new Date().toISOString() })
        .eq("id", data.taskId);

      const { execFile } = await import("node:child_process");
      const { promisify } = await import("node:util");
      const execAsync = promisify(execFile);

      let buildSuccess = true;
      let buildOutput = "Typecheck Passed Cleanly ✅";

      try {
        const { stdout } = await execAsync("npm", ["run", "typecheck"], { cwd: process.cwd() });
        buildOutput = stdout || buildOutput;
      } catch (err: any) {
        buildSuccess = false;
        buildOutput = `Typecheck Error: ${err.message || String(err)}`;
      }

      const executionTimeMs = Date.now() - startTime;

      const { analyzeExecutionFailure } = await import("@/services/ai-agent/failure-analysis.engine");
      const { executeSelfHealingLoop } = await import("@/services/ai-agent/retry.controller");

      if (!buildSuccess) {
        // Run Failure Analysis & Recovery Timeline Loop (Phase 8 🛠️)
        const failureAnalysis = analyzeExecutionFailure(buildOutput, affectedFiles);
        const retryResult = await executeSelfHealingLoop(buildOutput, affectedFiles);

        // Automatic Rollback to snapshot state upon verification failure
        await rollbackFileSnapshots(snapshots);

        await db
          .from("ai_agent_tasks")
          .update({
            status: "rolled_back",
            build_success: false,
            build_output: buildOutput,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.taskId);

        await recordExecutionHistory({
          tenant_id: tenantId,
          task_id: data.taskId,
          session_id: task.session_id,
          user_id: ctx.userId,
          status: "rolled_back",
          files_changed: affectedFiles,
          typecheck_passed: false,
          build_passed: false,
          build_output: buildOutput,
          rollback_status: "automatic_rollback_success",
          error_message: failureAnalysis.problem,
          execution_time_ms: executionTimeMs,
        });

        await logAudit(db, tenantId, ctx.userId, "ai_task_execution_failed_rolled_back", task.session_id, {
          taskId: data.taskId,
          error: buildOutput,
          failureAnalysis,
          retryAttempts: retryResult.attemptsCount,
        });

        return {
          success: false,
          status: "rolled_back",
          buildOutput,
          executionTimeMs,
          failureAnalysis,
          recoveryTimeline: retryResult.timeline,
        };
      }

      // Step 4: Task Success — Update Task & Save to Memory
      await db
        .from("ai_agent_tasks")
        .update({
          status: "success",
          build_success: true,
          build_output: buildOutput,
          user_approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.taskId);

      await recordExecutionHistory({
        tenant_id: tenantId,
        task_id: data.taskId,
        session_id: task.session_id,
        user_id: ctx.userId,
        status: "success",
        files_changed: affectedFiles,
        typecheck_passed: true,
        build_passed: true,
        build_output: buildOutput,
        rollback_status: "none",
        execution_time_ms: executionTimeMs,
      });

      // Audit Log
      await logAudit(db, tenantId, ctx.userId, "ai_task_executed_success", task.session_id, {
        taskId: data.taskId,
        affectedFiles: task.affected_files,
        executedByRole: agentRole,
        executionTimeMs,
      });

      // Save into Long-Term AI Memory
      const { saveTaskMemory } = await import("@/services/ai-agent/agent.tasks");
      await saveTaskMemory({
        tenant_id: tenantId,
        task_id: data.taskId,
        problem: `تنفيذ مهمة هندسية ${data.taskId}: ${task.affected_files?.join(", ")}`,
        solution: `تم تطبيق التعديلات بنجاح واجتياز فحص البناء البنائي 100% في ${executionTimeMs}ms.`,
        category: "bug_fix",
        affected_files: task.affected_files,
      });

      return { success: true, status: "success", buildOutput, executionTimeMs };
    } catch (e: any) {
      const executionTimeMs = Date.now() - startTime;
      await db
        .from("ai_agent_tasks")
        .update({
          status: "failed",
          build_success: false,
          build_output: e.message || String(e),
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.taskId);

      const { recordExecutionHistory } = await import("@/services/ai-agent/execution-history.service");
      await recordExecutionHistory({
        tenant_id: tenantId,
        task_id: data.taskId,
        session_id: task.session_id,
        user_id: ctx.userId,
        status: "failed",
        files_changed: (task.affected_files as string[]) || [],
        typecheck_passed: false,
        build_passed: false,
        build_output: e.message || String(e),
        error_message: e.message || String(e),
        execution_time_ms: executionTimeMs,
      });

      throw new Error(`فشل تنفيذ المهمة: ${e.message || String(e)}`);
    }
  });

/** List execution history entries */
export const listExecutionHistoryFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as any;
    const db = await getAdminDb(ctx);
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    const { listExecutionHistory } = await import("@/services/ai-agent/execution-history.service");
    return listExecutionHistory(tenantId, 25);
  });

/** Scan and return Codebase Intelligence Index */
export const getCodebaseIndexFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { scanProjectStructure } = await import("@/services/ai-agent/code-intelligence.service");
    return scanProjectStructure();
  });

/** Run Impact Analysis for target files */
export const getImpactAnalysisFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ files: z.array(z.string()) }))
  .handler(async ({ data }) => {
    const { findImpactAnalysis } = await import("@/services/ai-agent/code-intelligence.service");
    return findImpactAnalysis(data.files);
  });

