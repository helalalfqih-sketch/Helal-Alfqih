import React, {
  useState, useEffect, useMemo, useRef,
  Suspense, Component, ErrorInfo, ReactNode,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Sparkles, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles as SparklesIcon, ShoppingCart, Heart,
  Compass, Shuffle, Check, Play, Grid, HelpCircle,
  ShieldCheck, Scale, Zap, DollarSign, Gift, CheckCircle2,
} from 'lucide-react';
import { Product, Currency } from './types';
import { formatPrice } from './currency';
import { useLiteMode } from './liteMode';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.src = FALLBACK_IMAGE;
};

/* ───── Error Boundary ───── */
interface WEBProps { children: ReactNode; fallback: ReactNode; }
interface WEBState { hasError: boolean; }
class WebGLErrorBoundary extends Component<WEBProps, WEBState> {
  constructor(props: WEBProps) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(): WEBState { return { hasError: true }; }
  componentDidCatch(e: Error, info: ErrorInfo) { console.warn('ProductUniverse WebGL fallback:', e, info); }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

/* ───── Types ───── */
interface ProductUniverseModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currency: Currency;
  favorites: string[];
  onToggleFavorite: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onSelectProduct?: (product: Product) => void;
}

type IntentType = 'all' | 'utility' | 'gift' | 'problem' | 'fun' | 'budget';
interface IntentOption { id: IntentType; title: string; desc: string; icon: React.ReactNode; }

const INTENT_OPTIONS: IntentOption[] = [
  { id: 'utility', title: 'أريد شيئاً مفيداً يومياً', desc: 'منتجات تمنحك سهولة وكفاءة في روتينك', icon: <Zap className="w-4 h-4 text-amber-400" /> },
  { id: 'gift', title: 'أبحث عن هدية مميزة', desc: 'خيارات راقية تناسب الإهداء والمناسبات', icon: <Gift className="w-4 h-4 text-pink-400" /> },
  { id: 'problem', title: 'أريد حل مشكلة مزعجة', desc: 'أدوات وحلول ذكية للتحديات اليومية', icon: <HelpCircle className="w-4 h-4 text-cyan-400" /> },
  { id: 'fun', title: 'أبحث عن شيء ممتع', desc: 'إلكترونيات واكسسوارات ترفيهية مبتكرة', icon: <SparklesIcon className="w-4 h-4 text-purple-400" /> },
  { id: 'budget', title: 'لدي ميزانية محددة', desc: 'أفضل القيمة مقابل السعر وضمن ميزانيتك', icon: <DollarSign className="w-4 h-4 text-emerald-400" /> },
];

