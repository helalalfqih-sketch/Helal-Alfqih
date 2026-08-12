import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Product,
  CartItem,
  Currency,
  ActiveTab,
  OrderStatus,
  NotificationItem,
  SortOption,
} from './types';
import { CATEGORIES, MOCK_ORDERS, MOCK_NOTIFICATIONS } from './data/mockData';
import { subscribeToProducts, fetchProductsFromSupabase, createSupabaseOrder, supabase } from './lib/supabase';
import { checkAdminSession } from './lib/adminAuth';

import { Header } from './components/Header';
import { ShippingBanner } from './components/ShippingBanner';
import { AISearchSection } from './components/AISearchSection';
import { HeroCarousel } from './components/HeroCarousel';
import { CategoryBar, PriceRangePreset, STORE_BRANDS, RATING_OPTIONS } from './components/CategoryBar';
import { BestOffersSection } from './components/BestOffersSection';
import { ProductCard } from './components/ProductCard';
import { TrustBar } from './components/TrustBar';
import { LoyaltyBanner } from './components/LoyaltyBanner';
import { StoreFooter } from './components/StoreFooter';
import { BottomNav } from './components/BottomNav';
import { AmbientBackground } from './components/AmbientBackground';
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import {
  ProductCardSkeleton,
  HeroCarouselSkeleton,
  ProductGridSkeleton,
} from './components/SkeletonLoader';

import { ProductDetailModal } from './components/ProductDetailModal';
import { AddToCartAnimationOverlay, FlyingCartItem } from './components/AddToCartAnimation';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { NotificationsModal } from './components/NotificationsModal';
import { AccountDrawer } from './components/AccountDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { ProductCompareModal } from './components/ProductCompareModal';
import { ToastNotification } from './components/ToastNotification';
import { CinematicProductDeconstruction } from './components/CinematicProductDeconstruction';
import { DiscoveryStrip } from './components/DiscoveryStrip';
import { RecentlyViewedStrip } from './components/RecentlyViewedStrip';
import { ProductStoryModal } from './components/ProductStoryModal';
import { ProductUniverseModal } from './components/ProductUniverseModal';
import { CustomerSupportHub, SupportContext } from './components/CustomerSupportHub';
import { IndexesEvolutionStudio } from './components/evolution-studio/IndexesEvolutionStudio';
import { saveLocalCart } from './lib/persistentCart';
import { X, SlidersHorizontal } from 'lucide-react';

