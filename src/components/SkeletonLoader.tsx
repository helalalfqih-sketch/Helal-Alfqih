import React from 'react';

// Product Card Skeleton Loader
export const ProductCardSkeleton: React.FC<{ variant?: 'horizontal' | 'grid' }> = ({
  variant = 'grid',
}) => {
  const containerClasses =
    variant === 'horizontal'
      ? 'snap-start flex-shrink-0 w-[165px] sm:w-[195px] bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between h-[280px] sm:h-[310px] animate-pulse'
      : 'bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between w-full h-[280px] sm:h-[310px] animate-pulse';

  return (
    <div className={containerClasses}>
      {/* Top Badge & Heart Row */}
      <div className="flex items-center justify-between w-full mb-1">
        <div className="w-12 h-3.5 rounded-md bg-[var(--color-surface-2)]" />
        <div className="w-6 h-6 rounded-full bg-[var(--color-surface-2)]" />
      </div>

      {/* Product Image Frame Skeleton */}
      <div className="h-[110px] sm:h-[130px] w-full bg-[var(--color-surface-2)] rounded-xl my-1 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-[var(--color-surface-3)]" />
      </div>

      {/* Text Info Skeletons */}
      <div className="flex flex-col my-1 space-y-1.5 text-right">
        <div className="h-3.5 w-3/4 bg-[var(--color-surface-2)] rounded-md" />
        <div className="h-3 w-1/2 bg-[var(--color-surface-2)] rounded-md" />

        {/* Rating Row Skeleton */}
        <div className="h-3 w-1/3 bg-[var(--color-surface-2)] rounded-md my-0.5" />

        {/* Price Skeleton */}
        <div className="h-4 w-2/5 bg-[var(--color-surface-2)] rounded-md" />
      </div>

      {/* Button CTA Skeleton */}
      <div className="w-full h-8 bg-[var(--color-surface-2)] rounded-xl mt-1" />
    </div>
  );
};

// Hero Carousel Skeleton
export const HeroCarouselSkeleton: React.FC = () => {
  return (
    <div className="px-4 sm:px-6 py-3">
      <div className="w-full rounded-[28px] sm:rounded-[36px] bg-[var(--color-surface-1)] border border-[var(--color-border-default)] p-4 sm:p-7 flex items-center justify-between min-h-[190px] sm:min-h-[250px] animate-pulse">
        <div className="space-y-3 w-1/2">
          <div className="w-24 h-5 rounded-full bg-[var(--color-surface-2)]" />
          <div className="w-32 h-10 rounded-xl bg-[var(--color-surface-2)]" />
          <div className="w-40 h-4 rounded-full bg-[var(--color-surface-2)]" />
          <div className="w-28 h-8 rounded-full bg-[var(--color-surface-2)]" />
        </div>
        <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
          <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-[var(--color-surface-3)]" />
        </div>
      </div>
    </div>
  );
};

// Category Bar Skeleton
export const CategoryBarSkeleton: React.FC = () => {
  return (
    <div className="px-4 sm:px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="flex-shrink-0 w-20 h-10 bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-xl"
        />
      ))}
    </div>
  );
};

// Product Grid Skeleton
export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} variant="grid" />
      ))}
    </div>
  );
};
