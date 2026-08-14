import React, { useState } from 'react';
import { 
  Inbox, 
  Check, 
  Eye, 
  Sparkles, 
  AlertCircle, 
  TrendingUp, 
  Zap, 
  ArrowLeft 
} from 'lucide-react';
import { InboxSuggestion, DraftConfig } from '../../types/evolutionStudio';
import { DEFAULT_INBOX_SUGGESTIONS } from '../../lib/evolutionStudioStore';

interface ImprovementInboxProps {
  onApplyDraftChanges: (updatedConfig: Partial<DraftConfig>) => void;
}

export const ImprovementInbox: React.FC<ImprovementInboxProps> = ({
  onApplyDraftChanges,
}) => {
  const [suggestions, setSuggestions] = useState<InboxSuggestion[]>(DEFAULT_INBOX_SUGGESTIONS);

  const handleApply = (sug: InboxSuggestion) => {
    if (sug.draftChanges) {
      onApplyDraftChanges(sug.draftChanges);
    }
    setSuggestions((prev) =>
      prev.map((item) => (item.id === sug.id ? { ...item, applied: true } : item))
    );
  };

  return (
    <div className="space-y-4 text-xs text-white dir-rtl">
      
      {/* Header */}
      <div className="bg-[#100d2b] border border-cyan-500/30 rounded-2xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Inbox className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-white">صندوق اقتراحات التطوير</h4>
            <span className="text-[10px] text-gray-400">اقتراحات عالية التأثير محددة بناءً على تحليل سلوك الواجهة</span>
          </div>
        </div>

        <span className="bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
          {suggestions.filter((s) => !s.applied).length} اقتراح معلق
        </span>
      </div>

      {/* Suggestion Cards */}
      <div className="space-y-2.5">
        {suggestions.map((sug) => (
          <div
            key={sug.id}
            className={`bg-[#0e0a24] border rounded-2xl p-3 transition-all ${
              sug.applied ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-white/10 hover:border-cyan-500/40'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-cyan-500/20 text-cyan-300 text-[9px] px-2 py-0.5 rounded-full border border-cyan-500/30 font-bold">
                    {sug.category}
                  </span>
                  <span className="font-bold text-xs text-white">{sug.title}</span>
                </div>
                <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">{sug.evidence}</p>
              </div>

              <button
                onClick={() => handleApply(sug)}
                disabled={sug.applied}
                className={`px-3 py-1.5 rounded-xl font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all shrink-0 ${
                  sug.applied
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
              >
                {sug.applied ? <Check className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{sug.applied ? 'تم التطبيق' : 'معاينة المقترح'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-white/5">
              <div className="bg-black/30 p-1.5 rounded-lg border border-white/5 flex items-center gap-1.5 text-emerald-300 font-bold">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>الفائدة المتوقعة: {sug.expectedBenefit}</span>
              </div>
              <div className="bg-black/30 p-1.5 rounded-lg border border-white/5 flex items-center gap-1.5 text-gray-300">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>المخاطرة والتكلفة: {sug.risk}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
