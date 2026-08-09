import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from './types';

import { HolographicGlobe, HolographicGlobeProduct } from './HolographicGlobe';
import { Sparkles, ChevronLeft, Maximize2, Minimize2, Orbit, ArrowUpRight } from 'lucide-react';

interface HeroCarouselProps {
  products?: Product[];
  onSelectCategory: (categoryId: string) => void;
  onSelectProduct: (product: Product) => void;
  onOpenDeconstruction?: () => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  products = [],
  onSelectCategory,
  onSelectProduct,
  onOpenDeconstruction,
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

  const globeProducts = products.slice(0, 8).map((p) => ({
    id: p.id,
    slug: p.slug || p.id,
    name: p.name,
    image: p.image,
    price: p.priceYER,
  }));

  const handleGlobeSelect = (globeProd: HolographicGlobeProduct) => {
    if (!onSelectProduct) return;
    const found = products.find((p) => p.id === globeProd.id || (p.slug && p.slug === globeProd.slug));
    if (found) {
      onSelectProduct(found);
    } else {
      onSelectProduct({
        id: globeProd.id,
        slug: globeProd.slug,
        name: globeProd.name,
        subtitle: globeProd.name,
        description: globeProd.name,
        priceYER: typeof globeProd.price === 'number' ? globeProd.price : parseFloat(String(globeProd.price)) || 0,
        originalPriceYER: typeof globeProd.price === 'number' ? globeProd.price : parseFloat(String(globeProd.price)) || 0,
        rating: 4.8,
        reviewsCount: 12,
        image: globeProd.image || '',
        category: 'all',
        inStock: true,
      });
    }
  };

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
              className="relative z-10 flex flex-col justify-between min-h-[220px] sm:min-h-[260px]"
            >
              {/* Top Badges Row: Left "تصفح 3D" & "تفكيك سينمائي 3D", Right "عروض حصرية 50%" */}
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 transition-all cursor-pointer group/btn"
                  >
                    <Orbit className="w-3.5 h-3.5 text-[#2F6BFF]" />
                    <span>معرض 3D</span>
                  </button>

                  {onOpenDeconstruction && (
                    <button
                      onClick={onOpenDeconstruction}
                      className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-purple-500/30 text-purple-300 text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 transition-all cursor-pointer animate-pulse"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>تفكيك سينمائي 3D</span>
                    </button>
                  )}
                </div>

                <div className="inline-flex items-center gap-1.5 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold text-[#2F6BFF]">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>عروض حصرية 50%</span>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-5 my-auto w-full">
                {/* Text & CTAs (Top on mobile) */}
                <div className="flex flex-col items-start text-right gap-1.5 w-full md:max-w-md shrink-0">
                  <div className="text-2xl sm:text-4xl font-black text-[var(--color-text-primary)] tracking-tight">
                    خصومات
                  </div>

                  <div className="text-4xl sm:text-7xl font-black text-[var(--color-text-primary)] leading-none my-0.5">
                    %50
                  </div>

                  <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm font-medium leading-relaxed max-w-xs">
                    خصومات تصل إلى النصف على أحدث المنتجات
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => onSelectCategory('offers')}
                      className="relative overflow-hidden bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-black px-4 sm:px-6 py-2.5 rounded-full shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all active:scale-95 text-xs sm:text-sm cursor-pointer group/cta"
                    >
                      {/* Premium Shine Sweep Effect */}
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/cta:animate-shimmer pointer-events-none" />
                      <span>تسوق الآن</span>
                      <ChevronLeft className="w-4 h-4 group-hover/cta:-translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => setIsExpanded(true)}
                      aria-label="توسيع المعرض"
                      className="w-8 h-8 sm:w-9 sm:h-9 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-full border border-[var(--color-border-default)] shadow-sm flex items-center justify-center transition-all cursor-pointer shrink-0"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Holographic Globe (Dedicated full-width space below text on mobile) */}
                <div
                  onClick={() => setIsExpanded(true)}
                  className="relative w-full h-[380px] md:h-[260px] md:w-[260px] lg:h-[300px] lg:w-[300px] flex items-center justify-center shrink-0 my-auto cursor-pointer group/globe transition-transform hover:scale-105"
                  title="اضغط لتوسيع المعرض 3D"
                >
                  <HolographicGlobe
                    products={globeProducts}
                    onSelectProduct={handleGlobeSelect}
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
                  products={globeProducts}
                  onSelectProduct={handleGlobeSelect}
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
