import React, { useEffect, useState } from "react";
import { Search, Terminal, Shield, Sparkles, Code2, Zap, X } from "lucide-react";

interface CommandAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  actions: CommandAction[];
}

export function CommandPalette({ isOpen, onClose, actions }: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        onClose(); // Toggle or open
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm p-4 dir-rtl">
      <div className="w-full max-w-xl bg-[#141418] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-[#18181d]">
          <div className="flex items-center gap-2 w-full">
            <Search className="h-4 w-4 text-violet-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اكتب أمراً أو اختر من قائمة الأوامر (Ctrl+Shift+P)..."
              className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 outline-none py-1"
              autoFocus
            />
          </div>
          <button type="button" onClick={onClose} className="p-1 text-zinc-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-2 max-h-72 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="text-center py-6 text-zinc-500 text-xs">لا توجد أوامر مطابقة للبحث</div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  item.action();
                  onClose();
                }}
                className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-violet-500/10 hover:border-violet-500/30 border border-transparent text-xs text-zinc-200 transition text-right"
              >
                <div className="flex items-center gap-2">
                  <span className="text-violet-400">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.shortcut && (
                  <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700 font-mono">
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
