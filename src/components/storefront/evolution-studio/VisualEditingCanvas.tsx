import React from 'react';
import { 
  Eye, 
  Lock, 
  MoveUp, 
  MoveDown, 
  Edit3, 
  Check, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';
import { DraftConfig } from '@/types/evolutionStudio';
import { HeroCarousel } from '@/components/storefront/HeroCarousel';
import { CategoryBar } from '@/components/storefront/CategoryBar';
import { BestOffersSection } from '@/components/storefront/BestOffersSection';
import { DiscoveryStrip } from '@/components/storefront/DiscoveryStrip';
import { TrustBar } from '@/components/storefront/TrustBar';
import { StoreFooter } from '@/components/storefront/StoreFooter';
import { Header } from '@/components/storefront/Header';
import { Product } from '@/components/storefront/types';

interface VisualEditingCanvasProps {
  draftConfig: DraftConfig;
  selectedSection: string;
  onSelectSection: (sectionKey: string) => void;
  onUpdateCopy: (key: string, value: string) => void;
  products: Product[];
  zoomScale: number;
  slowNetwork: boolean;
}

export const VisualEditingCanvas: React.FC<VisualEditingCanvasProps> = ({
  draftConfig,
  selectedSection,
  onSelectSection,
  onUpdateCopy,
  products,
  zoomScale,
  slowNetwork,
}) => {
  const { designTokens, featureVisibility, customCopy } = draftConfig;

  // Custom inline style mapping for dynamic design tokens
  const containerStyle: React.CSSProperties = {
    backgroundColor: designTokens.colorBackground,
    color: designTokens.colorTextPrimary,
    transform: `scale(${zoomScale})`,
    transformOrigin: 'top center',
    transition: 'all 0.3s ease',
  };

  return (
    <div
      className="w-full h-full overflow-y-auto no-scrollbar relative p-4 transition-all dir-rtl"
      style={containerStyle}
    >
      
      {/* Slow network simulation banner */}
      {slowNetwork && (
        <div className="bg-amber-500/20 text-amber-300 border border-amber-500/40 p-2 rounded-xl text-center text-xs font-bold mb-3 animate-pulse">
          ⚡ يتم الآن محاكاة سرعة الاتصال البطيئة (3G Network Simulation)
        </div>
      )}

      {/* Canvas Header Section */}
      <div
        onClick={() => onSelectSection('header')}
        className={`relative rounded-2xl p-2 transition-all cursor-pointer mb-4 ${
          selectedSection === 'header'
            ? 'ring-2 ring-purple-500 bg-purple-950/20 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
            : 'hover:ring-1 hover:ring-white/20'
        }`}
      >
        <Header
          searchQuery=""
          onSearchChange={() => {}}
          cartCount={2}
          unreadNotificationsCount={0}
          onOpenCart={() => {}}
          onOpenNotifications={() => {}}
          onOpenMenu={() => {}}
          onOpenTracker={() => {}}
        />
        {selectedSection === 'header' && (
          <div className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-20 flex items-center gap-1 shadow-md">
            <span>الهيدر العلوي (محدد)</span>
          </div>
        )}
      </div>

      {/* Hero Carousel Section */}
      {featureVisibility.showHeroCarousel && (
        <div
          onClick={() => onSelectSection('hero')}
          className={`relative rounded-3xl p-1 transition-all cursor-pointer mb-6 ${
            selectedSection === 'hero'
              ? 'ring-2 ring-purple-500 bg-purple-950/20 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
              : 'hover:ring-1 hover:ring-white/20'
          }`}
        >
          <HeroCarousel
            products={products}
            onSelectCategory={() => {}}
            onSelectProduct={() => {}}
          />
          {selectedSection === 'hero' && (
            <div className="absolute top-4 left-4 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-20 shadow-md">
              <span>البانر الرئيسي (محدد)</span>
            </div>
          )}
        </div>
      )}

      {/* Product Universe 3D Entry Preview Section */}
      {featureVisibility.showUniversePreview && (
        <div
          onClick={() => onSelectSection('universe')}
          className={`relative rounded-3xl p-6 mb-6 border transition-all cursor-pointer ${
            selectedSection === 'universe'
              ? 'ring-2 ring-cyan-400 border-cyan-500/80 bg-cyan-950/20 shadow-[0_0_25px_rgba(6,182,212,0.3)]'
              : 'border-white/10 bg-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center text-2xl shadow-xl animate-bounce">
              🌎
            </div>
            <h3 className="font-bold text-lg text-white">
              {customCopy.universeIntro || 'عالم منتجات إندكس الكوني 3D'}
            </h3>
            <p className="text-xs text-gray-300 max-w-md">
              استكشف الساعات الذكية والإلكترونيات عبر مدار كوكبي هولوغرافي ثلاثي الأبعاد
            </p>
            <span className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold px-5 py-2 rounded-2xl text-xs shadow-lg">
              فتح تجربة الكوكب 3D
            </span>
          </div>

          {selectedSection === 'universe' && (
            <div className="absolute top-3 left-3 bg-cyan-500 text-black font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-md">
              <span>عالم المنتجات 3D (محدد)</span>
            </div>
          )}
        </div>
      )}

      {/* Category Navigation Bar */}
      <div
        onClick={() => onSelectSection('categories')}
        className={`relative rounded-2xl p-2 transition-all cursor-pointer mb-6 ${
          selectedSection === 'categories'
            ? 'ring-2 ring-purple-500 bg-purple-950/20 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
            : 'hover:ring-1 hover:ring-white/20'
        }`}
      >
        <CategoryBar
          selectedCategoryId="all"
          onSelectCategory={() => {}}
          selectedSort="default"
          onSelectSort={() => {}}
        />
        {selectedSection === 'categories' && (
          <div className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-20 shadow-md">
            <span>شريط التصنيفات (محدد)</span>
          </div>
        )}
      </div>

      {/* Best Offers Section */}
      {featureVisibility.showBestOffers && (
        <div
          onClick={() => onSelectSection('offers')}
          className={`relative rounded-3xl p-1 transition-all cursor-pointer mb-6 ${
            selectedSection === 'offers'
              ? 'ring-2 ring-purple-500 bg-purple-950/20 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
              : 'hover:ring-1 hover:ring-white/20'
          }`}
        >
          <BestOffersSection
            bestOffers={products.slice(0, 4)}
            currency="YER"
            favorites={[]}
            isLoading={false}
            onToggleFavorite={() => {}}
            onAddToCart={() => {}}
            onSelectProduct={() => {}}
            onViewAll={() => {}}
          />
          {selectedSection === 'offers' && (
            <div className="absolute top-4 left-4 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-20 shadow-md">
              <span>أقوى العروض المباشرة (محدد)</span>
            </div>
          )}
        </div>
      )}

      {/* Discovery Strip & Trust Bar */}
      {featureVisibility.showTrustBar && (
        <div
          onClick={() => onSelectSection('trust')}
          className={`relative rounded-2xl p-2 transition-all cursor-pointer mb-6 ${
            selectedSection === 'trust'
              ? 'ring-2 ring-purple-500 bg-purple-950/20 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
              : 'hover:ring-1 hover:ring-white/20'
          }`}
        >
          <TrustBar />
          {selectedSection === 'trust' && (
            <div className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-20 shadow-md">
              <span>شريط الضمان والثقة (محدد)</span>
            </div>
          )}
        </div>
      )}

      {/* Store Footer */}
      <div
        onClick={() => onSelectSection('footer')}
        className={`relative rounded-3xl transition-all cursor-pointer ${
          selectedSection === 'footer'
            ? 'ring-2 ring-purple-500 bg-purple-950/20 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
            : 'hover:ring-1 hover:ring-white/20'
        }`}
      >
        <StoreFooter onOpenTracker={() => {}} />
        {selectedSection === 'footer' && (
          <div className="absolute top-4 left-4 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-20 shadow-md">
            <span>الفوتر السفلي (محدد)</span>
          </div>
        )}
      </div>

    </div>
  );
};
