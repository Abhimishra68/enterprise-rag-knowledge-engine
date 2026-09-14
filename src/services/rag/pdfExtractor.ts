import * as pdfjsLib from 'pdfjs-dist';
import { DocumentPage, ProcessedDocument } from '../../types/rag';

// Set up pdf.js worker URL
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Stage 1: Document Text Extraction
 * Extracts page-by-page text content from PDFs, TXT, and Markdown files.
 */
export async function parseFile(file: File): Promise<ProcessedDocument> {
  const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'pdf') {
    return await parsePDFFile(file, docId);
  } else {
    return await parseTextFile(file, docId, ext === 'md' ? 'markdown' : 'text');
  }
}

async function parsePDFFile(file: File, docId: string): Promise<ProcessedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pages: DocumentPage[] = [];
  let totalChars = 0;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Combine text items with space handling
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    pages.push({
      pageNumber: i,
      text: pageText || `[Page ${i} contains non-text or visual content]`
    });

    totalChars += pageText.length;
  }

  return {
    id: docId,
    name: file.name,
    type: 'pdf',
    uploadTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    totalPages: pdf.numPages,
    totalChars,
    pages
  };
}

async function parseTextFile(file: File, docId: string, type: 'text' | 'markdown'): Promise<ProcessedDocument> {
  const text = await file.text();
  
  // For text/md files, split into logical pseudo-pages per ~2500 chars or double linebreaks
  const pageChunks = text.split(/\n\s*\n\s*\n/).filter(p => p.trim().length > 0);
  
  let pages: DocumentPage[] = [];
  
  if (pageChunks.length <= 1) {
    // If short, put into 1 page or split by size
    const pageSize = 2000;
    let pageNum = 1;
    for (let i = 0; i < text.length; i += pageSize) {
      pages.push({
        pageNumber: pageNum++,
        text: text.substring(i, i + pageSize).trim()
      });
    }
  } else {
    pages = pageChunks.map((chunk, idx) => ({
      pageNumber: idx + 1,
      text: chunk.trim()
    }));
  }

  if (pages.length === 0) {
    pages = [{ pageNumber: 1, text: text.trim() }];
  }

  return {
    id: docId,
    name: file.name,
    type,
    uploadTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    totalPages: pages.length,
    totalChars: text.length,
    pages
  };
}
