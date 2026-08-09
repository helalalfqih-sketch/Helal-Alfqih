import { useRouterState } from "@tanstack/react-router";
import { lazy, Suspense, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { allProductsQueryOptions } from "@/lib/store.queries";
import type { LegacyProductShape } from "@/lib/data-adapter";
import { useAppearance } from "@/components/appearance-provider";

function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((err) => {
      const reloadKey = "chunk_reload_attempted";
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "1");
        window.location.reload();
        return new Promise(() => {}) as never;
      }
      throw err;
    })
  );
}

const ProductSphereHero = lazyWithRetry(() =>
  import("@/components/product-sphere-hero").then((m) => ({ default: m.ProductSphereHero })),
);

export function PersistentShowcaseCanvas() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const cleanPath = pathname.replace(/^\/app/, "") || "/";
  const isHome = cleanPath === "/";

  const { data: allProductsRaw } = useQuery(allProductsQueryOptions());
  const { settings } = useAppearance();

  const products = (allProductsRaw as LegacyProductShape[] | undefined) ?? [];

  // Only run 3D canvas on non-home pages if hero is enabled and not cinematic
  const shouldRender3D =
    !isHome &&
    settings?.hero?.enabled !== false &&
    settings?.hero?.type !== "cinematic";

  if (!shouldRender3D) return null;

  return (
    <div
      data-persistent-canvas="true"
      className={`transition-opacity duration-500 ${
        isHome
          ? "relative z-10 opacity-100 pointer-events-auto"
          : "absolute inset-0 z-[-999] opacity-0 pointer-events-none h-0 overflow-hidden"
      }`}
    >
      <Suspense fallback={null}>
        <ProductSphereHero products={products} />
      </Suspense>
    </div>
  );
}
