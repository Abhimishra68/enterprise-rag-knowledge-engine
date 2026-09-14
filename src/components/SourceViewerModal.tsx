import React from 'react';
import { X, BookOpen, Layers, CheckCircle2, FileText } from 'lucide-react';
import { SearchResult } from '../types/rag';

interface SourceViewerModalProps {
  source: SearchResult | null;
  onClose: () => void;
}

export const SourceViewerModal: React.FC<SourceViewerModalProps> = ({
  source,
  onClose
}) => {
  if (!source) return null;

  const { chunk, score, semanticScore, keywordScore } = source;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl glass-panel rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">{chunk.docName}</h3>
              <p className="text-xs text-slate-400">
                Source Document Page {chunk.pageNumber} • Chunk #{chunk.chunkIndex + 1}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scores Bar */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Hybrid Match</p>
            <p className="text-sm font-bold font-mono text-indigo-400">{(score * 100).toFixed(1)}%</p>
          </div>
          <div className="border-x border-slate-800">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Vector Cosine</p>
            <p className="text-sm font-bold font-mono text-purple-400">{(semanticScore * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Keyword Overlap</p>
            <p className="text-sm font-bold font-mono text-emerald-400">{(keywordScore * 100).toFixed(1)}%</p>
          </div>
        </div>

        {/* Retained Chunk Content */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            Retrieved Text Chunk
          </h4>
          <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-xs leading-relaxed text-slate-200 font-sans shadow-inner">
            "{chunk.content}"
          </div>
        </div>

        {/* Keywords */}
        {chunk.keywords && chunk.keywords.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Extracted Key Terms:</span>
            <div className="flex flex-wrap gap-1.5">
              {chunk.keywords.map((kw, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                  #{kw}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
