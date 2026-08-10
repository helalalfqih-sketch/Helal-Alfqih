import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from './types';
import { HolographicGlobe } from './HolographicGlobe';
import { Sparkles, ChevronLeft, Maximize2, Minimize2, Orbit, ArrowUpRight } from 'lucide-react';

interface HeroCarouselProps {
  products: Product[];
  onSelectCategory: (categoryId: string) => void;
  onSelectProduct: (product: Product) => void;
  onOpenDeconstruction?: () => void;
  onOpenUniverse?: () => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ products,
  onSelectCategory,
  onSelectProduct,
  onOpenDeconstruction,
  onOpenUniverse,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const floatingproducts = products.slice(0, 8);

  return (
    <div className="px-3 sm:px-6 py-2">
      <motion.div
        ref={containerRef}
        layout
        transition={{ type: 'spring', stiffness: 220, damping: 25 }}
        className="relative w-full rounded-[28px] sm:rounded-[36px] overflow-hidden bg-[var(--color-surface-1)]/90 backdrop-blur-md border border-[var(--color-border-default)] shadow-[var(--shadow-md)] p-4 sm:p-7 flex flex-col justify-between relative group"
      >
        {/* Subtle Rim Lighting Highlights */}
        <div className="absolute -top-12 -right-12 w-56 sm:w-80 h-56 sm:h-80 bg-[#2F6BFF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-56 sm:w-80 h-56 sm:h-80 bg-[#38bdf8]/08 rounded-full blur-3xl pointer-events-none" />

        <AnimatePresence mode="wait">
          {!isExpanded ? (
            /* ================= COMPACT HERO BANNER MODE ================= */
            <motion.div
              key="compact-banner"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="relative z-10 flex flex-col justify-between min-h-[160px] sm:min-h-[220px]"
            >
              {/* Top Badges Row: Left "تصفح 3D" & "تفكيك سينمائي 3D", Right "عروض حصرية 50%" */}
              <div className="flex items-center justify-between w-full mb-1 sm:mb-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-sm flex items-center gap-1 transition-all cursor-pointer group/btn"
                  >
                    <Orbit className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#2F6BFF]" />
                    <span>معرض 3D</span>
                  </button>

                  {onOpenDeconstruction && (
                    <button
                      onClick={onOpenDeconstruction}
                      className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-purple-500/30 text-purple-300 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-sm flex items-center gap-1 transition-all cursor-pointer animate-pulse"
                    >
                      <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400" />
                      <span>تفكيك 3D</span>
                    </button>
                  )}
                </div>

                <div className="inline-flex items-center gap-1 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold text-[#2F6BFF]">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  <span>عروض 50%</span>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-5 my-auto w-full">
                {/* Text & CTAs (Top on mobile) */}
                <div className="flex flex-col items-start text-right gap-1 w-full md:max-w-md shrink-0">
                  <div className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#2F6BFF] bg-[#2F6BFF]/10 px-2 py-0.5 rounded-full border border-[#2F6BFF]/20">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    <span>عروض سبتمبر الحصرية</span>
                  </div>

                  <div className="text-lg sm:text-2xl md:text-3xl font-black text-[var(--color-text-primary)] tracking-tight mt-0.5">
                    خصومات تصل إلى <span className="text-[#2F6BFF] font-black text-xl sm:text-3xl">50%</span>
                  </div>

                  <p className="text-[var(--color-text-secondary)] text-[11px] sm:text-sm font-medium leading-normal max-w-xs line-clamp-1 sm:line-clamp-2">
                    تصفح تشكيلة إندكس المتميزة من الساعات والإلكترونيات
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <button
                      onClick={onOpenUniverse || (() => setIsExpanded(true))}
                      className="relative overflow-hidden bg-gradient-to-r from-[#2F6BFF] to-purple-600 hover:from-[#2458D8] hover:to-purple-700 text-white font-black px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-full shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition-all active:scale-95 text-[11px] sm:text-xs cursor-pointer group/cta border border-blue-400/30"
                    >
                      <Orbit className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
                      <span>عالم المنتجات 🌎</span>
                    </button>

                    <button
                      onClick={() => onSelectCategory('all')}
                      aria-label="عرض المنتجات"
                      className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-[11px] sm:text-xs font-bold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border border-[var(--color-border-default)] shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span>عرض الكل</span>
                    </button>
                  </div>
                </div>

                {/* Holographic Globe (Compact mobile container) */}
                <div
                  onClick={() => setIsExpanded(true)}
                  className="relative w-full h-[130px] sm:h-[180px] md:h-[220px] md:w-[220px] lg:h-[260px] lg:w-[260px] flex items-center justify-center shrink-0 my-auto cursor-pointer group/globe transition-transform hover:scale-105"
                  title="اضغط لتوسيع المعرض 3D"
                >
                  <HolographicGlobe
                    products={floatingproducts}
                    onSelectProduct={onSelectProduct}
                    className="w-full h-full"
                    showTitleBadge={false}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            /* ================= FULL EXPANDED 3D GLOBE EXHIBITION MODE ================= */
            <motion.div
              key="expanded-globe"
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              className="relative z-10 flex flex-col items-center justify-between text-center space-y-4 py-2"
            >
              <div className="w-full flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
                <div className="inline-flex items-center gap-2 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] px-3.5 py-1 rounded-full text-xs font-black text-[var(--color-text-primary)] shadow-sm">
                  <Orbit className="w-4 h-4 text-[#2F6BFF] animate-spin" />
                  <span>متجر إندكس — INDEXES STORE</span>
                </div>

                <button
                  onClick={() => setIsExpanded(false)}
                  className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-primary)] text-xs font-black px-3.5 py-1.5 rounded-full border border-[var(--color-border-default)] shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>إغلاق المعرض</span>
                </button>
              </div>

              <div className="space-y-1 max-w-md mx-auto pt-1">
                <h2 className="text-xl sm:text-3xl font-black text-[var(--color-text-primary)] tracking-tight">
                  معرض المنتجات التفاعلي
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] font-medium">
                  اسحب الكرة — كل وجه منتج، اضغط لفتحه واستعراض تفاصيل العرض
                </p>
              </div>

              <div className="my-2 w-full h-[380px] sm:h-[420px] max-w-[480px] mx-auto flex items-center justify-center">
                <HolographicGlobe
                  products={floatingproducts}
                  onSelectProduct={onSelectProduct}
                  className="w-full h-full"
                  showTitleBadge={false}
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => onSelectCategory('offers')}
                  className="bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-extrabold px-5 py-2 rounded-full shadow-md flex items-center gap-2 transition-all active:scale-95 text-xs sm:text-sm cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>تصفح العروض الحصرية</span>
                </button>

                <button
                  onClick={() => setIsExpanded(false)}
                  className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-bold px-4 py-2 rounded-full border border-[var(--color-border-default)] text-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>تصغير</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Carousel Indicators at Bottom */}
        <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2">
          {[0, 1, 2, 3].map((idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`الشريحة ${idx + 1}`}
              className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentSlide
                  ? 'w-5 sm:w-6 bg-[#2F6BFF]'
                  : 'w-1.5 sm:w-2 bg-[var(--color-border-default)] hover:bg-[var(--color-border-strong)]'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};
