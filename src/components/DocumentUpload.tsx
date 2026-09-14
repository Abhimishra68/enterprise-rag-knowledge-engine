import React, { useState } from 'react';
import { UploadCloud, FileText, Trash2, CheckCircle2, AlertCircle, FileCode, BookOpen, Eye, GraduationCap } from 'lucide-react';
import { ProcessedDocument, TextChunk } from '../types/rag';
import { parseFile } from '../services/rag/pdfExtractor';
import { chunkDocument } from '../services/rag/chunker';
import { generateEmbedding } from '../services/rag/embeddings';
import { vectorStore } from '../services/rag/vectorStore';

interface DocumentUploadProps {
  documents: ProcessedDocument[];
  onDocumentAdded: (doc: ProcessedDocument, chunks: TextChunk[]) => void;
  onDocumentDeleted: (docId: string) => void;
  onLoadSchoolDb: () => void;
  apiKey?: string;
  chunkSize: number;
  chunkOverlap: number;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  documents,
  onDocumentAdded,
  onDocumentDeleted,
  onLoadSchoolDb,
  apiKey,
  chunkSize,
  chunkOverlap
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<ProcessedDocument | null>(null);

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
      setTimeout(() => setStatusMessage(null), 3000);
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
    <div className="space-y-6">
      {/* Upload Box */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
        }`}
      >
        <input
          type="file"
          accept=".pdf,.txt,.md"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
            <UploadCloud className={`w-7 h-7 ${isProcessing ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-200 text-sm">
              Upload PDF or Study Notes
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Drag and drop your PDF, Markdown, or TXT file here or click to browse
            </p>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">PDF</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Markdown</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">TXT</span>
          </div>
        </div>
      </div>

      {/* Processing Status Banner */}
      {statusMessage && (
        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs flex items-center gap-2 animate-fade-in">
          {isProcessing ? (
            <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 50-Student School DB Loader */}
      <div className="p-4 rounded-2xl glass-card border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-teal-950/20">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-medium text-sm text-emerald-200">50-Student School Database</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Index 50 student dossiers (Classes LKG-12, 6 subject marks, attendance, parent contacts).
              </p>
            </div>
          </div>
          <button
            onClick={onLoadSchoolDb}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30 shrink-0"
          >
            Index 50 DB
          </button>
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            Knowledge Base ({documents.length})
          </h4>
          {documents.length > 0 && (
            <span className="text-[11px] text-slate-500">
              {vectorStore.getChunkCount()} Total Chunks Index
            </span>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-900/30 border border-slate-800/60 text-slate-500 text-xs">
            No documents uploaded yet. Upload a PDF or click "Load Samples" above!
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="p-2 rounded-lg bg-slate-800 text-indigo-400 group-hover:text-indigo-300">
                    {doc.type === 'pdf' ? <FileText className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
                  </div>
                  <div className="truncate">
                    <p className="font-medium text-xs text-slate-200 truncate">{doc.name}</p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{doc.totalPages} {doc.totalPages === 1 ? 'Page' : 'Pages'}</span>
                      <span>•</span>
                      <span>{doc.chunksCount || 0} Chunks</span>
                      <span>•</span>
                      <span className="text-slate-500">{doc.uploadTime}</span>
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
