import { StudentProfile } from '../../types/school';

export interface DatabaseStatus {
  connected: boolean;
  tablesExist: boolean;
  studentCount: number;
  database: string;
  host: string;
  port: number;
  user: string;
  error?: string;
}

type UpdateListener = (students: StudentProfile[]) => void;

export class SchoolDataRepository {
  private students: StudentProfile[] = [];
  private isPostgresActive: boolean = false;
  private lastSyncTime: Date | null = null;
  private listeners: Set<UpdateListener> = new Set();
  private dbStatus: DatabaseStatus = {
    connected: false,
    tablesExist: false,
    studentCount: 0,
    database: 'school_ecosystem_db',
    host: 'localhost',
    port: 5432,
    user: 'postgres'
  };

  constructor() {
    // Auto-sync connection and students in browser context
    if (typeof window !== 'undefined') {
      this.initAsync().catch(() => {});
    }
  }

  public async initAsync(): Promise<void> {
    try {
      const status = await this.checkStatus();
      if (status.connected && status.tablesExist) {
        await this.fetchFromPostgres();
      }
    } catch (e) {
      console.warn('[SchoolDataRepository] Failed to initialize from PostgreSQL:', e);
    }
  }

  public getStudents(): StudentProfile[] {
    return this.students;
  }

  public getStudentCount(): number {
    return this.students.length;
  }

  public isLiveConnected(): boolean {
    return this.isPostgresActive;
  }

  public getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  public getDatabaseStatus(): DatabaseStatus {
    return this.dbStatus;
  }

  public subscribe(listener: UpdateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const copy = [...this.students];
    this.listeners.forEach(cb => {
      try {
        cb(copy);
      } catch (e) {
        console.error('[SchoolDataRepository] Listener error:', e);
      }
    });
  }

  public setStudents(students: StudentProfile[]): void {
    this.students = students;
    this.dbStatus.studentCount = students.length;
    this.notifyListeners();
  }

  /**
   * Checks live PostgreSQL connection status (pure status check, NO mutual recursion)
   */
  public async checkStatus(): Promise<DatabaseStatus> {
    try {
      const res = await fetch('/api/database/status');
      if (res.ok) {
        const data: DatabaseStatus = await res.json();
        this.dbStatus = data;
        this.isPostgresActive = Boolean(data.connected && data.tablesExist);
        return this.dbStatus;
      }
    } catch (err: any) {
      this.dbStatus = {
        ...this.dbStatus,
        connected: false,
        error: err?.message || 'Failed to connect to API'
      };
      this.isPostgresActive = false;
    }
    return this.dbStatus;
  }

  /**
   * Saves or updates PostgreSQL credentials on the server
   */
  public async updateConfig(config: {
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
  }): Promise<{ success: boolean; status?: DatabaseStatus; error?: string }> {
    try {
      const res = await fetch('/api/database/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success && data.status) {
        this.dbStatus = data.status;
        this.isPostgresActive = data.status.connected && data.status.tablesExist;
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Config update failed' };
    }
  }

  /**
   * Fetches latest students from PostgreSQL and updates the in-memory repository (pure fetch, NO recursion)
   */
  public async fetchFromPostgres(): Promise<{
    success: boolean;
    count: number;
    error?: string;
    isFallback?: boolean;
  }> {
    try {
      const res = await fetch('/api/database/students');
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.students)) {
        this.students = data.students;
        this.isPostgresActive = true;
        this.lastSyncTime = new Date();
        this.dbStatus.connected = true;
        this.dbStatus.tablesExist = true;
        this.dbStatus.studentCount = this.students.length;
        this.notifyListeners();
        return {
          success: true,
          count: this.students.length,
          isFallback: false
        };
      } else {
        return {
          success: false,
          count: this.students.length,
          error: 'No student records returned from database.',
          isFallback: true
        };
      }
    } catch (err: any) {
      return {
        success: false,
        count: this.students.length,
        error: err?.message || 'Database sync failed',
        isFallback: true
      };
    }
  }

  /**
   * Quick lookup helper by student name or roll number
   */
  public findStudentByNameOrRoll(query: string): StudentProfile | undefined {
    const cleanQ = query.toLowerCase().trim();
    return this.students.find(
      s =>
        s.fullName.toLowerCase().includes(cleanQ) ||
        s.firstName.toLowerCase() === cleanQ ||
        s.rollNumber.toLowerCase() === cleanQ ||
        s.studentId.toLowerCase() === cleanQ
    );
  }

  /**
   * Inserts a student dynamically into PostgreSQL
   */
  public async insertStudent(student: StudentProfile): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/database/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
      });
      const data = await res.json();
      if (data.success) {
        // Optimistically update local store or re-fetch
        const existingIdx = this.students.findIndex(s => s.studentId === student.studentId);
        if (existingIdx >= 0) {
          this.students[existingIdx] = student;
        } else {
          this.students.push(student);
        }
        this.notifyListeners();
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to insert student' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error inserting student' };
    }
  }

  /**
   * Initializes PostgreSQL schema and data
   */
  public async initDatabase(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/database/init', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        await this.fetchFromPostgres();
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Database initialization failed' };
    }
  }
}

export const schoolDataRepository = new SchoolDataRepository();
