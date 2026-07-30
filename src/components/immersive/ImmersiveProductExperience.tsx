import { lazy, Suspense, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LegacyProductShape } from "@/lib/data-adapter";
import { ProductOverlay } from "./ProductOverlay";
import { useProductExperience } from "@/hooks/use-product-experience";

const ProductStage3D = lazy(() =>
  import("./ProductStage3D").then((module) => ({ default: module.ProductStage3D })),
);

export function ImmersiveProductExperience({
  products,
}: {
  products: LegacyProductShape[];
}) {
  const featured = products.filter((product) => product.image).slice(0, 4);
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const controller = useProductExperience(sectionRef, featured.length);
  const active = featured[controller.activeIndex] ?? featured[0];

  if (!active) return null;

  return (
    <section
      ref={sectionRef}
      aria-label="تجربة المنتجات التفاعلية"
      className="relative z-10 h-[320vh] px-3 sm:px-4"
    >
      <div className="sticky top-0 h-[100svh] py-3 sm:py-5">
        <div
          {...controller.pointerHandlers}
          className="relative h-full min-h-[560px] cursor-grab overflow-hidden rounded-[2rem] border border-white/10 bg-[#030711] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)] active:cursor-grabbing sm:rounded-[2.75rem]"
          style={{ touchAction: "pan-y", overscrollBehavior: "contain" }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_25%_80%,rgba(168,85,247,0.17),transparent_40%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(255,255,255,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.2)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />

          {reduceMotion ? (
            <motion.img
              key={active.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={active.image}
              alt=""
              className="absolute inset-0 m-auto max-h-[58%] max-w-[78%] object-contain drop-shadow-[0_35px_45px_rgba(0,0,0,.75)]"
            />
          ) : (
            <Suspense
              fallback={
                <div className="absolute inset-0 grid place-items-center text-[10px] font-bold tracking-[0.3em] text-white/50">
                  PREPARING EXPERIENCE
                </div>
              }
            >
              <ProductStage3D
                products={featured}
                activeIndex={controller.activeIndex}
                progress={controller.progress}
                rotation={controller.rotation}
                stepPhysics={controller.stepPhysics}
              />
            </Suspense>
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
