import { schoolDataRepository } from './schoolDataRepository';
import { StudentProfile } from '../../types/school';

export interface AnalyticsResult {
  isHandled: boolean;
  title: string;
  executiveSummary: string;
  topPerformer?: {
    name: string;
    classGrade: string;
    rollNumber: string;
    metricLabel: string;
    metricValue: string | number;
    grade?: string;
  };
  leaderboard: Array<{
    rank: number;
    name: string;
    classGrade: string;
    rollNumber: string;
    metricValue: string | number;
    grade?: string;
  }>;
  markdownResponse: string;
}

export const REGISTERED_CURRICULUM_SUBJECTS = [
  {
    name: 'Mathematics',
    code: 'MATH',
    aliases: ['math', 'maths', 'mathematics', 'algebra', 'geometry', 'calculus', 'arithmetic'],
    description: 'Mathematics, Algebra, Geometry & Arithmetic'
  },
  {
    name: 'Science',
    code: 'SCI',
    aliases: ['science', 'sci', 'general science', 'natural science', 'physics', 'chemistry', 'biology'],
    description: 'General Science (Physics, Chemistry, Biology)'
  },
  {
    name: 'English',
    code: 'ENG',
    aliases: ['english', 'eng', 'literature', 'english literature', 'english language'],
    description: 'English Literature & Language'
  },
  {
    name: 'Social Studies',
    code: 'SST',
    aliases: ['social studies', 'sst', 'social science', 'social', 'history', 'civics', 'geography', 'geo'],
    description: 'Social Studies (History, Civics, Geography)'
  },
  {
    name: 'Computer Science',
    code: 'CS',
    aliases: ['computer science', 'computer', 'computers', 'cs', 'coding', 'programming', 'informatics', 'it', 'information technology'],
    description: 'Computer Science & Programming'
  },
  {
    name: 'Regional Language',
    code: 'LANG',
    aliases: ['regional language', 'regional', 'hindi', 'language', 'second language', 'mother tongue'],
    description: 'Regional Language / Hindi'
  }
] as const;

export const SUBJECT_ALIASES: Record<string, string> = {
  // Mathematics
  'math': 'Mathematics',
  'maths': 'Mathematics',
  'mathematics': 'Mathematics',
  'algebra': 'Mathematics',
  'geometry': 'Mathematics',
  'calculus': 'Mathematics',
  'arithmetic': 'Mathematics',

  // Science
  'science': 'Science',
  'sci': 'Science',
  'general science': 'Science',
  'natural science': 'Science',
  'physics': 'Science',
  'chemistry': 'Science',
  'biology': 'Science',

  // English
  'english': 'English',
  'eng': 'English',
  'literature': 'English',
  'english literature': 'English',
  'english language': 'English',

  // Social Studies (SST)
  'sst': 'Social Studies',
  'social': 'Social Studies',
  'social studies': 'Social Studies',
  'social science': 'Social Studies',
  'history': 'Social Studies',
  'civics': 'Social Studies',
  'geography': 'Social Studies',
  'geo': 'Social Studies',

  // Computer Science
  'computer': 'Computer Science',
  'computers': 'Computer Science',
  'computer science': 'Computer Science',
  'cs': 'Computer Science',
  'coding': 'Computer Science',
  'programming': 'Computer Science',
  'informatics': 'Computer Science',
  'it': 'Computer Science',
  'information technology': 'Computer Science',

  // Regional Language
  'regional': 'Regional Language',
  'regional language': 'Regional Language',
  'hindi': 'Regional Language',
  'language': 'Regional Language',
  'second language': 'Regional Language',
  'mother tongue': 'Regional Language'
};

export interface SubjectExtractionResult {
  isRegistered: boolean;
  canonicalName?: string;
  rawName: string;
}

/**
 * Extracts subject candidate from query and determines if it is a registered curriculum subject.
 */
