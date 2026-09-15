import { Pool, PoolConfig } from 'pg';
import fs from 'fs';
import path from 'path';
import { StudentProfile, SubjectMark } from '../types/school';

export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
}

const CONFIG_FILE_PATH = path.resolve(process.cwd(), '.postgres-config.json');

export class PostgresService {
  private pool: Pool | null = null;
  private config: PostgresConfig = {
    host: 'localhost',
    port: 5432,
    database: 'school_ecosystem_db',
    user: 'postgres',
    password: ''
  };

  constructor() {
    this.loadConfigFromFile();
  }

  public getConfig(): PostgresConfig {
    // Return config without revealing sensitive password in plaintext if masked
    return { ...this.config };
  }

  public loadConfigFromFile(): void {
    try {
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        this.config = { ...this.config, ...parsed };
      }
    } catch (e) {
      console.warn('[PostgresService] Could not read .postgres-config.json:', e);
    }
  }

  public saveConfig(newConfig: Partial<PostgresConfig>): void {
    this.config = { ...this.config, ...newConfig };
    try {
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(this.config, null, 2), 'utf8');
    } catch (e) {
      console.warn('[PostgresService] Could not save .postgres-config.json:', e);
    }
    // Recreate pool with new config
    this.reconnect();
  }

  private reconnect(): void {
    if (this.pool) {
      this.pool.end().catch(() => {});
      this.pool = null;
    }
  }

  private getPool(): Pool {
    if (!this.pool) {
      const isRemote = this.config.host !== 'localhost' && this.config.host !== '127.0.0.1';
      const poolConfig: PoolConfig = {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password || undefined,
        connectionTimeoutMillis: 8000,
        ssl: isRemote ? { rejectUnauthorized: false } : undefined,
        max: 10
      };
      this.pool = new Pool(poolConfig);
    }
    return this.pool;
  }

  /**
   * Tests connection and counts student rows if the students table exists.
   */
  public async getStatus(): Promise<{
    connected: boolean;
    tablesExist: boolean;
    studentCount: number;
    database: string;
    host: string;
    port: number;
    user: string;
    error?: string;
  }> {
    const pool = this.getPool();
    try {
      const client = await pool.connect();
      try {
        // 1. Check if students table exists
        const tableCheck = await client.query(
          "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'students');"
        );
        const tablesExist = tableCheck.rows[0]?.exists || false;
        let studentCount = 0;

        if (tablesExist) {
          const countRes = await client.query('SELECT COUNT(*) FROM students;');
          studentCount = parseInt(countRes.rows[0]?.count || '0', 10);
        }

        return {
          connected: true,
          tablesExist,
          studentCount,
          database: this.config.database,
          host: this.config.host,
          port: this.config.port,
          user: this.config.user
        };
      } finally {
        client.release();
      }
    } catch (err: any) {
      return {
        connected: false,
        tablesExist: false,
        studentCount: 0,
        database: this.config.database,
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        error: err?.message || String(err)
      };
    }
  }

  /**
   * Fetches all students from the 5 relational tables in PostgreSQL
   * and maps them cleanly to StudentProfile[]
   */
  public async getAllStudents(): Promise<StudentProfile[]> {
    const pool = this.getPool();
    const client = await pool.connect();

    try {
      // 1. Query students with guardian, attendance, teacher_comments
      const studentsQuery = `
        SELECT 
          s.student_id,
          s.roll_number,
          s.first_name,
          s.last_name,
          s.full_name,
          s.class_grade,
          s.section,
          to_char(s.dob, 'YYYY-MM-DD') as dob,
          s.gender,
          s.overall_percentage::float as overall_percentage,
          s.overall_grade,
          g.father_name,
          g.mother_name,
          g.contact_number,
          g.emergency_contact,
          g.email as guardian_email,
          g.address as guardian_address,
          a.total_sessions,
          a.attended_sessions,
          a.attendance_percentage::float as attendance_percentage,
          a.attendance_status,
          t.academic_strengths,
          t.areas_for_improvement,
          t.extracurriculars,
          t.comments as teacher_comments
        FROM students s
        LEFT JOIN guardians g ON s.student_id = g.student_id
        LEFT JOIN attendance_records a ON s.student_id = a.student_id
        LEFT JOIN teacher_comments t ON s.student_id = t.student_id
        ORDER BY s.student_id ASC;
      `;

      const marksQuery = `
        SELECT student_id, subject_name, marks_obtained, max_marks, grade
        FROM subject_marks
        ORDER BY student_id, mark_id ASC;
      `;

      const [studentsRes, marksRes] = await Promise.all([
        client.query(studentsQuery),
        client.query(marksQuery)
      ]);

      // Map marks by student_id
      const marksByStudent = new Map<string, SubjectMark[]>();
      for (const m of marksRes.rows) {
        const sid = m.student_id;
        if (!marksByStudent.has(sid)) {
          marksByStudent.set(sid, []);
        }
        marksByStudent.get(sid)!.push({
          subjectName: m.subject_name,
          marksObtained: Number(m.marks_obtained),
          maxMarks: Number(m.max_marks || 100),
          grade: m.grade
        });
      }

      // Build StudentProfile[]
      const students: StudentProfile[] = studentsRes.rows.map(row => {
        const sid = row.student_id;
        const marks = marksByStudent.get(sid) || [];

        const splitList = (val: string | null): string[] => {
          if (!val) return [];
          return val.split(',').map(s => s.trim()).filter(Boolean);
        };

        return {
          studentId: row.student_id,
          rollNumber: row.roll_number,
          firstName: row.first_name,
          lastName: row.last_name,
          fullName: row.full_name,
          classGrade: row.class_grade,
          section: (row.section as 'A' | 'B' | 'C') || 'A',
          dob: row.dob || '2010-01-01',
          gender: (row.gender as 'Male' | 'Female') || 'Male',
          guardian: {
            fatherName: row.father_name || 'N/A',
            motherName: row.mother_name || 'N/A',
            contactNumber: row.contact_number || 'N/A',
            emergencyContact: row.emergency_contact || 'N/A',
            email: row.guardian_email || 'N/A',
            address: row.guardian_address || 'N/A'
          },
          attendance: {
            totalSessions: Number(row.total_sessions || 180),
            attendedSessions: Number(row.attended_sessions || 0),
            percentage: Number(row.attendance_percentage || 0),
            status: row.attendance_status || 'Good'
          },
          subjectMarks: marks,
          overallPercentage: Number(row.overall_percentage || 0),
          overallGrade: row.overall_grade || 'B',
          academicStrengths: splitList(row.academic_strengths),
          areasForImprovement: splitList(row.areas_for_improvement),
          extracurriculars: splitList(row.extracurriculars),
          teacherComments: row.teacher_comments || ''
        };
      });

      return students;
    } finally {
      client.release();
    }
  }

  /**
   * Inserts a student into all 5 tables in a single transaction
   */
  public async insertStudent(student: StudentProfile): Promise<boolean> {
    const pool = this.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Insert or update student
      await client.query(
        `INSERT INTO students (
          student_id, roll_number, first_name, last_name, full_name, 
          class_grade, section, dob, gender, overall_percentage, overall_grade
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (student_id) DO UPDATE SET
          roll_number = EXCLUDED.roll_number,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          full_name = EXCLUDED.full_name,
          class_grade = EXCLUDED.class_grade,
          section = EXCLUDED.section,
          dob = EXCLUDED.dob,
          gender = EXCLUDED.gender,
          overall_percentage = EXCLUDED.overall_percentage,
          overall_grade = EXCLUDED.overall_grade;`,
        [
          student.studentId,
          student.rollNumber,
          student.firstName,
          student.lastName,
          student.fullName,
          student.classGrade,
          student.section,
          student.dob,
          student.gender,
          student.overallPercentage,
          student.overallGrade
        ]
      );

      // 2. Delete existing child records if re-inserting
      await client.query('DELETE FROM guardians WHERE student_id = $1;', [student.studentId]);
      await client.query('DELETE FROM attendance_records WHERE student_id = $1;', [student.studentId]);
      await client.query('DELETE FROM subject_marks WHERE student_id = $1;', [student.studentId]);
      await client.query('DELETE FROM teacher_comments WHERE student_id = $1;', [student.studentId]);

      // 3. Insert guardian
      const g = student.guardian;
      await client.query(
        `INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address)
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [student.studentId, g.fatherName, g.motherName, g.contactNumber, g.emergencyContact, g.email, g.address]
      );

      // 4. Insert attendance
      const att = student.attendance;
      await client.query(
        `INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status)
         VALUES ($1, $2, $3, $4, $5);`,
        [student.studentId, att.totalSessions, att.attendedSessions, att.percentage, att.status]
      );

      // 5. Insert subject marks
      for (const m of student.subjectMarks) {
        await client.query(
          `INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade)
           VALUES ($1, $2, $3, $4, $5);`,
          [student.studentId, m.subjectName, m.marksObtained, m.maxMarks || 100, m.grade]
        );
      }

      // 6. Insert teacher comments
      await client.query(
        `INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments)
         VALUES ($1, $2, $3, $4, $5);`,
        [
          student.studentId,
          student.academicStrengths.join(', '),
          student.areasForImprovement.join(', '),
          student.extracurriculars.join(', '),
          student.teacherComments
        ]
      );

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Executes the full initialization script from file
   */
  public async initializeDatabase(sqlFilePath?: string): Promise<{ success: boolean; message: string }> {
    const filePath = sqlFilePath || path.resolve(process.cwd(), 'init_postgres_school_db.sql');
    if (!fs.existsSync(filePath)) {
      throw new Error(`Init SQL file not found at: ${filePath}`);
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    const pool = this.getPool();
    const client = await pool.connect();

    try {
      await client.query(sql);
      return { success: true, message: 'Database initialized successfully with schema and tables.' };
    } finally {
      client.release();
    }
  }
}

export const postgresService = new PostgresService();
