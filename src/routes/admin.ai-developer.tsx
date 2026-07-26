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

  const { data: execHistory = [] } = useQuery({
    queryKey: ["ai-execution-history"],
    queryFn: () => getExecHistoryFn(),
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
    } catch {
      setMessages([]);
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
                setPendingTask({
                  taskId: json.taskId || `task-${Date.now()}`,
                  plan: json.plan || [],
                  affectedFiles: json.affectedFiles || [],
                  riskLevel: json.riskLevel || "low",
                });
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
        queryClient.invalidateQueries({ queryKey: ["ai-agent-sessions"] });
      } else if (res?.status === "rolled_back") {
        toast.error(`فشل فحص البناء! تم إلغاء التعديلات والتراجع تلقائياً 🔄`, { id: "task-exec" });
      } else {
        toast.error(`فشل تنفيذ المهمة: ${res?.buildOutput || "خطأ غير معروف"}`, { id: "task-exec" });
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
    <div className="font-sans pb-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5 text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 text-violet-500 shadow-xs">
              <Code2 className="h-5 w-5" />
            </div>
            Indexes AI Engineering Agent
          </h1>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            مساعد تطوير ذكي متخصص بمشروع Indexes Store — يحلل ويقترح وينفذ كمهندس Senior.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Provider Select */}
          {providers.length > 0 && (
            <select
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
              className="rounded-xl border border-border bg-surface/50 px-3 py-1.5 text-[11px] font-bold text-foreground outline-none focus:border-violet-500/50 focus:ring-1 ring-violet-500/30 transition-all cursor-pointer hover:bg-surface"
            >
              <option value="">✨ تلقائي (حسب الأولوية)</option>
              {providers.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.provider === "gemini" ? "Gemini" : p.provider === "lovable" ? "Lovable" : p.provider === "vertex" ? "Vertex" : p.provider} ({p.model})
                </option>
              ))}
            </select>
          )}

          {/* Role Badge */}
          <div className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold border ${
            agentRole === "owner"
              ? "bg-violet-500/10 text-violet-500 border-violet-500/30"
              : agentRole === "admin"
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                : agentRole === "developer"
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                  : "bg-muted text-muted-foreground border-border"
          }`}>
            <Shield className="h-3 w-3" />
            {agentRole === "owner" ? "Owner — تنفيذ كامل" : agentRole === "admin" ? "Admin — تنفيذ محدود" : agentRole === "developer" ? "Developer — اقتراح فقط" : "Viewer — قراءة فقط"}
          </div>

          {/* Usage Stats */}
          {usageStats && usageStats.requests > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-surface border border-border px-3 py-1.5 text-[11px] font-bold text-muted-foreground">
              <Cpu className="h-3 w-3" />
              {usageStats.totalTokens.toLocaleString()} tokens · ${usageStats.totalCost.toFixed(4)}
            </div>
          )}

          {/* Sidebar Toggles */}
          <button
            type="button"
            onClick={() => setShowSessions((prev) => !prev)}
            className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition ${
              showSessions
                ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                : "bg-surface border-border text-muted-foreground hover:text-foreground"
            }`}
            title="إخفاء/إظهار شريط الجلسات"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            الجلسات
          </button>

          <button
            type="button"
            onClick={() => setShowContext((prev) => !prev)}
            className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition ${
              showContext
                ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                : "bg-surface border-border text-muted-foreground hover:text-foreground"
            }`}
            title="إخفاء/إظهار سياق المشروع"
          >
            <FileCode className="h-3.5 w-3.5" />
            السياق
          </button>

          <button
            type="button"
            onClick={handleNewSession}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" />
            جلسة جديدة
          </button>
        </div>
      </div>

      {/* Main Responsive Layout: min-w-0 prevents grid column shrinking */}
      <div
        className={`grid grid-cols-1 ${
          showSessions && showContext
            ? "xl:grid-cols-[220px_minmax(0,1fr)_240px]"
            : showSessions
              ? "xl:grid-cols-[240px_minmax(0,1fr)]"
              : showContext
                ? "xl:grid-cols-[minmax(0,1fr)_260px]"
                : "grid-cols-1"
        } gap-4 min-h-[calc(100vh-200px)] w-full items-start`}
      >
        {/* ═══ Left: Session Timeline ═══ */}
        {showSessions && (
          <div className="min-w-0 rounded-3xl border border-border/80 bg-surface/60 backdrop-blur-sm shadow-xs overflow-hidden flex flex-col h-full max-h-[calc(100vh-200px)]">
            <div className="p-3 border-b border-border/60 flex items-center justify-between">
              <h2 className="text-xs font-black text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> الجلسات ({activeSessions.length})
              </h2>
            </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : activeSessions.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                لا توجد جلسات بعد
              </div>
            ) : (
              activeSessions.map((session: AgentSession) => (
                <motion.button
                  key={session.id}
                  type="button"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => loadSession(session.id)}
                  className={`w-full text-start rounded-2xl p-3 transition group ${
                    activeSessionId === session.id
                      ? "bg-violet-500/10 border border-violet-500/30"
                      : "hover:bg-accent/60 border border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[11px] font-bold text-foreground line-clamp-2">
                      {session.title}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleArchive(session.id); }}
                      className="opacity-0 group-hover:opacity-100 transition shrink-0"
                    >
                      <Archive className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    {session.task_id && (
                      <span className="text-[9px] font-mono font-bold text-violet-500 bg-violet-500/10 rounded-md px-1.5 py-0.5">
                        {session.task_id}
                      </span>
                    )}
                    <TaskStatusBadge status={session.task_status} />
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-1 block">
                    {new Date(session.updated_at).toLocaleDateString("ar-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </motion.button>
              ))
            )}
          </div>
        </div>
        )}

        {/* ═══ Center: Chat Window ═══ */}
        <div className="rounded-3xl border border-border/80 bg-surface/40 backdrop-blur-sm shadow-xs flex flex-col overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !streamingContent && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                  <Bot className="h-10 w-10 text-violet-500" />
                </div>
                <h3 className="text-lg font-black text-foreground mb-2">مرحباً بك في Indexes AI Engineering Agent</h3>
                <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                  أنا مساعدك الذكي المتخصص بمشروع Indexes Store. أستطيع تحليل الكود، اقتراح التحسينات، وإنشاء خطط التنفيذ.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 max-w-lg">
                  {[
                    "أريد تحسين سرعة تحميل الصور",
                    "أضف زر فيديو توضيحي للمنتج",
                    "حسّن أداء صفحة البحث",
                    "أنشئ نظام إشعارات الطلبات",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => { setInputValue(suggestion); inputRef.current?.focus(); }}
                      className="rounded-2xl border border-border/60 bg-surface/80 p-3 text-start text-[11px] font-bold text-muted-foreground hover:text-foreground hover:border-violet-500/30 hover:bg-violet-500/5 transition"
                    >
                      <Sparkles className="h-3 w-3 text-violet-500 mb-1" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div className={`shrink-0 h-8 w-8 rounded-xl flex items-center justify-center ${
                    msg.role === "user"
                      ? "bg-violet-500/10 text-violet-500"
                      : "bg-gradient-to-br from-violet-500/20 to-cyan-500/20 text-cyan-500"
                  }`}>
                    {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex-1 max-w-[85%] ${msg.role === "user" ? "text-end" : ""}`}>
                    <div className={`inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-violet-600 text-white rounded-tr-sm"
                        : "bg-surface border border-border/60 text-foreground rounded-tl-sm"
                    }`}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none [&_pre]:rounded-xl [&_pre]:bg-black/40 [&_code]:text-violet-400 [&_code]:text-xs">
                          <MarkdownContent content={msg.content} />
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      )}
                    </div>

                    {/* Copy button for assistant messages */}
                    {msg.role === "assistant" && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition"
                      >
                        {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Clipboard className="h-3 w-3" />}
                        {copiedId === msg.id ? "تم النسخ" : "نسخ"}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Status Pill Indicator */}
            {isStreaming && (
              <div className="flex justify-center my-3">
                <div className="w-full text-center py-2 px-4 rounded-full border border-zinc-700/70 bg-zinc-900/60 text-xs text-zinc-300 font-mono tracking-wide shadow-sm flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span>{agentActivity?.label || "Action plan generated, awaiting user approval"}</span>
                </div>
              </div>
            )}

            {/* Interactive Lovable/Bolt Style Plan Approval Card */}
            {pendingTask && (
              <div className="bg-[#1c1c1e] border border-zinc-800 p-4 rounded-2xl space-y-4 shadow-xl text-start">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      Plan ({pendingTask.taskId})
                    </h3>
                    <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
                      الخطورة: {pendingTask.riskLevel}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    خطة عمل مقترحة لتنفيذ التعديلات البرمجية وتحديث المكونات المتأثرة ({pendingTask.affectedFiles.length} ملفات).
                  </p>
                </div>

                {pendingTask.affectedFiles.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap gap-1.5">
                      {pendingTask.affectedFiles.map((file) => (
                        <span key={file} className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg">
                          {file}
                        </span>
                      ))}
                    </div>

                    {/* Semantic Brain Affected Area Breakdown — Phase 7.4 🧠 */}
                    <div className="grid grid-cols-4 gap-2 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-[10px]">
                      <div>
                        <div className="text-zinc-500 font-bold">الملفات (Files)</div>
                        <div className="text-zinc-200 font-bold">{pendingTask.affectedFiles.length}</div>
                      </div>
                      <div>
                        <div className="text-zinc-500 font-bold">المكونات (Components)</div>
                        <div className="text-violet-400 font-bold">تأثير شامل</div>
                      </div>
                      <div>
                        <div className="text-zinc-500 font-bold">قواعد البيانات (Database)</div>
                        <div className="text-emerald-400 font-bold">محمي بـ RLS</div>
                      </div>
                      <div>
                        <div className="text-zinc-500 font-bold">الـ APIs</div>
                        <div className="text-cyan-400 font-bold">Auth Guarded</div>
                      </div>
                    </div>

                    {/* Agent Reasoning Layer — Phase 7.5 🧠⚡ */}
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/90 text-xs space-y-2 text-start">
                      <div className="text-[11px] font-bold text-violet-400 flex items-center gap-1.5 border-b border-zinc-800 pb-1.5">
                        <Brain className="w-3.5 h-3.5" /> Engineering Analysis
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-zinc-500 font-bold">Problem: </span>
                          <span className="text-zinc-300">تحسين هندسي على المكونات الخادمية والواجهة.</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 font-bold">Root Cause: </span>
                          <span className="text-zinc-300">تحديث الهيكلية وإدارة الحالة البرمجية.</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 font-bold">Risk: </span>
                          <span className="text-amber-400 font-bold">{pendingTask.riskLevel.toUpperCase()} (Sandbox Guarded)</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 font-bold">Solution: </span>
                          <span className="text-emerald-400 font-bold">Snapshots + Auto-Rollback</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowDiffModal(true)}
                    className="px-4 py-1.5 rounded-full border border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800 transition font-medium flex items-center gap-1"
                  >
                    <Code2 className="w-3.5 h-3.5 text-violet-400" />
                    Review Diff
                  </button>

                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      disabled={isExecutingTask}
                      onClick={handleApproveTask}
                      className="px-5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/20 flex items-center gap-1 disabled:opacity-50"
                    >
                      {isExecutingTask ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      {isExecutingTask ? "Executing..." : "Approve & Execute"}
                    </button>
                    <button 
                      type="button"
                      onClick={handleRejectTask}
                      className="px-3.5 py-1.5 rounded-full text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Real Diff Preview Modal — Phase 7.1 🧬 */}
            {showDiffModal && pendingTask && (
              <DiffPreviewModal
                task={pendingTask}
                onClose={() => setShowDiffModal(false)}
                onApprove={handleApproveTask}
                isExecuting={isExecutingTask}
              />
            )}

            {/* Streaming Text Output */}
            {isStreaming && streamingContent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="shrink-0 h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center text-cyan-500">
                  <Bot className="h-4 w-4 animate-pulse" />
                </div>
                <div className="flex-1 max-w-[85%] space-y-3">
                  <div className="rounded-2xl rounded-tl-sm bg-[#1c1c1e] border border-zinc-800 px-4 py-3 text-sm text-foreground shadow-xs">
                    <div className="prose prose-sm prose-invert max-w-none [&_pre]:rounded-xl [&_pre]:bg-black/40 [&_code]:text-violet-400 [&_code]:text-xs">
                      <MarkdownContent content={streamingContent} />
                      <span className="inline-block w-2 h-4 bg-violet-500 animate-pulse rounded-sm ms-0.5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* 5. Bottom Input Section & Suggestion Pills */}
          <footer className="p-3 bg-[#141414] space-y-3 border-t border-zinc-800">
            {/* Scrollable Suggestion Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
              {[
                "شحن",
                "تخطيط إعادة التخزين الذكي",
                "لوحة تحكم الشحن والتوزيع",
                "تصدر تقارير الطلبات",
                "لوحة تقارير الدفع",
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputValue(item);
                    inputRef.current?.focus();
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#1c1c1e] border border-zinc-800 text-zinc-300 hover:border-zinc-600 whitespace-nowrap transition flex-shrink-0 text-xs font-medium"
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Input Bar with Tools & Mode Selector */}
            <div className="relative bg-[#1c1c1e] border border-zinc-800 rounded-2xl p-2 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              <input
                ref={inputRef as any}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={canSend ? "Ask Lovable / Indexes AI..." : "ليس لديك صلاحية الإرسال"}
                disabled={!canSend || isStreaming}
                className="w-full bg-transparent border-none text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none px-3 text-right"
              />

              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700/50 text-[11px] text-zinc-300 cursor-pointer hover:border-zinc-500 font-medium">
                  <span>Plan</span>
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                </div>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isStreaming || !canSend}
                  className="p-2 text-white bg-blue-600 hover:bg-blue-500 rounded-full transition disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </footer>
        </div>

        {/* ═══ Right: Context Panel ═══ */}
        {showContext && (
          <div className="min-w-0 rounded-3xl border border-border/80 bg-surface/60 backdrop-blur-sm shadow-xs overflow-hidden flex flex-col h-full max-h-[calc(100vh-200px)]">
            <div className="p-3 border-b border-border/60 flex items-center justify-between">
              <h2 className="text-xs font-black text-muted-foreground flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5" /> سياق المشروع
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Active Task */}
              {activeSession && (
                <div className="rounded-2xl border border-border/60 bg-surface/80 p-3">
                  <div className="text-[10px] font-bold text-muted-foreground mb-1.5">المهمة الحالية</div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-violet-500">{activeSession.task_id}</span>
                    <TaskStatusBadge status={activeSession.task_status} />
                  </div>
                  <div className="text-[11px] font-bold text-foreground line-clamp-2">{activeSession.title}</div>

                  {/* Risk Level */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-bold text-muted-foreground">الخطورة:</span>
                    <RiskBadge level={activeSession.risk_level} />
                  </div>
                </div>
              )}

              {/* Affected Files */}
              {activeSession?.affected_files && Array.isArray(activeSession.affected_files) && (activeSession.affected_files as string[]).length > 0 && (
                <div className="rounded-2xl border border-border/60 bg-surface/80 p-3">
                  <div className="text-[10px] font-bold text-muted-foreground mb-2">الملفات المتأثرة</div>
                  <div className="space-y-1">
                    {(activeSession.affected_files as string[]).map((file: string, i: number) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] font-mono text-foreground">
                        <FileCode className="h-3 w-3 text-violet-500 shrink-0" />
                        <span className="truncate">{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Memory */}
              <div className="rounded-2xl border border-border/60 bg-surface/80 p-3">
                <div className="text-[10px] font-bold text-muted-foreground mb-2 flex items-center gap-1">
                  <Brain className="h-3 w-3" /> ذاكرة المشروع ({memory.length})
                </div>
                <div className="space-y-1.5">
                  {memory.slice(0, 8).map((m: AgentMemoryEntry) => (
                    <div key={m.id} className="text-[10px]">
                      <span className="font-bold text-violet-400">{m.category}/{m.key}:</span>
                      <span className="text-muted-foreground ms-1 line-clamp-1">{m.value}</span>
                    </div>
                  ))}
                  {memory.length > 8 && (
                    <div className="text-[9px] text-muted-foreground">+{memory.length - 8} إدخالات أخرى</div>
                  )}
                </div>
              </div>

              {/* Execution History — Phase 7.2 */}
              <div className="rounded-2xl border border-border/60 bg-surface/80 p-3">
                <div className="text-[10px] font-bold text-muted-foreground mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-emerald-500" /> سجل التنفيذ ({execHistory.length})
                  </span>
                </div>
                {execHistory.length === 0 ? (
                  <div className="text-[10px] text-muted-foreground italic">لا توجد عمليات تنفيذ سابقة</div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {execHistory.slice(0, 5).map((item: any) => (
                      <div key={item.id} className="p-2 rounded-xl bg-background border border-border/50 text-[10px] space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="font-mono text-violet-400">{item.task_id}</span>
                          <TaskStatusBadge status={item.status} />
                        </div>
                        <div className="text-muted-foreground flex items-center justify-between text-[9px]">
                          <span>{item.files_changed?.length || 0} ملفات</span>
                          <span>{item.execution_time_ms || 0}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Usage Stats */}
              {usageStats && usageStats.requests > 0 && (
                <div className="rounded-2xl border border-border/60 bg-surface/80 p-3">
                  <div className="text-[10px] font-bold text-muted-foreground mb-2 flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" /> استهلاك AI
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[9px] text-muted-foreground">الطلبات</div>
                      <div className="text-xs font-black text-foreground">{usageStats.requests}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-muted-foreground">Tokens</div>
                      <div className="text-xs font-black text-foreground">{usageStats.totalTokens.toLocaleString()}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-[9px] text-muted-foreground">التكلفة التقديرية</div>
                      <div className="text-xs font-black text-emerald-500">${usageStats.totalCost.toFixed(4)} USD</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
    queued: { icon: Clock, color: "text-blue-500 bg-blue-500/10", label: "في الطابور" },
    running: { icon: Play, color: "text-amber-500 bg-amber-500/10", label: "جاري التنفيذ" },
    testing: { icon: Zap, color: "text-cyan-500 bg-cyan-500/10", label: "فحص البناء" },
    success: { icon: CheckCircle, color: "text-emerald-500 bg-emerald-500/10", label: "تم بنجاح ✨" },
    completed: { icon: CheckCircle, color: "text-emerald-600 bg-emerald-500/10", label: "مكتمل" },
    failed: { icon: XCircle, color: "text-destructive bg-destructive/10", label: "فشل" },
    rolled_back: { icon: AlertTriangle, color: "text-orange-500 bg-orange-500/10", label: "تم التراجع 🔄" },
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
  // Simple markdown rendering — handle code blocks, bold, lists
  const html = cleaned
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) =>
      `<pre><code class="language-${lang || "text"}">${escapeHtml(code.trim())}</code></pre>`
    )
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-black mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-black mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-black mt-4 mb-2">$1</h1>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ms-3">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ms-3 list-decimal">$1</li>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p class="mb-2">')
    // Single newline
    .replace(/\n/g, '<br/>');

  return <div dangerouslySetInnerHTML={{ __html: `<p class="mb-2">${html}</p>` }} />;
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
