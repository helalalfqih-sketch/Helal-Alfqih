import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  X, 
  Check, 
  Eye, 
  Sliders, 
  CheckCircle2 
} from 'lucide-react';
import { DraftConfig } from '../../types/evolutionStudio';

interface CompareDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  baselineConfig: DraftConfig;
  draftConfig: DraftConfig;
  onConfirmDraft: () => void;
}

export const CompareDiffModal: React.FC<CompareDiffModalProps> = ({
  isOpen,
  onClose,
  baselineConfig,
  draftConfig,
  onConfirmDraft,
}) => {
  const [sliderPos, setSliderPos] = useState(50);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg dir-rtl">
      <div className="bg-[#0e0a24] border border-white/15 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-white text-xs">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#130d2e]">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-bold text-sm text-white">مقارنة قبل وبعد (Before & After Comparison)</h3>
              <span className="text-[10px] text-gray-400">مقارنة بصرية وتكعيبية مباشرة بين النسخة الأصلية والتعديلات المقترحة</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 no-scrollbar">
          
          {/* Split View Mock Canvas */}
          <div className="relative h-[320px] bg-black rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
            
            {/* Left side: Baseline */}
            <div
              className="absolute inset-y-0 left-0 bg-[#060412] flex items-center justify-center border-r border-purple-500/50"
              style={{ width: `${sliderPos}%` }}
            >
              <div className="text-center p-4">
                <span className="bg-gray-800 text-gray-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-gray-700 block mb-2">
                  النسخة الحالية المستقرة (Before)
                </span>
                <div
                  className="w-24 h-24 rounded-2xl mx-auto flex items-center justify-center font-bold text-sm shadow-xl"
                  style={{ backgroundColor: baselineConfig.designTokens.colorPrimary }}
                >
                  الأساسي
                </div>
              </div>
            </div>

            {/* Right side: Draft Proposal */}
            <div
              className="absolute inset-y-0 right-0 bg-[#0b081e] flex items-center justify-center"
              style={{ width: `${100 - sliderPos}%` }}
            >
              <div className="text-center p-4">
                <span className="bg-purple-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-purple-400 block mb-2">
                  المسودة المقترحة (After Draft)
                </span>
                <div
                  className="w-24 h-24 rounded-2xl mx-auto flex items-center justify-center font-bold text-sm shadow-2xl"
                  style={{
                    backgroundColor: draftConfig.designTokens.colorPrimary,
                    borderRadius: draftConfig.designTokens.borderRadius === '2xl' ? '24px' : '12px',
                  }}
                >
                  المعدل ✨
                </div>
              </div>
            </div>

            {/* Draggable Slider Divider */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-purple-400 cursor-ew-resize flex items-center justify-center z-10"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-6 h-6 rounded-full bg-purple-600 border border-white text-white flex items-center justify-center text-[10px] font-bold shadow-lg">
                ↔
              </div>
            </div>
          </div>

          {/* Slider control */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>قبل (النسخة المستقرة)</span>
              <span>اسحب للتحكم بحدود المقارنة ({sliderPos}%)</span>
              <span>بعد (المسودة الجديدة)</span>
            </div>
            <input
              type="range"
              min={10}
              max={90}
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Token Difference Summary Table */}
          <div className="bg-[#120d2e] border border-white/10 rounded-2xl p-3 space-y-2">
            <span className="font-bold text-xs text-purple-300 block">فروقات القيم والمتغيرات البصرية:</span>
            <div className="grid grid-cols-3 gap-2 text-[10px] border-b border-white/10 pb-1.5 font-bold text-gray-400">
              <span>المتغير</span>
              <span>قبل (Baseline)</span>
              <span>بعد (Draft)</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <span className="text-gray-300 font-bold">اللون الرئيسي</span>
              <span className="font-mono text-gray-400">{baselineConfig.designTokens.colorPrimary}</span>
              <span className="font-mono text-purple-300 font-bold">{draftConfig.designTokens.colorPrimary}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <span className="text-gray-300 font-bold">جسيمات الكرة 3D</span>
              <span className="font-mono text-gray-400">{baselineConfig.universe3D.particleDensity}</span>
              <span className="font-mono text-cyan-300 font-bold">{draftConfig.universe3D.particleDensity}</span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-[#130d2e]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-gray-300 hover:text-white font-bold cursor-pointer"
          >
            إغلاق المقارنة
          </button>

          <button
            onClick={() => {
              onConfirmDraft();
              onClose();
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <Check className="w-4 h-4" />
            <span>اعتماد المسودة الحالية ✨</span>
          </button>
        </div>

      </div>
    </div>
  );
};
