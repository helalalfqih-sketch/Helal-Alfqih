import React from "react";
import { Gauge, Clock, ShieldCheck, ChevronUp, Sparkles } from "lucide-react";

interface GleamPerformancePanelProps {
  lighthouseScore?: number;
  buildTime?: string;
  securityPass?: boolean;
}

export function GleamPerformancePanel({
  lighthouseScore = 98,
  buildTime = "1.2s",
  securityPass = true,
}: GleamPerformancePanelProps) {
  return (
    <div className="w-full bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-4 shadow-xl shadow-purple-500/5 space-y-3 font-sans">
      <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-2 border-b border-slate-200/60">
        <span className="flex items-center gap-1.5 text-purple-700 font-extrabold">
          <Sparkles className="h-4 w-4 text-purple-600" />
          AI & Performance Panel
        </span>
        <ChevronUp className="h-4 w-4 text-slate-400" />
      </div>

      <div className="space-y-2 text-xs font-medium">
        {/* Lighthouse Score */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/60">
          <div className="flex items-center gap-2 text-slate-600">
            <Gauge className="h-4 w-4 text-emerald-500" />
            <span>Lighthouse Score:</span>
          </div>
          <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 font-black font-mono border border-emerald-500/20">
            {lighthouseScore}
          </span>
        </div>

        {/* Build Time */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/60">
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="h-4 w-4 text-sky-500" />
            <span>Build Time:</span>
          </div>
          <span className="px-3 py-1 rounded-xl bg-sky-500/10 text-sky-600 font-black font-mono border border-sky-500/20">
            {buildTime}
          </span>
        </div>

        {/* Security Check */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/60">
          <div className="flex items-center gap-2 text-slate-600">
            <ShieldCheck className="h-4 w-4 text-purple-500" />
            <span>Security Check:</span>
          </div>
          <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 font-black font-mono border border-emerald-500/20">
            {securityPass ? "Pass" : "Warning"}
          </span>
        </div>
      </div>
    </div>
  );
}
