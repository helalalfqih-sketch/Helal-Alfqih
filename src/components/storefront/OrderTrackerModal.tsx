import React, { useState } from "react";
import { OrderStatus, Currency } from "./types";
import { formatPrice } from "./currency";
import { STORE_INFO } from "./constants";

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allOrders: OrderStatus[];
  currency: Currency;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  allOrders,
  currency,
}) => {
  const [orderNumInput, setOrderNumInput] = useState("");
  const [phoneLast4Input, setPhoneLast4Input] = useState("");
  const [foundOrder, setFoundOrder] = useState<OrderStatus | null>(null);
  const [searched, setSearched] = useState(false);

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
    { key: "received", label: "تم استلام الطلب", icon: "receipt" },
    { key: "processing", label: "قيد التجهيز", icon: "inventory_2" },
    { key: "shipped", label: "تم الشحن", icon: "local_shipping" },
    { key: "out_for_delivery", label: "جاري التوصيل", icon: "two_wheeler" },
    { key: "delivered", label: "تم التسليم", icon: "verified" },
  ];

  const getStepIndex = (status: OrderStatus["status"]) => {
    switch (status) {
      case "received":
        return 0;
      case "processing":
        return 1;
      case "shipped":
        return 2;
      case "out_for_delivery":
        return 3;
      case "delivered":
        return 4;
      default:
        return 0;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--color-surface-1)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] rounded-[28px] sm:rounded-[32px] w-full max-w-lg p-5 sm:p-7 relative shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar dir-rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-default)] mb-5">
          <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2F6BFF] text-[26px]">package_2</span>
            <span>تتبع طلبك</span>
          </h3>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="w-9 h-9 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-3.5 mb-5">
          <div>
            <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1.5">
              رقم الطلب (مثال: IND-8921)
            </label>
            <input
              type="text"
              required
              value={orderNumInput}
              onChange={(e) => setOrderNumInput(e.target.value)}
              placeholder="IND-8921"
              className="w-full h-11 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3.5 text-xs sm:text-sm text-[var(--color-text-primary)] uppercase outline-none focus:border-[#2F6BFF] focus:ring-1 focus:ring-[#2F6BFF] transition-all placeholder-[var(--color-text-muted)]"
            />
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1.5">
              آخر 4 أرقام من رقم الهاتف
            </label>
            <input
              type="text"
              maxLength={4}
              value={phoneLast4Input}
              onChange={(e) => setPhoneLast4Input(e.target.value)}
              placeholder="مثال: 4567"
              className="w-full h-11 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3.5 text-xs sm:text-sm text-[var(--color-text-primary)] outline-none focus:border-[#2F6BFF] focus:ring-1 focus:ring-[#2F6BFF] dir-ltr text-right transition-all placeholder-[var(--color-text-muted)]"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-bold py-3 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <span>بحث وتتبع</span>
            <span className="material-symbols-outlined text-[18px]">search</span>
          </button>
        </form>

        {/* Search Result */}
        {searched && (
          <div>
            {foundOrder ? (
              <div className="bg-[var(--color-surface-2)] p-4 sm:p-5 rounded-2xl border border-[var(--color-border-default)] space-y-4">
                <div className="flex justify-between items-center border-b border-[var(--color-border-subtle)] pb-3">
                  <div>
                    <span className="text-[var(--color-text-muted)] text-[11px] block">
                      رقم الطلب
                    </span>
                    <strong className="text-[#2F6BFF] text-base sm:text-lg font-mono font-bold dir-ltr inline-block">
                      {foundOrder.orderNumber}
                    </strong>
                  </div>
                  <div className="text-left">
                    <span className="text-[var(--color-text-muted)] text-[11px] block">
                      تاريخ الطلب
                    </span>
                    <span className="text-[var(--color-text-secondary)] text-xs font-medium">
                      {foundOrder.date}
                    </span>
                  </div>
                </div>

                <div className="bg-[var(--color-surface-1)] p-3 rounded-xl border border-[var(--color-border-subtle)]">
                  <span className="text-xs text-[var(--color-text-muted)] block mb-0.5">
                    حالة الطلب الحالية:
                  </span>
                  <span className="text-[#2F6BFF] font-bold text-xs sm:text-sm">
                    {foundOrder.statusLabel}
                  </span>
                </div>

                {/* Progress Steps */}
                <div className="pt-1">
                  <h4 className="text-xs font-bold text-[var(--color-text-secondary)] mb-3">
                    مراحل التوصيل:
                  </h4>
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
                                ? "bg-[#2F6BFF] border-[#2F6BFF] text-white shadow-sm"
                                : "bg-[var(--color-surface-3)] border-[var(--color-border-subtle)] text-[var(--color-text-muted)]"
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
                                  ? "text-[#2F6BFF] font-bold text-xs sm:text-sm"
                                  : isCompleted
                                    ? "text-[var(--color-text-primary)] font-semibold"
                                    : "text-[var(--color-text-muted)]"
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
                    <strong className="text-[var(--color-text-primary)]">العميل:</strong>{" "}
                    {foundOrder.customerName}
                  </p>
                  <p>
                    <strong className="text-[var(--color-text-primary)]">العنوان:</strong>{" "}
                    {foundOrder.governorate} - {foundOrder.address}
                  </p>
                  <p>
                    <strong className="text-[var(--color-text-primary)]">الإجمالي:</strong>{" "}
                    {formatPrice(foundOrder.totalPriceYER, currency)}
                  </p>
                </div>

                <a
                  href={`https://wa.me/${STORE_INFO.whatsappNumber}?text=${encodeURIComponent(
                    `السلام عليكم، أود الاستفسار عن حالة طلبي رقم ${foundOrder.orderNumber}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-sm mt-2"
                >
                  <span>استفسار مباشر مع خدمة العملاء عبر واتساب</span>
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                </a>
              </div>
            ) : (
              <div className="bg-[var(--color-surface-2)] p-5 rounded-2xl border border-[var(--color-border-default)] text-center text-[var(--color-text-secondary)] text-xs space-y-2">
                <span className="material-symbols-outlined text-[36px] text-[var(--color-text-muted)]">
                  search_off
                </span>
                <p className="font-bold text-[var(--color-text-primary)] text-sm">
                  لم نتمكن من العثور على هذا الطلب
                </p>
                <p className="text-[var(--color-text-muted)]">
                  تأكد من إدخال رقم الطلب بصورة صحيحة (مثال: IND-8921).
                </p>
                <div className="pt-2">
                  <p className="text-[#2F6BFF] font-semibold mb-2">
                    طلبات تجريبية متوفرة للاختبار:
                  </p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setOrderNumInput("IND-8921");
                        setPhoneLast4Input("4567");
                      }}
                      className="bg-[var(--color-surface-1)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-primary)] px-3 py-1.5 rounded-xl border border-[var(--color-border-default)] transition-colors text-xs font-bold cursor-pointer"
                    >
                      جرب طلب IND-8921
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOrderNumInput("IND-7734");
                        setPhoneLast4Input("6543");
                      }}
                      className="bg-[var(--color-surface-1)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-primary)] px-3 py-1.5 rounded-xl border border-[var(--color-border-default)] transition-colors text-xs font-bold cursor-pointer"
                    >
                      جرب طلب IND-7734
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
