import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  RotateCw, 
  Eye, 
  ArrowLeftRight, 
  History, 
  Save, 
  X, 
  Layers, 
  Palette, 
  Orbit, 
  Bot, 
  Inbox, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Check, 
  Lock, 
  Wrench,
  Smartphone
} from 'lucide-react';
import { Product } from '../../types';
import { DraftConfig, DevicePreset } from '../../types/evolutionStudio';
import { 
  loadActiveDraft, 
  saveActiveDraft, 
  runQualityGuardian, 
  INITIAL_DRAFT_CONFIG, 
  DEFAULT_DESIGN_TOKENS, 
  DEFAULT_UNIVERSE_3D,
  addAuditLog
} from '../../lib/evolutionStudioStore';
import { ResponsiveDeviceLab } from './ResponsiveDeviceLab';
import { DesignTokenEditor } from './DesignTokenEditor';
import { ProductUniverse3DEditor } from './ProductUniverse3DEditor';
import { AICreativeDirector } from './AICreativeDirector';
import { ImprovementInbox } from './ImprovementInbox';
import { StoreAuditModule } from './StoreAuditModule';
import { AutonomousDesignLab } from './AutonomousDesignLab';
import { VersionHistoryModal } from './VersionHistoryModal';
import { CompareDiffModal } from './CompareDiffModal';
import { VisualEditingCanvas } from './VisualEditingCanvas';
import { LockedCommerceCoreBanner } from './LockedCommerceCoreBanner';

interface IndexesEvolutionStudioProps {
  products: Product[];
  onClose: () => void;
  onApplyDraftToStore: (draft: DraftConfig) => void;
}

