import { Component, lazy, Suspense, useRef, useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LegacyProductShape } from "@/lib/data-adapter";
import { ProductOverlay } from "./ProductOverlay";
import { useProductExperience } from "@/hooks/use-product-experience";

const ProductHeroStage = lazy(() =>
  import("./ProductHeroStage").then((module) => ({ default: module.ProductHeroStage })),
);

const AMBIENT_PALETTES = [
  ["rgba(34,211,238,.22)", "rgba(37,99,235,.15)"],
  ["rgba(168,85,247,.22)", "rgba(236,72,153,.13)"],
  ["rgba(251,146,60,.22)", "rgba(239,68,68,.12)"],
  ["rgba(52,211,153,.2)", "rgba(14,165,233,.13)"],
];

function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}

class CanvasErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[WebGL/Canvas Boundary caught error]:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function ImmersiveProductExperience({ products }: { products: LegacyProductShape[] }) {
  const featured = products.filter((product) => product.image).slice(0, 4);
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    setWebglSupported(isWebGLAvailable());
  }, []);

  const controller = useProductExperience(sectionRef, featured.length);
  const active = featured[controller.activeIndex] ?? featured[0];
  const palette = AMBIENT_PALETTES[controller.activeIndex % AMBIENT_PALETTES.length];

  if (!active) return null;

  const htmlFallback = (
    <motion.img
      key={active.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      src={active.image}
      alt={active.name}
      className="absolute inset-0 m-auto max-h-[58%] max-w-[78%] object-contain drop-shadow-[0_35px_45px_rgba(0,0,0,.75)]"
    />
  );

  return (
    <section
      ref={sectionRef}
      aria-label="تجربة المنتجات التفاعلية"
      className="relative z-10 h-[340vh] px-2 sm:px-4"
    >
      <div className="sticky top-0 h-[100svh] py-2 sm:py-4">
        <div
          {...controller.pointerHandlers}
          className="relative h-full min-h-[560px] cursor-grab overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#030711] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)] active:cursor-grabbing sm:rounded-[2.75rem]"
          style={{ touchAction: "pan-y", overscrollBehavior: "contain" }}
        >
          <motion.div
            key={`ambient-${controller.activeIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 72% 24%, ${palette[0]}, transparent 38%), radial-gradient(circle at 20% 82%, ${palette[1]}, transparent 42%)`,
            }}
          />
          <div className="pointer-events-none absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(255,255,255,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.2)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />

          {reduceMotion || !webglSupported ? (
            htmlFallback
          ) : (
            <CanvasErrorBoundary fallback={htmlFallback}>
              <Suspense
                fallback={
                  <div className="absolute inset-0 grid place-items-center text-[10px] font-bold tracking-[0.3em] text-white/50">
                    PREPARING EXPERIENCE
                  </div>
                }
              >
                <ProductHeroStage
                  products={featured}
                  activeIndex={controller.activeIndex}
                  progress={controller.progress}
                  rotation={controller.rotation}
                  stepPhysics={controller.stepPhysics}
                />
              </Suspense>
            </CanvasErrorBoundary>
          )}

          <ProductOverlay
            products={featured}
            activeIndex={controller.activeIndex}
            onSelect={controller.select}
          />
        </div>
      </div>
    </section>
  );
}
