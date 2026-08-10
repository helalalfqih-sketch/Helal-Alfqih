import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PackageCheck,
  MapPin,
  User,
  Heart,
  HelpCircle,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  Edit2,
  Phone,
  Truck,
  Sparkles,
  ChevronLeft,
  Search,
  Lock,
  Copy,
  Check,
  X,
  ShieldAlert,
} from "lucide-react";
import { Currency, OrderStatus } from "./types";
import { STORE_INFO } from "./constants";
import { formatPrice } from "./currency";
import { StoreLogo } from "./StoreLogo";

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  onSelectCurrency: (currency: Currency) => void;
  userOrders?: OrderStatus[];
  favoritesCount: number;
  onOpenWishlist: () => void;
  onOpenTrackerForOrder?: (orderNumber: string) => void;
  onOpenAdmin?: () => void;
}

type AccountTab = "orders" | "addresses" | "profile" | "wishlist" | "currency" | "support";

export const AccountDrawer: React.FC<AccountDrawerProps> = ({
  isOpen,
  onClose,
  currency,
  onSelectCurrency,
  userOrders = [],
  favoritesCount,
  onOpenWishlist,
  onOpenTrackerForOrder,
  onOpenAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<AccountTab>("orders");
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Profile Form Local State
  const [fullName, setFullName] = useState("عميل إندكس المميز");
  const [phone, setPhone] = useState("967771370740");
  const [preferredGov, setPreferredGov] = useState(STORE_INFO.governorates[0]);
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Addresses State
  const [addresses, setAddresses] = useState<
    { id: string; label: string; text: string; gov: string; isDefault: boolean }[]
  >([
    {
      id: "addr-1",
      label: "المنزل",
      text: "شارع حدة — بالقرب من جولة الرويشان",
      gov: "أمانة العاصمة صنعاء",
      isDefault: true,
    },
  ]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddrText, setNewAddrText] = useState("");
  const [newAddrGov, setNewAddrGov] = useState(STORE_INFO.governorates[0]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrText.trim()) return;
    setAddresses((prev) => [
      ...prev,
      {
        id: `addr-${Date.now()}`,
        label: "عنوان جديد",
        text: newAddrText.trim(),
        gov: newAddrGov,
        isDefault: prev.length === 0,
      },
    ]);
    setNewAddrText("");
    setIsAddingAddress(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex justify-end bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          className="w-full max-w-md bg-[var(--color-surface-1)] border-r border-[var(--color-border-default)] h-full flex flex-col justify-between shadow-2xl relative overflow-y-auto dir-rtl"
        >
          {/* Main Content Area */}
          <div className="p-5 sm:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-default)]">
              <div className="flex items-center gap-3">
                <StoreLogo variant="icon" className="w-11 h-11" />
                <div>
                  <h3 className="text-base font-black text-[var(--color-text-primary)]">
                    حسابي الشخصي
                  </h3>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    إدارة الطلبات، العناوين، والمفضلة
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Admin Quick Entry point */}
            {onOpenAdmin && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="w-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-blue-500/30 p-4 rounded-2xl flex items-center justify-between text-white transition-all shadow-md cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs block text-white">لوحة تحكم الأدمن</span>
                    <span className="text-[11px] text-gray-400">إدارة المنتجات والمخزون والطلبات</span>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-blue-400" />
              </button>
            )}

            {/* Tabs Navigation */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)] overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab("orders")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
                  activeTab === "orders"
                    ? "bg-[#2F6BFF] text-white shadow-md"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <PackageCheck className="w-4 h-4" />
                <span>طلباتي</span>
              </button>
              <button
                onClick={() => setActiveTab("addresses")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
                  activeTab === "addresses"
                    ? "bg-[#2F6BFF] text-white shadow-md"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>العناوين</span>
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
                  activeTab === "profile"
                    ? "bg-[#2F6BFF] text-white shadow-md"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <User className="w-4 h-4" />
                <span>الملف</span>
              </button>
            </div>

            {/* TAB 1: ORDERS */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                    سجل الطلبات الحالية والسابقة ({userOrders.length})
                  </h4>
                </div>

                {userOrders.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-2)] text-center text-xs text-[var(--color-text-secondary)] space-y-2">
                    <Truck className="w-8 h-8 mx-auto text-blue-400 opacity-60" />
                    <p className="font-bold text-[var(--color-text-primary)]">لا توجد طلبات مسجلة بعد</p>
                    <p className="text-[11px]">عند قيامك بأي طلب ستظهر حالته وتفاصيله هنا مباشرة.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-4 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-2)] space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-400">
                              #{ord.orderNumber}
                            </span>
                            <button
                              onClick={() => handleCopy(ord.orderNumber, ord.id)}
                              className="text-gray-400 hover:text-white"
                            >
                              {copiedOrderId === ord.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {ord.statusLabel || "قيد المعالجة"}
                          </span>
                        </div>

                        <div className="text-xs space-y-1 text-gray-300">
                          <div className="flex justify-between">
                            <span>عدد المنتجات:</span>
                            <span className="font-bold">{ord.items.length} منتج</span>
                          </div>
                          <div className="flex justify-between">
                            <span>المبلغ الإجمالي:</span>
                            <span className="font-bold text-amber-400">
                              {formatPrice(ord.totalPriceYER, currency)}
                            </span>
                          </div>
                        </div>

                        {onOpenTrackerForOrder && (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenTrackerForOrder(ord.orderNumber);
                            }}
                            className="w-full py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <span>تتبع حركة الشحنة</span>
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ADDRESSES */}
            {activeTab === "addresses" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                    عناويني المسجلة للشحن السريع
                  </h4>
                  <button
                    onClick={() => setIsAddingAddress(!isAddingAddress)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>عنوان جديد</span>
                  </button>
                </div>

                {isAddingAddress && (
                  <form
                    onSubmit={handleAddAddress}
                    className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-blue-500/30 space-y-3"
                  >
                    <h5 className="text-xs font-bold text-white">إضافة عنوان شحن جديد</h5>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">المحافظة</label>
                      <select
                        value={newAddrGov}
                        onChange={(e) => setNewAddrGov(e.target.value)}
                        className="w-full bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-xl px-3 py-2 text-xs text-white"
                      >
                        {STORE_INFO.governorates.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">العنوان التفصيلي</label>
                      <input
                        type="text"
                        required
                        value={newAddrText}
                        onChange={(e) => setNewAddrText(e.target.value)}
                        placeholder="المنطقة، الشارع، أقرب معلم..."
                        className="w-full bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs"
                      >
                        حفظ العنوان
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingAddress(false)}
                        className="px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-xs"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {addresses.map((a) => (
                    <div
                      key={a.id}
                      className="p-4 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-2)] flex items-start justify-between"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{a.label}</span>
                          {a.isDefault && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              افتراضي
                            </span>
                          )}
                        </div>
                        <p className="text-gray-300">{a.gov}</p>
                        <p className="text-gray-400 text-[11px]">{a.text}</p>
                      </div>

                      <button
                        onClick={() => setAddresses((prev) => prev.filter((item) => item.id !== a.id))}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: PROFILE */}
            {activeTab === "profile" && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                  بيانات العميل الشخصية للتعبئة التلقائية
                </h4>

                {isSaved && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تم حفظ التعديلات بنجاح!</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-gray-400 mb-1">الاسم الكامل</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">رقم الهاتف للاتصال</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono dir-ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">المحافظة المفضلة</label>
                  <select
                    value={preferredGov}
                    onChange={(e) => setPreferredGov(e.target.value)}
                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3.5 py-2.5 text-xs text-white"
                  >
                    {STORE_INFO.governorates.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">ملاحظات التوصيل الدائمة</label>
                  <textarea
                    rows={2}
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    placeholder="مثال: الاتصال قبل الوصول بـ 15 دقيقة..."
                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </form>
            )}

            {/* CURRENCY & WISHLIST QUICK CONTROLS */}
            <div className="pt-4 border-t border-[var(--color-border-default)] space-y-4">
              <div>
                <span className="text-xs font-bold text-[var(--color-text-secondary)] block mb-2">
                  عملة العرض بالمتجر:
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  {(["YER", "SAR", "USD"] as Currency[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => onSelectCurrency(c)}
                      className={`py-2 px-3 rounded-xl border transition-all cursor-pointer ${
                        currency === c
                          ? "bg-[#2F6BFF] border-[#2F6BFF] text-white shadow-md"
                          : "bg-[var(--color-surface-2)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-white"
                      }`}
                    >
                      {c === "YER" ? "ريال يمني" : c === "SAR" ? "ريال سعودي" : "دولار أمريكي"}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenWishlist();
                }}
                className="w-full py-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 text-rose-400" />
                <span>قائمة المفضلة الخاصة بي ({favoritesCount})</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
