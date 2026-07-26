/**
 * Indexes AI Engineering Agent — Streaming API Endpoint with Activity Events & Project Context Engine
 *
 * POST /api/ai/agent
 *
 * Provides real-time SSE streaming, agent status events, Project Context Engine integration,
 * and dynamic resolution of the active AI provider (Vertex AI / Gemini).
 */
import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { z } from "zod";
import { resolveActiveAIProvider } from "@/lib/ai-provider.server";
import { buildProjectPromptContext } from "@/services/ai/project-context.service";
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
    .max(50)
    .default([]),
  projectMemory: z.string().default(""),
  agentRole: z.enum(["owner", "admin", "developer", "viewer"]).default("owner"),
  providerId: z.string().optional(),
  tenantId: z.string().default("default"),
});

function buildSystemPrompt(
  dynamicProjectContext: string,
  projectMemory: string,
  agentRole: string,
) {
  const roleDesc =
    agentRole === "owner"
      ? "لديك صلاحية كاملة: تحليل، اقتراح، تنفيذ تعديلات، إنشاء ملفات."
      : agentRole === "admin"
        ? "لديك صلاحية تحليل واقتراح وتنفيذ محدود."
        : agentRole === "developer"
          ? "لديك صلاحية التحليل والاقتراح فقط. لا يمكنك تنفيذ التعديلات."
          : "لديك صلاحية القراءة فقط.";

  return `أنت "Indexes AI Engineering Agent" — مهندس برمجيات Senior متخصص حصرياً في مشروع Indexes Store.

== دورك وصلاحياتك ==
${roleDesc}

== ذاكرة ومعرفة المشروع التراكمية (PROJECT CONTEXT ENGINE) ==
${dynamicProjectContext}

== ذاكرة سياق الجلسة ==
${projectMemory || "(لا توجد ذاكرة إضافية محفوظة بعد)"}

== هيكل ملفات المشروع الأساسية ==
${PROJECT_FILE_STRUCTURE}

== Schema قاعدة البيانات والحقول ==
${DB_SCHEMA_SUMMARY}

== قواعد هندسية صارمة ==
1. التزم باللغة العربية الواضحة في الشرح والتحليل.
2. الكود والمسارات تترك بالإنجليزية كما هي في المشروع.
3. التزم دائماً بأنماط التكوين المعمول بها في المشروع: createServerFn مع requireSupabaseAuth والمحققات (zod validator).
4. حافظ على عزل البيانات (Multi-Tenant isolation) بتنسيق tenant_id.
5. لا تكشف أي مفاتيح حساسة أو بيانات توثيق.
6. قدم دائماً إجابات واضحة ومباشرة بدون إظهار التفكير الداخلي أو سلسلة الأفكار الخام (Chain of thought).

== نمط الإجابة المطلوب ==
- ملخص الهدف والمشكلة
- الخطة والخطوات المرقمة
- الملفات المعنية مع مساراتها الكاملة (مثل [ai-provider.server.ts](file:///d:/web/indexes_store/src/lib/ai-provider.server.ts))
- مستوى الخطورة: 🟢 Low | 🟡 Medium | 🟠 High | 🔴 Critical
- الكود والتنفيذ في code blocks مخصصة ومحددة اللغة.`;
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
            { error: "بيانات الطلب غير صالحة", detail: String(e) },
            { status: 400 },
          );
        }

        if (payload.agentRole === "viewer") {
          return Response.json(
            { error: "ليس لديك صلاحية إرسال رسائل. تواصل مع المسؤول." },
            { status: 403 },
          );
        }

        // Create stream with SSE activity status events
        const encoder = new TextEncoder();
        const customStream = new ReadableStream({
          async start(controller) {
            const sendEvent = (data: object) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
              );
            };

            try {
              // Status 1: Receiving request
              sendEvent({
                type: "status",
                status: "receiving_request",
                label: "جاري استقبال طلبك...",
              });
              await new Promise((r) => setTimeout(r, 40));

              // Status 2: Loading Project Context Engine
              sendEvent({
                type: "status",
                status: "loading_project_context",
                label: "📚 جاري تحميل سياق ذاكرة المشروع...",
              });

              const dynamicProjectContext = await buildProjectPromptContext(
                payload.tenantId,
              );

              sendEvent({
                type: "status",
                status: "project_context_ready",
                label: "✅ تم تجهيز سياق المشروع والمقابلة البرمجية...",
              });
              await new Promise((r) => setTimeout(r, 40));

              // Status 3: Searching project
              sendEvent({
                type: "status",
                status: "searching_project",
                label: "أراجع هيكل وملفات المشروع...",
              });

              // Resolve Active Provider dynamically
              const resolved = await resolveActiveAIProvider({
                providerId: payload.providerId,
              });

              if (!resolved || !resolved.model) {
                sendEvent({
                  type: "error",
                  error:
                    "لم يتم العثور على مزود AI مفعل، جاري المحاولة...",
                  detail: "No active AI provider found",
                });
                controller.close();
                return;
              }

              console.log("[AI_AGENT_RESOLVED]", {
                provider: resolved.provider,
                modelName: resolved.modelName,
                source: resolved.source,
              });

              // Status 4: Generating response
              sendEvent({
                type: "status",
                status: "generating_response",
                label: `أكتب الإجابة الفنية (${resolved.provider} / ${resolved.modelName})...`,
                provider: resolved.provider,
                model: resolved.modelName,
              });

              const systemPrompt = buildSystemPrompt(
                dynamicProjectContext,
                payload.projectMemory,
                payload.agentRole,
              );

              // Format messages history
              const formattedMessages = [
                ...payload.history.map((m) => ({
                  role: m.role as "user" | "assistant" | "system",
                  content: m.content,
                })),
                { role: "user" as const, content: payload.message },
              ];

              // Execute AI stream with model fallbacks (gemini-2.5-flash -> gemini-2.5-flash-lite -> gemini-1.5-flash)
              const candidateModels = Array.from(
                new Set([
                  resolved.modelName,
                  "gemini-2.5-flash",
                  "gemini-2.5-flash-lite",
                  "gemini-1.5-flash",
                ]),
              );

              let streamExecuted = false;
              let lastStreamErr: any = null;

              for (const modelCandidate of candidateModels) {
                try {
                  console.log(
                    `[AI_AGENT] Attempting streamText with provider ${resolved.provider} / model ${modelCandidate}`,
                  );
                  const activeModel =
                    modelCandidate === resolved.modelName
                      ? resolved.model
                      : (await import("@/lib/ai-provider.server")).createModelFromConfig(
                          resolved.provider,
                          null,
                          modelCandidate,
                        );

                  const result = streamText({
                    model: activeModel,
                    system: systemPrompt,
                    messages: formattedMessages,
                    temperature: 0.3,
                  });

                  for await (const chunk of result.textStream) {
                    if (chunk) {
                      sendEvent({ type: "text", content: chunk });
                    }
                  }

                  streamExecuted = true;
                  break;
                } catch (candErr: any) {
                  lastStreamErr = candErr;
                  console.warn(
                    `[AI_AGENT_MODEL_FALLBACK] Model ${modelCandidate} failed: ${candErr?.message}, trying next fallback candidate...`,
                  );
                }
              }

              if (!streamExecuted && lastStreamErr) {
                throw lastStreamErr;
              }

              // Status 5: Completed
              sendEvent({
                type: "status",
                status: "completed",
                label: "اكتملت المعالجة بنجاح",
              });
              controller.close();
            } catch (err: any) {
              console.error("[AI_AGENT_STREAM_ERROR]", err);
              const errMsg = err?.message || String(err);
              const userFriendlyErr = /rate|quota|429/i.test(errMsg)
                ? "تم تجاوز حد الطلبات مؤقتاً، جاري المحاولة..."
                : "حدث خطأ في مزود AI، جاري إعادة المحاولة...";

              sendEvent({
                type: "error",
                error: userFriendlyErr,
                detail: errMsg,
              });
              controller.close();
            }
          },
        });

        return new Response(customStream, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
