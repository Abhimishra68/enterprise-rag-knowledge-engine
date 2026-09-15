import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  Layers,
  ExternalLink,
  GraduationCap,
  FileText,
  Zap,
  Copy,
  Check,
  RotateCcw,
  Clock,
  CheckCircle2,
  TrendingUp,
  Scale,
  FileCheck
} from 'lucide-react';
import { ChatMessage, SearchResult, PipelineStageInfo } from '../types/rag';
import { QueryDomain } from '../services/rag/queryRouter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StudentCard } from './StudentCard';
import { findStudentByNameOrRoll } from '../services/school/schoolRagAdapter';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (query: string, domain?: QueryDomain) => void;
  isLoading: boolean;
  onSelectSource: (source: SearchResult) => void;
  onInspectPipeline: (info: PipelineStageInfo) => void;
  onClearChat?: () => void;
  hasDocuments: boolean;
  activeDomain?: QueryDomain;
  onDomainChange?: (domain: QueryDomain) => void;
  studentCount?: number;
  docCount?: number;
}

interface PromptCard {
  icon: React.ReactNode;
  category: string;
  title: string;
  query: string;
  badge: string;
  badgeColor: string;
}

const FEATURED_PROMPTS: PromptCard[] = [
  {
    icon: <Scale className="w-4 h-4 text-purple-400" />,
    category: 'Comparative Audit',
    title: 'Abhishek Mishra (Cl. 12) vs Navya Gupta (Cl. 8)',
    query: 'Conduct a deep comparative academic audit between Abhishek Mishra (Class 12) and Navya Gupta (Class 8). Analyze how their attendance rates correlate with their performance across STEM vs. Humanities subjects, contrast their teacher evaluation feedback, and generate a customized 3-month mentoring roadmap for each.',
    badge: 'Complex Audit',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  },
  {
    icon: <GraduationCap className="w-4 h-4 text-emerald-400" />,
    category: 'Student Dossier',
    title: 'Abhishek Mishra Academic Profile & GPA',
    query: 'Can you give me a summary of Abhishek Mishra and his GPA?',
    badge: 'PostgreSQL Record',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  },
  {
    icon: <TrendingUp className="w-4 h-4 text-amber-400" />,
    category: 'Rankings & Analytics',
    title: 'Top School Rankers Across All Classes',
    query: 'Who are the top 5 rankers across the school with their subject marks and overall percentages?',
    badge: 'SQL Aggregation',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  },
  {
    icon: <FileCheck className="w-4 h-4 text-rose-400" />,
    category: 'Attendance & Alerts',
    title: 'Attendance < 75% & Parent Notice Draft',
    query: 'Evaluate all students whose attendance is below 75% and draft an empathetic parent notification for the lowest student.',
    badge: 'Parent Notice',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  }
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onSelectSource,
  onInspectPipeline,
  onClearChat,
  hasDocuments,
  activeDomain = 'auto',
  onDomainChange,
  studentCount = 100,
  docCount = 0
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isLoading) return;
    onSendMessage(inputQuery.trim(), activeDomain);
    setInputQuery('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCardClick = (query: string) => {
    if (isLoading) return;
    onSendMessage(query, activeDomain);
  };

  const placeholderText =
    activeDomain === 'student'
      ? "Ask about students, marks, rankings, attendance (e.g., 'Who is Abhishek Mishra?')..."
      : activeDomain === 'document'
      ? "Ask questions grounded in uploaded documents (.pdf, .txt, .md)..."
      : "Ask anything about 100 students or uploaded documents (auto-routes)...";

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[520px] glass-panel rounded-2xl border border-slate-800/90 overflow-hidden shadow-2xl">
      {/* Top Domain Mode & Navigation Switcher Bar */}
      <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Active Domain Indicator */}
        <div className="flex items-center space-x-2 text-xs">
          {activeDomain === 'student' && (
            <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <GraduationCap className="w-4 h-4" />
              <span>PostgreSQL School Database</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-mono">
                {studentCount} Students
              </span>
            </span>
          )}
          {activeDomain === 'document' && (
            <span className="flex items-center gap-1.5 font-semibold text-purple-400">
              <FileText className="w-4 h-4" />
              <span>Uploaded Document Knowledge Base</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25 font-mono">
                {docCount} Docs
              </span>
            </span>
          )}
          {activeDomain === 'auto' && (
            <span className="flex items-center gap-1.5 font-semibold text-indigo-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Intelligent Query Router</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                Auto-Dispatches
              </span>
            </span>
          )}
        </div>

        {/* Domain Switcher Buttons & Clear Action */}
        <div className="flex items-center gap-2">
          {onDomainChange && (
            <div className="flex items-center p-0.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <button
                onClick={() => onDomainChange('auto')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                  activeDomain === 'auto'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Automatically route queries to student database or documents"
              >
                <Zap className="w-3 h-3 text-amber-300" />
                Auto
              </button>
              <button
                onClick={() => onDomainChange('student')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                  activeDomain === 'student'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Query student database directly (PostgreSQL)"
              >
                <GraduationCap className="w-3 h-3" />
                Students
              </button>
              <button
                onClick={() => onDomainChange('document')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                  activeDomain === 'document'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Query uploaded documents directly"
              >
                <FileText className="w-3 h-3" />
                Documents
              </button>
            </div>
          )}

          {messages.length > 0 && onClearChat && (
            <button
              onClick={onClearChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700"
              title="Clear chat conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {messages.length === 0 ? (
          /* Empty State: Modern Prompt Directory */
          <div className="h-full flex flex-col items-center justify-center text-center p-2 sm:p-6 space-y-6 my-auto max-w-2xl mx-auto">
            <div className="space-y-2">
              <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 text-indigo-400 shadow-lg shadow-indigo-500/10">
                <Sparkles className="w-7 h-7 text-indigo-300" />
              </div>
              <h3 className="font-bold text-lg sm:text-xl text-slate-100 tracking-tight">
                Enterprise Knowledge & Student Intelligence
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                Connects 100 student dossiers from <span className="text-emerald-300 font-medium">PostgreSQL</span> with <span className="text-purple-300 font-medium">Hybrid Vector Search</span> and fast LLM synthesis.
              </p>
            </div>

            {/* Structured Prompt Recommendation Grid */}
            <div className="w-full space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Featured Inquiries & Comparative Audits
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                {FEATURED_PROMPTS.map((card, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCardClick(card.query)}
                    className="p-3.5 rounded-2xl bg-slate-900/60 hover:bg-indigo-950/30 border border-slate-800/90 hover:border-indigo-500/40 text-slate-200 transition-all group flex flex-col justify-between space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {card.icon}
                        <span className="text-[11px] font-semibold text-slate-400">{card.category}</span>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                        {card.badge}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-100 group-hover:text-indigo-200 line-clamp-2 leading-snug">
                      {card.title}
                    </p>
                    <span className="text-[10px] text-indigo-400 group-hover:text-indigo-300 font-mono self-end">
                      Run Query →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white shadow-md shadow-purple-600/30'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content Box */}
              <div className="space-y-3 max-w-[88%] w-full">
                <div
                  className={`p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-950/90 via-slate-900/95 to-purple-950/80 border border-indigo-500/35 text-slate-100 rounded-tr-none shadow-lg shadow-indigo-950/20'
                      : 'glass-card bg-slate-900/85 backdrop-blur-md border border-slate-800 text-slate-200 rounded-tl-none shadow-xl'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <p className="whitespace-pre-wrap leading-relaxed font-normal">{msg.text}</p>
                  ) : (
                    <div className="prose prose-invert max-w-none text-xs sm:text-sm">
                      {/* Top Action & Metadata Header Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-800/80 text-[11px] not-prose">
                        <div className="flex flex-wrap items-center gap-2">
                          {msg.domainUsed === 'student' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 font-medium">
                              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                              PostgreSQL Student Record
                            </span>
                          ) : msg.domainUsed === 'document' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/25 font-medium">
                              <FileText className="w-3.5 h-3.5 text-purple-400" />
                              Uploaded Document Knowledge Base
                            </span>
                          ) : null}

                          {msg.pipelineInfo?.originalQuery &&
                            msg.pipelineInfo.query &&
                            msg.pipelineInfo.originalQuery.trim().toLowerCase() !==
                              msg.pipelineInfo.query.trim().toLowerCase() && (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-normal"
                                title={`Reformulated by RAG Optimizer from: "${msg.pipelineInfo.originalQuery}"`}
                              >
                                <Sparkles className="w-3 h-3 text-indigo-400" />
                                RAG Formatted
                              </span>
                            )}
                        </div>

                        {/* Top Right Action Buttons: Copy & Timings */}
                        <div className="flex items-center gap-2 shrink-0">
                          {msg.pipelineInfo?.timings && (
                            <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-md bg-slate-950/60 border border-slate-800">
                              <Clock className="w-3 h-3 text-amber-400" />
                              {msg.pipelineInfo.timings.totalMs}ms
                            </span>
                          )}

                          <button
                            onClick={() => handleCopy(msg.id, msg.text)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 transition-colors"
                            title="Copy Answer to Clipboard"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-semibold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {msg.pipelineInfo && (
                            <button
                              onClick={() => onInspectPipeline(msg.pipelineInfo!)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-purple-400 hover:text-purple-300 bg-purple-950/30 hover:bg-purple-950/60 border border-purple-800/40 transition-colors"
                              title="Open 7-Stage Interactive Pipeline Inspector"
                            >
                              <Layers className="w-3 h-3" />
                              <span>Inspect</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Markdown Body */}
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-3 rounded-xl border border-slate-700/80 bg-slate-900/60 shadow-lg">
                              <table className="w-full text-left border-collapse text-xs sm:text-sm" {...props} />
                            </div>
                          ),
                          thead: ({ node, ...props }) => (
                            <thead
                              className="bg-gradient-to-r from-indigo-950/90 via-purple-950/80 to-slate-900 border-b border-indigo-500/30 text-indigo-200 font-semibold tracking-wide uppercase text-[11px]"
                              {...props}
                            />
                          ),
                          th: ({ node, ...props }) => (
                            <th className="px-3.5 py-2.5 text-slate-200 font-semibold border-b border-slate-700/60" {...props} />
                          ),
                          td: ({ node, ...props }) => (
                            <td className="px-3.5 py-2 text-slate-300 border-b border-slate-800/60 font-normal leading-relaxed hover:bg-slate-800/30 transition-colors" {...props} />
                          ),
                          tr: ({ node, ...props }) => (
                            <tr className="border-b border-slate-800/40 hover:bg-indigo-950/20 transition-colors" {...props} />
                          ),
                          p: ({ node, ...props }) => (
                            <p className="my-2 leading-relaxed text-slate-200" {...props} />
                          ),
                          h1: ({ node, ...props }) => (
                            <h1 className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 mt-4 mb-2 border-l-2 border-indigo-500 pl-2" {...props} />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2 className="text-sm sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 mt-4 mb-2 border-l-2 border-indigo-500 pl-2" {...props} />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3 className="text-xs sm:text-sm font-bold text-indigo-300 mt-3.5 mb-1.5 flex items-center gap-1.5" {...props} />
                          ),
                          hr: ({ node, ...props }) => (
                            <hr className="my-3 border-slate-800" {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul className="list-disc list-inside space-y-1.5 my-2 text-slate-300" {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol className="list-decimal list-inside space-y-1.5 my-2 text-slate-300" {...props} />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="leading-relaxed" {...props} />
                          ),
                          blockquote: ({ node, ...props }) => (
                            <blockquote className="border-l-4 border-indigo-500/80 bg-indigo-950/20 pl-3 py-1.5 rounded-r-lg my-2 text-slate-300 italic" {...props} />
                          ),
                          code: ({ node, inline, ...props }: any) => (
                            <code className="px-1.5 py-0.5 rounded bg-slate-800/90 text-indigo-300 font-mono text-[11px] border border-slate-700/50" {...props} />
                          )
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>

                      {/* Render Visual Student Card if student matches query */}
                      {(() => {
                        const matchedSource = msg.sources?.find(
                          (s) =>
                            s.chunk.docName.includes('Student_Dossier') ||
                            s.chunk.docName.includes('Student_Record')
                        );
                        if (matchedSource) {
                          const nameMatch = matchedSource.chunk.docName.match(
                            /Student_(?:Dossier|Record)_[^_]+_(.+)\.(?:txt|db)/
                          );
                          const name = nameMatch ? nameMatch[1].replace(/_/g, ' ') : '';
                          const queryLower = (msg.pipelineInfo?.query || '').toLowerCase();
                          const student = name ? findStudentByNameOrRoll(name) : undefined;
                          if (
                            student &&
                            (queryLower.includes(student.firstName.toLowerCase()) ||
                              queryLower.includes(student.lastName.toLowerCase()) ||
                              queryLower.includes(student.rollNumber.toLowerCase()))
                          ) {
                            return <StudentCard student={student} />;
                          }
                        }

                        if (msg.domainUsed === 'student' && msg.pipelineInfo?.query) {
                          const student = findStudentByNameOrRoll(msg.pipelineInfo.query);
                          if (student) {
                            return <StudentCard student={student} />;
                          }
                        }

                        return null;
                      })()}
                    </div>
                  )}
                </div>

                {/* Stage 7: Retrieved Sources Card */}
                {msg.sender === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        Grounded Sources ({msg.sources.length})
                      </span>
                      {msg.pipelineInfo && (
                        <button
                          onClick={() => onInspectPipeline(msg.pipelineInfo!)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300 hover:underline"
                        >
                          <Layers className="w-3 h-3" />
                          Inspect 7-Stage Pipeline
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.sources.map((src, idx) => (
                        <button
                          key={idx}
                          onClick={() => onSelectSource(src)}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/30 text-left transition-all group"
                        >
                          <div className="truncate pr-2">
                            <p className="font-medium text-[11px] text-indigo-300 truncate group-hover:text-indigo-200">
                              📄 {src.chunk.docName}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Page {src.chunk.pageNumber} • Match {(src.score * 100).toFixed(0)}%
                            </p>
                          </div>
                          <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading Animated State */}
        {isLoading && (
          <div className="flex gap-3 max-w-xl">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-md">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl glass-card bg-slate-900/90 border border-slate-800 text-slate-400 text-xs flex items-center gap-3">
              <div className="flex space-x-1.5">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
              <span>Searching vectors & synthesizing grounded answer...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Floating Bottom Input Bar */}
      <div className="p-3 lg:p-4 bg-slate-950/90 border-t border-slate-800/80">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={placeholderText}
              disabled={isLoading}
              className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-900/90 border border-slate-800 focus:border-indigo-500/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
            />
            {inputQuery && (
              <button
                type="button"
                onClick={() => setInputQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs px-1.5 py-0.5 rounded bg-slate-800/60"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-40 disabled:hover:from-indigo-600 disabled:hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 shrink-0"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
