import React, { useState } from "react";
import { CartItem, Currency, OrderStatus } from "./types";
import { formatPrice } from "./currency";
import { STORE_INFO } from "./constants";
import { useAppearance } from "@/components/appearance-provider";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currency: Currency;
  couponDiscountPercent: number;
  onOrderPlaced: (order: OrderStatus) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  currency,
  couponDiscountPercent,
  onOrderPlaced,
}) => {
  const { settings } = useAppearance();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [governorate, setGovernorate] = useState(STORE_INFO.governorates[0]);
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [placedOrder, setPlacedOrder] = useState<OrderStatus | null>(null);

  if (!isOpen) return null;

  const freeThreshold = settings.cart_config?.freeShippingThreshold || STORE_INFO.freeShippingThresholdYER;
  const defaultFee = settings.cart_config?.defaultShippingFee || 3000;

  const subtotalYER = cartItems.reduce(
    (sum, item) => sum + item.product.priceYER * item.quantity,
    0,
  );

  const isFreeShipping = freeThreshold > 0 && subtotalYER >= freeThreshold;
  const shippingFeeYER = isFreeShipping ? 0 : defaultFee;
  const discountAmountYER = (subtotalYER * couponDiscountPercent) / 100;
  const totalYER = subtotalYER - discountAmountYER + shippingFeeYER;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !address) return;

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newOrderNumber = `IND-${randomNum}`;

    let paymentLabel = "الدفع عند الاستلام (نقداً)";
    if (paymentMethod === "kuraimi") paymentLabel = "حساب بنك الكريمي (حاسب)";
    if (paymentMethod === "jawalpay") paymentLabel = "محفظة جوال بي / وان كاش";
    if (paymentMethod === "transfer") paymentLabel = "حوالة صرافة (النجم / المميز)";

    const order: OrderStatus = {
      id: `ord-${Date.now()}`,
      orderNumber: newOrderNumber,
      customerName,
      phone,
      governorate,
      address,
      items: cartItems.map((i) => ({
        productName: i.product.name,
        quantity: i.quantity,
        price: i.product.priceYER,
      })),
      totalPriceYER: totalYER,
      status: "received",
      statusLabel: "تم استلام طلبك بنجاح! جاري التجهيز",
      date: new Date().toLocaleDateString("ar-YE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      paymentMethod: paymentLabel,
    };

    setPlacedOrder(order);
    onOrderPlaced(order);
  };

  const getWhatsappMsg = (order: OrderStatus) => {
    const itemsText = order.items
      .map((i) => `• ${i.productName} (الكمية: ${i.quantity})`)
      .join("\n");

    return encodeURIComponent(
      `🛍️ *طلب جديد من متجر إندكس*\n` +
        `رقم الطلب: *${order.orderNumber}*\n\n` +
        `👤 *الاسم:* ${order.customerName}\n` +
        `📱 *الهاتف:* ${order.phone}\n` +
        `📍 *المحافظة:* ${order.governorate}\n` +
        `🏠 *العنوان:* ${order.address}\n` +
        `💳 *طريقة الدفع:* ${order.paymentMethod}\n\n` +
        `📦 *المنتجات:*\n${itemsText}\n\n` +
        `💰 *الإجمالي النهائي:* ${formatPrice(order.totalPriceYER, currency)}\n` +
        `يرجى تأكيد الشحن والتوصيل، شكراً لكم!`,
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--color-surface-1)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] rounded-[28px] sm:rounded-[32px] w-full max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar p-5 sm:p-7 relative shadow-2xl dir-rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-default)] mb-5">
          <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2F6BFF] text-[26px]">
              local_shipping
            </span>
            <span>إتمام الطلب والتوصيل</span>
          </h3>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="w-9 h-9 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {placedOrder ? (
          /* Order Confirmation View */
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-500">
              <span className="material-symbols-outlined text-[40px]">check_circle</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
              تم تسجيل طلبك بنجاح! 🎉
            </h3>
            <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm">
              رقم الطلب الخاص بك هو:{" "}
              <strong className="text-[#2F6BFF] bg-[#2F6BFF]/10 border border-[#2F6BFF]/20 px-3 py-1 rounded-lg text-base sm:text-lg font-mono font-extrabold dir-ltr inline-block">
                {placedOrder.orderNumber}
              </strong>
            </p>

            <div className="bg-[var(--color-surface-2)] p-4 rounded-2xl border border-[var(--color-border-default)] text-right text-xs space-y-2 text-[var(--color-text-secondary)]">
              <p>
                <strong className="text-[var(--color-text-primary)]">الاسم:</strong>{" "}
                {placedOrder.customerName}
              </p>
              <p>
                <strong className="text-[var(--color-text-primary)]">المحافظة:</strong>{" "}
                {placedOrder.governorate}
              </p>
              <p>
                <strong className="text-[var(--color-text-primary)]">العنوان:</strong>{" "}
                {placedOrder.address}
              </p>
              <p>
                <strong className="text-[var(--color-text-primary)]">طريقة الدفع:</strong>{" "}
                {placedOrder.paymentMethod}
              </p>
              <p className="text-sm font-bold text-[#2F6BFF] pt-2 border-t border-[var(--color-border-subtle)] flex justify-between items-center">
                <span>المبلغ الإجمالي:</span>
                <span className="text-base font-extrabold">
                  {formatPrice(placedOrder.totalPriceYER, currency)}
                </span>
              </p>
            </div>

            <p className="text-[var(--color-text-muted)] text-[11px] sm:text-xs">
              💡 يمكنك تتبع حالة الطلب بأي وقت من خلال صفحة "تتبع الطلب" في حسابك.
            </p>

            <div className="space-y-2.5 pt-1">
              <a
                href={`https://wa.me/${STORE_INFO.whatsappNumber}?text=${getWhatsappMsg(
                  placedOrder,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all text-sm cursor-pointer"
              >
                <span>إرسال تفاصيل الطلب عبر واتساب</span>
                <span className="material-symbols-outlined text-[20px]">chat</span>
              </a>

              <button
                onClick={onClose}
                className="w-full bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-primary)] font-bold py-3 rounded-2xl border border-[var(--color-border-default)] transition-all text-sm cursor-pointer"
              >
                العودة للتسوق
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleSubmit} className="space-y-4 text-right">
            <div>
              <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1.5">
                الاسم الكامل *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="أدخل اسمك الثلاثي"
                className="w-full h-11 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3.5 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[#2F6BFF] focus:ring-1 focus:ring-[#2F6BFF] outline-none transition-all placeholder-[var(--color-text-muted)]"
              />
            </div>

            <div>
              <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1.5">
                رقم الهاتف (الواتساب) *{" "}
                <span className="text-[var(--color-text-muted)] font-normal">
                  (رقم يمني 9 أرقام)
                </span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="771234567"
                className="w-full h-11 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3.5 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[#2F6BFF] focus:ring-1 focus:ring-[#2F6BFF] outline-none dir-ltr text-right transition-all placeholder-[var(--color-text-muted)]"
              />
            </div>

            <div>
              <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1.5">
                المحافظة *
              </label>
              <select
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="w-full h-11 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3.5 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[#2F6BFF] focus:ring-1 focus:ring-[#2F6BFF] outline-none cursor-pointer transition-all"
              >
                {STORE_INFO.governorates.map((gov) => (
                  <option
                    key={gov}
                    value={gov}
                    className="bg-[var(--color-surface-1)] text-[var(--color-text-primary)]"
                  >
                    {gov}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1.5">
                العنوان التفصيلي (الحي / الشارع / معلم بارز) *
              </label>
              <textarea
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="مثال: صنعاء - شارع حدة - بجانب مركز صخر"
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl p-3 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[#2F6BFF] focus:ring-1 focus:ring-[#2F6BFF] outline-none transition-all placeholder-[var(--color-text-muted)] resize-none"
              />
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-2">
                طريقة الدفع المفضلّة:
              </label>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                    paymentMethod === "cash"
                      ? "border-[#2F6BFF] bg-[#2F6BFF]/10 text-[var(--color-text-primary)] font-bold shadow-sm"
                      : "border-[var(--color-border-default)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)]"
                  }`}
                >
                  <span className="font-semibold text-xs sm:text-sm flex items-center gap-1">
                    💵 عند الاستلام
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-[var(--color-text-muted)]">
                    تسليم المبلغ يداً بيد للمندوب
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("kuraimi")}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                    paymentMethod === "kuraimi"
                      ? "border-[#2F6BFF] bg-[#2F6BFF]/10 text-[var(--color-text-primary)] font-bold shadow-sm"
                      : "border-[var(--color-border-default)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)]"
                  }`}
                >
                  <span className="font-semibold text-xs sm:text-sm flex items-center gap-1">
                    🏦 بنك الكريمي
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-[var(--color-text-muted)]">
                    تطبيق حاسب / إيداع
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("jawalpay")}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                    paymentMethod === "jawalpay"
                      ? "border-[#2F6BFF] bg-[#2F6BFF]/10 text-[var(--color-text-primary)] font-bold shadow-sm"
                      : "border-[var(--color-border-default)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)]"
                  }`}
                >
                  <span className="font-semibold text-xs sm:text-sm flex items-center gap-1">
                    📱 جوال بي / وان كاش
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-[var(--color-text-muted)]">
                    محفظة إلكترونية فورية
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("transfer")}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                    paymentMethod === "transfer"
                      ? "border-[#2F6BFF] bg-[#2F6BFF]/10 text-[var(--color-text-primary)] font-bold shadow-sm"
                      : "border-[var(--color-border-default)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)]"
                  }`}
                >
                  <span className="font-semibold text-xs sm:text-sm flex items-center gap-1">
                    ✉️ حوالة صرافة
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-[var(--color-text-muted)]">
                    النجم / المميز / الصيفي
                  </span>
                </button>
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-[var(--color-surface-2)] p-3.5 rounded-2xl border border-[var(--color-border-default)] flex justify-between items-center text-xs sm:text-sm font-bold text-[var(--color-text-primary)] mt-3">
              <span>المبلغ المطلوب تسديده:</span>
              <span className="text-[#2F6BFF] text-lg sm:text-xl font-extrabold">
                {formatPrice(totalYER, currency)}
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-bold py-3.5 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-97 text-sm sm:text-base cursor-pointer mt-3"
            >
              <span>تأكيد وتسجيل الطلب</span>
              <span className="material-symbols-outlined text-[20px]">check</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
