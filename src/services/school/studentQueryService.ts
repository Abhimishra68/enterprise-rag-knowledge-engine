import { StudentProfile } from '../../types/school';
import { SearchResult, PipelineStageInfo, ChatMessage } from '../../types/rag';
import { schoolDataRepository } from './schoolDataRepository';
import {
  detectAndExecuteSchoolAnalytics,
  AnalyticsResult,
  extractSubjectCandidate,
  formatSubjectNotFoundMarkdown,
  REGISTERED_CURRICULUM_SUBJECTS
} from './schoolAnalytics';
import { trackNetworkPhase } from '../rag/networkTelemetry';
import { GoogleGenAI } from '@google/genai';
import { apiKeyPool } from '../rag/apiKeyPool';

export interface StudentQueryResponse {
  answer: string;
  sources: SearchResult[];
  pipelineInfo: PipelineStageInfo;
  isStudentQuery: boolean;
  matchedStudent?: StudentProfile;
  analyticsResult?: AnalyticsResult;
}

/**
 * Detects if a query is explicitly targeting the Student / School Database domain.
 */
export function isStudentQuery(query: string): boolean {
  const q = query.toLowerCase().trim();

  // 1. Direct keywords for school / student domain
  const studentKeywords = [
    /\b(student|students|roll\s*(?:no|number)?|class\s*\d+|section\s*[abc])\b/i,
    /\b(marks|score|scores|attendance|grade|grades|percentage|topper|toppers|rank|ranker|rankers|leaderboard|curriculum|subject|subjects)\b/i,
    /\b(highest|lowest|scored|scoring|best\s+score|worst\s+score|more\s+marks|top\s+marks|max\s+marks|least\s+marks)\b/i,
    /\b(sst|maths?|mathematics|science|english|computer\s*science|regional\s*language)\b/i,
    /\b(school\s*database|student\s*list|all\s*students?|directory)\b/i,
    /\b(guardian|father\s*name|mother\s*name|parent\s*contact|teacher\s*comments)\b/i,
    /\b(stu_\d+|r-\d+)\b/i,
    /\bwho\s+(?:contains|has|have|got|scored)\b/i,
    /\b(?:who\s+is|tell\s+(?:me\s+)?about|profile\s+of|details\s+of|information\s+about|info\s+about|record\s+of)\b/i
  ];

  for (const pattern of studentKeywords) {
    if (pattern.test(q)) return true;
  }

  // 2. Check if any enrolled student's name appears in the query
  const liveStudents = schoolDataRepository.getStudents();
  for (const s of liveStudents) {
    if (q.includes(s.fullName.toLowerCase())) return true;
    if (s.firstName.length >= 3 && q.includes(s.firstName.toLowerCase())) return true;
    if (q.includes(s.rollNumber.toLowerCase())) return true;
    if (q.includes(s.studentId.toLowerCase())) return true;
  }

  // 3. Name-focused question patterns
  if (/\b(?:who\s+is|tell\s+(?:me\s+)?about|details\s+(?:of|for|about)|profile\s+(?:of|for)|about)\s+[a-zA-Z]/i.test(q)) {
    return true;
  }

  return false;
}

/**
 * Extracts multiple student entities from a query (e.g. for comparison queries)
 */
export function extractMultipleStudentEntities(query: string): StudentProfile[] {
  const cleanQ = query.toLowerCase();
  const students = schoolDataRepository.getStudents();
  const matched = new Set<StudentProfile>();

  for (const s of students) {
    const fullLower = s.fullName.toLowerCase();
    const firstLower = s.firstName.toLowerCase();
    const rollLower = s.rollNumber.toLowerCase();
    const idLower = s.studentId.toLowerCase();

    if (
      cleanQ.includes(fullLower) ||
      (firstLower.length >= 3 && new RegExp(`\\b${firstLower}\\b`, 'i').test(cleanQ)) ||
      new RegExp(`\\b${rollLower}\\b`, 'i').test(cleanQ) ||
      new RegExp(`\\b${idLower}\\b`, 'i').test(cleanQ)
    ) {
      matched.add(s);
    }
  }

  return Array.from(matched);
}

/**
 * Extracts single student entity name, roll number, or ID from query.
 */
