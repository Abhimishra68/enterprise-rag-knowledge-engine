import { StudentProfile } from '../../types/school';
import { SearchResult, PipelineStageInfo } from '../../types/rag';
import { schoolDataRepository } from './schoolDataRepository';
import { detectAndExecuteSchoolAnalytics, AnalyticsResult } from './schoolAnalytics';
import { trackNetworkPhase } from '../rag/networkTelemetry';

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
    /\bwho\s+(?:contains|has|have|got|scored)\b/i
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

  // 3. Name-focused question patterns like "who is <X>", "tell me about <X>"
  if (/^(?:who\s+is|tell\s+(?:me\s+)?about|details\s+(?:of|for|about)|profile\s+(?:of|for))\s+[a-zA-Z\s'.]+$/i.test(q)) {
    return true;
  }

  return false;
}

/**
 * Extracts student entity name, roll number, or ID from query.
 */
export function extractStudentEntity(query: string): string | null {
  const cleanQ = query.trim().replace(/[?!.,]+$/, '').trim();

  // Guard against aggregate or meta queries
  if (/(how\s*many|total|count|all\s*student|list\s*student|every\s*student|show\s*all|database|directory)/i.test(cleanQ)) {
    return null;
  }

  // 1. Check if any enrolled student's full name is in the query
  const liveStudents = schoolDataRepository.getStudents();
  const qLower = cleanQ.toLowerCase();
  const nameMatch = liveStudents.find(s => qLower.includes(s.fullName.toLowerCase()));
  if (nameMatch) {
    return nameMatch.fullName;
  }

  // 2. Direct ID or Roll number match (e.g. STU_1001 or R-101)
  const idMatch = cleanQ.match(/\b(STU_\d+|R-\d+)\b/i);
  if (idMatch) {
    return idMatch[1];
  }

  // 3. Prefix extraction ("Who is <Name>", "Tell me about <Name>")
  const prefixRegex = /^(?:who\s+is|tell\s+(?:me\s+)?about|information\s+(?:about|of|on)|info\s+(?:about|of|on)|details\s+(?:of|for|about)|profile\s+(?:of|for)|give\s+(?:me\s+)?(?:info|details)\s+(?:on|about)|show\s+me|find|about|check\s+record\s+of)\s+([a-zA-Z\s'.]+?)(?:\s+(?:in|from|at|class|section|marks|roll|attendance|\?|$)|$)/i;
  const match = cleanQ.match(prefixRegex);
  if (match && match[1]) {
    const candidate = match[1].trim();
    if (!['the', 'a', 'an', 'this', 'that', 'all', 'any', 'their', 'our', 'student', 'students', 'topper', 'highest', 'lowest'].includes(candidate.toLowerCase())) {
      return candidate;
    }
  }

  // 4. Standalone name (1-3 words)
  const words = cleanQ.split(/\s+/);
  if (words.length >= 1 && words.length <= 3 && !/(topper|highest|lowest|marks|grade|attendance|class|average|best|worst)/i.test(cleanQ)) {
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
 * Formats a verified StudentProfile entity into clean Markdown Tables & Executive Summary.
 */
export function formatStudentProfileMarkdown(s: StudentProfile): string {
  const marksRows = s.subjectMarks.map(m =>
    `| **${m.subjectName}** | **${m.marksObtained}/100** | ${m.grade} |`
  ).join('\n');

  return `### 📌 Executive Summary
**${s.fullName}** is enrolled in **${s.classGrade} - Section ${s.section}** (Roll No: \`${s.rollNumber}\`). Overall academic score is **${s.overallPercentage}%** (Grade: **${s.overallGrade}**) with an attendance standing of **${s.attendance.percentage}%** (${s.attendance.attendedSessions}/${s.attendance.totalSessions} sessions, Status: *${s.attendance.status}*).

> **Teacher Evaluation**: "${s.teacherComments}"

---

### 👤 Student Profile & Attendance
| Attribute | Detail |
| :--- | :--- |
| **Student Name** | **${s.fullName}** |
| **Student ID / Roll No** | \`${s.studentId}\` / \`${s.rollNumber}\` |
| **Class & Section** | ${s.classGrade} - Section ${s.section} |
| **Gender & DOB** | ${s.gender} | ${s.dob} |
| **Overall Score** | **${s.overallPercentage}%** (Grade ${s.overallGrade}) |
| **Attendance** | **${s.attendance.percentage}%** (${s.attendance.attendedSessions}/${s.attendance.totalSessions} sessions — *${s.attendance.status}*) |

---

### 📚 6-Subject Examination Marks
| Subject | Score | Grade |
| :--- | :--- | :--- |
${marksRows}

---

### 👨‍👩‍👧 Guardian & Contact Details
| Contact Field | Details |
| :--- | :--- |
| **Father Name** | ${s.guardian.fatherName} |
| **Mother Name** | ${s.guardian.motherName} |
| **Primary Phone** | \`${s.guardian.contactNumber}\` |
| **Emergency Contact** | \`${s.guardian.emergencyContact}\` |
| **Parent Email** | \`${s.guardian.email}\` |
| **Residential Address** | ${s.guardian.address} |

---
*Verified from School Ecosystem Database (${s.studentId}).*`;
}

/**
 * Formats a clean 404 response for non-existent students.
 */
export function formatStudentNotFoundMarkdown(name: string, suggestions: string[]): string {
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
  const suggestionList = suggestions.map(s => `  - **${s}**`).join('\n');
  const count = schoolDataRepository.getStudentCount();

  return `### ❌ Student Record Not Found: "${formattedName}"

No student named **"${formattedName}"** exists in the School Database.

#### 💡 Did you mean one of these enrolled students?
${suggestionList}

---
*Verified across all ${count} active records in the PostgreSQL School Database.*`;
}

/**
 * Formats a directory list of all students in the database.
 */
export function formatAllStudentsDirectoryMarkdown(): string {
  const students = schoolDataRepository.getStudents();
  if (students.length === 0) {
    return `### 🏫 Enrolled Student Directory (0 Students)\n\nNo student records are currently loaded from the PostgreSQL School Database.\n\n*Source: PostgreSQL School Database*`;
  }

  const rows = students.map((s, idx) =>
    `| ${idx + 1} | **${s.fullName}** | ${s.classGrade} - ${s.section} | \`${s.rollNumber}\` | **${s.overallPercentage}%** | ${s.overallGrade} | ${s.attendance.percentage}% |`
  ).join('\n');

  return `### 🏫 Enrolled Student Directory (${students.length} Students)

| # | Student Name | Class & Sec | Roll No | Overall % | Grade | Attendance |
| :-: | :--- | :--- | :--- | :--- | :---: | :--- |
${rows}

---
*Active records queried directly from the School Ecosystem Database.*`;
}

/**
 * Formats a directory list of all registered curriculum subjects.
 */
export function formatRegisteredSubjectsMarkdown(): string {
  return `### 📚 Registered School Curriculum Subjects

The School Database evaluates and tracks enrolled students across **6 core subjects**:

| # | Subject Name | Code | Key Topics & Aliases | Max Marks |
| :-: | :--- | :---: | :--- | :-: |
| 1 | **Mathematics** | \`MATH\` | Mathematics, Algebra, Geometry, Calculus | 100 |
| 2 | **Science** | \`SCI\` | General Science (Physics, Chemistry, Biology) | 100 |
| 3 | **English** | \`ENG\` | English Literature & Language | 100 |
| 4 | **Social Studies** | \`SST\` | History, Geography, Civics, Social Science | 100 |
| 5 | **Computer Science** | \`CS\` | Computers, Coding, Programming, IT | 100 |
| 6 | **Regional Language** | \`LANG\` | Hindi / Regional Language | 100 |

#### 💡 Example Queries You Can Ask:
- *"Who contains more marks in Mathematics?"*
- *"Who has the highest marks in SST?"*
- *"Top ranker in Science"*
- *"Computer Science leaderboard"*

---
*Active curriculum queried directly from PostgreSQL School Database.*`;
}

/**
 * MAIN HANDLER: Processes all Student & School Database queries.
 * Completely independent from document upload chunks.
 */
export async function handleStudentDatabaseQuery(
  query: string,
  apiKey?: string
): Promise<StudentQueryResponse> {
  const startTime = performance.now();
  const timestamp = Date.now();

  // 1. Check for Directory / "List all students" queries
  if (/(all\s*student|list\s*student|student\s*directory|show\s*all\s*student|every\s*student)/i.test(query)) {
    const answer = formatAllStudentsDirectoryMarkdown();
    const pipelineInfo: PipelineStageInfo = {
      timestamp,
      query,
      extractedDocCount: schoolDataRepository.getStudentCount(),
      totalChunksInDB: schoolDataRepository.getStudentCount(),
      queryVectorDimension: 0,
      queryVectorSample: [],
      retrievedResults: [],
      constructedPrompt: `[DIRECTORY_QUERY] Listed all ${schoolDataRepository.getStudentCount()} students`,
      rawLLMResponse: answer,
      engineUsed: 'PostgreSQL Student Directory Engine',
      timings: {
        embedMs: 0,
        searchMs: 1,
        llmMs: 0,
        totalMs: Number((performance.now() - startTime).toFixed(1))
      }
    };

    return {
      answer,
      sources: [],
      pipelineInfo,
      isStudentQuery: true
    };
  }

  // 1.1 Check for Count / Enrollment queries (both class-specific and total)
  if (/(how\s*many\s*students?|total\s*(?:number\s*of\s*)?students?|count\s*of\s*students?|number\s*of\s*(?:enrolled\s*)?students|students?\s+in\s+class)/i.test(query)) {
    const students = schoolDataRepository.getStudents();
    const totalCount = students.length;

    // Check if query is targeting a specific class / grade (e.g. "class 8", "class 10", "8th grade")
    const classMatch = query.match(/\b(?:class|grade|standard|std)\s*(\d+|lkg|ukg|nursery)\b|\b(\d+)(?:th|st|nd|rd)\s*(?:class|grade|standard|std)\b/i);

    if (classMatch) {
      const classNum = (classMatch[1] || classMatch[2]).trim().toLowerCase();
      // Match against student.classGrade (e.g. "Class 10", "class 10", "Class 9")
      const matchingStudents = students.filter(s => {
        const sGrade = s.classGrade.toLowerCase().replace(/^(?:class|grade|std)\s*/i, '').trim();
        return sGrade === classNum;
      });

      const classNameFormatted = isNaN(Number(classNum))
        ? `Class ${classNum.toUpperCase()}`
        : `Class ${classNum}`;

      if (matchingStudents.length === 0) {
        // Normalize and group existing classes for clean display
        const classMap = new Map<string, { count: number; names: string[] }>();
        for (const s of students) {
          const normClass = s.classGrade.charAt(0).toUpperCase() + s.classGrade.slice(1);
          const entry = classMap.get(normClass) || { count: 0, names: [] };
          entry.count++;
          entry.names.push(s.fullName);
          classMap.set(normClass, entry);
        }

        const existingClassList = classMap.size > 0
          ? [...classMap.entries()]
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([cls, info]) => `- **${cls}**: ${info.count} student${info.count === 1 ? '' : 's'} (${info.names.join(', ')})`)
              .join('\n')
          : '- *(No students currently registered in database)*';

        const answer = `### 📊 ${classNameFormatted} Enrollment (0 Students)\n\nThere are **0 enrolled students** in **${classNameFormatted}** in the School Database.\n\n#### 🏫 Currently Enrolled Classes in Database:\n${existingClassList}\n\n---\n*Verified across all ${totalCount} active records in PostgreSQL School Database.*`;

        const pipelineInfo: PipelineStageInfo = {
          timestamp,
          query,
          extractedDocCount: totalCount,
          totalChunksInDB: totalCount,
          queryVectorDimension: 0,
          queryVectorSample: [],
          retrievedResults: [],
          constructedPrompt: `[CLASS_COUNT_QUERY] ${classNameFormatted}: 0 students`,
          rawLLMResponse: answer,
          engineUsed: 'PostgreSQL Class Filter Engine',
          timings: {
            embedMs: 0,
            searchMs: 1,
            llmMs: 0,
            totalMs: Number((performance.now() - startTime).toFixed(1))
          }
        };

        return {
          answer,
          sources: [],
          pipelineInfo,
          isStudentQuery: true
        };
      }

      // If there ARE students in that class:
      const studentRows = matchingStudents.map((s, i) =>
        `| ${i + 1} | **${s.fullName}** | \`${s.rollNumber}\` | Section ${s.section} | **${s.overallPercentage}%** | ${s.overallGrade} | ${s.attendance.percentage}% |`
      ).join('\n');

      const answer = `### 📊 ${classNameFormatted} Enrollment (${matchingStudents.length} Student${matchingStudents.length === 1 ? '' : 's'})\n\nThere ${matchingStudents.length === 1 ? 'is' : 'are'} **${matchingStudents.length} enrolled student${matchingStudents.length === 1 ? '' : 's'}** in **${classNameFormatted}**:\n\n| # | Student Name | Roll Number | Section | Overall % | Grade | Attendance |\n| :-: | :--- | :---: | :---: | :---: | :---: | :---: |\n${studentRows}\n\n---\n*Verified directly from PostgreSQL School Database.*`;

      const pipelineInfo: PipelineStageInfo = {
        timestamp,
        query,
        extractedDocCount: totalCount,
        totalChunksInDB: totalCount,
        queryVectorDimension: 0,
        queryVectorSample: [],
        retrievedResults: [],
        constructedPrompt: `[CLASS_COUNT_QUERY] ${classNameFormatted}: ${matchingStudents.length} students`,
        rawLLMResponse: answer,
        engineUsed: 'PostgreSQL Class Filter Engine',
        timings: {
          embedMs: 0,
          searchMs: 1,
          llmMs: 0,
          totalMs: Number((performance.now() - startTime).toFixed(1))
        }
      };

      return {
        answer,
        sources: [],
        pipelineInfo,
        isStudentQuery: true
      };
    }

    // General total enrollment query (no specific class requested)
    const classBreakdown = students.reduce<Record<string, number>>((acc, s) => {
      const norm = s.classGrade.charAt(0).toUpperCase() + s.classGrade.slice(1);
      acc[norm] = (acc[norm] || 0) + 1;
      return acc;
    }, {});

    const breakdownRows = Object.entries(classBreakdown)
      .map(([cls, c]) => `| **${cls}** | ${c} student${c === 1 ? '' : 's'} |`)
      .join('\n');

    const answer = `### 📊 Enrolled Student Count\n\nThe School Database currently contains **${totalCount} enrolled students**.\n\n| Class / Grade | Enrollment |\n| :--- | :-: |\n${breakdownRows}\n\n---\n*Verified directly from PostgreSQL School Database.*`;

    const pipelineInfo: PipelineStageInfo = {
      timestamp,
      query,
      extractedDocCount: totalCount,
      totalChunksInDB: totalCount,
      queryVectorDimension: 0,
      queryVectorSample: [],
      retrievedResults: [],
      constructedPrompt: `[COUNT_QUERY] Total students: ${totalCount}`,
      rawLLMResponse: answer,
      engineUsed: 'PostgreSQL Student Count Engine',
      timings: {
        embedMs: 0,
        searchMs: 1,
        llmMs: 0,
        totalMs: Number((performance.now() - startTime).toFixed(1))
      }
    };

    return {
      answer,
      sources: [],
      pipelineInfo,
      isStudentQuery: true
    };
  }

  // 1.2 Check for Curriculum / "List all subjects" queries
  if (/(what\s*(?:are\s*the\s*)?subjects|list\s*(?:all\s*)?subjects|which\s*subjects|all\s*subjects|registered\s*subjects|curriculum)/i.test(query)) {
    const answer = formatRegisteredSubjectsMarkdown();
    const pipelineInfo: PipelineStageInfo = {
      timestamp,
      query,
      extractedDocCount: schoolDataRepository.getStudentCount(),
      totalChunksInDB: schoolDataRepository.getStudentCount(),
      queryVectorDimension: 0,
      queryVectorSample: [],
      retrievedResults: [],
      constructedPrompt: `[CURRICULUM_QUERY] Listed 6 registered subjects`,
      rawLLMResponse: answer,
      engineUsed: 'PostgreSQL Curriculum Registry Engine',
      timings: {
        embedMs: 0,
        searchMs: 1,
        llmMs: 0,
        totalMs: Number((performance.now() - startTime).toFixed(1))
      }
    };

    return {
      answer,
      sources: [],
      pipelineInfo,
      isStudentQuery: true
    };
  }

  // 2. Check for Comparative Analytics & Rankings (Highest Marks, Topper, Attendance)
  const analytics = detectAndExecuteSchoolAnalytics(query);
  if (analytics && analytics.isHandled) {
    trackNetworkPhase('phase4-gemini-api-response', {
      phase: 'Stage 7: Final LLM Generation',
      status: 'SUCCESS_200',
      engineUsed: 'PostgreSQL School Analytics Engine',
      rawLLMResponse: analytics.markdownResponse
    });

    const pipelineInfo: PipelineStageInfo = {
      timestamp,
      query,
      extractedDocCount: schoolDataRepository.getStudentCount(),
      totalChunksInDB: schoolDataRepository.getStudentCount(),
      queryVectorDimension: 0,
      queryVectorSample: [],
      retrievedResults: [],
      constructedPrompt: `[ANALYTICS] ${analytics.title}: ${analytics.executiveSummary}`,
      rawLLMResponse: analytics.markdownResponse,
      engineUsed: 'PostgreSQL School Analytics Engine',
      timings: {
        embedMs: 0,
        searchMs: 2,
        llmMs: 0,
        totalMs: Number((performance.now() - startTime).toFixed(1))
      }
    };

    return {
      answer: analytics.markdownResponse,
      sources: [],
      pipelineInfo,
      isStudentQuery: true,
      analyticsResult: analytics
    };
  }

  // 3. Check for Individual Student Entity Lookup ("Who is Shrishti Kumari", "Tell me about Abhishek")
  const targetEntity = extractStudentEntity(query);
  if (targetEntity) {
    const verification = verifyStudentInDatabase(targetEntity);

    // Case A: Student exists in database
    if (verification.exists && verification.matchedStudent) {
      const student = verification.matchedStudent;
      const answer = formatStudentProfileMarkdown(student);

      const sourceCitation: SearchResult = {
        chunk: {
          id: `chunk_${student.studentId}`,
          docId: `doc_${student.studentId}`,
          docName: `PostgreSQL: Student_Record_${student.fullName.replace(/\s+/g, '_')}.db`,
          pageNumber: 1,
          chunkIndex: 0,
          startChar: 0,
          endChar: answer.length,
          content: answer
        },
        score: 1.0,
        semanticScore: 1.0,
        keywordScore: 1.0
      };

      const pipelineInfo: PipelineStageInfo = {
        timestamp,
        query,
        extractedDocCount: schoolDataRepository.getStudentCount(),
        totalChunksInDB: schoolDataRepository.getStudentCount(),
        queryVectorDimension: 0,
        queryVectorSample: [],
        retrievedResults: [sourceCitation],
        constructedPrompt: `[GROUNDED_STUDENT_PROFILE] Fetched record for ${student.fullName} (${student.studentId}) directly from database.`,
        rawLLMResponse: answer,
        engineUsed: 'PostgreSQL Relational Database Engine',
        timings: {
          embedMs: 0,
          searchMs: 1,
          llmMs: 0,
          totalMs: Number((performance.now() - startTime).toFixed(1))
        }
      };

      return {
        answer,
        sources: [sourceCitation],
        pipelineInfo,
        isStudentQuery: true,
        matchedStudent: student
      };
    }

    // Case B: Student does NOT exist in database (Anti-hallucination Gatekeeper)
    const notFoundAnswer = formatStudentNotFoundMarkdown(targetEntity, verification.suggestions);
    const pipelineInfo: PipelineStageInfo = {
      timestamp,
      query,
      extractedDocCount: schoolDataRepository.getStudentCount(),
      totalChunksInDB: schoolDataRepository.getStudentCount(),
      queryVectorDimension: 0,
      queryVectorSample: [],
      retrievedResults: [],
      constructedPrompt: `[ENTITY_NOT_FOUND] "${targetEntity}" not in database.`,
      rawLLMResponse: notFoundAnswer,
      engineUsed: 'PostgreSQL Entity Verification Gate',
      timings: {
        embedMs: 0,
        searchMs: 1,
        llmMs: 0,
        totalMs: Number((performance.now() - startTime).toFixed(1))
      }
    };

    return {
      answer: notFoundAnswer,
      sources: [],
      pipelineInfo,
      isStudentQuery: true
    };
  }

  // 4. Fallback student database query (e.g. "student attendance policy", "how many students")
  const totalCount = schoolDataRepository.getStudentCount();
  const summaryAnswer = `### 🏫 School Database Overview\n\nThe School Database contains **${totalCount} enrolled students**.\n\nYou can:\n- Ask for any student by name (e.g. *"Who is Shrishti Kumari"*, *"Tell me about Aarav Verma"*)\n- Ask for subject rankings (e.g. *"Highest marks in Mathematics"*, *"Top ranker in SST"*)\n- Ask for attendance leaders (e.g. *"Best attendance"*, *"Attendance below 80%"*)\n- Ask to see the full directory (e.g. *"List all students"*)\n\n*Source: PostgreSQL School Database*`;

  const pipelineInfo: PipelineStageInfo = {
    timestamp,
    query,
    extractedDocCount: totalCount,
    totalChunksInDB: totalCount,
    queryVectorDimension: 0,
    queryVectorSample: [],
    retrievedResults: [],
    constructedPrompt: `[STUDENT_DB_FALLBACK]`,
    rawLLMResponse: summaryAnswer,
    engineUsed: 'PostgreSQL School Assistant',
    timings: {
      embedMs: 0,
      searchMs: 1,
      llmMs: 0,
      totalMs: Number((performance.now() - startTime).toFixed(1))
    }
  };

  return {
    answer: summaryAnswer,
    sources: [],
    pipelineInfo,
    isStudentQuery: true
  };
}