export function extractSubjectCandidate(query: string): SubjectExtractionResult | null {
  const cleanQ = query.trim().replace(/[?!.,]+$/, '').trim();

  // Guard against non-subject aggregate queries
  if (/(all\s*students?|list\s*students?|every\s*student|student\s*directory|how\s*many|attendance\s*policy|fee\s*structure)/i.test(cleanQ)) {
    return null;
  }

  // 1. Direct match: Check if any known alias exists in the query first (longest phrases first)
  const sortedAliases = Object.keys(SUBJECT_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of sortedAliases) {
    const regex = new RegExp(`\\b${alias.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (regex.test(cleanQ)) {
      return {
        isRegistered: true,
        canonicalName: SUBJECT_ALIASES[alias],
        rawName: alias
      };
    }
  }

  // Helper to clean extracted candidate
  const cleanCand = (raw: string): string | null => {
    const c = raw.trim().replace(/[?!.,]+$/, '').trim();
    if (!c || c.length < 2) return null;
    const lower = c.toLowerCase();

    const excludedWords = new Set([
      'all', 'every', 'student', 'students', 'school', 'database', 'class',
      'section', 'here', 'there', 'attendance', 'sessions', 'overall', 'general',
      'both', 'each', 'this', 'that', 'our', 'their', 'the', 'a', 'an', 'me', 'us',
      'exam', 'test', 'marks', 'score', 'grades', 'grade', 'percentage', 'session',
      'sessions', 'record', 'records', 'details', 'detail', 'info', 'information',
      'profile', 'list', 'show', 'give', 'tell', 'find', 'which', 'who', 'what'
    ]);

    if (excludedWords.has(lower)) return null;
    if (/^(?:class\s*\d+|section\s*[abc])$/i.test(lower)) return null;
    return c;
  };

  // 2. Pattern: [marks / score / topper / rank / etc.] (in | for | of | on) [Subject]
  // e.g. "who contains more marks in LLB", "highest score in LLB", "topper for Law"
  const prepPattern = /(?:marks|score|scores|grade|grades|percentage|topper|toppers|rank|ranker|rankers|leaderboard|ranking|highest|lowest|more\s+marks|top\s+marks|max\s+marks|maximum\s+marks|least\s+marks|min\s+marks|minimum\s+marks|best\s+score|worst\s+score|performance|result|results)\s+(?:in|for|of|on)\s+([a-zA-Z0-9\s#+.-]+?)(?:\s+(?:subject|course|exam|marks|score|class|test|section|\?|$)|$|\?)/i;
  const prepMatch = cleanQ.match(prepPattern);
  if (prepMatch && prepMatch[1]) {
    const cand = cleanCand(prepMatch[1]);
    if (cand) {
      const aliasMatch = SUBJECT_ALIASES[cand.toLowerCase()];
      return {
        isRegistered: !!aliasMatch,
        canonicalName: aliasMatch,
        rawName: cand
      };
    }
  }

  // 3. Pattern: who (contains | has | have | got | scored | received | achieves | achieved | takes) ... in [Subject]
  // e.g. "who contains more marks in LLB", "who scored highest in LLB"
  const whoPattern = /who\s+(?:contains|has|have|got|scored|received|achieves|achieved|takes)\s+(?:the\s+)?(?:highest|lowest|more|most|maximum|least|best|worst|good|bad)?\s*(?:marks|score|scores|grade|percentage)?\s+(?:in|for|of)\s+([a-zA-Z0-9\s#+.-]+?)(?:\s+(?:subject|course|exam|class|test|\?|$)|$|\?)/i;
  const whoMatch = cleanQ.match(whoPattern);
  if (whoMatch && whoMatch[1]) {
    const cand = cleanCand(whoMatch[1]);
    if (cand) {
      const aliasMatch = SUBJECT_ALIASES[cand.toLowerCase()];
      return {
        isRegistered: !!aliasMatch,
        canonicalName: aliasMatch,
        rawName: cand
      };
    }
  }

  // 4. Pattern: [Subject] marks / score / topper / ranker / leaderboard
  // e.g. "LLB marks", "Law topper", "LLB ranking"
  const subjectFirstPattern = /^([a-zA-Z0-9\s#+.-]+?)\s+(?:marks|score|scores|topper|ranker|ranking|leaderboard|highest|lowest)$/i;
  const subjectFirstMatch = cleanQ.match(subjectFirstPattern);
  if (subjectFirstMatch && subjectFirstMatch[1]) {
    const cand = cleanCand(subjectFirstMatch[1]);
    if (cand) {
      const aliasMatch = SUBJECT_ALIASES[cand.toLowerCase()];
      return {
        isRegistered: !!aliasMatch,
        canonicalName: aliasMatch,
        rawName: cand
      };
    }
  }

  // 5. Pattern: "is [Subject] a subject" or "does database have [Subject]"
  const isSubjectPattern = /(?:is|check|does)\s+([a-zA-Z0-9\s#+.-]+?)\s+(?:a\s+)?(?:subject|registered|course|taught|available|in\s+(?:the\s+)?database)/i;
  const isSubMatch = cleanQ.match(isSubjectPattern);
  if (isSubMatch && isSubMatch[1]) {
    const cand = cleanCand(isSubMatch[1]);
    if (cand) {
      const aliasMatch = SUBJECT_ALIASES[cand.toLowerCase()];
      return {
        isRegistered: !!aliasMatch,
        canonicalName: aliasMatch,
        rawName: cand
      };
    }
  }

  return null;
}

/**
 * Formats a clean, production-grade error response when user queries an unregistered subject.
 */
export function formatSubjectNotFoundMarkdown(rawSubject: string): string {
  const formatted = rawSubject.trim().toUpperCase() === rawSubject.trim()
    ? rawSubject.trim()
    : rawSubject.trim().charAt(0).toUpperCase() + rawSubject.trim().slice(1);

  return `### ❌ Subject Not Registered: "${formatted}"

**"${formatted}"** is not a registered subject in the School Database curriculum.

The School Database evaluates and tracks student performance across **6 registered subjects**:

| # | Registered Subject | Code | Key Topics & Aliases | Max Marks |
| :-: | :--- | :---: | :--- | :-: |
| 1 | **Mathematics** | \`MATH\` | Mathematics, Algebra, Geometry, Calculus | 100 |
| 2 | **Science** | \`SCI\` | General Science (Physics, Chemistry, Biology) | 100 |
| 3 | **English** | \`ENG\` | English Literature & Language | 100 |
| 4 | **Social Studies** | \`SST\` | History, Geography, Civics, Social Science | 100 |
| 5 | **Computer Science** | \`CS\` | Computers, Coding, Programming, IT | 100 |
| 6 | **Regional Language** | \`LANG\` | Hindi / Regional Language | 100 |

#### 💡 Try asking:
- *"Who contains more marks in Mathematics?"*
- *"Who has the highest marks in SST?"*
- *"Top ranker in Science"*
- *"Computer Science leaderboard"*

---
*Verified against active PostgreSQL School Database curriculum.*`;
}

/**
 * Detects if a user query is asking for comparative / aggregate analytics across all students
 */
export function detectAndExecuteSchoolAnalytics(query: string): AnalyticsResult | null {
  const q = query.toLowerCase().trim();

  // Check for superlative / ranking keywords
  const isHighest = /\b(highest|top|topper|first|1st|best|maximum|max|most|leading|peak|more|higher|greatest)\b/i.test(q);
  const isLowest = /\b(lowest|bottom|least|last|worst|minimum|min)\b/i.test(q);
  const isMarksQuery = /\b(marks|score|scores|percentage|grade|grades|scorer|performer|scoring|scored)\b/i.test(q);
  const isAttendanceQuery = /\b(attendance|present|presence|sessions|regular|absent)\b/i.test(q);

  // Guard against single-student queries (e.g. "tell me about Aarav Verma")
  if (/\b(tell\s+me\s+about|details\s+of|profile\s+of|who\s+is\s+[a-z]+\s+[a-z]+)\b/i.test(q) && !isHighest && !isLowest) {
    return null;
  }

  // 1. Check for subject inquiries (registered or unregistered)
  const subjectCandidate = extractSubjectCandidate(query);

  if (subjectCandidate) {
    // Case 1A: Unregistered subject (e.g. "who contains more marks in LLB")
    if (!subjectCandidate.isRegistered) {
      return {
        isHandled: true,
        title: `Subject Not Registered: "${subjectCandidate.rawName}"`,
        executiveSummary: `"${subjectCandidate.rawName}" is not a registered subject in the School Database curriculum.`,
        leaderboard: [],
        markdownResponse: formatSubjectNotFoundMarkdown(subjectCandidate.rawName)
      };
    }

    // Case 1B: Valid registered subject (e.g. "who contains more marks in Mathematics", "highest marks in SST")
    if (subjectCandidate.canonicalName) {
      return handleSubjectRanking(subjectCandidate.canonicalName, isLowest);
    }
  }

  // Case 2: Attendance Queries (e.g. "best attendance", "lowest attendance")
  if (isAttendanceQuery) {
    return handleAttendanceRanking(isLowest);
  }

  // Case 3: Overall School Topper / Rankers (e.g. "who is school topper", "highest overall marks")
  if (isHighest || /\b(topper|rank\s*1|overall)\b/i.test(q)) {
    return handleOverallRanking(isLowest);
  }

  return null;
}

function handleSubjectRanking(subject: string, isLowest: boolean = false): AnalyticsResult {
  const students = schoolDataRepository.getStudents();
  const totalCount = students.length;

  if (totalCount === 0) {
    const title = `${isLowest ? 'Lowest' : 'Highest'} Marks in ${subject}`;
    return {
      isHandled: true,
      title,
      executiveSummary: 'No student records currently available in the database.',
      leaderboard: [],
      markdownResponse: `### 🏆 ${title}\n\nNo student records found in the School Database.`
    };
  }

  const ranked = students.map(student => {
    const sub = student.subjectMarks.find(s => s.subjectName === subject);
    return {
      student,
      marks: sub ? sub.marksObtained : 0,
      grade: sub ? sub.grade : 'N/A'
    };
  }).sort((a, b) => isLowest ? a.marks - b.marks : b.marks - a.marks);

  const top = ranked[0];
  const direction = isLowest ? 'Lowest' : 'Highest';
  const adjective = isLowest ? 'lowest scoring' : 'top performing';

  // Check for ties at rank 1
  const tiedForFirst = ranked.filter(r => r.marks === top.marks);
  const title = `${direction} Marks in ${subject}`;

  const executiveSummary = tiedForFirst.length > 1
    ? `**${tiedForFirst.map(t => `${t.student.fullName} (${t.student.classGrade})`).join(' and ')}** tied for the ${adjective} score in **${subject}** with **${top.marks}/100** (Grade **${top.grade}**).`
    : `**${top.student.fullName}** from **${top.student.classGrade} - Section ${top.student.section}** achieved the ${adjective} score in **${subject}** with **${top.marks}/100** (Grade **${top.grade}**).`;

  const displayCount = Math.min(5, totalCount);
  const topList = ranked.slice(0, displayCount).map((r, i) => ({
    rank: i + 1,
    name: r.student.fullName,
    classGrade: `${r.student.classGrade} - Section ${r.student.section}`,
    rollNumber: r.student.rollNumber,
    metricValue: `${r.marks}/100`,
    grade: r.grade
  }));

  const tableRows = topList.map(t =>
    `| ${t.rank} | **${t.name}** | ${t.classGrade} | \`${t.rollNumber}\` | **${t.metricValue}** | ${t.grade} |`
  ).join('\n');

  const leaderboardHeader = totalCount <= 5
    ? `### 📊 Student Rankings — ${subject} (${totalCount} Students)`
    : `### 📊 Top 5 Leaderboard — ${subject}`;

  const markdownResponse = `### 🏆 ${title}

${executiveSummary}

---

${leaderboardHeader}
| Rank | Student Name | Class & Section | Roll Number | ${subject} Score | Grade |
| :--- | :--- | :--- | :--- | :--- | :--- |
${tableRows}

---
*Verified across all ${totalCount} enrolled student dossiers in the School Ecosystem Database.*`;

  return {
    isHandled: true,
    title,
    executiveSummary,
    topPerformer: {
      name: top.student.fullName,
      classGrade: top.student.classGrade,
      rollNumber: top.student.rollNumber,
      metricLabel: `${subject} Score`,
      metricValue: `${top.marks}/100`,
      grade: top.grade
    },
    leaderboard: topList,
    markdownResponse
  };
}

function handleAttendanceRanking(isLowest: boolean = false): AnalyticsResult {
  const students = schoolDataRepository.getStudents();
  const totalCount = students.length;

  const ranked = [...students].sort((a, b) =>
    isLowest
      ? a.attendance.percentage - b.attendance.percentage
      : b.attendance.percentage - a.attendance.percentage
  );

  const top = ranked[0];
  const direction = isLowest ? 'Lowest Attendance' : 'Best Attendance';

  const executiveSummary = isLowest
    ? `**${top.fullName}** (${top.classGrade}) has the lowest attendance rate at **${top.attendance.percentage}%** (${top.attendance.attendedSessions}/${top.attendance.totalSessions} sessions, Status: *${top.attendance.status}*).`
    : `**${top.fullName}** (${top.classGrade}) holds the highest attendance standing across the school at **${top.attendance.percentage}%** (${top.attendance.attendedSessions}/${top.attendance.totalSessions} sessions, Status: *${top.attendance.status}*).`;

  const top5 = ranked.slice(0, 5).map((s, i) => ({
    rank: i + 1,
    name: s.fullName,
    classGrade: `${s.classGrade} - Section ${s.section}`,
    rollNumber: s.rollNumber,
    metricValue: `${s.attendance.percentage}% (${s.attendance.attendedSessions}/${s.attendance.totalSessions} days)`,
    grade: s.attendance.status
  }));

  const tableRows = top5.map(t =>
    `| ${t.rank} | **${t.name}** | ${t.classGrade} | \`${t.rollNumber}\` | **${t.metricValue}** | *${t.grade}* |`
  ).join('\n');

  const markdownResponse = `### 📅 ${direction} Leaderboard

${executiveSummary}

---

### 📊 Attendance Performance Rankings
| Rank | Student Name | Class & Section | Roll Number | Attendance Record | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
${tableRows}

---
*Verified across all ${totalCount} enrolled student dossiers in the School Ecosystem Database.*`;

  return {
    isHandled: true,
    title: direction,
    executiveSummary,
    leaderboard: top5,
    markdownResponse
  };
}

function handleOverallRanking(isLowest: boolean = false): AnalyticsResult {
  const students = schoolDataRepository.getStudents();
  const totalCount = students.length;

  const ranked = [...students].sort((a, b) =>
    isLowest
      ? a.overallPercentage - b.overallPercentage
      : b.overallPercentage - a.overallPercentage
  );

  const top = ranked[0];
  const title = isLowest ? 'Lowest Overall Academic Score' : 'Overall School Topper (Rank 1)';

  const executiveSummary = isLowest
    ? `**${top.fullName}** (${top.classGrade}) holds the lowest overall average at **${top.overallPercentage}%** (Grade: **${top.overallGrade}**).`
    : `**${top.fullName}** from **${top.classGrade} - Section ${top.section}** is the **School Topper** with an overall score of **${top.overallPercentage}%** (Grade: **${top.overallGrade}**)!`;

  const top5 = ranked.slice(0, 5).map((s, i) => ({
    rank: i + 1,
    name: s.fullName,
    classGrade: `${s.classGrade} - Section ${s.section}`,
    rollNumber: s.rollNumber,
    metricValue: `${s.overallPercentage}%`,
    grade: s.overallGrade
  }));

  const tableRows = top5.map(t =>
    `| ${t.rank} | **${t.name}** | ${t.classGrade} | \`${t.rollNumber}\` | **${t.metricValue}** | **${t.grade}** |`
  ).join('\n');

  const markdownResponse = `### 🎓 ${title}

${executiveSummary}

---

### 🏆 Top 5 Overall Academic Leaders
| Rank | Student Name | Class & Section | Roll Number | Overall Percentage | Grade |
| :--- | :--- | :--- | :--- | :--- | :--- |
${tableRows}

---
*Verified across all ${totalCount} enrolled student dossiers in the School Ecosystem Database.*`;

  return {
    isHandled: true,
    title,
    executiveSummary,
    leaderboard: top5,
    markdownResponse
  };
}
