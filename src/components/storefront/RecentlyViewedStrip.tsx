import React from 'react';
import { Clock } from 'lucide-react';
import { Product, Currency } from './types';
import { formatPrice } from './currency';

interface RecentlyViewedStripProps {
  products: Product[];
  currency: Currency;
  onSelectProduct: (product: Product) => void;
  onClearHistory?: () => void;
}

export const RecentlyViewedStrip: React.FC<RecentlyViewedStripProps> = ({
  products,
  currency,
  onSelectProduct,
  onClearHistory,
}) => {
  if (!products || products.length === 0) return null;

  return (
    <div className="px-3 sm:px-6 py-4 dir-rtl border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]/30">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-[#2F6BFF]" />
          <h4 className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
            تابع من حيث توقفت
          </h4>
        </div>
        {onClearHistory && (
          <button
            onClick={onClearHistory}
            className="text-[10px] text-[var(--color-text-muted)] hover:text-rose-400 transition-colors cursor-pointer"
          >
            مسح السجل
          </button>
        )}
      </div>

      <div
        className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1"
        style={{ touchAction: 'pan-x pan-y', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => onSelectProduct(product)}
            className="flex items-center gap-2.5 p-2 bg-[var(--color-surface-1)] border border-[var(--color-border-default)] hover:border-[#2F6BFF]/50 rounded-xl shrink-0 cursor-pointer text-right min-w-[170px] max-w-[210px] transition-all hover:scale-102"
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-10 h-10 object-contain rounded-lg bg-[var(--color-surface-2)] p-1 shrink-0"
            />
            <div className="overflow-hidden">
              <h5 className="text-[11px] font-bold text-[var(--color-text-primary)] line-clamp-1">
                {product.name}
              </h5>
              <div className="text-[11px] font-black text-[#2F6BFF] mt-0.5">
                {formatPrice(product.priceYER, currency)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
