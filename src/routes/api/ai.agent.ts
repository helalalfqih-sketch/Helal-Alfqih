/**
 * Indexes AI Engineering Agent — Streaming API Endpoint
 *
 * POST /api/ai/agent
 *
 * Direct match with src/routes/api/ai.analyze-product.ts AI Client initialization.
 */
import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { z } from "zod";
import { createLovableGateway } from "@/lib/ai-gateway.server";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createVertex } from "@ai-sdk/google-vertex";
import { resolveActiveAIProvider } from "@/lib/ai-provider.server";
import {
  PROJECT_FILE_STRUCTURE,
  DB_SCHEMA_SUMMARY,
} from "@/lib/ai-agent.functions";

const InputSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(10000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      }),
    )
    .max(40)
    .default([]),
  projectMemory: z.string().default(""),
  agentRole: z.enum(["owner", "admin", "developer", "viewer"]).default("owner"),
  providerId: z.string().optional(),
});

function buildSystemPrompt(projectMemory: string, agentRole: string) {
  const roleDesc =
    agentRole === "owner"
      ? "لديك صلاحية كاملة: تحليل، اقتراح، تنفيذ تعديلات، إنشاء ملفات."
      : agentRole === "admin"
        ? "لديك صلاحية تحليل واقتراح وتنفيذ محدود."
        : agentRole === "developer"
          ? "لديك صلاحية التحليل والاقتراح فقط. لا يمكنك تنفيذ التعديلات."
          : "لديك صلاحية القراءة فقط.";

  return `أنت "Indexes AI Engineering Agent" — مهندس برمجيات Senior متخصص حصرياً في مشروع Indexes Store.

== دورك ==
${roleDesc}

== بيانات المشروع ==
- الاسم: Indexes Store — منصة تجارة إلكترونية SaaS متعددة المتاجر
- Frontend: TanStack Start + React 19 + TypeScript + TailwindCSS 4 + Shadcn UI + Framer Motion
- Backend: Supabase + PostgreSQL + Server Functions (createServerFn)
- Architecture: Multi-Tenant SaaS مع RLS
- AI: Google Vertex AI + Gemini Models + Vercel AI SDK
- Integrations: WhatsApp Business API, Meta Catalog, Google Merchant, Sitemap, JSON-LD

== ذاكرة المشروع ==
${projectMemory || "(لا توجد ذاكرة محفوظة بعد)"}

== هيكل ملفات المشروع ==
${PROJECT_FILE_STRUCTURE}

== Schema قاعدة البيانات ==
${DB_SCHEMA_SUMMARY}

== قواعد إلزامية ==
1. لا تعدل ملفات بدون خطة معتمدة من المستخدم
2. لا تحذف ملفات أبداً
3. لا تغير التصميم العام أو الهوية البصرية بدون موافقة صريحة
4. حافظ على RTL (اتجاه من اليمين لليسار) في كل الواجهات
5. حافظ على Multi-Tenant isolation — كل استعلام يجب أن يتضمن tenant_id
6. استخدم Tailwind tokens (لا hex ثابت) و design tokens المعرّفة
7. التزم بنمط createServerFn + requireSupabaseAuth + validator
8. Storage bucket = "product-images" فقط
9. لا تكشف مفاتيح API أو بيانات حساسة

== طريقة الرد ==
عند تحليل طلب:
1. حدد المشكلة أو الهدف بوضوح
2. اذكر الملفات المتأثرة مع مساراتها الكاملة
3. ضع خطة مرقمة خطوة بخطوة
4. حدد درجة الخطورة: 🟢 Low | 🟡 Medium | 🟠 High | 🔴 Critical
5. اذكر التأثيرات المحتملة على باقي النظام

عند كتابة الكود:
- استخدم TypeScript مع أنواع صريحة
- اتبع أنماط المشروع الحالية
- أضف تعليقات بالعربية للتوضيح
- لا تكرر كود موجود

أجب دائماً بالعربية إلا عند كتابة الكود أو المصطلحات التقنية.
استخدم Markdown و code blocks مع syntax highlighting.`;
}

export const Route = createFileRoute("/api/ai/agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: z.infer<typeof InputSchema>;
        try {
          payload = InputSchema.parse(await request.json());
        } catch (e) {
          return Response.json(
            { error: "Invalid input payload", detail: String(e) },
            { status: 400 },
          );
        }

        if (payload.agentRole === "viewer") {
          return Response.json(
            { error: "ليس لديك صلاحية إرسال رسائل. تواصل مع المسؤول." },
            { status: 403 },
          );
        }

        console.log("[ENV_DEBUG]", {
          LOVABLE_API_KEY: Boolean(process.env.LOVABLE_API_KEY),
          GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY),
          GOOGLE_VERTEX_PROJECT: Boolean(process.env.GOOGLE_VERTEX_PROJECT),
          VERTEX_PROJECT_ID: Boolean(process.env.VERTEX_PROJECT_ID),
          NODE_ENV: process.env.NODE_ENV,
          VERCEL_ENV: process.env.VERCEL_ENV,
        });

        let model;
        let provider = "";
        let modelName = "";

        try {
          const resolved = await resolveActiveAIProvider({ providerId: payload.providerId });
          console.log("[AI_AGENT_RESOLVED]", {
            found: Boolean(resolved),
            provider: resolved?.provider,
            modelName: resolved?.modelName,
            source: resolved?.source,
          });

          if (!resolved || !resolved.model) {
            return Response.json(
              { error: "No AI provider configured" },
              { status: 500 },
            );
          }

          model = resolved.model;
          provider = String(resolved.provider);
          modelName = resolved.modelName;
        } catch (error: any) {
          console.error("[AI_AGENT_INIT_ERROR]", error);
          return Response.json(
            {
              error: "AI Provider initialization failed",
              reason: error?.message || String(error),
              stack: error?.stack,
            },
            { status: 500 },
          );
        }

        console.log("[AI_AGENT_PROVIDER_SELECTED]", {
          provider,
          model: modelName,
        });

        const systemPrompt = buildSystemPrompt(
          payload.projectMemory,
          payload.agentRole,
        );

        try {
          const result = streamText({
            model,
            system: systemPrompt,
            messages: [
              ...payload.history.map((m) => ({
                role: m.role as "user" | "assistant" | "system",
                content: m.content,
              })),
              { role: "user" as const, content: payload.message },
            ],
            temperature: 0.4,
          });

          const response = result.toTextStreamResponse();

          const headers = new Headers(response.headers);
          headers.set("X-AI-Provider", provider);
          headers.set("X-AI-Model", modelName);
          headers.set("X-AI-Session", payload.sessionId);

          return new Response(response.body, {
            status: response.status,
            headers,
          });
        } catch (error: any) {
          console.error("[AI_AGENT_EXECUTION_ERROR]", error);
          const message = error instanceof Error ? error.message : String(error);
          const status = /rate|429/i.test(message)
            ? 429
            : /402|credit/i.test(message)
              ? 402
              : 500;
          return Response.json(
            {
              error: "AI execution failed",
              message: error?.message || String(error),
              provider: provider,
              model: modelName,
            },
            { status },
          );
        }
      },
    },
  },
});
