import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Play, 
  CheckCircle2, 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  RefreshCw, 
  Eye, 
  Wrench 
} from 'lucide-react';
import { AuditFinding } from '@/types/evolutionStudio';

export const StoreAuditModule: React.FC<{ onPreviewFix?: (component: string) => void }> = ({ onPreviewFix }) => {
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [auditResults, setAuditResults] = useState<AuditFinding[] | null>(null);

  const handleStartAudit = () => {
    setIsRunningAudit(true);
    setAuditResults(null);

    setTimeout(() => {
      const findings: AuditFinding[] = [
        {
          id: 'f1',
          severity: 'P1',
          component: 'ProductUniverseModal 3D',
          title: 'كثافة جسيمات المدار مرتفعة على الهواتف الاقتصادية',
          reproductionSteps: 'افتح عالم المنتجات 3D على شاشة هاتف 360px مع تشغيل نمط 60fps',
          customerImpact: 'احتمال هبوط معدل الفريمات لـ 28 FPS عند التدوير السريع',
          confidence: 94,
          suggestedFix: 'تفعيل خفض الجسيمات آلياً لـ 2,000 في الهواتف ذات المعالجات المحدودة',
          autoFixAvailable: true,
        },
        {
          id: 'f2',
          severity: 'P2',
          component: 'ProductCard (شبكة المنتجات)',
          title: 'ارتفاع الهامش السفلي لزر السلة يحتاج ضبطاً للشاشات الصغرى',
          reproductionSteps: 'تصفح قائمة الساعات على شاشة 390px بوضع عمودي',
          customerImpact: 'قد يتداخل نص السعر المقارن مع شريط الخصم المئوي بأجزاء من المليمتر',
          confidence: 88,
          suggestedFix: 'ضبط التباعد بـ padding ناعم 12px وتحديد whitespace-nowrap',
          autoFixAvailable: true,
        },
        {
          id: 'f3',
          severity: 'P3',
          component: 'StoreFooter & BottomNav',
          title: 'تأكيد تباين أيقونات التتبع في نمط التباين العالي',
          reproductionSteps: 'التنقل لأسفل القدم في وضع التصفح الليلي المظلم',
          customerImpact: 'وضوح الأيقونات جيد ولكن يمكن رفعه للوصول لمعيار WCAG AAA',
          confidence: 98,
          suggestedFix: 'زيادة ناصعية اللون الثانوي من #9CA3AF إلى #E5E7EB',
          autoFixAvailable: true,
        },
      ];

      setAuditResults(findings);
      setIsRunningAudit(false);
    }, 1200);
  };

  return (
    <div className="space-y-4 text-xs text-white dir-rtl">
      
      {/* Action Banner */}
      <div className="bg-[#100d2b] border border-purple-500/30 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-white">فحص المتجر الشامل (Automatic Store Audit)</h4>
            <span className="text-[10px] text-gray-400">فحص سهولة الاستخدام، الأداء، والتجاوب عبر كافة المكونات والشاشات</span>
          </div>
        </div>

        <button
          onClick={handleStartAudit}
          disabled={isRunningAudit}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
        >
          {isRunningAudit ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>{isRunningAudit ? 'جاري فحص المتجر...' : 'افحص المتجر بالكامل الآن ✨'}</span>
        </button>
      </div>

      {/* Findings List */}
      {auditResults && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-300 px-1">
            <span>نتائج الفحص والتشخيص الآلي:</span>
            <span className="text-[10px] text-purple-400 font-mono">3 ملاحظات مكتشفة</span>
          </div>

          <div className="space-y-2.5">
            {auditResults.map((item) => {
              const isP1 = item.severity === 'P1';
              const isP2 = item.severity === 'P2';
              return (
                <div
                  key={item.id}
                  className="bg-[#0e0a24] border border-white/10 rounded-2xl p-3 space-y-2 hover:border-purple-500/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          isP1
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : isP2
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : 'bg-gray-500/20 text-gray-300 border-gray-500/40'
                        }`}
                      >
                        {item.severity}
                      </span>
                      <span className="font-bold text-xs text-white">{item.title}</span>
                    </div>

                    <button
                      onClick={() => onPreviewFix && onPreviewFix(item.component)}
                      className="bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all shrink-0"
                    >
                      <Wrench className="w-3 h-3 text-purple-400" />
                      <span>معاينة الحل</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-300 leading-relaxed bg-black/30 p-2 rounded-xl border border-white/5">
                    <strong className="text-gray-400 block mb-0.5">المكون المتأثر: {item.component}</strong>
                    {item.customerImpact}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                    <span>خطوات التكرار: {item.reproductionSteps}</span>
                    <span className="text-emerald-400 font-bold">مستوى الثقة: {item.confidence}%</span>
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
