import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { Product, Currency } from '../types';
import { formatPrice } from '../lib/currency';

interface WishlistDrawerProps {
  isOpen: boolean;
  favorites: string[];
  products: Product[];
  currency: Currency;
  onClose: () => void;
  onToggleFavorite: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onSelectProduct: (product: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  favorites,
  products,
  currency,
  onClose,
  onToggleFavorite,
  onAddToCart,
  onSelectProduct,
}) => {
  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="wishlist-drawer-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] overflow-hidden bg-black/80 backdrop-blur-md"
        >
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            key="wishlist-drawer-content"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-y-0 right-0 max-w-full flex pl-10 dir-rtl"
          >
          <div className="w-screen max-w-md bg-[var(--color-surface-1)] border-r border-[var(--color-border-default)] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[var(--color-border-default)] flex items-center justify-between bg-[var(--color-surface-2)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <Heart className="w-5 h-5 fill-rose-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--color-text-primary)]">قائمة المفضلة ({favoriteProducts.length})</h2>
                  <p className="text-xs text-[var(--color-text-muted)]">المنتجات التي قمت بحفظها للرجوع إليها لاحقاً</p>
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="إغلاق"
                className="p-2 rounded-xl bg-[var(--color-surface-3)] hover:bg-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-default)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {favoriteProducts.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-muted)]">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">قائمة المفضلة فارغة حالياً</h3>
                  <p className="text-xs text-[var(--color-text-muted)] max-w-xs mx-auto">
                    تصفح منتجاتنا واضغط على أيقونة القلب على أي منتج لإضافته إلى المفضلة.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-[#2F6BFF] hover:bg-[#2458D8] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm active:scale-97 transition-all"
                  >
                    <span>تصفح المنتجات</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              ) : (
                favoriteProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => onSelectProduct(product)}
                    className="bg-[var(--color-surface-2)] border border-[var(--color-border-default)] hover:border-[#2F6BFF]/40 rounded-2xl p-3 flex items-center gap-3 cursor-pointer group transition-all"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-16 object-contain rounded-xl bg-[var(--color-surface-3)] p-1 border border-[var(--color-border-subtle)]"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[var(--color-text-primary)] line-clamp-1 group-hover:text-[#2F6BFF] transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-1">{product.subtitle}</p>
                      <div className="text-[#2F6BFF] font-extrabold text-xs mt-1">
                        {formatPrice(product.priceYER, currency)}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onAddToCart(product, 1)}
                        className="p-2 rounded-xl bg-[#2F6BFF] hover:bg-[#2458D8] text-white shadow-sm cursor-pointer"
                        title="أضف إلى السلة"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onToggleFavorite(product)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 cursor-pointer"
                        title="إزالة من المفضلة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
