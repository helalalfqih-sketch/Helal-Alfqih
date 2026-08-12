import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, WifiOff, Check, X, ShieldAlert, Settings } from 'lucide-react';
import { useLiteMode, LiteModeSetting } from '../lib/liteMode';

interface LiteModeToggleProps {
  variant?: 'button' | 'badge' | 'full';
}

export const LiteModeToggle: React.FC<LiteModeToggleProps> = ({ variant = 'button' }) => {
  const { pref, setPref, isActive, isOffline } = useLiteMode();
  const [isOpenModal, setIsOpenModal] = useState(false);

  const handleSelectSetting = (setting: LiteModeSetting) => {
    setPref(setting);
    setIsOpenModal(false);
  };

  return (
    <>
      {variant === 'badge' ? (
        <button
          onClick={() => setIsOpenModal(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
            isActive
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
              : 'bg-[var(--color-surface-2)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
          title="إعدادات الوضع الخفيف للإنترنت"
        >
          <Zap className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400 fill-amber-400/20 animate-pulse' : 'text-gray-400'}`} />
          <span>{isActive ? 'الوضع الخفيف' : 'الانترنت العادي'}</span>
          {isOffline && (
            <span className="flex items-center gap-0.5 text-rose-400 text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded-full border border-rose-500/30">
              <WifiOff className="w-3 h-3" /> أوفلاين
            </span>
          )}
        </button>
      ) : variant === 'full' ? (
        <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)] space-y-3 dir-rtl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Zap className="w-5 h-5 fill-amber-400/20" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--color-text-primary)]">الوضع الخفيف (Lite Mode)</h4>
                <p className="text-[11px] text-[var(--color-text-secondary)]">لتسريع التصفح وتوفير بيانات الإنترنت والشبكات الضعيفة</p>
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${isActive ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
              {isActive ? 'مفعل الآن ⚡' : 'معطل'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => setPref('auto')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                pref === 'auto'
                  ? 'bg-[#2F6BFF]/20 border-[#2F6BFF] text-white shadow-md'
                  : 'bg-[var(--color-surface-1)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:border-gray-600'
              }`}
            >
              📱 تلقائي
              <span className="block text-[10px] font-normal text-gray-400 mt-0.5">حسب جودة الاتصال</span>
            </button>
            <button
              onClick={() => setPref('on')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                pref === 'on'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                  : 'bg-[var(--color-surface-1)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:border-gray-600'
              }`}
            >
              ⚡ مفعل دائماً
              <span className="block text-[10px] font-normal text-gray-400 mt-0.5">أسرع أداء وتوفر بيانات</span>
            </button>
            <button
              onClick={() => setPref('off')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                pref === 'off'
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-md'
                  : 'bg-[var(--color-surface-1)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:border-gray-600'
              }`}
            >
              🎨 معطل
              <span className="block text-[10px] font-normal text-gray-400 mt-0.5">عرض المؤثرات الكاملة</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpenModal(true)}
          className={`relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-2xl border transition-all cursor-pointer shrink-0 shadow-sm ${
            isActive
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25'
              : 'bg-[var(--color-surface-2)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
          aria-label="إعدادات الوضع الخفيف"
          title="الوضع الخفيف للإنترنت"
        >
          <Zap className={`w-5 h-5 ${isActive ? 'text-amber-400 fill-amber-400/20' : ''}`} />
          {isActive && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-[var(--color-bg)] animate-pulse" />
          )}
        </button>
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {isOpenModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setIsOpenModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-[28px] w-full max-w-md p-6 shadow-2xl dir-rtl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-default)] mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Zap className="w-5 h-5 fill-amber-400/30" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)]">إعدادات الوضع الخفيف</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">تحسين سرعة التصفح وتوفير البيانات</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpenModal(false)}
                  className="w-9 h-9 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Info */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-5 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-amber-300 mb-0.5">مميزات الوضع الخفيف:</span>
                  يقلل استهلاك الإنترنت، يستبدل العرض ثلاثي الأبعاد بصور خفيفة سريعة التحميل، ويعمل بسلاسة فائقة حتى مع ضعف التغطية.
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleSelectSetting('auto')}
                  className={`w-full p-4 rounded-2xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                    pref === 'auto'
                      ? 'bg-[#2F6BFF]/20 border-[#2F6BFF] text-white shadow-lg shadow-blue-500/10'
                      : 'bg-[var(--color-surface-2)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)]'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
                      <span>📱 وضع الكشف التلقائي</span>
                      {pref === 'auto' && <span className="text-[10px] bg-[#2F6BFF] text-white px-2 py-0.5 rounded-full font-bold">الموصى به</span>}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1">
                      يتكيف تلقائياً مع جودة الاتصال وشبكة الهاتف
                    </div>
                  </div>
                  {pref === 'auto' && <Check className="w-5 h-5 text-[#2F6BFF]" />}
                </button>

                <button
                  onClick={() => handleSelectSetting('on')}
                  className={`w-full p-4 rounded-2xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                    pref === 'on'
                      ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                      : 'bg-[var(--color-surface-2)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)]'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
                      <span>⚡ تفعيل الوضع الخفيف دائماً</span>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1">
                      أقصى سرعة تحميل، إيقاف الفيديوهات والتأثيرات ثقيلة الوزن
                    </div>
                  </div>
                  {pref === 'on' && <Check className="w-5 h-5 text-amber-400" />}
                </button>

                <button
                  onClick={() => handleSelectSetting('off')}
                  className={`w-full p-4 rounded-2xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                    pref === 'off'
                      ? 'bg-purple-500/20 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                      : 'bg-[var(--color-surface-2)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)]'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-[var(--color-text-primary)]">🎨 إيقاف الوضع الخفيف</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1">
                      عرض المؤثرات البصرية كاملة والمجسمات ثلاثية الأبعاد 3D
                    </div>
                  </div>
                  {pref === 'off' && <Check className="w-5 h-5 text-purple-400" />}
                </button>
              </div>

              <button
                onClick={() => setIsOpenModal(false)}
                className="w-full py-3 rounded-2xl bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-bold text-sm transition-all shadow-md cursor-pointer"
              >
                حفظ وإغلاق
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
