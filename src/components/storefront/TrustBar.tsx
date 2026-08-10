import React from 'react';
import { motion } from 'framer-motion';
import { Headphones, RotateCcw, Truck, ShieldCheck } from 'lucide-react';

const TRUST_ITEMS = [
  { icon: Truck, title: 'توصيل سريع', desc: 'خلال 24 - 48 ساعة' },
  { icon: ShieldCheck, title: 'ضمان أصلي', desc: 'جودة عالية %100' },
  { icon: Headphones, title: 'دعم 24/7', desc: 'خدمة عملاء مميزة' },
  { icon: RotateCcw, title: 'استبدال وإرجاع', desc: 'ضمان رضا العملاء' },
];

export const TrustBar: React.FC = () => {
  return (
    <section className="px-3 sm:px-6 my-5">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="bg-[var(--color-surface-1)] backdrop-blur-md rounded-2xl py-3.5 px-2 border border-[var(--color-border-default)] grid grid-cols-4 gap-1 text-center shadow-sm divide-x divide-x-reverse divide-[var(--color-border-subtle)] dir-rtl"
      >
        {TRUST_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.03 }}
              className="flex flex-col items-center justify-center p-1 text-center group cursor-default"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#2F6BFF]/10 border border-[#2F6BFF]/20 flex items-center justify-center text-[#2F6BFF] mb-1.5 shrink-0 transition-all">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#2F6BFF] group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-xs font-bold text-[var(--color-text-primary)] leading-tight transition-colors">{item.title}</p>
              <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 font-medium">{item.desc}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
};


