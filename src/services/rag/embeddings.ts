import { GoogleGenAI } from '@google/genai';
import { apiKeyPool } from './apiKeyPool';

/**
 * Stage 3: Vector Embeddings
 * Converts text chunks into numeric dense vectors representing semantic content.
 */

const VECTOR_DIMENSION = 64; // Default local vector dimension for instant visualization

// Flag to avoid repeated 404 network errors if API key lacks embedding permissions
let remoteEmbeddingSupported: boolean | null = null;

export async function generateEmbedding(text: string, apiKey?: string): Promise<number[]> {
  console.group('%c📐 STAGE 3: EMBEDDING GENERATION', 'color: #f59e0b; font-weight: bold; font-size: 13px;');
  console.log('%cInput text (first 200 chars):', 'color: #94a3b8;', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
  console.log('%cText length:', 'color: #94a3b8;', text.length, 'chars');
  
  const candidateKey = (apiKey && apiKey.trim().length > 5) ? apiKey : apiKeyPool.getActiveKey();
  console.log('%cAPI key provided:', 'color: #94a3b8;', !!(candidateKey && candidateKey.trim().length > 5));

  if (candidateKey && candidateKey.trim().length > 5 && remoteEmbeddingSupported !== false) {
    const modelsToTry = ['text-embedding-004', 'embedding-001'];

    for (const modelName of modelsToTry) {
      try {
        console.log(`%c🔄 Trying Gemini embedding model: ${modelName}`, 'color: #60a5fa; font-weight: bold;');
        const startTime = performance.now();
        
        const { result: response } = await apiKeyPool.executeWithKeyRotation(async (keyToUse) => {
          const ai = new GoogleGenAI({ apiKey: keyToUse });
          return await ai.models.embedContent({
            model: modelName,
            contents: text
          });
        }, candidateKey);

        const elapsed = (performance.now() - startTime).toFixed(1);
        const res = response as any;
        console.log(`%c✅ API Response received in ${elapsed}ms`, 'color: #4ade80;');
        if (res.embedding?.values) {
          remoteEmbeddingSupported = true;
          console.log(`%c✅ Using res.embedding.values — Dimension: ${res.embedding.values.length}D`, 'color: #4ade80; font-weight: bold;');
          console.groupEnd();
          return res.embedding.values;
        } else if (res.embeddings?.[0]?.values) {
          remoteEmbeddingSupported = true;
          console.log(`%c✅ Using res.embeddings[0].values — Dimension: ${res.embeddings[0].values.length}D`, 'color: #4ade80; font-weight: bold;');
          console.groupEnd();
          return res.embeddings[0].values;
        }
      } catch (err: any) {
        console.warn(`%c⚠️ Embedding model ${modelName} not available for this key (will use fast local semantic vectorizer):`, 'color: #fbbf24;', err?.message || err);
        // If 404 or unsupported, disable remote embeddings to avoid spamming 404s
        if (err?.message?.includes('404') || err?.message?.includes('not found') || err?.status === 404) {
          remoteEmbeddingSupported = false;
        }
      }
    }
  }

  // Fallback / Fast In-Browser Normalized Semantic Vectorizer (64D)
  console.log('%c🧮 Using LOCAL semantic hash vectorizer (64D)', 'color: #a78bfa; font-weight: bold;');
  const localVec = createLocalSemanticVector(text, VECTOR_DIMENSION);
  console.log('%cLocal vector sample (first 8):', 'color: #94a3b8;', localVec.slice(0, 8));
  console.groupEnd();
  return localVec;
}

/**
 * Creates a deterministic 64-dimensional normalized semantic vector embedding
 * combining character n-gram hashing and word frequency position projection.
 */
export function createLocalSemanticVector(text: string, dim: number = VECTOR_DIMENSION): number[] {
  const vector = new Array(dim).fill(0);
  const cleanText = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const words = cleanText.split(/\s+/).filter(Boolean);

  if (words.length === 0) return vector;

  // 1. Word level semantic projection
  words.forEach((word, wordIdx) => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    
    // Distribute feature energy across dimension buckets using signed hash projections
    const primaryBucket = Math.abs(hash) % dim;
    const secondaryBucket = Math.abs(hash >> 3) % dim;
    const weight = 1.0 / Math.sqrt(wordIdx + 1); // Slight positional weighting

    vector[primaryBucket] += (hash % 2 === 0 ? 1 : -1) * weight;
    vector[secondaryBucket] += (hash % 4 >= 2 ? 0.7 : -0.7) * weight;
  });

  // 2. Character 3-gram feature projection
  for (let i = 0; i < cleanText.length - 2; i += 2) {
    const trigram = cleanText.substring(i, i + 3);
    let triHash = 0;
    for (let j = 0; j < trigram.length; j++) {
      triHash = (triHash << 3) - triHash + trigram.charCodeAt(j);
      triHash |= 0;
    }
    const bucket = Math.abs(triHash) % dim;
    vector[bucket] += 0.3 * (triHash % 2 === 0 ? 1 : -1);
  }

  // 3. Vector Normalization (Unit Length L2 Norm)
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;

  return vector.map(val => Number((val / magnitude).toFixed(4)));
}

/**
 * Calculates Cosine Similarity between two vector embeddings.
 * Cosine Similarity = (A · B) / (||A|| * ||B||)
 * Returns score between 0.0 (perpendicular/dissimilar) and 1.0 (identical)
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;

  // If dimensions differ (e.g. Gemini 768D vs Local 64D), use slice minimum
  const minDim = Math.min(vecA.length, vecB.length);

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < minDim; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  
  const score = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, score)); // Clamp [0, 1]
}
