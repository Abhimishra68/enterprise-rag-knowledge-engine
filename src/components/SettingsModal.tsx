import React, { useState, useEffect } from 'react';
import {
  X, Key, Sliders, Sparkles, Check, Plus, Trash2,
  RefreshCw, CheckCircle2, AlertTriangle, RotateCcw, ShieldCheck
} from 'lucide-react';
import { AppSettings } from '../types/rag';
import { apiKeyPool, KeyStatus } from '../services/rag/apiKeyPool';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [keyStatuses, setKeyStatuses] = useState<KeyStatus[]>(apiKeyPool.getKeyStatuses());
  const [activeKey, setActiveKey] = useState<string>(apiKeyPool.getActiveKey());
  const [newKeyInput, setNewKeyInput] = useState('');
  const [newKeyError, setNewKeyError] = useState<string | null>(null);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [autoRotate, setAutoRotate] = useState<boolean>(settings.autoRotateKeys ?? true);

  const [chunkSize, setChunkSize] = useState(settings.chunkSize);
  const [chunkOverlap, setChunkOverlap] = useState(settings.chunkOverlap);
  const [topK, setTopK] = useState(settings.topK);
  const [hybridAlpha, setHybridAlpha] = useState(settings.hybridAlpha);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Subscribe to pool changes and cooldown ticks
  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = apiKeyPool.subscribe((statuses, currentActiveKey) => {
      setKeyStatuses(statuses);
      setActiveKey(currentActiveKey);
    });
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectActiveKey = (key: string) => {
    apiKeyPool.setActiveKey(key);
    setActiveKey(key);
  };

  const handleAddKey = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setNewKeyError(null);
    const clean = newKeyInput.trim();
    if (!clean) return;

    if (clean.length < 15) {
      setNewKeyError('Key appears too short. Please provide a valid Gemini API key.');
      return;
    }

    const added = apiKeyPool.addKey(clean);
    if (!added) {
      setNewKeyError('This API key is already in the pool.');
      return;
    }

    setNewKeyInput('');
    setTestResults(prev => ({
      ...prev,
      [clean]: { success: true, message: 'Added to key pool' }
    }));
  };

  const handleRemoveKey = (key: string) => {
    if (keyStatuses.length <= 1) return;
    apiKeyPool.removeKey(key);
  };

  const handleTestKey = async (key: string) => {
    setTestingKey(key);
    setTestResults(prev => ({ ...prev, [key]: { success: false, message: 'Testing connection...' } }));
    try {
      const res = await apiKeyPool.testKey(key);
      setTestResults(prev => ({
        ...prev,
        [key]: { success: res.success, message: res.message }
      }));
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [key]: { success: false, message: err?.message || 'Key validation failed' }
      }));
    } finally {
      setTestingKey(null);
    }
  };

  const handleResetDefaults = () => {
    apiKeyPool.resetToDefaultKeys();
    setTestResults({});
  };

  const handleSave = () => {
    const currentActive = apiKeyPool.getActiveKey();
    onSave({
      geminiApiKey: currentActive,
      geminiApiKeyPool: apiKeyPool.getKeys(),
      autoRotateKeys: autoRotate,
      chunkSize,
      chunkOverlap,
      topK,
      hybridAlpha
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col glass-panel rounded-2xl border border-indigo-500/20 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100 flex items-center gap-2">
                RAG System Configuration
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                  v2.0 Multi-Key
                </span>
              </h3>
              <p className="text-xs text-slate-400">Manage Gemini API Key Pool, Quota Failover, and Vector Hyperparameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-6 custom-scrollbar text-slate-200">
          {/* Section: API Key Pool & Failover */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/20 space-y-3.5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-slate-100">Gemini API Key Pool ({keyStatuses.length} Keys)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  Auto-Failover Active
                </span>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  title="Reset to default 4 provided keys"
                  className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                >
                  <RotateCcw className="w-3 h-3" />
                  Defaults
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              If any API key encounters a <span className="text-amber-400 font-mono">429 / Quota Exceeded</span> limit, the engine automatically switches to the next healthy key in the pool with zero downtime.
            </p>

            {/* Key List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {keyStatuses.map((k) => {
                const isActive = k.status === 'active';
                const isRateLimited = k.status === 'rate_limited';
                const testResult = testResults[k.key];
                const isTesting = testingKey === k.key;

                return (
                  <div
                    key={k.key}
                    onClick={() => !isRateLimited && handleSelectActiveKey(k.key)}
                    className={`flex flex-col p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm shadow-indigo-500/10'
                        : isRateLimited
                        ? 'bg-amber-950/20 border-amber-500/30 opacity-90'
                        : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Radio selection */}
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                            isActive
                              ? 'border-indigo-400 bg-indigo-600'
                              : isRateLimited
                              ? 'border-amber-600/50 bg-amber-950/30'
                              : 'border-slate-600 bg-slate-800'
                          }`}
                        >
                          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>

                        {/* Masked Key Display */}
                        <span className="font-mono text-xs text-slate-200 truncate">
                          {k.maskedKey}
                        </span>

                        {/* Provider Badge */}
                        {k.provider === 'groq' ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 tracking-wider">
                            GROQ
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wider">
                            GEMINI
                          </span>
                        )}

                        {/* Status Badge */}
                        {isActive && (
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                            ACTIVE
                          </span>
                        )}
                        {isRateLimited && (
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            QUOTA EXCEEDED ({k.cooldownSecondsRemaining}s cooldown)
                          </span>
                        )}
                        {!isActive && !isRateLimited && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-400">
                            STANDBY
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleTestKey(k.key)}
                          disabled={isTesting}
                          title="Test Gemini API connection"
                          className="px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 border border-slate-700"
                        >
                          {isTesting ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                          ) : (
                            <span>Test</span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveKey(k.key)}
                          disabled={keyStatuses.length <= 1}
                          title="Remove key from pool"
                          className={`p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors ${
                            keyStatuses.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Test Result or Failure Reason */}
                    {testResult && (
                      <div className={`mt-1.5 text-[11px] flex items-center gap-1 ${testResult.success ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {testResult.success ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        <span>{testResult.message}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add New Key Input */}
            <form onSubmit={handleAddKey} className="pt-2">
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newKeyInput}
                  onChange={(e) => setNewKeyInput(e.target.value)}
                  placeholder="Paste additional Gemini API key (e.g. Gemini 2.5 Flash key)"
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-950/80 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newKeyInput.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-all shadow-md shadow-indigo-600/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Key
                </button>
              </div>
              {newKeyError && (
                <p className="text-[11px] text-rose-400 mt-1">{newKeyError}</p>
              )}
            </form>
          </div>

          {/* Section: Stage 2 & 5 Tuning Parameters */}
          <div className="space-y-4 pt-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Retrieval & Chunking Hyperparameters
            </h4>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Chunk Size (characters)</span>
                <span className="font-mono text-indigo-400">{chunkSize} chars</span>
              </div>
              <input
                type="range"
                min="150"
                max="1000"
                step="50"
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Chunk Overlap</span>
                <span className="font-mono text-indigo-400">{chunkOverlap} chars</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="10"
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Top-K Retrieved Context Chunks</span>
                <span className="font-mono text-indigo-400">{topK} chunks</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Hybrid Search Weight (Vector vs Keyword)</span>
                <span className="font-mono text-indigo-400">
                  {Math.round(hybridAlpha * 100)}% Vector / {Math.round((1 - hybridAlpha) * 100)}% BM25
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={hybridAlpha}
                onChange={(e) => setHybridAlpha(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/60">
          <div className="text-xs text-slate-400">
            Active Key: <span className="font-mono text-indigo-300">{apiKeyPool.maskKey(activeKey)}</span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-lg shadow-indigo-600/30"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  Saved!
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
