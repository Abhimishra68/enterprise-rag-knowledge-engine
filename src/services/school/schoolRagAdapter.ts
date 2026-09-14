import { StudentProfile } from '../../types/school';
import { ProcessedDocument } from '../../types/rag';
import { chunkDocument } from '../rag/chunker';
import { generateEmbedding } from '../rag/embeddings';
import { vectorStore } from '../rag/vectorStore';
import { schoolDataRepository } from './schoolDataRepository';

/**
 * Converts a StudentProfile entity into a comprehensive RAG Document Text Dossier.
 */
export function convertStudentToDossier(student: StudentProfile): ProcessedDocument {
  const marksSummary = student.subjectMarks
    .map(s => `  - ${s.subjectName}: ${s.marksObtained}/100 (Grade ${s.grade})`)
    .join('\n');

  const dossierText = `STUDENT DOSSIER & ACADEMIC SUMMARY RECORD
==================================================
STUDENT NAME: ${student.fullName}
STUDENT ID: ${student.studentId}
ROLL NUMBER: ${student.rollNumber}
CLASS & SECTION: ${student.classGrade} - Section ${student.section}
GENDER: ${student.gender} | DOB: ${student.dob}

OVERALL ACADEMIC PERFORMANCE:
- Overall Score Percentage: ${student.overallPercentage}%
- Overall Grade: ${student.overallGrade}

ATTENDANCE PERFORMANCE METRICS:
- Total Academic Sessions: ${student.attendance.totalSessions}
- Attended Sessions: ${student.attendance.attendedSessions}
- Attendance Percentage: ${student.attendance.percentage}%
- Attendance Status: ${student.attendance.status}

SUBJECT-WISE MARKS BREAKDOWN (6 SUBJECTS):
${marksSummary}

GUARDIAN & PARENT CONTACT DETAILS:
- Father Name: ${student.guardian.fatherName}
- Mother Name: ${student.guardian.motherName}
- Primary Phone Contact: ${student.guardian.contactNumber}
- Emergency Contact Phone: ${student.guardian.emergencyContact}
- Parent Email: ${student.guardian.email}
- Residential Address: ${student.guardian.address}

TEACHER EVALUATION & SUMMARY COMMENTS:
- Strengths: ${student.academicStrengths.join(', ')}
- Areas for Improvement: ${student.areasForImprovement.join(', ')}
- Extracurriculars: ${student.extracurriculars.join(', ')}
- Teacher Comments: "${student.teacherComments}"
==================================================`;

  return {
    id: `doc_${student.studentId}`,
    name: `Student_Dossier_${student.classGrade.replace(/\s+/g, '_')}_${student.fullName.replace(/\s+/g, '_')}.txt`,
    type: 'text',
    uploadTime: 'School DB Sync',
    totalPages: 1,
    totalChars: dossierText.length,
    pages: [
      {
        pageNumber: 1,
        text: dossierText
      }
    ]
  };
}

/**
 * Index all students from the School Data Repository into the RAG Vector Store.
 * Supports incremental indexing so only newly added students are embedded.
 */
export async function loadSchoolDatabaseIntoVectorStore(
  apiKey?: string,
  chunkSize: number = 1200,
  chunkOverlap: number = 60,
  onProgress?: (current: number, total: number, studentName: string) => void,
  incremental: boolean = true
): Promise<{ documents: ProcessedDocument[]; totalChunksCount: number; newlyAddedCount: number }> {
  const documents: ProcessedDocument[] = [];
  let totalChunksCount = 0;
  let newlyAddedCount = 0;

  const students = schoolDataRepository.getStudents();
  const existingChunks = vectorStore.getAllChunks();
  const existingDocIds = new Set(existingChunks.map(c => c.docId));

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const docId = `doc_${student.studentId}`;

    if (onProgress) {
      onProgress(i + 1, students.length, student.fullName);
    }

    // Check if already indexed
    if (incremental && existingDocIds.has(docId)) {
      const doc = convertStudentToDossier(student);
      const studentChunks = existingChunks.filter(c => c.docId === docId);
      doc.chunksCount = studentChunks.length;
      documents.push(doc);
      totalChunksCount += studentChunks.length;
      continue;
    }

    // If new or forced re-index:
    const doc = convertStudentToDossier(student);
    const chunks = chunkDocument(doc, chunkSize, chunkOverlap);

    for (const chunk of chunks) {
      chunk.keywords = [
        ...(chunk.keywords || []),
        student.firstName.toLowerCase(),
        student.lastName.toLowerCase(),
        student.fullName.toLowerCase(),
        student.classGrade.toLowerCase(),
        student.rollNumber.toLowerCase()
      ];
      chunk.vector = await generateEmbedding(chunk.content, apiKey);
    }

    doc.chunksCount = chunks.length;
    vectorStore.addChunks(chunks);
    documents.push(doc);
    totalChunksCount += chunks.length;
    newlyAddedCount++;
  }

  return { documents, totalChunksCount, newlyAddedCount };
}

/**
 * Quick lookup helper by student name or roll number using dynamic repository
 */
export function findStudentByNameOrRoll(query: string): StudentProfile | undefined {
  return schoolDataRepository.findStudentByNameOrRoll(query);
}

