import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { Product, Currency } from './types';

import { formatPrice } from './currency';
import { Bot, Sparkles, Search, Headphones, Radio, Camera, Watch, Gamepad2, Zap, Tag, ChevronLeft, ArrowLeft, History, X } from 'lucide-react';
import { getRecentSearches, saveRecentSearch, removeRecentSearch, clearRecentSearches } from './searchHistory';

interface AISearchSectionProps {
  products?: Product[];
  onFilteredProductsChange?: (products: Product[]) => void;
  onSelectProduct: (product: Product) => void;
  currency: Currency;
  onSearchQuerySubmit?: (query: string) => void;
}

export const AISearchSection: React.FC<AISearchSectionProps> = ({
  products = [],
  onSelectProduct,
  currency,
  onSearchQuerySubmit,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [aiResult, setAiResult] = useState<{
    aiSummary: string;
    matchedProducts: Product[];
    recommendedKeywords?: string[];
  } | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  const refreshRecentSearches = () => {
    setRecentSearches(getRecentSearches());
  };

  const handleRemoveRecentSearch = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const updated = removeRecentSearch(term);
    setRecentSearches(updated);
  };

  const handleClearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = clearRecentSearches();
    setRecentSearches(updated);
  };

  const trimmedQuery = query.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (!trimmedQuery) return { products: [], categories: [] };

    const categoriesSet = new Set<string>();
    products.forEach((p: Product) => {
      if (p.category && p.category.toLowerCase().includes(trimmedQuery)) {
        categoriesSet.add(p.category);
      }
    });

    const matchingProducts = products.filter((p: Product) =>
      p.name.toLowerCase().includes(trimmedQuery) ||
      p.category.toLowerCase().includes(trimmedQuery) ||
      p.subtitle.toLowerCase().includes(trimmedQuery) ||
      p.description.toLowerCase().includes(trimmedQuery)
    ).slice(0, 5);

    return {
      products: matchingProducts,
      categories: Array.from(categoriesSet),
    };
  }, [trimmedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const presetChips = [
    { label: 'سماعات بلوتوث', icon: Headphones },
    { label: 'سماعات مراقبة', icon: Radio },
    { label: 'كاميرات مراقبة', icon: Camera },
    { label: 'ساعات ذكيه', icon: Watch },
    { label: 'كروت وشحن ألعاب', icon: Gamepad2 },
    { label: 'شواحن سريعه', icon: Zap },
  ];

  const handleAISearch = async (searchPrompt?: string) => {
    const textToSearch = searchPrompt || query;
    if (!textToSearch.trim()) return;

    const updatedRecent = saveRecentSearch(textToSearch);
    setRecentSearches(updatedRecent);

    setLoading(true);
    setAiResult(null);

    if (onSearchQuerySubmit) {
      onSearchQuerySubmit(textToSearch);
    }

    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSearch,
          products: products,
        }),
      });

      if (!res.ok) throw new Error('API request failed');

      const data = await res.json();

      let matchedProds: Product[] = [];
      if (Array.isArray(data.matchedProductIds) && data.matchedProductIds.length > 0) {
        matchedProds = products.filter((p: Product) => data.matchedProductIds.includes(p.id));
      }

      // If no exact matches from AI array, perform smart keyword search
      if (matchedProds.length === 0) {
        const terms = textToSearch.toLowerCase().split(' ');
        matchedProds = products.filter((p: Product) =>
          terms.some(
            (term) =>
              p.name.toLowerCase().includes(term) ||
              p.subtitle.toLowerCase().includes(term) ||
              p.description.toLowerCase().includes(term) ||
              p.category.toLowerCase().includes(term)
          )
        );
      }

      setAiResult({
        aiSummary:
          data.aiSummary ||
          `تم تحليل طلبك "${textToSearch}" وعرض المنتجات الأكثر ملاءمة.`,
        matchedProducts: matchedProds.length > 0 ? matchedProds : products.slice(0, 4),
        recommendedKeywords: data.recommendedKeywords || ['ضمان متجر إندكس', 'أصلي 100%'],
      });
    } catch (err) {
      console.error('AI Search Error:', err);
      // Smart Fallback
      const terms = textToSearch.toLowerCase().split(' ');
      const matchedProds = products.filter((p: Product) =>
        terms.some(
          (term) =>
            p.name.toLowerCase().includes(term) ||
            p.subtitle.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term)
        )
      );

      setAiResult({
        aiSummary: `نتائج البحث الذكي عن "${textToSearch}": إندكس يقدم أفضل الخيارات المتطابقة.`,
        matchedProducts: matchedProds.length > 0 ? matchedProds : products.slice(0, 3),
      });
    } finally {
      setLoading(false);
    }
  };

  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const yParallax = useTransform(scrollYProgress, [0, 1], [15, -15]);
  const y = shouldReduceMotion ? 0 : yParallax;

  return (
    <section ref={sectionRef} className="px-3 sm:px-6 my-5">
      <motion.div
        style={{ y }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="bg-[var(--color-surface-1)] backdrop-blur-xl rounded-3xl p-4 sm:p-6 border border-[var(--color-border-default)] shadow-[var(--shadow-md)] relative overflow-hidden"
      >
        {/* Subtle Ambient Background Highlight */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#2F6BFF]/08 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row with AI Robot Graphic */}
        <div className="flex items-center justify-between mb-4 relative z-10 dir-rtl">
          {/* Header Text */}
          <div className="text-right space-y-1 max-w-xs sm:max-w-md">
            <div className="inline-flex items-center gap-1.5 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] px-3 py-0.5 rounded-full text-xs font-bold text-[#2F6BFF]">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>مساعد إندكس الذكي</span>
            </div>
            
            <h3 className="text-lg sm:text-2xl font-black text-[var(--color-text-primary)] leading-tight">
              <span>البحث الذكي </span>
              <span className="text-[#2F6BFF]">
                بالذكاء الاصطناعي
              </span>
            </h3>

            <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)] font-medium leading-relaxed">
              اكتب مواصفات ما تبحث عنه وسنقوم بالعثور على أفضل المنتجات فوراً
            </p>
          </div>

          {/* AI Robot Graphic */}
          <div className="relative w-16 h-16 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-[#2F6BFF]/10 rounded-full blur-xl" />
            <div className="relative w-14 h-14 sm:w-20 sm:h-20 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-3xl flex flex-col items-center justify-center p-2 shadow-sm">
              {/* Antenna */}
              <div className="w-2 h-2 bg-[#2F6BFF] rounded-full mb-1" />
              {/* Robot Face / Eyes */}
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 bg-blue-400 rounded-full" />
                <div className="w-2.5 h-2.5 bg-blue-400 rounded-full" />
              </div>
              <span className="text-[10px] font-black text-white bg-[#2F6BFF] px-1.5 py-0.2 rounded-md tracking-wider">
                AI
              </span>
            </div>
          </div>
        </div>

        {/* Input Bar with Real-time Autocomplete Suggestions */}
        <div ref={searchContainerRef} className="relative z-30 mb-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowSuggestions(false);
              handleAISearch();
            }}
          >
            <div className="relative flex items-center bg-[var(--color-surface-2)] border border-[var(--color-border-default)] focus-within:border-[var(--color-primary)] rounded-full p-1 shadow-inner backdrop-blur-md">
              {/* Robot Head Icon on Right in RTL */}
              <div className="pr-3 text-[var(--color-text-secondary)] shrink-0">
                <Bot className="w-5 h-5 text-[#2F6BFF]" />
              </div>

              {/* Input Text */}
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (query.trim()) setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setShowSuggestions(false);
                }}
                placeholder="مثال : أريد ساعة ذكية مقاومة للماء مع بطارية قوية"
                className="w-full bg-transparent border-none text-[var(--color-text-primary)] text-xs sm:text-sm px-2 focus:outline-none placeholder-[var(--color-text-muted)] font-medium text-right"
              />

              {/* Left Search Button in RTL */}
              <button
                type="submit"
                disabled={loading}
                className="bg-[#2F6BFF] hover:bg-[#2458D8] text-white px-4 sm:px-5 py-2 rounded-full text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/20 shrink-0"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>بحث</span>
                    <Search className="w-3.5 h-3.5 text-white" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick-Access Recent Search Terms Chips (Last 5) */}
          {recentSearches.length > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap dir-rtl text-right">
              <span className="text-[11px] font-bold text-[var(--color-text-muted)] flex items-center gap-1 shrink-0">
                <History className="w-3.5 h-3.5 text-[#2F6BFF]" />
                <span>آخر 5 عمليات بحث:</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {recentSearches.map((term, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 bg-[var(--color-surface-2)] hover:bg-[#2F6BFF]/15 text-[var(--color-text-primary)] hover:text-[#2F6BFF] border border-[var(--color-border-default)] hover:border-[#2F6BFF]/40 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer group"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(term);
                        setShowSuggestions(false);
                        handleAISearch(term);
                      }}
                      className="flex items-center gap-1"
                    >
                      <span>{term}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveRecentSearch(e, term)}
                      className="text-[var(--color-text-muted)] hover:text-rose-400 p-0.5 rounded-full transition-colors"
                      title="حذف من السجل"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleClearRecentSearches}
                  className="text-[10px] font-bold text-rose-400 hover:underline px-1 py-0.5 cursor-pointer"
                >
                  مسح الكل
                </button>
              </div>
            </div>
          )}

          {/* Autocomplete Dropdown Popup */}
          <AnimatePresence>
            {showSuggestions && (trimmedQuery.length > 0 || recentSearches.length > 0) && (
              <motion.div
                key="search-autocomplete-dropdown"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 z-50 bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-2xl shadow-2xl p-3 backdrop-blur-2xl dir-rtl overflow-hidden text-right max-h-[360px] overflow-y-auto space-y-3"
              >
                {/* Categories Autocomplete Section */}
                {suggestions.categories.length > 0 && (
                  <div className="mb-3 pb-2.5 border-b border-[var(--color-border-subtle)]">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2F6BFF] mb-2">
                      <Tag className="w-3.5 h-3.5" />
                      <span>الأقسام المتطابقة</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.categories.map((cat, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setQuery(cat);
                            setShowSuggestions(false);
                            handleAISearch(cat);
                          }}
                          className="bg-[var(--color-surface-2)] hover:bg-[#2F6BFF] hover:text-white border border-[var(--color-border-default)] text-[var(--color-text-secondary)] text-xs font-semibold px-2.5 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>{cat}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products Autocomplete Section */}
                {suggestions.products.length > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[var(--color-text-muted)] px-1 mb-1">
                      <span>اقتراحات المنتجات ({suggestions.products.length})</span>
                      <span className="text-[10px] text-[#2F6BFF]">انقر للمعاينة والطلب</span>
                    </div>
                    {suggestions.products.map((prod: Product) => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          setShowSuggestions(false);
                          onSelectProduct(prod);
                        }}
                        className="group/item flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-[var(--color-surface-2)] transition-all cursor-pointer border border-transparent hover:border-[var(--color-border-subtle)]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-9 h-9 rounded-lg object-contain bg-[var(--color-surface-2)] p-0.5 shrink-0 border border-[var(--color-border-subtle)]"
                          />
                          <div className="min-w-0 text-right">
                            <h6 className="text-xs font-bold text-[var(--color-text-primary)] group-hover/item:text-[#2F6BFF] transition-colors truncate">
                              {prod.name}
                            </h6>
                            <span className="text-[10px] text-[var(--color-text-muted)] block truncate">
                              {prod.category}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 text-left dir-ltr">
                          <span className="text-xs font-black text-[#2F6BFF]">
                            {formatPrice(prod.priceYER, currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : suggestions.categories.length === 0 ? (
                  <div className="p-3 text-center text-xs text-[var(--color-text-muted)] font-medium">
                    لا توجد اقتراحات مباشرة لـ "{query}". اضغط بحث لاستخدام المساعد الذكي.
                  </div>
                ) : null}

                {/* Bottom Quick Search Prompt Option */}
                <button
                  type="button"
                  onClick={() => {
                    setShowSuggestions(false);
                    handleAISearch();
                  }}
                  className="w-full mt-2 pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs font-bold text-[#2F6BFF] hover:bg-[var(--color-surface-2)] p-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5" />
                    <span>بحث شامل بالمساعد الذكي عن "{query}"</span>
                  </div>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Preset Chips Grid */}
        <div className="grid grid-cols-3 gap-2 relative z-10 max-w-xl mx-auto dir-rtl">
          {presetChips.map((chip, idx) => {
            const ChipIcon = chip.icon;
            return (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => {
                  setQuery(chip.label);
                  handleAISearch(chip.label);
                }}
                className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border-default)] hover:border-[var(--color-primary)] py-2 px-2.5 rounded-2xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer flex items-center justify-center gap-1.5 backdrop-blur-md text-[11px] font-bold shadow-sm"
              >
                <ChipIcon className="w-3.5 h-3.5 text-[#2F6BFF] shrink-0" />
                <span className="truncate">{chip.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* AI Result Box */}
        {aiResult && (
          <div className="mt-5 pt-4 border-t border-[var(--color-border-subtle)] animate-fadeIn relative z-10">
            <div className="bg-[var(--color-surface-2)] border border-[var(--color-border-default)] p-3.5 rounded-2xl mb-3 text-right space-y-1.5 backdrop-blur-md">
              <div className="flex items-center gap-2 text-[#2F6BFF] text-xs font-bold">
                <Bot className="w-4 h-4 text-blue-400" />
                <span>نتائج البحث والتوصية من مساعد إندكس الذكي:</span>
              </div>
              <p className="text-xs text-[var(--color-text-primary)] leading-relaxed font-medium">
                {aiResult.aiSummary}
              </p>
            </div>

            {/* Matched Products with Motion */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {aiResult.matchedProducts.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.06 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSelectProduct(p)}
                  className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border-default)] hover:border-[#2F6BFF]/40 p-2.5 rounded-2xl flex items-center gap-2.5 cursor-pointer transition-all group backdrop-blur-md shadow-sm"
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-10 h-10 rounded-xl object-contain shrink-0 border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="overflow-hidden text-right">
                    <h5 className="text-xs font-bold text-[var(--color-text-primary)] truncate group-hover:text-[#2F6BFF] transition-colors">
                      {p.name}
                    </h5>
                    <p className="text-[11px] text-[var(--color-text-primary)] font-bold mt-0.5">
                      {formatPrice(p.priceYER, currency)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </section>
  );
};

