import React, { useMemo, useRef, useState, useEffect, Suspense, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Sparkles, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from './types';
import { useLiteMode } from './liteMode';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.src = FALLBACK_IMAGE;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HolographicGlobeProduct = any;

interface HolographicGlobeProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelectProduct?: (product: any) => void;
  size?: number | string;
  className?: string;
  showTitleBadge?: boolean;
  paused?: boolean;
}

// Error Boundary for WebGL fallback on unsupported or context-lost mobile devices
interface WebGLErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface WebGLErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<WebGLErrorBoundaryProps, WebGLErrorBoundaryState> {
  constructor(props: WebGLErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): WebGLErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('WebGL Rendering fallback triggered:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// 3D Spherical Coordinates for Product Nodes
const PRODUCT_COORDS = [
  { lat: 20, lon: 10 },
  { lat: 45, lon: 85 },
  { lat: -25, lon: 155 },
  { lat: 30, lon: 220 },
  { lat: -35, lon: 295 },
  { lat: 55, lon: 130 },
  { lat: -40, lon: 40 },
];

// Dense Photorealistic CGI Particle Sphere Component
const ParticleSphere: React.FC<{ isPaused?: boolean }> = ({ isPaused = false }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const coreRef = useRef<THREE.Points>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  // Check prefers-reduced-motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Create smooth round glowing point texture
  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  // Generate outer glowing particles using Fibonacci distribution for fast rendering
  const { positions, colors } = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const count = isMobile ? 1200 : 1800;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
    const radius = 2.25;

    const cyan = new THREE.Color('#00f0ff');
    const magenta = new THREE.Color('#ff007f');
    const violet = new THREE.Color('#a855f7');
    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = (2 * Math.PI * i) / phi;

      const jitter = (Math.random() - 0.5) * 0.12;
      const r = radius + jitter;

      const x = r * radiusAtY * Math.cos(theta);
      const yPos = r * y;
      const z = r * radiusAtY * Math.sin(theta);

      pos[i * 3] = x;
      pos[i * 3 + 1] = yPos;
      pos[i * 3 + 2] = z;

      const t = (y + 1) / 2;
      if (t > 0.5) {
        tempColor.copy(cyan).lerp(magenta, (t - 0.5) * 2);
      } else {
        tempColor.copy(magenta).lerp(violet, t * 2);
      }

      col[i * 3] = tempColor.r;
      col[i * 3 + 1] = tempColor.g;
      col[i * 3 + 2] = tempColor.b;
    }

    return { positions: pos, colors: col };
  }, []);

  // Hollow Core Particle Sphere Cloud
  const corePositions = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const count = isMobile ? 600 : 800;
    const pos = new Float32Array(count * 3);
    const phi = (1 + Math.sqrt(5)) / 2;
    const radius = 1.35;

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = (2 * Math.PI * i) / phi;

      pos[i * 3] = radius * radiusAtY * Math.cos(theta);
      pos[i * 3 + 1] = radius * y;
      pos[i * 3 + 2] = radius * radiusAtY * Math.sin(theta);
    }
    return pos;
  }, []);

  // Animate Sphere Rings & Rotation smoothly
  useFrame((_, delta) => {
    if (prefersReducedMotion || isPaused) return;

    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.12;
      pointsRef.current.rotation.x = Math.sin(Date.now() * 0.0003) * 0.08;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y -= delta * 0.18;
      coreRef.current.rotation.z += delta * 0.05;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.25;
      ring1Ref.current.rotation.x += delta * 0.1;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 0.2;
      ring2Ref.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group>
      {/* Outer Glowing Holographic Shell */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.065}
          vertexColors
          map={particleTexture}
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Inner Dense Core Cloud */}
      <points ref={coreRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[corePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.045}
          color="#00f0ff"
          map={particleTexture}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Orbital Ring 1 - Cyan Cyber Ring */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[2.5, 2.53, 64]} />
        <meshBasicMaterial
          color="#00f0ff"
          side={THREE.DoubleSide}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Orbital Ring 2 - Magenta Cyber Ring */}
      <mesh ref={ring2Ref} rotation={[-Math.PI / 4, Math.PI / 6, 0]}>
        <ringGeometry args={[2.8, 2.82, 64]} />
        <meshBasicMaterial
          color="#ff007f"
          side={THREE.DoubleSide}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