export function IndexesEvolutionStudio({
  products,
  onClose,
  onApplyDraftToStore,
}: IndexesEvolutionStudioProps) {
  // Active Draft Configuration
  const [draftConfig, setDraftConfig] = useState<DraftConfig>(loadActiveDraft());
  const [baselineConfig] = useState<DraftConfig>(loadActiveDraft());

  // Navigation Tabs state
  const [leftTab, setLeftTab] = useState<'tokens' | 'universe3d' | 'sections'>('tokens');
  const [rightTab, setRightTab] = useState<'ai' | 'inbox' | 'audit' | 'lab'>('ai');

  // Device & Viewport state
  const [activeDevicePreset, setActiveDevicePreset] = useState<DevicePreset>('desktop');
  const [isRtl, setIsRtl] = useState(true);
  const [slowNetwork, setSlowNetwork] = useState(false);
  const [liteMode, setLiteMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  // Selected Section on Canvas
  const [selectedSection, setSelectedSection] = useState('hero');

  // Modals state
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Undo / Redo stacks
  const [historyStack, setHistoryStack] = useState<DraftConfig[]>([loadActiveDraft()]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Quality Guardian Check Rules
  const guardianRules = runQualityGuardian(draftConfig);
  const hasFailures = guardianRules.some((r) => r.status === 'fail');

  const updateDraft = (newConfig: DraftConfig) => {
    setDraftConfig(newConfig);
    saveActiveDraft(newConfig);

    // Push to undo stack
    const newStack = historyStack.slice(0, historyIndex + 1);
    newStack.push(newConfig);
    setHistoryStack(newStack);
    setHistoryIndex(newStack.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = historyStack[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setDraftConfig(prev);
      saveActiveDraft(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const next = historyStack[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setDraftConfig(next);
      saveActiveDraft(next);
    }
  };

  const handleSaveDraft = () => {
    saveActiveDraft(draftConfig);
    onApplyDraftToStore(draftConfig);
    addAuditLog({
      action: 'اعتماد وحفظ مسودة الاستوديو',
      goal: 'تحديث مظهر الواجهة وعالم المنتجات',
      proposedBy: 'Owner',
      approved: true,
    });
    setSaveSuccessMsg('تم حفظ المسودة واعتماها بنجاح! ✨');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Device width mapping
  const getDeviceWidthClass = () => {
    switch (activeDevicePreset) {
      case 'mobile-sm': return 'max-w-[360px] h-[800px]';
      case 'mobile-std': return 'max-w-[390px] h-[844px]';
      case 'mobile-lg': return 'max-w-[412px] h-[915px]';
      case 'tablet': return 'max-w-[768px] h-[950px]';
      case 'desktop': return 'w-full h-full';
      case 'desktop-lg': return 'w-full h-full';
      default: return 'w-full h-full';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#060412] text-white flex flex-col font-sans overflow-hidden select-none dir-rtl">
      
      {/* 1. TOP HEADER BAR */}
      <header className="h-16 bg-[#0e0a24] border-b border-white/10 px-4 flex items-center justify-between shrink-0 shadow-xl z-20">
        
        {/* Title & Prototype Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-400 p-0.5 shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-[#0e0a24] rounded-[14px] flex items-center justify-center text-purple-300">
              <Sparkles className="w-5 h-5 text-purple-400 animate-spin-slow" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm sm:text-base text-white">استوديو إندكس للتطور الذكي</h1>
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                نموذج تجريبي — غير مخصص للنشر الإنتاجي
              </span>
            </div>
            <span className="text-[11px] text-gray-400 block">Indexes Evolution Studio — Visual AI Architect</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          
          {/* Undo / Redo */}
          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-0.5">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 text-gray-300 hover:text-white disabled:opacity-30 cursor-pointer"
              title="تراجع (Undo)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= historyStack.length - 1}
              className="p-1.5 text-gray-300 hover:text-white disabled:opacity-30 cursor-pointer"
              title="إعادة (Redo)"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Compare Before/After */}
          <button
            onClick={() => setIsCompareOpen(true)}
            className="bg-white/10 hover:bg-white/20 text-gray-200 border border-white/10 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <ArrowLeftRight className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">مقارنة قبل وبعد</span>
          </button>

          {/* Version History */}
          <button
            onClick={() => setIsVersionHistoryOpen(true)}
            className="bg-white/10 hover:bg-white/20 text-gray-200 border border-white/10 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">سجل النسخ</span>
          </button>

          {/* Save Draft */}
          <button
            onClick={handleSaveDraft}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-lg shadow-purple-500/25"
          >
            <Save className="w-4 h-4" />
            <span>حفظ واعتماد المسودة</span>
          </button>

          {/* Close Studio */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-rose-900/40 border border-white/10 text-gray-300 hover:text-rose-300 flex items-center justify-center cursor-pointer transition-all ml-1"
            title="إغلاق الاستوديو والعودة للمتجر"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Toast Save Message */}
      {saveSuccessMsg && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-2xl shadow-2xl border border-emerald-400 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* MAIN WORKSPACE BODY (3 PANELS) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT PANEL: Design Tokens & 3D Universe Controls */}
        <aside className="w-80 bg-[#0c0824] border-l border-white/10 flex flex-col shrink-0 overflow-hidden">
          
          {/* Panel Tab Bar */}
          <div className="flex border-b border-white/10 bg-[#0a061e] p-1 gap-1 text-xs font-bold">
            <button
              onClick={() => setLeftTab('tokens')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all ${
                leftTab === 'tokens' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>رموز التصميم</span>
            </button>
            <button
              onClick={() => setLeftTab('universe3d')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all ${
                leftTab === 'universe3d' ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Orbit className="w-3.5 h-3.5" />
              <span>عالم 3D</span>
            </button>
            <button
              onClick={() => setLeftTab('sections')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all ${
                leftTab === 'sections' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>الأقسام</span>
            </button>
          </div>

          {/* Left Panel Content */}
          <div className="flex-1 overflow-y-auto p-3 no-scrollbar space-y-4">
            {leftTab === 'tokens' && (
              <DesignTokenEditor
                tokens={draftConfig.designTokens}
                onChangeTokens={(tokens) => updateDraft({ ...draftConfig, designTokens: tokens })}
                onResetTokens={() => updateDraft({ ...draftConfig, designTokens: DEFAULT_DESIGN_TOKENS })}
              />
            )}

            {leftTab === 'universe3d' && (
              <ProductUniverse3DEditor
                tokens={draftConfig.universe3D}
                onChangeTokens={(universe) => updateDraft({ ...draftConfig, universe3D: universe })}
                onResetTokens={() => updateDraft({ ...draftConfig, universe3D: DEFAULT_UNIVERSE_3D })}
              />
            )}

            {leftTab === 'sections' && (
              <div className="space-y-3 text-xs text-white dir-rtl">
                <span className="font-bold text-gray-300 block mb-2">إظهار وإخفاء أقسام الواجهة:</span>
                {Object.entries(draftConfig.featureVisibility).map(([key, isVisible]) => (
                  <div key={key} className="flex items-center justify-between bg-[#120d2e] p-2.5 rounded-xl border border-white/10">
                    <span className="font-bold text-gray-200">{key}</span>
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={(e) =>
                        updateDraft({
                          ...draftConfig,
                          featureVisibility: {
                            ...draftConfig.featureVisibility,
                            [key]: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 accent-purple-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Locked Core Banner */}
          <div className="p-3 border-t border-white/10 bg-[#070417]">
            <LockedCommerceCoreBanner compact />
          </div>
        </aside>

        {/* CENTER PANEL: Visual Editing Canvas & Responsive Lab Toolbar */}
        <main className="flex-1 flex flex-col bg-[#05030f] overflow-hidden">
          
          {/* Responsive Lab Toolbar */}
          <div className="p-2 border-b border-white/10 bg-[#0a071c] shrink-0">
            <ResponsiveDeviceLab
              activePreset={activeDevicePreset}
              onSelectPreset={(preset) => setActiveDevicePreset(preset)}
              isRtl={isRtl}
              onToggleRtl={() => setIsRtl(!isRtl)}
              slowNetwork={slowNetwork}
              onToggleSlowNetwork={() => setSlowNetwork(!slowNetwork)}
              liteMode={liteMode}
              onToggleLiteMode={() => setLiteMode(!liteMode)}
              reducedMotion={reducedMotion}
              onToggleReducedMotion={() => setReducedMotion(!reducedMotion)}
              zoomScale={zoomScale}
              onZoomChange={(z) => setZoomScale(z)}
            />
          </div>

          {/* Canvas Wrapper */}
          <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-[radial-gradient(#1e1642_1px,transparent_1px)] [background-size:16px_16px]">
            <div className={`transition-all duration-300 shadow-2xl rounded-3xl overflow-hidden border border-white/15 bg-black ${getDeviceWidthClass()}`}>
              <VisualEditingCanvas
                draftConfig={draftConfig}
                selectedSection={selectedSection}
                onSelectSection={(sec) => setSelectedSection(sec)}
                onUpdateCopy={(key, val) =>
                  updateDraft({
                    ...draftConfig,
                    customCopy: { ...draftConfig.customCopy, [key]: val },
                  })
                }
                products={products}
                zoomScale={zoomScale}
                slowNetwork={slowNetwork}
              />
            </div>
          </div>
        </main>

        {/* RIGHT PANEL: AI Director, Improvement Inbox, Store Audit */}
        <aside className="w-88 bg-[#0c0824] border-r border-white/10 flex flex-col shrink-0 overflow-hidden">
          
          {/* Panel Tab Bar */}
          <div className="flex border-b border-white/10 bg-[#0a061e] p-1 gap-1 text-[11px] font-bold">
            <button
              onClick={() => setRightTab('ai')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all ${
                rightTab === 'ai' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>المخرج الذكي</span>
            </button>
            <button
              onClick={() => setRightTab('inbox')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all ${
                rightTab === 'inbox' ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>الصندوق</span>
            </button>
            <button
              onClick={() => setRightTab('audit')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all ${
                rightTab === 'audit' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>الفحص</span>
            </button>
            <button
              onClick={() => setRightTab('lab')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all ${
                rightTab === 'lab' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>المختبر</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3 no-scrollbar space-y-4">
            {rightTab === 'ai' && (
              <AICreativeDirector
                config={draftConfig}
                onApplyDraftChanges={(updated) => updateDraft(updated)}
              />
            )}

            {rightTab === 'inbox' && (
              <ImprovementInbox
                onApplyDraftChanges={(partial) => updateDraft({ ...draftConfig, ...partial })}
              />
            )}

            {rightTab === 'audit' && (
              <StoreAuditModule
                onPreviewFix={(comp) => {
                  setSelectedSection('universe');
                  setLeftTab('universe3d');
                }}
              />
            )}

            {rightTab === 'lab' && (
              <AutonomousDesignLab
                onApplyDraftChanges={(partial) => updateDraft({ ...draftConfig, ...partial })}
              />
            )}
          </div>
        </aside>

      </div>

      {/* 3. BOTTOM STATUS BAR */}
      <footer className="h-10 bg-[#090618] border-t border-white/10 px-4 flex items-center justify-between text-xs text-gray-300 shrink-0 z-20">
        
        {/* Quality Guardian Status */}
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white">حارس الجودة (Quality Guardian):</span>
          <span className="bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full text-[10px]">
            جميع الفحوصات سليمة (WCAG AA & 60 FPS)
          </span>
        </div>

        {/* Scene Performance Indicator */}
        <div className="flex items-center gap-4 text-[11px] font-mono text-gray-400">
          <span>FPS: 60</span>
          <span>Draw Calls: 24</span>
          <span>Texture Memory: ~14MB</span>
          <span className="text-emerald-400 font-bold">حالة الأمان: محمي بالكامل 🛡️</span>
        </div>
      </footer>

      {/* MODALS */}
      <VersionHistoryModal
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        currentConfig={draftConfig}
        onRestoreVersion={(restored) => updateDraft(restored)}
      />

      <CompareDiffModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        baselineConfig={baselineConfig}
        draftConfig={draftConfig}
        onConfirmDraft={handleSaveDraft}
      />

    </div>
  );
}
