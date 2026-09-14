import { TextChunk, SearchResult } from '../../types/rag';
import { calculateCosineSimilarity } from './embeddings';

/**
 * Stage 4: Vector Database Store
 * In-Memory Vector Storage & Indexing Engine.
 */
class VectorStore {
  private chunks: TextChunk[] = [];
  private readonly STORAGE_KEY = 'rag_vector_store_chunks_v1';

  constructor() {
    this.loadFromStorage();
  }

  public addChunks(newChunks: TextChunk[]): void {
    // Prevent duplicate chunk IDs
    const existingIds = new Set(this.chunks.map(c => c.id));
    const filteredNew = newChunks.filter(c => !existingIds.has(c.id));
    
    this.chunks = [...this.chunks, ...filteredNew];
    this.saveToStorage();
  }

  public removeDocumentChunks(docId: string): void {
    this.chunks = this.chunks.filter(c => c.docId !== docId);
    this.saveToStorage();
  }

  public clearAll(): void {
    this.chunks = [];
    this.saveToStorage();
  }

  public getAllChunks(): TextChunk[] {
    return this.chunks;
  }

  public getChunkCount(): number {
    return this.chunks.length;
  }

  /**
   * Stage 5: Vector Search & Hybrid Retrieval
   * Finds top-K matching chunks using cosine similarity + keyword overlap
   */
  public search(
    queryVector: number[],
    queryText: string,
    topK: number = 4,
    hybridAlpha: number = 0.7 // 0.7 vector score + 0.3 keyword score
  ): SearchResult[] {
    console.group('%c🗃️ STAGE 5: VECTOR DB SEARCH & RETRIEVAL', 'color: #10b981; font-weight: bold; font-size: 13px;');
    console.log('%cQuery:', 'color: #94a3b8; font-weight: bold;', queryText);
    console.log('%cQuery vector dimension:', 'color: #94a3b8;', queryVector.length + 'D');
    console.log('%cTotal chunks in DB:', 'color: #94a3b8;', this.chunks.length);
    console.log('%cTopK:', 'color: #94a3b8;', topK, '| Hybrid Alpha:', hybridAlpha);

    if (this.chunks.length === 0) {
      console.warn('%c⚠️ Vector store is EMPTY — no chunks to search', 'color: #fbbf24;');
      console.groupEnd();
      return [];
    }

const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of', 'with', 'as',
  'by', 'that', 'this', 'it', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do',
  'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'tell', 'me', 'about', 'who', 'what', 'where', 'when', 'why', 'how', 'give', 'show', 'find',
  'details', 'info', 'information', 'summary', 'please', 'know', 'record', 'records', 'student', 'students'
]);

    const rawWords = queryText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 1);

    const coreKeywords = rawWords.filter(w => !STOP_WORDS.has(w));
    const queryKeywords = coreKeywords.length > 0 ? coreKeywords : rawWords;

    console.log('%cExtracted core query keywords:', 'color: #94a3b8;', queryKeywords);

    const scoredResults: SearchResult[] = this.chunks.map(chunk => {
      // 1. Vector Cosine Similarity
      const semanticScore = chunk.vector
        ? calculateCosineSimilarity(queryVector, chunk.vector)
        : 0;

      // 2. Keyword BM25-style Overlap Score
      let keywordScore = 0;
      if (queryKeywords.length > 0) {
        let matchCount = 0;
        const chunkContentLower = chunk.content.toLowerCase();
        const chunkKeywordsLower = (chunk.keywords || []).map(k => k.toLowerCase());

        queryKeywords.forEach(kw => {
          if (chunkKeywordsLower.includes(kw)) matchCount += 1.0;
          if (chunkContentLower.includes(kw)) matchCount += 1.0;
        });
        keywordScore = Math.min(1, matchCount / (queryKeywords.length * 2));
      }

      // 3. Combined Hybrid Score with strict keyword requirement for specific queries
      let combinedScore = (semanticScore * hybridAlpha) + (keywordScore * (1 - hybridAlpha));

      // In production RAG: If core entity keywords exist (e.g. "Abhishek") but this chunk has ZERO match,
      // penalize the semantic drift score so random unrelated records don't rank high
      if (coreKeywords.length > 0 && keywordScore === 0) {
        combinedScore *= 0.35; // Heavy penalty for missing the specific target entity
      }

      return {
        chunk,
        score: Number(combinedScore.toFixed(4)),
        semanticScore: Number(semanticScore.toFixed(4)),
        keywordScore: Number(keywordScore.toFixed(4))
      };
    });

    // Sort descending by combined score
    scoredResults.sort((a, b) => b.score - a.score);

    // Apply confidence filter: Only return chunks that meet minimum relevance threshold
    // If top score is below 0.22, it's considered ungrounded noise
    const topResults = scoredResults.filter(r => r.score >= 0.20).slice(0, topK);

    // Log the top retrieved chunks
    console.group('%c🎯 Top ' + topK + ' Retrieved Chunks:', 'color: #60a5fa; font-weight: bold;');
    topResults.forEach((r, i) => {
      console.log(
        `%c#${i + 1}%c | Score: ${r.score} (Semantic: ${r.semanticScore}, Keyword: ${r.keywordScore}) | Doc: ${r.chunk.docName} | Page: ${r.chunk.pageNumber}`,
        'color: #f59e0b; font-weight: bold;',
        'color: #e2e8f0;'
      );
      console.log('%c   Content (first 150 chars):', 'color: #64748b;', r.chunk.content.substring(0, 150) + '...');
    });
    console.groupEnd();

    // Log score distribution summary
    if (topResults.length > 0) {
      console.log(
        '%cScore range: %c' + topResults[topResults.length - 1].score + ' → ' + topResults[0].score,
        'color: #94a3b8;',
        'color: #4ade80; font-weight: bold;'
      );
    }
    console.groupEnd();

    return topResults;
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.chunks));
    } catch (e) {
      console.warn('LocalStorage full or unavailable for vector store persistence', e);
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.chunks = JSON.parse(saved);
      }
    } catch (e) {
      this.chunks = [];
    }
  }
}

export const vectorStore = new VectorStore();
