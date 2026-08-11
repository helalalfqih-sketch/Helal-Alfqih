import React from 'react';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Wifi, 
  WifiOff, 
  Zap, 
  Eye, 
  AlertTriangle,
  ArrowLeftRight,
  Maximize2
} from 'lucide-react';
import { DevicePreset, DeviceViewport } from '@/types/evolutionStudio';

export const DEVICE_VIEWPORTS: DeviceViewport[] = [
  { id: 'mobile-sm', label: 'هاتف صغير (360×800)', width: 360, height: 800, iconName: 'smartphone' },
  { id: 'mobile-std', label: 'هاتف قياسي (390×844)', width: 390, height: 844, iconName: 'smartphone' },
  { id: 'mobile-lg', label: 'هاتف كبير (412×915)', width: 412, height: 915, iconName: 'smartphone' },
  { id: 'tablet', label: 'آيباد / تابلت (768×1024)', width: 768, height: 1024, iconName: 'tablet' },
  { id: 'desktop', label: 'حاسوب محمول (1280×800)', width: 1280, height: 800, iconName: 'monitor' },
  { id: 'desktop-lg', label: 'شاشة عريضة (1440×900)', width: 1440, height: 900, iconName: 'monitor' },
];

interface ResponsiveDeviceLabProps {
  activePreset: DevicePreset;
  onSelectPreset: (preset: DevicePreset) => void;
  isRtl: boolean;
  onToggleRtl: () => void;
  slowNetwork: boolean;
  onToggleSlowNetwork: () => void;
  liteMode: boolean;
  onToggleLiteMode: () => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
  zoomScale: number;
  onZoomChange: (zoom: number) => void;
}

export const ResponsiveDeviceLab: React.FC<ResponsiveDeviceLabProps> = ({
  activePreset,
  onSelectPreset,
  isRtl,
  onToggleRtl,
  slowNetwork,
  onToggleSlowNetwork,
  liteMode,
  onToggleLiteMode,
  reducedMotion,
  onToggleReducedMotion,
  zoomScale,
  onZoomChange,
}) => {
  const currentViewport = DEVICE_VIEWPORTS.find((v) => v.id === activePreset) || DEVICE_VIEWPORTS[1];

  return (
    <div className="bg-[#0e0a24] border border-white/10 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-white">
      {/* Device Viewport Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-gray-400 font-bold ml-1 hidden sm:inline">الجهاز:</span>
        {DEVICE_VIEWPORTS.map((dev) => {
          const isActive = dev.id === activePreset;
          return (
            <button
              key={dev.id}
              onClick={() => onSelectPreset(dev.id)}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 border border-purple-400/50'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
              }`}
            >
              {dev.width < 500 ? <Smartphone className="w-3.5 h-3.5" /> : dev.width < 1000 ? <Tablet className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
              <span>{dev.label.split(' ')[0]}</span>
              <span className="text-[10px] opacity-75">({dev.width}px)</span>
            </button>
          );
        })}
      </div>

      {/* Lab Simulation Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* RTL / LTR Toggle */}
        <button
          onClick={onToggleRtl}
          className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 cursor-pointer transition-all ${
            isRtl ? 'bg-purple-950/60 border-purple-500/50 text-purple-300' : 'bg-gray-800 border-gray-700 text-gray-300'
          }`}
          title="تبديل اتجاه القراءة RTL/LTR"
        >
          <ArrowLeftRight className="w-3 h-3" />
          <span>{isRtl ? 'RTL (عربي)' : 'LTR (English)'}</span>
        </button>

        {/* Slow Network Simulation */}
        <button
          onClick={onToggleSlowNetwork}
          className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 cursor-pointer transition-all ${
            slowNetwork ? 'bg-amber-950/80 border-amber-500/60 text-amber-300' : 'bg-gray-800 border-gray-700 text-gray-400'
          }`}
          title="محاكاة اتصال شبكة بطيء 3G"
        >
          {slowNetwork ? <WifiOff className="w-3 h-3 text-amber-400" /> : <Wifi className="w-3 h-3" />}
          <span>{slowNetwork ? 'شبكة بطيئة (3G)' : 'شبكة سريعة'}</span>
        </button>

        {/* Lite Mode Toggle */}
        <button
          onClick={onToggleLiteMode}
          className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 cursor-pointer transition-all ${
            liteMode ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300' : 'bg-gray-800 border-gray-700 text-gray-400'
          }`}
          title="محاكاة النمط الموفر للطاقة"
        >
          <Zap className="w-3 h-3" />
          <span>{liteMode ? 'النمط الموفر (Lite)' : 'النمط العادي'}</span>
        </button>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-black/40 border border-white/10 px-2 py-0.5 rounded-lg">
          <Maximize2 className="w-3 h-3 text-gray-400" />
          <select
            value={zoomScale}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="bg-transparent text-white font-bold text-[11px] focus:outline-none cursor-pointer"
          >
            <option value={0.7} className="bg-gray-900">70%</option>
            <option value={0.85} className="bg-gray-900">85%</option>
            <option value={1} className="bg-gray-900">100%</option>
            <option value={1.15} className="bg-gray-900">115%</option>
          </select>
        </div>
      </div>
    </div>
  );
};
