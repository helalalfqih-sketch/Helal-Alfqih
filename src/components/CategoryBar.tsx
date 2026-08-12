import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SortOption, Product } from '../types';
import {
  Grid,
  Watch,
  Headphones,
  Sparkles,
  Home,
  Smartphone,
  Wrench,
  Car,
  Dumbbell,
  Baby,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Flame,
  CheckCircle2,
  ChevronDown,
  X,
  Filter,
  Banknote,
  Coins,
  ArrowUpDown,
  Sliders,
  Tag,
  Star,
  Award,
  Check,
  RotateCcw,
} from 'lucide-react';

export type PriceRangePreset = 'all' | 'under-20k' | '20k-50k' | 'over-50k' | 'custom';

export interface BrandOption {
  id: string;
  name: string;
  label: string;
  keywords: string[];
}

export const STORE_BRANDS: BrandOption[] = [
  { id: 'indexes', name: 'إندكس', label: 'إندكس INDEXES', keywords: ['إندكس', 'indexes', 'vip'] },
  { id: 'anker', name: 'أنكر', label: 'أنكر Anker', keywords: ['anker', 'أنكر', 'eufy', 'soundcore'] },
  { id: 'apple', name: 'أبل', label: 'أبل Apple', keywords: ['apple', 'أبل', 'آيفون', 'ايفون', 'airpods', 'ipad'] },
  { id: 'samsung', name: 'سامسونج', label: 'سامسونج Samsung', keywords: ['samsung', 'سامسونج', 'galaxy'] },
  { id: 'xiaomi', name: 'شاومي', label: 'شاومي Xiaomi', keywords: ['xiaomi', 'شاومي', 'redmi', 'poco'] },
  { id: 'hoco', name: 'هوكو', label: 'هوكو Hoco', keywords: ['hoco', 'هوكو'] },
  { id: 'baseus', name: 'بيسوس', label: 'بيسوس Baseus', keywords: ['baseus', 'بيسوس'] },
  { id: 'joyroom', name: 'جويروم', label: 'جويروم Joyroom', keywords: ['joyroom', 'جويروم'] },
  { id: 'sony', name: 'سوني', label: 'سوني Sony', keywords: ['sony', 'سوني'] },
  { id: 'denx', name: 'دنيكس', label: 'دنيكس Denx', keywords: ['denx', 'دنيكس'] },
];

export interface RatingOption {
  id: string;
  label: string;
  minRating: number;
  stars: number;
}

export const RATING_OPTIONS: RatingOption[] = [
  { id: '5.0', label: '5.0 نجوم (أعلى تقييم)', minRating: 4.9, stars: 5 },
  { id: '4.8', label: '4.8+ نجوم (ممتاز جداً)', minRating: 4.8, stars: 4.8 },
  { id: '4.5', label: '4.5+ نجوم (ممتاز)', minRating: 4.5, stars: 4.5 },
  { id: '4.0', label: '4.0+ نجوم (جيد جداً)', minRating: 4.0, stars: 4 },
];

export interface CategoryBarProps {
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  selectedSort: SortOption;
  onSelectSort: (sort: SortOption) => void;
  selectedPriceRange?: PriceRangePreset;
  onSelectPriceRange?: (range: PriceRangePreset, customMin?: number, customMax?: number) => void;
  customMinPrice?: number;
  customMaxPrice?: number;
  selectedBrands?: string[];
  onSelectBrands?: (brands: string[]) => void;
  selectedRatings?: string[];
  onSelectRatings?: (ratings: string[]) => void;
}

const CATEGORY_ITEMS = [
  { id: 'all', name: 'الكل', icon: Grid },
  { id: 'tools', name: 'أدوات ومعدات', icon: Wrench },
  { id: 'automotive', name: 'مستلزمات السيارات', icon: Car },
  { id: 'health_fitness', name: 'الصحة واللياقة', icon: Dumbbell },
  { id: 'home_appliances', name: 'أجهزة ومنزل', icon: Home },
  { id: 'baby_kids', name: 'مستلزمات الأطفال', icon: Baby },
  { id: 'smartwatches', name: 'ساعات ذكية', icon: Watch },
  { id: 'audio', name: 'سماعات وصوتيات', icon: Headphones },
  { id: 'perfumes', name: 'عطور وبخور', icon: Sparkles },
  { id: 'accessories', name: 'إكسسوارات وهواتف', icon: Smartphone },
];

