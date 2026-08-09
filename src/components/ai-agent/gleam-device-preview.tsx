import React, { useState } from "react";
import {
  Sparkles,
  ExternalLink,
  Home,
  Search,
  ShoppingBag,
  User,
  RefreshCw,
  Globe,
} from "lucide-react";

interface GleamDevicePreviewProps {
  activeRoute?: string;
  projectName?: string;
}

export function GleamDevicePreview({
  activeRoute = "/",
  projectName = "INDEXES - LIVE",
}: GleamDevicePreviewProps) {
  const [useIframe, setUseIframe] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Action Strip Above Phone */}
      <div className="flex items-center gap-2 flex-wrap justify-center text-xs font-bold">
        <button
          type="button"
          onClick={() => setUseIframe(!useIframe)}
          className={`px-3 py-1.5 rounded-2xl border shadow-md transition flex items-center gap-1.5 ${
            useIframe
              ? "bg-violet-600 border-violet-500 text-white shadow-violet-600/30"
              : "bg-white/10 border-white/20 text-slate-200 hover:bg-white/20"
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          {useIframe ? "الموقع المباشر (Live)" : "محاكي المخطط"}
        </button>

        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="px-2.5 py-1.5 rounded-2xl bg-white/10 border border-white/20 text-slate-200 hover:bg-white/20 transition flex items-center gap-1"
          title="تحديث المعاينة"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>

        <a
          href={activeRoute}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-2xl bg-white/10 border border-white/20 text-slate-200 hover:bg-white/20 transition flex items-center gap-1"
        >
          <span>تصفح</span> <ExternalLink className="h-3 w-3 text-purple-400" />
        </a>

        <span className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-400 to-purple-500 text-white shadow-md flex items-center gap-1 text-[11px]">
          <Sparkles className="h-3 w-3 fill-current" /> {projectName}
        </span>
      </div>

      {/* Realistic Smartphone Frame Mockup */}
      <div className="relative w-[285px] h-[540px] bg-slate-950 rounded-[45px] p-2.5 shadow-2xl border-4 border-slate-800 ring-1 ring-white/20 overflow-hidden flex flex-col justify-between">
        {/* Dynamic Island / iPhone Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-30 flex items-center justify-center pointer-events-none">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-950 ml-auto mr-2" />
        </div>

        {/* Screen Area */}
        <div className="relative w-full h-full bg-slate-950 rounded-[35px] overflow-hidden flex flex-col justify-between pt-6 text-white">
          {useIframe ? (
            <iframe
              key={reloadKey}
              src={activeRoute}
              title="المعاينة المباشرة"
              className="w-full h-full border-0 bg-background rounded-[35px]"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 flex flex-col justify-between pt-2 pb-2">
              {/* Header */}
              <div className="text-center pt-2 px-3">
                <span className="text-[9px] tracking-widest text-slate-400 font-mono uppercase">
                  {projectName}
                </span>
                <h4 className="text-xs font-black mt-1 text-slate-100">كوكب المنتجات</h4>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  تفاعلي ثلاثي الأبعاد — انقر لاستكشاف العروض
                </p>
              </div>

              {/* 3D Product Sphere Graphic Simulation */}
              <div className="relative my-auto flex items-center justify-center py-4">
                <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-1 shadow-2xl shadow-purple-500/30 animate-pulse">
                  <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center p-3 text-center">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-1 border border-purple-500/30">
                      <Sparkles className="h-6 w-6 text-purple-300" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-200">Indexes Store</span>
                  </div>
                </div>
              </div>

              {/* Bottom App Navigation Bar */}
              <div className="mx-2 p-2 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10 flex items-center justify-around text-[9px] text-slate-400">
                <div className="flex flex-col items-center gap-0.5 text-purple-400">
                  <Home className="h-3.5 w-3.5" />
                  <span>الرئيسية</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 hover:text-white transition">
                  <Search className="h-3.5 w-3.5" />
                  <span>الاستكشاف</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 hover:text-white transition">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>السلة</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 hover:text-white transition">
                  <User className="h-3.5 w-3.5" />
                  <span>حسابي</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
