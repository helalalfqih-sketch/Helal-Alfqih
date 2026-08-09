import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, Currency } from './types';
import { formatPrice } from './currency';
import { Heart, ShoppingCart, Star, Sparkles, Eye, ZoomIn, X, Share2, Check, Flame, AlertTriangle, Clock } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  currency: Currency;
  isFavorite: boolean;
  onToggleFavorite: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  variant?: 'horizontal' | 'grid';
  index?: number;
}

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

  const images =
    product.gallery && product.gallery.length > 0
      ? [product.image, ...product.gallery.filter((img) => img !== product.image)]
      : [product.image];

  const currentImage = images[selectedImageIndex] || product.image;

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
      ? 'snap-start flex-shrink-0 w-[165px] sm:w-[195px] bg-[var(--color-surface-1)] border border-[var(--color-border-default)] hover:border-[#2F6BFF]/50 rounded-2xl flex flex-col justify-between relative group transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1 shadow-sm hover:shadow-xl cursor-pointer h-full overflow-hidden transform-gpu'
      : 'bg-[var(--color-surface-1)] border border-[var(--color-border-default)] hover:border-[#2F6BFF]/50 rounded-2xl flex flex-col justify-between relative group transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1 shadow-sm hover:shadow-xl w-full cursor-pointer h-full overflow-hidden transform-gpu';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-30px' }}
        whileHover={{ y: -6, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{
          duration: 0.35,
          delay: Math.min((index % 8) * 0.05, 0.3),
          ease: [0.25, 0.1, 0.25, 1.0],
        }}
        onClick={() => onSelectProduct(product)}
        className={containerClasses}
      >
        {/* Glossy Hover Shimmer Effect */}
        <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

        {/* 1. PRODUCT IMAGE AREA WITH FLOATING MOTION & SECONDARY HOVER PREVIEW */}
        <div className="relative w-full h-[130px] sm:h-[155px] bg-gradient-to-b from-[var(--color-surface-2)] to-[var(--color-surface-1)] p-2.5 flex items-center justify-center overflow-hidden group/img">
          {/* Subtle Ambient Radial Glow on Hover */}
          <div className="absolute inset-0 bg-[#2F6BFF]/5 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Primary Image */}
          <img
            src={product.image}
            alt={product.name}
            className={`max-h-full max-w-full object-contain drop-shadow-md group-hover:drop-shadow-2xl transition-all duration-500 ease-in-out transform ${
              secondaryImage ? 'group-hover:opacity-0 group-hover:scale-95' : 'group-hover:scale-105'
            }`}
            loading="lazy"
          />

          {/* Secondary Image Preview on Hover */}
          {secondaryImage && (
            <img
              src={secondaryImage}
              alt={`${product.name} - صورة ثانوية`}
              className="absolute inset-0 max-h-full max-w-full object-contain m-auto p-2.5 transition-all duration-500 ease-in-out transform opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-105 drop-shadow-2xl pointer-events-none"
              loading="lazy"
            />
          )}

          {/* Floating Secondary Image Indicator Badge or Top-Left Automated Badges */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start pointer-events-none">
            {isBestSeller && (
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 dir-rtl border border-amber-300/40">
                <Flame className="w-3 h-3 text-yellow-200 fill-yellow-200" />
                <span>الأكثر مبيعاً</span>
              </div>
            )}
            {isNewArrival && !isBestSeller && (
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 dir-rtl border border-purple-300/40">
                <Sparkles className="w-3 h-3 text-cyan-200" />
                <span>وصل حديثاً</span>
              </div>
            )}
            {secondaryImage && !isBestSeller && !isNewArrival && (
              <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white/90 dir-rtl border border-white/10 opacity-80 group-hover:opacity-100 transition-opacity">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span>معاينة الصور</span>
              </div>
            )}
          </div>

          {/* Floating Quick View Interactive Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImageIndex(0);
              setIsQuickViewOpen(true);
            }}
            className="absolute top-2 right-2 z-20 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-90 flex items-center gap-1.5 bg-black/80 hover:bg-[#2F6BFF] backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg border border-white/20 dir-rtl cursor-pointer"
            title="معاينة سريعة للمنتج"
            aria-label="معاينة سريعة للمنتج"
          >
            <Eye className="w-3.5 h-3.5 text-blue-300 group-hover:text-white" />
            <span className="inline">معاينة</span>
          </button>

          {/* Dedicated Hover 'Quick Add' Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
              setIsQuickAdded(true);
              setTimeout(() => setIsQuickAdded(false), 1800);
            }}
            className={`absolute bottom-2 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-black shadow-xl border cursor-pointer whitespace-nowrap dir-rtl ${
              isQuickAdded
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/40'
                : 'bg-gradient-to-r from-[#2F6BFF] to-cyan-500 hover:from-[#2458D8] hover:to-cyan-600 text-white border-white/20 shadow-blue-500/30'
            }`}
            aria-label="إضافة سريعة بالسلة"
            title="إضافة سريعة إلى السلة"
          >
            {isQuickAdded ? (
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-white" />
                <span>تمت الإضافة!</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-white" />
                <span>إضافة سريعة</span>
              </span>
            )}
          </button>

          {/* Bottom Bar inside Image Frame */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10 dir-rtl pointer-events-none">
            {badgeText ? (
              <div
                className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap pointer-events-auto flex items-center gap-1 animate-pulse"
              >
                <Sparkles className="w-2.5 h-2.5 text-yellow-200" />
                <span>{badgeText}</span>
              </div>
            ) : (
              <div />
            )}

            {/* Actions Group: Share & Favorite */}
            <div className="flex items-center gap-1.5 pointer-events-auto">
              {/* Share Button */}
              <button
                type="button"
                onClick={handleShare}
                aria-label="مشاركة المنتج"
                title="مشاركة المنتج"
                className="w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer border shadow-sm text-[var(--color-text-secondary)] hover:text-[#2F6BFF] bg-[var(--color-surface-1)]/90 border-[var(--color-border-default)] hover:border-blue-300"
              >
                {copiedToast ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Animated Favorite Heart Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(product);
                }}
                aria-label="إضافة للمفضلة"
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer border shadow-sm ${
                  isFavorite
                    ? 'text-rose-500 bg-rose-500/15 border-rose-500/40 shadow-rose-500/20'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-surface-1)]/90 border-[var(--color-border-default)] hover:border-rose-300'
                }`}
              >
              <Heart
                className={`w-3.5 h-3.5 transition-colors ${
                  isFavorite ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Divider line separating Image section and Content section */}
      <div className="w-full h-[1px] bg-[var(--color-border-subtle)]" />

      {/* 2. CONTENT AREA */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between space-y-2 text-right dir-rtl">
        {/* Product Name, Automated Badges & Rating */}
        <div>
          {/* Automated Metadata Badges Chips */}
          {(isBestSeller || isNewArrival || isLowStock) && (
            <div className="flex items-center gap-1 flex-wrap mb-1.5">
              {isBestSeller && (
                <span className="inline-flex items-center gap-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 font-extrabold text-[10px] px-1.5 py-0.5 rounded-full">
                  <Flame className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                  <span>الأكثر مبيعاً</span>
                </span>
              )}
              {isNewArrival && (
                <span className="inline-flex items-center gap-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 font-extrabold text-[10px] px-1.5 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                  <span>وصل حديثاً</span>
                </span>
              )}
              {isLowStock && (
                <span className="inline-flex items-center gap-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-extrabold text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>{stockText}</span>
                </span>
              )}
            </div>
          )}

          <h4 className="font-bold text-xs sm:text-sm text-[var(--color-text-primary)] line-clamp-2 group-hover:text-[#2F6BFF] transition-colors leading-snug">
            {product.name}
          </h4>

          {/* Rating & Reviews Row */}
          <div className="flex items-center gap-1.5 text-[11px] mt-1 text-[var(--color-text-secondary)]">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0 animate-pulse" />
            <span className="text-[var(--color-text-primary)] font-bold">{product.rating || '4.8'}</span>
            <span className="text-[var(--color-text-muted)] font-medium">({product.reviewsCount || 120})</span>
          </div>
        </div>

        {/* Pricing Area */}
        <div className="space-y-0.5 pt-1">
          <div className="text-[var(--color-text-primary)] font-black text-sm sm:text-base tracking-tight flex items-baseline gap-1">
            <span>{formatPrice(product.priceYER, currency)}</span>
          </div>
          {product.originalPriceYER > product.priceYER && (
            <div className="text-[var(--color-text-muted)] line-through text-xs font-medium">
              {formatPrice(product.originalPriceYER, currency)}
            </div>
          )}
        </div>

        {/* Action Button: Add to Cart */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className="w-full mt-1 bg-gradient-to-r from-[#2F6BFF] to-[#1F5EFF] hover:from-[#2458D8] hover:to-[#184ACD] text-white text-xs font-bold py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer hover:scale-[1.02] active:scale-95 group/btn whitespace-nowrap"
        >
          <div className="transition-transform duration-200 group-hover/btn:rotate-12 group-hover/btn:scale-110">
            <ShoppingCart className="w-3.5 h-3.5 text-white" />
          </div>
          <span>أضف إلى السلة</span>
        </button>
      </div>
    </motion.div>

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
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
              >
                <img
                  src={currentImage}
                  alt={product.name}
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
                <div className="flex items-center gap-2 mt-3 overflow-x-auto max-w-full pb-1 px-1">
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
                        src={img}
                        alt=""
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
                      onAddToCart(product);
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



