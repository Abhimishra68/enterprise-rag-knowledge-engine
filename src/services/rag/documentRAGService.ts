import { GoogleGenAI } from '@google/genai';
import { SearchResult, PipelineStageInfo, TextChunk, ChatMessage } from '../../types/rag';
import { generateEmbedding } from './embeddings';
import { vectorStore } from './vectorStore';
import { trackNetworkPhase } from './networkTelemetry';
import { apiKeyPool } from './apiKeyPool';

export interface DocumentRAGResponse {
  answer: string;
  sources: SearchResult[];
  pipelineInfo: PipelineStageInfo;
}

/**
 * Determines whether a chunk belongs to a School Student Database record / dossier.
 */
export function isStudentChunk(chunk: TextChunk): boolean {
  if (chunk.docId && (chunk.docId.startsWith('doc_STU_') || chunk.docId.startsWith('doc_stu_'))) {
    return true;
  }
  if (chunk.docName && /student[_\s]dossier|student[_\s]record/i.test(chunk.docName)) {
    return true;
  }
  if (chunk.content && /STUDENT DOSSIER & ACADEMIC SUMMARY|ROLL NUMBER:\s*R-\d+|GUARDIAN & PARENT CONTACT/i.test(chunk.content)) {
    return true;
  }
  return false;
}

/**
 * Returns only chunks belonging to user-uploaded documents (strictly excluding school student dossiers).
 */
function getUploadedDocumentChunks(): TextChunk[] {
  return vectorStore.getAllChunks().filter(c => !isStudentChunk(c));
}

/**
 * Constructs grounded context prompt strictly from user-uploaded document chunks with Claude/ChatGPT formatting standards.
 */
function constructDocumentPrompt(query: string, results: SearchResult[], history?: ChatMessage[]): string {
  if (results.length === 0) {
    return `SYSTEM INSTRUCTION:
You are an intelligent Document Assistant. No matching context was found in the user's uploaded documents for query "${query}".
Politely state that the information was not found in the uploaded documents, and suggest what kind of documents the user could upload.`;
  }

  const contextBlocks = results
    .map((res, i) => `=== DOCUMENT EXCERPT ${i + 1} ===\nTitle: ${res.chunk.docName}\nPage: ${res.chunk.pageNumber}\nRelevance Score: ${(res.score * 100).toFixed(1)}%\nContent:\n${res.chunk.content}`)
    .join('\n\n');

  let historySnippet = '';
  if (history && history.length > 0) {
    historySnippet = `RECENT CONVERSATION HISTORY:\n${history.slice(-4).map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text.substring(0, 300)}`).join('\n')}\n\n`;
  }

  return `You are an elite, highly intelligent Knowledge Assistant specialized in document synthesis, reasoning, and search.
Your answers must match the clarity, analytical structure, and conversational flow of Claude 3.5 Sonnet and ChatGPT-4o.

GROUNDED DOCUMENT EVIDENCE:
==================================================
${contextBlocks}
==================================================

${historySnippet}USER QUESTION:
"${query}"

GENERATION GUIDELINES:
1. DIRECT INTENT ADDRESSING:
   - Provide a direct, articulate, and complete answer in the opening paragraph.
   - Tailor the structure to the question:
     * If asked for a summary: provide key high-level themes, followed by structured bullet points.
     * If asked to compare or contrast concepts: provide a nuanced breakdown and a clear Markdown table.
     * If asked for step-by-step guidance or definitions: present clean, numbered instructions or clear conceptual definitions.
2. STRICT CITATION & GROUNDING:
   - Rely strictly on facts, numbers, and statements from the GROUNDED DOCUMENT EVIDENCE above.
   - When citing key statements, cite the document name and page number gracefully (e.g. *[Source: ${results[0]?.chunk?.docName || 'document'}, Page ${results[0]?.chunk?.pageNumber || 1}]*).
   - If the uploaded documents do not contain the answer, explicitly state what is missing rather than fabricating details.
3. TONE & POLISH:
   - Professional, authoritative, and concise. Avoid repetitive conversational fluff.`;
}

/**
 * Synthesizes answer locally from uploaded document chunks when no API key is active.
 */
function fallbackDocumentSynthesizer(query: string, results: SearchResult[]): string {
  if (results.length === 0) {
    return "📄 **No relevant information found in your uploaded documents.**\n\nPlease try rephrasing your question or upload additional documents relevant to this topic.";
  }

  const topResult = results[0];
  const paragraphs = topResult.chunk.content
    .split(/\n{2,}|\r\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 20);

  const excerpt = paragraphs.slice(0, 3).join('\n\n');

  return `### 📄 Insights from **${topResult.chunk.docName}** (Page ${topResult.chunk.pageNumber})

${excerpt || topResult.chunk.content.trim()}

