import { DollarSign, Flame, Gift, Home, Shuffle, Sparkles } from "lucide-react";

interface DiscoveryStripProps {
  onSelectDiscoveryOption: (type: string) => void;
  activeFilter: string | null;
  onResetFilter: () => void;
}

const DISCOVERY_OPTIONS = [
  {
    id: "best-selling",
    label: "الأكثر طلباً",
    icon: Flame,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "newest",
    label: "وصل حديثاً",
    icon: Sparkles,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "gift",
    label: "هدية مميزة",
    icon: Gift,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
  {
    id: "home",
    label: "للمنزل",
    icon: Home,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "budget",
    label: "ضمن ميزانيتي",
    icon: DollarSign,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "surprise",
    label: "مفاجأة اليوم",
    icon: Shuffle,
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
] as const;

export function DiscoveryStrip({
  onSelectDiscoveryOption,
  activeFilter,
  onResetFilter,
}: DiscoveryStripProps) {
  return (
    <section className="my-2 border-y border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]/50 px-3 py-3 sm:px-6">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-[#2F6BFF]" />
          <h2 className="text-xs font-bold text-[var(--color-text-primary)] sm:text-sm">
            ماذا تبحث عنه اليوم؟
          </h2>
        </div>
        {activeFilter ? (
          <button
            type="button"
            onClick={onResetFilter}
            className="cursor-pointer text-[11px] font-bold text-rose-400 hover:underline"
          >
            إعادة تعيين
          </button>
        ) : null}
      </div>

      <div className="no-scrollbar flex touch-pan-x items-center gap-2 overflow-x-auto py-1">
        {DISCOVERY_OPTIONS.map(({ id, label, icon: Icon, color }) => {
          const active = activeFilter === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectDiscoveryOption(id)}
              aria-pressed={active}
              className={`flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                active
                  ? "border-[#2F6BFF] bg-[#2F6BFF] text-white shadow-sm"
                  : `${color} hover:opacity-90`
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
