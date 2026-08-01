import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Terminal,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  Copy,
  Check,
  AlertOctagon,
  AlertTriangle,
  Info,
  ShieldAlert,
  Database,
  Github,
  Monitor,
  Store,
  Server,
  Wrench,
  CheckCircle2,
  Eye,
  X,
  Sparkles,
  Zap,
  ExternalLink,
  Globe,
  TriangleAlert,
  Clock,
} from "lucide-react";
import {
  listLiveLogsFn,
  updateLiveLogStatusFn,
  clearLiveLogsFn,
  SystemLiveLogEntry,
  ErrorTypeCategory,
  ErrorLevel,
  ErrorStatus,
} from "@/services/live-logs.service";
import { reportLiveError } from "@/lib/live-error-capturer";

export const Route = createFileRoute("/admin/live-logs")({
  head: () => ({
    meta: [
      { title: "سجلات الأخطاء المباشرة (Live Logs) — لوحة الإدارة" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLiveLogsPage,
});

function AdminLiveLogsPage() {
  const listLogsServerFn = useServerFn(listLiveLogsFn);
  const updateStatusServerFn = useServerFn(updateLiveLogStatusFn);
  const clearLogsServerFn = useServerFn(clearLiveLogsFn);
  const queryClient = useQueryClient();

  // Filters state
  const [search, setSearch] = useState("");
  const [errorType, setErrorType] = useState<string>("ALL");
  const [level, setLevel] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Selected error for details modal
  const [selectedLog, setSelectedLog] = useState<SystemLiveLogEntry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedBlock, setCopiedBlock] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Query logs with polling support
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["system-live-logs", search, errorType, level, status],
    queryFn: () =>
      listLogsServerFn({
        data: {
          search,
          errorType,
          level,
          status,
          limit: 150,
        },
      }),
    refetchInterval: autoRefresh ? 4000 : false,
  });

  const logs = data?.logs || [];
  const stats = data?.stats || {
    total: 0,
    open: 0,
    fatal: 0,
    adminUi: 0,
    storefrontUi: 0,
    supabaseDb: 0,
    githubIntegration: 0,
    serverFunction: 0,
  };

  const handleUpdateStatus = async (id: string, newStatus: ErrorStatus) => {
    try {
      await updateStatusServerFn({ data: { id, status: newStatus } });
      await queryClient.invalidateQueries({ queryKey: ["system-live-logs"] });
      if (selectedLog && selectedLog.id === id) {
        setSelectedLog((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearLogs = async (mode: "resolved_only" | "all") => {
    if (mode === "all" && !confirm("هل أنت تأكد من تفريغ كافة سجلات الأخطاء؟")) return;
    setIsClearing(true);
    try {
      await clearLogsServerFn({ data: { clearMode: mode } });
      await queryClient.invalidateQueries({ queryKey: ["system-live-logs"] });
      if (selectedLog) setSelectedLog(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsClearing(false);
    }
  };

  const handleTriggerTestError = () => {
    const errorTypesList: ErrorTypeCategory[] = [
      "Admin UI",
      "Storefront UI",
      "Supabase DB",
      "GitHub Integration",
      "Server Function",
    ];
    const randomType = errorTypesList[Math.floor(Math.random() * errorTypesList.length)];

    if (randomType === "Supabase DB") {
      reportLiveError({
        errorName: "SupabaseRLSError [42501]",
        errorType: "Supabase DB",
        level: "error",
        location: "supabase/migrations/products_table",
        cause: "new row violates row-level security policy for table 'products'",
        stackTrace: "PostgrestError: permission denied for table products at fetch (src/lib/order.functions.ts:45)",
        context: { table: "products", action: "INSERT", role: "authenticated" },
      });
    } else if (randomType === "GitHub Integration") {
      reportLiveError({
        errorName: "GitHubApiError [403]",
        errorType: "GitHub Integration",
        level: "error",
        location: "src/services/github-sync.ts",
        cause: "API rate limit exceeded for user ID 849204. Token scope expired.",
        stackTrace: "HttpError: API rate limit exceeded at Octokit.request (node_modules/@octokit/request/dist-src/fetch-wrapper.js:80)",
        context: { endpoint: "GET /user/repos", rateLimitRemaining: 0 },
      });
    } else if (randomType === "Storefront UI") {
      reportLiveError({
        errorName: "TypeError: Cannot read properties of undefined (reading 'price')",
        errorType: "Storefront UI",
        level: "error",
        location: "/store/products/checkout-modal",
        cause: "المكون حاول عرض السعر لمنتج غير مهيأ بعد",
        stackTrace: "TypeError: Cannot read properties of undefined (reading 'price')\n    at ProductPriceTag (src/components/ProductCard.tsx:32:15)\n    at renderWithHooks (node_modules/react-dom/cjs/react-dom.development.js:16305)",
      });
    } else {
      reportLiveError({
        errorName: "ServerFunctionExecutionError",
        errorType: "Server Function",
        level: "fatal",
        location: "src/routes/api/ai.agent.ts",
        cause: "HTTP 500: Server Timeout while invoking Vertex AI API provider",
        stackTrace: "Error: Socket hang up at ServerFnHandler (src/routes/api/ai.agent.ts:112:9)",
        context: { provider: "Google Vertex AI", timeoutMs: 15000 },
      });
    }

    refetch();
  };

  const buildCopyableCodeBlock = (log: SystemLiveLogEntry) => {
    return `\`\`\`json
{
  "id": "${log.id}",
  "error_name": "${log.errorName}",
  "error_type": "${log.errorType}",
  "level": "${log.level}",
  "status": "${log.status}",
  "location": "${log.location}",
  "created_at": "${log.createdAt}",
  "cause": ${JSON.stringify(log.cause)},
  "suggested_fix": ${JSON.stringify(log.suggestedFix)},
  "stack_trace": ${JSON.stringify(log.stackTrace || "N/A")},
  "context": ${JSON.stringify(log.context || {}, null, 2)}
}
\`\`\``;
  };

  const copyToClipboard = (text: string, logId?: string) => {
    navigator.clipboard.writeText(text);
    if (logId) {
      setCopiedId(logId);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedBlock(true);
      setTimeout(() => setCopiedBlock(false), 2000);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "Admin UI":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/30">
            <Monitor className="h-3.5 w-3.5" /> لوحة التحكم
          </span>
        );
      case "Storefront UI":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Store className="h-3.5 w-3.5" /> لوحة العميل (Storefront)
          </span>
        );
      case "Supabase DB":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Database className="h-3.5 w-3.5" /> Supabase DB
          </span>
        );
      case "GitHub Integration":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Github className="h-3.5 w-3.5" /> GitHub API
          </span>
        );
      case "Server Function":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Server className="h-3.5 w-3.5" /> Server Function
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
            <ShieldAlert className="h-3.5 w-3.5" /> {type}
          </span>
        );
    }
  };

  const getLevelBadge = (lvl: ErrorLevel) => {
    switch (lvl) {
      case "fatal":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
            Fatal (حرج)
          </span>
        );
      case "error":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/15 text-red-400 border border-red-500/30">
            Error
          </span>
        );
      case "warn":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Warn
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/15 text-blue-300 border border-blue-500/30">
            Info
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-foreground" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <Terminal className="h-7 w-7 text-emerald-400" />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            سجلات الأخطاء المباشرة (Live Logs Center)
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            تتبع مباشر وتجميعي لكافة الأخطاء في لوحة التحكم، لوحة العميل، Supabase، أخطاء GitHub، والسيرفر مع حلول مقترحة و أكواد قابلة للنسخ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition border ${
              autoRefresh
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-xs"
                : "bg-surface text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${autoRefresh ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
            {autoRefresh ? "البث المباشر (نشط)" : "البث المباشر (متوقف)"}
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-bold hover:bg-accent/80 transition border border-border disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            تحديث الآن
          </button>

          <button
            type="button"
            onClick={handleTriggerTestError}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-xs font-bold text-white hover:opacity-90 transition shadow-xs"
          >
            <Zap className="h-3.5 w-3.5" />
            محاكاة خطأ تجريبي
          </button>

          <button
            type="button"
            onClick={() => handleClearLogs("resolved_only")}
            disabled={isClearing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            تفريغ المحلولة
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="rounded-2xl border border-border bg-surface p-3.5 text-center shadow-xs">
          <div className="text-[11px] text-muted-foreground font-semibold">إجمالي الأخطاء</div>
          <div className="text-xl font-black font-mono mt-1 text-foreground">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-3.5 text-center shadow-xs">
          <div className="text-[11px] text-rose-400 font-semibold">المفتوحة (Open)</div>
          <div className="text-xl font-black font-mono mt-1 text-rose-400">{stats.open}</div>
        </div>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-3.5 text-center shadow-xs">
          <div className="text-[11px] text-red-400 font-semibold">حرج (Fatal)</div>
          <div className="text-xl font-black font-mono mt-1 text-red-400">{stats.fatal}</div>
        </div>
        <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-3.5 text-center shadow-xs">
          <div className="text-[11px] text-violet-400 font-semibold">لوحة التحكم</div>
          <div className="text-xl font-black font-mono mt-1 text-violet-400">{stats.adminUi}</div>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-center shadow-xs">
          <div className="text-[11px] text-amber-400 font-semibold">لوحة العميل</div>
          <div className="text-xl font-black font-mono mt-1 text-amber-400">{stats.storefrontUi}</div>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 text-center shadow-xs">
          <div className="text-[11px] text-emerald-400 font-semibold">Supabase DB</div>
          <div className="text-xl font-black font-mono mt-1 text-emerald-400">{stats.supabaseDb}</div>
        </div>
        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-3.5 text-center shadow-xs">
          <div className="text-[11px] text-purple-400 font-semibold">GitHub APIs</div>
          <div className="text-xl font-black font-mono mt-1 text-purple-400">{stats.githubIntegration}</div>
        </div>
      </div>

      {/* Vercel Live Logs Section */}
      <div className="rounded-2xl border border-[#FF0080]/30 bg-gradient-to-br from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] p-5 shadow-lg overflow-hidden relative">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF0080]/5 via-transparent to-[#0070F3]/5 pointer-events-none" />
        <div className="absolute top-0 right-0 h-px w-full bg-gradient-to-l from-transparent via-[#FF0080]/40 to-transparent" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Left: Vercel branding and info */}
          <div className="flex items-center gap-4">
            {/* Vercel triangle logo */}
            <div className="relative flex-shrink-0">
              <div className="h-12 w-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
                  <path d="M12 1L24 22H0L12 1Z" />
                </svg>
              </div>
              <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-[#0a0a0f] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-sm">Vercel Live Logs</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  ● LIVE
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                سجلات النشر والـ Runtime المباشرة من Vercel — مشروع <span className="text-[#FF0080] font-bold font-mono">indexes-store</span>
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                  <Globe className="h-3 w-3 text-[#0070F3]" />
                  helalalfqih-2473s-projects
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                  <Clock className="h-3 w-3 text-zinc-500" />
                  Real-time streaming
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                  <TriangleAlert className="h-3 w-3 text-amber-400" />
                  Build + Runtime + Edge errors
                </span>
              </div>
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://vercel.com/helalalfqih-2473s-projects/indexes-store/logs?panelState=opened&live=true"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-zinc-950 text-xs font-black hover:bg-zinc-100 transition shadow-md"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M12 1L24 22H0L12 1Z" />
              </svg>
              فتح Vercel Live Logs
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <a
              href="https://vercel.com/helalalfqih-2473s-projects/indexes-store/logs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-bold hover:bg-zinc-700 transition border border-zinc-700"
            >
              <Terminal className="h-3.5 w-3.5" />
              كل السجلات
            </a>

            <a
              href="https://vercel.com/helalalfqih-2473s-projects/indexes-store"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#0070F3]/15 text-[#0070F3] text-xs font-bold hover:bg-[#0070F3]/25 transition border border-[#0070F3]/30"
            >
              <Globe className="h-3.5 w-3.5" />
              لوحة Vercel
            </a>
          </div>
        </div>

        {/* Info row */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="h-8 w-8 rounded-lg bg-[#FF0080]/10 border border-[#FF0080]/30 flex items-center justify-center flex-shrink-0">
              <TriangleAlert className="h-4 w-4 text-[#FF0080]" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 font-semibold">Build Errors</div>
              <div className="text-xs text-zinc-200 font-bold">Deploy & Build failures</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <Server className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 font-semibold">Runtime Logs</div>
              <div className="text-xs text-zinc-200 font-bold">Serverless & Edge functions</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="h-8 w-8 rounded-lg bg-[#0070F3]/10 border border-[#0070F3]/30 flex items-center justify-center flex-shrink-0">
              <Database className="h-4 w-4 text-[#0070F3]" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 font-semibold">Analytics</div>
              <div className="text-xs text-zinc-200 font-bold">Web Vitals & Performance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث بالاسم، السبب، المكان، أو اقتراح الحل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-background pr-9 pl-4 py-2 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <select
            value={errorType}
            onChange={(e) => setErrorType(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">جميع الأنواع</option>
            <option value="Admin UI">لوحة التحكم (Admin UI)</option>
            <option value="Storefront UI">لوحة العميل (Storefront UI)</option>
            <option value="Supabase DB">Supabase DB</option>
            <option value="GitHub Integration">GitHub Integration</option>
            <option value="Server Function">Server Function</option>
          </select>

          {/* Level Filter */}
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">جميع المستويات</option>
            <option value="fatal">Fatal (حرج)</option>
            <option value="error">Error (خطأ)</option>
            <option value="warn">Warn (تحذير)</option>
            <option value="info">Info (معلومة)</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="open">المفتوحة (Open)</option>
            <option value="investigating">قيد التحقيق</option>
            <option value="resolved">المحلولة (Resolved)</option>
          </select>
        </div>
      </div>

      {/* Main Error Logs Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
            <p className="text-xs font-medium">جاري تحميل سجلات الأخطاء الحية...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-foreground">لا توجد أخطاء مسجلة!</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              النظام يعمل بشكل ممتاز بدون أي أخطاء نشطة طابقة لشروط البحث المحددة.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/40 border-b border-border font-bold text-muted-foreground">
                <tr>
                  <th className="p-3.5">اسم الخطأ</th>
                  <th className="p-3.5">نوعه</th>
                  <th className="p-3.5">التاريخ والوقت</th>
                  <th className="p-3.5">موقع الخطأ</th>
                  <th className="p-3.5">سبب الخطأ</th>
                  <th className="p-3.5">اقتراح إصلاح الخطأ</th>
                  <th className="p-3.5 text-center">إجراءات والتفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {logs.map((log) => {
                  const dateStr = new Date(log.createdAt).toLocaleString("ar-EG", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-accent/40 transition ${
                        log.status === "resolved" ? "opacity-60 bg-background/50" : ""
                      }`}
                    >
                      {/* Error Name */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-bold font-mono text-foreground text-xs line-clamp-1" title={log.errorName}>
                            {log.errorName}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {getLevelBadge(log.level)}
                            {log.status === "resolved" && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                تم الحل
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="p-3.5">{getTypeBadge(log.errorType)}</td>

                      {/* Date */}
                      <td className="p-3.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Location */}
                      <td className="p-3.5 max-w-[180px]">
                        <div
                          className="font-mono text-[11px] text-cyan-400 bg-cyan-950/20 border border-cyan-800/40 px-2 py-1 rounded-lg truncate dir-ltr text-left"
                          title={log.location}
                        >
                          📍 {log.location}
                        </div>
                      </td>

                      {/* Cause */}
                      <td className="p-3.5 max-w-[240px]">
                        <p className="text-xs text-foreground line-clamp-2 leading-relaxed" title={log.cause}>
                          {log.cause}
                        </p>
                      </td>

                      {/* Suggested Fix */}
                      <td className="p-3.5 max-w-[260px]">
                        <div className="p-2 rounded-xl bg-violet-950/20 border border-violet-500/30 text-[11px] text-violet-200 line-clamp-2">
                          {log.suggestedFix}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-bold transition"
                            title="عرض التفاصيل والكود القابل للنسخ"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Code Block
                          </button>

                          <button
                            type="button"
                            onClick={() => copyToClipboard(buildCopyableCodeBlock(log), log.id)}
                            className="p-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition"
                            title="نسخ كود الخطأ مباشرة"
                          >
                            {copiedId === log.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {log.status === "open" ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(log.id, "resolved")}
                              className="p-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition"
                              title="تعليم كمحلول"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(log.id, "open")}
                              className="p-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition"
                              title="إعادة الفتح"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Code Block & Detailed Error Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className="relative w-full max-w-3xl rounded-3xl border border-border bg-[#0f0f13] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Terminal className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground flex items-center gap-2 font-mono">
                    {selectedLog.errorName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeBadge(selectedLog.errorType)}
                    {getLevelBadge(selectedLog.level)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error Cause & Location Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-surface border border-border space-y-1">
                <div className="text-muted-foreground font-bold">📍 موقع الخطأ:</div>
                <div className="font-mono text-cyan-400 dir-ltr text-left break-all">{selectedLog.location}</div>
              </div>
              <div className="p-3 rounded-2xl bg-surface border border-border space-y-1">
                <div className="text-muted-foreground font-bold">⏱️ توقيت الحدوث:</div>
                <div className="font-mono text-foreground">{new Date(selectedLog.createdAt).toLocaleString("ar-EG")}</div>
              </div>
            </div>

            {/* Cause Card */}
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-xs space-y-1">
              <div className="font-bold text-rose-300 flex items-center gap-1.5">
                <AlertOctagon className="h-4 w-4" /> سبب الخطأ الصريح:
              </div>
              <p className="text-rose-100 font-medium leading-relaxed">{selectedLog.cause}</p>
            </div>

            {/* Suggested Fix Card */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-1">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <Wrench className="h-4 w-4" /> اقتراح إصلاح الخطأ الموصى به:
              </div>
              <p className="text-emerald-100 font-medium leading-relaxed">{selectedLog.suggestedFix}</p>
            </div>

            {/* Copyable Code Block Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-emerald-400" /> كود الخطأ التفصيلي (Copyable Code Block):
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(buildCopyableCodeBlock(selectedLog))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-bold transition shadow-xs"
                >
                  {copiedBlock ? (
                    <>
                      <Check className="h-4 w-4" /> تم النسخ بنجاح!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> نسخ كود الخطأ الكامل
                    </>
                  )}
                </button>
              </div>

              <pre className="font-mono bg-zinc-950 text-emerald-400 p-4 rounded-2xl text-xs overflow-x-auto select-all dir-ltr text-left border border-zinc-800 leading-relaxed max-h-72">
                {buildCopyableCodeBlock(selectedLog)}
              </pre>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between border-t border-border/60 pt-4 text-xs">
              <div>
                <span className="text-muted-foreground font-semibold">حالة الخطأ: </span>
                <span className="font-bold text-foreground">{selectedLog.status}</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedLog.status === "open" ? (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedLog.id, "resolved")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold hover:bg-emerald-500/30 transition"
                  >
                    <CheckCircle2 className="h-4 w-4" /> تعليم كمحلول
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedLog.id, "open")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold hover:bg-amber-500/30 transition"
                  >
                    <RefreshCw className="h-4 w-4" /> إعادة الفتح
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 rounded-xl bg-accent text-foreground hover:bg-accent/80 font-semibold transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