---
*Grounded from uploaded document with ${(topResult.score * 100).toFixed(1)}% match confidence.*`;
}

/**
 * MAIN HANDLER: Processes all custom user-uploaded document queries.
 * Completely independent from the Student / School Database.
 */
export async function handleDocumentRAGQuery(
  query: string,
  apiKey?: string,
  topK: number = 4,
  hybridAlpha: number = 0.7,
  history?: ChatMessage[]
): Promise<DocumentRAGResponse> {
  const pipelineStart = performance.now();
  const timestamp = Date.now();

  const uploadedChunks = getUploadedDocumentChunks();

  // 1. Guard: If no documents are uploaded, return clear guidance
  if (uploadedChunks.length === 0) {
    const noDocsAnswer = `📄 **No custom documents uploaded yet.**\n\nPlease upload a file (**PDF**, **TXT**, or **MD**) using the Document Manager in the left sidebar to start querying your personal documents.`;
    const pipelineInfo: PipelineStageInfo = {
      timestamp,
      query,
      extractedDocCount: 0,
      totalChunksInDB: 0,
      queryVectorDimension: 0,
      queryVectorSample: [],
      retrievedResults: [],
      constructedPrompt: '[NO_DOCUMENTS_UPLOADED]',
      rawLLMResponse: noDocsAnswer,
      engineUsed: 'Document RAG Engine (No Files Uploaded)',
      timings: {
        embedMs: 0,
        searchMs: 0,
        llmMs: 0,
        totalMs: Number((performance.now() - pipelineStart).toFixed(1))
      }
    };

    return {
      answer: noDocsAnswer,
      sources: [],
      pipelineInfo
    };
  }

  // 2. Generate Query Embedding
  const embedStart = performance.now();
  const queryVector = await generateEmbedding(query, apiKey);
  const embedTime = (performance.now() - embedStart).toFixed(1);

  trackNetworkPhase('phase1-query-embedding', {
    phase: 'Stage 3: Embedding Vector Generation',
    status: 'SUCCESS_200',
    queryText: query,
    vectorDimension: `${queryVector.length}D`,
    generationLatencyMs: Number(embedTime)
  });

  // 3. Search vector store over uploaded chunks only
  const searchStart = performance.now();
  const allResults = vectorStore.search(queryVector, query, topK * 2, hybridAlpha);
  // Filter out any student dossiers to preserve strict document isolation
  const docResults = allResults
    .filter(r => !isStudentChunk(r.chunk))
    .slice(0, topK);
  const searchTime = (performance.now() - searchStart).toFixed(1);

  trackNetworkPhase('phase2-vector-db-retrieval', {
    phase: 'Stage 5: Vector DB Search & Retrieval (Document Domain)',
    status: 'SUCCESS_200',
    query: query,
    totalDocumentChunks: uploadedChunks.length,
    chunksRetrievedCount: docResults.length,
    retrievedChunks: docResults.map((r, idx) => ({
      rank: idx + 1,
      docName: r.chunk.docName,
      pageNumber: r.chunk.pageNumber,
      score: `${(r.score * 100).toFixed(1)}%`
    })),
    searchLatencyMs: Number(searchTime)
  });

  // 4. Construct Grounded Prompt
  const promptContext = constructDocumentPrompt(query, docResults, history);

  trackNetworkPhase('phase3-gemini-prompt-payload', {
    phase: 'Stage 6: Grounded Document Prompt Construction',
    status: 'SUCCESS_200',
    targetModel: 'Gemini Multi-Model Cascade (3.5-flash-lite / flash-latest / 2.5-flash)',
    totalCharacters: promptContext.length
  });

  // 5. Generate Answer via Gemini API or Local Synthesizer
  let rawLLMResponse = '';
  let llmTime = '0.0';
  let engineUsed = 'Local Document Synthesizer';

  const candidateKey = (apiKey && apiKey.trim().length > 5) ? apiKey : apiKeyPool.getActiveKey();
  if (candidateKey && candidateKey.trim().length > 5 && docResults.length > 0) {
    try {
      const { text, modelUsed, keyUsed, failoverCount, latencyMs } = await apiKeyPool.generateContentWithCascade(
        { contents: promptContext },
        { preferredKey: candidateKey }
      );

      llmTime = String(latencyMs);
      rawLLMResponse = text;
      const maskedKey = apiKeyPool.maskKey(keyUsed);
      engineUsed = failoverCount > 0
        ? `Google ${modelUsed} (Auto-failover to ${maskedKey})`
        : `Google ${modelUsed} (${maskedKey})`;
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to local synthesizer:', err);
      rawLLMResponse = fallbackDocumentSynthesizer(query, docResults);
      engineUsed = `Gemini API Error (${err.message || 'Call failed'}) → Local Fallback`;
    }
  } else {
    rawLLMResponse = fallbackDocumentSynthesizer(query, docResults);
    engineUsed = 'Local Offline Document Synthesizer';
  }

  const totalTime = (performance.now() - pipelineStart).toFixed(1);

  trackNetworkPhase('phase4-gemini-api-response', {
    phase: 'Stage 7: Final Document Answer Generation',
    status: 'SUCCESS_200',
    engineUsed,
    rawResponseLength: rawLLMResponse.length,
    totalPipelineTimeMs: Number(totalTime),
    rawLLMAnswer: rawLLMResponse
  });

  const pipelineInfo: PipelineStageInfo = {
    timestamp,
    query,
    extractedDocCount: new Set(uploadedChunks.map(c => c.docId)).size,
    totalChunksInDB: uploadedChunks.length,
    queryVectorDimension: queryVector.length,
    queryVectorSample: queryVector.slice(0, 10),
    retrievedResults: docResults,
    constructedPrompt: promptContext,
    rawLLMResponse,
    engineUsed,
    timings: {
      embedMs: Number(embedTime),
      searchMs: Number(searchTime),
      llmMs: Number(llmTime),
      totalMs: Number(totalTime)
    }
  };

  return {
    answer: rawLLMResponse,
    sources: docResults,
    pipelineInfo
  };
}
