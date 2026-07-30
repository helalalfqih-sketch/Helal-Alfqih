import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Box, Move3D, Star } from "lucide-react";
import { formatPrice } from "@/lib/store-data";
import type { LegacyProductShape } from "@/lib/data-adapter";

const SWATCHES = ["#67e8f9", "#a78bfa", "#fb923c", "#34d399"];

type ProductOverlayProps = {
  products: LegacyProductShape[];
  activeIndex: number;
  onSelect: (index: number) => void;
};

export function ProductOverlay({ products, activeIndex, onSelect }: ProductOverlayProps) {
  const product = products[activeIndex] ?? products[0];
  if (!product) return null;

  const features = [
    product.brand && `علامة ${product.brand}`,
    product.stock > 0 ? "متوفر الآن" : "اطلب عند التوفر",
    product.modelUrl ? "نموذج ثلاثي الأبعاد" : "عرض منتج تفاعلي",
  ].filter(Boolean) as string[];

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-5 sm:p-8 lg:p-12">
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[10px] font-bold tracking-[0.22em] text-white/70 backdrop-blur-xl">
          NOQTA / IMMERSIVE {String(activeIndex + 1).padStart(2, "0")}
        </div>
        <div className="hidden items-center gap-2 text-[10px] font-bold text-white/55 sm:flex">
          <Move3D className="h-4 w-4" />
          اسحب للتدوير · مرّر للاستكشاف
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 28, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl text-start"
        >
          <div className="mb-3 flex flex-wrap gap-2">
            {features.map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold text-white/70 backdrop-blur-xl"
              >
                {feature}
              </span>
            ))}
          </div>
          <p className="mb-2 text-[11px] font-bold tracking-[0.28em] text-cyan-300">
            {product.badge || "اختيار اندكس"}
          </p>
          <h1 className="max-w-lg text-3xl font-black leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            {product.name}
          </h1>
          <p className="mt-3 line-clamp-2 max-w-md text-sm leading-7 text-white/62">
            {product.description}
          </p>
          <div className="mt-4 flex items-end gap-4">
            <span className="text-2xl font-black text-white">{formatPrice(product.price)}</span>
            <span className="mb-1 flex items-center gap-1 text-xs text-amber-300">
              <Star className="h-3.5 w-3.5 fill-current" />
              {product.rating}
            </span>
          </div>
          <div className="pointer-events-auto mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/product/$slug"
              params={{ slug: product.slug }}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black text-slate-950 transition hover:scale-[1.03]"
            >
              اكتشف المنتج
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 p-2 backdrop-blur-xl">
              {products.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(index)}
                  aria-label={`عرض ${item.name}`}
                  aria-current={index === activeIndex}
                  className="relative h-7 w-7 rounded-full border border-white/25 transition hover:scale-110"
                  style={{ backgroundColor: SWATCHES[index % SWATCHES.length] }}
                >
                  {index === activeIndex && (
                    <span className="absolute -inset-1 rounded-full border border-white/80" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-6 end-6 hidden flex-col items-center gap-2 text-white/45 md:flex">
        <Box className="h-4 w-4" />
        <div className="h-20 w-px overflow-hidden bg-white/15">
          <motion.div
            key={activeIndex}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            className="h-full origin-top bg-cyan-300"
          />
        </div>
      </div>
    </div>
  );
}