const PRICE_PRESETS: { id: PriceRangePreset; label: string; icon: React.ElementType<{ className?: string }>; sublabel: string }[] = [
  { id: 'all', label: 'كافة الأسعار', icon: Coins, sublabel: 'الكل' },
  { id: 'under-20k', label: 'أقل من 20,000 ر.ي', icon: Banknote, sublabel: 'منخفض' },
  { id: '20k-50k', label: '20,000 - 50,000 ر.ي', icon: Coins, sublabel: 'متوسط' },
  { id: 'over-50k', label: 'أكثر من 50,000 ر.ي', icon: Sparkles, sublabel: 'مرتفع' },
];

const SORT_OPTIONS: { id: SortOption; label: string; icon: React.ElementType<{ className?: string }>; badge?: string }[] = [
  { id: 'default', label: 'الترتيب الافتراضي', icon: SlidersHorizontal },
  { id: 'price-low', label: 'الأقل سعراً (منخفض-مرتفع)', icon: TrendingDown, badge: 'رخيص' },
  { id: 'price-high', label: 'الأعلى سعراً (مرتفع-منخفض)', icon: TrendingUp, badge: 'فاخر' },
  { id: 'best-selling', label: 'الأكثر مبيعاً', icon: Flame, badge: 'شائع' },
  { id: 'newest', label: 'الأحدث وصولاً', icon: Sparkles, badge: 'جديد' },
];

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategoryId,
  onSelectCategory,
  selectedSort,
  onSelectSort,
  selectedPriceRange = 'all',
  onSelectPriceRange,
  customMinPrice,
  customMaxPrice,
  selectedBrands = [],
  onSelectBrands,
  selectedRatings = [],
  onSelectRatings,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCustomDrawerOpen, setIsCustomDrawerOpen] = useState(false);
  const [isBrandDrawerOpen, setIsBrandDrawerOpen] = useState(false);
  const [isRatingDrawerOpen, setIsRatingDrawerOpen] = useState(false);

  const [tempMin, setTempMin] = useState<string>(customMinPrice ? String(customMinPrice) : '');
  const [tempMax, setTempMax] = useState<string>(customMaxPrice ? String(customMaxPrice) : '');
  
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApplyCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const minVal = tempMin ? Number(tempMin) : undefined;
    const maxVal = tempMax ? Number(tempMax) : undefined;
    if (onSelectPriceRange) {
      onSelectPriceRange('custom', minVal, maxVal);
    }
    setIsCustomDrawerOpen(false);
  };

  const handleToggleBrand = (brandId: string) => {
    if (!onSelectBrands) return;
    if (selectedBrands.includes(brandId)) {
      onSelectBrands(selectedBrands.filter((b) => b !== brandId));
    } else {
      onSelectBrands([...selectedBrands, brandId]);
    }
  };

  const handleToggleRating = (ratingId: string) => {
    if (!onSelectRatings) return;
    if (selectedRatings.includes(ratingId)) {
      onSelectRatings(selectedRatings.filter((r) => r !== ratingId));
    } else {
      onSelectRatings([...selectedRatings, ratingId]);
    }
  };

  const handleResetAllFilters = () => {
    onSelectCategory('all');
    if (onSelectPriceRange) onSelectPriceRange('all');
    if (onSelectBrands) onSelectBrands([]);
    if (onSelectRatings) onSelectRatings([]);
    onSelectSort('default');
    setIsCustomDrawerOpen(false);
    setIsBrandDrawerOpen(false);
    setIsRatingDrawerOpen(false);
  };

  const activePricePresetObj = PRICE_PRESETS.find((p) => p.id === selectedPriceRange);

  const hasActiveFilters =
    selectedCategoryId !== 'all' ||
    selectedPriceRange !== 'all' ||
    selectedBrands.length > 0 ||
    selectedRatings.length > 0 ||
    selectedSort !== 'default';

  return (
    <div className="px-3 sm:px-6 py-2 space-y-3">
      {/* 1. Category Horizontal Scroll Row on Mobile & Desktop */}
      <div
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth dir-rtl"
        style={{ touchAction: 'pan-x pan-y', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {CATEGORY_ITEMS.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const IconComp = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#2F6BFF] border-[#2F6BFF] text-white shadow-md shadow-blue-500/20'
                  : 'bg-[var(--color-surface-1)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
              </div>
              <span className="whitespace-nowrap">{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Sub-Filter Bar for Multi-Select Filters (السعر + الماركات + التقييم + الترتيب) */}
      <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-2xl p-2.5 space-y-2 shadow-sm dir-rtl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          {/* Right Label & Filter Triggers */}
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--color-text-primary)] shrink-0 pl-1 border-l border-[var(--color-border-subtle)] ml-1">
              <Filter className="w-4 h-4 text-[#2F6BFF]" />
              <span className="hidden sm:inline">التصفية المتعددة:</span>
            </div>

            {/* Price Presets Chips */}
            <div
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
              style={{ touchAction: 'pan-x pan-y', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {PRICE_PRESETS.map((preset) => {
                const isSelected = selectedPriceRange === preset.id;
                const PresetIcon = preset.icon;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      if (onSelectPriceRange) {
                        onSelectPriceRange(preset.id);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#2F6BFF] border-[#2F6BFF] text-white shadow-sm'
                        : 'bg-[var(--color-surface-2)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]'
                    }`}
                  >
                    <PresetIcon className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-[#2F6BFF]'}`} />
                    <span>{preset.label}</span>
                  </button>
                );
              })}

              {/* Custom Min/Max Trigger Pill */}
              <button
                type="button"
                onClick={() => {
                  setIsCustomDrawerOpen(!isCustomDrawerOpen);
                  setIsBrandDrawerOpen(false);
                  setIsRatingDrawerOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedPriceRange === 'custom'
                    ? 'bg-[#2F6BFF] border-[#2F6BFF] text-white shadow-sm'
                    : 'bg-[var(--color-surface-2)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <Sliders className="w-3 h-3 text-cyan-400" />
                <span>
                  {selectedPriceRange === 'custom' && (customMinPrice || customMaxPrice)
                    ? `مخصص (${customMinPrice || 0} - ${customMaxPrice || '∞'})`
                    : 'نطاق سعر ⚙️'}
                </span>
              </button>

              {/* Multi-Select Brand Filter Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  setIsBrandDrawerOpen(!isBrandDrawerOpen);
                  setIsCustomDrawerOpen(false);
                  setIsRatingDrawerOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedBrands.length > 0
                    ? 'bg-amber-500 border-amber-500 text-black font-extrabold shadow-sm'
                    : 'bg-[var(--color-surface-2)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <Award className={`w-3.5 h-3.5 ${selectedBrands.length > 0 ? 'text-black' : 'text-amber-400'}`} />
                <span>
                  {selectedBrands.length > 0
                    ? `الماركات (${selectedBrands.length})`
                    : 'العلامة التجارية 🏷️'}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isBrandDrawerOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Multi-Select Rating Filter Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  setIsRatingDrawerOpen(!isRatingDrawerOpen);
                  setIsCustomDrawerOpen(false);
                  setIsBrandDrawerOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedRatings.length > 0
                    ? 'bg-emerald-500 border-emerald-500 text-black font-extrabold shadow-sm'
                    : 'bg-[var(--color-surface-2)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <Star className={`w-3.5 h-3.5 fill-current ${selectedRatings.length > 0 ? 'text-black' : 'text-amber-400'}`} />
                <span>
                  {selectedRatings.length > 0
                    ? `التقييم (${selectedRatings.length})`
                    : 'التقييم ⭐'}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isRatingDrawerOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Left Side: Sorting & Reset Controls */}
          <div className="flex items-center gap-2 shrink-0 relative" ref={dropdownRef}>
            {/* Low-to-High / High-to-Low Direct Sort Toggles */}
            <button
              onClick={() => onSelectSort(selectedSort === 'price-low' ? 'price-high' : 'price-low')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                selectedSort === 'price-low' || selectedSort === 'price-high'
                  ? 'bg-[#2F6BFF]/15 text-[#2F6BFF] border-[#2F6BFF]/50 shadow-sm'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border-[var(--color-border-default)] hover:text-[var(--color-text-primary)]'
              }`}
              title="تبديل الترتيب بين المنخفض والمرتفع"
            >
              <ArrowUpDown className="w-3 h-3 text-[#2F6BFF]" />
              <span className="hidden sm:inline">
                {selectedSort === 'price-low' ? 'منخفض → مرتفع' : selectedSort === 'price-high' ? 'مرتفع → منخفض' : 'سعر منخفض/مرتفع'}
              </span>
              <span className="sm:hidden">
                {selectedSort === 'price-low' ? 'منخفض' : selectedSort === 'price-high' ? 'مرتفع' : 'السعر'}
              </span>
            </button>

            {/* Dropdown Menu Trigger for Full Sorting Options */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-1.5 border px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                selectedSort !== 'default'
                  ? 'bg-[#2F6BFF] text-white border-[#2F6BFF]'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]'
              }`}
            >
              <CurrentIcon className="w-3 h-3 text-current" />
              <span>{currentSortObj.label}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Animated Dropdown Menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  key="category-sort-dropdown"
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-56 bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-2xl p-1.5 shadow-xl z-50 space-y-1 dir-rtl"
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
                            ? 'bg-[#2F6BFF] text-white shadow-sm'
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]'
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

        {/* Multi-Select Brand Drawer Grid */}
        <AnimatePresence>
          {isBrandDrawerOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl p-3 space-y-3 dir-rtl"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">
                    تحديد العلامات التجارية (اختر ماركة أو أكثر)
                  </span>
                  {selectedBrands.length > 0 && (
                    <span className="bg-amber-500/20 text-amber-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30">
                      محدد {selectedBrands.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedBrands.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onSelectBrands && onSelectBrands([])}
                      className="text-[11px] font-bold text-rose-400 hover:underline cursor-pointer"
                    >
                      إلغاء الماركات
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsBrandDrawerOpen(false)}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Brand Pills Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {STORE_BRANDS.map((brand) => {
                  const isChecked = selectedBrands.includes(brand.id);
                  return (
                    <button
                      key={brand.id}
                      type="button"
                      onClick={() => handleToggleBrand(brand.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50 shadow-sm'
                          : 'bg-[var(--color-surface-1)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      <span className="truncate">{brand.label}</span>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mr-1.5 transition-colors ${
                          isChecked
                            ? 'bg-amber-500 border-amber-500 text-black'
                            : 'border-[var(--color-border-strong)] bg-transparent'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Multi-Select Rating Drawer List */}
        <AnimatePresence>
          {isRatingDrawerOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl p-3 space-y-3 dir-rtl"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">
                    تحديد تقييمات العملاء (اختر تقييم أو أكثر)
                  </span>
                  {selectedRatings.length > 0 && (
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      محدد {selectedRatings.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedRatings.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onSelectRatings && onSelectRatings([])}
                      className="text-[11px] font-bold text-rose-400 hover:underline cursor-pointer"
                    >
                      إلغاء التقييم
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsRatingDrawerOpen(false)}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Rating Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {RATING_OPTIONS.map((rating) => {
                  const isChecked = selectedRatings.includes(rating.id);
                  return (
                    <button
                      key={rating.id}
                      type="button"
                      onClick={() => handleToggleRating(rating.id)}
                      className={`flex items-center justify-between px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50 shadow-sm'
                          : 'bg-[var(--color-surface-1)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{rating.label}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mr-1.5 transition-colors ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-500 text-black'
                            : 'border-[var(--color-border-strong)] bg-transparent'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Applied Filters Active Status Bar & Reset Button */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-extrabold text-[var(--color-text-secondary)]">الفلاتر المحددة:</span>

              {/* Selected Category Pill */}
              {selectedCategoryId !== 'all' && (
                <div className="inline-flex items-center gap-1 bg-[#2F6BFF]/15 text-[#2F6BFF] border border-[#2F6BFF]/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  <span>القسم: {CATEGORY_ITEMS.find((c) => c.id === selectedCategoryId)?.name}</span>
                  <button
                    type="button"
                    onClick={() => onSelectCategory('all')}
                    className="p-0.5 hover:text-rose-500 transition-colors cursor-pointer mr-1"
                    title="إزالة القسم"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Selected Price Range Pill */}
              {selectedPriceRange !== 'all' && (
                <div className="inline-flex items-center gap-1 bg-[#2F6BFF]/15 text-[#2F6BFF] border border-[#2F6BFF]/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  <Filter className="w-3 h-3" />
                  <span>
                    السعر: {activePricePresetObj ? activePricePresetObj.label : `مخصص (${customMinPrice || 0} - ${customMaxPrice || '∞'} ر.ي)`}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectPriceRange && onSelectPriceRange('all')}
                    className="p-0.5 hover:text-rose-500 transition-colors cursor-pointer mr-1"
                    title="إزالة فلتر السعر"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Selected Brands Pills */}
              {selectedBrands.map((brandId) => {
                const bObj = STORE_BRANDS.find((b) => b.id === brandId);
                return (
                  <div
                    key={brandId}
                    className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                  >
                    <Award className="w-3 h-3 text-amber-400" />
                    <span>الماركة: {bObj ? bObj.name : brandId}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleBrand(brandId)}
                      className="p-0.5 hover:text-rose-500 transition-colors cursor-pointer mr-1"
                      title="إزالة هذه الماركة"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {/* Selected Ratings Pills */}
              {selectedRatings.map((ratingId) => {
                const rObj = RATING_OPTIONS.find((r) => r.id === ratingId);
                return (
                  <div
                    key={ratingId}
                    className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                  >
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>التقييم: {rObj ? rObj.label : ratingId}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleRating(ratingId)}
                      className="p-0.5 hover:text-rose-500 transition-colors cursor-pointer mr-1"
                      title="إزالة هذا التقييم"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {/* Selected Sort Pill */}
              {selectedSort !== 'default' && (
                <div className="inline-flex items-center gap-1 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  <ArrowUpDown className="w-3 h-3" />
                  <span>الترتيب: {currentSortObj.label}</span>
                  <button
                    type="button"
                    onClick={() => onSelectSort('default')}
                    className="p-0.5 hover:text-rose-500 transition-colors cursor-pointer mr-1"
                    title="إعادة الترتيب للافتراضي"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleResetAllFilters}
              className="text-[11px] font-extrabold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer flex items-center gap-1 mr-auto shrink-0 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 hover:bg-rose-500/20"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة ضبط جميع الفلاتر</span>
            </button>
          </div>
        )}

        {/* Expandable Custom Price Range Drawer */}
        <AnimatePresence>
          {isCustomDrawerOpen && (
            <motion.form
              onSubmit={handleApplyCustomPrice}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl p-3 mt-2 space-y-3 dir-rtl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-primary)]">
                  <Sliders className="w-3.5 h-3.5 text-[#2F6BFF]" />
                  <span>تحديد نطاق السعر بالريال اليمني (YER)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomDrawerOpen(false)}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-[var(--color-text-secondary)] mb-1">
                    الحد الأدنى (من)
                  </label>
                  <input
                    type="number"
                    placeholder="مثال: 10000"
                    value={tempMin}
                    onChange={(e) => setTempMin(e.target.value)}
                    className="w-full bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[#2F6BFF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-[var(--color-text-secondary)] mb-1">
                    الحد الأقصى (إلى)
                  </label>
                  <input
                    type="number"
                    placeholder="مثال: 60000"
                    value={tempMax}
                    onChange={(e) => setTempMax(e.target.value)}
                    className="w-full bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[#2F6BFF]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setTempMin('');
                    setTempMax('');
                    if (onSelectPriceRange) onSelectPriceRange('all');
                    setIsCustomDrawerOpen(false);
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded-lg text-xs font-bold bg-[#2F6BFF] hover:bg-[#2458D8] text-white shadow-sm cursor-pointer"
                >
                  تطبيق النطاق
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};