/* ───── Smart OrbitControls ───── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const UniverseOrbitControls: React.FC<any> = (props) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);
  const { gl } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = 'pan-y';
    let sx = 0, sy = 0, vert = false;
    const ts = (e: TouchEvent) => { if (e.touches.length === 1) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; vert = false; if (ref.current) ref.current.enabled = true; } };
    const tm = (e: TouchEvent) => { if (e.touches.length === 1 && !vert) { const dx = Math.abs(e.touches[0].clientX - sx); const dy = Math.abs(e.touches[0].clientY - sy); if (dy > dx && dy > 5) { vert = true; if (ref.current) ref.current.enabled = false; } } };
    const te = () => { vert = false; if (ref.current) ref.current.enabled = true; };
    el.addEventListener('touchstart', ts, { passive: true });
    el.addEventListener('touchmove', tm, { passive: true });
    el.addEventListener('touchend', te, { passive: true });
    el.addEventListener('touchcancel', te, { passive: true });
    return () => { el.removeEventListener('touchstart', ts); el.removeEventListener('touchmove', tm); el.removeEventListener('touchend', te); el.removeEventListener('touchcancel', te); };
  }, [gl]);
  return <OrbitControls ref={ref} {...props} />;
};

/* ───── 3D Planet ───── */
const UniversePlanet: React.FC<{ paused: boolean; activeIntent: IntentType }> = ({ paused, activeIntent }) => {
  const ptRef = useRef<THREE.Points>(null);
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const ringColor = useMemo(() => {
    if (activeIntent === 'utility') return '#f59e0b';
    if (activeIntent === 'gift') return '#ec4899';
    if (activeIntent === 'problem') return '#00f0ff';
    if (activeIntent === 'fun') return '#a855f7';
    if (activeIntent === 'budget') return '#10b981';
    return '#8b5cf6';
  }, [activeIntent]);
  const { positions, colors } = useMemo(() => {
    const count = 3200, phi = (1 + Math.sqrt(5)) / 2, radius = 2.4;
    const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
    const cyan = new THREE.Color('#00f0ff'), mag = new THREE.Color('#ff007f'), viol = new THREE.Color('#8b5cf6'), tc = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2, ry = Math.sqrt(1 - y * y), theta = (2 * Math.PI * i) / phi;
      const r = radius + (Math.random() - 0.5) * 0.15;
      pos[i * 3] = r * ry * Math.cos(theta); pos[i * 3 + 1] = r * y; pos[i * 3 + 2] = r * ry * Math.sin(theta);
      const t = (y + 1) / 2;
      if (t > 0.5) tc.copy(cyan).lerp(mag, (t - 0.5) * 2); else tc.copy(mag).lerp(viol, t * 2);
      col[i * 3] = tc.r; col[i * 3 + 1] = tc.g; col[i * 3 + 2] = tc.b;
    }
    return { positions: pos, colors: col };
  }, []);
  useFrame((_, delta) => {
    if (paused) return;
    if (ptRef.current) ptRef.current.rotation.y += delta * 0.18;
    if (r1.current) r1.current.rotation.z += delta * 0.22;
    if (r2.current) r2.current.rotation.z -= delta * 0.15;
  });
  return (
    <group>
      <points ref={ptRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.06} vertexColors transparent opacity={0.88} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      <mesh ref={r1} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[3.2, 0.008, 16, 100]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={r2} rotation={[-Math.PI / 4, Math.PI / 6, 0]}>
        <torusGeometry args={[3.05, 0.006, 16, 100]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.45} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};

