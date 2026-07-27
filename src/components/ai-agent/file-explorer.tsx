import React, { useState } from "react";
import { Folder, FolderOpen, FileCode, FileText, ChevronDown, ChevronLeft, Sparkles, Search } from "lucide-react";

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  language?: string;
  children?: FileItem[];
  content?: string;
}

const DEFAULT_PROJECT_FILES: FileItem[] = [
  {
    id: "services-ai-agent",
    name: "src/services/ai-agent",
    path: "src/services/ai-agent",
    type: "directory",
    children: [
      {
        id: "execution-controller",
        name: "execution.controller.ts",
        path: "src/services/ai-agent/execution.controller.ts",
        type: "file",
        language: "typescript",
        content: `// Execution Controller Orchestrator\nexport async function verifyProjectStructure(options) {\n  // Project Verification Logic\n}`,
      },
      {
        id: "journal-service",
        name: "journal.service.ts",
        path: "src/services/ai-agent/journal.service.ts",
        type: "file",
        language: "typescript",
        content: `// Journal Service Log Engine\nexport async function logExecutionJournal(log, customDb) {\n  // Persist execution logs\n}`,
      },
      {
        id: "agent-engine",
        name: "agent.engine.ts",
        path: "src/services/ai-agent/agent.engine.ts",
        type: "file",
        language: "typescript",
      },
    ],
  },
  {
    id: "routes-admin",
    name: "src/routes",
    path: "src/routes",
    type: "directory",
    children: [
      {
        id: "admin-ai-developer",
        name: "admin.ai-developer.tsx",
        path: "src/routes/admin.ai-developer.tsx",
        type: "file",
        language: "typescript",
      },
      {
        id: "admin-studio",
        name: "admin.studio.tsx",
        path: "src/routes/admin.studio.tsx",
        type: "file",
        language: "typescript",
      },
    ],
  },
  {
    id: "lib-functions",
    name: "src/lib",
    path: "src/lib",
    type: "directory",
    children: [
      {
        id: "ai-agent-functions",
        name: "ai-agent.functions.ts",
        path: "src/lib/ai-agent.functions.ts",
        type: "file",
        language: "typescript",
      },
    ],
  },
  {
    id: "config-sql",
    name: "combined_migration.sql",
    path: "combined_migration.sql",
    type: "file",
    language: "sql",
  },
];

interface FileExplorerProps {
  activeFilePath?: string;
  onSelectFile?: (file: FileItem) => void;
}

export function FileExplorer({ activeFilePath, onSelectFile }: FileExplorerProps) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    "services-ai-agent": true,
    "routes-admin": true,
    "lib-functions": true,
  });
  const [filterText, setFilterText] = useState("");

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const renderItem = (item: FileItem) => {
    if (filterText && item.type === "file" && !item.name.toLowerCase().includes(filterText.toLowerCase())) {
      return null;
    }

    if (item.type === "directory") {
      const isOpen = !!openFolders[item.id];
      return (
        <div key={item.id} className="select-none">
          <button
            type="button"
            onClick={() => toggleFolder(item.id)}
            className="flex items-center gap-1.5 w-full text-right px-2 py-1 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition font-mono"
          >
            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            {isOpen ? <FolderOpen className="h-3.5 w-3.5 text-amber-400" /> : <Folder className="h-3.5 w-3.5 text-amber-400/80" />}
            <span>{item.name}</span>
          </button>
          {isOpen && item.children && (
            <div className="mr-3 pr-1 border-r border-zinc-800/60 space-y-0.5 mt-0.5">
              {item.children.map((child) => renderItem(child))}
            </div>
          )}
        </div>
      );
    }

    const isActive = activeFilePath === item.path;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelectFile && onSelectFile(item)}
        className={`flex items-center gap-2 w-full text-right px-2 py-1.5 rounded-lg text-xs font-mono transition ${
          isActive
            ? "bg-violet-500/15 text-violet-300 font-semibold border border-violet-500/30"
            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
        }`}
      >
        <FileCode className={`h-3.5 w-3.5 ${isActive ? "text-violet-400" : "text-zinc-500"}`} />
        <span className="truncate">{item.name}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#121215] rounded-2xl border border-zinc-800/80 p-3 shadow-xl select-none">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 mb-2">
        <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" /> مستكشف الملفات (File Tree)
        </h3>
      </div>

      <div className="relative mb-2">
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="بحث في الملفات..."
          className="w-full bg-[#18181c] border border-zinc-800 rounded-xl px-2.5 py-1 text-[11px] text-zinc-200 outline-none focus:border-violet-500/50"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 dir-ltr">
        {DEFAULT_PROJECT_FILES.map((item) => renderItem(item))}
      </div>
    </div>
  );
}
