import React, { useState } from 'react';
import { UploadCloud, FileText, Trash2, CheckCircle2, FileCode, BookOpen, Eye, GraduationCap, Database, Sparkles, Plus, ExternalLink, RefreshCw } from 'lucide-react';
import { ProcessedDocument, TextChunk } from '../types/rag';
import { parseFile } from '../services/rag/pdfExtractor';
import { chunkDocument } from '../services/rag/chunker';
import { generateEmbedding } from '../services/rag/embeddings';
import { vectorStore } from '../services/rag/vectorStore';
import { schoolDataRepository } from '../services/school/schoolDataRepository';

interface DocumentUploadProps {
  documents: ProcessedDocument[];
  onDocumentAdded: (doc: ProcessedDocument, chunks: TextChunk[]) => void;
  onDocumentDeleted: (docId: string) => void;
  onLoadSchoolDb: () => void;
  onLoadSampleDocs?: () => void;
  onSelectPrompt?: (prompt: string) => void;
  apiKey?: string;
  chunkSize: number;
  chunkOverlap: number;
}

const QUICK_PROMPTS = [
  { label: 'Abhishek Mishra Profile', query: 'Can you give me a summary of Abhishek Mishra and his GPA?' },
  { label: 'Comparative Audit (Abhishek vs Navya)', query: 'Conduct a deep comparative academic audit between Abhishek Mishra (Class 12) and Navya Gupta (Class 8). Analyze STEM vs Humanities performance.' },
  { label: 'Top 5 School Rankers', query: 'Who are the top rankers across the school?' },
  { label: 'Attendance < 75% Notice', query: 'Evaluate all students in the database whose attendance is below 75% and draft an empathetic parent notification for the lowest student.' }
];

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  documents,
  onDocumentAdded,
  onDocumentDeleted,
  onLoadSchoolDb,
  onLoadSampleDocs,
  onSelectPrompt,
  apiKey,
  chunkSize,
  chunkOverlap
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<ProcessedDocument | null>(null);
  const studentCount = schoolDataRepository.getStudentCount() || 100;
  const isDbConnected = schoolDataRepository.isLiveConnected();

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setStatusMessage(`Parsing document: ${file.name}... (Stage 1)`);

    try {
      // Stage 1: Text extraction
      const parsedDoc = await parseFile(file);

      setStatusMessage(`Chunking text into semantic fragments... (Stage 2)`);
      // Stage 2: Chunking
      const chunks = chunkDocument(parsedDoc, chunkSize, chunkOverlap);

      setStatusMessage(`Generating vector embeddings... (Stage 3 & 4)`);
      // Stage 3 & 4: Embeddings & Vector store indexing
      for (const chunk of chunks) {
        chunk.vector = await generateEmbedding(chunk.content, apiKey);
      }

      parsedDoc.chunksCount = chunks.length;
      vectorStore.addChunks(chunks);
      onDocumentAdded(parsedDoc, chunks);

      setStatusMessage(`✓ Successfully indexed ${file.name} (${chunks.length} chunks)`);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      console.error('Error processing document:', err);
      setStatusMessage(`❌ Error parsing ${file.name}: ${err.message || 'Invalid format'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Live Supabase PostgreSQL Database Hub Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/25 border border-emerald-500/25 shadow-lg shadow-emerald-950/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm text-slate-100">Live PostgreSQL Database</h4>
                <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                <span className="font-semibold text-emerald-300">{studentCount} Students</span> • Classes LKG–12 • 600 Marks • Guardians
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">
            Supabase Cloud PostgreSQL 17
          </span>
          <button
            onClick={onLoadSchoolDb}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            Manage & Sync
          </button>
        </div>
      </div>

      {/* 2. Upload Document Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900/80'
        }`}
      >
        <input
          type="file"
          accept=".pdf,.txt,.md"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center space-y-2.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
            <UploadCloud className={`w-6 h-6 ${isProcessing ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-200 text-xs sm:text-sm">
              Upload PDF or Notes
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Drag & drop files to index into Vector Store
            </p>
          </div>

          <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">PDF</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Markdown</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">TXT</span>
          </div>
        </div>
      </div>

      {/* Processing Status Banner */}
      {statusMessage && (
        <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-500/30 text-indigo-200 text-xs flex items-center gap-2 animate-fade-in shadow-md">
          {isProcessing ? (
            <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="truncate">{statusMessage}</span>
        </div>
      )}

      {/* 3. Indexed Knowledge Base Document List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            Knowledge Base ({documents.length})
          </h4>
          {documents.length > 0 ? (
            <span className="text-[11px] font-mono text-indigo-300">
              {vectorStore.getChunkCount()} chunks
            </span>
          ) : onLoadSampleDocs && (
            <button
              onClick={onLoadSampleDocs}
              className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Load Sample Docs
            </button>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="p-4 text-center rounded-xl bg-slate-900/40 border border-slate-800/80 text-slate-400 text-xs space-y-2">
            <p>No documents uploaded yet.</p>
            {onLoadSampleDocs && (
              <button
                onClick={onLoadSampleDocs}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
              >
                Load Demo Docs
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <div className="p-1.5 rounded-lg bg-slate-800 text-indigo-400 group-hover:text-indigo-300">
                    {doc.type === 'pdf' ? <FileText className="w-3.5 h-3.5" /> : <FileCode className="w-3.5 h-3.5" />}
                  </div>
                  <div className="truncate">
                    <p className="font-medium text-xs text-slate-200 truncate">{doc.name}</p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                      <span>{doc.totalPages} {doc.totalPages === 1 ? 'Page' : 'Pages'}</span>
                      <span>•</span>
                      <span>{doc.chunksCount || 0} Chunks</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => setSelectedDocForPreview(doc)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                    title="Preview Extracted Content & Pages"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDocumentDeleted(doc.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Remove Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Quick Prompt Suggestions / Cheat Sheet */}
      {onSelectPrompt && (
        <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Try Quick Inquiries</span>
          </div>
          <div className="space-y-1.5">
            {QUICK_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPrompt(item.query)}
                className="w-full text-left p-2 rounded-xl bg-slate-950/50 hover:bg-indigo-950/30 border border-slate-800/80 hover:border-indigo-500/30 text-slate-300 hover:text-indigo-200 text-xs transition-all flex items-center justify-between group"
              >
                <span className="truncate font-medium">{item.label}</span>
                <span className="text-[10px] text-slate-500 group-hover:text-indigo-400 shrink-0 font-mono">Ask →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Document Content Modal */}
      {selectedDocForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[80vh] glass-panel rounded-2xl p-6 border border-slate-700 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">{selectedDocForPreview.name}</h3>
                <p className="text-xs text-slate-400">
                  {selectedDocForPreview.totalPages} Pages | {selectedDocForPreview.totalChars} Total Characters
                </p>
              </div>
              <button
                onClick={() => setSelectedDocForPreview(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
              {selectedDocForPreview.pages.map((p) => (
                <div key={p.pageNumber} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                      📄 Page {p.pageNumber}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{p.text.length} chars</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
