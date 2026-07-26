/**
 * Agent Engine — Core Runtime Orchestrator
 *
 * Coordinates the full agent lifecycle:
 *   Context → Tools → Planner → Approval Gate → Executor → Memory → Events
 *
 * Used by api/ai.agent.ts as the single entry point.
 *
 * NOTE: Uses ai SDK v7 which changed tool API:
 *   - `parameters` → `inputSchema`
 *   - `execute(input, options)` — first arg is the typed input
 *   - `maxSteps` removed from streamText (now handled via `prepareStep`)
 */

import { streamText } from "ai";
import { z } from "zod";
import type { LanguageModel } from "ai";
import type { ResolvedAIProvider } from "@/lib/ai-provider.server";
import { createModelFromConfig } from "@/lib/ai-provider.server";
import { buildProjectPromptContext } from "@/services/ai/project-context.service";
import {
  makeStatusEvent,
  makeErrorEvent,
  makeReadFileEvent,
  makeSearchCodeEvent,
  makeInspectDbEvent,
  makeToolCallEvent,
  makeRetryEvent,
  makeApprovalRequiredEvent,
} from "./agent.events";
import { canExecuteTool, type AgentRole } from "./agent.permissions";
import { calculateRiskLevel, isProtectedPath } from "./agent.policy";
import {
  readFile,
  searchCode,
  listFiles,
  inspectDatabase,
  proposeEditFile,
  proposeCreateFile,
} from "./agent.tools";

// ─────────────────────────────────────────────────
// Engine Input
// ─────────────────────────────────────────────────

export interface AgentEngineInput {
  sessionId: string;
  tenantId: string;
  message: string;
  history: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  projectMemory: string;
  agentRole: AgentRole;
  resolved: ResolvedAIProvider;
  sendEvent: (event: object) => void;
}

// ─────────────────────────────────────────────────
// Model Fallback Chain
// ─────────────────────────────────────────────────

const MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-1.5-flash",
];

// ─────────────────────────────────────────────────
// System Prompt Builder
// ─────────────────────────────────────────────────

function buildSystemPrompt(
  projectContext: string,
  projectMemory: string,
  agentRole: AgentRole,
): string {
  const roleDesc: Record<AgentRole, string> = {
    owner: "لديك صلاحية كاملة: قراءة، تحليل، اقتراح خطة، وتنفيذ تعديلات بعد موافقة المستخدم.",
    admin: "لديك صلاحية التحليل والاقتراح والتنفيذ المحدود بعد موافقة.",
    developer: "لديك صلاحية القراءة والتحليل والاقتراح فقط. لا يمكنك تنفيذ تعديلات.",
    viewer: "لديك صلاحية القراءة فقط.",
  };

  return `أنت "Indexes AI Engineering Agent" — مهندس برمجيات Senior متخصص في مشروع Indexes Store.

== صلاحياتك ==
${roleDesc[agentRole]}

== قواعد التنفيذ الصارمة ==
1. لا تُعدّل أي ملف بدون موافقة صريحة من المستخدم.
2. لا تكشف مفاتيح API أو بيانات التوثيق.
3. حافظ على Multi-Tenant isolation (tenant_id) في كل استعلام.
4. استخدم أدواتك (read_file, search_code, inspect_database) قبل اقتراح أي خطة.
5. أجب بالعربية الواضحة. الكود والمسارات تبقى بالإنجليزية.
6. لا تعرض chain-of-thought أو التفكير الداخلي.

== سياق المشروع ==
${projectContext}

== ذاكرة الجلسة ==
${projectMemory || "(لا توجد ذاكرة إضافية)"}

== نمط الإجابة ==
- ملخص المشكلة
- الخطة المرقمة مع الملفات
- مستوى الخطورة: 🟢 Low | 🟡 Medium | 🟠 High | 🔴 Critical
- الكود في code blocks محددة اللغة`.trim();
}

// ─────────────────────────────────────────────────
// Tool Schemas (ai SDK v7: inputSchema instead of parameters)
// ─────────────────────────────────────────────────

const ReadFileSchema = z.object({
  file_path: z.string().describe("المسار النسبي للملف مثل src/routes/search.tsx"),
  start_line: z.number().optional().describe("رقم السطر الأول"),
  end_line: z.number().optional().describe("رقم السطر الأخير"),
});

const SearchCodeSchema = z.object({
  query: z.string().describe("النص أو الرمز المراد البحث عنه"),
  file_pattern: z.string().optional().describe("نمط الملفات مثل *.tsx أو *.ts"),
  case_insensitive: z.boolean().optional().default(false),
});