export default function App() {
  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('indexes_store_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('indexes_store_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [productsError, setProductsError] = useState<string | null>(null);
  const handleOpenAdmin = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/admin";
    }
  };
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isEvolutionStudioOpen, setIsEvolutionStudioOpen] = useState<boolean>(false);
  const [isBoostActive, setIsBoostActive] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('YER');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [priceRange, setPriceRange] = useState<PriceRangePreset>('all');
  const [customMinPrice, setCustomMinPrice] = useState<number | undefined>(undefined);
  const [customMaxPrice, setCustomMaxPrice] = useState<number | undefined>(undefined);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(false);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);

  // Monitor Supabase auth session to detect Admin user
  useEffect(() => {
    let isMounted = true;
    const verifyAdmin = async () => {
      const res = await checkAdminSession();
      if (isMounted) {
        setIsAdminUser(Boolean(res.user));
      }
    };

    verifyAdmin();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
        verifyAdmin();
      });
      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }
  }, []);

  // Supabase Catalog Initialization (24 items, no Realtime, no automatic orders fetch on home open)
  useEffect(() => {
    setIsLoading(true);

    // Timeout safety stop
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    // Fetch initial 24 products from Supabase
    const unsubscribeProducts = subscribeToProducts(({ products: dbProducts, hasMore: dbHasMore, error }) => {
      clearTimeout(timer);
      if (error) {
        setProducts([]);
        setProductsError(error);
        setHasMore(false);
      } else {
        setProducts(dbProducts || []);
        setHasMore(dbHasMore);
        setProductsError(null);
      }
      setIsLoading(false);
      setIsFirestoreConnected(true);
    });

    return () => {
      clearTimeout(timer);
      unsubscribeProducts();
    };
  }, []);

  // Handle Load More products pagination
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const { products: updatedProducts, hasMore: newHasMore, error } = await fetchProductsFromSupabase({ page: nextPage, pageSize: 24 });
    if (!error) {
      setProducts(updatedProducts);
      setHasMore(newHasMore);
      setPage(nextPage);
    }
    setIsLoadingMore(false);
  };

  // Category or search query change loading feedback
  const handleSelectCategoryWithLoading = (catId: string) => {
    setIsLoading(true);
    setSelectedCategory(catId);
    setTimeout(() => setIsLoading(false), 300);
  };

  // Cart items initialization
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('indexes_persistent_cart_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.warn('Cart read error:', err);
    }
    return [];
  });

  // Favorite / Wishlist Products LocalStorage Persistence
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('indexes_store_favorites');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.error('Error loading favorites from localStorage:', err);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('indexes_store_favorites', JSON.stringify(favorites));
    } catch (err) {
      console.error('Error saving favorites to localStorage:', err);
    }
  }, [favorites]);
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [userOrders, setUserOrders] = useState<OrderStatus[]>(MOCK_ORDERS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  // Toast Notification State
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error' | 'info'; message: string }[]>([]);
  const [activeFlyingItems, setActiveFlyingItems] = useState<FlyingCartItem[]>([]);
  const [lastAddedProduct, setLastAddedProduct] = useState<{
    product: Product;
    quantity: number;
    selectedColor?: string;
    timestamp: number;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = 'toast-' + Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Modal / Drawer States
  const [selectedProductModal, setSelectedProductModal] = useState<Product | null>(null);
  const [storyProduct, setStoryProduct] = useState<Product | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [trackerOrderNumber, setTrackerOrderNumber] = useState<string | undefined>(undefined);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [isWishlistDrawerOpen, setIsWishlistDrawerOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isDeconstructionOpen, setIsDeconstructionOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isUniverseOpen, setIsUniverseOpen] = useState(false);

  const activeSupportContext: SupportContext = useMemo(() => {
    if (isCheckoutModalOpen) return 'checkout';
    if (isCartDrawerOpen) return 'cart';
    if (selectedProductModal) {
      if (!selectedProductModal.inStock || selectedProductModal.stockCount === 0) return 'unavailable';
      return 'product';
    }
    if (isAccountDrawerOpen || isTrackerModalOpen) return 'account';
    return 'home';
  }, [isCheckoutModalOpen, isCartDrawerOpen, selectedProductModal, isAccountDrawerOpen, isTrackerModalOpen]);

  const [appliedCouponDiscount, setAppliedCouponDiscount] = useState(0);
  const [discoveryFilter, setDiscoveryFilter] = useState<string | null>(null);

  // Recently Viewed LocalStorage State
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('indexes_store_recently_viewed');
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      return [];
    }
  });

  const handleSelectProductWithHistory = (prod: Product) => {
    setSelectedProductModal(prod);
    setRecentlyViewedIds((prev) => {
      const next = [prod.id, ...prev.filter((id) => id !== prod.id)].slice(0, 8);
      try {
        localStorage.setItem('indexes_store_recently_viewed', JSON.stringify(next));
      } catch (err) {}
      return next;
    });
  };

  const handleClearRecentlyViewed = () => {
    setRecentlyViewedIds([]);
    try {
      localStorage.removeItem('indexes_store_recently_viewed');
    } catch (err) {}
  };

  // Auto-sync cart to localStorage
  useEffect(() => {
    saveLocalCart(cartItems);
  }, [cartItems]);

  // Global Keyboard Shortcuts (Esc to close open modals, 'C' / 'c' to open Cart Drawer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering single-key shortcuts when typing in form controls
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputActive =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (e.key === 'Escape') {
        setSelectedProductModal(null);
        setIsCartDrawerOpen(false);
        setIsCheckoutModalOpen(false);
        setIsTrackerModalOpen(false);
        setIsNotificationsModalOpen(false);
        setIsAccountDrawerOpen(false);
        setIsWishlistDrawerOpen(false);
        setIsCompareModalOpen(false);
        setIsDeconstructionOpen(false);
      } else if ((e.key === 'c' || e.key === 'C') && !isInputActive && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setIsCartDrawerOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Computed Properties
  const totalCartCount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems]
  );

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const bestOffers = useMemo(
    () => products.filter((p) => p.isBestOffer),
    [products]
  );

  const recentlyViewedProducts = useMemo(
    () =>
      recentlyViewedIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p)),
    [recentlyViewedIds, products]
  );

  const handleSelectDiscoveryOption = (type: string) => {
    setDiscoveryFilter(type);
    if (type === 'best-selling') {
      setSortBy('best-selling');
    } else if (type === 'newest') {
      setSortBy('newest');
    } else if (type === 'gift') {
      setSelectedCategory('smartwatches');
    } else if (type === 'home') {
      setSelectedCategory('home_appliances');
    } else if (type === 'budget') {
      setSortBy('price-low');
    } else if (type === 'surprise') {
      const randomProd = products[Math.floor(Math.random() * products.length)];
      if (randomProd) handleSelectProductWithHistory(randomProd);
    }
  };

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      const matchCategory =
        selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchPrice = true;
      if (priceRange === 'under-20k') {
        matchPrice = p.priceYER <= 20000;
      } else if (priceRange === '20k-50k') {
        matchPrice = p.priceYER >= 20000 && p.priceYER <= 50000;
      } else if (priceRange === 'over-50k') {
        matchPrice = p.priceYER >= 50000;
      } else if (priceRange === 'custom') {
        if (customMinPrice !== undefined && !isNaN(customMinPrice)) {
          matchPrice = matchPrice && p.priceYER >= customMinPrice;
        }
        if (customMaxPrice !== undefined && !isNaN(customMaxPrice)) {
          matchPrice = matchPrice && p.priceYER <= customMaxPrice;
        }
      }

      // Multi-select Brand Filtering
      let matchBrand = true;
      if (selectedBrands.length > 0) {
        const text = `${p.name} ${p.subtitle} ${p.description} ${JSON.stringify(p.specs || {})}`.toLowerCase();
        matchBrand = selectedBrands.some((brandId) => {
          const bObj = STORE_BRANDS.find((b) => b.id === brandId);
          if (!bObj) return false;
          return bObj.keywords.some((kw) => text.includes(kw.toLowerCase()));
        });
      }

      // Multi-select Rating Filtering
      let matchRating = true;
      if (selectedRatings.length > 0) {
        matchRating = selectedRatings.some((ratingId) => {
          const rObj = RATING_OPTIONS.find((r) => r.id === ratingId);
          if (!rObj) return false;
          return p.rating >= rObj.minRating;
        });
      }

      return matchCategory && matchSearch && matchPrice && matchBrand && matchRating;
    });

    switch (sortBy) {
      case 'price-high':
        return [...list].sort((a, b) => b.priceYER - a.priceYER);
      case 'price-low':
        return [...list].sort((a, b) => a.priceYER - b.priceYER);
      case 'best-selling':
        return [...list].sort((a, b) => b.reviewsCount - a.reviewsCount);
      case 'newest':
        return [...list].sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
      case 'default':
      default:
        return list;
    }
  }, [products, selectedCategory, searchQuery, sortBy, priceRange, customMinPrice, customMaxPrice, selectedBrands, selectedRatings]);

  // Handlers
  const handleToggleFavorite = (product: Product) => {
    setFavorites((prev) =>
      prev.includes(product.id)
        ? prev.filter((id) => id !== product.id)
        : [...prev, product.id]
    );
  };

  const handleAddToCart = (
    product: Product,
    quantity: number = 1,
    selectedColor?: string,
    startCoords?: { startX: number; startY: number }
  ) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        if (selectedColor) updated[existingIdx].selectedColor = selectedColor;
        return updated;
      }
      return [...prev, { product, quantity, selectedColor }];
    });

    // Spawn Flying Particle Item
    const flyingId = `fly_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const startX = startCoords?.startX ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 200);
    const startY = startCoords?.startY ?? (typeof window !== 'undefined' ? window.innerHeight / 2 : 300);

    setActiveFlyingItems((prev) => [
      ...prev,
      {
        id: flyingId,
        product,
        startX,
        startY,
        selectedColor,
      },
    ]);

    setLastAddedProduct({
      product,
      quantity,
      selectedColor,
      timestamp: Date.now(),
    });
  };

  const handleAnimationComplete = (id: string) => {
    setActiveFlyingItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleOrderPlaced = async (newOrder: OrderStatus) => {
    setUserOrders((prev) => [newOrder, ...prev]);
    setCartItems([]); // Clear cart after order

    try {
      await createSupabaseOrder(newOrder);
    } catch (err) {
      console.error('Failed to save order to Supabase:', err);
    }

    // Add notification
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `تم ثبت طلبك برقم #${newOrder.orderNumber}`,
        message: 'تم حفظ طلبك في قاعدة بيانات Supabase وسيتم التواصل معك لتأكيد التسليم.',
        time: 'الآن',
        read: false,
        type: 'order',
      },
      ...prev,
    ]);
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Sync BottomNav tab triggers
  const handleBottomNavTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === 'cart') {
      setIsCartDrawerOpen(true);
    } else if (tab === 'account') {
      setIsAccountDrawerOpen(true);
    } else if (tab === 'search') {
      window.scrollTo({ top: 400, behavior: 'smooth' });
    } else if (tab === 'offers') {
      // Clear filters if needed so best offers section is visible
      setSearchQuery('');
      setSelectedCategory('all');
      setTimeout(() => {
        const offersElem = document.getElementById('best-offers-section');
        if (offersElem) {
          offersElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 500, behavior: 'smooth' });
        }
      }, 50);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg,#08090B)] text-[var(--color-text-primary,#F5F7FA)] flex flex-col font-sans pb-28 selection:bg-[#2F6BFF] selection:text-white relative overflow-x-hidden transition-colors duration-200">
      {/* High-Tech Ambient Background in Empty Spaces */}
      <AmbientBackground />

      {/* Global Toast Notifications */}
      <ToastNotification toasts={toasts} onDismiss={handleDismissToast} />

      {/* Foreground Store Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* 1. Sticky Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={totalCartCount}
        unreadNotificationsCount={unreadNotificationsCount}
        wishlistCount={favorites.length}
        compareCount={compareList.length}
        products={products}
        currency={currency}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenCart={() => setIsCartDrawerOpen(true)}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        onOpenWishlist={() => setIsWishlistDrawerOpen(true)}
        onOpenCompare={() => setIsCompareModalOpen(true)}
        onOpenMenu={() => setIsAccountDrawerOpen(true)}
        onOpenTracker={() => setIsTrackerModalOpen(true)}
        onOpenAdmin={handleOpenAdmin}
        onSelectProduct={(p) => setSelectedProductModal(p)}
        isAdminUser={isAdminUser}
      />

      {/* 2. Top Shipping Announcement Banner */}
      <ShippingBanner
        onOpenShippingInfo={() => setIsTrackerModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-grow w-full max-w-7xl mx-auto pb-28 sm:pb-32">
        {/* 3. Hero Carousel Banner ("عروض حصرية 50%") */}
        {isLoading ? (
          <HeroCarouselSkeleton />
        ) : (
          <HeroCarousel
            products={products}
            onSelectCategory={handleSelectCategoryWithLoading}
            onSelectProduct={(prod) => handleSelectProductWithHistory(prod)}
            onOpenDeconstruction={() => setIsDeconstructionOpen(true)}
            onOpenUniverse={() => setIsUniverseOpen(true)}
          />
        )}

        {/* Discovery Intent Strip: ماذا تبحث عنه اليوم؟ */}
        <DiscoveryStrip
          onSelectDiscoveryOption={handleSelectDiscoveryOption}
          activeFilter={discoveryFilter}
          onResetFilter={() => {
            setDiscoveryFilter(null);
            setSortBy('default');
            setSelectedCategory('all');
            setPriceRange('all');
            setCustomMinPrice(undefined);
            setCustomMaxPrice(undefined);
            setSelectedBrands([]);
            setSelectedRatings([]);
          }}
        />

        {/* Recently Viewed Strip: تابع من حيث توقفت */}
        {recentlyViewedProducts.length > 0 && (
          <RecentlyViewedStrip
            products={recentlyViewedProducts}
            currency={currency}
            onSelectProduct={(prod) => handleSelectProductWithHistory(prod)}
            onClearHistory={handleClearRecentlyViewed}
          />
        )}

        {/* 4. 6-Category Grid & Filter/Sort Bar */}
        <CategoryBar
          selectedCategoryId={selectedCategory}
          onSelectCategory={handleSelectCategoryWithLoading}
          selectedSort={sortBy}
          onSelectSort={(sortOption) => setSortBy(sortOption)}
          selectedPriceRange={priceRange}
          onSelectPriceRange={(range, minVal, maxVal) => {
            setPriceRange(range);
            setCustomMinPrice(minVal);
            setCustomMaxPrice(maxVal);
          }}
          customMinPrice={customMinPrice}
          customMaxPrice={customMaxPrice}
          selectedBrands={selectedBrands}
          onSelectBrands={setSelectedBrands}
          selectedRatings={selectedRatings}
          onSelectRatings={setSelectedRatings}
        />

        {/* 5. Best Offers Section (أفضل العروض 🔥) */}
        {selectedCategory === 'all' && !searchQuery && (
          <BestOffersSection
            bestOffers={bestOffers}
            currency={currency}
            favorites={favorites}
            isLoading={isLoading}
            onToggleFavorite={handleToggleFavorite}
            onAddToCart={(prod, col) => handleAddToCart(prod, 1, col)}
            onSelectProduct={(prod) => setSelectedProductModal(prod)}
            onViewAll={() => handleSelectCategoryWithLoading('all')}
          />
        )}

        {/* 6. AI-Powered Smart Search Section */}
        <AISearchSection
          products={products}
          currency={currency}
          onSelectProduct={(prod) => setSelectedProductModal(prod)}
          onSearchQuerySubmit={(q) => {
            setIsLoading(true);
            setSearchQuery(q);
            setTimeout(() => setIsLoading(false), 300);
          }}
        />

        {/* 7. Product Catalog Grid Section */}
        <section className="px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-[var(--color-border-default)] pb-4 dir-rtl">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
                {selectedCategory === 'all'
                  ? searchQuery
                    ? `نتائج البحث عن "${searchQuery}"`
                    : 'جميع المنتجات المتوفرة'
                  : `منتجات ${
                      CATEGORIES.find((c) => c.id === selectedCategory)?.name ||
                      'القسم'
                    }`}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
                عرض {filteredProducts.length} منتجات أصلية مع ضمان متجر إندكس
              </p>
            </div>

            {/* Active 'Sort Applied' Indicator Pill Badge in Catalog Header */}
            {sortBy !== 'default' && (
              <div className="flex items-center gap-2 self-start sm:self-center">
                <div className="inline-flex items-center gap-1.5 bg-[#2F6BFF]/15 text-[#2F6BFF] border border-[#2F6BFF]/40 px-3 py-1.5 rounded-full text-xs font-black shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#2F6BFF] animate-pulse" />
                  <span>الترتيب المطبق: {
                    sortBy === 'price-high' ? 'الأعلى سعراً' :
                    sortBy === 'price-low' ? 'الأقل سعراً' :
                    sortBy === 'best-selling' ? 'الأكثر مبيعاً' :
                    sortBy === 'newest' ? 'الأحدث وصولاً' : 'مخصص'
                  }</span>
                  <button
                    type="button"
                    onClick={() => setSortBy('default')}
                    className="p-1 rounded-full hover:bg-rose-500/20 hover:text-rose-500 text-[#2F6BFF] transition-colors cursor-pointer"
                    title="إلغاء الترتيب والإعادة للافتراضي"
                    aria-label="إلغاء الترتيب"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : productsError ? (
            <div className="py-12 px-6 text-center bg-rose-500/10 border border-rose-500/30 rounded-3xl my-6 dir-rtl">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-2xl">cloud_off</span>
              </div>
              <h4 className="text-lg font-bold text-rose-400 mb-1">تعذر تحميل المنتجات من Supabase</h4>
              <p className="text-xs text-[var(--color-text-secondary)] mb-4 dir-ltr font-mono max-w-xl mx-auto break-words">{productsError}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center text-[var(--color-text-secondary)] bg-[var(--color-surface-1)] rounded-3xl border border-[var(--color-border-default)]">
              <span className="material-symbols-outlined text-[64px] text-[var(--color-text-muted)] mb-2">
                search_off
              </span>
              <p className="text-lg font-bold text-[var(--color-text-primary)]">لم نتمكن من العثور على منتجات مطابقة</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">جرّب تغيير كلمة البحث أو قسم المنتجات.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  handleSelectCategoryWithLoading('all');
                }}
                className="mt-4 bg-[#2F6BFF] hover:bg-[#2458D8] text-white px-6 py-2.5 rounded-2xl text-sm font-bold shadow-md cursor-pointer"
              >
                إعادة ضبط البحث
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {filteredProducts.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    index={idx}
                    product={product}
                    currency={currency}
                    isFavorite={favorites.includes(product.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onAddToCart={(prod, col) => handleAddToCart(prod, 1, col)}
                    onSelectProduct={(prod) => handleSelectProductWithHistory(prod)}
                    variant="grid"
                  />
                ))}
              </div>

              {/* Load More Pagination Button */}
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="bg-[#2F6BFF] hover:bg-[#2458D8] active:scale-98 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-2xl text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer dir-rtl"
                  >
                    {isLoadingMore ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>جاري التحميل...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">expand_more</span>
                        <span>عرض المزيد من المنتجات (24 منتجاً)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* 9. Trust Features Bar */}
        <TrustBar />

        {/* 10. Loyalty Banner */}
        <LoyaltyBanner
          onOpenLoyaltyModal={() => setIsAccountDrawerOpen(true)}
        />

        {/* 11. Footer */}
        <StoreFooter
          onOpenTracker={() => setIsTrackerModalOpen(true)}
          onOpenAdmin={handleOpenAdmin}
        />
      </main>

      {/* 12. Floating Support Trigger Button */}
      <FloatingWhatsAppButton
        isOpen={isSupportOpen}
        onToggle={() => setIsSupportOpen(!isSupportOpen)}
      />

      {/* 13. Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleBottomNavTabChange}
        cartCount={totalCartCount}
        onOpenSupport={() => setIsSupportOpen(true)}
      />

      {/* --- Modals & Slide-overs --- */}
      <ProductUniverseModal
        isOpen={isUniverseOpen}
        onClose={() => setIsUniverseOpen(false)}
        products={products}
        currency={currency}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        onAddToCart={(prod, qty) => handleAddToCart(prod, qty)}
        onSelectProductDetails={(prod) => setSelectedProductModal(prod)}
        onOpenStory={(prod) => setStoryProduct(prod)}
        onOpenCart={() => setIsCartDrawerOpen(true)}
      />

      <CustomerSupportHub
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        activeContext={activeSupportContext}
        currentProduct={selectedProductModal}
        cartItems={cartItems}
        currency={currency}
        lastOrderRef={userOrders.length > 0 ? userOrders[0].id : null}
        onOpenTracker={() => setIsTrackerModalOpen(true)}
        onOpenSearch={() => setActiveTab('search')}
      />

      {/* Product Details Modal */}
      <ProductDetailModal
        product={selectedProductModal}
        currency={currency}
        isFavorite={selectedProductModal ? favorites.includes(selectedProductModal.id) : false}
        onClose={() => setSelectedProductModal(null)}
        onOpenStory={(prod) => setStoryProduct(prod)}
        onAddToCart={(prod, qty, col) => {
          handleAddToCart(prod, qty, col);
          showToast(`تمت إضافة ${prod.name} إلى السلة بنجاح 🛒`);
        }}
        onToggleFavorite={(p) => {
          handleToggleFavorite(p);
          const isFavNow = !favorites.includes(p.id);
          showToast(isFavNow ? `تمت إضافة ${p.name} إلى المفضلة ❤️` : `تمت إزالة ${p.name} من المفضلة`);
        }}
        onAddToCompare={(prod) => {
          if (!compareList.some((c) => c.id === prod.id)) {
            setCompareList((prev) => [...prev, prod]);
            showToast(`تمت إضافة ${prod.name} إلى المقارنة ⚖️`);
          } else {
            showToast('هذا المنتج مضاف بالفعل في قائمة المقارنة', 'info');
          }
          setIsCompareModalOpen(true);
        }}
        onOpenDeconstruction={() => setIsDeconstructionOpen(true)}
      />

      {/* Cinematic 3D Product Deconstruction Modal */}
      <AnimatePresence>
        {isDeconstructionOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-xl"
            onClick={() => setIsDeconstructionOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-6xl max-h-[96vh]"
            >
              <CinematicProductDeconstruction
                onClose={() => setIsDeconstructionOpen(false)}
                productName={selectedProductModal?.name || 'ساعة ذكية AMOLED Ultra 8'}
                productImage={selectedProductModal?.image}
                category={selectedProductModal?.category}
                product={selectedProductModal || undefined}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Slide-over Drawer */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        cartItems={cartItems}
        currency={currency}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={(discount) => {
          setAppliedCouponDiscount(discount);
          setIsCartDrawerOpen(false);
          setIsCheckoutModalOpen(true);
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        cartItems={cartItems}
        currency={currency}
        couponDiscountPercent={appliedCouponDiscount}
        onOrderPlaced={handleOrderPlaced}
        onOpenOrderTracker={(orderNum) => {
          setTrackerOrderNumber(orderNum);
          setIsTrackerModalOpen(true);
        }}
      />

      {/* Order Tracker Modal */}
      <OrderTrackerModal
        isOpen={isTrackerModalOpen}
        onClose={() => {
          setIsTrackerModalOpen(false);
          setTrackerOrderNumber(undefined);
        }}
        allOrders={userOrders}
        currency={currency}
        initialOrderNumber={trackerOrderNumber}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
      />

      {/* Account / Drawer Panel */}
      <AccountDrawer
        isOpen={isAccountDrawerOpen}
        onClose={() => setIsAccountDrawerOpen(false)}
        currency={currency}
        onSelectCurrency={setCurrency}
        favoritesCount={favorites.length}
        onOpenWishlist={() => setIsWishlistDrawerOpen(true)}
        onOpenTrackerForOrder={(orderNum) => {
          setTrackerOrderNumber(orderNum);
          setIsTrackerModalOpen(true);
        }}
        onOpenAdmin={handleOpenAdmin}
        onOpenEvolutionStudio={() => setIsEvolutionStudioOpen(true)}
        isAdminUser={isAdminUser}
      />

      {/* Indexes Evolution Studio AI Visual Editor Modal */}
      {isEvolutionStudioOpen && (
        <IndexesEvolutionStudio
          products={products}
          onClose={() => setIsEvolutionStudioOpen(false)}
          onApplyDraftToStore={(draft) => {
            // Apply draft tokens dynamically to store
            if (draft.designTokens.colorPrimary) {
              document.documentElement.style.setProperty('--color-primary', draft.designTokens.colorPrimary);
            }
          }}
        />
      )}

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistDrawerOpen}
        favorites={favorites}
        products={products}
        currency={currency}
        onClose={() => setIsWishlistDrawerOpen(false)}
        onToggleFavorite={handleToggleFavorite}
        onAddToCart={(p, qty) => {
          handleAddToCart(p, qty);
          showToast(`تمت إضافة ${p.name} إلى السلة بنجاح 🛒`);
        }}
        onSelectProduct={(p) => {
          setIsWishlistDrawerOpen(false);
          setSelectedProductModal(p);
        }}
      />

      {/* Product Compare Modal */}
      <ProductCompareModal
        isOpen={isCompareModalOpen}
        compareList={compareList}
        products={products}
        currency={currency}
        onClose={() => setIsCompareModalOpen(false)}
        onReorderCompareList={(newOrder) => setCompareList(newOrder)}
        onAddToCompare={(p) => {
          setCompareList((prev) => prev.some((item) => item.id === p.id) ? prev : [...prev, p]);
          showToast(`تمت إضافة ${p.name} إلى المقارنة ⚖️`);
        }}
        onRemoveFromCompare={(id) => {
          setCompareList((prev) => prev.filter((item) => item.id !== id));
          showToast('تمت إزالة المنتج من المقارنة');
        }}
        onAddToCart={(p, qty) => {
          handleAddToCart(p, qty);
          showToast(`تمت إضافة ${p.name} إلى السلة بنجاح 🛒`);
        }}
      />

      {/* Product Story Preview Modal */}
      <ProductStoryModal
        product={storyProduct}
        currency={currency}
        isOpen={Boolean(storyProduct)}
        onClose={() => setStoryProduct(null)}
        onAddToCart={(p) => {
          handleAddToCart(p, 1);
          showToast(`تمت إضافة ${p.name} إلى السلة بنجاح 🛒`);
        }}
      />

      {/* Real-time Performance & Memory Monitor */}
      <PerformanceMonitor
        isBoostActive={isBoostActive}
        onBoostPerformance={() => {
          setIsBoostActive((prev) => !prev);
          showToast(!isBoostActive ? 'تم تفعيل تسريع 60 FPS Lock ⚡' : 'تم العودة للأداء الافتراضي');
        }}
      />

      {/* Fly-To-Cart Particle & Interactive Popup Toast Animation */}
      <AddToCartAnimationOverlay
        activeFlyingItems={activeFlyingItems}
        onAnimationComplete={handleAnimationComplete}
        onOpenCart={() => setIsCartDrawerOpen(true)}
        lastAddedProduct={lastAddedProduct}
      />
      </div>
    </div>
  );
}
