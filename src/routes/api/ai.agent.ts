/**
 * Indexes AI Engineering Agent — Streaming API Endpoint
 *
 * POST /api/ai/agent
 *
 * Accepts a user message and session context, streams the AI response
 * back to the client using Vercel AI SDK's streamText.
 */
import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { z } from "zod";
import { createLovableGateway } from "@/lib/ai-gateway.server";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createVertex } from "@ai-sdk/google-vertex";
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
});

function resolveModel() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (lovableKey) {
    const gw = createLovableGateway(lovableKey);
    // Identical model naming pattern as ai.analyze-product.ts
    const modelName = "google/gemini-3-flash-preview";
    console.log("[AI_PROVIDER] Initializing Lovable Gateway with model:", modelName);
    return { model: gw(modelName), provider: "lovable", modelName };
  }

  if (geminiKey) {
    const gw = createOpenAICompatible({
      name: "gemini",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      headers: { Authorization: `Bearer ${geminiKey}` },
    });
    const modelName = "gemini-1.5-flash";
    console.log("[AI_PROVIDER] Initializing Gemini Direct API with model:", modelName);
    return { model: gw(modelName), provider: "gemini-api", modelName };
  }

  // Fallback to Google Vertex AI (identical to ai.analyze-product.ts)
  const vertex = createVertex({
    location: process.env.VERTEX_LOCATION || "us-central1",
    project: process.env.VERTEX_PROJECT_ID,
  });
  const modelName = "gemini-1.5-flash";
  console.log("[AI_PROVIDER] Initializing Vertex AI with model:", modelName);
  return { model: vertex(modelName), provider: "vertex", modelName };
}

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
          const rawJson = await request.json();
          payload = InputSchema.parse(rawJson);
        } catch (e) {
          console.error("[AI_AGENT_ERROR] Input parsing failed:", String(e));
          return Response.json(
            { error: "Invalid input payload", detail: String(e) },
            { status: 400 },
          );
        }

        if (payload.agentRole === "viewer") {
          console.warn("[SESSION_ERROR] User has viewer-only access");
          return Response.json(
            { error: "ليس لديك صلاحية إرسال رسائل. تواصل مع المسؤول." },
            { status: 403 },
          );
        }

        let modelInfo;
        try {
          modelInfo = resolveModel();
        } catch (e) {
          console.error("[AI_PROVIDER] Model resolution failed:", String(e));
          return Response.json(
            { error: "فشل إعداد مزود الذكاء الاصطناعي", detail: String(e) },
            { status: 500 },
          );
        }

        const { model, provider, modelName } = modelInfo;

        let systemPrompt = "";
        try {
          systemPrompt = buildSystemPrompt(
            payload.projectMemory,
            payload.agentRole,
          );
        } catch (e) {
          console.error("[CONTEXT_ERROR] System prompt construction failed:", String(e));
          systemPrompt = "أنت مساعد برمجي متخصص لمتجر اندكس ستور.";
        }

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
          console.error("[AI_AGENT_ERROR] Execution failed:", error?.message || String(error));
          const message = error instanceof Error ? error.message : String(error);
          const status = /rate|429/i.test(message)
            ? 429
            : /402|credit/i.test(message)
              ? 402
              : 500;
          return Response.json({ error: message, provider, modelName }, { status });
        }
      },
    },
  },
});
