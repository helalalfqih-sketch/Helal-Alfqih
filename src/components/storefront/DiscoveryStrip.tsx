import React from 'react';
import { Sparkles, Flame, Gift, Home, Car, DollarSign, Shuffle } from 'lucide-react';
import { Product } from './types';

interface DiscoveryStripProps {
  onSelectDiscoveryOption: (type: string, value?: string | number) => void;
  activeFilter: string | null;
  onResetFilter: () => void;
}

export const DiscoveryStrip: React.FC<DiscoveryStripProps> = ({
  onSelectDiscoveryOption,
  activeFilter,
  onResetFilter,
}) => {
  const options = [
    { id: 'best-selling', label: 'الأكثر طلباً', icon: Flame, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { id: 'newest', label: 'وصل حديثاً', icon: Sparkles, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { id: 'gift', label: 'هدية مميزة', icon: Gift, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    { id: 'home', label: 'للمنزل', icon: Home, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { id: 'budget', label: 'ضمن ميزانيتي', icon: DollarSign, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { id: 'surprise', label: 'مفاجأة اليوم', icon: Shuffle, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  ];

  return (
    <div className="px-3 sm:px-6 py-3 border-y border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]/50 dir-rtl my-2">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#2F6BFF]" />
          <h4 className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
            ماذا تبحث عنه اليوم؟
          </h4>
        </div>
        {activeFilter && (
          <button
            onClick={onResetFilter}
            className="text-[11px] font-bold text-rose-400 hover:underline cursor-pointer"
          >
            إعادة تعيين
          </button>
        )}
      </div>

      <div
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1"
        style={{ touchAction: 'pan-x pan-y', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = activeFilter === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelectDiscoveryOption(opt.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#2F6BFF] text-white border-[#2F6BFF] shadow-sm'
                  : `${opt.color} hover:opacity-90`
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
