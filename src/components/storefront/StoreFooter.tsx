import React from 'react';
import { motion } from 'framer-motion';
import { STORE_INFO } from './constants';
import { MessageCircle, MapPin, Truck, Package, Facebook, Instagram, PhoneCall } from 'lucide-react';
import { StoreLogo } from './StoreLogo';

interface StoreFooterProps {
  onOpenTracker: () => void;
}

export const StoreFooter: React.FC<StoreFooterProps> = ({ onOpenTracker }) => {
  const whatsappUrl = `https://wa.me/${STORE_INFO.whatsappNumber}?text=${encodeURIComponent(
    'السلام عليكم، أود الاستفسار عن منتجات متجر إندكس'
  )}`;

  return (
    <motion.footer 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="px-4 sm:px-6 py-8 mb-24 border-t border-[var(--color-border-default)] bg-[var(--color-surface-1)]/80 backdrop-blur-md"
    >
      <div className="bg-[var(--color-surface-2)]/80 backdrop-blur-md border border-[var(--color-border-default)] rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Contact Info List (Right / Main) */}
        <div className="flex-1 flex flex-col gap-3.5 text-right w-full">
          {/* WhatsApp Contact */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-end gap-2.5 text-[var(--color-text-secondary)] text-xs sm:text-sm hover:text-[var(--color-primary)] transition-colors cursor-pointer group"
          >
            <span>
              للطلب والاستفسار (واتساب): <strong className="text-[var(--color-text-primary)] dir-ltr inline-block group-hover:text-emerald-500 transition-colors">967771370740</strong>
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-500 shrink-0 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-4 h-4 fill-emerald-500/20" />
            </div>
          </a>

          {/* Location */}
          <div className="flex items-center justify-end gap-2.5 text-[var(--color-text-secondary)] text-xs sm:text-sm">
            <span>
              العنوان: <strong className="text-[var(--color-text-primary)]">صنعاء - شارع بيون - مقابل صيدلية الرعاية الصحية</strong>
            </span>
            <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
          </div>

          {/* Delivery */}
          <div className="flex items-center justify-end gap-2.5 text-[var(--color-text-secondary)] text-xs sm:text-sm">
            <span>متوفر لدينا خدمة التوصيل السريع لجميع المحافظات</span>
            <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
              <Truck className="w-4 h-4" />
            </div>
          </div>

          {/* Track Order */}
          <div
            onClick={onOpenTracker}
            className="flex items-center justify-end gap-2.5 text-[var(--color-text-secondary)] text-xs sm:text-sm cursor-pointer group"
          >
            <span>
              <strong className="text-[var(--color-text-primary)] underline decoration-[#2F6BFF] group-hover:text-[#2F6BFF] transition-colors">
                تتبع طلبك
              </strong>{' '}
              - برقم الطلب وآخر 4 أرقام من هاتفك
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-500 shrink-0 group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>

          {/* Social Links & WhatsApp Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 mt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white bg-gradient-to-r from-emerald-600 to-emerald-500 border border-emerald-400/50 px-4 py-2 rounded-full text-xs font-bold hover:shadow-[0_0_15px_rgba(37,211,102,0.4)] hover:scale-105 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white/20" />
              <span>تواصل عبر واتساب المباشر</span>
            </a>

            <div className="flex items-center gap-2">
              <a
                href="#"
                aria-label="فيسبوك"
                className="w-9 h-9 rounded-full border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-primary)] bg-[var(--color-surface-1)] transition-all"
              >
                <Facebook className="w-4 h-4" />
              </a>

              <a
                href="#"
                aria-label="انستغرام"
                className="w-9 h-9 rounded-full border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-pink-500 bg-[var(--color-surface-1)] transition-all"
              >
                <Instagram className="w-4 h-4" />
              </a>

              <a
                href={`tel:${STORE_INFO.whatsappNumber}`}
                aria-label="اتصال مباشر"
                className="w-9 h-9 rounded-full border border-[var(--color-border-default)] flex items-center justify-center text-emerald-500 hover:border-emerald-500 bg-[var(--color-surface-1)] transition-all"
              >
                <PhoneCall className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Circular Gold Badge Store Logo ("INDEXES STORE") */}
        <div className="shrink-0 flex justify-center">
          <StoreLogo variant="full" className="p-4 bg-[var(--color-surface-2)]/60 border border-[var(--color-border-default)] rounded-3xl shadow-xl backdrop-blur-md" />
        </div>

      </div>

      <div className="mt-6 text-center text-gray-500 text-xs">
        جميع الحقوق محفوظة © {new Date().getFullYear()} متجر إندكس - INDEXES STORE
      </div>
    </motion.footer>
  );
};
