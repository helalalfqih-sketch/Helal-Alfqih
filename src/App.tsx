import React, { useState, useMemo, useEffect } from 'react';
import {
  Product,
  CartItem,
  Currency,
  ActiveTab,
  OrderStatus,
  NotificationItem,
  SortOption,
} from './types';
import { PRODUCTS, MOCK_ORDERS, MOCK_NOTIFICATIONS } from './data/mockData';
import { subscribeToProducts, subscribeToOrders, createFirestoreOrder } from './lib/firebase';

import { Header } from './components/Header';
import { ShippingBanner } from './components/ShippingBanner';
import { AISearchSection } from './components/AISearchSection';
import { HeroCarousel } from './components/HeroCarousel';
import { CategoryBar } from './components/CategoryBar';
import { ProductCard } from './components/ProductCard';
import { TrustBar } from './components/TrustBar';
import { LoyaltyBanner } from './components/LoyaltyBanner';
import { StoreFooter } from './components/StoreFooter';
import { BottomNav } from './components/BottomNav';
import { AmbientBackground } from './components/AmbientBackground';
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton';
import {
  ProductCardSkeleton,
  HeroCarouselSkeleton,
  ProductGridSkeleton,
} from './components/SkeletonLoader';

import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { NotificationsModal } from './components/NotificationsModal';
import { AccountDrawer } from './components/AccountDrawer';
import { AdminPanel } from './components/AdminPanel';
import { WishlistDrawer } from './components/WishlistDrawer';
import { ProductCompareModal } from './components/ProductCompareModal';
import { ToastNotification } from './components/ToastNotification';

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
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('YER');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(false);

  // Firestore Realtime Subscriptions
  useEffect(() => {
    setIsLoading(true);
    // Subscribe to products in Firestore
    const unsubscribeProducts = subscribeToProducts((dbProducts) => {
      setProducts(dbProducts);
      setIsLoading(false);
      setIsFirestoreConnected(true);
    });

    // Subscribe to orders in Firestore
    const unsubscribeOrders = subscribeToOrders((dbOrders) => {
      setUserOrders(dbOrders);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, []);

  // Category or search query change loading feedback
  const handleSelectCategoryWithLoading = (catId: string) => {
    setIsLoading(true);
    setSelectedCategory(catId);
    setTimeout(() => setIsLoading(false), 300);
  };

  // Initial cart items matching the template count badge (3 items)
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { product: PRODUCTS[0], quantity: 1, selectedColor: '#7B3FFF' },
    { product: PRODUCTS[1], quantity: 1, selectedColor: '#FFFFFF' },
    { product: PRODUCTS[2], quantity: 1 },
  ]);

  const [favorites, setFavorites] = useState<string[]>(['prod-1', 'prod-3']);
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [userOrders, setUserOrders] = useState<OrderStatus[]>(MOCK_ORDERS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  // Toast Notification State
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error' | 'info'; message: string }[]>([]);

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
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [isWishlistDrawerOpen, setIsWishlistDrawerOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const [appliedCouponDiscount, setAppliedCouponDiscount] = useState(0);

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

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      const matchCategory =
        selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
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
  }, [products, selectedCategory, searchQuery, sortBy]);

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
    selectedColor?: string
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
      await createFirestoreOrder(newOrder);
    } catch (err) {
      console.error('Failed to save order to Firestore:', err);
    }

    // Add notification
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `تم ثبت طلبك برقم #${newOrder.orderNumber}`,
        message: 'تم حفظ طلبك في قاعدة بيانات الفايربيس وسيتم التواصل معك لتأكيد التسليم.',
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
        onOpenAdmin={() => setIsAdminOpen(true)}
        onSelectProduct={(p) => setSelectedProductModal(p)}
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
            onSelectCategory={handleSelectCategoryWithLoading}
            onSelectProduct={(prod) => setSelectedProductModal(prod)}
          />
        )}

        {/* 4. 6-Category Grid & Filter/Sort Bar */}
        <CategoryBar
          selectedCategoryId={selectedCategory}
          onSelectCategory={handleSelectCategoryWithLoading}
          selectedSort={sortBy}
          onSelectSort={(sortOption) => setSortBy(sortOption)}
        />

        {/* 5. Best Offers Section (أفضل العروض 🔥) */}
        {selectedCategory === 'all' && !searchQuery && (
          <section className="py-2 relative">
            <div className="px-4 sm:px-6 flex justify-between items-center mb-3">
              <h3 className="text-xl sm:text-2xl font-black flex items-center gap-2 text-white">
                <span>أفضل العروض</span>
                <span className="text-xl sm:text-2xl">🔥</span>
              </h3>
              <button
                onClick={() => handleSelectCategoryWithLoading('all')}
                className="text-[#8B5CF6] text-xs sm:text-sm flex items-center gap-1 font-bold hover:underline cursor-pointer"
              >
                <span>عرض الكل</span>
                <span className="material-symbols-outlined text-[16px]">
                  chevron_left
                </span>
              </button>
            </div>

            {/* Horizontal Snap Scroll / Responsive 4-Card Grid Container */}
            <div className="relative group/scroll">
              <div
                id="best-offers-scroll"
                className="px-3 sm:px-6 flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x pb-2 pt-1"
              >
                {isLoading
                  ? [1, 2, 3, 4].map((idx) => (
                      <ProductCardSkeleton key={idx} variant="horizontal" />
                    ))
                  : bestOffers.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        currency={currency}
                        isFavorite={favorites.includes(product.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onAddToCart={(prod) => handleAddToCart(prod, 1)}
                        onSelectProduct={(prod) => setSelectedProductModal(prod)}
                        variant="horizontal"
                      />
                    ))}
              </div>

              {/* Scroll Right Arrow Button (Matching image_1.png arrow button) */}
              <button
                onClick={() => {
                  const el = document.getElementById('best-offers-scroll');
                  if (el) el.scrollBy({ left: -220, behavior: 'smooth' });
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-[#161129]/95 border border-[#7b3fff]/60 text-white flex items-center justify-center shadow-[0_0_15px_rgba(123,63,255,0.4)] hover:bg-[#7b3fff] hover:border-[#a855f7] transition-all cursor-pointer"
                aria-label="التمرير لليمين"
              >
                <span className="material-symbols-outlined text-[20px]">
                  chevron_right
                </span>
              </button>

              {/* Pagination Dots Indicator matching screenshot */}
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <span className="w-5 h-1.5 bg-[#a855f7] rounded-full shadow-[0_0_8px_#a855f7]" />
                <span className="w-1.5 h-1.5 bg-gray-700/80 rounded-full" />
                <span className="w-1.5 h-1.5 bg-gray-700/80 rounded-full" />
                <span className="w-1.5 h-1.5 bg-gray-700/80 rounded-full" />
                <span className="w-1.5 h-1.5 bg-gray-700/80 rounded-full" />
                <span className="w-1.5 h-1.5 bg-gray-700/80 rounded-full" />
              </div>
            </div>
          </section>
        )}

        {/* 6. AI-Powered Smart Search Section */}
        <AISearchSection
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
          <div className="flex justify-between items-center mb-6 border-b border-gray-800/80 pb-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                {selectedCategory === 'all'
                  ? searchQuery
                    ? `نتائج البحث عن "${searchQuery}"`
                    : 'جميع المنتجات المتوفرة'
                  : `منتجات ${
                      PRODUCTS.find((p) => p.category === selectedCategory)?.category ||
                      'القسم'
                    }`}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                عرض {filteredProducts.length} منتجات أصلية مع ضمان متجر إندكس
              </p>
            </div>
          </div>

          {isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center text-gray-400 bg-[#0F0C1B] rounded-3xl border border-gray-800">
              <span className="material-symbols-outlined text-[64px] text-gray-600 mb-2">
                search_off
              </span>
              <p className="text-lg font-bold text-white">لم نتمكن من العثور على منتجات مطابقة</p>
              <p className="text-sm text-gray-500 mt-1">جرّب تغيير كلمة البحث أو قسم المنتجات.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  handleSelectCategoryWithLoading('all');
                }}
                className="mt-4 bg-[#7B3FFF] text-white px-6 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-[#7B3FFF]/30 cursor-pointer"
              >
                إعادة ضبط البحث
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={currency}
                  isFavorite={favorites.includes(product.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onAddToCart={(prod) => handleAddToCart(prod, 1)}
                  onSelectProduct={(prod) => setSelectedProductModal(prod)}
                  variant="grid"
                />
              ))}
            </div>
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
        />
      </main>

      {/* 12. Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleBottomNavTabChange}
        cartCount={totalCartCount}
      />

      {/* --- Modals & Slide-overs --- */}

      {/* Product Details Modal */}
      <ProductDetailModal
        product={selectedProductModal}
        currency={currency}
        isFavorite={selectedProductModal ? favorites.includes(selectedProductModal.id) : false}
        onClose={() => setSelectedProductModal(null)}
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
      />

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
      />

      {/* Order Tracker Modal */}
      <OrderTrackerModal
        isOpen={isTrackerModalOpen}
        onClose={() => setIsTrackerModalOpen(false)}
        allOrders={userOrders}
        currency={currency}
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
        userOrders={userOrders}
        favoritesCount={favorites.length}
        onOpenWishlist={() => setIsWishlistDrawerOpen(true)}
        onOpenTracker={() => setIsTrackerModalOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Admin Panel Modal */}
      {isAdminOpen && (
        <AdminPanel
          products={products}
          orders={userOrders}
          currency={currency}
          onClose={() => setIsAdminOpen(false)}
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
        onRemoveFromCompare={(id) => {
          setCompareList((prev) => prev.filter((item) => item.id !== id));
          showToast('تمت إزالة المنتج من المقارنة');
        }}
        onAddToCart={(p, qty) => {
          handleAddToCart(p, qty);
          showToast(`تمت إضافة ${p.name} إلى السلة بنجاح 🛒`);
        }}
      />
      </div>
    </div>
  );
}
