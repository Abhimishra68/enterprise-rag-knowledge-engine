import React, { useState } from 'react';
import { Layers, FileText, Scissors, Binary, Database, Search, MessageSquareQuote, CheckCircle, ArrowDown } from 'lucide-react';
import { PipelineStageInfo } from '../types/rag';

interface PipelineInspectorProps {
  pipelineInfo: PipelineStageInfo | null;
}

export const PipelineInspector: React.FC<PipelineInspectorProps> = ({ pipelineInfo }) => {
  const [activeStage, setActiveStage] = useState<number>(5);

  if (!pipelineInfo) {
    return (
      <div className="h-[calc(100vh-140px)] min-h-[500px] glass-panel rounded-2xl border border-slate-800 flex flex-col items-center justify-center p-8 text-center">
        <div className="p-4 rounded-3xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-4">
          <Layers className="w-10 h-10 animate-bounce" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">Interactive RAG Pipeline Inspector</h3>
        <p className="text-xs text-slate-400 max-w-md mt-2">
          Ask a question in the Chat tab first! Once you ask a question, this tab will visually unpack all 7 stages of your RAG pipeline in real time.
        </p>
      </div>
    );
  }

  const stages = [
    {
      num: 1,
      title: 'Stage 1 — Read & Extract',
      desc: 'Extract raw text page-by-page from PDFs/TXT documents.',
      icon: FileText,
      color: 'from-blue-600 to-indigo-600'
    },
    {
      num: 2,
      title: 'Stage 2 — Semantic Chunking',
      desc: 'Break documents into overlapping 400-char context chunks.',
      icon: Scissors,
      color: 'from-indigo-600 to-purple-600'
    },
    {
      num: 3,
      title: 'Stage 3 — Vector Embeddings',
      desc: 'Convert text chunks into dense floating-point vector arrays.',
      icon: Binary,
      color: 'from-purple-600 to-pink-600'
    },
    {
      num: 4,
      title: 'Stage 4 — Vector Database Store',
      desc: 'Index vectors in memory with metadata tags for quick retrieval.',
      icon: Database,
      color: 'from-pink-600 to-rose-600'
    },
    {
      num: 5,
      title: 'Stage 5 — Vector Similarity Search',
      desc: 'Convert query into vector and calculate Cosine Similarity scores.',
      icon: Search,
      color: 'from-amber-500 to-orange-600'
    },
    {
      num: 6,
      title: 'Stage 6 — Grounded Context Prompting',
      desc: 'Combine top retrieved chunks with system instruction prompt.',
      icon: MessageSquareQuote,
      color: 'from-emerald-500 to-teal-600'
    },
    {
      num: 7,
      title: 'Stage 7 — LLM Answer & Sources',
      desc: 'Generate final response with page number citations.',
      icon: CheckCircle,
      color: 'from-teal-600 to-cyan-600'
    }
  ];

  return (
    <div className="h-[calc(100vh-140px)] min-h-[500px] glass-panel rounded-2xl border border-slate-800 flex flex-col lg:flex-row overflow-hidden shadow-2xl">
      {/* Left Stage Selector Sidebar */}
      <div className="w-full lg:w-80 bg-slate-950/90 border-b lg:border-b-0 lg:border-r border-slate-800/80 p-4 overflow-y-auto space-y-2 shrink-0">
        <div className="pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>RAG Execution Pipeline</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            Query: <span className="font-mono text-slate-200">"{pipelineInfo.query}"</span>
          </p>
        </div>

        {stages.map((st) => {
          const Icon = st.icon;
          const isActive = activeStage === st.num;
          return (
            <button
              key={st.num}
              onClick={() => setActiveStage(st.num)}
              className={`w-full text-left p-3 rounded-xl transition-all border flex items-center justify-between ${
                isActive
                  ? 'bg-purple-900/30 border-purple-500/50 shadow-md shadow-purple-900/20'
                  : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${st.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                >
                  {st.num}
                </div>
                <div>
                  <p className={`text-xs font-semibold ${isActive ? 'text-purple-200' : 'text-slate-200'}`}>
                    {st.title.split('—')[1]}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[170px]">{st.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Inspection Canvas */}
      <div className="flex-1 p-6 overflow-y-auto bg-slate-900/50 space-y-6">
        {/* Real-time Execution Banner */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Engine:</span>
            <span className="font-semibold text-slate-200">{pipelineInfo.engineUsed || 'Google Gemini / Local'}</span>
          </div>
          {pipelineInfo.timings && (
            <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
              <span className="px-2 py-0.5 rounded bg-indigo-950/50 border border-indigo-800/50 text-indigo-300">
                Embed: {pipelineInfo.timings.embedMs}ms
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-950/50 border border-amber-800/50 text-amber-300">
                Search: {pipelineInfo.timings.searchMs}ms
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-950/50 border border-purple-800/50 text-purple-300">
                LLM: {pipelineInfo.timings.llmMs}ms
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 font-bold">
                Total: {pipelineInfo.timings.totalMs}ms
              </span>
            </div>
          )}
        </div>

        {/* Stage 1 Inspection */}
        {activeStage === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30">
              <h4 className="text-sm font-bold text-blue-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Stage 1 — Document Reading & Extraction
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Reads input files (PDF, Markdown, TXT) and parses page structure into structured objects.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block mb-1">Indexed Knowledge Documents</span>
                <span className="text-lg font-bold text-blue-400">{pipelineInfo.extractedDocCount} Docs</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block mb-1">Vector Storage Chunks</span>
                <span className="text-lg font-bold text-indigo-400">{pipelineInfo.totalChunksInDB} Chunks</span>
              </div>
            </div>
          </div>
        )}

        {/* Stage 2 Inspection */}
        {activeStage === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30">
              <h4 className="text-sm font-bold text-indigo-200 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-indigo-400" />
                Stage 2 — Text Chunking Strategy
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Splits long page text into sliding-window text chunks with overlap to maintain semantic continuity.
              </p>
            </div>
            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sample Extracted Chunks</h5>
              {pipelineInfo.retrievedResults.slice(0, 2).map((res, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                  <div className="flex justify-between text-[11px] text-indigo-400 font-mono mb-1.5">
                    <span>Chunk #{res.chunk.chunkIndex} ({res.chunk.content.length} chars)</span>
                    <span>{res.chunk.docName} | Page {res.chunk.pageNumber}</span>
                  </div>
                  <p className="text-slate-300 font-sans italic">"{res.chunk.content}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stage 3 Inspection */}
        {activeStage === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30">
              <h4 className="text-sm font-bold text-purple-200 flex items-center gap-2">
                <Binary className="w-4 h-4 text-purple-400" />
                Stage 3 — Vector Embeddings (Numeric Representation)
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Embeddings convert text into dense floating-point vector arrays representing semantic meaning in n-dimensional geometry.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-purple-500/30 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono text-purple-300">
                <span>Query Embedding for: "{pipelineInfo.query}"</span>
                <span className="px-2 py-0.5 rounded bg-purple-900/50 text-purple-200 border border-purple-700/50">
                  {pipelineInfo.queryVectorDimension || 64} Dimensions (Dense Vector)
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 font-mono text-xs text-emerald-400 border border-slate-800 break-all leading-relaxed">
                [{pipelineInfo.queryVectorSample.map(n => Number(n).toFixed(4)).join(', ')}, ...]
              </div>
              <p className="text-[11px] text-slate-400">
                Normalized L2 Unit Vector • Cosine distance captures contextual similarity invariant to text length.
              </p>
            </div>
          </div>
        )}

        {/* Stage 4 Inspection */}
        {activeStage === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-xl bg-pink-950/30 border border-pink-500/30">
              <h4 className="text-sm font-bold text-pink-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-pink-400" />
                Stage 4 — Vector Database Store
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Vectors and metadata are indexed in memory with instant sub-millisecond retrieval.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Vector Database Status:</span>
                <span className="font-mono text-emerald-400 font-bold">READY</span>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Total Stored Vectors:</span>
                <span className="font-mono text-pink-400 font-bold">{pipelineInfo.totalChunksInDB} Vector Embeddings</span>
              </div>
            </div>
          </div>
        )}

        {/* Stage 5 Inspection: Returned Chunks from Vector DB */}
        {activeStage === 5 && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-amber-200 flex items-center gap-2">
                  <Search className="w-4 h-4 text-amber-400" />
                  Stage 5 — Vector DB Retrieved Chunks ({pipelineInfo.retrievedResults.length} Chunks Returned)
                </h4>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Search Time: {pipelineInfo.timings?.searchMs ?? 0}ms
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Cosine Similarity between query vector and chunk vectors + BM25 keyword overlap scoring.
              </p>
            </div>

            <div className="space-y-3">
              {pipelineInfo.retrievedResults.map((res, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200">
                      Rank #{i + 1} — {res.chunk.docName} (Page {res.chunk.pageNumber})
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                        Semantic: {(res.semanticScore * 100).toFixed(1)}%
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">
                        Keyword: {(res.keywordScore * 100).toFixed(1)}%
                      </span>
                      <span className="px-2.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Combined: {(res.score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-400 h-full transition-all"
                      style={{ width: `${Math.min(100, res.score * 100)}%` }}
                    />
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {res.chunk.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stage 6 Inspection: What goes to Gemini API */}
        {activeStage === 6 && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-emerald-200 flex items-center gap-2">
                  <MessageSquareQuote className="w-4 h-4 text-emerald-400" />
                  Stage 6 — What Goes to Gemini API (Grounded Context Prompt)
                </h4>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {pipelineInfo.constructedPrompt.length} Characters (~{Math.round(pipelineInfo.constructedPrompt.length / 4)} Tokens)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Assembles the system instruction, formatting rules, retrieved chunks, and query into the exact payload sent to Gemini 2.5 Flash.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800 text-xs font-mono text-slate-400">
                <span>Exact Prompt Payload</span>
                <span>Includes {pipelineInfo.retrievedResults.length} Injected Context Sources</span>
              </div>
              <pre className="font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                {pipelineInfo.constructedPrompt}
              </pre>
            </div>
          </div>
        )}

        {/* Stage 7 Inspection: What Gemini API returned */}
        {activeStage === 7 && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-500/30">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-teal-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-400" />
                  Stage 7 — What Gemini API Response Returned
                </h4>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Latency: {pipelineInfo.timings?.llmMs ?? 0}ms
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Raw output received back from {pipelineInfo.engineUsed || 'LLM Engine'}.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs sm:text-sm text-slate-200 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-xs font-mono text-teal-400">
                <span>Raw Response Output ({pipelineInfo.rawLLMResponse.length} chars)</span>
                <span>{pipelineInfo.engineUsed}</span>
              </div>
              <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                {pipelineInfo.rawLLMResponse}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
