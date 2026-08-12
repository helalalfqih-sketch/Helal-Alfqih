import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface FloatingWhatsAppButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const FloatingWhatsAppButton: React.FC<FloatingWhatsAppButtonProps> = ({
  isOpen,
  onToggle,
}) => {
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleClick = () => {
    setHasInteracted(true);
    if ('vibrate' in navigator) {
      try { navigator.vibrate(15); } catch (e) {}
    }
    onToggle();
  };

  return (
    <div className="fixed bottom-[calc(84px+env(safe-area-inset-bottom,0px))] sm:bottom-6 left-3 sm:left-6 z-40 flex flex-col items-start gap-2 selection:bg-emerald-500 selection:text-white dir-rtl">
      <div className="relative group">
        {!isOpen && !hasInteracted && (
          <div className="hidden sm:flex absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-[#0d091f]/90 backdrop-blur-md border border-emerald-500/40 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>فتح مركز المساعدة</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleClick}
          aria-label="فتح مركز المساعدة"
          className={`relative min-w-[52px] min-h-[52px] w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all cursor-pointer z-10 border-2 border-white/20 active:scale-95 ${
            isOpen
              ? 'bg-gray-800 text-white shadow-lg'
              : 'bg-gradient-to-tr from-[#1ebd59] via-[#25D366] to-[#34e775] text-white shadow-[0_0_25px_rgba(37,211,102,0.5)] hover:shadow-[0_0_35px_rgba(37,211,102,0.8)] hover:scale-105'
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <div className="relative flex items-center justify-center">
              <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 fill-white/20 text-white" />
              {!hasInteracted && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-emerald-600 rounded-full animate-ping" />
                </span>
              )}
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
