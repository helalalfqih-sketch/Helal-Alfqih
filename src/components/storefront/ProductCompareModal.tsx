import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ArrowLeftRight, ShoppingCart, Trash2, Star, GripVertical, ChevronRight, ChevronLeft } from 'lucide-react';
import { Product, Currency } from './types';
import { formatPrice } from './currency';

interface ProductCompareModalProps {
  products: Product[];
  compareList: Product[];
  currency: Currency;
  isOpen: boolean;
  onClose: () => void;
  onRemoveFromCompare: (productId: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onReorderCompareList?: (newOrder: Product[]) => void;
}

export const ProductCompareModal: React.FC<ProductCompareModalProps> = ({
  compareList,
  currency,
  isOpen,
  onClose,
  onRemoveFromCompare,
  onAddToCart,
  onReorderCompareList,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleMove = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= compareList.length) return;
    const updated = [...compareList];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    if (onReorderCompareList) {
      onReorderCompareList(updated);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Set transparent drag image or standard drag
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    handleMove(draggedIndex, dropIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="compare-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
        >
          <motion.div
            key="compare-modal-content"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0d0f12] border border-white/10 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl dir-rtl"
          >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-[#12151a]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">مقارنة المنتجات والمواصفات</h2>
                <p className="text-xs text-[#A7ADB7]">يمكنك السحب والإفلات لترتيب المنتجات بسهولة في الجدول</p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="إغلاق"
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-[#A7ADB7] hover:text-white border border-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Comparison Body */}
          <div className="p-4 sm:p-6 overflow-x-auto flex-1 no-scrollbar">
            {compareList.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-[#717784]">
                  <ArrowLeftRight className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white">لا توجد منتجات بالمقارنة حالياً</h3>
                <p className="text-xs text-[#A7ADB7] max-w-sm mx-auto">
                  يمكنك إضافة أي منتج إلى قائمة المقارنة بالنقر على زر المقارنة من تفاصيل المنتج.
                </p>
              </div>
            ) : (
              <div className="min-w-[600px] grid grid-cols-1 md:grid-cols-3 gap-4">
                {compareList.map((product, index) => {
                  const isBeingDragged = draggedIndex === index;
                  const isTargetOver = dragOverIndex === index && draggedIndex !== index;

                  return (
                    <div
                      key={product.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={() => {
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                      }}
                      className={`bg-[#12151a] border rounded-2xl p-4 flex flex-col justify-between space-y-4 relative group transition-all duration-200 cursor-grab active:cursor-grabbing ${
                        isBeingDragged
                          ? 'opacity-40 border-dashed border-blue-500 bg-blue-950/20 scale-98'
                          : isTargetOver
                          ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-900/20 scale-102'
                          : 'border-white/10 hover:border-blue-500/40'
                      }`}
                    >
                      {/* Top Action Bar: Drag Handle, Step Reorder & Remove */}
                      <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-[#A7ADB7]">
                        {/* Drag handle icon */}
                        <div className="flex items-center gap-1 text-[#2F6BFF] font-bold text-[11px] select-none">
                          <GripVertical className="w-4 h-4 text-blue-400" />
                          <span>سحب للترتيب ({index + 1})</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Move Right / Move Left buttons */}
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMove(index, index - 1);
                              }}
                              title="تحريك لليمين"
                              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {index < compareList.length - 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMove(index, index + 1);
                              }}
                              title="تحريك لليسار"
                              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveFromCompare(product.id);
                            }}
                            className="p-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-colors ml-1"
                            title="إزالة من المقارنة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Image & Title */}
                      <div className="text-center space-y-2 pt-1">
                        <div className="w-full h-36 bg-[#181c22] rounded-xl p-2 flex items-center justify-center border border-white/5">
                          <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain" />
                        </div>
                        <h3 className="font-bold text-sm text-white line-clamp-1">{product.name}</h3>
                        <p className="text-xs text-[#A7ADB7] line-clamp-1">{product.subtitle}</p>
                      </div>

                      {/* Specifications List */}
                      <div className="space-y-3 text-xs divide-y divide-white/5 pt-2">
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-[#717784]">السعر الحالي:</span>
                          <span className="font-extrabold text-blue-400 text-sm">
                            {formatPrice(product.priceYER, currency)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-[#717784]">التقييم:</span>
                          <span className="font-bold text-amber-400 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            {product.rating} ({product.reviewsCount})
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-[#717784]">حالة التوفر:</span>
                          <span
                            className={`font-bold ${
                              product.inStock !== false ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {product.inStock !== false ? 'متوفر بالمخزن ✅' : 'غير متوفر ❌'}
                          </span>
                        </div>

                        <div className="pt-2">
                          <span className="text-[#717784] block mb-1">الوصف المختصر:</span>
                          <p className="text-white/80 text-[11px] leading-relaxed line-clamp-3">
                            {product.description}
                          </p>
                        </div>
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => {
                          onAddToCart(product, 1);
                        }}
                        className="w-full bg-[#2F6BFF] hover:bg-[#2458D8] text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>إضافة للسلة</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

