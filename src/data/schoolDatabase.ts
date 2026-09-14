import { StudentProfile } from '../types/school';

/**
 * ============================================================================
 * PRODUCTION ARCHITECTURE NOTICE:
 * Mock in-file student database has been DISABLED and COMMENTED OUT.
 * In a true production architecture, all student records are fetched dynamically
 * from the live PostgreSQL database via API (/api/database/students).
 * ============================================================================
 */
export const SCHOOL_DATABASE: StudentProfile[] = [];

/*
// ============================================================================
// DISABLED IN-FILE MOCK DATABASE (PREVIOUSLY 50 STUDENTS)
// [All mock records commented out to ensure production data integrity]
// ============================================================================

// export const LEGACY_MOCK_STUDENTS: StudentProfile[] = [ ... 50 mock students ... ];
*/
