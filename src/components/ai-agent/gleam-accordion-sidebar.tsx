import React, { useState } from "react";
import { ChevronDown, ChevronUp, History, FolderTree, Layers, ShieldCheck, Activity } from "lucide-react";
import { FileExplorer, FileItem } from "@/components/ai-agent/file-explorer";

interface GleamAccordionSidebarProps {
  sessions: any[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  activeFilePath?: string;
  onSelectFile?: (file: FileItem) => void;
  pendingTask?: any;
}

export function GleamAccordionSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  activeFilePath,
  onSelectFile,
  pendingTask,
}: GleamAccordionSidebarProps) {
  const [openContext, setOpenContext] = useState(true);
  const [openSessions, setOpenSessions] = useState(false);
  const [openExplorer, setOpenExplorer] = useState(false);

  return (
    <div className="w-full space-y-3 font-sans dir-rtl">
      {/* 📄 1. Accordion: سياق المشروع (Project Context) */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-3.5 shadow-xl shadow-purple-500/5 transition">
        <button
          type="button"
          onClick={() => setOpenContext((prev) => !prev)}
          className="w-full flex items-center justify-between text-xs font-black text-slate-800 pb-1"
        >
          <span className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-600" />
            سياق المشروع (Project Context)
          </span>
          {openContext ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>

        {openContext && (
          <div className="mt-2 pt-2 border-t border-slate-200/60 space-y-2 text-xs">
            <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">المهمة الحالية</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 font-mono text-[10px] font-bold">
                  {pendingTask?.taskId || "TASK-027"}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-semibold">تحسين أداء صفحة البحث والملاحة السريعة</p>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> مستقر
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 📁 2. Accordion: الجلسات (Sessions Timeline) */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-3.5 shadow-xl shadow-purple-500/5 transition">
        <button
          type="button"
          onClick={() => setOpenSessions((prev) => !prev)}
          className="w-full flex items-center justify-between text-xs font-black text-slate-800 pb-1"
        >
          <span className="flex items-center gap-2">
            <History className="h-4 w-4 text-sky-600" />
            الجلسات ({sessions.length})
          </span>
          {openSessions ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>

        {openSessions && (
          <div className="mt-2 pt-2 border-t border-slate-200/60 space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {sessions.map((sess: any) => (
              <button
                key={sess.id}
                type="button"
                onClick={() => onSelectSession(sess.id)}
                className={`w-full text-right p-2.5 rounded-2xl text-xs transition ${
                  activeSessionId === sess.id
                    ? "bg-purple-600 text-white shadow-md font-bold"
                    : "bg-slate-50/80 hover:bg-slate-100 text-slate-700 border border-slate-200/60"
                }`}
              >
                <div className="truncate text-[11px] font-semibold">{sess.title}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 📂 3. Accordion: مستكشف الملفات (Project Explorer) */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-3.5 shadow-xl shadow-purple-500/5 transition">
        <button
          type="button"
          onClick={() => setOpenExplorer((prev) => !prev)}
          className="w-full flex items-center justify-between text-xs font-black text-slate-800 pb-1"
        >
          <span className="flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-amber-500" />
            مستكشف الملفات (Project Explorer)
          </span>
          {openExplorer ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>

        {openExplorer && (
          <div className="mt-2 pt-2 border-t border-slate-200/60 max-h-96 overflow-y-auto">
            <FileExplorer
              activeFilePath={activeFilePath}
              onSelectFile={onSelectFile}
            />
          </div>
        )}
      </div>
    </div>
  );
}
