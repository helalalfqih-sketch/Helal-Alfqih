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
  type AgentSession,
  type AgentMessage,
  type AgentMemoryEntry,
} from "@/lib/ai-agent.functions";

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

  // State
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
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

    // Stream AI response
    try {
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
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Parse Vercel AI SDK data stream format
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            // Text delta — the content is JSON-encoded after "0:"
            try {
              const text = JSON.parse(line.slice(2));
              fullContent += text;
              setStreamingContent(fullContent);
            } catch { /* skip non-JSON lines */ }
          }
        }
      }

      // Save assistant message
      if (fullContent) {
        const saved = await saveMessageFn({
          data: {
            sessionId,
            role: "assistant",
            content: fullContent,
          },
        });
        setMessages((prev) => [...prev, saved]);
      }

      setStreamingContent("");
      queryClient.invalidateQueries({ queryKey: ["ai-agent-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["ai-agent-usage"] });
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ في الاتصال بالذكاء الاصطناعي");
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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

      {/* Main Layout: 3-column on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-4 min-h-[calc(100vh-200px)]">
        {/* ═══ Left: Session Timeline ═══ */}
        <div className="rounded-3xl border border-border/80 bg-surface/60 backdrop-blur-sm shadow-xs overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border/60">
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

            {/* Streaming indicator */}
            {isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="shrink-0 h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center text-cyan-500">
                  <Bot className="h-4 w-4 animate-pulse" />
                </div>
                <div className="flex-1 max-w-[85%]">
                  <div className="rounded-2xl rounded-tl-sm bg-surface border border-border/60 px-4 py-3 text-sm text-foreground">
                    {streamingContent ? (
                      <div className="prose prose-sm prose-invert max-w-none [&_pre]:rounded-xl [&_pre]:bg-black/40 [&_code]:text-violet-400 [&_code]:text-xs">
                        <MarkdownContent content={streamingContent} />
                        <span className="inline-block w-2 h-4 bg-violet-500 animate-pulse rounded-sm ms-0.5" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs font-bold">المهندس يفكر...</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border/60 p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={canSend ? "اكتب طلبك هنا... مثال: أريد تحسين سرعة تحميل الصور" : "ليس لديك صلاحية الإرسال"}
                disabled={!canSend || isStreaming}
                rows={1}
                className="flex-1 rounded-2xl border border-border/60 bg-surface/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 ring-violet-500/30 resize-none disabled:opacity-50 min-h-[44px] max-h-[120px]"
                style={{ height: "auto" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = Math.min(target.scrollHeight, 120) + "px";
                }}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputValue.trim() || isStreaming || !canSend}
                className="shrink-0 h-11 w-11 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 flex items-center justify-center text-white shadow-md hover:opacity-90 transition disabled:opacity-40"
              >
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* ═══ Right: Context Panel ═══ */}
        <div className="rounded-3xl border border-border/80 bg-surface/60 backdrop-blur-sm shadow-xs overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border/60">
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
    approved: { icon: CheckCircle, color: "text-emerald-500 bg-emerald-500/10", label: "معتمد" },
    running: { icon: Play, color: "text-amber-500 bg-amber-500/10", label: "جاري" },
    testing: { icon: Zap, color: "text-cyan-500 bg-cyan-500/10", label: "اختبار" },
    completed: { icon: CheckCircle, color: "text-emerald-600 bg-emerald-500/10", label: "مكتمل" },
    failed: { icon: XCircle, color: "text-destructive bg-destructive/10", label: "فشل" },
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

/** Simple markdown-to-HTML renderer for AI responses */
function MarkdownContent({ content }: { content: string }) {
  // Simple markdown rendering — handle code blocks, bold, lists
  const html = content
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
