import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Truck,
  CreditCard,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Check,
  X,
  ShoppingBag,
} from "lucide-react";
import { CartItem, Currency, OrderStatus } from "./types";
import { formatPrice } from "./currency";
import { STORE_INFO } from "./constants";
import { useAppearance } from "@/components/appearance-provider";
import { createOrder } from "@/lib/order.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currency: Currency;
  couponDiscountPercent: number;
  onOrderPlaced: (order: OrderStatus) => void;
  onOpenOrderTracker?: (orderNumber: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  currency,
  couponDiscountPercent,
  onOrderPlaced,
  onOpenOrderTracker,
}) => {
  const { settings } = useAppearance();
  const executeCreateOrder = useServerFn(createOrder);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [placedOrder, setPlacedOrder] = useState<OrderStatus | null>(null);

  // Form Fields
  const [customerName, setCustomerName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [altPhone, setAltPhone] = useState<string>("");
  const [showAltPhone, setShowAltPhone] = useState<boolean>(false);

  const [governorate, setGovernorate] = useState<string>(STORE_INFO.governorates[0]);
  const [address, setAddress] = useState<string>("");
  const [nearestLandmark, setNearestLandmark] = useState<string>("");
  const [deliveryInstruction, setDeliveryInstruction] = useState<string>("");

  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    address?: string;
    submitErr?: string;
  }>({});

  if (!isOpen) return null;

  const freeThreshold = settings.cart_config?.freeShippingThreshold || STORE_INFO.freeShippingThresholdYER;
  const defaultFee = settings.cart_config?.defaultShippingFee || 3000;

  const subtotalYER = cartItems.reduce(
    (sum, item) => sum + item.product.priceYER * item.quantity,
    0,
  );

  const isFreeShipping = freeThreshold > 0 && subtotalYER >= freeThreshold;
  const shippingFeeYER = isFreeShipping || cartItems.length === 0 ? 0 : defaultFee;
  const discountAmountYER = (subtotalYER * couponDiscountPercent) / 100;
  const totalYER = Math.max(0, subtotalYER - discountAmountYER + shippingFeeYER);

  const validateStep1 = (): boolean => {
    const errs: typeof errors = {};
    if (!customerName.trim()) errs.name = "يرجى كتابة اسم المستلم الكامل";
    if (!phone.trim()) {
      errs.phone = "يرجى كتابة رقم الهاتف للاتصال والتأكيد";
    } else if (!/^(77|78|73|71|70|01|02|03|04|05|06|07)\d{7}$/.test(phone.trim().replace(/\D/g, ""))) {
      errs.phone = "رقم الهاتف غير صالح (يجب أن يكون رقم يمني مكون من 9 أرقام)";
    }
    if (!address.trim()) errs.address = "يرجى توضيح عنوان التوصيل بالتفصيل";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) {
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Execute real production Supabase order creation function
      const result = await executeCreateOrder({
        data: {
          customerName: customerName.trim(),
          phone: phone.trim(),
          governorate,
          address: `${address.trim()}${nearestLandmark ? ` (أقرب معلم: ${nearestLandmark.trim()})` : ""}${deliveryInstruction ? ` - ملاحظات: ${deliveryInstruction.trim()}` : ""}`,
          notes: deliveryInstruction.trim() || undefined,
          items: cartItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        },
      });

      let paymentLabel = "الدفع عند الاستلام (نقداً)";
      if (paymentMethod === "kuraimi") paymentLabel = "حساب بنك الكريمي (حاسب)";
      if (paymentMethod === "jawalpay") paymentLabel = "محفظة جوال بي / وان كاش";
      if (paymentMethod === "transfer") paymentLabel = "حوالة صرافة (النجم / المميز)";

      const resAny = result as any;
      const orderId = resAny.orderId || resAny.id || `ord-${Date.now()}`;
      const orderNum = resAny.orderNumber || resAny.order_number || orderId.slice(0, 8);
      const totalAmt = typeof resAny.totalAmount === "number" ? resAny.totalAmount : totalYER;

      const orderObj: OrderStatus = {
        id: orderId,
        orderNumber: orderNum,
        customerName: customerName.trim(),
        phone: phone.trim(),
        governorate,
        address: address.trim(),
        items: cartItems.map((i) => ({
          productName: i.product.name,
          quantity: i.quantity,
          price: i.product.priceYER,
        })),
        totalPriceYER: totalAmt,
        status: "received",
        statusLabel: "تم استلام الطلب",
        date: new Date().toLocaleDateString("ar-YE"),
        paymentMethod: paymentLabel,
      };

      setPlacedOrder(orderObj);
      onOrderPlaced(orderObj);
      setStep(3);
    } catch (err: any) {
      console.error("Order creation failed:", err);
      const msg = err?.message || "تعذر إكمال ثبت الطلب، يرجى المحاولة مرة أخرى.";
      setErrors({ submitErr: msg });
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
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
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          className="bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-[28px] w-full max-w-2xl p-5 sm:p-7 shadow-2xl dir-rtl relative overflow-y-auto max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-default)] mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#2F6BFF]/15 border border-[#2F6BFF]/30 flex items-center justify-center text-[#2F6BFF]">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">
                  {step === 3 ? "تم تثبيت طلبك بنجاح 🎉" : "إكمال عملية الشراء والشحن"}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {step === 1
                    ? "الخطوة 1 من 2: معلومات التوصيل والعنوان"
                    : step === 2
                      ? "الخطوة 2 من 2: اختيار طريقة الدفع وتأكيد الطلب"
                      : "تم إرسال تفاصيل طلبك مباشرة للإدارة"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* STEP 1: Delivery Details */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#2F6BFF]" /> اسم المستلم الكامل *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="أدخل اسمك أو اسم المستلم..."
                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--color-text-primary)] focus:border-[#2F6BFF] focus:outline-none"
                  />
                  {errors.name && <p className="text-[11px] text-rose-400 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-[#2F6BFF]" /> رقم الهاتف للاتصال والتأكيد *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: 771370740"
                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--color-text-primary)] font-mono dir-ltr focus:border-[#2F6BFF] focus:outline-none"
                  />
                  {errors.phone && <p className="text-[11px] text-rose-400 mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#2F6BFF]" /> المحافظة *
                  </label>
                  <select
                    value={governorate}
                    onChange={(e) => setGovernorate(e.target.value)}
                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--color-text-primary)] focus:border-[#2F6BFF] focus:outline-none"
                  >
                    {STORE_INFO.governorates.map((gov) => (
                      <option key={gov} value={gov}>
                        {gov}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#2F6BFF]" /> أقرب معلم للمكان
                  </label>
                  <input
                    type="text"
                    value={nearestLandmark}
                    onChange={(e) => setNearestLandmark(e.target.value)}
                    placeholder="مثال: بجانب مستشفى السلام..."
                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--color-text-primary)] focus:border-[#2F6BFF] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#2F6BFF]" /> العنوان التفصيلي *
                </label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="المنطقة، الحي، اسم الشارع، رقم المنزل أو العمارة..."
                  className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--color-text-primary)] focus:border-[#2F6BFF] focus:outline-none"
                />
                {errors.address && <p className="text-[11px] text-rose-400 mt-1">{errors.address}</p>}
              </div>

              {/* Summary Accordion Bar */}
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[var(--color-text-secondary)]">إجمالي المشتريات ({cartItems.length} عنصر):</span>
                  <span className="font-bold text-amber-400 mx-2">{formatPrice(totalYER, currency)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2.5 rounded-xl bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <span>متابعة لاختيار الدفع</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Payment Selection */}
          {step === 2 && (
            <form onSubmit={handleFinalSubmit} className="space-y-5">
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#2F6BFF]" /> اختر طريقة الدفع المناسبة:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: "cash", title: "الدفع عند الاستلام (نقداً)", desc: "تسليم المبلغ لمندوب التوصيل عند استلام الطلب", icon: "💵" },
                    { id: "kuraimi", title: "حساب بنك الكريمي (حاسب)", desc: "تحويل مباشر إلى حساب المتجر في الكريمي", icon: "🏛️" },
                    { id: "jawalpay", title: "محفظة جوال بي / وان كاش", desc: "الدفع الفوري السريع عبر المحفظة", icon: "📱" },
                    { id: "transfer", title: "حوالة صرافة (النجم / المميز)", desc: "تحويل شبكي باسم المتجر", icon: "🏦" },
                  ].map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        paymentMethod === m.id
                          ? "bg-[#2F6BFF]/15 border-[#2F6BFF] text-white shadow-lg"
                          : "bg-[var(--color-surface-2)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-white"
                      }`}
                    >
                      <span className="text-2xl">{m.icon}</span>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-extrabold text-[var(--color-text-primary)] mb-0.5">{m.title}</h4>
                        <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">{m.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {errors.submitErr && (
                <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errors.submitErr}</span>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)] space-y-2 text-xs">
                <div className="flex justify-between text-[var(--color-text-secondary)]">
                  <span>مجموع المنتجات:</span>
                  <span className="font-bold text-[var(--color-text-primary)]">{formatPrice(subtotalYER, currency)}</span>
                </div>
                <div className="flex justify-between text-[var(--color-text-secondary)]">
                  <span>رسوم التوصيل للشحن:</span>
                  <span className="font-bold text-emerald-400">
                    {isFreeShipping ? "مجاني 🎉" : formatPrice(shippingFeeYER, currency)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[var(--color-border-default)] font-extrabold text-sm text-[var(--color-text-primary)]">
                  <span>المبلغ النهائي المطلق:</span>
                  <span className="text-amber-400">{formatPrice(totalYER, currency)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] font-bold text-xs hover:bg-[var(--color-surface-3)] transition-all cursor-pointer flex items-center gap-1"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>العودة للعنوان</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-extrabold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال الطلب وحفظه في السيرفر...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>تأكيد وثبت الطلب النهائي</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Order Placed Confirmation */}
          {step === 3 && placedOrder && (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-2xl animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-[var(--color-text-primary)]">
                  شكراً لك! تم ثبت طلبك برقم #{placedOrder.orderNumber}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  سيتم التواصل معك هاتفياً أو عبر الواتساب لتأكيد الشحنة والتوصيل.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)] text-right space-y-2 text-xs">
                <div className="flex justify-between border-b border-[var(--color-border-default)] pb-2 font-bold">
                  <span>اسم المستلم: {placedOrder.customerName}</span>
                  <span className="text-blue-400">{placedOrder.phone}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>مكان التوصيل: {placedOrder.governorate} — {placedOrder.address}</span>
                </div>
                <div className="flex justify-between text-gray-300 pt-1 font-bold">
                  <span>طريقة الدفع: {placedOrder.paymentMethod}</span>
                  <span className="text-amber-400">{formatPrice(placedOrder.totalPriceYER, currency)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                {onOpenOrderTracker && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenOrderTracker(placedOrder.orderNumber);
                    }}
                    className="flex-1 py-3 rounded-xl bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                  >
                    <span>تتبع مسار الشحنة مباشر 🚚</span>
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] font-bold text-xs hover:bg-[var(--color-surface-3)] transition-all cursor-pointer"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
