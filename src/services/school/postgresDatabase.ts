import { generatePostgresInsertSQL } from './postgresSqlGenerator';

export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  connectionString?: string;
}

export class PostgresSchoolDatabaseManager {
  private config: PostgresConfig = {
    host: 'localhost',
    port: 5432,
    database: 'school_ecosystem_db',
    user: 'postgres',
    password: 'password'
  };

  /**
   * Generates the complete 50-student PostgreSQL initialization SQL script.
   */
  public getFullInitializationSQL(): string {
    const schemaSQL = `-- ====================================================================
-- PostgreSQL School Ecosystem Database Initialization Script
-- Tables: students, guardians, subject_marks, attendance_records, teacher_comments
-- Pre-populated with 50 Detailed Student Records (Classes LKG to 12)
-- ====================================================================

DROP TABLE IF EXISTS subject_marks CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS teacher_comments CASCADE;
DROP TABLE IF EXISTS guardians CASCADE;
DROP TABLE IF EXISTS students CASCADE;

CREATE TABLE students (
    student_id VARCHAR(50) PRIMARY KEY,
    roll_number VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    class_grade VARCHAR(20) NOT NULL,
    section CHAR(1) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    overall_percentage NUMERIC(5,2) NOT NULL,
    overall_grade VARCHAR(5) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE guardians (
    guardian_id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(student_id) ON DELETE CASCADE,
    father_name VARCHAR(100) NOT NULL,
    mother_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    emergency_contact VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    address TEXT NOT NULL
);

CREATE TABLE attendance_records (
    attendance_id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(student_id) ON DELETE CASCADE,
    total_sessions INT NOT NULL DEFAULT 180,
    attended_sessions INT NOT NULL,
    attendance_percentage NUMERIC(5,2) NOT NULL,
    attendance_status VARCHAR(30) NOT NULL
);

CREATE TABLE subject_marks (
    mark_id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(student_id) ON DELETE CASCADE,
    subject_name VARCHAR(50) NOT NULL,
    marks_obtained INT NOT NULL,
    max_marks INT DEFAULT 100,
    grade VARCHAR(5) NOT NULL
);

CREATE TABLE teacher_comments (
    comment_id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(student_id) ON DELETE CASCADE,
    academic_strengths TEXT NOT NULL,
    areas_for_improvement TEXT NOT NULL,
    extracurriculars TEXT NOT NULL,
    comments TEXT NOT NULL
);

CREATE INDEX idx_students_class ON students(class_grade);
CREATE INDEX idx_students_name ON students(full_name);
CREATE INDEX idx_subject_student ON subject_marks(student_id);
CREATE INDEX idx_guardians_student ON guardians(student_id);
\n`;

    return schemaSQL + generatePostgresInsertSQL();
  }

  /**
   * Returns sample SQL queries for PostgreSQL inspection
   */
  public getSamplePostgresQueries(): { title: string; sql: string }[] {
    return [
      {
        title: 'Get Full Student Dossier with Guardian & Marks (Join 5 Tables)',
        sql: `SELECT s.full_name, s.class_grade, s.roll_number, s.overall_percentage, g.father_name, g.contact_number, g.address, a.attendance_percentage 
FROM students s 
JOIN guardians g ON s.student_id = g.student_id 
JOIN attendance_records a ON s.student_id = a.student_id 
WHERE s.full_name ILIKE '%Aarav Sharma%';`
      },
      {
        title: 'Get 6 Subject Marks Breakdown for a Student',
        sql: `SELECT subject_name, marks_obtained, grade 
FROM subject_marks 
WHERE student_id = 'STU_1001' 
ORDER BY marks_obtained DESC;`
      },
      {
        title: 'Find Low Attendance Students (< 80%) Across All Classes',
        sql: `SELECT s.full_name, s.class_grade, a.attended_sessions, a.total_sessions, a.attendance_percentage, g.contact_number 
FROM students s 
JOIN attendance_records a ON s.student_id = a.student_id 
JOIN guardians g ON s.student_id = g.student_id 
WHERE a.attendance_percentage < 80 
ORDER BY a.attendance_percentage ASC;`
      },
      {
        title: 'Top 5 Academic Performers in Class 10',
        sql: `SELECT full_name, class_grade, overall_percentage, overall_grade 
FROM students 
WHERE class_grade = 'Class 10' 
ORDER BY overall_percentage DESC 
LIMIT 5;`
      }
    ];
  }
}

export const postgresDbManager = new PostgresSchoolDatabaseManager();