const ListFilesSchema = z.object({
  dir_path: z.string().describe("المسار النسبي للمجلد مثل src/routes"),
});

const InspectDatabaseSchema = z.object({
  table_name: z.string().describe("اسم الجدول مثل products أو orders"),
  include_sample_rows: z.boolean().optional().default(false),
});

const ProposeEditFileSchema = z.object({
  file_path: z.string().describe("المسار النسبي للملف"),
  new_content: z.string().describe("المحتوى الجديد الكامل للملف"),
  reason: z.string().describe("سبب التعديل المقترح"),
});

const ProposeCreateFileSchema = z.object({
  file_path: z.string().describe("المسار النسبي للملف الجديد"),
  content: z.string().describe("محتوى الملف الجديد"),
  reason: z.string().describe("سبب إنشاء الملف"),
});

// ─────────────────────────────────────────────────
// Build ToolSet for ai SDK v7
// ─────────────────────────────────────────────────

function buildTools(
  role: AgentRole,
  tenantId: string,
  sendEvent: (e: object) => void,
): Record<string, any> {
  const tools: Record<string, any> = {};

  // ── Read File ─────────────────────────────────────────────────
  if (canExecuteTool("read_file", role).allowed) {
    tools.read_file = {
      description: "يقرأ محتوى ملف كود من المشروع بالمسار الكامل أو النسبي",
      inputSchema: ReadFileSchema,
      execute: async (input: z.infer<typeof ReadFileSchema>) => {
        sendEvent(makeReadFileEvent(input.file_path));
        try {
          return await readFile(input.file_path, input.start_line, input.end_line);
        } catch (e: unknown) {
          return { error: String((e as Error)?.message ?? e) };
        }
      },
    };
  }

  // ── Search Code ───────────────────────────────────────────────
  if (canExecuteTool("search_code", role).allowed) {
    tools.search_code = {
      description: "يبحث في كود المشروع عن نص أو دالة أو رمز",
      inputSchema: SearchCodeSchema,
      execute: async (input: z.infer<typeof SearchCodeSchema>) => {
        sendEvent(makeSearchCodeEvent(input.query, input.file_pattern));
        return searchCode(input.query, input.file_pattern, {
          caseInsensitive: input.case_insensitive ?? false,
        });
      },
    };
  }

  // ── List Files ────────────────────────────────────────────────
  if (canExecuteTool("list_files", role).allowed) {
    tools.list_files = {
      description: "يسرد ملفات ومجلدات في مسار معين من المشروع",
      inputSchema: ListFilesSchema,
      execute: async (input: z.infer<typeof ListFilesSchema>) => {
        sendEvent(makeToolCallEvent("list_files", { dir_path: input.dir_path }));
        try {
          return await listFiles(input.dir_path);
        } catch (e: unknown) {
          return { error: String((e as Error)?.message ?? e) };
        }
      },
    };
  }

  // ── Inspect Database ──────────────────────────────────────────
  if (canExecuteTool("inspect_database", role).allowed) {
    tools.inspect_database = {
      description: "يفحص هيكل جدول في Supabase وعدد السجلات",
      inputSchema: InspectDatabaseSchema,
      execute: async (input: z.infer<typeof InspectDatabaseSchema>) => {
        sendEvent(makeInspectDbEvent(input.table_name));
        return inspectDatabase(
          input.table_name,
          tenantId,
          input.include_sample_rows ?? false,
        );
      },
    };
  }

  // ── Propose Edit File (approval_required) ────────────────────
  if (canExecuteTool("edit_file", role).allowed) {
    tools.propose_edit_file = {
      description:
        "يقترح تعديلاً على ملف موجود ويعرض الـ diff للمراجعة قبل التطبيق",
      inputSchema: ProposeEditFileSchema,
      execute: async (input: z.infer<typeof ProposeEditFileSchema>) => {
        if (isProtectedPath(input.file_path)) {
          return { error: `هذا الملف محمي ولا يمكن تعديله: ${input.file_path}` };
        }
        sendEvent(
          makeToolCallEvent("propose_edit_file", {
            file_path: input.file_path,
            reason: input.reason,
          }),
        );
        try {
          const proposal = await proposeEditFile(input.file_path, input.new_content);
          const planStep = {
            step: 1,
            action: "modify" as const,
            description: input.reason,
            file: input.file_path,
            requiresApproval: true,
          };
          sendEvent(
            makeApprovalRequiredEvent(
              `task-${Date.now()}`,
              [planStep],
              [input.file_path],
              calculateRiskLevel([planStep], [input.file_path]),
            ),
          );
          return {
            status: "approval_required",
            diff: proposal.diff,
            file: input.file_path,
            message:
              "يتطلب هذا التعديل موافقتك. راجع الـ diff أعلاه وانقر تنفيذ للمتابعة.",
          };
        } catch (e: unknown) {
          return { error: String((e as Error)?.message ?? e) };
        }
      },
    };
  }

  // ── Propose Create File ───────────────────────────────────────
  if (canExecuteTool("create_file", role).allowed) {
    tools.propose_create_file = {
      description: "يقترح إنشاء ملف جديد في المشروع",
      inputSchema: ProposeCreateFileSchema,
      execute: async (input: z.infer<typeof ProposeCreateFileSchema>) => {
        sendEvent(
          makeToolCallEvent("propose_create_file", {
            file_path: input.file_path,
            reason: input.reason,
          }),
        );
        try {
          const proposal = await proposeCreateFile(input.file_path, input.content);
          return {
            status: "approval_required",
            diff: proposal.diff,
            file: input.file_path,
            message: "يتطلب إنشاء هذا الملف موافقتك.",
          };
        } catch (e: unknown) {
          return { error: String((e as Error)?.message ?? e) };
        }
      },
    };
  }

  return tools;
}

