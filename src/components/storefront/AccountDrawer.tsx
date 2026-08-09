import React from "react";
import { Currency, OrderStatus, Product } from "./types";
import { STORE_INFO } from "./constants";
import { formatPrice } from "./currency";
import { StoreLogo } from "./StoreLogo";

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  onSelectCurrency: (currency: Currency) => void;
  userOrders: OrderStatus[];
  favoritesCount: number;
  onOpenWishlist: () => void;
  onOpenTracker: () => void;
  onOpenAdmin?: () => void;
}

export const AccountDrawer: React.FC<AccountDrawerProps> = ({
  isOpen,
  onClose,
  currency,
  onSelectCurrency,
  userOrders,
  favoritesCount,
  onOpenWishlist,
  onOpenTracker,
  onOpenAdmin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="flex-1" onClick={onClose} />

      <div className="w-full max-w-md bg-[var(--color-surface-1)] border-r border-[var(--color-border-default)] h-full flex flex-col justify-between p-6 shadow-2xl relative overflow-y-auto no-scrollbar">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-default)] mb-6">
            <div className="flex items-center gap-3">
              <StoreLogo variant="icon" className="w-11 h-11" />
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                  حسابي في إندكس
                </h3>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  عميل متجر إندكس المتميز
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Admin Panel Entry Point */}
          {onOpenAdmin && (
            <button
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              className="w-full mb-5 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border-default)] p-4 rounded-2xl flex items-center justify-between text-[var(--color-text-primary)] transition-all shadow-md cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🛡️</span>
                <div className="text-right">
                  <span className="font-bold text-sm block">لوحة تحكم الأدمن</span>
                  <span className="text-[11px] text-[var(--color-text-secondary)]">
                    إدارة المنتجات، الطلبات، والكتالوج
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] text-[20px] transition-colors">
                chevron_left
              </span>
            </button>
          )}

          {/* Currency Switcher */}
          <div className="bg-[var(--color-surface-2)] p-4 rounded-2xl border border-[var(--color-border-default)] mb-5">
            <span className="text-xs font-bold text-[var(--color-text-secondary)] block mb-2.5">
              عملة عرض الأسعار:
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs font-bold">
              <button
                onClick={() => onSelectCurrency("YER")}
                className={`py-2 px-3 rounded-xl border transition-all cursor-pointer ${
                  currency === "YER"
                    ? "bg-[#2F6BFF] border-[#2F6BFF] text-white shadow-md"
                    : "bg-[var(--color-surface-1)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                ريال يمني (YER)
              </button>

              <button
                onClick={() => onSelectCurrency("SAR")}
                className={`py-2 px-3 rounded-xl border transition-all cursor-pointer ${
                  currency === "SAR"
                    ? "bg-[#2F6BFF] border-[#2F6BFF] text-white shadow-md"
                    : "bg-[var(--color-surface-1)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                ريال سعودي (SAR)
              </button>

              <button
                onClick={() => onSelectCurrency("USD")}
                className={`py-2 px-3 rounded-xl border transition-all cursor-pointer ${
                  currency === "USD"
                    ? "bg-[#2F6BFF] border-[#2F6BFF] text-white shadow-md"
                    : "bg-[var(--color-surface-1)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                دولار (USD $)
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => {
                onClose();
                onOpenWishlist();
              }}
              className="w-full bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border-default)] p-4 rounded-2xl flex items-center justify-between text-[var(--color-text-primary)] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-rose-500 text-[24px]">
                  favorite
                </span>
                <span className="font-bold text-sm">المفضلة</span>
              </div>
              <span className="bg-rose-500/15 text-rose-400 text-xs font-bold px-3 py-1 rounded-full border border-rose-500/30">
                {favoritesCount} منتجات
              </span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenTracker();
              }}
              className="w-full bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border-default)] p-4 rounded-2xl flex items-center justify-between text-[var(--color-text-primary)] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#2F6BFF] text-[24px]">
                  package_2
                </span>
                <span className="font-bold text-sm">تتبع طلباتي</span>
              </div>
              <span className="material-symbols-outlined text-[var(--color-text-muted)] text-[20px]">
                chevron_left
              </span>
            </button>
          </div>

          {/* Order History */}
          <div>
            <h4 className="text-xs font-bold text-[var(--color-text-secondary)] mb-3">
              سجل طلباتي السابقة:
            </h4>
            {userOrders.length === 0 ? (
              <div className="bg-[var(--color-surface-2)] p-4 rounded-2xl border border-[var(--color-border-default)] text-center text-xs text-[var(--color-text-muted)]">
                لا توجد طلبات مسجلة حالياً
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">
                {userOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-[var(--color-surface-2)] p-3.5 rounded-2xl border border-[var(--color-border-default)] text-xs text-right space-y-1.5"
                  >
                    <div className="flex justify-between items-center border-b border-[var(--color-border-subtle)] pb-2">
                      <strong className="text-[#2F6BFF] font-mono dir-ltr inline-block font-bold">
                        {ord.orderNumber}
                      </strong>
                      <span className="text-[var(--color-text-muted)] text-[11px]">{ord.date}</span>
                    </div>

                    <p className="text-[var(--color-text-secondary)]">
                      <strong>الحالة:</strong>{" "}
                      <span className="text-[#2F6BFF] font-bold">{ord.statusLabel}</span>
                    </p>

                    <p className="text-[var(--color-text-secondary)]">
                      <strong>الإجمالي:</strong> {formatPrice(ord.totalPriceYER, currency)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Store Location Footer */}
        <div className="pt-4 border-t border-[var(--color-border-default)] text-xs text-[var(--color-text-secondary)] space-y-1 text-center">
          <p className="font-bold text-[var(--color-text-primary)]">{STORE_INFO.name}</p>
          <p>{STORE_INFO.address}</p>
          <p className="text-emerald-500 font-bold dir-ltr">واتساب: {STORE_INFO.formattedPhone}</p>
        </div>
      </div>
    </div>
  );
};