/* ───── Orbit Product Node ───── */
interface NodeProps {
  product: Product; index: number; total: number;
  isFocused: boolean; isFavorite: boolean; isCompared: boolean;
  onSelect: (p: Product) => void; onToggleFavorite: (p: Product) => void;
}
const OrbitProductNode: React.FC<NodeProps> = ({ product, index, total, isFocused, isFavorite, isCompared, onSelect, onToggleFavorite }) => {
  const [hovered, setHovered] = useState(false);
  const pos = useMemo<[number, number, number]>(() => {
    const r = isFocused ? 0 : 3.4, angle = (index / Math.max(total, 1)) * Math.PI * 2, elev = Math.sin(index * 1.5) * 1.2;
    return [r * Math.cos(angle), elev, r * Math.sin(angle)];
  }, [index, total, isFocused]);
  return (
    <group position={pos}>
      <Html center distanceFactor={8} zIndexRange={[100, 0]} style={{ pointerEvents: 'auto' }}>
        <div onClick={e => { e.stopPropagation(); onSelect(product); }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
          className={`relative cursor-pointer select-none transition-all duration-300 group flex flex-col items-center ${isFocused ? 'scale-125 z-50' : 'hover:scale-110'}`}>
          <div className={`w-14 h-14 sm:w-16 sm:h-16 p-1.5 rounded-2xl backdrop-blur-xl border flex items-center justify-center relative overflow-hidden transition-all duration-300 ${isFocused ? 'bg-[#2F6BFF]/40 border-[#2F6BFF] shadow-[0_0_30px_rgba(47,107,255,0.9)]' : hovered ? 'bg-[#0d091f]/90 border-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.5)]' : 'bg-[#090617]/80 border-white/15'}`}>
            <img src={product.image || FALLBACK_IMAGE} alt={product.name} onError={handleImageError} className="w-full h-full object-contain pointer-events-none" />
            <button onClick={e => { e.stopPropagation(); onToggleFavorite(product); }} className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 cursor-pointer">
              <Heart className={`w-3 h-3 ${isFavorite ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`} />
            </button>
            {isCompared && <span className="absolute top-1 left-1 bg-cyan-500 text-black p-0.5 rounded-full"><Scale className="w-2.5 h-2.5" /></span>}
            {product.originalPriceYER && product.originalPriceYER > product.priceYER && <span className="absolute bottom-0.5 left-0.5 text-[8px] font-black bg-rose-600 text-white px-1 rounded">خصم</span>}
          </div>
          <div className="mt-1 px-1.5 py-0.5 rounded-full bg-[#070512]/90 border border-white/10 text-[9px] font-bold text-white max-w-[90px] truncate text-center">{product.name}</div>
        </div>
      </Html>
    </group>
  );
};

/* ───── 2D Grid Fallback ───── */
const Grid2D: React.FC<{ prods: Product[]; currency: Currency; onSelect: (p: Product) => void; onAdd: (p: Product) => void }> = ({ prods, currency, onSelect, onAdd }) => (
  <div className="w-full h-full overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-[#03010b]">
    {prods.map(prod => (
      <div key={prod.id} onClick={() => onSelect(prod)} className="bg-[#0e0a24] border border-white/10 rounded-2xl p-3 flex flex-col justify-between hover:border-emerald-500/50 transition-all cursor-pointer">
        <img src={prod.image || FALLBACK_IMAGE} alt={prod.name} onError={handleImageError} className="w-full h-20 object-contain mb-2" />
        <div><h4 className="text-xs font-bold text-white line-clamp-1">{prod.name}</h4><p className="text-xs font-black text-emerald-400 mt-0.5">{formatPrice(prod.priceYER, currency)}</p></div>
        <button onClick={e => { e.stopPropagation(); onAdd(prod); }} className="mt-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 rounded-xl text-[10px] flex items-center justify-center gap-1 cursor-pointer">
          <ShoppingCart className="w-3 h-3" /><span>أضف للسلة</span>
        </button>
      </div>
    ))}
  </div>
);

/* ───── Main Modal ───── */
export const ProductUniverseModal: React.FC<ProductUniverseModalProps> = ({
  isOpen, onClose, products = [], currency = 'YER',
  favorites = [], onToggleFavorite, onAddToCart, onSelectProduct,
}) => {
  const { isActive: isLiteMode } = useLiteMode();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeIntent, setActiveIntent] = useState<IntentType>('all');
  const [showIntentPortal, setShowIntentPortal] = useState(true);
  const [focusedProduct, setFocusedProduct] = useState<Product | null>(null);
  const [is2D, setIs2D] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [tabModal, setTabModal] = useState<'demo' | 'why' | 'confidence' | null>(null);
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [tourActive, setTourActive] = useState(false);

  const filtered = useMemo(() => {
    let r = products;
    if (activeIntent === 'utility') r = r.filter(p => p.category === 'electronics' || p.inStock);
    else if (activeIntent === 'gift') r = r.filter(p => p.category === 'watches' || (p.originalPriceYER && p.originalPriceYER > p.priceYER));
    else if (activeIntent === 'problem') r = r.filter(p => p.category === 'electronics' || p.category === 'cards');
    else if (activeIntent === 'fun') r = r.filter(p => p.category === 'electronics' || p.category === 'watches');
    else if (activeIntent === 'budget') r = [...r].sort((a, b) => a.priceYER - b.priceYER);
    if (activeCategory === 'offers') r = r.filter(p => p.originalPriceYER && p.originalPriceYER > p.priceYER);
    else if (activeCategory === 'favorites') r = r.filter(p => favorites.includes(p.id));
    else if (activeCategory !== 'all') r = r.filter(p => p.category === activeCategory);
    return r.length > 0 ? r : products;
  }, [products, activeCategory, activeIntent, favorites]);

  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; setShowIntentPortal(true); }
    else { document.body.style.overflow = ''; setFocusedProduct(null); setTourActive(false); setTabModal(null); }
  }, [isOpen]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const selectProd = (p: Product) => { setFocusedProduct(p); setQuantity(1); setTabModal(null); };
  const addCart = () => { if (!focusedProduct) return; onAddToCart(focusedProduct, quantity); showToast(`تمت إضافة ${focusedProduct.name} إلى السلة 🛒`); };
  const toggleCompare = (p: Product) => {
    setCompareList(prev => {
      if (prev.some(x => x.id === p.id)) return prev.filter(x => x.id !== p.id);
      if (prev.length >= 3) { showToast('يمكنك مقارنة 3 منتجات كحد أقصى'); return prev; }
      return [...prev, p];
    });
  };
  const surpriseMe = () => { if (!filtered.length) return; selectProd(filtered[Math.floor(Math.random() * filtered.length)]); };
  const startTour = () => { if (!filtered.length) return; setTourActive(true); selectProd(filtered[0]); };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] bg-[#03010b] text-white flex flex-col overflow-hidden dir-rtl select-none">

        {/* Intent Portal */}
        <AnimatePresence>
          {showIntentPortal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
              <div className="bg-[#0e0a26] border border-purple-500/30 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-[0_0_50px_rgba(139,92,246,0.3)] text-center">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto mb-3"><SparklesIcon className="w-6 h-6 text-purple-300 animate-pulse" /></div>
                <h3 className="text-base sm:text-lg font-black text-white mb-1">دعنا نفتح لك العالم المناسب ✨</h3>
                <p className="text-xs text-gray-300 mb-4">ما الذي سيجعل يومك أفضل اليوم؟</p>
                <div className="space-y-2 text-right">
                  {INTENT_OPTIONS.map(opt => (
                    <button key={opt.id} onClick={() => { setActiveIntent(opt.id); setShowIntentPortal(false); }}
                      className="w-full bg-[#161138] hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/50 p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer group">
                      <div className="p-2 rounded-xl bg-black/40 border border-white/10 group-hover:scale-105 transition-transform">{opt.icon}</div>
                      <div className="flex-1"><div className="text-xs font-bold text-white group-hover:text-purple-300">{opt.title}</div><div className="text-[10px] text-gray-400">{opt.desc}</div></div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-gray-400">سنرتب المنتجات حسب هدفك</span>
                  <button onClick={() => setShowIntentPortal(false)} className="text-purple-400 hover:text-purple-300 font-bold cursor-pointer">تخطي والاستكشاف بحرية</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="relative z-30 px-4 py-2.5 bg-gradient-to-b from-[#060315]/90 to-transparent flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#2F6BFF]/20 border border-[#2F6BFF]/40 flex items-center justify-center"><Compass className="w-4 h-4 text-[#2F6BFF] animate-spin" /></div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">عالم منتجات إندكس
                {activeIntent !== 'all' && <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">مسار مخصص</span>}
              </h2>
              <p className="text-[10px] text-gray-400">استكشاف سينمائي تفاعلي للمنتجات</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {compareList.length > 0 && (<button onClick={() => setShowCompare(true)} className="bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer"><Scale className="w-3.5 h-3.5" /><span>مقارنة ({compareList.length})</span></button>)}
            <button onClick={() => setShowIntentPortal(true)} className="bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer"><Zap className="w-3 h-3" /><span className="hidden sm:inline">تغيير الهدف</span></button>
            <button onClick={() => setIs2D(!is2D)} className="bg-white/10 border border-white/20 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer"><Grid className="w-3.5 h-3.5 text-cyan-400" /><span>{is2D ? 'عرض 3D' : 'مبسّط'}</span></button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center justify-center border border-gray-700 cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Stage */}
        <div className="relative flex-1 w-full overflow-hidden">
          {/* Toast */}
          <AnimatePresence>
            {toast && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-[190] bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-full shadow-2xl flex items-center gap-2">
                <Check className="w-4 h-4" /><span>{toast}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {is2D || isLiteMode ? (
            <Grid2D prods={filtered} currency={currency} onSelect={selectProd} onAdd={p => { onAddToCart(p, 1); showToast(`تمت إضافة ${p.name} للسلة`); }} />
          ) : (
            <div className="w-full h-full bg-[#03010b]">
              <WebGLErrorBoundary fallback={<Grid2D prods={filtered} currency={currency} onSelect={selectProd} onAdd={p => { onAddToCart(p, 1); showToast(`تمت إضافة ${p.name} للسلة`); }} />}>
                <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: false, alpha: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false }} style={{ width: '100%', height: '100%' }}>
                  <Suspense fallback={null}>
                    <ambientLight intensity={0.8} />
                    <pointLight position={[10, 10, 10]} intensity={2} color="#00f0ff" />
                    <pointLight position={[-10, -10, -10]} intensity={2} color="#ff007f" />
                    <Stars radius={60} depth={40} count={800} factor={3} fade speed={1} />
                    <Sparkles count={50} scale={10} size={2} color="#00f0ff" />
                    <UniversePlanet paused={Boolean(focusedProduct)} activeIntent={activeIntent} />
                    {filtered.slice(0, 16).map((prod, idx) => (
                      <OrbitProductNode key={prod.id} product={prod} index={idx} total={Math.min(filtered.length, 16)}
                        isFocused={focusedProduct?.id === prod.id} isFavorite={favorites.includes(prod.id)}
                        isCompared={compareList.some(p => p.id === prod.id)}
                        onSelect={selectProd} onToggleFavorite={onToggleFavorite} />
                    ))}
                    <UniverseOrbitControls autoRotate={!focusedProduct} autoRotateSpeed={0.4} enableZoom enablePan={false} maxDistance={12} minDistance={4} />
                  </Suspense>
                </Canvas>
              </WebGLErrorBoundary>
            </div>
          )}

          {/* Focused Product Card */}
          <AnimatePresence>
            {focusedProduct && (
              <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                className="absolute bottom-14 sm:bottom-16 left-3 right-3 sm:left-auto sm:right-6 sm:w-[360px] z-[160] bg-[#0c0822]/95 border border-purple-500/40 rounded-3xl p-3.5 shadow-[0_-10px_40px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
                <div className="flex items-start justify-between gap-3 border-b border-gray-800 pb-2.5 mb-2.5">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <img src={focusedProduct.image} alt={focusedProduct.name} className="w-12 h-12 object-contain bg-black/40 rounded-xl p-1 border border-white/10 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-bold text-white truncate">{focusedProduct.name}</h3>
                      <p className="text-[10px] text-purple-300 line-clamp-1 mt-0.5">
                        {focusedProduct.category === 'watches' ? 'ساعة أنيقة للاستخدام اليومي' : focusedProduct.category === 'electronics' ? 'حل تقني مبتكر' : 'بطاقات وخدمات رقمية'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black text-emerald-400">{formatPrice(focusedProduct.priceYER, currency)}</span>
                        {focusedProduct.originalPriceYER && focusedProduct.originalPriceYER > focusedProduct.priceYER && (
                          <span className="text-[10px] text-gray-500 line-through">{formatPrice(focusedProduct.originalPriceYER, currency)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setFocusedProduct(null)} className="p-1 rounded-full hover:bg-gray-800 text-gray-400 cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-black/40 border border-gray-700 rounded-xl p-1 shrink-0">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-2 text-xs font-bold text-gray-300 hover:text-white cursor-pointer">-</button>
                      <span className="px-1.5 text-xs font-bold text-white">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="px-2 text-xs font-bold text-gray-300 hover:text-white cursor-pointer">+</button>
                    </div>
                    <button onClick={addCart} className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer">
                      <ShoppingCart className="w-3.5 h-3.5" /><span>أضف إلى السلة</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-[10px] pt-1">
                    <button onClick={() => setTabModal('demo')} className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 border border-purple-500/30 cursor-pointer"><Play className="w-3 h-3" /><span>أرني فائدته</span></button>
                    <button onClick={() => setTabModal('why')} className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 border border-amber-500/30 cursor-pointer"><HelpCircle className="w-3 h-3" /><span>لماذا ظهر؟</span></button>
                    <button onClick={() => setTabModal('confidence')} className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 border border-cyan-500/30 cursor-pointer"><ShieldCheck className="w-3 h-3" /><span>قبل الشراء</span></button>
                    <button onClick={() => toggleCompare(focusedProduct)} className={`py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 border cursor-pointer ${compareList.some(p => p.id === focusedProduct.id) ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-gray-800/80 hover:bg-gray-700 text-gray-200 border-gray-700'}`}><Scale className="w-3 h-3" /><span>{compareList.some(p => p.id === focusedProduct.id) ? 'مقارَن' : 'قارن'}</span></button>
                  </div>
                  {onSelectProduct && (
                    <button onClick={() => { onSelectProduct(focusedProduct); onClose(); }} className="w-full text-[10px] text-purple-400 hover:text-purple-300 py-1 cursor-pointer text-center">عرض التفاصيل الكاملة →</button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab Modals */}
          <AnimatePresence>
            {tabModal && focusedProduct && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
                className="fixed inset-0 z-[180] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
                <div className="bg-[#0e0a26] border border-purple-500/40 rounded-3xl p-5 max-w-sm w-full relative text-right">
                  <button onClick={() => setTabModal(null)} className="absolute top-4 left-4 p-1 rounded-full bg-gray-800 text-gray-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
                  {tabModal === 'demo' && (
                    <div>
                      <div className="flex items-center gap-2 mb-3 text-purple-300 font-bold text-xs"><Play className="w-4 h-4 text-purple-400" /><span>عرض الفائدة والتجربة</span></div>
                      <img src={focusedProduct.image} alt="" className="w-full h-36 object-contain bg-black/40 rounded-2xl p-2 mb-3 border border-white/10" />
                      <div className="space-y-2 text-xs text-gray-300">
                        <div className="flex items-center gap-2 bg-purple-950/40 p-2 rounded-xl border border-purple-500/20"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /><span>مصمم بجودة متينة لتلبية الاستخدام اليومي المكثف</span></div>
                        <div className="flex items-center gap-2 bg-purple-950/40 p-2 rounded-xl border border-purple-500/20"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /><span>سهل الاستخدام ويوفر القيمة العالية مقابل السعر</span></div>
                      </div>
                    </div>
                  )}
                  {tabModal === 'why' && (
                    <div>
                      <div className="flex items-center gap-2 mb-3 text-amber-300 font-bold text-xs"><HelpCircle className="w-4 h-4 text-amber-400" /><span>شفافية التوصية — لماذا ظهر لك؟</span></div>
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /><span>يتوافق مع هدفك ({activeIntent === 'all' ? 'استكشاف حر' : activeIntent})</span></div>
                        <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /><span>ضمن الفئات الأعلى تقييماً وطلباً في المتجر</span></div>
                        <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /><span>متوفر للتسليم الفوري مع الضمان</span></div>
                      </div>
                    </div>
                  )}
                  {tabModal === 'confidence' && (
                    <div>
                      <div className="flex items-center gap-2 mb-3 text-cyan-300 font-bold text-xs"><ShieldCheck className="w-4 h-4 text-cyan-400" /><span>قبل أن تشتري — معلومات الثقة</span></div>
                      <div className="space-y-2 text-xs text-gray-300">
                        <div className="p-2.5 bg-black/40 rounded-xl border border-white/10"><span className="font-bold text-white block mb-0.5">📦 محتويات العبوة:</span><span>المنتج الأصلي + كرت الضمان المعتمد + دليل الاستخدام</span></div>
                        <div className="p-2.5 bg-black/40 rounded-xl border border-white/10"><span className="font-bold text-white block mb-0.5">🛡️ الضمان والاستبدال:</span><span>ضمان الفحص التجريبي مع إمكانية الاستبدال مجاناً</span></div>
                        <div className="p-2.5 bg-black/40 rounded-xl border border-white/10"><span className="font-bold text-white block mb-0.5">🚚 التوصيل:</span><span>توصيل سريع ودفع آمن عند الاستلام</span></div>
                      </div>
                    </div>
                  )}
                  <button onClick={() => setTabModal(null)} className="mt-4 w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl text-xs cursor-pointer">حسناً، فهمت</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compare Modal */}
          <AnimatePresence>
            {showCompare && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-[#0e0a26] border border-cyan-500/40 rounded-3xl p-5 max-w-2xl w-full text-right relative">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
                    <div className="flex items-center gap-2"><Scale className="w-5 h-5 text-cyan-400" /><h3 className="text-sm font-black text-white">مقارنة المنتجات ({compareList.length})</h3></div>
                    <button onClick={() => setShowCompare(false)} className="p-1 rounded-full bg-gray-800 text-gray-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
                  </div>
                  {compareList.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">لم تضف أي منتج للمقارنة بعد.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {compareList.map(prod => (
                        <div key={prod.id} className="bg-black/40 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
                          <div><img src={prod.image} alt="" className="w-full h-24 object-contain mb-2" /><h4 className="text-xs font-bold text-white line-clamp-1">{prod.name}</h4><p className="text-xs font-black text-emerald-400 mt-1">{formatPrice(prod.priceYER, currency)}</p>
                            <div className="mt-2 pt-2 border-t border-gray-800 text-[10px] space-y-1 text-gray-300"><div>التوفر: {prod.inStock ? 'متوفر' : 'غير متوفر'}</div><div>الضمان: متوفر مع صيانة</div></div>
                          </div>
                          <div className="mt-3 space-y-1.5">
                            <button onClick={() => { onAddToCart(prod, 1); showToast(`تمت إضافة ${prod.name} للسلة`); }} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded-xl text-[10px] flex items-center justify-center gap-1 cursor-pointer"><ShoppingCart className="w-3 h-3" /><span>أضف للسلة</span></button>
                            <button onClick={() => toggleCompare(prod)} className="w-full text-rose-400 hover:text-rose-300 text-[10px] py-1 cursor-pointer">إزالة من المقارنة</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Dock */}
        <div className="relative z-30 px-3 py-2 bg-[#080518]/95 border-t border-white/10 backdrop-blur-xl flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-1.5 shrink-0">
            {[{ id: 'all', label: 'الكل' }, { id: 'offers', label: '🔥 العروض' }, { id: 'favorites', label: '⭐ المفضلة' }].map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${activeCategory === cat.id ? 'bg-[#2F6BFF] text-white' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'}`}>
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={surpriseMe} className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer"><Shuffle className="w-3.5 h-3.5" /><span>فاجئني 🎲</span></button>
            <button onClick={tourActive ? () => setTourActive(false) : startTour} className="bg-purple-500/20 border border-purple-500/40 text-purple-300 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer"><SparklesIcon className="w-3.5 h-3.5" /><span>{tourActive ? 'إيقاف الجولة' : 'جولة ✨'}</span></button>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
