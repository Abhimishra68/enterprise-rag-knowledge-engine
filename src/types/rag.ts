export interface DocumentPage {
  pageNumber: number;
  text: string;
}

export interface ProcessedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'text' | 'markdown';
  uploadTime: string;
  totalPages: number;
  totalChars: number;
  pages: DocumentPage[];
  chunksCount?: number;
}

export interface TextChunk {
  id: string;
  docId: string;
  docName: string;
  pageNumber: number;
  chunkIndex: number;
  startChar: number;
  endChar: number;
  content: string;
  vector?: number[];
  keywords?: string[];
}

export interface SearchResult {
  chunk: TextChunk;
  score: number; // Combined hybrid score [0, 1]
  semanticScore: number;
  keywordScore: number;
}

export interface PipelineStageInfo {
  timestamp: number;
  query: string;
  originalQuery?: string;
  extractedDocCount: number;
  totalChunksInDB: number;
  queryVectorDimension?: number;
  queryVectorSample: number[];
  retrievedResults: SearchResult[];
  constructedPrompt: string;
  rawLLMResponse: string;
  engineUsed?: string;
  timings?: {
    embedMs: number;
    searchMs: number;
    llmMs: number;
    totalMs: number;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: SearchResult[];
  pipelineInfo?: PipelineStageInfo;
  domainUsed?: 'student' | 'document';
  optimizedQuery?: string;
}


export interface AppSettings {
  geminiApiKey: string;
  geminiApiKeyPool?: string[];
  autoRotateKeys?: boolean;
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  hybridAlpha: number; // 0 = keyword only, 1 = vector only, 0.7 = hybrid default
}

