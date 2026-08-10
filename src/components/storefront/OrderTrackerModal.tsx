import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderStatus, Currency } from './types';
import { formatPrice } from './currency';
import { STORE_INFO } from './constants';;
import { Search, PackageCheck, CheckCircle2, Phone, X, ShieldCheck } from 'lucide-react';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allOrders: OrderStatus[];
  currency: Currency;
  initialOrderNumber?: string;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  allOrders,
  currency,
  initialOrderNumber,
}) => {
  const [orderNumInput, setOrderNumInput] = useState('');
  const [phoneLast4Input, setPhoneLast4Input] = useState('');
  const [foundOrder, setFoundOrder] = useState<OrderStatus | null>(null);
  const [searched, setSearched] = useState(false);

  // Auto load order if initialOrderNumber is supplied
  useEffect(() => {
    if (!isOpen) return;

    if (initialOrderNumber) {
      setOrderNumInput(initialOrderNumber);
      const match = allOrders.find(
        (o) => o.orderNumber.toLowerCase() === initialOrderNumber.toLowerCase() || o.id === initialOrderNumber
      );
      if (match) {
        setFoundOrder(match);
        setSearched(true);
        return;
      }
    }

    if (orderNumInput) {
      const match = allOrders.find(
        (o) => o.orderNumber.toLowerCase().includes(orderNumInput.toLowerCase().trim())
      );
      if (match) {
        setFoundOrder(match);
        setSearched(true);
      }
    }
  }, [isOpen, initialOrderNumber, allOrders]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);

    const cleanOrderNum = orderNumInput.trim().toUpperCase();
    const cleanPhone4 = phoneLast4Input.trim();

    const match = allOrders.find((ord) => {
      const matchNum = ord.orderNumber.toUpperCase().includes(cleanOrderNum);
      const matchPhone = cleanPhone4 ? ord.phone.endsWith(cleanPhone4) : true;
      return matchNum && matchPhone;
    });

    setFoundOrder(match || null);
  };

  const statusSteps = [
    { key: 'received', label: 'تم استلام الطلب', icon: 'receipt' },
    { key: 'processing', label: 'قيد التجهيز', icon: 'inventory_2' },
    { key: 'shipped', label: 'تم الشحن', icon: 'local_shipping' },
    { key: 'out_for_delivery', label: 'جاري التوصيل', icon: 'two_wheeler' },
    { key: 'delivered', label: 'تم التسليم', icon: 'verified' },
  ];

  const getStepIndex = (status: OrderStatus['status']) => {
    switch (status) {
      case 'received':
        return 0;
      case 'processing':
        return 1;
      case 'shipped':
        return 2;
      case 'out_for_delivery':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 0;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md dir-rtl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--color-surface-1)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] rounded-[28px] sm:rounded-[32px] w-full max-w-lg p-5 sm:p-7 relative shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-default)] mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <PackageCheck className="w-6 h-6 text-[#2F6BFF]" />
                <span>تتبع الطلب والتوصيل المباشر</span>
              </h3>
              <button
                onClick={onClose}
                aria-label="إغلاق"
                className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="space-y-3 mb-5">
              <div>
                <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1">
                  رقم الطلب (مثال: IND-8921)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={orderNumInput}
                    onChange={(e) => setOrderNumInput(e.target.value)}
                    placeholder="IND-8921"
                    className="flex-1 h-10 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3.5 text-xs sm:text-sm text-[var(--color-text-primary)] uppercase outline-none focus:border-[#2F6BFF] transition-all font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <Search className="w-4 h-4" />
                    <span>تتبع</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Direct Result Timeline */}
            {searched && (
              <div>
                {foundOrder ? (
                  <div className="bg-[var(--color-surface-2)] p-4 sm:p-5 rounded-2xl border border-[var(--color-border-default)] space-y-4">
                    <div className="flex justify-between items-center border-b border-[var(--color-border-subtle)] pb-3">
                      <div>
                        <span className="text-[var(--color-text-muted)] text-[11px] block">رقم الطلب</span>
                        <strong className="text-[#2F6BFF] text-base sm:text-lg font-mono font-black dir-ltr inline-block">
                          {foundOrder.orderNumber}
                        </strong>
                      </div>
                      <div className="text-left">
                        <span className="text-[var(--color-text-muted)] text-[11px] block">تاريخ الطلب</span>
                        <span className="text-[var(--color-text-secondary)] text-xs font-medium">{foundOrder.date}</span>
                      </div>
                    </div>

                    <div className="bg-[var(--color-surface-1)] p-3 rounded-xl border border-[var(--color-border-subtle)] flex items-center justify-between">
                      <div>
                        <span className="text-xs text-[var(--color-text-muted)] block mb-0.5">حالة الطلب الحالية:</span>
                        <span className="text-[#2F6BFF] font-black text-xs sm:text-sm">
                          {foundOrder.statusLabel}
                        </span>
                      </div>
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>

                    {/* Progress Steps */}
                    <div className="pt-1">
                      <h4 className="text-xs font-bold text-[var(--color-text-secondary)] mb-3">مراحل التوصيل:</h4>
                      <div className="space-y-3">
                        {statusSteps.map((step, idx) => {
                          const currentIdx = getStepIndex(foundOrder.status);
                          const isCompleted = idx <= currentIdx;
                          const isCurrent = idx === currentIdx;

                          return (
                            <div key={step.key} className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                                  isCompleted
                                    ? 'bg-[#2F6BFF] border-[#2F6BFF] text-white shadow-sm'
                                    : 'bg-[var(--color-surface-3)] border-[var(--color-border-subtle)] text-[var(--color-text-muted)]'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  {step.icon}
                                </span>
                              </div>

                              <div className="flex-grow flex justify-between items-center">
                                <span
                                  className={`text-xs ${
                                    isCurrent
                                      ? 'text-[#2F6BFF] font-bold text-xs sm:text-sm'
                                      : isCompleted
                                      ? 'text-[var(--color-text-primary)] font-semibold'
                                      : 'text-[var(--color-text-muted)]'
                                  }`}
                                >
                                  {step.label}
                                </span>
                                {isCompleted && (
                                  <span className="text-emerald-500 text-xs font-bold">✓ مكتمل</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--color-border-subtle)] text-xs text-[var(--color-text-secondary)] space-y-1">
                      <p>
                        <strong className="text-[var(--color-text-primary)]">العميل:</strong> {foundOrder.customerName}
                      </p>
                      <p>
                        <strong className="text-[var(--color-text-primary)]">العنوان:</strong> {foundOrder.governorate} - {foundOrder.address}
                      </p>
                      <p>
                        <strong className="text-[var(--color-text-primary)]">الإجمالي:</strong> {formatPrice(foundOrder.totalPriceYER, currency)}
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/${STORE_INFO.whatsappNumber}?text=${encodeURIComponent(
                        `السلام عليكم، أود الاستفسار عن حالة طلبي رقم ${foundOrder.orderNumber}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-sm mt-2"
                    >
                      <span>تواصل مع مندوب التوصيل عبر واتساب</span>
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <div className="bg-[var(--color-surface-2)] p-5 rounded-2xl border border-[var(--color-border-default)] text-center text-[var(--color-text-secondary)] text-xs space-y-2">
                    <p className="font-bold text-[var(--color-text-primary)] text-sm">لم نتمكن من العثور على هذا الطلب</p>
                    <p className="text-[var(--color-text-muted)]">تأكد من إدخال رقم الطلب بصورة صحيحة (مثال: IND-8921).</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
