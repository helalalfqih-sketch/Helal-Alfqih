import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, Check, X, ShoppingBag } from 'lucide-react';
import { CartItem } from './types';
import { Currency } from './types';

interface CartShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currency?: Currency;
}

export const CartShareModal: React.FC<CartShareModalProps> = ({
  isOpen,
  onClose,
  cartItems,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Build a human-readable WhatsApp-friendly summary of the cart
  const cartSummary = cartItems
    .map((i) => `- ${i.product.name} × ${i.quantity}`)
    .join('\n');

  const shareText = cartItems.length > 0
    ? `مشاركة سلتي من متجر إندكس:\n${cartSummary}\n${window.location.origin}`
    : 'سلتي فارغة في متجر إندكس';

  const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          className="bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-[28px] w-full max-w-lg p-5 sm:p-7 shadow-2xl dir-rtl relative overflow-y-auto max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-default)] mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">مشاركة السلة</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">مشاركة محتويات سلتك عبر واتساب</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {cartItems.length === 0 ? (
            <p className="text-center text-sm text-[var(--color-text-secondary)] py-8">سلتك فارغة حالياً. أضف منتجات أولاً.</p>
          ) : (
            <div className="space-y-4">
              {/* Cart summary */}
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)]">
                <h4 className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5 mb-3">
                  <ShoppingBag className="w-4 h-4 text-blue-400" />
                  محتويات سلتك ({cartItems.length} منتج)
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-[var(--color-text-primary)] font-medium truncate flex-1">{item.product.name}</span>
                      <span className="text-blue-400 font-bold ml-2 shrink-0">× {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Share buttons */}
              <div className="space-y-2">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  مشاركة عبر واتساب 💬
                </a>

                <button
                  onClick={handleCopy}
                  className="w-full py-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 hover:border-blue-400/50"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'تم النسخ!' : 'نسخ النص'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
