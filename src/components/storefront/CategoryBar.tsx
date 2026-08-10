import { useEffect, useRef, useState, type ElementType, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  CheckCircle2,
  ChevronDown,
  Coins,
  Filter,
  Flame,
  Baby,
  Car,
  Dumbbell,
  Grid,
  Headphones,
  Home,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Watch,
  Wrench,
  X,
} from "lucide-react";
import type { SortOption } from "./types";

export type PriceRangePreset = "all" | "under-20k" | "20k-50k" | "over-50k" | "custom";

interface CategoryBarProps {
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  selectedSort: SortOption;
  onSelectSort: (sort: SortOption) => void;
  selectedPriceRange: PriceRangePreset;
  onSelectPriceRange: (range: PriceRangePreset, min?: number, max?: number) => void;
  customMinPrice?: number;
  customMaxPrice?: number;
}

const CATEGORY_ITEMS = [
  { id: "all", name: "الكل", icon: Grid },
  { id: "tools", name: "أدوات ومعدات", icon: Wrench },
  { id: "automotive", name: "مستلزمات السيارات", icon: Car },
  { id: "health_fitness", name: "الصحة واللياقة", icon: Dumbbell },
  { id: "home_appliances", name: "أجهزة ومنزل", icon: Home },
  { id: "baby_kids", name: "مستلزمات الأطفال", icon: Baby },
  { id: "smartwatches", name: "ساعات ذكية", icon: Watch },
  { id: "audio", name: "سماعات وصوتيات", icon: Headphones },
  { id: "perfumes", name: "عطور وبخور", icon: Sparkles },
  { id: "accessories", name: "إكسسوارات وهواتف", icon: Smartphone },
];

const PRICE_PRESETS: Array<{
  id: Exclude<PriceRangePreset, "custom">;
  label: string;
  icon: ElementType<{ className?: string }>;
}> = [
  { id: "all", label: "كافة الأسعار", icon: Coins },
  { id: "under-20k", label: "أقل من 20,000 ر.ي", icon: Banknote },
  { id: "20k-50k", label: "20,000 - 50,000 ر.ي", icon: Coins },
  { id: "over-50k", label: "أكثر من 50,000 ر.ي", icon: Sparkles },
];

const SORT_OPTIONS: Array<{
  id: SortOption;
  label: string;
  icon: ElementType<{ className?: string }>;
  badge?: string;
}> = [
  { id: "default", label: "الترتيب الافتراضي", icon: SlidersHorizontal },
  { id: "price-low", label: "السعر: من الأقل", icon: TrendingDown },
  { id: "price-high", label: "السعر: من الأعلى", icon: TrendingUp },
  { id: "best-selling", label: "الأكثر مبيعاً", icon: Flame, badge: "شائع" },
  { id: "newest", label: "الأحدث وصولاً", icon: Sparkles, badge: "جديد" },
];

