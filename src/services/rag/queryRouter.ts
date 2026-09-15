import { SearchResult, PipelineStageInfo, ChatMessage } from '../../types/rag';
import { handleStudentDatabaseQuery, isStudentQuery } from '../school/studentQueryService';
import { handleDocumentRAGQuery } from './documentRAGService';
import { optimizeQueryWithGemini } from './promptOptimizer';

export type QueryDomain = 'auto' | 'student' | 'document';

export interface RoutedAnswerResponse {
  answer: string;
  sources: SearchResult[];
  pipelineInfo: PipelineStageInfo;
  domainUsed: 'student' | 'document';
  detectedIntent?: string;
  isStudentQuery?: boolean;
  optimizedQuery?: string;
  originalQuery?: string;
}

/**
 * Intelligent Query Router
 * Dispatches queries to either the PostgreSQL Student Database Engine
 * or the Uploaded Document RAG Engine based on the selected mode and detected intent.
 */
export async function routeAndAnswerQuery(
  rawQuery: string,
  domain: QueryDomain = 'auto',
  apiKey?: string,
  topK: number = 4,
  hybridAlpha: number = 0.7,
  history?: ChatMessage[]
): Promise<RoutedAnswerResponse> {
  // Step 0: Use Gemini to reformulate and optimize prompt into RAG-understandable format with history
  const optimization = await optimizeQueryWithGemini(rawQuery, apiKey, history);
  const query = optimization.optimizedQuery;

  let response: RoutedAnswerResponse;

  // 1. Explicit Student Domain
  if (domain === 'student') {
    const studentRes = await handleStudentDatabaseQuery(query, apiKey, rawQuery, history);
    response = {
      ...studentRes,
      domainUsed: 'student',
      detectedIntent: 'Explicit Student Database Mode'
    };
  } else if (domain === 'document') {
    // 2. Explicit Document Domain
    const docRes = await handleDocumentRAGQuery(query, apiKey, topK, hybridAlpha, history);
    response = {
      ...docRes,
      domainUsed: 'document',
      detectedIntent: 'Explicit Document Assistant Mode'
    };
  } else {
    // 3. Auto-Detect Mode: Route based on query semantics
    const isSchoolTopic = isStudentQuery(query) || isStudentQuery(rawQuery);

    if (isSchoolTopic) {
      const studentRes = await handleStudentDatabaseQuery(query, apiKey, rawQuery, history);
      response = {
        ...studentRes,
        domainUsed: 'student',
        detectedIntent: 'Auto-Routed to Student Database'
      };
    } else {
      const docRes = await handleDocumentRAGQuery(query, apiKey, topK, hybridAlpha, history);
      response = {
        ...docRes,
        domainUsed: 'document',
        detectedIntent: 'Auto-Routed to Document Assistant'
      };
    }
  }

  // Attach original and optimized query information to pipelineInfo
  if (response.pipelineInfo) {
    response.pipelineInfo.originalQuery = rawQuery;
    response.pipelineInfo.query = query;
  }
  response.originalQuery = rawQuery;
  response.optimizedQuery = query;

  return response;
}
