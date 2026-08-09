/**
 * Dark, layout-identical placeholders used only on a true first load (no
 * cached catalog data). Every box matches the final rendered geometry so the
 * hero scroll length, globe progress and bottom navigation never shift.
 */
const shimmer =
  "relative overflow-hidden bg-[#0A1020] before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-linear-to-r before:from-transparent before:via-white/5 before:to-transparent";

export function CategoryRailSkeleton() {
  return (
    <div className="flex gap-2.5 overflow-hidden px-3.5 sm:px-4 lg:gap-4 lg:px-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={`cat-skeleton-${i}`}
          className={`h-[104px] w-[90px] shrink-0 rounded-2xl border border-ink-line sm:w-24 lg:h-[116px] lg:w-full lg:flex-1 ${shimmer}`}
        />
      ))}
    </div>
  );
}

export function ProductRailSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={`product-skeleton-${i}`}
          className={`h-[286px] w-[164px] shrink-0 rounded-2xl border border-ink-line ${shimmer}`}
        />
      ))}
    </div>
  );
}
