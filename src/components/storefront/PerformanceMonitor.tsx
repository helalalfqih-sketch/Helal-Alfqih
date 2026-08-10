import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Cpu,
  HardDrive,
  Zap,
  Gauge,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  RefreshCw,
  Check,
  ShieldAlert,
  Boxes,
} from 'lucide-react';

export interface PerformanceStats {
  fps: number;
  minFps: number;
  maxFps: number;
  frameTimeMs: number;
  memoryUsedMb: number | null;
  memoryTotalMb: number | null;
  webGlActive: boolean;
  isStable60: boolean;
  droppedFramesCount: number;
}

export interface PerformanceMonitorProps {
  onBoostPerformance?: () => void;
  isBoostActive?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  onBoostPerformance,
  isBoostActive = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 60,
    minFps: 60,
    maxFps: 60,
    frameTimeMs: 16.6,
    memoryUsedMb: null,
    memoryTotalMb: null,
    webGlActive: true,
    isStable60: true,
    droppedFramesCount: 0,
  });

  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const requestRef = useRef<number | null>(null);
  const minFpsRef = useRef<number>(60);
  const maxFpsRef = useRef<number>(60);
  const droppedFramesRef = useRef<number>(0);

  // Measure FPS accurately using requestAnimationFrame
  useEffect(() => {
    const updateStats = () => {
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (delta > 0) {
        frameTimesRef.current.push(delta);
        if (frameTimesRef.current.length > 45) {
          frameTimesRef.current.shift();
        }

        // Detect frame drop (> 33ms means < 30fps drop)
        if (delta > 33.3) {
          droppedFramesRef.current += 1;
        }
      }

      requestRef.current = requestAnimationFrame(updateStats);
    };

    requestRef.current = requestAnimationFrame(updateStats);

    // Periodic state calculation every 500ms to reduce render overhead
    const interval = setInterval(() => {
      const times = frameTimesRef.current;
      if (times.length === 0) return;

      const avgDelta = times.reduce((a, b) => a + b, 0) / times.length;
      const calculatedFps = Math.min(60, Math.round(1000 / Math.max(1, avgDelta)));
      const frameTimeMs = parseFloat(avgDelta.toFixed(1));

      if (calculatedFps < minFpsRef.current && calculatedFps > 0) {
        minFpsRef.current = calculatedFps;
      }
      if (calculatedFps > maxFpsRef.current) {
        maxFpsRef.current = calculatedFps;
      }

      // Memory measurement via window.performance.memory (Chromium)
      let usedMb: number | null = null;
      let totalMb: number | null = null;
      const perfMemory = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      if (perfMemory) {
        usedMb = Math.round(perfMemory.usedJSHeapSize / (1024 * 1024));
        totalMb = Math.round(perfMemory.jsHeapSizeLimit / (1024 * 1024));
      }

      // WebGL check
      let webGlOk = true;
      try {
        const canvas = document.createElement('canvas');
        webGlOk = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch {
        webGlOk = false;
      }

      setStats({
        fps: calculatedFps,
        minFps: minFpsRef.current,
        maxFps: maxFpsRef.current,
        frameTimeMs,
        memoryUsedMb: usedMb,
        memoryTotalMb: totalMb,
        webGlActive: webGlOk,
        isStable60: calculatedFps >= 55,
        droppedFramesCount: droppedFramesRef.current,
      });
    }, 500);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      clearInterval(interval);
    };
  }, []);

  const handleResetStats = () => {
    minFpsRef.current = stats.fps;
    maxFpsRef.current = stats.fps;
    droppedFramesRef.current = 0;
    frameTimesRef.current = [];
    setStats((prev) => ({
      ...prev,
      minFps: prev.fps,
      maxFps: prev.fps,
      droppedFramesCount: 0,
    }));
  };

  // Color dynamic logic based on FPS
  const getFpsColor = (fps: number) => {
    if (fps >= 55) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (fps >= 40) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  return (
    <div className="fixed top-20 left-3 sm:left-6 z-40 dir-rtl selection:bg-blue-500 selection:text-white font-sans">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* Minimized Compact Badge */
          <motion.button
            key="minimized-badge"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setIsExpanded(true)}
            className={`flex items-center gap-2 border px-2.5 py-1.5 rounded-full backdrop-blur-xl shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95 text-xs font-black ${getFpsColor(
              stats.fps
            )}`}
            title="انقر لفتح أداة قياس الأداء الفعلي (Performance Monitor)"
          >
            <Gauge className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-black tracking-tight">{stats.fps} FPS</span>
            {stats.memoryUsedMb !== null && (
              <span className="text-[10px] text-white/80 font-semibold border-r border-white/20 pr-1.5 mr-0.5">
                {stats.memoryUsedMb} MB
              </span>
            )}
            <ChevronDown className="w-3 h-3 opacity-70" />
          </motion.button>
        ) : (
          /* Expanded Performance Panel */
          <motion.div
            key="expanded-panel"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-72 sm:w-80 bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-2xl p-3.5 shadow-2xl backdrop-blur-2xl text-xs text-[var(--color-text-primary)] space-y-3 relative overflow-hidden"
          >
            {/* Ambient Top Glow */}
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500" />

            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-[#2F6BFF]">
                  <Activity className="w-4 h-4 text-[#2F6BFF] animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-[var(--color-text-primary)]">
                    مراقب الأداء الفعلي (FPS Monitor)
                  </h4>
                  <span className="text-[10px] text-[var(--color-text-secondary)] font-medium">
                    قياس الكرة ثلاثية الأبعاد والذاكرة
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleResetStats}
                  className="p-1 hover:bg-[var(--color-surface-2)] rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                  title="إعادة تعيين الأحصائيات"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-[var(--color-surface-2)] rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                  title="تصغير"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* FPS Box */}
              <div className="bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] text-[var(--color-text-secondary)] font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-[#2F6BFF]" />
                    <span>معدل الإطارات</span>
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                      stats.isStable60 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {stats.isStable60 ? 'ثابت 60FPS' : 'متغير'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-2xl font-black text-[var(--color-text-primary)] tracking-tight">
                    {stats.fps}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-secondary)] font-bold">FPS</span>
                </div>
                <div className="text-[10px] text-[var(--color-text-secondary)] flex justify-between font-medium pt-1 border-t border-[var(--color-border-subtle)]">
                  <span>الأدنى: {stats.minFps}</span>
                  <span>الأعلى: {stats.maxFps}</span>
                </div>
              </div>

              {/* Memory / Frame Time Box */}
              <div className="bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] text-[var(--color-text-secondary)] font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                    <span>الذاكرة / زمن الإطار</span>
                  </span>
                </div>
                <div className="my-1">
                  <div className="text-base font-black text-[var(--color-text-primary)] tracking-tight">
                    {stats.memoryUsedMb !== null ? `${stats.memoryUsedMb} MB` : `${stats.frameTimeMs} ms`}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-secondary)] font-medium">
                    {stats.memoryUsedMb !== null ? `من أصل ${stats.memoryTotalMb || '∞'} MB` : 'زمن معالجة الإطار'}
                  </div>
                </div>
                <div className="text-[10px] text-[var(--color-text-secondary)] flex justify-between font-medium pt-1 border-t border-[var(--color-border-subtle)]">
                  <span>إطارات مفقودة: {stats.droppedFramesCount}</span>
                </div>
              </div>
            </div>

            {/* 3D WebGL Engine Status */}
            <div className="bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Boxes className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold text-[var(--color-text-primary)]">
                    محرك الكرة 3D (WebGL2)
                  </div>
                  <div className="text-[10px] text-[var(--color-text-secondary)] font-medium">
                    {stats.webGlActive ? 'نشط ويعمل بسلاسة عالية' : 'معطل (دعم برمجي احتياطي)'}
                  </div>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            {/* Performance Boost Action */}
            {onBoostPerformance && (
              <button
                type="button"
                onClick={onBoostPerformance}
                className={`w-full py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                  isBoostActive
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                    : 'bg-[#2F6BFF] hover:bg-[#2458D8] text-white shadow-blue-500/20'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${isBoostActive ? 'fill-white text-white' : 'text-amber-300'}`} />
                <span>{isBoostActive ? 'وضع الأداء الفائق مفعل (60 FPS Lock) ✓' : 'تفعيل تسريع الأداء لـ 60 FPS'}</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
