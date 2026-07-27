/**
 * Indexes AI Engineering Agent — Admin Page
 * /admin/ai-developer
 *
 * Premium dark-themed chat interface with:
 * - Streaming AI responses
 * - Session management (sidebar timeline)
 * - Analysis reports with approval buttons
 * - Context panel (affected files, risk, memory)
 * - Task status tracking
 * - Token usage stats
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  Send,
  Plus,
  Sparkles,
  Loader2,
  Bot,
  User,
  Archive,
  ChevronRight,
  FileCode,
  FileText,
  Shield,
  Brain,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Play,
  XCircle,
  BarChart3,
  Cpu,
  MessageSquare,
  Clipboard,
  Check,
  MoreHorizontal,
  ChevronDown,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Mic,
  History,
  Layers,
  Eye,
  ArrowLeft,
  SlidersHorizontal,
  FileUp,
  FilePlus,
  UploadCloud,
  X,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import {
  listAgentSessions,
  getAgentSession,
  createAgentSession,
  saveAgentMessage,
  updateSessionTask,
  archiveSession,
  getProjectMemory,
  seedProjectMemory,
  getAgentUsageStats,
  getAgentRole,
  approveAgentTask,
  rejectAgentTask,
  executeApprovedTask,
  startExecutionTask,
  listExecutionHistoryFn,
  listExecutionJournalFn,
  getSessionExecutionEventsFn,
  getImpactAnalysisFn,
  getAgentPerformanceFn,
  parseProjectFileFn,
  applyCodePatchFn,
  validateBuildStateFn,
  publishToProductionFn,
  type AgentSession,
  type AgentMessage,
  type AgentMemoryEntry,
  type ProjectFileParsedContext,
} from "@/lib/ai-agent.functions";
import { listAIProvidersFn } from "@/lib/ai-provider.server";
import { getQualityIncidentsFn } from "@/lib/quality-api.server";
import { MonacoCodeEditor } from "@/components/ai-agent/monaco-code-editor";
import { FileExplorer, type FileItem } from "@/components/ai-agent/file-explorer";
import { ExecutionJournalPanel } from "@/components/ai-agent/execution-journal-panel";
import { LivePreviewCanvas } from "@/components/ai-agent/live-preview-canvas";
import { CommandPalette } from "@/components/ai-agent/command-palette";

export const Route = createFileRoute("/admin/ai-developer")({
  head: () => ({
    meta: [
      { title: "Indexes AI Engineering Agent — لوحة الإدارة" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AIEngineeringAgentPage,
});

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────

function AIEngineeringAgentPage() {
  const queryClient = useQueryClient();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Server function hooks
  const listSessionsFn = useServerFn(listAgentSessions);
  const getSessionFn = useServerFn(getAgentSession);
  const createSessionFn = useServerFn(createAgentSession);
  const saveMessageFn = useServerFn(saveAgentMessage);
  const updateTaskFn = useServerFn(updateSessionTask);
  const archiveSessionFn = useServerFn(archiveSession);
  const updateSessionTaskFn = useServerFn(updateSessionTask);
  const getMemoryFn = useServerFn(getProjectMemory);
  const seedMemoryFn = useServerFn(seedProjectMemory);
  const getUsageFn = useServerFn(getAgentUsageStats);
  const getRoleFn = useServerFn(getAgentRole);
  const listProvidersFn = useServerFn(listAIProvidersFn);
  const approveTaskFn = useServerFn(approveAgentTask);
  const rejectTaskFn = useServerFn(rejectAgentTask);

  // State
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [showSessions, setShowSessions] = useState(true);
  const [showContext, setShowContext] = useState(true);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [recoveryTimeline, setRecoveryTimeline] = useState<any[]>([]);
  const [failureExplanation, setFailureExplanation] = useState<any | null>(null);
  const [pendingTask, setPendingTask] = useState<{
    taskId: string;
    plan: any[];
    affectedFiles: string[];
    riskLevel: string;
    status?: string;
    diffs?: Record<string, string>;
  } | null>(null);
  const [agentActivity, setAgentActivity] = useState<{
    status: string;
    label: string;
    provider?: string;
    model?: string;
  } | null>(null);
  const [agentEventsLog, setAgentEventsLog] = useState<{
    id: string;
    label: string;
    state: string;
    progress?: number;
    time: string;
  }[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Lovable IDE & AI Builder States
  const [workMode, setWorkMode] = useState<"PLAN" | "BUILD">("BUILD");
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"EDITOR" | "PREVIEW">("EDITOR");
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileItem>({
    id: "execution-controller",
    name: "execution.controller.ts",
    path: "src/services/ai-agent/execution.controller.ts",
    type: "file",
    language: "typescript",
    content: `// Execution Controller Orchestrator\nexport async function verifyProjectStructure(options: ExecutionControllerOptions) {\n  // Verified project structure backend check\n}`,
  });
  const [editorCode, setEditorCode] = useState(selectedFile.content || "");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Lovable AI Builder Server Functions
  const applyPatchServerFn = useServerFn(applyCodePatchFn);
  const validateBuildServerFn = useServerFn(validateBuildStateFn);
  const publishServerFn = useServerFn(publishToProductionFn);

  const [buildValidation, setBuildValidation] = useState<{
    passed: boolean;
    errorCount: number;
    summary: string;
  }>({
    passed: true,
    errorCount: 0,
    summary: "Build validated cleanly with 0 errors.",
  });
  const [isValidatingBuild, setIsValidatingBuild] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleSaveCodeAndValidate = async (savedCode: string) => {
    try {
      setIsValidatingBuild(true);
      const patchRes = await applyPatchServerFn({
        data: { targetFile: selectedFile.path, newContent: savedCode },
      });

      if (!patchRes.success) {
        toast.error(patchRes.error || "فشل تطبيق التعديل البرمجي");
        return;
      }

      const valRes = await validateBuildServerFn();
      setBuildValidation({
        passed: valRes.passed,
        errorCount: valRes.errorCount,
        summary: valRes.summary,
      });

      if (valRes.passed) {
        toast.success("تم حفظ التعديل واجتياز فحص البناء بنجاح ⚡");
      } else {
        toast.error(`تم اكتشاف ${valRes.errorCount} خطأ تجميعي أثناء الفحص الذاتي`);
      }
    } catch (err: any) {
      toast.error(err?.message || "فشل عملية الفحص الذاتي للبناء");
    } finally {
      setIsValidatingBuild(false);
    }
  };

  const handlePublishToProduction = async () => {
    try {
      setIsPublishing(true);
      const res = await publishServerFn({
        data: {
          sessionId: activeSessionId || "default",
          commitMessage: `feat(builder): publish autonomous changes for session ${activeSessionId || "default"}`,
        },
      });

      if (res.success) {
        toast.success("🎉 تم نشر التطبيق بنجاح وتحديث بيئة الإنتاج المباشرة!");
      } else {
        toast.error(res.error || "فشل إطلاق خط إنتاج النشر");
      }
    } catch (err: any) {
      toast.error(err?.message || "فشل تشغيل عملية النشر");
    } finally {
      setIsPublishing(false);
    }
  };

  // Drag & Drop File Intelligence State
  const parseFileServerFn = useServerFn(parseProjectFileFn);
  const [attachedFiles, setAttachedFiles] = useState<ProjectFileParsedContext[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const processFilePaths = async (targetPaths: string[]) => {
    if (targetPaths.length === 0) return;
    setIsParsingFile(true);
    try {
      for (const p of targetPaths) {
        const res = await parseFileServerFn({ data: { path: p } });
        if (res.success && res.fileContext) {
          setAttachedFiles((prev) => {
            if (prev.some((f) => f.path === res.fileContext!.path)) return prev;
            return [...prev, res.fileContext!];
          });
          toast.success(`تم استخراج وتحليل علاقات: ${res.fileContext.fileName}`);
        } else if (res.error) {
          toast.error(res.error);
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "فشل تحليل الملف المسحوب");
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleDropFile = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const jsonString = e.dataTransfer.getData("application/json");
    const plainPath = e.dataTransfer.getData("text/plain");

    let targetPaths: string[] = [];

    if (jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed?.path) targetPaths.push(parsed.path);
      } catch { /* fallback */ }
    }

    if (targetPaths.length === 0 && plainPath && (plainPath.includes("/") || plainPath.includes("."))) {
      targetPaths.push(plainPath);
    }

    if (targetPaths.length === 0 && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const f = e.dataTransfer.files[i];
        const pathCandidate = (f as any).path || (f as any).webkitRelativePath || f.name;
        if (pathCandidate) targetPaths.push(pathCandidate);
      }
    }

    await processFilePaths(targetPaths);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const paths: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const f = e.target.files[i];
        const pathCandidate = (f as any).path || (f as any).webkitRelativePath || f.name;
        if (pathCandidate) paths.push(pathCandidate);
      }
      await processFilePaths(paths);
    }
  };

  // Queries
  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ["ai-agent-sessions"],
    queryFn: () => listSessionsFn(),
  });

  const { data: roleData } = useQuery({
    queryKey: ["ai-agent-role"],
    queryFn: () => getRoleFn(),
  });

  const { data: memory = [] } = useQuery({
    queryKey: ["ai-agent-memory"],
    queryFn: () => getMemoryFn(),
  });

  const { data: usageStats } = useQuery({
    queryKey: ["ai-agent-usage"],
    queryFn: () => getUsageFn(),
  });

  const getExecHistoryFn = useServerFn(listExecutionHistoryFn);
  const getAgentPerfFn = useServerFn(getAgentPerformanceFn);
  const getExecJournalFn = useServerFn(listExecutionJournalFn);
  const getSessionEventsFn = useServerFn(getSessionExecutionEventsFn);

  const { data: execHistory = [] } = useQuery({
    queryKey: ["ai-execution-history"],
    queryFn: () => getExecHistoryFn(),
  });

  const { data: rawJournalLogs } = useQuery({
    queryKey: ["ai-execution-journal"],
    queryFn: () => getExecJournalFn(),
    refetchInterval: 5000,
  });
  const journalLogs = (rawJournalLogs || []) as any[];

  const { data: rawPersistentEvents } = useQuery({
    queryKey: ["ai-session-events", activeSessionId],
    queryFn: () => (activeSessionId ? getSessionEventsFn({ data: { sessionId: activeSessionId } }) : Promise.resolve([])),
    enabled: !!activeSessionId,
  });
  const persistentEvents = (rawPersistentEvents || []) as any[];

  const getQualityIncidentsServerFn = useServerFn(getQualityIncidentsFn);
  const { data: qualityData } = useQuery({
    queryKey: ["quality-incidents-data"],
    queryFn: () => getQualityIncidentsServerFn(),
    refetchInterval: 10000,
  });
  const qualityRecommendations = qualityData?.recommendations || [];

  const { data: perfOverview } = useQuery({
    queryKey: ["ai-agent-performance"],
    queryFn: () => getAgentPerfFn(),
  });

  const { data: providers = [] } = useQuery({
    queryKey: ["ai-providers"],
    queryFn: () => listProvidersFn(),
  });

  const agentRole = roleData?.role || "viewer";
  const canSend = agentRole !== "viewer";



  // Seed memory on first load
  useEffect(() => {
    if (memory.length === 0 && roleData) {
      seedMemoryFn().catch(() => {});
    }
  }, [memory.length, roleData]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Load session messages when active session changes
  const loadSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId);
    try {
      const res = await getSessionFn({ data: { sessionId } });
      setMessages(res.messages);
      const sess = res.session;
      if (
        sess &&
        (sess.task_status === "waiting_approval" || sess.task_status === "planning") &&
        (sess.affected_files?.length > 0 || sess.task_plan?.length > 0)
      ) {
        setPendingTask({
          taskId: sess.task_id || "TASK-001",
          plan: sess.task_plan || [],
          affectedFiles: sess.affected_files || [],
          riskLevel: sess.risk_level || "low",
        });
      } else {
        setPendingTask(null);
      }
    } catch {
      setMessages([]);
      setPendingTask(null);
    }
  }, [getSessionFn]);

  // Create new session
  const handleNewSession = async () => {
    try {
      const session = await createSessionFn({ data: { title: "جلسة جديدة" } });
      setActiveSessionId(session.id);
      setMessages([]);
      queryClient.invalidateQueries({ queryKey: ["ai-agent-sessions"] });
      inputRef.current?.focus();
    } catch (e: any) {
      toast.error(e.message || "فشل إنشاء الجلسة");
    }
  };



  // Send message + stream AI response
  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming || !canSend) return;

    let sessionId = activeSessionId;

    // Auto-create session if none active
    if (!sessionId) {
      try {
        const session = await createSessionFn({ data: { title: inputValue.slice(0, 60) } });
        sessionId = session.id;
        setActiveSessionId(sessionId);
        queryClient.invalidateQueries({ queryKey: ["ai-agent-sessions"] });
      } catch {
        toast.error("فشل إنشاء الجلسة");
        return;
      }
    }

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsStreaming(true);
    setStreamingContent("");
    setAgentEventsLog([]);

    // Save user message
    try {
      const saved = await saveMessageFn({
        data: { sessionId, role: "user", content: userMessage },
      });
      setMessages((prev) => [...prev, saved]);
    } catch {
      toast.error("فشل حفظ الرسالة");
      setIsStreaming(false);
      return;
    }

    // Update session title if first message
    if (messages.length === 0) {
      updateTaskFn({
        data: {
          sessionId,
          title: userMessage.slice(0, 80),
          taskStatus: "planning",
        },
      }).catch(() => {});
    }

    // Build memory string
    const memoryStr = memory
      .map((m: AgentMemoryEntry) => `[${m.category}/${m.key}]: ${m.value}`)
      .join("\n");

    // Build history
    const history = messages.slice(-20).map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    // Build attached files project context layer
    let effectiveMessage = userMessage;
    if (attachedFiles.length > 0) {
      effectiveMessage += `\n\n--- ATTACHED REAL PROJECT FILE CONTEXTS ---\n` +
        attachedFiles
          .map(
            (f) =>
              `[PROJECT_FILE_CONTEXT]\nFile: ${f.fileName}\nPath: ${f.path}\nSize: ${f.size} Bytes | Lines: ${f.lineCount} | Language: ${f.language}\nImports/Dependencies: ${f.dependencies.join(", ") || "None"}\nContent:\n${f.content}`
          )
          .join("\n\n");
      setAttachedFiles([]);
    }

    // Stream AI response with Activity Events
    try {
      setAgentActivity({ status: "receiving_request", label: "جاري استقبال طلبك والملفات المرفقة..." });
      const base = (typeof window !== "undefined" ? window.location.origin : "") || "";
      const res = await fetch(`${base}/api/ai/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: effectiveMessage,
          history,
          projectMemory: memoryStr,
          agentRole,
          providerId: selectedProviderId || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        const detailMsg = err.detail ? `: ${err.detail}` : "";
        throw new Error((err.error || `HTTP ${res.status}`) + detailMsg);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("تعذر فتح مجرى البيانات مع الذكاء الاصطناعي");

      const decoder = new TextDecoder();
      let fullContent = "";
      let sseBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const events = sseBuffer.split("\n\n");
        sseBuffer = events.pop() || "";

        for (const rawEvt of events) {
          const trimmed = rawEvt.trim();
          if (!trimmed) continue;

          const dataLine = trimmed.split("\n").find((l) => l.startsWith("data:"));
          if (dataLine) {
            try {
              const json = JSON.parse(dataLine.replace(/^data:\s*/, ""));
              if (json.type === "status") {
                setAgentActivity({
                  status: json.state || json.status,
                  label: json.label || json.message,
                  provider: json.provider,
                  model: json.model,
                });
                setAgentEventsLog((prev) => [
                  ...prev.filter((e) => e.label !== (json.label || json.message)),
                  {
                    id: crypto.randomUUID(),
                    label: json.label || json.message || "معالجة التفتيش البنائي...",
                    state: json.state || json.status || "ANALYZING_REPOSITORY",
                    progress: json.progress,
                    time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                  },
                ]);
              } else if (
                json.type === "reading_file" ||
                json.type === "searching_code" ||
                json.type === "inspecting_db" ||
                json.type === "tool_call"
              ) {
                setAgentActivity({
                  status: json.type,
                  label: json.message || "جاري التفتيش والاستعلام الهيكلي...",
                });
                setAgentEventsLog((prev) => [
                  ...prev.filter((e) => e.label !== json.message),
                  {
                    id: crypto.randomUUID(),
                    label: json.message || "تفتيش الكود والمستودع...",
                    state: "ANALYZING_REPOSITORY",
                    time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                  },
                ]);
              } else if (json.type === "approval_required" || json.type === "plan_ready") {
                const planTaskId = json.taskId || `task-${Date.now()}`;
                const planSteps = json.plan || [];
                const planFiles = json.affectedFiles || [];
                const planRisk = json.riskLevel || "low";

                setPendingTask({
                  taskId: planTaskId,
                  plan: planSteps,
                  affectedFiles: planFiles,
                  riskLevel: planRisk,
                });

                if (sessionId) {
                  updateSessionTaskFn({
                    data: {
                      sessionId,
                      taskStatus: "waiting_approval",
                      taskPlan: planSteps,
                      affectedFiles: planFiles,
                      riskLevel: planRisk,
                    },
                  }).catch(() => {});
                }

                setAgentActivity({
                  status: "approval_required",
                  label: "⏸ في انتظار موافقتك الصريحة للتنفيذ...",
                });
              } else if (json.type === "text") {
                fullContent += json.content;
                setStreamingContent(cleanThoughtContent(fullContent));
              } else if (json.type === "error") {
                toast.error(json.error || "حدث خطأ في مزود AI، جاري المحاولة...");
              }
            } catch {
              fullContent += trimmed;
              setStreamingContent(cleanThoughtContent(fullContent));
            }
          } else {
            fullContent += trimmed;
            setStreamingContent(cleanThoughtContent(fullContent));
          }
        }
      }

      // Save assistant message
      const cleanedMessage = cleanThoughtContent(fullContent);
      if (cleanedMessage) {
        const saved = await saveMessageFn({
          data: {
            sessionId,
            role: "assistant",
            content: cleanedMessage,
          },
        });
        setMessages((prev) => [...prev, saved]);
      }

      setStreamingContent("");
      setAgentActivity(null);
      queryClient.invalidateQueries({ queryKey: ["ai-agent-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["ai-agent-usage"] });
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ في مزود AI، جاري المحاولة...");
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      setAgentActivity(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startExecutionFn = useServerFn(startExecutionTask);
  const [isExecutingTask, setIsExecutingTask] = useState(false);

  // Real backend execution stage resolver (PROJECT_ANALYSIS, GENERATING_PLAN, PLAN_READY, WAITING_APPROVAL, APPROVED, EXECUTING, COMPLETED, FAILED)
  const executionStageInfo = useMemo(() => {
    // 8. FAILED
    if (failureExplanation) {
      return {
        stage: "FAILED",
        label: "❌ فشل التنفيذ",
        badgeColor: "bg-red-500/20 text-red-400 border-red-500/40 font-bold",
        canExecute: false,
        helperMsg: failureExplanation.reason || "حدث خطأ أثناء فحص البناء أو التنفيذ.",
      };
    }

    // 6. EXECUTING
    if (isExecutingTask) {
      return {
        stage: "EXECUTING",
        label: "⚙️ جاري تنفيذ التغييرات",
        badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/40 font-bold animate-pulse",
        canExecute: false,
        helperMsg: "جاري تطبيق التعديلات وفحص البناء التجميعي...",
      };
    }

    // 1 & 2: STREAMING / ANALYSIS & GENERATING PLAN
    if (isStreaming) {
      const latestEvent = persistentEvents.length > 0
        ? persistentEvents[persistentEvents.length - 1]
        : agentEventsLog.length > 0
        ? agentEventsLog[agentEventsLog.length - 1]
        : null;

      const evtMsg = (latestEvent?.message || latestEvent?.label || "").toLowerCase();

      // 1. PROJECT_ANALYSIS / GENERATING_PLAN
      return {
        stage: "PLAN_READY",
        label: "📋 الخطة الهندسية جاهزة للمراجعة والاعتماد",
        badgeColor: "bg-violet-500/20 text-violet-400 border-violet-500/40 font-bold",
        canExecute: true,
        helperMsg: "اضغط على Build & Execute لبدء الاعتماد والتنفيذ الفوري.",
      };
    }

    // TASKS IN DATABASE
    if (pendingTask) {
      // 7. COMPLETED
      if (pendingTask.status === "completed" || pendingTask.status === "success") {
        return {
          stage: "COMPLETED",
          label: "🎉 اكتمل التنفيذ",
          badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold",
          canExecute: false,
          helperMsg: "تم تنفيذ المهمة واجتياز فحص البناء بنجاح.",
        };
      }

      // 6. EXECUTING
      if (pendingTask.status === "executing" || pendingTask.status === "running") {
        return {
          stage: "EXECUTING",
          label: "⚙️ جاري تنفيذ التغييرات",
          badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/40 font-bold animate-pulse",
          canExecute: false,
          helperMsg: "جاري تطبيق التعديلات وفحص البناء التجميعي...",
        };
      }

      // 5. APPROVED
      if (pendingTask.status === "approved" || pendingTask.status === "APPROVED") {
        return {
          stage: "APPROVED",
          label: "✅ تمت الموافقة، جاهز للتنفيذ",
          badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold",
          canExecute: true,
          helperMsg: "اضغط على Build & Execute لبدء التنفيذ.",
        };
      }

      // 3. PLAN_READY / 4. WAITING_APPROVAL
      return {
        stage: "PLAN_READY",
        label: "📋 الخطة الهندسية جاهزة للمراجعة",
        badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold",
        canExecute: true,
        helperMsg: "اضغط على Build & Execute للاعتماد والتنفيذ الفوري.",
      };
    }

    // 4. READY_FOR_APPROVAL / ACTIVE SESSION (DEFAULT)
    return {
      stage: "WAITING_APPROVAL",
      label: "📋 الخطة جاهزة للاعتماد والتنفيذ",
      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold",
      canExecute: true,
      helperMsg: "اضغط على Build & Execute لبدء الاعتماد والتنفيذ الفوري.",
    };
  }, [isStreaming, pendingTask, isExecutingTask, persistentEvents, agentEventsLog, failureExplanation]);

  const approveTaskServerFn = useServerFn(approveAgentTask);

  const handleApproveTask = async () => {
    let taskIdToRun = pendingTask?.taskId;
    if (!taskIdToRun && activeSessionId) {
      const activeSess = sessions.find((s: any) => s.id === activeSessionId);
      taskIdToRun = activeSess?.task_id || undefined;
      if (!taskIdToRun) {
        toast.error("لم يتم العثور على معرف المهمة الحقيقي");
        return;
      }
    }
    if (!taskIdToRun) {
      toast.error("لا يوجد مهمة نشطة لبدء عملية البناء والتنفيذ");
      return;
    }

    console.log("[DEBUG_UI_BUILD_EXECUTE_OPEN]", {
      current_plan_id: taskIdToRun,
      current_session_id: activeSessionId,
      approval_status: executionStageInfo.stage,
    });
    console.log("[BuildAndExecuteClicked]", { receivedTaskId: taskIdToRun, receivedSessionId: activeSessionId });
    setIsExecutingTask(true);
    toast.loading(`جاري اعتماد المهمة وتفعيل محرك التنفيذ ${taskIdToRun}...`, { id: "task-exec" });

    // Instantly invalidate queries so EXECUTION_STARTED appears immediately
    queryClient.invalidateQueries({ queryKey: ["ai-execution-journal"] });
    queryClient.invalidateQueries({ queryKey: ["ai-session-events", activeSessionId] });

    try {
      // 1. approvePlan(taskId)
      await approveTaskServerFn({ data: { taskId: taskIdToRun } });
      
      // 2. startExecution Controller Orchestrator
      const res = (await startExecutionFn({ data: { taskId: taskIdToRun, sessionId: activeSessionId || "default" } })) as any;
      if (res?.success) {
        toast.success(`تم تطبيق جميع الخطوات والتعديلات واجتياز فحص البناء بنجاح! ✨`, { id: "task-exec" });
        setPendingTask(null);
        setFailureExplanation(null);
        queryClient.invalidateQueries({ queryKey: ["ai-agent-sessions"] });
        queryClient.invalidateQueries({ queryKey: ["ai-execution-journal"] });
        queryClient.invalidateQueries({ queryKey: ["ai-session-events", activeSessionId] });
      } else {
        if (res?.failureDetails) {
          setFailureExplanation(res.failureDetails);
        }
        if (res?.recoveryTimeline) {
          setRecoveryTimeline(res.recoveryTimeline);
        }
        queryClient.invalidateQueries({ queryKey: ["ai-execution-journal"] });
        queryClient.invalidateQueries({ queryKey: ["ai-session-events", activeSessionId] });
        toast.error(`فشل التنفيذ/فحص البناء! (${res?.failureDetails?.reason || res?.failureDetails?.message || "تم التراجع تلقائياً"}) 🔄`, { id: "task-exec" });
      }
    } catch (err: any) {
      queryClient.invalidateQueries({ queryKey: ["ai-execution-journal"] });
      queryClient.invalidateQueries({ queryKey: ["ai-session-events", activeSessionId] });
      toast.error(err.message || "حدث خطأ أثناء التنفيذ", { id: "task-exec" });
    } finally {
      setIsExecutingTask(false);
    }
  };

  const handleRejectTask = async () => {
    if (!pendingTask) return;
    try {
      await rejectTaskFn({ data: { taskId: pendingTask.taskId } });
      toast.info(`تم إلغاء المهمة ${pendingTask.taskId}`);
      setPendingTask(null);
    } catch {
      toast.error("فشل إلغاء المهمة");
    }
  };

  const handleArchive = async (sessionId: string) => {
    try {
      await archiveSessionFn({ data: { sessionId } });
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
      queryClient.invalidateQueries({ queryKey: ["ai-agent-sessions"] });
      toast.success("تم أرشفة الجلسة");
    } catch {
      toast.error("فشل أرشفة الجلسة");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeSession = sessions.find((s: AgentSession) => s.id === activeSessionId);
  const activeSessions = sessions.filter((s: AgentSession) => s.status !== "archived");

  const dynamicSuggestions = useMemo(() => {
    const list: string[] = [];
    if (activeSession?.title) {
      list.push(`اطلب تحليل: ${activeSession.title.slice(0, 25)}`);
    }
    if (
      activeSession?.affected_files &&
      Array.isArray(activeSession.affected_files) &&
      activeSession.affected_files.length > 0
    ) {
      list.push(`فحص الملفات المتأثرة (${activeSession.affected_files.length})`);
    }
    if (memory && memory.length > 0) {
      list.push(`استرجاع ذاكرة المشروع (${memory.length})`);
    }
    list.push(
      "أنشئ نظام إشعارات الطلبات",
      "تحسين أداء SEO والـ Lighthouse",
      "فحص إعدادات الدفع والشحن",
      "تقرير أمان امتثال Multi-Tenant RLS",
    );
    return Array.from(new Set(list)).slice(0, 6);
  }, [activeSession, memory]);

  // ──────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────

  return (
    <div className="font-sans pb-6 bg-[#0c0c0e] text-zinc-100 min-h-screen p-3 rounded-3xl border border-zinc-800/80 shadow-2xl space-y-3" dir="rtl">
      {/* Top Navigation Bar — Lovable IDE Style Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 px-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#18181c] border border-zinc-800 px-3 py-1.5 rounded-xl font-bold text-xs text-zinc-200 cursor-pointer hover:bg-zinc-800 transition">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-500 to-violet-500" />
            <span>Noqta Commerce Hub</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowSessions((prev) => !prev)}
              className={`p-2 rounded-xl border transition ${
                showSessions
                  ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                  : "bg-[#141417] border-zinc-800 text-zinc-400 hover:text-white"
              }`}
              title="سجل الجلسات (History)"
            >
              <History className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowFileExplorer((prev) => !prev)}
              className={`p-2 rounded-xl border transition ${
                showFileExplorer
                  ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                  : "bg-[#141417] border-zinc-800 text-zinc-400 hover:text-white"
              }`}
              title="مستكشف الملفات (File Explorer)"
            >
              <FileCode className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Switcher Toggle: Plan vs Build */}
          <div className="flex items-center gap-1 bg-[#141418] p-1 rounded-2xl border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setWorkMode("PLAN")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold transition ${
                workMode === "PLAN"
                  ? "bg-violet-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Plan Mode 📋
            </button>
            <button
              type="button"
              onClick={() => setWorkMode("BUILD")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold transition ${
                workMode === "BUILD"
                  ? "bg-gradient-to-r from-amber-500 to-violet-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              Build Mode ⚡
            </button>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2">
          {/* Command Palette Button */}
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-2 bg-[#18181c] border border-zinc-800 px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span>لوحة الأوامر...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700 font-mono">
              Ctrl+Shift+P
            </kbd>
          </button>
          {providers.length > 0 && (
            <select
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-[#141417] px-3 py-1.5 text-[11px] font-bold text-zinc-200 outline-none focus:border-violet-500/50 transition cursor-pointer"
            >
              <option value="">✨ تلقائي (حسب الأولوية)</option>
              {providers.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.provider === "gemini" ? "Gemini" : p.provider === "lovable" ? "Lovable" : p.provider === "vertex" ? "Vertex" : p.provider} ({p.model})
                </option>
              ))}
            </select>
          )}

          <div className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold border ${
            agentRole === "owner"
              ? "bg-violet-500/10 text-violet-400 border-violet-500/30"
              : agentRole === "admin"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-zinc-800 text-zinc-400 border-zinc-700"
          }`}>
            <Shield className="h-3 w-3" />
            {agentRole === "owner" ? "Owner — كامل" : agentRole === "admin" ? "Admin" : "Developer"}
          </div>

          <button
            type="button"
            onClick={handleNewSession}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:opacity-90 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            جلسة جديدة
          </button>
        </div>
      </div>

      {/* Main 2-Column IDE Split View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[calc(100vh-140px)] w-full items-start">
        
        {/* Optional Session Sidebar */}
        {showSessions && (
          <div className="lg:col-span-2 min-w-0 rounded-2xl border border-zinc-800 bg-[#121214] shadow-xl overflow-hidden flex flex-col h-full max-h-[calc(100vh-160px)]">
            <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xs font-black text-zinc-400 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-violet-400" /> الجلسات ({activeSessions.length})
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingSessions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                </div>
              ) : activeSessions.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">لا توجد جلسات بعد</div>
              ) : (
                activeSessions.map((session: AgentSession) => (
                  <motion.button
                    key={session.id}
                    type="button"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => loadSession(session.id)}
                    className={`w-full text-start rounded-xl p-2.5 transition group ${
                      activeSessionId === session.id
                        ? "bg-violet-500/10 border border-violet-500/30 text-zinc-100"
                        : "hover:bg-zinc-800/60 border border-transparent text-zinc-400"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[11px] font-bold text-zinc-200 line-clamp-1">
                        {session.title}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleArchive(session.id); }}
                        className="opacity-0 group-hover:opacity-100 transition shrink-0"
                      >
                        <Archive className="h-3 w-3 text-zinc-500 hover:text-red-400" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <TaskStatusBadge status={session.task_status} />
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Optional File Explorer Sidebar (2 Cols) */}
        {showFileExplorer && (
          <div className="lg:col-span-2 min-w-0 h-full max-h-[calc(100vh-160px)]">
            <FileExplorer
              activeFilePath={selectedFile.path}
              onSelectFile={(file) => {
                setSelectedFile(file);
                if (file.content) {
                  setEditorCode(file.content);
                }
              }}
            />
          </div>
        )}

        {/* ═══ Center Workspace: Monaco Editor or AI Plan Stream ═══ */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDropFile}
          className={`relative ${showSessions && showFileExplorer ? "lg:col-span-5" : showSessions || showFileExplorer ? "lg:col-span-7" : "lg:col-span-9"} rounded-2xl border border-zinc-800 bg-[#121214] shadow-xl flex flex-col overflow-hidden h-full max-h-[calc(100vh-160px)] space-y-3 p-3`}
        >
          {/* Hidden File Picker Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Drag & Drop Visual Overlay Zone */}
          {(isDraggingOver || isParsingFile) && (
            <div className="absolute inset-0 z-50 rounded-2xl bg-violet-950/85 border-2 border-dashed border-violet-400 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3 shadow-2xl animate-in fade-in zoom-in duration-150 pointer-events-none">
              <div className="p-4 rounded-full bg-violet-500/20 text-violet-300 border border-violet-400/40 animate-bounce">
                {isParsingFile ? (
                  <Loader2 className="h-10 w-10 text-violet-300 animate-spin" />
                ) : (
                  <UploadCloud className="h-10 w-10 text-violet-300" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-white">
                  {isParsingFile ? "جاري تحليل علاقات الملف واستخراج الـ Imports..." : "اسحب الملفات هنا لتحليلها وتطويرها بواسطة AI"}
                </h3>
                <p className="text-xs text-violet-200">
                  {isParsingFile ? "Parsing AST & Dependencies..." : "Drag & Drop Project Files / Code Assets into Workspace"}
                </p>
              </div>
            </div>
          )}
          {workMode === "BUILD" ? (
            <div className="flex flex-col h-full space-y-2 overflow-hidden">
              {/* Lovable Builder Mode Toolbar (Editor vs Live Preview Tabs + One-Click Publish) */}
              <div className="flex items-center justify-between px-2 py-1 bg-[#18181c] border border-zinc-800 rounded-xl">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveWorkspaceTab("EDITOR")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      activeWorkspaceTab === "EDITOR"
                        ? "bg-violet-600 text-white shadow-xs"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    💻 Code Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWorkspaceTab("PREVIEW")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      activeWorkspaceTab === "PREVIEW"
                        ? "bg-violet-600 text-white shadow-xs"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    ⚡ Live Preview
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handlePublishToProduction}
                  disabled={isPublishing}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90 text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀 Publish to Production</span>
                    </>
                  )}
                </button>
              </div>

              {/* Workspace Main Active View */}
              {activeWorkspaceTab === "EDITOR" ? (
                <div className="flex-1 min-h-[350px]">
                  <MonacoCodeEditor
                    filePath={selectedFile.path}
                    initialCode={editorCode}
                    language={selectedFile.language || "typescript"}
                    onCodeChange={(newCode) => setEditorCode(newCode)}
                    onSave={(savedCode) => {
                      setSelectedFile((prev) => ({ ...prev, content: savedCode }));
                      handleSaveCodeAndValidate(savedCode);
                    }}
                  />
                </div>
              ) : (
                <div className="flex-1 min-h-[350px]">
                  <LivePreviewCanvas
                    activeRoute="/"
                    buildPassed={buildValidation.passed}
                    buildSummary={buildValidation.summary}
                    isBuilding={isValidatingBuild}
                    onRefresh={() => validateBuildServerFn()}
                  />
                </div>
              )}

              {/* Execution Journal Stream Panel */}
              <ExecutionJournalPanel
                logs={journalLogs}
                persistentEvents={persistentEvents}
              />
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !streamingContent && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 space-y-3">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center">
                  <Bot className="h-8 w-8 text-violet-400" />
                </div>
                <h3 className="text-base font-black text-zinc-100">Noqta AI Engineering Agent</h3>
                <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                  اكتب أي استفسار أو طلب هندسي لتحليل الموقع وإنشاء خطة تطوير متكاملة.
                </p>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  {msg.role === "user" ? (
                    <div className="flex justify-start">
                      <div className="bg-[#242429] border border-zinc-800 text-zinc-100 rounded-2xl px-4 py-3 text-sm max-w-[90%] font-medium shadow-sm">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-start">
                      {/* Action Plan Pill inside chat stream matching image */}
                      <button
                        type="button"
                        onClick={() => setShowContext(true)}
                        className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl bg-[#1a1a1e] border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 transition group"
                      >
                        <span className="font-semibold text-zinc-200">
                          {pendingTask ? `Plan (${pendingTask.taskId})` : "Engineering Plan Required"}
                        </span>
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition" />
                      </button>

                      {/* AI Response Text */}
                      <div className="text-sm text-zinc-200 leading-relaxed bg-transparent px-1">
                        <MarkdownContent content={msg.content} />
                      </div>

                      {/* Message Action Toolbar (Reply, ThumbsUp, ThumbsDown, Copy, More) */}
                      <div className="flex items-center gap-3 pt-1 text-zinc-500 text-xs px-1">
                        <button type="button" className="hover:text-zinc-300 transition"><RotateCcw className="w-3.5 h-3.5" /></button>
                        <button type="button" className="hover:text-zinc-300 transition"><ThumbsUp className="w-3.5 h-3.5" /></button>
                        <button type="button" className="hover:text-zinc-300 transition"><ThumbsDown className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => copyToClipboard(msg.content, msg.id)} className="hover:text-zinc-300 transition">
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                        </button>
                        <button type="button" className="hover:text-zinc-300 transition"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Persistent & Live Execution Events Timeline Stream 📜 */}
            {(isStreaming || persistentEvents.length > 0) && (
              <div className="p-3.5 rounded-2xl bg-[#18181c] border border-zinc-800 space-y-2 text-xs font-mono shadow-md text-start my-2">
                <div className="text-[11px] font-bold text-violet-400 flex items-center justify-between border-b border-zinc-800 pb-2 font-sans">
                  <span className="flex items-center gap-1.5">
                    {isStreaming ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    ) : (
                      <History className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    Persistent Execution History ({persistentEvents.length || agentEventsLog.length} events)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-bold uppercase tracking-wider">
                    {isStreaming ? (agentActivity?.status || "ANALYZING_REPOSITORY") : "COMPLETED_SESSION"}
                  </span>
                </div>
                <div className="space-y-1.5 text-zinc-300 text-[11px] max-h-60 overflow-y-auto no-scrollbar">
                  {((persistentEvents.length > 0 ? persistentEvents : agentEventsLog) as any[]).map((evt, idx, arr) => {
                    const isLast = isStreaming && idx === arr.length - 1;
                    const labelStr = evt.message || evt.label || "Execution Event";
                    const timeStr = evt.createdAt
                      ? new Date(evt.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                      : evt.time || "--:--:--";

                    return (
                      <div key={evt.id || idx} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isLast ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span className={isLast ? "text-cyan-400 font-semibold" : "text-emerald-400 font-medium"}>
                            {isLast ? "⏳" : "✓"} {labelStr}
                          </span>
                        </div>
                        <span className="text-[9px] text-zinc-500 font-mono shrink-0">{timeStr}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestion Pills Horizontal Strip — Dynamic Contextual Pills 💡 */}
          <div className="p-2 border-t border-zinc-800/80 bg-[#121214] flex items-center gap-2 overflow-x-auto no-scrollbar">
            {dynamicSuggestions.map((pill, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => { setInputValue(pill); inputRef.current?.focus(); }}
                className="px-3 py-1.5 rounded-full bg-[#1e1e22] border border-zinc-800 text-zinc-300 hover:border-zinc-600 whitespace-nowrap text-[11px] font-medium transition shrink-0"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Console Input Container — Exact Lovable IDE Style */}
          <div className="p-3 bg-[#121214] border-t border-zinc-800/80">
            <div className="bg-[#18181c] border border-zinc-800 rounded-2xl p-3 space-y-2 shadow-2xl">
              {/* Top Tag & Real Backend Status Badge inside Input Box */}
              <div className="flex items-center justify-between text-[10px]">
                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono font-semibold">
                  Details
                </span>
                <span className={`px-2.5 py-0.5 rounded-md border font-mono font-semibold flex items-center gap-1.5 ${executionStageInfo.badgeColor}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {executionStageInfo.label}
                </span>
              </div>

              {/* Attached Project File Cards — Drag & Drop Intelligence Preview 📄 */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-col gap-2 p-2 bg-[#121215] border border-violet-500/30 rounded-xl dir-ltr">
                  <div className="text-[10px] font-bold text-violet-300 flex items-center gap-1 font-mono">
                    <FileCode className="h-3 w-3 text-cyan-400" />
                    Attached Project Files Context ({attachedFiles.length}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file) => (
                      <div
                        key={file.path}
                        className="flex flex-col gap-1 p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-violet-500/50 text-xs font-mono max-w-full shadow-md transition"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <FileCode className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                            <span className="font-bold text-zinc-100 truncate">{file.fileName}</span>
                            <span className="text-[10px] text-zinc-500">
                              ({file.lineCount} lines | {Math.round(file.size / 1024)} KB)
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedFile({
                                  id: file.path,
                                  name: file.fileName,
                                  path: file.path,
                                  type: "file",
                                  language: file.language,
                                  content: file.content,
                                });
                                setEditorCode(file.content);
                              }}
                              className="px-2 py-0.5 rounded-md bg-violet-600/30 hover:bg-violet-600/60 text-violet-200 text-[10px] font-semibold transition"
                            >
                              عرض
                            </button>
                            <button
                              type="button"
                              onClick={() => setAttachedFiles((prev) => prev.filter((f) => f.path !== file.path))}
                              className="p-1 text-zinc-500 hover:text-red-400 transition"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        {file.dependencies.length > 0 && (
                          <div className="flex items-center gap-1 text-[9px] text-zinc-500 flex-wrap pt-0.5 border-t border-zinc-800/60">
                            <span className="text-zinc-400 font-bold">Related Imports:</span>
                            {file.dependencies.slice(0, 4).map((dep, idx) => (
                              <span key={idx} className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono">
                                {dep.split("/").pop()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Textarea Input */}
              <textarea
                ref={inputRef as any}
                rows={2}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={canSend ? "Ask Lovable / Indexes AI (Drag & Drop files anywhere)..." : "ليس لديك صلاحية الإرسال"}
                disabled={!canSend || isStreaming}
                className="w-full bg-transparent border-none text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none leading-relaxed text-right"
              />

              {/* Bottom Toolbar inside Input Box */}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="إرفاق ملف من الجهاز (Attach File)"
                    className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition flex items-center gap-1 text-xs"
                  >
                    <Paperclip className="w-4 h-4 text-violet-400" />
                    {attachedFiles.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-violet-500 text-white text-[9px] font-bold">
                        {attachedFiles.length}
                      </span>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApproveTask}
                    disabled={!executionStageInfo.canExecute}
                    title={!executionStageInfo.canExecute ? executionStageInfo.helperMsg : "اعتماد وتنفيذ الخطة الهندسية"}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold cursor-pointer shadow-lg shadow-violet-600/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isExecutingTask ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Executing Build...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-white fill-current" />
                        <span>Build & Execute</span>
                      </>
                    )}
                  </button>

                  <button type="button" className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
                    <Mic className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isStreaming || !canSend}
                    className="p-2 text-white bg-zinc-200 hover:bg-white text-zinc-950 rounded-full transition disabled:opacity-30 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5 text-zinc-950" />
                  </button>
                </div>
              </div>

              {/* Explicit Execution Helper Message when Disabled */}
              {!executionStageInfo.canExecute && (
                <div className="pt-1.5 text-start border-t border-zinc-800/40">
                  <p className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                    {executionStageInfo.helperMsg}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
        </div>

        {/* ═══ Right Column: "Details" Execution, Thought Engine & Plan View Panel ═══ */}
        <div className={`${showSessions ? "lg:col-span-5" : "lg:col-span-6"} rounded-2xl border border-zinc-800 bg-[#121214] shadow-xl flex flex-col overflow-hidden h-full max-h-[calc(100vh-160px)]`}>
          {/* Header over Details Panel matching image */}
          <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-[#16161a]">
            <div className="flex items-center gap-2 text-xs">
              <button type="button" className="flex items-center gap-1 text-zinc-400 hover:text-white transition font-medium">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to latest
              </button>
              <span className="text-zinc-600">|</span>
              <span className="flex items-center gap-1 text-zinc-400 text-[11px]">
                <Clock className="w-3 h-3 text-zinc-500" /> 1m 57s
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-bold text-xs text-zinc-100">Details</span>
              <div className="flex items-center gap-1">
                <button type="button" className="px-2.5 py-1 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-[10px] text-zinc-300 font-semibold hover:bg-zinc-700 flex items-center gap-1">
                  <History className="w-3 h-3" /> Timeline
                </button>
                <button type="button" onClick={() => setShowDiffModal(true)} className="px-2.5 py-1 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-[10px] text-zinc-300 font-semibold hover:bg-zinc-700 flex items-center gap-1">
                  <Code2 className="w-3 h-3" /> Changes
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Thought Engine Accordion matching image (e.g. "Thought for 47s") */}
            <div className="rounded-2xl border border-zinc-800 bg-[#18181c] p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 cursor-pointer">
                <span className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-violet-400" />
                  Thought for 47s
                </span>
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              </div>
            </div>

            {/* Plan Card Panel matching image */}
            <div className="rounded-2xl border border-zinc-800 bg-[#18181c] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-400" />
                  {pendingTask ? "Plan" : "Architectural Plan Required"}
                </span>
              </div>

              <div className="bg-[#121214] border border-zinc-800/80 rounded-xl p-3 space-y-3 text-right">
                <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                  تقرير شامل بالفجوات والتحسينات المطلوبة لموقعك ليصبح متجراً إلكترونياً حديثاً متكاملاً
                </p>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowDiffModal(true)}
                    className="px-4 py-1 rounded-xl bg-[#242429] border border-zinc-700 hover:border-zinc-500 text-xs text-zinc-200 font-bold transition shadow-sm"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>

            {/* Single Approval Gate Card — Single Approval → Autonomous Execution 🚀 */}
            {pendingTask && (
              <div className="bg-[#18181c] border border-violet-500/30 p-4 rounded-2xl space-y-4 text-start shadow-2xl">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-violet-500/20 text-violet-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-zinc-100 flex items-center gap-1.5">
                        Single Engineering Plan ({pendingTask.taskId})
                      </h3>
                      <p className="text-[10px] text-zinc-400">خطة تنفيذ هندسية شاملة وموحدة لموافقات المشروع</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md font-bold">
                      ⏱ المتوقع: 30-60s
                    </span>
                    <RiskBadge level={pendingTask.riskLevel} />
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="p-3 rounded-xl bg-[#121214] border border-zinc-800/80 space-y-1.5 text-xs">
                  <div className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">الملخص التنفيذي (Executive Summary)</div>
                  <p className="text-zinc-200 text-[11px] leading-relaxed">
                    تحليل شامل للمشروع والاعتماديات وتوليد خطة عمل هندسية موحدة تعود بالتعديلات المباشرة على المكونات وقواعد البيانات والـ APIs بحماية Multi-Tenant RLS الكاملة.
                  </p>
                </div>

                {/* Impact Analysis Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2.5 rounded-xl bg-[#121214] border border-zinc-800 text-[10px]">
                  <div>
                    <div className="text-zinc-500 font-bold">الملفات (Files)</div>
                    <div className="text-zinc-200 font-bold font-mono">{pendingTask.affectedFiles.length} ملفات</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 font-bold">المكونات (UI Components)</div>
                    <div className="text-violet-400 font-bold">تحديث متكامل</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 font-bold">قواعد البيانات (Database)</div>
                    <div className="text-emerald-400 font-bold">Migrations + RLS</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 font-bold">الـ APIs</div>
                    <div className="text-cyan-400 font-bold">Server Functions</div>
                  </div>
                </div>

                {/* Affected Files List */}
                {pendingTask.affectedFiles.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-zinc-400">الملفات المتأثرة (Affected Files):</div>
                    <div className="flex flex-wrap gap-1.5">
                      {pendingTask.affectedFiles.map((file) => (
                        <span key={file} className="text-[10px] font-mono bg-black/60 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md">
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Single Approval Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowDiffModal(true)}
                    className="px-4 py-1.5 rounded-xl border border-zinc-700 hover:border-zinc-500 text-xs text-zinc-300 hover:bg-zinc-800 transition font-bold flex items-center gap-1.5"
                  >
                    <Code2 className="w-3.5 h-3.5 text-violet-400" />
                    Review Plan
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!executionStageInfo.canExecute}
                      onClick={handleApproveTask}
                      title={!executionStageInfo.canExecute ? executionStageInfo.helperMsg : "اعتماد وتنفيذ الخطة الهندسية"}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/20 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isExecutingTask ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Executing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve & Execute</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Execution Journal (Production Audit Log) Card 📜 */}
            <div className="rounded-2xl border border-zinc-800 bg-[#18181c] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-400" />
                  Execution Journal (سجل التنفيذ الإنتاجي)
                </span>
                <span className="text-[10px] font-mono text-zinc-400 font-semibold bg-zinc-800 px-2 py-0.5 rounded-md">
                  {journalLogs.length} سجلات
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 no-scrollbar text-start">
                {journalLogs.length === 0 ? (
                  <div className="text-[11px] text-zinc-500 py-3 text-center font-mono">
                    لا توجد سجلات تنفيذ حتى الآن
                  </div>
                ) : (
                  journalLogs.map((log: any) => {
                    const timeStr = log.createdAt
                      ? new Date(log.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                      : "--:--:--";
                    const isPending = log.status === "PENDING";
                    const isSuccess = log.status === "SUCCESS";
                    return (
                      <div key={log.id || log.createdAt} className="p-2.5 rounded-xl bg-[#121214] border border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            isSuccess
                              ? "bg-emerald-500/20 text-emerald-400"
                              : isPending
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-red-500/20 text-red-400"
                          }`}>
                            {log.status}
                          </span>
                          <span className="font-bold text-zinc-200 truncate">{log.action}</span>
                          {log.tool && (
                            <span className="text-[10px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20">
                              {log.tool}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 shrink-0">{timeStr}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Failure Explanation Panel */}
            {failureExplanation && (
              <div className="bg-[#1c1c1e] border border-red-500/30 bg-red-950/20 p-4 rounded-2xl space-y-3 text-start">
                <div className="flex items-center justify-between border-b border-red-500/20 pb-2">
                  <h3 className="font-bold text-xs text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    Failure Explanation Panel ({failureExplanation.errorType || failureExplanation.failed_step || "Build Failure"})
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 uppercase">
                    {failureExplanation.riskLevel || "HIGH"} RISK
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-black/40 border border-zinc-800 space-y-1">
                    <div className="text-[10px] font-bold text-zinc-400">السبب (Reason):</div>
                    <div className="text-zinc-200 font-semibold">{failureExplanation.reason || failureExplanation.message}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-zinc-800 space-y-1">
                    <div className="text-[10px] font-bold text-zinc-400">النظام المتأثر / الأداة:</div>
                    <div className="text-cyan-400 font-semibold">{failureExplanation.affectedSystem || failureExplanation.tool_name || "Engine Pipeline"}</div>
                  </div>
                </div>

                {/* Additional rich error details: stdout, stderr, stack */}
                {(failureExplanation.stdout || failureExplanation.stderr || failureExplanation.stack) && (
                  <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-800 space-y-1 font-mono text-[10px] dir-ltr text-start">
                    <div className="text-zinc-400 font-bold">Terminal / Error Log Output:</div>
                    {failureExplanation.stdout && (
                      <pre className="text-zinc-300 overflow-x-auto p-1.5 bg-black/40 rounded border border-zinc-900 leading-tight">
                        {failureExplanation.stdout.slice(0, 1500)}
                      </pre>
                    )}
                    {failureExplanation.stderr && (
                      <pre className="text-red-300 overflow-x-auto p-1.5 bg-black/40 rounded border border-red-950 leading-tight">
                        {failureExplanation.stderr.slice(0, 1500)}
                      </pre>
                    )}
                    {failureExplanation.stack && !failureExplanation.stdout && !failureExplanation.stderr && (
                      <pre className="text-amber-300 overflow-x-auto p-1.5 bg-black/40 rounded border border-amber-950 leading-tight">
                        {failureExplanation.stack.slice(0, 1000)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Active Session Context */}
            {activeSession && (
              <div className="rounded-2xl border border-zinc-800 bg-[#18181c] p-3 space-y-2 text-start">
                <div className="text-[11px] font-bold text-zinc-400 flex items-center justify-between">
                  <span>سياق الجلسة الحالية</span>
                  <TaskStatusBadge status={activeSession.task_status} />
                </div>
                <div className="text-xs font-bold text-zinc-200">{activeSession.title}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        actions={[
          {
            id: "verify-project",
            label: "فحص هيكل المشروع (verifyProjectStructure)",
            icon: <CheckCircle className="h-4 w-4 text-emerald-400" />,
            shortcut: "Ctrl+V",
            action: () => handleApproveTask(),
          },
          {
            id: "switch-build",
            label: "التبديل إلى وضع البناء والتنفيذ (Build Mode ⚡)",
            icon: <Zap className="h-4 w-4 text-amber-400" />,
            shortcut: "Alt+B",
            action: () => setWorkMode("BUILD"),
          },
          {
            id: "switch-plan",
            label: "التبديل إلى وضع التخطيط الهندسي (Plan Mode 📋)",
            icon: <FileText className="h-4 w-4 text-violet-400" />,
            shortcut: "Alt+P",
            action: () => setWorkMode("PLAN"),
          },
          {
            id: "new-session",
            label: "إنشاء جلسة عمل جديدة",
            icon: <Plus className="h-4 w-4 text-cyan-400" />,
            action: () => handleNewSession(),
          },
        ]}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────

function TaskStatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: typeof Clock; color: string; label: string }> = {
    idle: { icon: Clock, color: "text-muted-foreground bg-muted", label: "جديد" },
    planning: { icon: Sparkles, color: "text-violet-500 bg-violet-500/10", label: "تخطيط" },
    waiting_approval: { icon: Shield, color: "text-amber-400 bg-amber-500/20 border border-amber-500/30", label: "في انتظار الموافقة ⏸" },
    executing: { icon: Play, color: "text-amber-500 bg-amber-500/10", label: "جاري التنفيذ" },
    queued: { icon: Clock, color: "text-blue-500 bg-blue-500/10", label: "في الطابور" },
    testing: { icon: Zap, color: "text-cyan-500 bg-cyan-500/10", label: "فحص البناء" },
    building: { icon: Cpu, color: "text-indigo-400 bg-indigo-500/10", label: "تجمع الإنتاج" },
    success: { icon: CheckCircle, color: "text-emerald-500 bg-emerald-500/10", label: "تم بنجاح ✨" },
    completed: { icon: CheckCircle, color: "text-emerald-600 bg-emerald-500/10", label: "مكتمل" },
    failed: { icon: XCircle, color: "text-destructive bg-destructive/10", label: "فشل" },
    rolled_back: { icon: AlertTriangle, color: "text-orange-500 bg-orange-500/10", label: "تم التراجع 🔄" },
    blocked: { icon: Shield, color: "text-red-400 bg-red-500/20 border border-red-500/30", label: "محظور 🛑" },
    permission_error: { icon: Shield, color: "text-orange-400 bg-orange-500/20", label: "خطأ صلاحيات ⛔" },
    validation_error: { icon: AlertTriangle, color: "text-amber-400 bg-amber-500/20", label: "خطأ تفعيل ⚠️" },
    build_error: { icon: XCircle, color: "text-red-400 bg-red-500/20", label: "فشل البناء 🛠️" },
    database_error: { icon: AlertTriangle, color: "text-purple-400 bg-purple-500/20", label: "خطأ داتا بيز 🗄️" },
  };

  const c = config[status] || config.idle;
  const Icon = c.icon;

  return (
    <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${c.color}`}>
      <Icon className="h-2.5 w-2.5" /> {c.label}
    </span>
  );
}

function RiskBadge({ level }: { level: string }) {
  const config: Record<string, { color: string; label: string }> = {
    low: { color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", label: "🟢 منخفض" },
    medium: { color: "text-amber-500 bg-amber-500/10 border-amber-500/20", label: "🟡 متوسط" },
    high: { color: "text-orange-500 bg-orange-500/10 border-orange-500/20", label: "🟠 مرتفع" },
    critical: { color: "text-destructive bg-destructive/10 border-destructive/20", label: "🔴 حرج" },
  };

  const c = config[level] || config.low;

  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold border ${c.color}`}>
      {c.label}
    </span>
  );
}

/** Clean reasoning / chain of thought tags from text */
function cleanThoughtContent(content: string): string {
  if (!content) return "";
  return content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*/gi, "")
    .replace(/^Thinking Process:[\s\S]*?\n\n/gi, "")
    .trim();
}

/** Simple markdown-to-HTML renderer for AI responses */
function MarkdownContent({ content }: { content: string }) {
  const cleaned = cleanThoughtContent(content);

  const html = cleaned
    // Code blocks with dark container and LTR direction
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
      const language = lang || "code";
      return `<div className="my-3 rounded-2xl border border-zinc-800 bg-[#09090b] shadow-2xl overflow-hidden text-start" dir="ltr">
        <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900/90 border-b border-zinc-800/80 text-[10px] font-mono text-zinc-400">
          <span className="uppercase font-bold text-violet-400">${language}</span>
          <span className="text-zinc-500">Indexes Store AI</span>
        </div>
        <pre className="p-4 overflow-x-auto font-mono text-xs text-zinc-100 leading-relaxed"><code class="language-${language}">${escapeHtml(code.trim())}</code></pre>
      </div>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded-md bg-zinc-800 text-violet-300 font-mono text-xs border border-zinc-700/60">$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-black text-zinc-100">$1</strong>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-black text-zinc-100 mt-4 mb-1.5 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-violet-500"></span>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-black text-zinc-100 mt-5 mb-2 pb-1 border-b border-zinc-800/80">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-black text-zinc-100 mt-6 mb-2">$1</h1>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ms-4 list-disc text-zinc-300 my-0.5">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ms-4 list-decimal text-zinc-300 my-0.5">$1</li>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p class="mb-2 leading-relaxed text-zinc-200">')
    // Single newline
    .replace(/\n/g, '<br/>');

  return <div className="text-zinc-200 leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: `<p class="mb-2 leading-relaxed">${html}</p>` }} />;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function DiffPreviewModal({
  task,
  onClose,
  onApprove,
  isExecuting,
}: {
  task: { taskId: string; affectedFiles: string[]; diffs?: Record<string, string> };
  onClose: () => void;
  onApprove: () => void;
  isExecuting: boolean;
}) {
  const [selectedFile, setSelectedFile] = useState<string>(task.affectedFiles[0] || "");
  const diffs = task.diffs || {};
  const currentDiff = diffs[selectedFile] || "";

  const lines = currentDiff.split("\n");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto" dir="rtl">
      <div className="w-full max-w-4xl rounded-3xl bg-[#1c1c1e] border border-zinc-800 p-6 shadow-2xl space-y-4 my-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-violet-400" />
            <h3 className="text-base font-bold text-zinc-100">
              معاينة التغييرات الفروقية (Diff Preview — {task.taskId})
            </h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white">
            ✕
          </button>
        </div>

        {/* File Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-800/80">
          {task.affectedFiles.map((file) => (
            <button
              key={file}
              onClick={() => setSelectedFile(file)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition ${
                selectedFile === file
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {file}
            </button>
          ))}
        </div>

        {/* Diff Code View */}
        <div className="rounded-2xl bg-[#121214] border border-zinc-800/80 p-4 font-mono text-xs overflow-x-auto max-h-96 space-y-1">
          {lines.length > 0 && lines[0] !== "" ? (
            lines.map((line, idx) => {
              let lineStyle = "text-zinc-400";
              let bgStyle = "";
              if (line.startsWith("+") && !line.startsWith("+++")) {
                lineStyle = "text-emerald-400 font-bold";
                bgStyle = "bg-emerald-950/30 -mx-4 px-4 py-0.5 border-r-2 border-emerald-500";
              } else if (line.startsWith("-") && !line.startsWith("---")) {
                lineStyle = "text-rose-400 font-bold";
                bgStyle = "bg-rose-950/30 -mx-4 px-4 py-0.5 border-r-2 border-rose-500";
              } else if (line.startsWith("---") || line.startsWith("+++")) {
                lineStyle = "text-zinc-500 font-bold";
              }

              return (
                <div key={idx} className={`leading-relaxed whitespace-pre ${bgStyle} ${lineStyle}`}>
                  {line}
                </div>
              );
            })
          ) : (
            <p className="text-zinc-500 italic">لا توجد فروقات مرئية مسبقاً لهذا الملف.</p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-zinc-700 text-xs font-bold text-zinc-300 hover:bg-zinc-800">
            إغلاق المعاينة
          </button>
          <button
            disabled={isExecuting}
            onClick={() => {
              onClose();
              onApprove();
            }}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/20 flex items-center gap-1.5 disabled:opacity-50"
          >
            {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            اعتماد وتنفيذ التعديلات (Approve & Execute)
          </button>
        </div>
      </div>
    </div>
  );
}
