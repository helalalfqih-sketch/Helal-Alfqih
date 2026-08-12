import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Currency } from '../types';
import { formatPrice } from '../lib/currency';
import { Heart, ShoppingCart, Star, Sparkles, Eye, ZoomIn, X, Share2, Check, Flame, AlertTriangle, Clock } from 'lucide-react';

const FALLBACK_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23181825"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2371717a" font-family="sans-serif" font-size="16">لا تتوفر صورة</text></svg>';

interface ProductCardProps {
  product: Product;
  currency: Currency;
  isFavorite: boolean;
  onToggleFavorite: (product: Product) => void;
  onAddToCart: (product: Product, selectedColor?: string, startCoords?: { startX: number; startY: number }) => void;
  onSelectProduct: (product: Product) => void;
  variant?: 'horizontal' | 'grid';
  index?: number;
}

import { getSmartProductFallbackImage, isSvgFallbackOrEmpty } from '@/lib/product-fallback-image';

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
  onSelectProduct,
  variant = 'horizontal',
  index = 0,
}) => {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isQuickAdded, setIsQuickAdded] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product.colors && product.colors.length > 0 ? product.colors[0] : undefined
  );

  useEffect(() => {
    if (product.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    } else {
      setSelectedColor(undefined);
    }
  }, [product]);

  const smartFallback = getSmartProductFallbackImage(product.name, product.category, product.id);

  const images = React.useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();
    const add = (url: string | undefined | null) => {
      if (url && typeof url === 'string') {
        const clean = url.trim();
        if (clean && !clean.startsWith('data:image/svg') && !seen.has(clean)) {
          seen.add(clean);
          list.push(clean);
        }
      }
    };
    add(product.image);
    if (Array.isArray(product.gallery)) {
      product.gallery.forEach(add);
    }
    if (list.length === 0) {
      list.push(smartFallback);
    }
    return list;
  }, [product.image, product.gallery, smartFallback]);

  const rawCurrentImage = images[selectedImageIndex] || product.image;
  const currentImage = (!rawCurrentImage || isSvgFallbackOrEmpty(rawCurrentImage))
    ? smartFallback
    : rawCurrentImage;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: product.name,
      text: `${product.name} - ${product.subtitle || ''}\nالسعر: ${formatPrice(product.priceYER, currency)}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share dismissed or failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2000);
      } catch {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareData.title}\n${shareData.text}\n${shareData.url}`)}`;
        window.open(whatsappUrl, '_blank');
      }
    }
  };
  const discountPercent =
    product.originalPriceYER > product.priceYER
      ? Math.round((1 - product.priceYER / product.originalPriceYER) * 100)
      : null;

  const secondaryImage =
    product.secondaryImage ||
    (product.gallery && product.gallery.length > 0
      ? product.gallery.find((img) => img !== product.image) || (product.gallery.length > 1 ? product.gallery[1] : null)
      : null);

  const badgeText =
    product.discountBadge || (discountPercent ? `خصم ${discountPercent}%` : null);

  // Automated Badges Metadata Computation
  const isBestSeller =
    product.isBestSeller ||
    product.isBestOffer ||
    (product.rating >= 4.8 && product.reviewsCount >= 80) ||
    product.reviewsCount >= 100;

  const isNewArrival =
    product.isNewArrival ||
    product.id === 'prod-5' ||
    product.id === 'prod-6' ||
    product.id === 'prod-7';

  const isLowStock =
    product.inStock !== false &&
    (product.isLowStock ||
      (product.stockCount !== undefined && product.stockCount > 0 && product.stockCount <= 5) ||
      product.id === 'prod-1' ||
      product.id === 'prod-3' ||
      product.id === 'prod-9');

  const stockText =
    product.stockCount !== undefined ? `متبقي ${product.stockCount} قطع` : 'كمية محدودة';

  const containerClasses =
    variant === 'horizontal'
      ? 'snap-start flex-shrink-0 w-[160px] sm:w-[190px] bg-[var(--color-surface-1)] border border-[var(--color-border-default)] hover:border-[#2F6BFF]/60 rounded-2xl flex flex-col justify-between relative group transition-all duration-200 shadow-sm hover:shadow-lg cursor-pointer h-full overflow-hidden'
      : 'bg-[var(--color-surface-1)] border border-[var(--color-border-default)] hover:border-[#2F6BFF]/60 rounded-2xl flex flex-col justify-between relative group transition-all duration-200 shadow-sm hover:shadow-lg w-full cursor-pointer h-full overflow-hidden';

  return (
    <>
      <div
        onClick={() => onSelectProduct(product)}
        className={containerClasses}
      >
        {/* 1. PRODUCT IMAGE CONTAINER (Clean Aspect Ratio) */}
        <div className="relative w-full aspect-4/3 sm:aspect-square bg-[var(--color-surface-2)] p-2 sm:p-3 flex items-center justify-center overflow-hidden">
          {/* Primary Image */}
          <img
            src={currentImage}
            alt={product.name}
            onError={(e) => { e.currentTarget.src = smartFallback; }}
            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />

          {/* Top-Right Promotional Badge (Max 1) */}
          {badgeText && (
            <div className="absolute top-2 right-2 z-10 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm dir-rtl">
              {badgeText}
            </div>
          )}

          {/* Top-Left Favorite Heart Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(product);
            }}
            aria-label="إضافة للمفضلة"
            className={`absolute top-2 left-2 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer border shadow-sm ${
              isFavorite
                ? 'text-rose-500 bg-rose-500/15 border-rose-500/40'
                : 'text-[var(--color-text-secondary)] bg-[var(--color-surface-1)]/80 hover:bg-[var(--color-surface-1)] border-[var(--color-border-default)]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        {/* 2. CONTENT AREA */}
        <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between space-y-2 text-right dir-rtl">
          <div>
            {/* Best seller or new arrival tag (Max 1 secondary badge) */}
            {isBestSeller ? (
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 mb-1">
                <Flame className="w-3 h-3 fill-amber-500" />
                <span>الأكثر مبيعاً</span>
              </div>
            ) : isNewArrival ? (
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-400 mb-1">
                <Sparkles className="w-3 h-3" />
                <span>وصل حديثاً</span>
              </div>
            ) : null}

            {/* Product Name (2 lines max) */}
            <h4 className="font-bold text-xs sm:text-sm text-[var(--color-text-primary)] line-clamp-2 leading-snug group-hover:text-[#2F6BFF] transition-colors">
              {product.name}
            </h4>

            {/* Rating */}
            <div className="flex items-center gap-1 text-[11px] mt-1 text-[var(--color-text-secondary)]">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
              <span className="text-[var(--color-text-primary)] font-bold">{product.rating || '4.8'}</span>
              <span className="text-[var(--color-text-muted)]">({product.reviewsCount || 85})</span>
            </div>
          </div>

          {/* Pricing & Add-to-Cart Button */}
          <div className="pt-2 border-t border-[var(--color-border-subtle)] space-y-2">
            <div className="flex items-baseline justify-between gap-1 flex-wrap">
              <div className="text-sm sm:text-base font-black text-[#2F6BFF]">
                {formatPrice(product.priceYER, currency)}
              </div>
              {product.originalPriceYER > product.priceYER && (
                <div className="text-[11px] text-[var(--color-text-muted)] line-through">
                  {formatPrice(product.originalPriceYER, currency)}
                </div>
              )}
            </div>

            {/* Primary Action Row: Dominant Add-to-Cart & Secondary Quick View */}
            <div className="flex items-center gap-1.5 pt-1">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.92 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(product, selectedColor, { startX: e.clientX, startY: e.clientY });
                  setIsQuickAdded(true);
                  setTimeout(() => setIsQuickAdded(false), 1800);
                }}
                className={`relative flex-1 py-2 px-2.5 rounded-xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer overflow-hidden ${
                  isQuickAdded
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-102'
                    : 'bg-[#2F6BFF] hover:bg-[#2458D8] text-white shadow-sm shadow-blue-600/20'
                }`}
                title="إضافة المنتج للسلة"
              >
                <AnimatePresence mode="wait">
                  {isQuickAdded ? (
                    <motion.div
                      key="added"
                      initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className="flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>تمت الإضافة!</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="add"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1.5"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>إضافة للسلة</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Visual ripple glow when added */}
                {isQuickAdded && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0.8 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 bg-white/30 rounded-full pointer-events-none"
                  />
                )}
              </motion.button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectProduct(product);
                }}
                className="py-2 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-default)] transition-all cursor-pointer shrink-0"
                title="عرض تفاصيل المنتج (عرض سريع)"
              >
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">عرض</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    {/* QUICK VIEW & INTERACTIVE ZOOM LIGHTBOX MODAL */}
    <AnimatePresence>
      {isQuickViewOpen && (
        <motion.div
          key="quickview-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md dir-rtl"
        >
          {/* Backdrop Click to Close */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsQuickViewOpen(false);
            }}
            className="absolute inset-0"
          />

          {/* Modal Dialog Content */}
          <motion.div
            key="quickview-dialog"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-2xl bg-[var(--color-surface-1)] rounded-3xl border border-[var(--color-border-default)] shadow-2xl overflow-hidden flex flex-col md:flex-row text-right"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsQuickViewOpen(false);
              }}
              className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-black/60 text-white hover:bg-rose-600 flex items-center justify-center transition-colors cursor-pointer shadow-lg border border-white/10"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Image & Zoom Inspector Viewport */}
            <div className="w-full md:w-1/2 bg-[var(--color-surface-2)] p-4 flex flex-col items-center justify-center relative min-h-[260px] sm:min-h-[320px] overflow-hidden select-none">
              {/* Interactive Zoom Canvas */}
              <div
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
                onMouseMove={handleMouseMove}
                onTouchStart={() => setIsZooming(true)}
                onTouchEnd={() => setIsZooming(false)}
                onTouchMove={(e) => {
                  if (!e.touches[0]) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
                  const y = ((e.touches[0].clientY - rect.top) / rect.height) * 100;
                  setZoomPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
                }}
                className="relative w-full h-[240px] sm:h-[280px] flex items-center justify-center cursor-crosshair overflow-hidden rounded-2xl bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)]"
                style={{ touchAction: 'pan-y' }}
              >
                <img
                  src={currentImage || FALLBACK_IMAGE}
                  alt={product.name}
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                  className="max-h-full max-w-full object-contain p-2"
                />

                {/* Magnifying Glass Zoom Lens Overlay */}
                {isZooming && (
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-150 rounded-2xl"
                    style={{
                      backgroundImage: `url(${currentImage})`,
                      backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      backgroundSize: '280%',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                )}

                {/* Zoom Lens Hint Badge */}
                <div className="absolute bottom-2 right-2 bg-black/75 text-white text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1.5 pointer-events-none backdrop-blur-md border border-white/10">
                  <ZoomIn className="w-3 h-3 text-blue-400" />
                  <span>حرك الماوس لتكبير التفاصيل (2.8x)</span>
                </div>
              </div>

              {/* Gallery Thumbnails */}
              {images.length > 1 && (
                <div
                  className="flex items-center gap-2 mt-3 overflow-x-auto max-w-full pb-1 px-1"
                  style={{ touchAction: 'pan-x pan-y', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(idx);
                      }}
                      className={`w-12 h-12 rounded-xl border-2 overflow-hidden shrink-0 transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-[#2F6BFF] ring-2 ring-[#2F6BFF]/30 scale-105'
                          : 'border-[var(--color-border-default)] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img || FALLBACK_IMAGE}
                        alt=""
                        onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                        className="w-full h-full object-contain p-0.5 bg-[var(--color-surface-1)]"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Quick Details & Cart Action */}
            <div className="w-full md:w-1/2 p-5 sm:p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2F6BFF] bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                    معاينة وتكبير سريع
                  </span>
                  <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{product.rating || '4.8'}</span>
                  </div>
                </div>

                <h3 className="text-lg font-black text-[var(--color-text-primary)] leading-snug">
                  {product.name}
                </h3>

                <p className="text-xs text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed">
                  {product.description || 'منتج مميز عالي الجودة متاح الآن للطلب المباشر مع التوصيل لكافة المحافظات.'}
                </p>
              </div>

              <div className="space-y-4 pt-3 border-t border-[var(--color-border-subtle)]">
                {/* Colors in Quick View */}
                {product.colors && product.colors.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-[var(--color-text-muted)] font-bold block">
                      اختر اللون:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {product.colors.map((color) => {
                        const isSelected = selectedColor === color;
                        const isWhite =
                          color.toLowerCase() === '#ffffff' ||
                          color.toLowerCase() === '#fff' ||
                          color.toLowerCase() === 'white';
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedColor(color);
                            }}
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl transition-all cursor-pointer flex items-center justify-center relative border ${
                              isSelected
                                ? 'border-[#2F6BFF] ring-2 ring-[#2F6BFF]/40 scale-105'
                                : 'border-[var(--color-border-default)] hover:scale-105 opacity-80 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: color }}
                            title={`اختيار اللون ${color}`}
                          >
                            {isSelected && (
                              <Check className={`w-3.5 h-3.5 ${isWhite ? 'text-black' : 'text-white'}`} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Price */}
                <div>
                  <span className="text-[11px] text-[var(--color-text-muted)] block font-medium">السعر:</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-[var(--color-text-primary)]">
                      {formatPrice(product.priceYER, currency)}
                    </span>
                    {product.originalPriceYER > product.priceYER && (
                      <span className="text-xs text-[var(--color-text-muted)] line-through font-medium">
                        {formatPrice(product.originalPriceYER, currency)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product, selectedColor);
                    }}
                    className="flex-1 bg-gradient-to-r from-[#2F6BFF] to-[#1F5EFF] hover:from-[#2458D8] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>أضف للسلة</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="bg-[var(--color-surface-2)] hover:bg-[#2F6BFF] hover:text-white text-[var(--color-text-primary)] text-xs font-bold py-2.5 px-3 rounded-xl border border-[var(--color-border-default)] transition-all cursor-pointer flex items-center gap-1.5"
                    title="مشاركة المنتج"
                  >
                    {copiedToast ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                    <span className="hidden sm:inline">مشاركة</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsQuickViewOpen(false);
                      onSelectProduct(product);
                    }}
                    className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-primary)] text-xs font-bold py-2.5 px-3 rounded-xl border border-[var(--color-border-default)] transition-all cursor-pointer whitespace-nowrap"
                  >
                    التفاصيل
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};