export function CategoryBar({
  selectedCategoryId,
  onSelectCategory,
  selectedSort,
  onSelectSort,
  selectedPriceRange,
  onSelectPriceRange,
  customMinPrice,
  customMaxPrice,
}: CategoryBarProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(customMinPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(customMaxPrice?.toString() ?? "");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentSort = SORT_OPTIONS.find((option) => option.id === selectedSort) ?? SORT_OPTIONS[0];
  const CurrentSortIcon = currentSort.icon;

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const applyCustomPrice = (event: FormEvent) => {
    event.preventDefault();
    const min = minPrice === "" ? undefined : Math.max(0, Number(minPrice));
    const max = maxPrice === "" ? undefined : Math.max(0, Number(maxPrice));
    onSelectPriceRange("custom", min, max);
    setIsCustomOpen(false);
  };

  return (
    <section className="space-y-3 px-3 py-2 sm:px-6" aria-label="تصفية المنتجات">
      <div className="no-scrollbar flex touch-pan-x items-center gap-2 overflow-x-auto py-1">
        {CATEGORY_ITEMS.map(({ id, name, icon: Icon }) => {
          const active = selectedCategoryId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectCategory(id)}
              aria-pressed={active}
              className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition-all ${
                active
                  ? "border-[#2F6BFF] bg-[#2F6BFF] text-white shadow-md shadow-blue-500/20"
                  : "border-[var(--color-border-default)] bg-[var(--color-surface-1)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-lg ${active ? "bg-white/20" : "bg-[var(--color-surface-2)]"}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="whitespace-nowrap">{name}</span>
            </button>
          );
        })}
      </div>

      <div className="relative space-y-2 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-1)] p-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="no-scrollbar flex min-w-0 flex-1 touch-pan-x items-center gap-1.5 overflow-x-auto">
            <span className="flex shrink-0 items-center gap-1.5 border-l border-[var(--color-border-subtle)] pl-2 text-xs font-extrabold text-[var(--color-text-primary)]">
              <Banknote className="h-4 w-4 text-[#2F6BFF]" />
              تصفية السعر:
            </span>
            {PRICE_PRESETS.map(({ id, label, icon: Icon }) => {
              const active = selectedPriceRange === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectPriceRange(id)}
                  aria-pressed={active}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all ${
                    active
                      ? "border-[#2F6BFF] bg-[#2F6BFF] text-white"
                      : "border-[var(--color-border-default)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setIsCustomOpen((open) => !open)}
              aria-expanded={isCustomOpen}
              className={`shrink-0 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all ${
                selectedPriceRange === "custom"
                  ? "border-[#2F6BFF] bg-[#2F6BFF] text-white"
                  : "border-[var(--color-border-default)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]"
              }`}
            >
              {selectedPriceRange === "custom"
                ? `${customMinPrice ?? 0}–${customMaxPrice ?? "∞"}`
                : "نطاق مخصص ⚙️"}
            </button>
          </div>

          <div ref={dropdownRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsSortOpen((open) => !open)}
              aria-expanded={isSortOpen}
              className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                selectedSort === "default"
                  ? "border-[var(--color-border-default)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)]"
                  : "border-[#2F6BFF]/50 bg-[#2F6BFF]/10 text-[#2F6BFF]"
              }`}
            >
              <CurrentSortIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{currentSort.label}</span>
              <span className="sm:hidden">ترتيب</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${isSortOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {isSortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  className="absolute left-0 top-full z-50 mt-2 w-56 space-y-1 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-1)] p-1.5 shadow-xl"
                >
                  {SORT_OPTIONS.map(({ id, label, icon: Icon, badge }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        onSelectSort(id);
                        setIsSortOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                        selectedSort === id
                          ? "bg-[#2F6BFF] text-white"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </span>
                      {selectedSort === id ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : badge ? (
                        <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] text-amber-500">
                          {badge}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {isCustomOpen && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={applyCustomPrice}
              className="flex flex-wrap items-end gap-2 overflow-hidden border-t border-[var(--color-border-subtle)] pt-2"
            >
              <label className="min-w-28 flex-1 text-[11px] font-bold text-[var(--color-text-secondary)]">
                من
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-text-primary)] outline-none focus:border-[#2F6BFF]"
                />
              </label>
              <label className="min-w-28 flex-1 text-[11px] font-bold text-[var(--color-text-secondary)]">
                إلى
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-text-primary)] outline-none focus:border-[#2F6BFF]"
                />
              </label>
              <button
                type="submit"
                className="rounded-xl bg-[#2F6BFF] px-4 py-2 text-xs font-black text-white"
              >
                تطبيق
              </button>
              <button
                type="button"
                onClick={() => setIsCustomOpen(false)}
                aria-label="إغلاق النطاق المخصص"
                className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-2)] p-2 text-[var(--color-text-secondary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {(selectedSort !== "default" || selectedPriceRange !== "all") && (
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-[var(--color-text-secondary)]">
            <Filter className="h-3.5 w-3.5 text-[#2F6BFF]" />
            <span>تم تطبيق التصفية</span>
            <button
              type="button"
              onClick={() => {
                onSelectSort("default");
                onSelectPriceRange("all");
              }}
              className="rounded-full bg-rose-500/10 px-2 py-1 text-rose-400"
            >
              مسح الكل
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
