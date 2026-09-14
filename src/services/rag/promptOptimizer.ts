import { GoogleGenAI } from '@google/genai';
import { schoolDataRepository } from '../school/schoolDataRepository';
import { apiKeyPool } from './apiKeyPool';

export interface PromptOptimizationResult {
  optimizedQuery: string;
  originalQuery: string;
  isOptimized: boolean;
  method: 'gemini' | 'local_heuristic' | 'pass_through';
}

const OPTIMIZER_SYSTEM_INSTRUCTION = `You are an AI Query Reformulator for an enterprise RAG and PostgreSQL School Database assistant.
Your task is to take a raw, ambiguous, colloquial, brief, or typo-prone user prompt and rewrite it into a clear, precise, and search-optimized query for the retrieval and database engines.

CURRENT APPLICATION CONTEXT:
1. School Database Domain (PostgreSQL):
   - Active enrolled students include: Shrishti kumari (Class 10), Aarav Verma (Class 10), Ananya Patel (Class 9), Mafiya Mundir (Class 9).
   - Subjects evaluated: Mathematics, Science, English, Social Studies (SST), Computer Science, Regional Language.
   - Database entities: Student profiles, Roll numbers, Subject marks, Grades, Attendance, Guardian contacts, Class-wise enrollment, Topper rankings.
2. Document Knowledge Base Domain:
   - Uploaded PDF/TXT study notes, user guides, policies, manuals.

REWRITE RULES:
1. Entity Resolution:
   - If user asks about a first name like "Shrishti", "Aarav", "Ananya", "Mafiya", expand to their full enrolled name (e.g. "Shrishti kumari", "Aarav Verma", "Ananya Patel", "Mafiya Mundir").
2. Query Clarification:
   - "who is Shrishti" -> "Who is Shrishti kumari? Provide student profile, academic marks, and attendance details."
   - "marks Shrishti" -> "What are the examination marks and scores of Shrishti kumari?"
   - "who contains more marks in LLB" -> "Who scored the highest marks in LLB?"
   - "who contains more marks in math" -> "Who scored the highest marks in Mathematics?"
   - "how many student in class 8" -> "How many students are enrolled in Class 8?"
   - "topper in sst" -> "Who is the top ranker with highest marks in Social Studies (SST)?"
   - "attendance Aarav" -> "What is the attendance record of Aarav Verma?"
   - "summarize notes" -> "Summarize the key information from the uploaded documents."
3. Strict Fidelity:
   - PRESERVE the user's intent. If user asks about an unregistered subject like "LLB" or "Law", do NOT substitute it with a valid subject; keep "LLB" so the database validator can inform the user.
4. Output Format:
   - Output ONLY the rewritten query text.
   - Do NOT add conversational preamble, quotes, bullet points, or explanations.
   - Keep it concise, natural, and directly searchable.
   - If the query is already well-formed and unambiguous, return it unchanged.`;

/**
 * Fast local heuristic fallback optimizer when Gemini API is unavailable or offline
 */
export function optimizeQueryLocally(rawQuery: string): string {
  const q = rawQuery.trim();
  if (!q) return rawQuery;

  // 1. Partial student name resolution (e.g. "who is Shrishti" -> "Who is Shrishti kumari")
  const enrolledStudents = schoolDataRepository.getStudents();
  let optimized = q;

  for (const s of enrolledStudents) {
    const firstNameLower = s.firstName.toLowerCase();
    const fullNameLower = s.fullName.toLowerCase();

    // Check if query contains first name but not the full name
    const hasFirstName = new RegExp(`\\b${firstNameLower}\\b`, 'i').test(optimized);
    const hasFullName = optimized.toLowerCase().includes(fullNameLower);

    if (hasFirstName && !hasFullName) {
      // Replace first name with full name
      optimized = optimized.replace(new RegExp(`\\b${firstNameLower}\\b`, 'gi'), s.fullName);
    }
  }

  // 2. Add clarifying intent for short "who is <Name>" queries
  const whoIsMatch = optimized.match(/^who\s+is\s+([a-zA-Z\s'.]+)$/i);
  if (whoIsMatch && whoIsMatch[1]) {
    const name = whoIsMatch[1].trim();
    if (!['the', 'a', 'topper', 'student'].includes(name.toLowerCase())) {
      optimized = `Who is ${name}? Provide student profile, academic marks, and attendance details.`;
    }
  }

  // 3. Clarify shorthand class count queries (e.g. "how many student in class 8")
  const classCountMatch = optimized.match(/^how\s+many\s+students?\s+in\s+(?:class|grade)?\s*(\d+)/i);
  if (classCountMatch && classCountMatch[1]) {
    optimized = `How many students are enrolled in Class ${classCountMatch[1]}?`;
  }

  return optimized;
}

/**
 * Optimizes and clarifies a user's raw prompt using Gemini 2.5 Flash before passing it to RAG.
 * Falls back to fast local heuristic normalization if API is unavailable or times out.
 */
export async function optimizeQueryWithGemini(
  rawQuery: string,
  apiKey?: string
): Promise<PromptOptimizationResult> {
  const trimmed = rawQuery.trim();
  if (!trimmed) {
    return {
      optimizedQuery: rawQuery,
      originalQuery: rawQuery,
      isOptimized: false,
      method: 'pass_through'
    };
  }

  // 1. If Gemini API key is provided, attempt Gemini Query Reformulation with automatic key rotation
  const candidateKey = (apiKey && apiKey.trim().length > 5) ? apiKey : apiKeyPool.getActiveKey();
  if (candidateKey && candidateKey.trim().length > 5) {
    try {
      const { result: text } = await apiKeyPool.executeWithKeyRotation(async (keyToUse) => {
        const ai = new GoogleGenAI({ apiKey: keyToUse });
        
        // Enforce 3.5-second timeout so query optimization never blocks user
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini prompt optimization timeout')), 3500)
        );

        const geminiCall = ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `${OPTIMIZER_SYSTEM_INSTRUCTION}\n\nUSER PROMPT TO OPTIMIZE: "${trimmed}"`
        });

        const response = await Promise.race([geminiCall, timeoutPromise]) as any;
        return response?.text?.trim()?.replace(/^["']|["']$/g, '') || '';
      }, candidateKey);

      if (text && text.length >= 3 && !text.toLowerCase().includes('i cannot') && !text.toLowerCase().includes('as an ai')) {
        return {
          optimizedQuery: text,
          originalQuery: rawQuery,
          isOptimized: text.toLowerCase() !== trimmed.toLowerCase(),
          method: 'gemini'
        };
      }
    } catch (err) {
      console.warn('[PromptOptimizer] Gemini optimization error/timeout, using local heuristic:', err);
    }
  }

  // 2. Fallback to local heuristic optimizer
  const localOptimized = optimizeQueryLocally(trimmed);
  return {
    optimizedQuery: localOptimized,
    originalQuery: rawQuery,
    isOptimized: localOptimized.toLowerCase() !== trimmed.toLowerCase(),
    method: localOptimized !== trimmed ? 'local_heuristic' : 'pass_through'
  };
}