// ─────────────────────────────────────────────────
// Main Engine Run
// ─────────────────────────────────────────────────

export async function runAgentEngine(input: AgentEngineInput): Promise<void> {
  const {
    tenantId,
    message,
    history,
    projectMemory,
    agentRole,
    resolved,
    sendEvent,
  } = input;

  // 1. Load Project Context & Task Memory (Phase 5)
  sendEvent(makeStatusEvent("loading_project_context", "📚 جاري تحميل سياق ذاكرة المشروع..."));
  const projectContext = await buildProjectPromptContext(tenantId);

  // Search Long-Term Task Memory for relevant past solutions
  const { searchTaskMemory } = await import("./agent.tasks");
  const pastMemories = await searchTaskMemory(tenantId, message, 3);
  let memoryStr = projectMemory || "";
  if (pastMemories.length > 0) {
    const pastStr = pastMemories
      .map(
        (m) =>
          `[حل سابق / ${m.category}]: مشكلة "${m.problem}" ⬅️ الحل: ${m.solution} ${m.commit_hash ? `(Commit: ${m.commit_hash})` : ""}`,
      )
      .join("\n");
    memoryStr = memoryStr ? `${memoryStr}\n\n${pastStr}` : pastStr;
    sendEvent(
      makeStatusEvent(
        "task_memory_recalled",
        `🧬 تم استرجاع ${pastMemories.length} ذكريات سابقة ذات صلة من ai_task_memory...`,
      ),
    );
  } else {
    sendEvent(makeStatusEvent("project_context_ready", "✅ تم تجهيز سياق المشروع"));
  }

  // 2. Build system prompt + tools
  const systemPrompt = buildSystemPrompt(projectContext, memoryStr, agentRole);
  const tools = buildTools(agentRole, tenantId, sendEvent);

  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: message },
  ];

  sendEvent(makeStatusEvent("generating_response", "🤖 أفكر في الإجابة..."));

  // 3. Stream with model fallback
  const candidates = Array.from(new Set([resolved.modelName, ...MODEL_FALLBACKS]));
  let streamSuccess = false;
  let lastErr: unknown;

  for (let i = 0; i < candidates.length; i++) {
    const modelName = candidates[i];
    try {
      if (i > 0) {
        sendEvent(makeRetryEvent(i, candidates.length, modelName, String(lastErr)));
      }

      const activeModel: LanguageModel =
        modelName === resolved.modelName
          ? resolved.model
          : createModelFromConfig(resolved.provider, null, modelName);

      const result = streamText({
        model: activeModel,
        system: systemPrompt,
        messages,
        tools: tools as any, // ai v7 ToolSet — cast to bypass strict generic inference
        temperature: 0.3,
      });

      for await (const chunk of result.textStream) {
        if (chunk) sendEvent({ type: "text", content: chunk });
      }

      streamSuccess = true;
      break;
    } catch (err) {
      lastErr = err;
      console.warn(`[AgentEngine] Model ${modelName} failed:`, err);
    }
  }

  if (!streamSuccess) {
    sendEvent(
      makeErrorEvent(
        "فشلت جميع نماذج AI. يرجى المحاولة لاحقاً أو التحقق من إعدادات المزود.",
        String(lastErr),
        false,
      ),
    );
    return;
  }

  // 4. Done
  sendEvent(makeStatusEvent("completed", "✅ اكتملت المعالجة"));
}