// Interactive Hotspot Badge Attached to 3D Sphere Surface
const ProductNode: React.FC<{
  product: Product;
  lat: number;
  lon: number;
  onSelect?: (product: Product) => void;
  index: number;
}> = ({ product, lat, lon, onSelect, index }) => {
  const [hovered, setHovered] = useState(false);

  // Convert lat/lon to 3D Cartesian Position on sphere surface (r=2.25)
  const position = useMemo(() => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const r = 2.26;
    return new THREE.Vector3(
      -(r * Math.sin(phi) * Math.cos(theta)),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }, [lat, lon]);

  const displayPrice = product.priceYER ? `${product.priceYER.toLocaleString('ar-YE')} ر.ي` : '';

  return (
    <group position={position}>
      <Html
        distanceFactor={8}
        zIndexRange={[100, 0]}
        transform
        sprite
      >
        <div
          className="relative group cursor-pointer select-none dir-rtl"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelect) onSelect(product);
          }}
        >
          {/* Pulsing Target Ring */}
          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-2 rounded-full bg-cyan-500/30 animate-ping opacity-75" />
            <div className="w-8 h-8 rounded-full bg-[#0d091f]/90 border-2 border-cyan-400 p-0.5 shadow-[0_0_15px_rgba(0,240,255,0.8)] overflow-hidden transition-transform duration-300 group-hover:scale-125 group-hover:border-magenta-500">
              <img
                src={product.image || FALLBACK_IMAGE}
                alt={product.name}
                onError={handleImageError}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>

          {/* Hover Card Preview Popup */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-44 p-2.5 rounded-2xl bg-[#090514]/95 border border-cyan-500/40 shadow-[0_10px_30px_rgba(0,240,255,0.3)] backdrop-blur-md pointer-events-none text-right z-50"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden mb-1.5 border border-white/10">
                  <img
                    src={product.image || FALLBACK_IMAGE}
                    alt={product.name}
                    onError={handleImageError}
                    className="w-full h-full object-cover"
                  />
                  {product.discountBadge && (
                    <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-magenta-600 text-white">
                      {product.discountBadge}
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-1 mb-0.5">{product.name}</h4>
                {displayPrice && (
                  <p className="text-[11px] font-extrabold text-cyan-300">{displayPrice}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Html>
    </group>
  );
};

// Lite Mode Fallback Component (for low-power mobile or disabled WebGL)
const LiteGlobeFallback: React.FC<{
  products: Product[];
  onSelectProduct?: (product: Product) => void;
  showTitleBadge?: boolean;
}> = ({ products, onSelectProduct, showTitleBadge = true }) => {
  return (
    <div className="relative w-full h-full min-h-[320px] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#0f0926] via-[#090517] to-[#04020a] rounded-3xl border border-cyan-500/20 shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden">
      {/* Background Cyber Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.15)_0%,transparent_70%)]" />

      {showTitleBadge && (
        <div className="relative z-10 text-center mb-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            استكشاف المنتجات ثلاثي الأبعاد 🌐
          </span>
        </div>
      )}

      {/* Grid of Highlighted Products */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
        {products.slice(0, 4).map((p) => (
          <motion.div
            key={p.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectProduct && onSelectProduct(p)}
            className="p-2.5 rounded-2xl bg-[#140b33]/80 border border-cyan-500/30 hover:border-cyan-400 cursor-pointer shadow-lg backdrop-blur-sm text-center flex flex-col items-center group"
          >
            <div className="w-14 h-14 rounded-xl overflow-hidden mb-2 border border-white/10 group-hover:border-cyan-400 transition-colors">
              <img
                src={p.image || FALLBACK_IMAGE}
                alt={p.name}
                onError={handleImageError}
                className="w-full h-full object-cover"
              />
            </div>
            <h4 className="text-[11px] font-bold text-white line-clamp-1 mb-0.5">{p.name}</h4>
            <span className="text-[10px] font-extrabold text-cyan-300">
              {p.priceYER ? `${p.priceYER.toLocaleString('ar-YE')} ر.ي` : ''}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const HolographicGlobe: React.FC<HolographicGlobeProps> = ({
  products = [],
  onSelectProduct,
  size = '100%',
  className = '',
  showTitleBadge = true,
  paused = false,
}) => {
  const { isLiteMode } = useLiteMode();

  // Safety fallback if no products provided
  const displayProducts = useMemo(() => {
    if (products.length > 0) return products;
    return [
      { id: '1', name: 'منتج إندكس الفاخر', priceYER: 25000, image: FALLBACK_IMAGE },
      { id: '2', name: 'ساعة ذكية متطورة', priceYER: 18000, image: FALLBACK_IMAGE },
      { id: '3', name: 'سماعة لاسلكية عزل صوت', priceYER: 12000, image: FALLBACK_IMAGE },
    ] as Product[];
  }, [products]);

  if (isLiteMode) {
    return (
      <LiteGlobeFallback
        products={displayProducts}
        onSelectProduct={onSelectProduct}
        showTitleBadge={showTitleBadge}
      />
    );
  }

  return (
    <div
      className={`relative w-full h-full min-h-[350px] sm:min-h-[450px] flex items-center justify-center overflow-hidden rounded-3xl dir-rtl ${className}`}
      style={{ width: size, height: typeof size === 'number' ? `${size}px` : size }}
    >
      {/* Background Stars & Holographic Light Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b051c] via-[#060310] to-[#020108] pointer-events-none" />

      {showTitleBadge && (
        <div className="absolute top-4 right-4 z-20 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0d0724]/80 border border-cyan-500/40 text-cyan-300 text-xs font-black shadow-[0_0_20px_rgba(0,240,255,0.4)] backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            عالم إندكس التفاعلي 🌐
          </div>
        </div>
      )}

      {/* 3D WebGL Canvas Sphere Layer */}
      <WebGLErrorBoundary
        fallback={
          <LiteGlobeFallback
            products={displayProducts}
            onSelectProduct={onSelectProduct}
            showTitleBadge={showTitleBadge}
          />
        }
      >
        <Canvas
          camera={{ position: [0, 0, 6.2], fov: 45 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#00f0ff" />
          <pointLight position={[-10, -10, -10]} intensity={1.2} color="#ff007f" />

          <Suspense fallback={null}>
            <Sparkles count={80} scale={6} size={2.5} speed={0.4} color="#00f0ff" />
            <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />

            {/* Particle Fibonacci Sphere */}
            <ParticleSphere isPaused={paused} />

            {/* Render Surface Product Nodes */}
            {displayProducts.slice(0, 7).map((product, idx) => {
              const coords = PRODUCT_COORDS[idx % PRODUCT_COORDS.length];
              return (
                <ProductNode
                  key={product.id || idx}
                  product={product}
                  lat={coords.lat}
                  lon={coords.lon}
                  onSelect={onSelectProduct}
                  index={idx}
                />
              );
            })}

            {/* Interactive Smooth Mouse Control */}
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              rotateSpeed={0.5}
              autoRotate={!paused}
              autoRotateSpeed={0.8}
            />
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
};
