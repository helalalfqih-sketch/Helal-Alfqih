import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Check, 
  AlertTriangle, 
  Eye, 
  RefreshCw, 
  ShieldCheck, 
  Zap, 
  HelpCircle,
  Layers
} from 'lucide-react';
import { DraftConfig } from '../../types/evolutionStudio';

interface AICreativeDirectorProps {
  config: DraftConfig;
  onApplyDraftChanges: (updatedConfig: DraftConfig) => void;
}

interface VariantProposal {
  id: 'minimal' | 'premium' | 'experimental';
  title: string;
  badge: string;
  desc: string;
  hypothesis: string;
  risk: 'منخفض' | 'متوسط';
  changes: Partial<DraftConfig>;
}

export const AICreativeDirector: React.FC<AICreativeDirectorProps> = ({
  config,
  onApplyDraftChanges,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProposals, setGeneratedProposals] = useState<VariantProposal[] | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const QUICK_PROMPTS = [
    'اجعل هذه الصفحة أكثر فخامة وتأثيراً 🌙',
    'بسّط بطاقات المنتجات للسرعة والوضوح ⚡',
    'حسّن أداء كرة المنتجات 3D للهواتف 📱',
    'اجعل زر الشراء أكثر بروزاً ووضوحاً 🛒',
    'أنشئ مظهر تحويل عالي التباين والإتاحة ♿',
  ];

  const handleGenerate = (customPrompt?: string) => {
    const text = customPrompt || promptInput;
    if (!text.trim()) return;

    setIsGenerating(true);
    setGeneratedProposals(null);

    // Simulate intelligent AI Creative Director generation
    setTimeout(() => {
      const proposals: VariantProposal[] = [
        {
          id: 'minimal',
          title: 'المسار الأول: الهادئ والمبسط (Minimal)',
          badge: 'سرعة + وضوح',
          desc: 'تركيز على بساطة العناصر وإزالة الضوضاء البصرية مع ألوان مريحة للعين',
          hypothesis: 'قد يحسن نسبة استكمال الشراء وسرعة التصفح لعملاء الهواتف',
          risk: 'منخفض',
          changes: {
            designTokens: {
              ...config.designTokens,
              borderRadius: 'xl',
              shadowLevel: 'subtle',
              glassBlur: 8,
            },
            universe3D: {
              ...config.universe3D,
              particleDensity: 2000,
              orbitSpeed: 0.1,
            },
          },
        },
        {
          id: 'premium',
          title: 'المسار الثاني: الفاخر الملكي (Premium)',
          badge: 'فخامة كوكبية',
          desc: 'تفعيل الظلال الذهبية والأرجوانية العميقة مع إضاءة نيون هولوغرافية مكثفة',
          hypothesis: 'يرفع القيمة المدركة للمنتجات ذات السعر العالي والساعات الذكية',
          risk: 'منخفض',
          changes: {
            designTokens: {
              ...config.designTokens,
              colorPrimary: '#D97706',
              colorAccent: '#F59E0B',
              colorBackground: '#030208',
              colorSurface: '#0A0814',
              borderRadius: '2xl',
              shadowLevel: 'cosmic',
              glassBlur: 20,
            },
            universe3D: {
              ...config.universe3D,
              particleDensity: 3800,
              bloomIntensity: 1.2,
              orbitColor: '#f59e0b',
            },
          },
        },
        {
          id: 'experimental',
          title: 'المسار الثالث: التجريبي المبتكر (Experimental)',
          badge: 'تفاعلي نيون',
          desc: 'مدارات متعددة مع ألوان تباين أزرق وتركيز على حواف ناعمة جداً',
          hypothesis: 'يزيد التفاعل والاستكشاف للجيل الشاب ومحبي الإلكترونيات',
          risk: 'متوسط',
          changes: {
            designTokens: {
              ...config.designTokens,
              colorPrimary: '#00f0ff',
              colorSecondary: '#ec4899',
              borderRadius: 'full',
              shadowLevel: 'high',
            },
            universe3D: {
              ...config.universe3D,
              orbitCount: 3,
              orbitSpeed: 0.25,
            },
          },
        },
      ];

      setGeneratedProposals(proposals);
      setIsGenerating(false);
    }, 900);
  };

  const handleApplyProposal = (proposal: VariantProposal) => {
    setSelectedVariant(proposal.id);
    const updated = {
      ...config,
      designTokens: {
        ...config.designTokens,
        ...(proposal.changes.designTokens || {}),
      },
      universe3D: {
        ...config.universe3D,
        ...(proposal.changes.universe3D || {}),
      },
    };
    onApplyDraftChanges(updated);
  };

  return (
    <div className="space-y-4 text-xs text-white dir-rtl">
      
      {/* Header Info */}
      <div className="bg-gradient-to-r from-[#170e3b] to-[#0c0824] border border-purple-500/30 rounded-2xl p-3 shadow-lg">
        <div className="flex items-center gap-2 mb-1.5 font-bold text-purple-300">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <span>المخرج الإبداعي (AI Creative Director)</span>
        </div>
        <p className="text-[11px] text-gray-300 leading-relaxed">
          اكتب هدفك البصري أو التفاعلي، وسيقوم المخرج الذكي بصياغة 3 مسارات آمنة ومدروسة مع فحص المخاطر وفرض حماية منطق التجارة آلياً.
        </p>
      </div>

      {/* Input Box */}
      <div className="bg-[#0e0a24] border border-white/10 rounded-2xl p-3 space-y-2">
        <label className="text-[10px] text-gray-400 block font-bold">ما الذي ترغب في تطويره اليوم؟</label>
        <div className="flex items-center gap-2 bg-black/40 border border-white/15 rounded-xl p-2">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="مثال: اجعل صفحة المنتجات أكثر إبهاراً وتجاوباً..."
            className="flex-1 bg-transparent text-white text-xs focus:outline-none placeholder:text-gray-500"
          />
          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{isGenerating ? 'جاري التحليل...' : 'توليد المقترحات'}</span>
          </button>
        </div>

        {/* Quick Prompts Chips */}
        <div className="pt-2 border-t border-white/5 space-y-1">
          <span className="text-[9px] text-gray-500 block">مقترحات سريعة بنقرة واحدة:</span>
          <div className="flex flex-wrap gap-1">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPromptInput(prompt);
                  handleGenerate(prompt);
                }}
                className="bg-white/5 hover:bg-purple-900/30 text-gray-300 hover:text-purple-300 border border-white/10 p-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-right"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generated Proposals */}
      {generatedProposals && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-300 px-1">
            <span>اختر أحد المقترحات الآمنة للمعاينة الحية:</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              تم اجتياز فحص حماية التجارة
            </span>
          </div>

          <div className="space-y-2.5">
            {generatedProposals.map((prop) => {
              const isApplied = selectedVariant === prop.id;
              return (
                <div
                  key={prop.id}
                  className={`bg-[#120e2e] border rounded-2xl p-3 transition-all ${
                    isApplied
                      ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-emerald-950/20'
                      : 'border-white/10 hover:border-purple-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <div className="font-bold text-xs text-white flex items-center gap-2">
                        <span>{prop.title}</span>
                        <span className="bg-purple-500/20 text-purple-300 text-[9px] px-2 py-0.5 rounded-full border border-purple-500/30">
                          {prop.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-300 mt-0.5">{prop.desc}</p>
                    </div>

                    <button
                      onClick={() => handleApplyProposal(prop)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all ${
                        isApplied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-purple-600 hover:bg-purple-500 text-white'
                      }`}
                    >
                      {isApplied ? <Check className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{isApplied ? 'مُطَبَّق في المعاينة' : 'تطبيق في المعاينة'}</span>
                    </button>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-black/30 p-1.5 rounded-lg border border-white/5">
                      <span className="text-gray-400 block font-bold">الفرضية المتوقعة:</span>
                      <span className="text-gray-200 mt-0.5 block">{prop.hypothesis}</span>
                    </div>
                    <div className="bg-black/30 p-1.5 rounded-lg border border-white/5">
                      <span className="text-gray-400 block font-bold">مستوى المخاطرة:</span>
                      <span className="text-emerald-400 mt-0.5 font-bold block">{prop.risk}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
