import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SortOption } from "./types";
import {
  Grid,
  Watch,
  Headphones,
  Sparkles,
  Home,
  Smartphone,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Flame,
  CheckCircle2,
  ChevronDown,
  X,
  Filter,
} from "lucide-react";

interface CategoryBarProps {
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  selectedSort: SortOption;
  onSelectSort: (sort: SortOption) => void;
}

const CATEGORY_ITEMS = [
  { id: "all", name: "الكل", icon: Grid },
  { id: "smartwatches", name: "ساعات ذكية", icon: Watch },
  { id: "audio", name: "صوتيات", icon: Headphones },
  { id: "perfumes", name: "عطور وبخور", icon: Sparkles },
  { id: "appliances", name: "أجهزة منزلية", icon: Home },
  { id: "accessories", name: "إكسسوارات", icon: Smartphone },
];

const SORT_OPTIONS: {
  id: SortOption;
  label: string;
  icon: React.ElementType<{ className?: string }>;
  badge?: string;
}[] = [
  { id: "default", label: "الترتيب الافتراضي", icon: SlidersHorizontal },
  { id: "price-high", label: "الأعلى سعراً", icon: TrendingUp },
  { id: "price-low", label: "الأقل سعراً", icon: TrendingDown },
  { id: "best-selling", label: "الأكثر مبيعاً", icon: Flame, badge: "شائع" },
  { id: "newest", label: "الأحدث وصولاً", icon: Sparkles, badge: "جديد" },
];

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategoryId,
  onSelectCategory,
  selectedSort,
  onSelectSort,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentSortObj = SORT_OPTIONS.find((s) => s.id === selectedSort) || SORT_OPTIONS[0];
  const CurrentIcon = currentSortObj.icon;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="px-3 sm:px-6 py-2 space-y-3">
      {/* 6 Category Square Cards Grid */}
      <div className="grid grid-cols-6 gap-2 sm:gap-3">
        {CATEGORY_ITEMS.map((cat, idx) => {
          const isSelected = selectedCategoryId === cat.id;
          const IconComp = cat.icon;
          return (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? "bg-[var(--color-surface-2)] border-[#2F6BFF] text-[var(--color-text-primary)] shadow-sm"
                  : "bg-[var(--color-surface-1)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]"
              }`}
            >
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center mb-1 transition-all ${
                  isSelected
                    ? "bg-[#2F6BFF] text-white shadow-sm"
                    : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]"
                }`}
              >
                <IconComp className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-center line-clamp-1">
                {cat.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Sorting Filter Bar */}
      <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-2xl p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-sm relative">
        {/* Left Side: Filter Label & Interactive Dropdown Trigger */}
        <div className="flex items-center gap-2.5 flex-wrap relative" ref={dropdownRef}>
          <span className="text-xs font-bold text-[var(--color-text-secondary)] hidden sm:inline">
            ترتيب حسب:
          </span>

          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-2 border px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-97 group ${
              selectedSort !== "default"
                ? "bg-[#2F6BFF]/10 text-[#2F6BFF] border-[#2F6BFF]/50 shadow-sm"
                : "bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-primary)] border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]"
            }`}
          >
            <CurrentIcon className="w-3.5 h-3.5 text-[#2F6BFF]" />
            <span>{currentSortObj.label}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Visible 'Sort Applied' Indicator Pill */}
          <AnimatePresence>
            {selectedSort !== "default" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: -6 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -6 }}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#2F6BFF] to-cyan-500 text-white px-2.5 py-1 rounded-full text-[11px] font-black shadow-md border border-white/20 dir-rtl"
              >
                <Filter className="w-3 h-3 text-cyan-200 animate-pulse" />
                <span>الترتيب المطبق: {currentSortObj.label}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSort("default");
                  }}
                  className="p-0.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer mr-0.5 text-white/90 hover:text-white"
                  title="إلغاء الترتيب الإرجاع للافتراضي"
                  aria-label="إلغاء الترتيب"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Animated Dropdown Menu */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                key="category-sort-dropdown"
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-2 w-52 bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-2xl p-1.5 shadow-xl z-50 space-y-1 dir-rtl"
              >
                {SORT_OPTIONS.map((opt) => {
                  const isOptSelected = selectedSort === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        onSelectSort(opt.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isOptSelected
                          ? "bg-[#2F6BFF] text-white shadow-sm"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-current" />
                        <span>{opt.label}</span>
                      </div>

                      {isOptSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
