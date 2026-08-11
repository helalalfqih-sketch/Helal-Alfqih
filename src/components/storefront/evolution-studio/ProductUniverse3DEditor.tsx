import React from 'react';
import { 
  Orbit, 
  Sparkles, 
  Video, 
  Cpu, 
  Sliders, 
  RotateCcw, 
  Activity 
} from 'lucide-react';
import { ProductUniverse3DTokens } from '@/types/evolutionStudio';

interface ProductUniverse3DEditorProps {
  tokens: ProductUniverse3DTokens;
  onChangeTokens: (updated: ProductUniverse3DTokens) => void;
  onResetTokens: () => void;
}

export const ProductUniverse3DEditor: React.FC<ProductUniverse3DEditorProps> = ({
  tokens,
  onChangeTokens,
  onResetTokens,
}) => {
  const updateField = <K extends keyof ProductUniverse3DTokens>(key: K, value: ProductUniverse3DTokens[K]) => {
    onChangeTokens({
      ...tokens,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4 text-xs text-white dir-rtl">
      
      {/* Real-time 3D Scene Stats */}
      <div className="bg-[#100d2b] border border-cyan-500/30 rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 font-bold text-cyan-300">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>إحصائيات مشهد الـ 3D المباشر</span>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold">
            60 FPS (سلس)
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="bg-black/40 border border-white/10 p-2 rounded-xl">
            <span className="text-gray-400 block">عدد الجسيمات:</span>
            <span className="font-bold text-white text-xs mt-0.5 block">{tokens.particleDensity}</span>
          </div>
          <div className="bg-black/40 border border-white/10 p-2 rounded-xl">
            <span className="text-gray-400 block">مدارات حول الكوكب:</span>
            <span className="font-bold text-white text-xs mt-0.5 block">{tokens.orbitCount}</span>
          </div>
          <div className="bg-black/40 border border-white/10 p-2 rounded-xl">
            <span className="text-gray-400 block">مستوى الجودة:</span>
            <span className="font-bold text-cyan-300 text-xs mt-0.5 block uppercase">{tokens.qualityTier}</span>
          </div>
        </div>
      </div>

      {/* Planet & Atmosphere Controls */}
      <div className="bg-[#0e0a24] border border-white/10 rounded-2xl p-3 space-y-3">
        <div className="flex items-center justify-between font-bold text-gray-200">
          <div className="flex items-center gap-2">
            <Orbit className="w-4 h-4 text-purple-400" />
            <span>الكوكب والهالة الهولوغرافية</span>
          </div>
          <button
            onClick={onResetTokens}
            className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>الافتراضي</span>
          </button>
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>كثافة جسيمات الكوكب (Particles):</span>
            <span className="font-bold text-white">{tokens.particleDensity}</span>
          </div>
          <input
            type="range"
            min={1200}
            max={5000}
            step={200}
            value={tokens.particleDensity}
            onChange={(e) => updateField('particleDensity', Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>قطر الكوكب الأساسي (Planet Radius):</span>
            <span className="font-bold text-white">{tokens.planetSize}</span>
          </div>
          <input
            type="range"
            min={1.5}
            max={3.5}
            step={0.1}
            value={tokens.planetSize}
            onChange={(e) => updateField('planetSize', Number(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>سرعة الدوران التلقائي (Orbit Speed):</span>
            <span className="font-bold text-white">{tokens.orbitSpeed}</span>
          </div>
          <input
            type="range"
            min={0.05}
            max={0.5}
            step={0.02}
            value={tokens.orbitSpeed}
            onChange={(e) => updateField('orbitSpeed', Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>
      </div>

      {/* Lighting & Camera */}
      <div className="bg-[#0e0a24] border border-white/10 rounded-2xl p-3 space-y-3">
        <div className="font-bold text-gray-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>الإضاءة والمسافة الكاميرية</span>
        </div>

        <div>
          <label className="text-[10px] text-gray-400 block mb-1">لون المدار المضيء:</label>
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-1.5 rounded-xl">
            <input
              type="color"
              value={tokens.orbitColor}
              onChange={(e) => updateField('orbitColor', e.target.value)}
              className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
            />
            <span className="font-mono text-[10px]">{tokens.orbitColor}</span>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-gray-400 block mb-1">فئة الأداء للجهاز (Quality Tier):</label>
          <div className="grid grid-cols-3 gap-1">
            {(['high', 'medium', 'low'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => updateField('qualityTier', tier)}
                className={`py-1 rounded-lg font-bold text-[10px] border cursor-pointer uppercase ${
                  tokens.qualityTier === tier ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-black/30 border-white/10 text-gray-400'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
