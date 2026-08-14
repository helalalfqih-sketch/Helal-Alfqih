import React, { useState } from 'react';
import { 
  Bot, 
  Play, 
  Square, 
  Sliders, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Eye 
} from 'lucide-react';
import { DraftConfig } from '../../types/evolutionStudio';
import { DEFAULT_DESIGN_TOKENS } from '../../lib/evolutionStudioStore';

interface AutonomousDesignLabProps {
  onApplyDraftChanges: (config: Partial<DraftConfig>) => void;
}

export const AutonomousDesignLab: React.FC<AutonomousDesignLabProps> = ({ onApplyDraftChanges }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [iterationsCompleted, setIterationsCompleted] = useState(0);

  const handleStartLab = () => {
    setIsRunning(true);
    setProgress(0);
    setIterationsCompleted(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          setIterationsCompleted(12);
          return 100;
        }
        return prev + 25;
      });
    }, 600);
  };

  const handleStopLab = () => {
    setIsRunning(false);
  };

  return (
    <div className="space-y-4 text-xs text-white dir-rtl">
      
      {/* Banner */}
      <div className="bg-[#120a2e] border border-purple-500/30 rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white">مختبر الإبداع الذاتي (Autonomous Design Lab)</h4>
              <span className="text-[10px] text-gray-400">استكشاف آلي آمن للتكوينات البصرية خلف الكواليس دون إزعاج العملاء</span>
            </div>
          </div>

          <button
            onClick={isRunning ? handleStopLab : handleStartLab}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
              isRunning
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
            }`}
          >
            {isRunning ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'إيقاف التجربة' : 'بدء المختبر الذاتي'}</span>
          </button>
        </div>

        <div className="bg-black/30 p-2 rounded-xl border border-white/5 flex items-center gap-2 text-[10px] text-gray-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>يعمل المختبر فقط على المسودات الخاصة ولا يقوم بنشر أي تغيير للعملاء إلا بقرار صريح منك.</span>
        </div>
      </div>

      {/* Lab Execution Progress */}
      {isRunning && (
        <div className="bg-[#0e0a24] border border-white/10 rounded-2xl p-3 space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-purple-300">
            <span>جاري استكشاف التكعيبات والتناسق البصري...</span>
            <span>{progress}%</span>
          </div>

          <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[9px] text-gray-400">
            <span>تم اختبار 12 تركيب طيف ألوان وحواف</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Clock className="w-3 h-3" />
              الوقت المتبقي: 3 ثوانٍ
            </span>
          </div>
        </div>
      )}

      {/* Completed Candidates */}
      {iterationsCompleted > 0 && !isRunning && (
        <div className="bg-[#100d2b] border border-emerald-500/30 rounded-2xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>المرشح الأول الأعلى تقييماً (Best Candidate)</span>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
              النتيجة: 96/100
            </span>
          </div>

          <p className="text-[11px] text-gray-300 bg-black/30 p-2 rounded-xl border border-white/5 leading-relaxed">
            تأليف بين التناغم الكوني الأرجواني والإضاءة النيونية المعتدلة مع حواف 24px وانحناء زجاجي 16px. يرفع وضوح زر الشراء بنسبة +18%.
          </p>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() =>
                onApplyDraftChanges({
                  designTokens: {
                    ...DEFAULT_DESIGN_TOKENS,
                    colorPrimary: '#2F6BFF',
                    colorAccent: '#8B5CF6',
                    borderRadius: '2xl',
                    shadowLevel: 'cosmic',
                    glassBlur: 16,
                  },
                })
              }
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>معاينة خيار المختبر المفضل</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
