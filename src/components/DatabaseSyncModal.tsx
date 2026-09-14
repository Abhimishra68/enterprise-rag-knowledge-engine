import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  RefreshCw,
  Server,
  Key,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { schoolDataRepository, DatabaseStatus } from '../services/school/schoolDataRepository';
import { loadSchoolDatabaseIntoVectorStore } from '../services/school/schoolRagAdapter';
import { StudentProfile } from '../types/school';

interface DatabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: (newDocsCount: number) => void;
  geminiApiKey?: string;
}

export const DatabaseSyncModal: React.FC<DatabaseSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
  geminiApiKey
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'config' | 'addStudent'>('status');
  const [status, setStatus] = useState<DatabaseStatus>(schoolDataRepository.getDatabaseStatus());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; name: string } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Config State
  const [host, setHost] = useState(status.host || 'localhost');
  const [port, setPort] = useState(status.port || 5432);
  const [database, setDatabase] = useState(status.database || 'school_ecosystem_db');
  const [user, setUser] = useState(status.user || 'postgres');
  const [password, setPassword] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  // New Student State
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    rollNumber: `R-${Math.floor(100 + Math.random() * 900)}`,
    classGrade: 'Class 10',
    section: 'A' as const,
    mathMarks: 85,
    scienceMarks: 90,
    englishMarks: 88,
    sstMarks: 82,
    csMarks: 95,
    langMarks: 80,
    fatherName: '',
    contactNumber: '+91 9876543210',
    comments: 'Diligent and enthusiastic student.'
  });

  useEffect(() => {
    if (isOpen) {
      refreshStatus();
    }
  }, [isOpen]);

  const refreshStatus = async () => {
    const s = await schoolDataRepository.checkStatus();
    setStatus(s);
  };

  const handleSaveConfig = async () => {
    setIsTesting(true);
    setFeedback(null);
    try {
      const res = await schoolDataRepository.updateConfig({
        host,
        port: Number(port),
        database,
        user,
        password
      });

      if (res.success && res.status) {
        setStatus(res.status);
        if (res.status.connected) {
          setFeedback({
            type: 'success',
            message: `Connected to PostgreSQL successfully! Found ${res.status.studentCount} student records.`
          });
        } else {
          setFeedback({
            type: 'error',
            message: res.status.error || 'Failed to connect. Check password and database name.'
          });
        }
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to update configuration.'
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncFromPostgres = async () => {
    setIsSyncing(true);
    setFeedback(null);
    setSyncProgress(null);

    try {
      // 1. Fetch live records from PostgreSQL
      const fetchResult = await schoolDataRepository.fetchFromPostgres();
      if (!fetchResult.success && !fetchResult.isFallback) {
        throw new Error(fetchResult.error || 'Failed to fetch from PostgreSQL');
      }

      // 2. Incrementally index into Vector Store
      const indexResult = await loadSchoolDatabaseIntoVectorStore(
        geminiApiKey,
        1200,
        60,
        (current, total, name) => {
          setSyncProgress({ current, total, name });
        },
        true // incremental
      );

      const count = schoolDataRepository.getStudentCount();
      const statusMsg = fetchResult.isFallback
        ? `Synced ${count} students (Local Fallback mode). Vector store updated with ${indexResult.totalChunksCount} chunks.`
        : `Successfully synced ${count} students live from PostgreSQL! (${indexResult.newlyAddedCount} newly indexed, ${indexResult.totalChunksCount} total vector chunks).`;

      setFeedback({
        type: 'success',
        message: statusMsg
      });

      if (onSyncComplete) {
        onSyncComplete(indexResult.documents.length);
      }
      refreshStatus();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Sync failed: ${err.message}`
      });
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  const handleInitializeTables = async () => {
    setIsTesting(true);
    setFeedback(null);
    try {
      const res = await schoolDataRepository.initDatabase();
      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'PostgreSQL tables initialized and pre-populated with student records!'
        });
        refreshStatus();
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to initialize database tables.'
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.firstName || !newStudent.lastName) {
      setFeedback({ type: 'error', message: 'Please provide first and last name.' });
      return;
    }

    const marks = [
      { subjectName: 'Mathematics' as const, marksObtained: Number(newStudent.mathMarks), maxMarks: 100, grade: 'A' as const },
      { subjectName: 'Science' as const, marksObtained: Number(newStudent.scienceMarks), maxMarks: 100, grade: 'A+' as const },
      { subjectName: 'English' as const, marksObtained: Number(newStudent.englishMarks), maxMarks: 100, grade: 'A' as const },
      { subjectName: 'Social Studies' as const, marksObtained: Number(newStudent.sstMarks), maxMarks: 100, grade: 'A' as const },
      { subjectName: 'Computer Science' as const, marksObtained: Number(newStudent.csMarks), maxMarks: 100, grade: 'A+' as const },
      { subjectName: 'Regional Language' as const, marksObtained: Number(newStudent.langMarks), maxMarks: 100, grade: 'A' as const }
    ];

    const avg = Math.round((marks.reduce((acc, m) => acc + m.marksObtained, 0) / 600) * 1000) / 10;
    const studentId = `STU_${Date.now().toString().slice(-4)}`;

    const fullProfile: StudentProfile = {
      studentId,
      rollNumber: newStudent.rollNumber,
      firstName: newStudent.firstName,
      lastName: newStudent.lastName,
      fullName: `${newStudent.firstName} ${newStudent.lastName}`,
      classGrade: newStudent.classGrade,
      section: newStudent.section,
      dob: '2013-05-15',
      gender: 'Male',
      guardian: {
        fatherName: newStudent.fatherName || `Mr. ${newStudent.lastName}`,
        motherName: `Mrs. ${newStudent.lastName}`,
        contactNumber: newStudent.contactNumber,
        emergencyContact: newStudent.contactNumber,
        email: `${newStudent.firstName.toLowerCase()}.${newStudent.lastName.toLowerCase()}@parents.edu.in`,
        address: 'MG Road, City'
      },
      attendance: {
        totalSessions: 180,
        attendedSessions: 168,
        percentage: 93.3,
        status: 'Excellent'
      },
      subjectMarks: marks,
      overallPercentage: avg,
      overallGrade: avg >= 90 ? 'A+' : avg >= 80 ? 'A' : 'B',
      academicStrengths: ['Problem Solving', 'Leadership'],
      areasForImprovement: ['Exam Preparation'],
      extracurriculars: ['Science Club', 'Robotics'],
      teacherComments: newStudent.comments
    };

    setIsTesting(true);
    setFeedback(null);

    try {
      const res = await schoolDataRepository.insertStudent(fullProfile);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Added "${fullProfile.fullName}" (Roll: ${fullProfile.rollNumber}) to database! Now syncing to vector store...`
        });
        // Auto sync vector store
        await loadSchoolDatabaseIntoVectorStore(geminiApiKey, 1200, 60, undefined, true);
        if (onSyncComplete) onSyncComplete(1);
        // Reset form
        setNewStudent({
          ...newStudent,
          firstName: '',
          lastName: '',
          rollNumber: `R-${Math.floor(100 + Math.random() * 900)}`
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to insert student' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl p-6 border border-indigo-500/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                PostgreSQL School Ecosystem & Live RAG Sync
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Production Mode
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Single source of truth: Dynamic relational database synchronization with vector store
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 mt-4 pb-2 border-b border-slate-800/80">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'status'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Database & Sync Status
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'config'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Connection Settings
          </button>
          <button
            onClick={() => setActiveTab('addStudent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'addStudent'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add New Student Record
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 p-3 rounded-xl flex items-start gap-2.5 text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">{feedback.message}</div>
          </div>
        )}

        {/* Tab 1: Status & Live Sync */}
        {activeTab === 'status' && (
          <div className="mt-4 space-y-4 overflow-y-auto pr-1">
            {/* Live Connection Card */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">PostgreSQL Connection Status</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    status.connected
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      status.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  {status.connected ? 'Connected (Live)' : 'Offline (Local Fallback)'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] uppercase">Active Database</div>
                  <div className="font-mono text-slate-200 truncate mt-0.5 font-semibold">
                    {status.database}
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] uppercase">Host & Port</div>
                  <div className="font-mono text-slate-200 mt-0.5">
                    {status.host}:{status.port}
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] uppercase">Students in DB</div>
                  <div className="font-mono text-indigo-400 mt-0.5 font-bold">
                    {status.connected ? status.studentCount : schoolDataRepository.getStudentCount()}
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] uppercase">Active RAG Store</div>
                  <div className="font-mono text-purple-400 mt-0.5 font-bold">
                    {schoolDataRepository.getStudentCount()} Loaded
                  </div>
                </div>
              </div>

              {!status.connected && (
                <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/10 text-xs text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>PostgreSQL credentials not connected yet.</strong> App is currently serving all 51 student profiles (including Shrishti Kumari) from the local fallback repository. Enter your PostgreSQL password in the <strong>"Connection Settings"</strong> tab to connect live.
                  </div>
                </div>
              )}
            </div>

            {/* Sync Progress Bar if syncing */}
            {syncProgress && (
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                <div className="flex justify-between text-xs text-indigo-300">
                  <span>Indexing {syncProgress.name}...</span>
                  <span className="font-mono font-bold">
                    {syncProgress.current} / {syncProgress.total}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-200"
                    style={{
                      width: `${Math.round((syncProgress.current / syncProgress.total) * 100)}%`
                    }}
                  />
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleSyncFromPostgres}
                disabled={isSyncing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-medium text-xs transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing & Indexing...' : 'Sync & Re-Index from Database'}</span>
              </button>

              <button
                onClick={handleInitializeTables}
                disabled={isTesting || !status.connected}
                className="px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors disabled:opacity-40"
                title="Executes init_postgres_school_db.sql schema and seed data"
              >
                Seed / Reset Schema
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Connection Configuration */}
        {activeTab === 'config' && (
          <div className="mt-4 space-y-4 overflow-y-auto pr-1">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                PostgreSQL Connection Credentials
              </h4>
              <p className="text-xs text-slate-400">
                Configure connection parameters for your local PostgreSQL instance. Credentials are securely stored on the local backend server.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Host</label>
                  <input
                    type="text"
                    value={host}
                    onChange={e => setHost(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="localhost"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={e => setPort(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="5432"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Database Name</label>
                  <input
                    type="text"
                    value={database}
                    onChange={e => setDatabase(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="school_ecosystem_db"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">User</label>
                  <input
                    type="text"
                    value={user}
                    onChange={e => setUser(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="postgres"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    PostgreSQL Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="Enter your local PostgreSQL password..."
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSaveConfig}
                  disabled={isTesting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing Connection...' : 'Test & Save Connection'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Quick Add Student */}
        {activeTab === 'addStudent' && (
          <form onSubmit={handleAddStudentSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                Add Student to Database & RAG
              </h4>
              <p className="text-xs text-slate-400">
                Insert a new student directly into the live relational database. The RAG vector store will incrementally index this record immediately without modifying any TypeScript code.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newStudent.firstName}
                    onChange={e => setNewStudent({ ...newStudent, firstName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Vikram"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newStudent.lastName}
                    onChange={e => setNewStudent({ ...newStudent, lastName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Sharma"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={newStudent.rollNumber}
                    onChange={e => setNewStudent({ ...newStudent, rollNumber: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Class Grade</label>
                  <select
                    value={newStudent.classGrade}
                    onChange={e => setNewStudent({ ...newStudent, classGrade: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Class 10">Class 10</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                    <option value="Class 8">Class 8</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Section</label>
                  <select
                    value={newStudent.section}
                    onChange={e => setNewStudent({ ...newStudent, section: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newStudent.contactNumber}
                    onChange={e => setNewStudent({ ...newStudent, contactNumber: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Subject Marks */}
              <div className="pt-2">
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5 uppercase">
                  Subject Marks (Out of 100)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Maths</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newStudent.mathMarks}
                      onChange={e => setNewStudent({ ...newStudent, mathMarks: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Science</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newStudent.scienceMarks}
                      onChange={e => setNewStudent({ ...newStudent, scienceMarks: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">English</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newStudent.englishMarks}
                      onChange={e => setNewStudent({ ...newStudent, englishMarks: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">SST</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newStudent.sstMarks}
                      onChange={e => setNewStudent({ ...newStudent, sstMarks: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Comp Sci</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newStudent.csMarks}
                      onChange={e => setNewStudent({ ...newStudent, csMarks: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Language</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newStudent.langMarks}
                      onChange={e => setNewStudent({ ...newStudent, langMarks: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isTesting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-medium text-xs shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Insert Student & Sync to RAG</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
