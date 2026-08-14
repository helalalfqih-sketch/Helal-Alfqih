import React from 'react';
import { 
  Palette, 
  Sparkles, 
  Layers, 
  Check, 
  RotateCcw, 
  Eye, 
  AlertCircle 
} from 'lucide-react';
import { DesignTokens } from '../../types/evolutionStudio';
import { PRESET_THEMES } from '../../lib/evolutionStudioStore';

interface DesignTokenEditorProps {
  tokens: DesignTokens;
  onChangeTokens: (updated: DesignTokens) => void;
  onResetTokens: () => void;
}

export const DesignTokenEditor: React.FC<DesignTokenEditorProps> = ({
  tokens,
  onChangeTokens,
  onResetTokens,
}) => {
  const updateField = <K extends keyof DesignTokens>(key: K, value: DesignTokens[K]) => {
    onChangeTokens({
      ...tokens,
      [key]: value,
    });
  };

  const applyPreset = (presetKey: string) => {
    const preset = PRESET_THEMES[presetKey];
    if (preset) {
      onChangeTokens({
        ...tokens,
        ...preset.tokens,
      });
    }
  };

  return (
    <div className="space-y-4 text-xs text-white dir-rtl">
      
      {/* Preset Theme Selection */}
      <div className="bg-[#130d2e] border border-purple-500/30 rounded-2xl p-3">
        <div className="flex items-center gap-2 mb-2 font-bold text-purple-300">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>الثيمات والمظهر الجاهز (Presets)</span>
        </div>
        <p className="text-[10px] text-gray-400 mb-2.5">
          اختر ثيماً بظلال وألوان متناسقة ومختبرة مسبقاً
        </p>

        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PRESET_THEMES).map(([key, item]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className="bg-black/40 hover:bg-purple-900/30 border border-white/10 hover:border-purple-500/50 p-2 rounded-xl text-right transition-all cursor-pointer group"
            >
              <div className="font-bold text-xs text-white group-hover:text-purple-300">
                {item.name}
              </div>
              <div className="text-[9px] text-gray-400 line-clamp-1 mt-0.5">
                {item.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Primary Color Palette Controls */}
      <div className="bg-[#0e0a24] border border-white/10 rounded-2xl p-3 space-y-3">
        <div className="flex items-center justify-between font-bold text-gray-200">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-cyan-400" />
            <span>لوحة الألوان الأساسية</span>
          </div>
          <button
            onClick={onResetTokens}
            className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>إعادة الافتراضي</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">اللون الرئيسي (Primary):</label>
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-1.5 rounded-xl">
              <input
                type="color"
                value={tokens.colorPrimary}
                onChange={(e) => updateField('colorPrimary', e.target.value)}
                className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
              />
              <span className="font-mono text-[10px]">{tokens.colorPrimary}</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 block mb-1">اللون الثانوي (Secondary):</label>
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-1.5 rounded-xl">
              <input
                type="color"
                value={tokens.colorSecondary}
                onChange={(e) => updateField('colorSecondary', e.target.value)}
                className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
              />
              <span className="font-mono text-[10px]">{tokens.colorSecondary}</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 block mb-1">لون الخلفية (Background):</label>
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-1.5 rounded-xl">
              <input
                type="color"
                value={tokens.colorBackground}
                onChange={(e) => updateField('colorBackground', e.target.value)}
                className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
              />
              <span className="font-mono text-[10px]">{tokens.colorBackground}</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 block mb-1">لون الأسطح (Surface):</label>
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-1.5 rounded-xl">
              <input
                type="color"
                value={tokens.colorSurface}
                onChange={(e) => updateField('colorSurface', e.target.value)}
                className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
              />
              <span className="font-mono text-[10px]">{tokens.colorSurface}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Layout & Glassmorphism Properties */}
      <div className="bg-[#0e0a24] border border-white/10 rounded-2xl p-3 space-y-3">
        <div className="font-bold text-gray-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>السطوح، الحواف، وضبابية الزجاج</span>
        </div>

        <div>
          <label className="text-[10px] text-gray-400 block mb-1">انحناء الحواف (Border Radius):</label>
          <div className="grid grid-cols-4 gap-1">
            {(['none', 'md', 'xl', '2xl'] as const).map((r) => (
              <button
                key={r}
                onClick={() => updateField('borderRadius', r)}
                className={`py-1 rounded-lg font-bold text-[10px] border cursor-pointer ${
                  tokens.borderRadius === r ? 'bg-purple-600 border-purple-400 text-white' : 'bg-black/30 border-white/10 text-gray-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>قوة ضبابية الزجاج (Glass Blur):</span>
            <span className="font-bold text-white">{tokens.glassBlur}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={32}
            value={tokens.glassBlur}
            onChange={(e) => updateField('glassBlur', Number(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>
      </div>

    </div>
  );
};
