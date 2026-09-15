import React, { useState, useEffect } from 'react';
import { Cpu, FileText, Database, Settings, Layers, MessageSquare, Key, ShieldCheck, Sparkles, Server } from 'lucide-react';
import { AppSettings } from '../types/rag';
import { DatabaseStatus } from '../services/school/schoolDataRepository';
import { apiKeyPool, KeyStatus } from '../services/rag/apiKeyPool';

interface HeaderProps {
  docCount: number;
  chunkCount: number;
  activeTab: 'chat' | 'inspector';
  onTabChange: (tab: 'chat' | 'inspector') => void;
  onOpenSettings: () => void;
  onOpenDbModal: () => void;
  settings: AppSettings;
  studentCount?: number;
  dbStatus?: DatabaseStatus;
}

export const Header: React.FC<HeaderProps> = ({
  docCount,
  chunkCount,
  activeTab,
  onTabChange,
  onOpenSettings,
  onOpenDbModal,
  settings,
  studentCount = 100,
  dbStatus
}) => {
  const [keyStatuses, setKeyStatuses] = useState<KeyStatus[]>(apiKeyPool.getKeyStatuses());
  const [activeKey, setActiveKey] = useState<string>(apiKeyPool.getActiveKey());

  useEffect(() => {
    const unsub = apiKeyPool.subscribe((statuses, currentKey) => {
      setKeyStatuses(statuses);
      setActiveKey(currentKey);
    });
    return () => unsub();
  }, []);

  const isApiActive = (activeKey && activeKey.trim().length > 5) || settings.geminiApiKey.trim().length > 5;
  const isPostgresConnected = dbStatus?.connected ?? false;
  const activeKeyObj = keyStatuses.find(k => k.key === activeKey);
  const activeProvider = activeKeyObj?.provider || (activeKey?.startsWith('gsk_') ? 'groq' : 'gemini');
  const rateLimitedCount = keyStatuses.filter(k => k.status === 'rate_limited').length;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#080c14]/85 border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
              <Cpu className="w-5 h-5 text-white" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg text-slate-100 tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Enterprise RAG & Knowledge Hub
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  v2.5 Production
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="text-emerald-400 font-medium">Supabase PostgreSQL</span>
                <span className="text-slate-600">•</span>
                <span>Hybrid Vector Engine</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400/90 font-medium">Groq & Gemini Cascade</span>
              </p>
            </div>
          </div>
        </div>

        {/* Center: Sleek Segmented Navigation Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800/90 shadow-inner">
          <button
            onClick={() => onTabChange('chat')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat & Synthesis</span>
          </button>
          <button
            onClick={() => onTabChange('inspector')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'inspector'
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md shadow-purple-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="flex items-center gap-1.5">
              <span>Pipeline Inspector</span>
              <span className="px-1.5 py-0.2 text-[9px] rounded bg-purple-950/80 text-purple-200 border border-purple-400/30 font-mono">
                7-Stages
              </span>
            </span>
          </button>
        </div>

        {/* Right: Live Status Badges & Controls */}
        <div className="flex items-center space-x-2.5 w-full md:w-auto justify-end">
          {/* Live PostgreSQL Database Button */}
          <button
            onClick={onOpenDbModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border shadow-sm ${
              isPostgresConnected
                ? 'bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-300 border-emerald-500/30 hover:border-emerald-500/50'
                : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/30'
            }`}
            title="Manage Supabase PostgreSQL Connection & Student Records"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-slate-100">{studentCount}</span>
              <span className="text-slate-400 hidden lg:inline">Students</span>
            </span>
          </button>

          {/* Active LLM Engine / Key Pool Pill */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs transition-colors"
            title={`Active Engine: ${activeProvider.toUpperCase()} (${apiKeyPool.maskKey(activeKey)}). Key Pool Size: ${keyStatuses.length}. Click to configure.`}
          >
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                {activeProvider === 'groq' ? 'Groq' : 'Gemini'}
              </span>
              <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                {apiKeyPool.maskKey(activeKey).split('...')[0]}...
              </span>
            </div>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm"
            title="Configure Multi-Provider Keys, Vector Weights, & Hyperparameters"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
