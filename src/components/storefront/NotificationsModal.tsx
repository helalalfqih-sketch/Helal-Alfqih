import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationItem } from './types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0F0C1B] border border-gray-800 rounded-[32px] w-full max-w-md p-6 relative shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar dir-rtl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2F6BFF] text-[28px]">
                  notifications
                </span>
                <h3 className="text-xl font-bold text-white">الإشعارات والتنبيهات</h3>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-[#151025] border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                لا توجد إشعارات حالياً
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-gray-400 pb-2">
                  <span>أحدث التحديثات والعروض</span>
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-[#2F6BFF] hover:underline font-bold cursor-pointer"
                  >
                    تحديد الكل ككمقروء
                  </button>
                </div>

                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border text-right transition-all ${
                      !n.read
                        ? 'bg-[#1A142D] border-[#2F6BFF]/50'
                        : 'bg-[#151025] border-gray-800/80'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-sm text-white">{n.title}</h4>
                      <span className="text-[11px] text-gray-400">{n.time}</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
