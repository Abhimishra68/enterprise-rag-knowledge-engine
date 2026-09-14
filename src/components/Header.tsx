import React, { useState, useEffect } from 'react';
import { Cpu, FileText, Database, Settings, Layers, MessageSquare, RefreshCw, Key, ShieldCheck } from 'lucide-react';
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
  studentCount = 51,
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
  const activeIdx = keyStatuses.findIndex(k => k.key === activeKey);
  const rateLimitedCount = keyStatuses.filter(k => k.status === 'rate_limited').length;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Title Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-lg shadow-indigo-500/25">
            <Cpu className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-100 tracking-tight">
                My Knowledge Assistant
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                RAG Production v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span>Dynamic PostgreSQL Ecosystem & Personal Knowledge Engine</span>
            </p>
          </div>
        </div>

        {/* System Stats Pill */}
        <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-300">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono text-slate-100 font-semibold">{docCount}</span>
            <span className="text-slate-400">Docs</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center space-x-1.5 text-slate-300">
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-mono text-slate-100 font-semibold">{chunkCount}</span>
            <span className="text-slate-400">Vectors</span>
          </div>
          <span className="text-slate-700">|</span>
          <button
            type="button"
            onClick={onOpenSettings}
            title={
              isApiActive
                ? `Key Pool: ${keyStatuses.length} keys. Active: #${activeIdx + 1} (${apiKeyPool.maskKey(activeKey)}). Click to manage.`
                : 'Configure Gemini API Key Pool'
            }
            className="flex items-center space-x-1.5 hover:bg-slate-800/80 px-1.5 py-0.5 rounded transition-colors"
          >
            <span className={`w-2 h-2 rounded-full ${isApiActive ? 'bg-emerald-400' : 'bg-amber-400'} ${rateLimitedCount > 0 ? 'animate-pulse' : ''}`} />
            <span className="text-[11px] text-slate-300 flex items-center gap-1 font-medium">
              {isApiActive ? (
                <>
                  <Key className="w-3 h-3 text-indigo-400" />
                  <span>Pool #{activeIdx >= 0 ? activeIdx + 1 : 1}/{keyStatuses.length}</span>
                  {rateLimitedCount > 0 && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                      failover
                    </span>
                  )}
                </>
              ) : (
                'Local Synthesizer'
              )}
            </span>
          </button>
        </div>

        {/* Controls and Tab Switcher */}
        <div className="flex items-center space-x-3">
          <div className="bg-slate-900/90 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => onTabChange('chat')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat & Answers</span>
            </button>
            <button
              onClick={() => onTabChange('inspector')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'inspector'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="flex items-center gap-1">
                RAG Pipeline Inspector
                <span className="px-1.5 py-0.2 text-[9px] rounded bg-purple-400/20 text-purple-200 font-mono">
                  7-Stages
                </span>
              </span>
            </button>
          </div>

          {/* Live PostgreSQL Status / Sync Button */}
          <button
            onClick={onOpenDbModal}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all shadow-md shrink-0 border ${
              isPostgresConnected
                ? 'bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-transparent shadow-indigo-600/25'
            }`}
            title="Open PostgreSQL Sync & Database Management Center"
          >
            <Database className="w-4 h-4" />
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPostgresConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="hidden sm:inline">
                {isPostgresConnected ? `Postgres (${studentCount})` : `Postgres Sync (${studentCount})`}
              </span>
            </span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            title="Configure RAG Settings & Gemini API Key"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

