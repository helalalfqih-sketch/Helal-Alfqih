import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, Check, X, Link, ShoppingBag, ArrowRight } from 'lucide-react';
import { CartItem, Product } from './types';
import { createCartRecoveryToken, fetchCartFromRecoveryToken } from '@/lib/persistentCart';

interface CartShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  catalogProducts: Product[];
  onApplyRecoveredCart: (items: CartItem[], mode: 'merge' | 'replace') => void;
}

export const CartShareModal: React.FC<CartShareModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  catalogProducts,
  onApplyRecoveredCart,
}) => {
  const [generatedLink, setGeneratedLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Recovery state
  const [recoveryInput, setRecoveryInput] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveredReport, setRecoveredReport] = useState<{
    items: CartItem[];
    priceChanges: { productName: string; oldPrice: number; newPrice: number }[];
    unavailableItems: { productName: string; reason: string }[];
  } | null>(null);

  if (!isOpen) return null;

  const handleGenerateShareLink = async () => {
    if (cartItems.length === 0) return;
    setIsGenerating(true);
    try {
      const tokenId = await createCartRecoveryToken(cartItems);
      const url = `${window.location.origin}${window.location.pathname}?cart_token=${tokenId}`;
      setGeneratedLink(url);
    } catch (err) {
      console.warn('Failed to generate cart share link:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryInput.trim()) return;

    let token = recoveryInput.trim();
    if (token.includes('cart_token=')) {
      token = token.split('cart_token=')[1].split('&')[0];
    }

    setIsRecovering(true);
    const report = await fetchCartFromRecoveryToken(token, catalogProducts);
    setIsRecovering(false);

    if (report && report.items.length > 0) {
      setRecoveredReport(report);
    } else {
      alert('لم يتم العثور على سلة بهذا الرابط أو قد تكون المنتجات غير متوفرة.');
    }
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
          onClick={(e) => e.stopPropagation()}
          className="bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-[28px] w-full max-w-lg p-5 sm:p-7 shadow-2xl dir-rtl relative overflow-y-auto max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-default)] mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">حفظ ومشاركة السلة</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">مشاركة المنتجات أو استعادتها على أي جهاز</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!recoveredReport ? (
            <div className="space-y-6">
              {/* Section 1: Generate Link */}
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)] space-y-3">
                <h4 className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-blue-400" /> مشاركة سلتك الحالية ({cartItems.length} منتج)
                </h4>

                {cartItems.length === 0 ? (
                  <p className="text-xs text-gray-400">سلتك فارغة حالياً. أضف منتجات لتتمكن من مشاركة الرابط.</p>
                ) : !generatedLink ? (
                  <button
                    onClick={handleGenerateShareLink}
                    disabled={isGenerating}
                    className="w-full py-3 rounded-xl bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isGenerating ? 'جاري إنشاء الرابط الآمن...' : 'إنشاء رابط مشاركة آمن'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={generatedLink}
                        className="flex-1 bg-black/30 border border-[var(--color-border-default)] rounded-xl px-3 py-2 text-xs text-blue-300 font-mono dir-ltr truncate"
                      />
                      <button
                        onClick={handleCopy}
                        className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                      </button>
                    </div>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`شاهد محتويات سلة التسوق الخاصة بي في متجر إندكس:\n${generatedLink}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      مشاركة عبر واتساب 💬
                    </a>
                  </div>
                )}
              </div>

              {/* Section 2: Recover Existing Cart */}
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)] space-y-3">
                <h4 className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                  <Link className="w-4 h-4 text-emerald-400" /> استعادة سلة سابقة عبر الرابط
                </h4>

                <form onSubmit={handleRecover} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={recoveryInput}
                    onChange={(e) => setRecoveryInput(e.target.value)}
                    placeholder="الصق رابط السلة أو رمز التوكن هنا..."
                    className="flex-1 bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-xl px-3 py-2.5 text-xs text-[var(--color-text-primary)] focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isRecovering}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all cursor-pointer shrink-0"
                  >
                    {isRecovering ? 'فحص...' : 'استعادة'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* Recovered Cart Confirmation Screen */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs">
                تمت جلب السلة بنجاح برقم ({recoveredReport.items.length} منتج متوفر).
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recoveredReport.items.map((it, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--color-text-primary)]">{it.product.name}</span>
                    <span className="text-emerald-400 font-bold">x{it.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    onApplyRecoveredCart(recoveredReport.items, 'merge');
                    onClose();
                  }}
                  className="flex-1 py-3 rounded-xl bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  <ArrowRight className="w-4 h-4" /> دمج مع سيلتك الحالية
                </button>

                <button
                  onClick={() => {
                    onApplyRecoveredCart(recoveredReport.items, 'replace');
                    onClose();
                  }}
                  className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer"
                >
                  استبدال السلة الحالية
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
