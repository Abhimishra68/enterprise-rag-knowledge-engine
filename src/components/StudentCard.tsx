import React from 'react';
import { UserCheck, Phone, Mail, MapPin, Award, BookOpen, AlertTriangle, MessageSquare, CheckCircle2 } from 'lucide-react';
import { StudentProfile } from '../types/school';

interface StudentCardProps {
  student: StudentProfile;
}

export const StudentCard: React.FC<StudentCardProps> = ({ student }) => {
  return (
    <div className="my-3 p-5 rounded-2xl glass-panel border border-indigo-500/30 bg-slate-950/90 shadow-2xl text-slate-200 max-w-xl space-y-4 font-sans text-xs">
      {/* Student Profile Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-base text-white shadow-md shadow-indigo-600/30">
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-100">{student.fullName}</h3>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {student.rollNumber}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {student.classGrade} — Section {student.section} • DOB: {student.dob} ({student.gender})
            </p>
          </div>
        </div>

        {/* Overall Percentage Badge */}
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Overall Score</span>
          <span className="text-base font-bold font-mono text-emerald-400">{student.overallPercentage}%</span>
          <span className="text-[10px] text-slate-400 block font-mono">Grade {student.overallGrade}</span>
        </div>
      </div>

      {/* Attendance & Performance Stats Row */}
      <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-indigo-400" />
            Attendance ({student.attendance.percentage}%)
          </span>
          <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">
            {student.attendance.attendedSessions} / {student.attendance.totalSessions} Days
          </p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className={`h-full ${
                student.attendance.percentage >= 80 ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              style={{ width: `${student.attendance.percentage}%` }}
            />
          </div>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
            <Award className="w-3 h-3 text-purple-400" />
            Status & Conduct
          </span>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {student.attendance.status} Student
          </span>
        </div>
      </div>

      {/* 6 Subject Marks Table */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          6-Subject Examination Marks
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {student.subjectMarks.map((sub, idx) => (
            <div key={idx} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-300 truncate pr-1">{sub.subjectName}</span>
              <div className="text-right shrink-0">
                <span className="font-mono font-bold text-[11px] text-indigo-300">{sub.marksObtained}/100</span>
                <span className="text-[9px] font-mono text-slate-400 ml-1">({sub.grade})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Guardian & Contact Card */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
        <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-emerald-400" />
          Guardian & Contact Details
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
          <div>
            <span className="text-slate-400 block text-[10px]">Parents:</span>
            <span>{student.guardian.fatherName} & {student.guardian.motherName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Contact Number:</span>
            <span className="font-mono text-emerald-300">{student.guardian.contactNumber}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-slate-400 block text-[10px]">Residential Address:</span>
            <span className="text-slate-300">{student.guardian.address}</span>
          </div>
        </div>
      </div>

      {/* Teacher Comments */}
      <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-slate-300 space-y-1">
        <span className="text-indigo-300 font-semibold flex items-center gap-1">
          <MessageSquare className="w-3 h-3 text-indigo-400" />
          Teacher Comments:
        </span>
        <p className="italic text-slate-300">"{student.teacherComments}"</p>
      </div>
    </div>
  );
};
