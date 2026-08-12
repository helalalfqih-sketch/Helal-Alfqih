import React, { useState } from 'react';
import { 
  History, 
  RotateCcw, 
  Download, 
  Upload, 
  Plus, 
  Check, 
  Clock, 
  X, 
  Copy,
  Layers
} from 'lucide-react';
import { DraftVersion, DraftConfig } from '../../types/evolutionStudio';
import { listDraftVersions, saveDraftVersion } from '../../lib/evolutionStudioStore';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: DraftConfig;
  onRestoreVersion: (config: DraftConfig) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onRestoreVersion,
}) => {
  const [versions, setVersions] = useState<DraftVersion[]>(listDraftVersions());
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDesc, setNewVersionDesc] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  if (!isOpen) return null;

  const handleSaveSnapshot = () => {
    if (!newVersionName.trim()) return;
    const created = saveDraftVersion(newVersionName, newVersionDesc, currentConfig);
    setVersions(listDraftVersions());
    setNewVersionName('');
    setNewVersionDesc('');
    setShowSaveForm(false);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentConfig, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `indexes_evolution_draft_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md dir-rtl">
      <div className="bg-[#0e0a24] border border-white/15 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-white text-xs">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#130d2e]">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-bold text-sm text-white">سجل النسخ والاسترجاع (Version Timeline)</h3>
              <span className="text-[10px] text-gray-400">إدارة اللقطات المحفوظة للتصاميم والتكوينات التفاعلية</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 no-scrollbar">
          
          {/* Actions Bar */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setShowSaveForm(!showSaveForm)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>حفظ نسخة احتياطية جديدة</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="bg-white/10 hover:bg-white/20 text-gray-200 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all border border-white/10"
            >
              <Download className="w-4 h-4" />
              <span>تصدير ملف Config JSON</span>
            </button>
          </div>

          {/* New Snapshot Form */}
          {showSaveForm && (
            <div className="bg-[#171138] border border-purple-500/40 p-3 rounded-2xl space-y-2">
              <span className="font-bold text-purple-300 block text-xs">اسم النسخة الجديدة:</span>
              <input
                type="text"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                placeholder="مثال: نسخة العيد الكونية المعتمدة..."
                className="w-full bg-black/40 border border-white/15 rounded-xl p-2 text-white focus:outline-none"
              />
              <input
                type="text"
                value={newVersionDesc}
                onChange={(e) => setNewVersionDesc(e.target.value)}
                placeholder="وصف مختصر للتغييرات البصرية..."
                className="w-full bg-black/40 border border-white/15 rounded-xl p-2 text-white focus:outline-none text-[11px]"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowSaveForm(false)}
                  className="px-3 py-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveSnapshot}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1 rounded-lg cursor-pointer"
                >
                  حفظ النسخة
                </button>
              </div>
            </div>
          )}

          {/* Timeline Versions List */}
          <div className="space-y-2.5">
            {versions.map((ver) => (
              <div
                key={ver.versionId}
                className="bg-[#120d2d] border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-purple-500/40 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{ver.versionName}</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(ver.timestamp).toLocaleDateString('ar-YE')}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-300 mt-0.5">{ver.description}</p>
                </div>

                <button
                  onClick={() => {
                    onRestoreVersion(ver.config);
                    onClose();
                  }}
                  className="bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>استرجاع النسخة</span>
                </button>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
