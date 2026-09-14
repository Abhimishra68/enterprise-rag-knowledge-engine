export interface GuardianInfo {
  fatherName: string;
  motherName: string;
  contactNumber: string;
  email: string;
  address: string;
  emergencyContact: string;
}

export interface SubjectMark {
  subjectName: 'Mathematics' | 'Science' | 'English' | 'Social Studies' | 'Computer Science' | 'Regional Language';
  marksObtained: number;
  maxMarks: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
}

export interface AttendanceRecord {
  totalSessions: number;
  attendedSessions: number;
  percentage: number;
  status: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement' | 'Critical';
}

export interface StudentProfile {
  studentId: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  classGrade: string; // e.g. "Class 10", "Class 9", "LKG", "UKG", "Class 5", etc.
  section: 'A' | 'B' | 'C';
  dob: string;
  gender: 'Male' | 'Female';
  guardian: GuardianInfo;
  attendance: AttendanceRecord;
  subjectMarks: SubjectMark[];
  overallPercentage: number;
  overallGrade: string;
  academicStrengths: string[];
  areasForImprovement: string[];
  extracurriculars: string[];
  teacherComments: string;
}
