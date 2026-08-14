import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  Plus,
  Trash2,
  Check,
  X,
  Phone,
  User,
  Building,
  Home,
  Gift,
  Navigation,
  AlertCircle,
} from "lucide-react";
import {
  YemenAddress,
  YEMEN_GOVERNORATES,
  validateYemenPhone,
  getSavedAddressesLocal,
  saveAddressLocal,
  deleteAddressLocal,
  calculateYemenShipping,
} from "../lib/yemenAddress";

interface SmartAddressBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress?: (address: YemenAddress) => void;
  selectedAddressId?: string;
  subtotalYER?: number;
}

export const SmartAddressBookModal: React.FC<SmartAddressBookModalProps> = ({
  isOpen,
  onClose,
  onSelectAddress,
  selectedAddressId,
  subtotalYER = 0,
}) => {
  const [addresses, setAddresses] = useState<YemenAddress[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states
  const [label, setLabel] = useState<YemenAddress["label"]>("المنزل");
  const [recipientName, setRecipientName] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [alternativePhone, setAlternativePhone] = useState("");
  const [governorate, setGovernorate] = useState(YEMEN_GOVERNORATES[0]);
  const [district, setDistrict] = useState("");
  const [street, setStreet] = useState("");
  const [nearestLandmark, setNearestLandmark] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAddresses(getSavedAddressesLocal());
    }
  }, [isOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");

    const phoneVal = validateYemenPhone(primaryPhone);
    if (!phoneVal.isValid) {
      setPhoneError(phoneVal.message || "رقم الهاتف غير صحيح");
      return;
    }

    if (!recipientName.trim()) {
      setPhoneError("يرجى كتابة اسم المستلم");
      return;
    }

    if (!district.trim()) {
      setPhoneError("يرجى تحديد المديرية أو المنطقة");
      return;
    }

    if (!nearestLandmark.trim()) {
      setPhoneError("يرجى تحديد أقرب معلم بارز للتوصيل");
      return;
    }

    const newAddress: YemenAddress = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `addr_${Date.now()}`,
      label,
      recipientName,
      phone: primaryPhone,
      governorate,
      district,
      streetName: street,
      nearestLandmark,
      isDefault: false,
    };

    const updated = saveAddressLocal(newAddress);
    setAddresses(updated);
    setIsAddingNew(false);

    // Reset form
    setRecipientName("");
    setPrimaryPhone("");
    setAlternativePhone("");
    setDistrict("");
    setStreet("");
    setNearestLandmark("");
    setDeliveryNotes("");

    if (onSelectAddress) {
      onSelectAddress(newAddress);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteAddressLocal(id);
    setAddresses(updated);
  };

  if (!isOpen) return null;

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
          className="bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-[28px] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl dir-rtl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-default)] mb-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[var(--color-text-primary)]">
                  دفتر عناوين اليمن الذكي
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  إدارة عناوين الشحن والتوصيل المباشر
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

          {/* List or Form */}
          {!isAddingNew ? (
            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--color-text-muted)]">
                  عناوينك المحفوظة ({addresses.length})
                </span>
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2F6BFF] hover:bg-[#2458D8] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> عنوان جديد
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-2)] space-y-3">
                  <Navigation className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
                  <div className="text-sm font-bold text-[var(--color-text-primary)]">
                    لا توجد عناوين محفوظة حالياً
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto">
                    أضف عنوانك المفصل في أي محافظة يمنية لتسريع عملية الطلب
                    والتوصيل إلى باب بيتك.
                  </p>
                  <button
                    onClick={() => setIsAddingNew(true)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> إضافة أول عنوان
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => {
                    const shipping = calculateYemenShipping(
                      addr.governorate,
                      subtotalYER,
                    );
                    const isSelected = selectedAddressId === addr.id;

                    return (
                      <div
                        key={addr.id}
                        onClick={() => {
                          if (onSelectAddress) {
                            onSelectAddress(addr);
                            onClose();
                          }
                        }}
                        className={`p-4 rounded-2xl border text-right transition-all cursor-pointer relative ${
                          isSelected
                            ? "bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                            : "bg-[var(--color-surface-2)] border-[var(--color-border-default)] hover:border-emerald-500/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {addr.label === "المنزل" && (
                                <Home className="w-3 h-3 inline ml-1" />
                              )}
                              {addr.label === "العمل" && (
                                <Building className="w-3 h-3 inline ml-1" />
                              )}
                              {addr.label === "هدية" && (
                                <Gift className="w-3 h-3 inline ml-1" />
                              )}
                              {addr.label}
                            </span>
                            <span className="font-extrabold text-sm text-[var(--color-text-primary)]">
                              {addr.recipientName}
                            </span>
                          </div>

                          <button
                            onClick={(e) => handleDelete(addr.id, e)}
                            className="text-gray-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                            title="حذف العنوان"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-xs text-[var(--color-text-secondary)] mt-2 space-y-1">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {addr.governorate} - {addr.district} -{" "}
                              {addr.streetName || "الشارع الرئيسي"}
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--color-text-muted)] pr-5">
                            أقرب معلم:{" "}
                            <span className="text-[var(--color-text-primary)] font-medium">
                              {addr.nearestLandmark}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 pr-5 text-[11px]">
                            <Phone className="w-3 h-3 text-blue-400" />
                            <span>{addr.phone}</span>
                          </div>
                        </div>

                        {/* Shipping estimate preview */}
                        <div className="mt-3 pt-2.5 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[11px]">
                          <span className="text-gray-400">
                            تكلفة الشحن المتوقعة:
                          </span>
                          <span className="font-bold text-amber-300">
                            {shipping === 0
                              ? "مجاني"
                              : `${shipping.toLocaleString()} ر.ي`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Add Address Form */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Plus className="w-4 h-4" /> تفاصيل العنوان الجديد
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
                >
                  إلغاء والعودة للقائمة
                </button>
              </div>

              {phoneError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{phoneError}</span>
                </div>
              )}

              {/* Address Label Selection */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1.5">
                  نوع العنوان
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      "المنزل",
                      "العمل",
                      "هدية",
                      "آخر",
                    ] as YemenAddress["label"][]
                  ).map((lbl) => (
                    <button
                      type="button"
                      key={lbl}
                      onClick={() => setLabel(lbl)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        label === lbl
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                          : "bg-[var(--color-surface-2)] border-[var(--color-border-default)] text-gray-400"
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                    اسم المستلم الثلاثي *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="أحمد علي باوزير"
                      className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl pr-9 pl-3 py-2.5 text-xs text-[var(--color-text-primary)] focus:border-emerald-500 focus:outline-none"
                    />
                    <User className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                    رقم الهاتف الرئيسي (اليمن) *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={primaryPhone}
                      onChange={(e) => setPrimaryPhone(e.target.value)}
                      placeholder="771234567"
                      className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl pr-9 pl-3 py-2.5 text-xs text-[var(--color-text-primary)] focus:border-emerald-500 focus:outline-none text-left dir-ltr"
                    />
                    <Phone className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Governorate and District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                    المحافظة *
                  </label>
                  <select
                    value={governorate}
                    onChange={(e) => setGovernorate(e.target.value)}
                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3 py-2.5 text-xs text-[var(--color-text-primary)] focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {YEMEN_GOVERNORATES.map((gov) => (
                      <option
                        key={gov}
                        value={gov}
                        className="bg-gray-900 text-white"
                      >
                        {gov}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                    المديرية / المنطقة *
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="السبعين / حدة / المعلا"
                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3 py-2.5 text-xs text-[var(--color-text-primary)] focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Street and Landmark */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                    الشارع
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="شارع حدة العام"
                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3 py-2.5 text-xs text-[var(--color-text-primary)] focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                    أقرب معلم بارز *
                  </label>
                  <input
                    type="text"
                    required
                    value={nearestLandmark}
                    onChange={(e) => setNearestLandmark(e.target.value)}
                    placeholder="مقابل صيدلية الرعاية / بجانب جولة الكراع"
                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3 py-2.5 text-xs text-[var(--color-text-primary)] focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Optional Phone & Delivery Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                    رقم هاتف إضافي (اختياري)
                  </label>
                  <input
                    type="tel"
                    value={alternativePhone}
                    onChange={(e) => setAlternativePhone(e.target.value)}
                    placeholder="731234567"
                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3 py-2.5 text-xs text-[var(--color-text-primary)] focus:border-emerald-500 focus:outline-none text-left dir-ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                    تعليمات المندوب (اختياري)
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="الاتصال قبل الوصول / تسليم للبواب"
                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3 py-2.5 text-xs text-[var(--color-text-primary)] focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> حفظ العنوان لاستخدامه
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-5 py-3 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)] text-gray-300 font-bold text-xs hover:bg-[var(--color-surface-3)] cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
