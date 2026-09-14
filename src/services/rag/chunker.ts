import { ProcessedDocument, TextChunk } from '../../types/rag';

/**
 * Stage 2: Text Chunking
 * Splits document page text into smaller overlapping chunks suitable for semantic vector embeddings.
 */
export function chunkDocument(
  doc: ProcessedDocument,
  chunkSize: number = 400,
  chunkOverlap: number = 60
): TextChunk[] {
  const chunks: TextChunk[] = [];
  let globalChunkIndex = 0;

  for (const page of doc.pages) {
    const pageText = page.text;
    if (!pageText || pageText.trim().length === 0) continue;

    // Split text into semantic sentences or paragraphs first if possible
    const pageChunks = splitTextIntoChunks(pageText, chunkSize, chunkOverlap);

    pageChunks.forEach((chunkContent, idxOnPage) => {
      const chunkId = `${doc.id}_p${page.pageNumber}_c${idxOnPage}`;
      
      // Clean and normalize chunk text while preserving newlines
      const cleanContent = chunkContent.trim().replace(/[ \t]+/g, ' ');

      if (cleanContent.length > 10) { // Ignore tiny accidental whitespace chunks
        chunks.push({
          id: chunkId,
          docId: doc.id,
          docName: doc.name,
          pageNumber: page.pageNumber,
          chunkIndex: globalChunkIndex++,
          startChar: pageText.indexOf(chunkContent.substring(0, 20)),
          endChar: pageText.indexOf(chunkContent.substring(0, 20)) + chunkContent.length,
          content: cleanContent,
          keywords: extractKeywords(cleanContent)
        });
      }
    });
  }

  return chunks;
}

/**
 * Recursive character splitter with sliding window overlap
 */
function splitTextIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  
  if (text.length <= chunkSize) {
    return [text];
  }

  let start = 0;
  while (start < text.length) {
    let end = start + chunkSize;

    if (end >= text.length) {
      chunks.push(text.substring(start));
      break;
    }

    // Try to break at natural boundary (period, newline, question mark, exclamation, or space)
    const boundaryLookback = Math.min(80, chunkSize / 2);
    let boundary = -1;

    for (let i = end; i > end - boundaryLookback; i--) {
      const char = text[i];
      if (char === '.' || char === '\n' || char === '?' || char === '!') {
        boundary = i + 1;
        break;
      }
    }

    if (boundary === -1) {
      for (let i = end; i > end - boundaryLookback; i--) {
        if (text[i] === ' ') {
          boundary = i + 1;
          break;
        }
      }
    }

    const actualEnd = boundary !== -1 ? boundary : end;
    chunks.push(text.substring(start, actualEnd));

    start = actualEnd - overlap;
    if (start < 0) start = 0;
    // Prevent infinite loop if overlap >= chunk size
    if (start >= actualEnd) start = actualEnd;
  }

  return chunks;
}

/**
 * Basic keyword extraction for hybrid BM25/TF-IDF search
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'against', 'between',
    'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down',
    'of', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there',
    'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'it', 'its', 'this', 'that'
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}
