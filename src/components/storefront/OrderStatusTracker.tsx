import React from 'react';
import { motion } from 'framer-motion';
import { OrderStatus, Currency } from './types';
import { formatPrice } from './currency';
import {
  PackageCheck,
  Clock,
  Truck,
  CheckCircle2,
  Box,
  Calendar,
  ShoppingBag,
  ShieldCheck,
  Phone,
} from 'lucide-react';
import { STORE_INFO } from './constants';

interface OrderStatusTrackerProps {
  order: OrderStatus;
  currency?: Currency;
  showQuickSummary?: boolean;
  className?: string;
}

export const getEstimatedDelivery = (status: OrderStatus['status']): string => {
  switch (status) {
    case 'received':
      return 'ط®ظ„ط§ظ„ 3-5 ط£ظٹط§ظ… ط¹ظ…ظ„ (Expected delivery: 3-5 business days)';
    case 'processing':
      return 'ط®ظ„ط§ظ„ 2-3 ط£ظٹط§ظ… ط¹ظ…ظ„ (Expected delivery: 2-3 business days)';
    case 'shipped':
      return 'ط®ظ„ط§ظ„ 1-2 ط£ظٹط§ظ… ط¹ظ…ظ„ (Expected delivery: 1-2 business days)';
    case 'out_for_delivery':
      return 'ط§ظ„ظٹظˆظ… ط®ظ„ط§ظ„ ط³ط§ط¹ط§طھ ظ‚ظ„ظٹظ„ط© (Expected delivery: Today within hours)';
    case 'delivered':
      return 'طھظ… ط§ظ„طھط³ظ„ظٹظ… ط¨ظ†ط¬ط§ط­ (Delivered)';
    case 'cancelled':
      return 'طھظ… ط¥ظ„ط؛ط§ط، ط§ظ„ط·ظ„ط¨ (Cancelled)';
    default:
      return 'ط®ظ„ط§ظ„ 2-4 ط£ظٹط§ظ… ط¹ظ…ظ„ (Expected delivery: 2-4 business days)';
  }
};

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  order,
  currency = 'YER',
  showQuickSummary = true,
  className = '',
}) => {
  const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const estimatedDelivery = getEstimatedDelivery(order.status);

  // 4 Core steps as requested: Ordered, Processing, Shipped, Delivered
  const steps = [
    {
      key: 'ordered',
      label: 'Ordered',
      labelAr: 'طھظ… ط§ظ„ط·ظ„ط¨',
      icon: Box,
      statuses: ['received', 'processing', 'shipped', 'out_for_delivery', 'delivered'],
    },
    {
      key: 'processing',
      label: 'Processing',
      labelAr: 'ظ‚ظٹط¯ ط§ظ„طھط¬ظ‡ظٹط²',
      icon: Clock,
      statuses: ['processing', 'shipped', 'out_for_delivery', 'delivered'],
    },
    {
      key: 'shipped',
      label: 'Shipped',
      labelAr: 'طھظ… ط§ظ„ط´ط­ظ†',
      icon: Truck,
      statuses: ['shipped', 'out_for_delivery', 'delivered'],
    },
    {
      key: 'delivered',
      label: 'Delivered',
      labelAr: 'طھظ… ط§ظ„طھط³ظ„ظٹظ…',
      icon: CheckCircle2,
      statuses: ['delivered'],
    },
  ];

  const getActiveStepIndex = (status: OrderStatus['status']) => {
    switch (status) {
      case 'received':
        return 0;
      case 'processing':
        return 1;
      case 'shipped':
      case 'out_for_delivery':
        return 2;
      case 'delivered':
        return 3;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const currentStepIdx = getActiveStepIndex(order.status);
  const progressPercentage =
    order.status === 'cancelled'
      ? 0
      : Math.round((currentStepIdx / (steps.length - 1)) * 100);

  return (
    <div className={`space-y-4 text-right dir-rtl ${className}`}>
      {/* Quick Summary Header */}
      {showQuickSummary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#2F6BFF]/10 via-[var(--color-surface-2)] to-emerald-500/10 p-4 sm:p-5 rounded-2xl border border-[#2F6BFF]/30 shadow-md relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3 border-b border-[var(--color-border-subtle)] pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#2F6BFF]/20 text-[#2F6BFF]">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-[var(--color-text-primary)]">
                  Quick Summary | ظ…ظ„ط®طµ ط³ط±ظٹط¹ ظ„ظ„ط·ظ„ط¨
                </h4>
                <p className="text-[11px] text-[var(--color-text-muted)] font-mono dir-ltr">
                  #{order.orderNumber}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#2F6BFF]/15 text-[#2F6BFF] border border-[#2F6BFF]/30">
              {order.statusLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-[var(--color-surface-1)] p-2.5 sm:p-3 rounded-xl border border-[var(--color-border-subtle)]">
              <span className="text-[10px] text-[var(--color-text-muted)] block flex items-center gap-1">
                <ShoppingBag className="w-3 h-3 text-[#2F6BFF]" />
                ط¹ط¯ط¯ ط§ظ„ظ…ظ†طھط¬ط§طھ (Items)
              </span>
              <span className="text-sm sm:text-base font-black text-[var(--color-text-primary)] mt-0.5 block">
                {totalItemsCount} {totalItemsCount === 1 ? 'ظ…ظ†طھط¬' : 'ظ…ظ†طھط¬ط§طھ'} ({totalItemsCount} items)
              </span>
            </div>

            <div className="bg-[var(--color-surface-1)] p-2.5 sm:p-3 rounded-xl border border-[var(--color-border-subtle)]">
              <span className="text-[10px] text-[var(--color-text-muted)] block flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط·ظ„ط¨ (Total)
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-500 mt-0.5 block">
                {formatPrice(order.totalPriceYER, currency)}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-[var(--color-surface-1)] p-2.5 sm:p-3 rounded-xl border border-[var(--color-border-subtle)]">
              <span className="text-[10px] text-[var(--color-text-muted)] block flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-400" />
                ط§ظ„طھط§ط±ظٹط® (Date)
              </span>
              <span className="text-xs sm:text-sm font-bold text-[var(--color-text-secondary)] mt-0.5 block">
                {order.date}
              </span>
            </div>
          </div>

          {/* Estimated Delivery Banner */}
          <div className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-amber-500 shrink-0 animate-pulse" />
            <div className="text-xs">
              <span className="font-bold text-amber-500 block">
                ظ…ظˆط¹ط¯ ط§ظ„طھظˆطµظٹظ„ ط§ظ„ظ…طھظˆظ‚ط¹ (Estimated Delivery):
              </span>
              <span className="text-[var(--color-text-primary)] font-semibold">
                {estimatedDelivery}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Visual Tracking Progress Bar Component */}
      <div className="bg-[var(--color-surface-2)] p-4 sm:p-5 rounded-2xl border border-[var(--color-border-default)] space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#2F6BFF]" />
            <span>ظ…ط³ط§ط± طھطھط¨ط¹ ط­ط§ظ„ط© ط§ظ„ط·ظ„ط¨ (Order Status)</span>
          </h4>
          <span className="text-xs font-mono text-[var(--color-text-muted)]">
            {progressPercentage}% ظ…ظƒطھظ…ظ„
          </span>
        </div>

        {/* Horizontal Visual Stepper */}
        <div className="relative pt-2 pb-1">
          {/* Connecting Line Background */}
          <div className="absolute top-6 right-8 left-8 h-1 bg-[var(--color-surface-3)] rounded-full -z-0" />

          {/* Active Connecting Line Progress */}
          <motion.div
            className="absolute top-6 right-8 h-1 bg-gradient-to-l from-[#2F6BFF] to-emerald-400 rounded-full -z-0"
            initial={{ width: 0 }}
            animate={{ width: `calc(${progressPercentage}% - 0px)` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />

          {/* Steps Grid */}
          <div className="grid grid-cols-4 relative z-10">
            {steps.map((step, idx) => {
              const IconComponent = step.icon;
              const isCompleted = currentStepIdx > idx;
              const isCurrent = currentStepIdx === idx;
              const isPending = currentStepIdx < idx;

              return (
                <div key={step.key} className="flex flex-col items-center text-center group">
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all border-2 ${
                      isCurrent
                        ? 'bg-[#2F6BFF] border-[#2F6BFF] text-white shadow-lg shadow-[#2F6BFF]/30 scale-110 ring-4 ring-[#2F6BFF]/20'
                        : isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                        : 'bg-[var(--color-surface-1)] border-[var(--color-border-default)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <div className="mt-2 space-y-0.5">
                    <span
                      className={`text-xs block font-bold transition-colors ${
                        isCurrent
                          ? 'text-[#2F6BFF]'
                          : isCompleted
                          ? 'text-emerald-400'
                          : 'text-[var(--color-text-muted)]'
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-secondary)] block">
                      {step.labelAr}
                    </span>
                  </div>

                  {isCurrent && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-[#2F6BFF] bg-[#2F6BFF]/10 px-2 py-0.5 rounded-full border border-[#2F6BFF]/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] animate-ping" />
                      ط§ظ„ط­ط§ظ„ط© ط§ظ„ط­ط§ظ„ظٹط©
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Items Included Breakdown */}
        {order.items && order.items.length > 0 && (
          <div className="pt-3 border-t border-[var(--color-border-subtle)] space-y-2">
            <h5 className="text-xs font-bold text-[var(--color-text-secondary)]">
              ظ…ط­طھظˆظٹط§طھ ط§ظ„ط·ظ„ط¨ ({order.items.length}):
            </h5>
            <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar pr-1">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs bg-[var(--color-surface-1)] p-2.5 rounded-xl border border-[var(--color-border-subtle)]"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#2F6BFF]/15 text-[#2F6BFF] font-bold text-[10px] flex items-center justify-center">
                      x{item.quantity}
                    </span>
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {item.productName}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[var(--color-text-secondary)]">
                    {formatPrice(item.price * item.quantity, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shipping & Contact Info */}
        <div className="pt-2 border-t border-[var(--color-border-subtle)] text-xs text-[var(--color-text-secondary)] space-y-1">
          <p>
            <strong className="text-[var(--color-text-primary)]">ط§ط³ظ… ط§ظ„ط¹ظ…ظٹظ„:</strong>{' '}
            {order.customerName}
          </p>
          <p>
            <strong className="text-[var(--color-text-primary)]">ط¹ظ†ظˆط§ظ† ط§ظ„طھظˆطµظٹظ„:</strong>{' '}
            {order.governorate} - {order.address}
          </p>
          <p>
            <strong className="text-[var(--color-text-primary)]">ط·ط±ظٹظ‚ط© ط§ظ„ط¯ظپط¹:</strong>{' '}
            {order.paymentMethod}
          </p>
        </div>

        <a
          href={`https://wa.me/${STORE_INFO.whatsappNumber}?text=${encodeURIComponent(
            `ط§ظ„ط³ظ„ط§ظ… ط¹ظ„ظٹظƒظ…طŒ ط£ظˆط¯ ط§ظ„ط§ط³طھظپط³ط§ط± ط¹ظ† ط­ط§ظ„ط© ط·ظ„ط¨ظٹ ط±ظ‚ظ… ${order.orderNumber}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-sm cursor-pointer"
        >
          <span>طھظˆط§طµظ„ ظ…ط¹ ط§ظ„ط¯ط¹ظ… ط§ظ„ظپظ†ظٹ / ط§ظ„ظ…ظ†ط¯ظˆط¨ ط¹ط¨ط± ظˆط§طھط³ط§ط¨</span>
          <Phone className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