export function extractStudentEntity(query: string): string | null {
  const cleanQ = query.trim().replace(/[?!.,]+$/, '').trim();

  // Guard against aggregate or meta queries
  if (/(how\s*many|total|count|all\s*student|list\s*student|every\s*student|show\s*all|database|directory|leaderboard|topper|highest|lowest)/i.test(cleanQ)) {
    return null;
  }

  // 1. Check if any enrolled student's full name or first name is in the query
  const liveStudents = schoolDataRepository.getStudents();
  const qLower = cleanQ.toLowerCase();
  for (const s of liveStudents) {
    if (qLower.includes(s.fullName.toLowerCase())) {
      return s.fullName;
    }
  }
  for (const s of liveStudents) {
    if (s.firstName.length >= 3 && new RegExp(`\\b${s.firstName}\\b`, 'i').test(cleanQ)) {
      return s.fullName;
    }
  }

  // 2. Direct ID or Roll number match (e.g. STU_1001 or R-101)
  const idMatch = cleanQ.match(/\b(STU_\d+|R-\d+)\b/i);
  if (idMatch) {
    return idMatch[1];
  }

  // 3. Robust Regex for "who is <name>", "tell me about <name>", "details of <name>", "profile of <name>"
  const entityMatch = cleanQ.match(/\b(?:who\s+is|tell\s+(?:me\s+)?about|details\s+(?:of|for|about)|profile\s+(?:of|for)|information\s+(?:about|of|on)|info\s+(?:about|of|on)|check\s+record\s+of|about)\s+([a-zA-Z\s'.]+?)(?:[?!,;]|\s+(?:in|from|at|class|section|marks|roll|attendance|provide|give|and|please|\.|$)|$)/i);
  if (entityMatch && entityMatch[1]) {
    const candidate = entityMatch[1].trim();
    const stopWords = new Set(['the', 'a', 'an', 'this', 'that', 'all', 'any', 'their', 'our', 'student', 'students', 'topper', 'highest', 'lowest', 'me', 'you', 'school']);
    if (candidate.length >= 2 && !stopWords.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  // 4. Standalone name (1-3 words)
  const words = cleanQ.split(/\s+/);
  if (words.length >= 1 && words.length <= 3 && !/(topper|highest|lowest|marks|grade|attendance|class|average|best|worst|who|what|where|how|why|list|show)/i.test(cleanQ)) {
    return cleanQ;
  }

  return null;
}

/**
 * Verifies if a student exists in the live database repository.
 */
export function verifyStudentInDatabase(targetName: string): {
  exists: boolean;
  matchedStudent?: StudentProfile;
  suggestions: string[];
} {
  const targetLower = targetName.toLowerCase().trim();
  const students = schoolDataRepository.getStudents();

  const matchedStudent = students.find(s => {
    const full = s.fullName.toLowerCase();
    const first = s.firstName.toLowerCase();
    const last = s.lastName.toLowerCase();
    const roll = s.rollNumber.toLowerCase();
    const id = s.studentId.toLowerCase();

    return (
      full === targetLower ||
      first === targetLower ||
      last === targetLower ||
      roll === targetLower ||
      id === targetLower ||
      full.includes(targetLower) ||
      targetLower.includes(full)
    );
  });

  if (matchedStudent) {
    return { exists: true, matchedStudent, suggestions: [] };
  }

  // Find fuzzy suggestions from live students
  const firstLetterMatches = students.filter(s =>
    s.firstName.toLowerCase().startsWith(targetLower.charAt(0))
  );
  const pool = firstLetterMatches.length >= 3 ? firstLetterMatches : students;
  const suggestions = pool.slice(0, 4).map(s => `${s.fullName} (${s.classGrade})`);

  return { exists: false, suggestions };
}

/**
 * Serializes a StudentProfile into structured factual context for LLM grounding.
 */
export function formatStudentAsFactualContext(s: StudentProfile): string {
  const marksList = s.subjectMarks
    .map(m => `  * ${m.subjectName}: ${m.marksObtained}/100 (Grade: ${m.grade})`)
    .join('\n');

  return `STUDENT INSTITUTIONAL RECORD:
- Full Name: ${s.fullName}
- Student ID: ${s.studentId} | Roll Number: ${s.rollNumber}
- Class & Section: ${s.classGrade} - Section ${s.section}
- Date of Birth: ${s.dob} | Gender: ${s.gender}
- Overall Academic Standing: ${s.overallPercentage}% (Overall Grade: ${s.overallGrade})
- Attendance Standing: ${s.attendance.percentage}% (${s.attendance.attendedSessions}/${s.attendance.totalSessions} sessions, Status: ${s.attendance.status})
- Academic Strengths: ${s.academicStrengths.join(', ')}
- Areas for Improvement: ${s.areasForImprovement.join(', ')}
- Extracurriculars: ${s.extracurriculars.join(', ')}
- Teacher Evaluation: "${s.teacherComments}"
- 6-Subject Examination Marks:
${marksList}
- Guardian Information (Confidential — only cite if user explicitly asks for parent/guardian contact details):
  * Father: ${s.guardian.fatherName}
  * Mother: ${s.guardian.motherName}
  * Primary Phone: ${s.guardian.contactNumber}
  * Emergency Phone: ${s.guardian.emergencyContact}
  * Email: ${s.guardian.email}
  * Address: ${s.guardian.address}`;
}

/**
 * Generates an intelligent, intent-tailored local fallback answer when offline or without an API key.
 */
export function generateLocalDynamicStudentAnswer(
  query: string,
  students: StudentProfile[],
  analytics?: AnalyticsResult | null
): string {
  const qLower = query.toLowerCase();

  // 1. If Analytics result is present
  if (analytics && analytics.isHandled) {
    return analytics.markdownResponse;
  }

  // 2. If multiple students are involved (Comparison)
  if (students.length >= 2) {
    const s1 = students[0];
    const s2 = students[1];

    const higherScoreStudent = s1.overallPercentage >= s2.overallPercentage ? s1 : s2;
    const lowerScoreStudent = s1.overallPercentage >= s2.overallPercentage ? s2 : s1;
    const diff = (higherScoreStudent.overallPercentage - lowerScoreStudent.overallPercentage).toFixed(1);

    const subjectRows = s1.subjectMarks.map(m1 => {
      const m2 = s2.subjectMarks.find(m => m.subjectName === m1.subjectName);
      const m2Score = m2 ? `${m2.marksObtained}/100` : 'N/A';
      return `| **${m1.subjectName}** | ${m1.marksObtained}/100 (${m1.grade}) | ${m2Score} (${m2?.grade || 'N/A'}) |`;
    }).join('\n');

    return `### ⚖️ Academic Comparison: ${s1.fullName} vs. ${s2.fullName}

**${higherScoreStudent.fullName}** leads the overall academic standing with **${higherScoreStudent.overallPercentage}%** (Grade ${higherScoreStudent.overallGrade}), performing **${diff}%** ahead of **${lowerScoreStudent.fullName}** (${lowerScoreStudent.overallPercentage}%, Grade ${lowerScoreStudent.overallGrade}).

#### 📊 Key Performance Breakdown:
| Metric | ${s1.fullName} (${s1.classGrade}) | ${s2.fullName} (${s2.classGrade}) |
| :--- | :--- | :--- |
| **Roll Number** | \`${s1.rollNumber}\` | \`${s2.rollNumber}\` |
| **Overall Score** | **${s1.overallPercentage}%** (Grade ${s1.overallGrade}) | **${s2.overallPercentage}%** (Grade ${s2.overallGrade}) |
| **Attendance Rate** | **${s1.attendance.percentage}%** (*${s1.attendance.status}*) | **${s2.attendance.percentage}%** (*${s2.attendance.status}*) |
| **Key Strengths** | ${s1.academicStrengths.slice(0, 2).join(', ')} | ${s2.academicStrengths.slice(0, 2).join(', ')} |

#### 📚 Subject-by-Subject Comparison:
| Subject | ${s1.fullName} | ${s2.fullName} |
| :--- | :--- | :--- |
${subjectRows}

> **Teacher Evaluation Summary**:
> - **${s1.fullName}**: "${s1.teacherComments}"
> - **${s2.fullName}**: "${s2.teacherComments}"

---
*Verified from PostgreSQL School Database.*`;
  }

  // 3. If single student is matched
  if (students.length === 1) {
    const s = students[0];

    // Case 3A: Asking about advice / improvement
    if (/(advice|improve|guidance|recommendation|tips|feedback|better|weak|focus)/i.test(qLower)) {
      const areasList = s.areasForImprovement.map(a => `- **Target Area**: ${a}`).join('\n');
      const strengthsList = s.academicStrengths.map(st => `- **Leverage Strength**: ${st}`).join('\n');

      return `### 💡 Academic Growth & Advice Plan for ${s.fullName}

Based on official teacher evaluations and performance metrics, here is the diagnostic analysis and recommendation plan for **${s.fullName}** (${s.classGrade} - Section ${s.section}):

#### 🎯 Key Focus Areas for Improvement:
${areasList}

#### 🌟 Existing Strengths to Build On:
${strengthsList}

#### 📋 Actionable Guidance:
1. **Targeted Practice**: Allocate dedicated study blocks to improve composition and targeted subjects where marks dipped below the overall average of **${s.overallPercentage}%**.
2. **Mentorship & Evaluation**: Teacher remark notes: *" ${s.teacherComments} "*. Regular check-ins with course instructors will help sustain strong momentum.
3. **Attendance & Consistency**: Current attendance is **${s.attendance.percentage}%** (${s.attendance.status}), which provides a ${s.attendance.percentage >= 90 ? 'fantastic, consistent foundation' : 'room for improvement to avoid falling behind'}.

---
*Generated from official academic records for Roll No: \`${s.rollNumber}\`.*`;
    }

    // Case 3B: Asking about specific subject (e.g. Math, Science)
    const subjectCandidate = extractSubjectCandidate(query);
    if (subjectCandidate && subjectCandidate.canonicalName) {
      const sub = s.subjectMarks.find(m => m.subjectName === subjectCandidate.canonicalName);
      if (sub) {
        return `### 📚 ${s.fullName} — ${sub.subjectName} Performance

**${s.fullName}** scored **${sub.marksObtained}/100** (Grade **${sub.grade}**) in **${sub.subjectName}**.

| Metric | Details |
| :--- | :--- |
| **Student** | **${s.fullName}** (${s.classGrade} - Section ${s.section}) |
| **Roll Number** | \`${s.rollNumber}\` |
| **Subject** | **${sub.subjectName}** |
| **Marks Obtained** | **${sub.marksObtained} / 100** |
| **Grade** | **${sub.grade}** |
| **Overall Academic Average** | **${s.overallPercentage}%** (Grade ${s.overallGrade}) |

> **Context**: In comparison to their overall average of **${s.overallPercentage}%**, this score demonstrates ${sub.marksObtained >= s.overallPercentage ? 'exceptional strength exceeding' : 'moderate performance slightly below'} their cumulative benchmark.

---
*Verified against active PostgreSQL records.*`;
      }
    }

    // Case 3C: Asking about attendance only
    if (/(attendance|present|presence|regular|absent|sessions)/i.test(qLower)) {
      return `### 📅 Attendance Record: ${s.fullName}

**${s.fullName}** has an attendance standing of **${s.attendance.percentage}%** (${s.attendance.attendedSessions} out of ${s.attendance.totalSessions} sessions attended), categorized as **${s.attendance.status}**.

| Metric | Standing |
| :--- | :--- |
| **Student** | **${s.fullName}** (\`${s.rollNumber}\`) |
| **Class & Section** | ${s.classGrade} - Section ${s.section} |
| **Attended Sessions** | **${s.attendance.attendedSessions}** / ${s.attendance.totalSessions} |
| **Attendance Rate** | **${s.attendance.percentage}%** |
| **Official Status** | **${s.attendance.status}** |

---
*Verified directly from PostgreSQL School Database.*`;
    }

    // Case 3D: Asking about contact / guardian details
    if (/(contact|guardian|father|mother|phone|address|email|parent)/i.test(qLower)) {
      return `### 👨‍👩‍👧 Guardian & Contact Details: ${s.fullName}

| Field | Information |
| :--- | :--- |
| **Student** | **${s.fullName}** (Roll No: \`${s.rollNumber}\`, ${s.classGrade}) |
| **Father Name** | ${s.guardian.fatherName} |
| **Mother Name** | ${s.guardian.motherName} |
| **Primary Contact** | \`${s.guardian.contactNumber}\` |
| **Emergency Contact** | \`${s.guardian.emergencyContact}\` |
| **Email** | \`${s.guardian.email}\` |
| **Residential Address** | ${s.guardian.address} |

---
*Verified from School Ecosystem Database records.*`;
    }

    // Case 3E: Full comprehensive profile
    const marksRows = s.subjectMarks
      .map(m => `| **${m.subjectName}** | **${m.marksObtained}/100** | ${m.grade} |`)
      .join('\n');

    return `### 📌 Executive Summary
**${s.fullName}** is enrolled in **${s.classGrade} - Section ${s.section}** (Roll No: \`${s.rollNumber}\`). Overall academic score is **${s.overallPercentage}%** (Grade: **${s.overallGrade}**) with an attendance standing of **${s.attendance.percentage}%** (${s.attendance.attendedSessions}/${s.attendance.totalSessions} sessions, Status: *${s.attendance.status}*).

> **Teacher Evaluation**: "${s.teacherComments}"

---

### 👤 Academic Overview & Attendance
| Attribute | Detail |
| :--- | :--- |
| **Student Name** | **${s.fullName}** |
| **Student ID / Roll No** | \`${s.studentId}\` / \`${s.rollNumber}\` |
| **Class & Section** | ${s.classGrade} - Section ${s.section} |
| **Overall Score** | **${s.overallPercentage}%** (Grade ${s.overallGrade}) |
| **Attendance** | **${s.attendance.percentage}%** (${s.attendance.attendedSessions}/${s.attendance.totalSessions} sessions — *${s.attendance.status}*) |
| **Key Strengths** | ${s.academicStrengths.join(', ')} |

---

### 📚 6-Subject Examination Marks
| Subject | Score | Grade |
| :--- | :--- | :--- |
${marksRows}

---
*Verified from School Ecosystem Database (${s.studentId}).*`;
  }

  // 4. Default directory listing
  const allStudents = schoolDataRepository.getStudents();
  const rows = allStudents.map((s, idx) =>
    `| ${idx + 1} | **${s.fullName}** | ${s.classGrade} - ${s.section} | \`${s.rollNumber}\` | **${s.overallPercentage}%** | ${s.overallGrade} | ${s.attendance.percentage}% |`
  ).join('\n');

  return `### 🏫 Enrolled Student Directory (${allStudents.length} Students)

| # | Student Name | Class & Sec | Roll No | Overall % | Grade | Attendance |
| :-: | :--- | :--- | :--- | :--- | :---: | :--- |
${rows}

---
*Active records queried directly from the School Ecosystem Database.*`;
}

/**
 * MAIN HANDLER: Processes all Student & School Database queries dynamically.
 * Uses Google Gemini 2.5 Flash as the generative brain grounded in verified PostgreSQL facts.
 */
export async function handleStudentDatabaseQuery(
  query: string,
  apiKey?: string,
  rawQuery?: string,
  history?: ChatMessage[]
): Promise<StudentQueryResponse> {
  const startTime = performance.now();
  const timestamp = Date.now();
  const allStudents = schoolDataRepository.getStudents();
  const totalCount = allStudents.length;
  // 1. Extract mentioned students (single or multiple for comparison)
  const matchedStudents = extractMultipleStudentEntities(query);
  const targetEntity = extractStudentEntity(query) || (rawQuery ? extractStudentEntity(rawQuery) : null);

  // 2. Check for unregistered curriculum subject requests (e.g. "LLB", "Law")
  // Only check if no enrolled student is the subject of the inquiry
  const subjectCheck = extractSubjectCandidate(query);
  if (subjectCheck && !subjectCheck.isRegistered && matchedStudents.length === 0) {
    const notFoundAnswer = formatSubjectNotFoundMarkdown(subjectCheck.rawName);
    return {
      answer: notFoundAnswer,
      sources: [],
      pipelineInfo: {
        timestamp,
        query,
        extractedDocCount: totalCount,
        totalChunksInDB: totalCount,
        queryVectorDimension: 0,
        queryVectorSample: [],
        retrievedResults: [],
        constructedPrompt: `[UNREGISTERED_SUBJECT] "${subjectCheck.rawName}" not in curriculum.`,
        rawLLMResponse: notFoundAnswer,
        engineUsed: 'Curriculum Registry Validator',
        timings: {
          embedMs: 0,
          searchMs: 1,
          llmMs: 0,
          totalMs: Number((performance.now() - startTime).toFixed(1))
        }
      },
      isStudentQuery: true
    };
  }

  // Check if a specific entity name was queried but NOT found anywhere in the roster
  let absentEntityWarning: string | null = null;
  if (targetEntity && matchedStudents.length === 0) {
    const verification = verifyStudentInDatabase(targetEntity);
    if (!verification.exists) {
      absentEntityWarning = targetEntity;
    }
  }

  // 3. Check for comparative analytics / ranking intent
  const analyticsResult = detectAndExecuteSchoolAnalytics(query);

  // 4. Build Structured Grounding Facts for LLM
  let contextBlocks: string[] = [];

  if (absentEntityWarning) {
    const enrolledNames = allStudents.map(s => `${s.fullName} (${s.classGrade})`).join(', ');
    contextBlocks.push(`VERIFIED DATABASE FACT:
The requested person or student "${absentEntityWarning}" is NOT enrolled in this school database.
Currently enrolled active students are: ${enrolledNames || 'None'}.
CRITICAL INSTRUCTION: Clearly and politely inform the user that "${absentEntityWarning}" is not enrolled in the school database. Provide the list of enrolled students they can ask about.`);
  } else if (matchedStudents.length > 0) {
    for (const student of matchedStudents) {
      contextBlocks.push(formatStudentAsFactualContext(student));
    }
  } else if (analyticsResult && analyticsResult.isHandled) {
    contextBlocks.push(`VERIFIED SCHOOL ANALYTICS DATA:
Metric / Category: ${analyticsResult.title}
Executive Summary: ${analyticsResult.executiveSummary}
Leaderboard Standings:
${analyticsResult.leaderboard.map(l => `  * Rank ${l.rank}: ${l.name} (${l.classGrade}) - Metric: ${l.metricValue} (Grade: ${l.grade || 'N/A'})`).join('\n')}`);
  } else {
    // General database cohort context
    const studentSummaries = allStudents.map(s =>
      `- ${s.fullName} (${s.classGrade} - Sec ${s.section}, Roll: ${s.rollNumber}): Overall ${s.overallPercentage}% (Grade ${s.overallGrade}), Attendance ${s.attendance.percentage}% (${s.attendance.status}), Strengths: ${s.academicStrengths.slice(0, 2).join(', ')}`
    ).join('\n');

    contextBlocks.push(`CURRENT ENROLLED SCHOOL COHORT (${totalCount} Total Students):
${studentSummaries || 'No student records currently in database.'}`);
  }

  // Also include general curriculum knowledge
  const curriculumSummary = REGISTERED_CURRICULUM_SUBJECTS.map(s => `${s.name} (${s.code})`).join(', ');
  contextBlocks.push(`OFFICIAL CURRICULUM SUBJECTS (6): ${curriculumSummary}`);

  // 5. Construct Claude / ChatGPT-Grade Dynamic System Prompt
  let historyContext = '';
  if (history && history.length > 0) {
    historyContext = history.slice(-4)
      .map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text.substring(0, 300)}`)
      .join('\n');
  }

  const promptPayload = `You are an elite, highly intelligent, and articulate Academic AI Assistant for a PostgreSQL School Ecosystem.
Your answers must match the analytical depth, conversational fluency, precision, and conciseness of Claude 3.5 Sonnet and ChatGPT-4o.

GROUNDED EVIDENCE FROM DATABASE:
==================================================
${contextBlocks.join('\n\n==================================================\n\n')}
==================================================

${historyContext ? `RECENT CONVERSATION HISTORY:\n${historyContext}\n\n` : ''}
USER QUESTION:
"${query}"

GENERATION INSTRUCTIONS:
1. INTENT-TAILORED DIRECT ANSWER:
   - Address the user's specific question directly, conversationally, and insightfully in the first sentence.
   - If the user asks about a specific subject (e.g. "How is she doing in Math?"), focus on that subject, compare it to her overall grade, and DO NOT dump unrelated guardian phone numbers, residential addresses, or DOBs.
   - If the user asks for advice or recommendations (e.g. "What advice would you give Aarav?"), synthesize their "Areas for Improvement", teacher comments, and academic strengths to deliver actionable, tailored, empathetic advice.
   - If comparing two or more students (e.g. "Compare Shrishti and Aarav"), provide a nuanced comparative breakdown with insights, relative strengths, and a clean side-by-side Markdown comparison table.
   - If asking for a general profile or summary, provide a crisp executive summary, followed by structured key tables.
   - If asking about attendance, focus on attendance statistics, regularity status, and impact.
   - If asking for toppers or rankings, present the leaderboard with context and commentary.
2. STRICT GROUNDING & ANTI-HALLUCINATION:
   - ONLY cite numbers, marks, grades, attendance percentages, and facts that are explicitly present in the GROUNDED EVIDENCE above.
   - Under NO circumstances make up or hallucinate marks or students.
   - If a student or entity is absent from the database, explain politely and list the registered students available.
3. ELEGANT FORMATTING:
   - Use clean Markdown: bold key metrics, bullet points for lists of strengths/improvements, and tables when presenting multi-attribute comparative data.
   - Keep prose fluent, professional, and natural. Avoid robotic filler phrases like "Based on the provided context document...". Answer as a knowledgeable dean or academic advisor.`;

  // 6. Execute Generation via Gemini 2.5 Flash or Smart Local Fallback
  let finalAnswer = '';
  let engineUsed = 'Local Dynamic Academic Synthesizer';
  let llmTime = 0;

  const candidateKey = (apiKey && apiKey.trim().length > 5) ? apiKey : apiKeyPool.getActiveKey();

  if (candidateKey && candidateKey.trim().length > 5) {
    try {
      const { text, modelUsed, keyUsed, failoverCount, latencyMs } = await apiKeyPool.generateContentWithCascade(
        { contents: promptPayload },
        { preferredKey: candidateKey }
      );

      llmTime = latencyMs;
      finalAnswer = text;
      const maskedKey = apiKeyPool.maskKey(keyUsed);
      engineUsed = failoverCount > 0
        ? `Google ${modelUsed} (Auto-failover to ${maskedKey})`
        : `Google ${modelUsed} (${maskedKey})`;
    } catch (err: any) {
      console.warn('[StudentQueryService] Gemini call failed, using dynamic local fallback:', err);
      finalAnswer = generateLocalDynamicStudentAnswer(query, matchedStudents, analyticsResult);
      engineUsed = 'Local Dynamic Synthesizer (Gemini API Offline)';
    }
  } else {
    finalAnswer = generateLocalDynamicStudentAnswer(query, matchedStudents, analyticsResult);
    engineUsed = 'Local Dynamic Synthesizer (Zero-Config)';
  }

  // 7. Assemble Citations
  const sources: SearchResult[] = matchedStudents.map((s, idx) => ({
    chunk: {
      id: `chunk_${s.studentId}_${idx}`,
      docId: `doc_${s.studentId}`,
      docName: `PostgreSQL: Student_Record_${s.fullName.replace(/\s+/g, '_')}.db`,
      pageNumber: 1,
      chunkIndex: idx,
      startChar: 0,
      endChar: finalAnswer.length,
      content: formatStudentAsFactualContext(s)
    },
    score: 1.0,
    semanticScore: 1.0,
    keywordScore: 1.0
  }));

  const totalTime = Number((performance.now() - startTime).toFixed(1));

  trackNetworkPhase('phase4-gemini-api-response', {
    phase: 'Stage 7: Final Dynamic LLM Generation',
    status: 'SUCCESS_200',
    engineUsed,
    rawResponseLength: finalAnswer.length,
    llmLatencyMs: llmTime,
    totalPipelineTimeMs: totalTime,
    rawLLMAnswer: finalAnswer
  });

  const pipelineInfo: PipelineStageInfo = {
    timestamp,
    query,
    extractedDocCount: totalCount,
    totalChunksInDB: totalCount,
    queryVectorDimension: 0,
    queryVectorSample: [],
    retrievedResults: sources,
    constructedPrompt: promptPayload,
    rawLLMResponse: finalAnswer,
    engineUsed,
    timings: {
      embedMs: 0,
      searchMs: 1,
      llmMs: llmTime,
      totalMs: totalTime
    }
  };

  return {
    answer: finalAnswer,
    sources,
    pipelineInfo,
    isStudentQuery: true,
    matchedStudent: matchedStudents[0],
    analyticsResult: analyticsResult || undefined
  };
}
