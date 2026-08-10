import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, MapPin, Phone, Clock, X, Check, ShieldAlert, AlertCircle, FileText, UserCheck } from 'lucide-react';
import { OrderStatus } from './types';
import {
  isOrderEditable,
  submitOrderChangeRequest,
  ChangeRequestType,
} from '@/lib/orderSelfService';
import { YEMEN_GOVERNORATES } from '@/lib/yemenAddress';

interface OrderSelfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderStatus | null;
  onOrderUpdated?: (updatedOrder: OrderStatus) => void;
}

export const OrderSelfServiceModal: React.FC<OrderSelfServiceModalProps> = ({
  isOpen,
  onClose,
  order,
  onOrderUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<ChangeRequestType>('change_address');

  // Form states
  const [newGovernorate, setNewGovernorate] = useState(order?.governorate || YEMEN_GOVERNORATES[0]);
  const [newAddress, setNewAddress] = useState(order?.address || '');
  const [newPhone, setNewPhone] = useState(order?.phone || '');
  const [newRecipientName, setNewRecipientName] = useState(order?.customerName || '');
  const [callBeforeArrival, setCallBeforeArrival] = useState(true);
  const [notes, setNotes] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !order) return null;

  const editable = isOrderEditable(order.status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResultMessage(null);

    let details: Record<string, unknown> = {};

    if (activeTab === 'change_address') {
      details = { governorate: newGovernorate, address: newAddress };
    } else if (activeTab === 'change_phone') {
      details = { phone: newPhone, customerName: newRecipientName };
    } else if (activeTab === 'delivery_notes') {
      details = { callBeforeArrival, notes };
    } else if (activeTab === 'reschedule') {
      details = { preferredDate: rescheduleDate, notes };
    } else if (activeTab === 'cancel_request') {
      details = { reason: cancelReason };
    }

    const res = await submitOrderChangeRequest(order, activeTab, details);
    setIsSubmitting(false);

    if (res.success) {
      setResultMessage({ type: 'success', text: res.message });
      if (onOrderUpdated) {
        const updatedOrder: OrderStatus = {
          ...order,
          ...(activeTab === 'change_address' && { governorate: newGovernorate, address: newAddress }),
          ...(activeTab === 'change_phone' && { phone: newPhone, customerName: newRecipientName }),
          ...(activeTab === 'cancel_request' && { status: 'cancelled', statusLabel: 'تم إلغاء الطلب بناءً على طلبك ❌' }),
        };
        onOrderUpdated(updatedOrder);
      }
    } else {
      setResultMessage({ type: 'error', text: res.message });
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
          className="bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-[28px] w-full max-w-xl p-5 sm:p-7 shadow-2xl dir-rtl relative overflow-y-auto max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-default)] mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">
                  تعديل بيانات الطلب #{order.orderNumber}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">خدمات التعديل والتحكم المباشر في الطلب</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!editable ? (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>الطلب غير قابل للتعديل المباشر حالياً</span>
              </div>
              <p>
                حالة الطلب حالياً هي &quot;{order.statusLabel}&quot;. نظرًا لأن الشحنة خرجت للتسليم أو جاري شحنها، لا يمكن تعديل البيانات تلقائياً. يمكنك التواصل فوراً مع خدمة العملاء للتعديل.
              </p>
            </div>
          ) : (
            <>
              {/* Action Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-5 border-b border-[var(--color-border-subtle)]">
                <button
                  type="button"
                  onClick={() => setActiveTab('change_address')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'change_address'
                      ? 'bg-[#2F6BFF] text-white shadow-md'
                      : 'bg-[var(--color-surface-2)] text-gray-400 hover:text-white'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" /> تغيير العنوان
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('change_phone')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'change_phone'
                      ? 'bg-[#2F6BFF] text-white shadow-md'
                      : 'bg-[var(--color-surface-2)] text-gray-400 hover:text-white'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" /> رقم التواصل
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('delivery_notes')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'delivery_notes'
                      ? 'bg-[#2F6BFF] text-white shadow-md'
                      : 'bg-[var(--color-surface-2)] text-gray-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> ملاحظات المندوب
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('reschedule')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'reschedule'
                      ? 'bg-[#2F6BFF] text-white shadow-md'
                      : 'bg-[var(--color-surface-2)] text-gray-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> تأجيل التسليم
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('cancel_request')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'cancel_request'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-[var(--color-surface-2)] text-gray-400 hover:text-rose-400'
                  }`}
                >
                  <X className="w-3.5 h-3.5" /> إلغاء الطلب
                </button>
              </div>

              {resultMessage && (
                <div
                  className={`p-3.5 rounded-xl border mb-5 text-xs font-bold flex items-center gap-2 ${
                    resultMessage.type === 'success'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {resultMessage.type === 'success' ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{resultMessage.text}</span>
                </div>
              )}

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === 'change_address' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">المحافظة</label>
                      <select
                        value={newGovernorate}
                        onChange={(e) => setNewGovernorate(e.target.value)}
                        className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3 py-2.5 text-xs text-[var(--color-text-primary)] focus:border-blue-500 focus:outline-none cursor-pointer"
                      >
                        {YEMEN_GOVERNORATES.map((g) => (
                          <option key={g} value={g} className="bg-gray-900 text-white">
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">العنوان الجديد والشارع وأقرب معلم</label>
                      <textarea
                        required
                        rows={3}
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        placeholder="صنعاء - حدة - بجانب صخر التكنولوجي"
                        className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl p-3 text-xs text-[var(--color-text-primary)] focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'change_phone' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">اسم المستلم</label>
                      <input
                        type="text"
                        required
                        value={newRecipientName}
                        onChange={(e) => setNewRecipientName(e.target.value)}
                        className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3 py-2.5 text-xs text-[var(--color-text-primary)] focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">رقم الهاتف الجديد</label>
                      <input
                        type="tel"
                        required
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3 py-2.5 text-xs text-[var(--color-text-primary)] focus:border-blue-500 focus:outline-none text-left dir-ltr"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'delivery_notes' && (
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={callBeforeArrival}
                        onChange={(e) => setCallBeforeArrival(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-xs font-bold text-[var(--color-text-primary)]">الاتصال بي هاتفياً قبل الوصول لتأكيد التواجد</span>
                    </label>

                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">تعليمات إضافية للمندوب</label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="مثال: يرجى التسليم بعد الساعة 4 عصراً"
                        className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl p-3 text-xs text-[var(--color-text-primary)] focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'reschedule' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">الموعد المفضل للتسليم</label>
                      <input
                        type="date"
                        required
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3 py-2.5 text-xs text-[var(--color-text-primary)] focus:border-blue-500 focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'cancel_request' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                      سيؤدي هذا إلى تقديم طلب إلغاء فوري للطلب #{order.orderNumber}.
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">سبب الإلغاء</label>
                      <textarea
                        required
                        rows={3}
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="اكتب سبب طلب إلغاء الشحنة..."
                        className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl p-3 text-xs text-[var(--color-text-primary)] focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 py-3 rounded-2xl font-bold text-xs text-white transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeTab === 'cancel_request'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-[#2F6BFF] hover:bg-[#2458D8]'
                    }`}
                  >
                    {isSubmitting ? (
                      <span>جاري حفظ التعديل...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> حفظ وإرسال التعديل
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
