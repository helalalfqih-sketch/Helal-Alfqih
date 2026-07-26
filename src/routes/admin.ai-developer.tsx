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
import { useState, useRef, useEffect, useCallback } from "react";
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
  listExecutionHistoryFn,
  getImpactAnalysisFn,
  getAgentPerformanceFn,
  type AgentSession,
  type AgentMessage,
  type AgentMemoryEntry,
} from "@/lib/ai-agent.functions";
import { listAIProvidersFn } from "@/lib/ai-provider.server";

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
    diffs?: Record<string, string>;
  } | null>(null);
  const [agentActivity, setAgentActivity] = useState<{
    status: string;
    label: string;
    provider?: string;
    model?: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const { data: execHistory = [] } = useQuery({
    queryKey: ["ai-execution-history"],
    queryFn: () => getExecHistoryFn(),
  });

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

    // Stream AI response with Activity Events
    try {
      setAgentActivity({ status: "receiving_request", label: "جاري استقبال طلبك..." });
      const base = (typeof window !== "undefined" ? window.location.origin : "") || "";
      const res = await fetch(`${base}/api/ai/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
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
                  status: json.status,
                  label: json.label,
                  provider: json.provider,
                  model: json.model,
                });
              } else if (
                json.type === "reading_file" ||
                json.type === "searching_code" ||
                json.type === "inspecting_db" ||
                json.type === "tool_call"
              ) {
                setAgentActivity({
                  status: json.type,
                  label: json.message || "جاري استخدام أداة التطوير...",
                });
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

  const executeApprovedFn = useServerFn(executeApprovedTask);
  const [isExecutingTask, setIsExecutingTask] = useState(false);

  const handleApproveTask = async () => {
    if (!pendingTask) return;
    if (agentRole !== "owner") {
      toast.error("مرفوض: الاعتماد والتنفيذ الفعلي متاح فقط لرتبة المالك (Owner) 👑");
      return;
    }

    setIsExecutingTask(true);
    toast.loading(`جاري تنفيذ وإجراء الفحص الآلي للمهمة ${pendingTask.taskId}...`, { id: "task-exec" });

    try {
      const res = (await executeApprovedFn({ data: { taskId: pendingTask.taskId } })) as any;
      if (res?.success) {
        toast.success(`تم تنفيذ المهمة ${pendingTask.taskId} بنجاح واجتياز الفحص! ✨`, { id: "task-exec" });
        setPendingTask(null);
        setFailureExplanation(null);
        queryClient.invalidateQueries({ queryKey: ["ai-agent-sessions"] });
      } else {
        if (res?.failureDetails) {
          setFailureExplanation(res.failureDetails);
        }
        if (res?.recoveryTimeline) {
          setRecoveryTimeline(res.recoveryTimeline);
        }
        toast.error(`فشل التنفيذ/فحص البناء! (${res?.failureDetails?.reason || "تم إيقاف العملية والتراجع تلقائياً"}) 🔄`, { id: "task-exec" });
      }
    } catch (err: any) {
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
              onClick={() => setShowContext((prev) => !prev)}
              className={`p-2 rounded-xl border transition ${
                showContext
                  ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                  : "bg-[#141417] border-zinc-800 text-zinc-400 hover:text-white"
              }`}
              title="لوحة التفاصيل (Details Panel)"
            >
              <Layers className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2">
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

        {/* ═══ Left Column: Stream & Prompts Console Panel ═══ */}
        <div className={`${showSessions ? "lg:col-span-5" : "lg:col-span-6"} rounded-2xl border border-zinc-800 bg-[#121214] shadow-xl flex flex-col overflow-hidden h-full max-h-[calc(100vh-160px)]`}>
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
                          {pendingTask ? `Plan (${pendingTask.taskId})` : "Skipped creating plan"}
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

            {isStreaming && (
              <div className="p-3.5 rounded-2xl bg-[#18181c] border border-zinc-800 space-y-2 text-xs font-mono shadow-md text-start">
                <div className="text-[11px] font-bold text-violet-400 flex items-center justify-between border-b border-zinc-800 pb-2 font-sans">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" /> Execution State Machine
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-bold uppercase tracking-wider">
                    {agentActivity?.status || "Analyzing"}
                  </span>
                </div>
                <div className="space-y-1.5 text-zinc-300 text-[11px]">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>✓ Reading files...</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>✓ Searching routes & analyzing payment modules...</span>
                  </div>
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>✓ {agentActivity?.label || "Building implementation plan..."}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestion Pills Horizontal Strip */}
          <div className="p-2 border-t border-zinc-800/80 bg-[#121214] flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              "اطلب قائمة أمن وامتثال",
              "والأداء SEO اطلب تركيز على",
              "اطلب تركيز على الدفع",
              "اطلب تقرير شامل لموقعك",
            ].map((pill, idx) => (
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
              {/* Top Tag inside Input Box */}
              <div className="flex items-center justify-between text-[10px]">
                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono font-semibold">
                  Details
                </span>
              </div>

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
                placeholder={canSend ? "Ask Lovable / Indexes AI..." : "ليس لديك صلاحية الإرسال"}
                disabled={!canSend || isStreaming}
                className="w-full bg-transparent border-none text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none leading-relaxed text-right"
              />

              {/* Bottom Toolbar inside Input Box */}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                <div className="flex items-center gap-1.5">
                  <button type="button" className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#222226] border border-zinc-800 text-[11px] text-zinc-300 font-bold cursor-pointer hover:border-zinc-700">
                    <span>Build</span>
                    <ChevronDown className="w-3 h-3 text-zinc-400" />
                  </div>

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
            </div>
          </div>
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
                  {pendingTask ? "Plan" : "Skipped creating plan"}
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

            {/* Interactive Task Plan & Approval Controls */}
            {pendingTask && (
              <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-2xl space-y-4 text-start">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-zinc-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    المهمة ({pendingTask.taskId})
                  </h3>
                  <RiskBadge level={pendingTask.riskLevel} />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDiffModal(true)}
                    className="px-3.5 py-1.5 rounded-xl border border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800 transition font-bold flex items-center gap-1.5"
                  >
                    <Code2 className="w-3.5 h-3.5 text-violet-400" />
                    Review Diff
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isExecutingTask}
                      onClick={handleApproveTask}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg flex items-center gap-1 disabled:opacity-50"
                    >
                      {isExecutingTask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      {isExecutingTask ? "Executing..." : "Approve & Execute"}
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectTask}
                      className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white transition"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Failure Explanation Panel */}
            {failureExplanation && (
              <div className="bg-[#1c1c1e] border border-red-500/30 bg-red-950/20 p-4 rounded-2xl space-y-3 text-start">
                <div className="flex items-center justify-between border-b border-red-500/20 pb-2">
                  <h3 className="font-bold text-xs text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    Failure Explanation Panel ({failureExplanation.errorType})
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 uppercase">
                    {failureExplanation.riskLevel} RISK
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-black/40 border border-zinc-800 space-y-1">
                    <div className="text-[10px] font-bold text-zinc-400">السبب (Reason):</div>
                    <div className="text-zinc-200 font-semibold">{failureExplanation.reason}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-zinc-800 space-y-1">
                    <div className="text-[10px] font-bold text-zinc-400">النظام المتأثر:</div>
                    <div className="text-cyan-400 font-semibold">{failureExplanation.affectedSystem}</div>
                  </div>
                </div>
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
    running: { icon: Play, color: "text-amber-500 bg-amber-500/10", label: "جاري التنفيذ" },
    testing: { icon: Zap, color: "text-cyan-500 bg-cyan-500/10", label: "فحص البناء" },
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
