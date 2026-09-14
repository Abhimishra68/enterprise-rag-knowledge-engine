import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, BookOpen, Layers, ExternalLink, GraduationCap, FileText, Zap } from 'lucide-react';
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
  hasDocuments: boolean;
  activeDomain?: QueryDomain;
  onDomainChange?: (domain: QueryDomain) => void;
  studentCount?: number;
  docCount?: number;
}

const STUDENT_SUGGESTIONS = [
  "Who is Shrishti Kumari",
  "Who has highest marks in Mathematics?",
  "Who is overall school topper?",
  "Which students have attendance below 80%?",
  "Give me a detailed summary of Aarav Verma"
];

const DOCUMENT_SUGGESTIONS = [
  "Summarize the uploaded document",
  "What are the main takeaways from my notes?",
  "List the key definitions mentioned in the files",
  "Explain the core concept in simple terms"
];

const AUTO_SUGGESTIONS = [
  "Who is Shrishti Kumari",
  "Who has highest marks in SST?",
  "Summarize my uploaded notes",
  "Who is the school topper?"
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onSelectSource,
  onInspectPipeline,
  hasDocuments,
  activeDomain = 'auto',
  onDomainChange,
  studentCount = 51,
  docCount = 0
}) => {
  const [inputQuery, setInputQuery] = useState('');
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

  const handleSuggestedClick = (q: string) => {
    if (isLoading) return;
    onSendMessage(q, activeDomain);
  };

  const currentSuggestions =
    activeDomain === 'student'
      ? STUDENT_SUGGESTIONS
      : activeDomain === 'document'
      ? DOCUMENT_SUGGESTIONS
      : AUTO_SUGGESTIONS;

  const placeholderText =
    activeDomain === 'student'
      ? "Ask about students, marks, attendance, rankings (e.g. 'Who is Shrishti Kumari')..."
      : activeDomain === 'document'
      ? "Ask questions grounded in your uploaded documents (.pdf, .txt)..."
      : "Ask anything about students or uploaded documents (auto-routes)...";

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px] glass-panel rounded-2xl border border-slate-800/90 overflow-hidden shadow-2xl">
      {/* Domain Mode Switcher Header Bar */}
      <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs">
          {activeDomain === 'student' && (
            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
              <GraduationCap className="w-4 h-4" />
              <span>Student & PostgreSQL Database</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono">
                {studentCount} Students
              </span>
            </span>
          )}
          {activeDomain === 'document' && (
            <span className="flex items-center gap-1.5 font-medium text-purple-400">
              <FileText className="w-4 h-4" />
              <span>Uploaded Document Knowledge Base</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono">
                {docCount} Docs
              </span>
            </span>
          )}
          {activeDomain === 'auto' && (
            <span className="flex items-center gap-1.5 font-medium text-indigo-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Intelligent Query Router</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300">
                Auto-Detects Intent
              </span>
            </span>
          )}
        </div>

        {/* Domain Switcher Buttons */}
        {onDomainChange && (
          <div className="flex items-center p-0.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <button
              onClick={() => onDomainChange('auto')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                activeDomain === 'auto'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Automatically route queries to student database or documents"
            >
              <Zap className="w-3 h-3" />
              Auto
            </button>
            <button
              onClick={() => onDomainChange('student')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
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
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
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
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
            <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              {activeDomain === 'student' ? (
                <GraduationCap className="w-10 h-10 text-emerald-400" />
              ) : activeDomain === 'document' ? (
                <FileText className="w-10 h-10 text-purple-400" />
              ) : (
                <Bot className="w-10 h-10 animate-pulse-subtle" />
              )}
            </div>
            <div className="max-w-md">
              <h3 className="font-bold text-lg text-slate-100">
                {activeDomain === 'student'
                  ? 'Query School & Student Ecosystem'
                  : activeDomain === 'document'
                  ? 'Query Your Uploaded Documents'
                  : 'Personal Knowledge & Student Assistant'}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {activeDomain === 'student'
                  ? `Direct access to ${studentCount} student dossiers in PostgreSQL: search profiles, 6-subject marks, rankings, and attendance.`
                  : activeDomain === 'document'
                  ? hasDocuments
                    ? 'Your uploaded documents are indexed and ready. Ask any question to retrieve relevant chunks and citations.'
                    : 'Upload a PDF or TXT file on the left sidebar to start querying your personal documents.'
                  : 'Ask about any student record or your uploaded documents. Our query router automatically dispatches to the right engine.'}
              </p>
            </div>

            {/* Suggested Question Chips */}
            <div className="w-full max-w-lg pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Try Asking
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {currentSuggestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedClick(q)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 text-xs transition-all text-left"
                  >
                    "{q}"
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
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content Box */}
              <div className="space-y-3 max-w-[85%]">
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'glass-card bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="prose prose-invert max-w-none text-xs sm:text-sm">
                      {/* Domain Origin Badge & Gemini Optimization Badge */}
                      <div className="flex flex-wrap items-center gap-2 mb-3 pb-2 border-b border-slate-800/80 text-[11px] not-prose">
                        {msg.domainUsed === 'student' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                            <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                            PostgreSQL Student Record
                          </span>
                        ) : msg.domainUsed === 'document' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                            <FileText className="w-3.5 h-3.5 text-purple-400" />
                            Uploaded Document Knowledge Base
                          </span>
                        ) : null}

                        {msg.pipelineInfo?.originalQuery && msg.pipelineInfo.query && msg.pipelineInfo.originalQuery.trim().toLowerCase() !== msg.pipelineInfo.query.trim().toLowerCase() && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-normal" title={`Reformulated by Gemini for RAG from: "${msg.pipelineInfo.originalQuery}"`}>
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            RAG Formatted: &quot;{msg.pipelineInfo.query}&quot;
                          </span>
                        )}
                      </div>

                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-3 rounded-xl border border-slate-700/80 bg-slate-900/60 shadow-lg">
                              <table className="w-full text-left border-collapse text-xs sm:text-sm" {...props} />
                            </div>
                          ),
                          thead: ({ node, ...props }) => (
                            <thead className="bg-gradient-to-r from-indigo-950/90 via-purple-950/80 to-slate-900 border-b border-indigo-500/30 text-indigo-200 font-semibold tracking-wide uppercase text-[11px]" {...props} />
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
                          h3: ({ node, ...props }) => (
                            <h3 className="text-sm sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 mt-4 mb-2 flex items-center gap-1.5" {...props} />
                          ),
                          hr: ({ node, ...props }) => (
                            <hr className="my-3 border-slate-800" {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul className="list-disc list-inside space-y-1 my-2 text-slate-300" {...props} />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="leading-relaxed" {...props} />
                          ),
                          code: ({ node, inline, ...props }: any) => (
                            <code className="px-1.5 py-0.5 rounded bg-slate-800/90 text-indigo-300 font-mono text-[11px] border border-slate-700/50" {...props} />
                          )
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                      
                      {/* Render Visual Student Card only if verified student matches query */}
                      {(() => {
                        const matchedSource = msg.sources?.find(s => 
                          s.chunk.docName.includes('Student_Dossier') || 
                          s.chunk.docName.includes('Student_Record')
                        );
                        if (matchedSource) {
                          const nameMatch = matchedSource.chunk.docName.match(/Student_(?:Dossier|Record)_[^_]+_(.+)\.(?:txt|db)/);
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

                        // Also check if domainUsed === 'student' and query matches a student directly
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

                {/* Stage 7: Source Citations & Stage Inspector Trigger */}
                {msg.sender === 'assistant' && (
                  <div className="space-y-2.5">
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                            Retrieved Sources ({msg.sources.length})
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
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-xl">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl glass-card bg-slate-900/90 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
              <div className="flex space-x-1">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
              <span>Searching vectors & synthesizing grounded answer...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Box Bar */}
      <div className="p-3 lg:p-4 bg-slate-950/80 border-t border-slate-800/80">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={placeholderText}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-900/90 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 shrink-0"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
