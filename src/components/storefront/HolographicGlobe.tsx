import React, { useEffect, useRef, useState } from "react";

export interface HolographicGlobeProduct {
  id: string;
  slug: string;
  name: string;
  image?: string;
  price?: number | string;
}

export interface HolographicGlobeProps {
  products?: readonly HolographicGlobeProduct[];
  onSelectProduct?: (product: HolographicGlobeProduct) => void;
  size?: number;
  showTitleBadge?: boolean;
  className?: string;
  paused?: boolean;
}

export const HolographicGlobe: React.FC<HolographicGlobeProps> = ({
  products = [],
  onSelectProduct,
  size = 420,
  showTitleBadge = true,
  className = "",
  paused = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const badgeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tooltipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const rotYRef = useRef(0);
  const rotXRef = useRef(0.2);
  const velocityYRef = useRef(0.003);
  const velocityXRef = useRef(0.0005);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const radius = size * 0.34;
    const cx = size / 2;
    const cy = size / 2;

    const productCoords = [
      { lat: 20, lon: 0 },
      { lat: -15, lon: 60 },
      { lat: 35, lon: 120 },
      { lat: -30, lon: 180 },
      { lat: 10, lon: 240 },
      { lat: -25, lon: 300 },
      { lat: 45, lon: 330 },
    ];

    let animationFrameId: number | null = null;

    const checkShouldPause = () => {
      if (paused) return true;
      if (typeof document !== "undefined" && document.hidden) return true;
      if (
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return true;
      }
      return false;
    };

    const render = () => {
      if (checkShouldPause()) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, size, size);

      if (!isDraggingRef.current) {
        rotYRef.current += velocityYRef.current;
        rotXRef.current += velocityXRef.current;
        velocityYRef.current *= 0.985;
        velocityXRef.current *= 0.985;

        if (Math.abs(velocityYRef.current) < 0.002) {
          velocityYRef.current = 0.002;
        }
      }

      const rotY = rotYRef.current;
      const rotX = rotXRef.current;

      ctx.save();

      const project = (latDeg: number, lonDeg: number) => {
        const latRad = (latDeg * Math.PI) / 180;
        const lonRad = (lonDeg * Math.PI) / 180;

        const x0 = radius * Math.cos(latRad) * Math.cos(lonRad);
        const y0 = radius * Math.sin(latRad);
        const z0 = radius * Math.cos(latRad) * Math.sin(lonRad);

        const x1 = x0 * Math.cos(rotY) + z0 * Math.sin(rotY);
        const z1 = -x0 * Math.sin(rotY) + z0 * Math.cos(rotY);

        const y2 = y0 * Math.cos(rotX) - z1 * Math.sin(rotX);
        const z2 = y0 * Math.sin(rotX) + z1 * Math.cos(rotX);

        return {
          px: cx + x1,
          py: cy - y2,
          z: z2,
        };
      };

      const latitudes = [-65, -45, -25, 0, 25, 45, 65];
      const stepLon = 6;

      latitudes.forEach((lat) => {
        ctx.beginPath();
        let first = true;
        let isFrontRing = false;

        for (let lon = 0; lon <= 360; lon += stepLon) {
          const { px, py, z } = project(lat, lon);
          if (z > 0) isFrontRing = true;

          if (first) {
            ctx.moveTo(px, py);
            first = false;
          } else {
            ctx.lineTo(px, py);
          }
        }

        ctx.strokeStyle = isFrontRing ? "rgba(56, 189, 248, 0.45)" : "rgba(47, 107, 255, 0.15)";
        ctx.lineWidth = isFrontRing ? 1.2 : 0.8;
        if (isFrontRing) {
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = 4;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
      });

      const longitudes = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
      const stepLat = 6;

      longitudes.forEach((lon) => {
        ctx.beginPath();
        let first = true;
        let isFrontMeridian = false;

        for (let lat = -90; lat <= 90; lat += stepLat) {
          const { px, py, z } = project(lat, lon);
          if (z > 0) isFrontMeridian = true;

          if (first) {
            ctx.moveTo(px, py);
            first = false;
          } else {
            ctx.lineTo(px, py);
          }
        }

        ctx.strokeStyle = isFrontMeridian ? "rgba(56, 189, 248, 0.65)" : "rgba(56, 189, 248, 0.15)";
        ctx.lineWidth = isFrontMeridian ? 1.4 : 0.8;
        if (isFrontMeridian) {
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = 6;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
      });

      latitudes.forEach((lat) => {
        longitudes.forEach((lon) => {
          const { px, py, z } = project(lat, lon);
          if (z > -radius * 0.1) {
            const alpha = Math.max(0, (z + radius * 0.2) / (radius * 1.2));
            ctx.beginPath();
            ctx.arc(px, py, 1.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(224, 165, 255, ${alpha})`;
            ctx.shadowColor = "#00ffff";
            ctx.shadowBlur = 8;
            ctx.fill();
          }
        });
      });

      // Imperative DOM overlay positioning without React setState
      products.slice(0, 7).forEach((_, idx) => {
        const btn = badgeRefs.current[idx];
        if (!btn) return;

        const coord = productCoords[idx % productCoords.length];
        const { px, py, z } = project(coord.lat, coord.lon);
        const scale = 0.65 + 0.35 * ((z + radius) / (2 * radius));
        const opacity = z > 0 ? Math.min(1, 0.4 + (z / radius) * 0.6) : 0.25;
        const isFront = z > 0;

        btn.style.left = `${px}px`;
        btn.style.top = `${py}px`;
        btn.style.transform = `translate(-50%, -50%) scale(${scale})`;
        btn.style.opacity = `${opacity}`;
        btn.style.pointerEvents = isFront ? "auto" : "none";
        btn.tabIndex = isFront ? 0 : -1;
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [products, size, paused]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;

    rotYRef.current += dx * 0.008;
    rotXRef.current += dy * 0.008;

    rotXRef.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotXRef.current));

    velocityYRef.current = dx * 0.002;
    velocityXRef.current = dy * 0.002;

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture fails
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {showTitleBadge && (
        <div className="absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] px-3 py-1 rounded-full text-[10px] sm:text-[11.5px] font-extrabold text-[var(--color-text-primary)] shadow-md whitespace-nowrap backdrop-blur-md">
          <span className="text-[#2F6BFF] text-[14px]">🌐</span>
          <span className="text-[var(--color-text-primary)]">معرض المنتجات</span>
          <span className="text-[var(--color-text-muted)]">•</span>
          <span className="text-[var(--color-text-secondary)]">اسحب الكرة للدوران</span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="cursor-grab active:cursor-grabbing touch-none z-10"
        style={{ width: size, height: size }}
      />

      {products.slice(0, 7).map((product, idx) => {
        return (
          <button
            key={product.id}
            type="button"
            ref={(el) => {
              badgeRefs.current[idx] = el;
            }}
            aria-label={`عرض تفاصيل ${product.name}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectProduct) {
                onSelectProduct(product);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (onSelectProduct) {
                  onSelectProduct(product);
                }
              }
            }}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            onFocus={() => setHoveredIndex(idx)}
            onBlur={() => setHoveredIndex(null)}
            className="absolute z-20 transition-transform duration-75 cursor-pointer flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-[#2F6BFF] rounded-2xl"
            style={{
              width: 44,
              height: 44,
            }}
          >
            <div className="w-full h-full rounded-2xl p-0.5 border shadow-md bg-[var(--color-surface-1)] border-[#2F6BFF] shadow-blue-500/20">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-full bg-slate-800 rounded-xl flex items-center justify-center text-[10px]">
                  🛍️
                </div>
              )}
            </div>

            {hoveredIndex === idx && (
              <div
                ref={(el) => {
                  tooltipRefs.current[idx] = el;
                }}
                className="absolute top-full mt-1 bg-[var(--color-surface-1)] border border-[#2F6BFF] text-[var(--color-text-primary)] text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap shadow-xl z-30 pointer-events-none"
              >
                {product.name}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
