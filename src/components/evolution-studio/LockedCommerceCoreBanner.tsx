import React from 'react';
import { Lock, ShieldCheck, Info } from 'lucide-react';

export const LockedCommerceCoreBanner: React.FC<{ compact?: boolean }> = ({ compact }) => {
  return (
    <div className={`bg-[#181124] border border-amber-500/30 rounded-2xl p-3 flex items-start gap-3 shadow-md ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
        <Lock className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0 dir-rtl">
        <div className="flex items-center gap-1.5 font-bold text-amber-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>منطقة تجارية محمية (Locked Commerce Zone)</span>
        </div>
        <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
          هذا الجزء محمي آلياً لأنه يؤثر مباشرة على بيانات العملاء، المعاملات المالية، والأسعار. الاستوديو يسمح فقط بتعديل المظهر البصري والتجربة التفاعلية دون المساس بقواعد الأمان أو الحسابات النهائية للطلبات.
        </p>
      </div>
    </div>
  );
};
