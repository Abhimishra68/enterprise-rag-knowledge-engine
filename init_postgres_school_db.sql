-- ====================================================================
-- PostgreSQL School Ecosystem Database Initialization Script
-- Tables: students, guardians, subject_marks, attendance_records, teacher_comments
-- Pre-populated with ALL 50 Detailed Student Records (Classes LKG to 12)
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

-- ====================================================================
-- ALL 50 STUDENT RECORDS INSERT STATEMENTS FOR POSTGRESQL
-- ====================================================================

-- Record 1: Aarav Verma (Class 10)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1001', 'R-101', 'Aarav', 'Verma', 'Aarav Verma', 'Class 10', 'B', '2013-02-15', 'Male', 62, 'B');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1001', 'Mr. Aarav Senior Verma', 'Mrs. Sunita Verma', '+91 9853183598', '+91 9792258001', 'aarav.verma@parents.edu.in', 'Flat 619, Park Street, Delhi');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1001', 180, 175, 97.2, 'Excellent');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1001', 'Mathematics', 59, 100, 'C');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1001', 'Science', 57, 100, 'C');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1001', 'English', 66, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1001', 'Social Studies', 61, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1001', 'Computer Science', 63, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1001', 'Regional Language', 66, 100, 'B');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1001', 'Creative Writing, Public Speaking', 'Handwriting & Formatting', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Aarav demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 2: Ananya Patel (Class 10)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1002', 'R-102', 'Ananya', 'Patel', 'Ananya Patel', 'Class 10', 'C', '2014-03-15', 'Female', 90.8, 'A+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1002', 'Mr. Ananya Senior Patel', 'Mrs. Sunita Patel', '+91 9818006058', '+91 9769135946', 'ananya.patel@parents.edu.in', 'Flat 122, Civil Lines, Bengaluru');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1002', 180, 129, 71.7, 'Average');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1002', 'Mathematics', 84, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1002', 'Science', 90, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1002', 'English', 85, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1002', 'Social Studies', 98, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1002', 'Computer Science', 93, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1002', 'Regional Language', 95, 100, 'A+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1002', 'Logical Thinking, Laboratory Experiments', 'Consistent Class Participation', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Ananya is an exemplary student with high analytical acumen and strong leadership skills.');

-- Record 3: Rohan Singh (Class 10)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1003', 'R-103', 'Rohan', 'Singh', 'Rohan Singh', 'Class 10', 'A', '2015-04-15', 'Male', 73.2, 'B+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1003', 'Mr. Rohan Senior Singh', 'Mrs. Sunita Singh', '+91 9886649416', '+91 9767031418', 'rohan.singh@parents.edu.in', 'Flat 717, Brigade Road, Hyderabad');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1003', 180, 179, 99.4, 'Excellent');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1003', 'Mathematics', 70, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1003', 'Science', 78, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1003', 'English', 74, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1003', 'Social Studies', 75, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1003', 'Computer Science', 70, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1003', 'Regional Language', 72, 100, 'B+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1003', 'Public Speaking, Coding & Robotics', 'Proofreading Answers', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Rohan demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 4: Priya Gupta (Class 10)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1004', 'R-104', 'Priya', 'Gupta', 'Priya Gupta', 'Class 10', 'B', '2016-05-15', 'Female', 61.3, 'B');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1004', 'Mr. Priya Senior Gupta', 'Mrs. Sunita Gupta', '+91 9895889538', '+91 9751607680', 'priya.gupta@parents.edu.in', 'Flat 616, GC Avenue, Pune');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1004', 180, 148, 82.2, 'Good');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1004', 'Mathematics', 60, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1004', 'Science', 54, 100, 'C');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1004', 'English', 64, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1004', 'Social Studies', 66, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1004', 'Computer Science', 59, 100, 'C');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1004', 'Regional Language', 65, 100, 'B');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1004', 'Laboratory Experiments, Team Leadership', 'Focus in Afternoon Sessions', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Priya demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 5: Vivaan Mehta (Class 10)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1005', 'R-105', 'Vivaan', 'Mehta', 'Vivaan Mehta', 'Class 10', 'C', '2017-06-15', 'Male', 77.7, 'B+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1005', 'Mr. Vivaan Senior Mehta', 'Mrs. Sunita Mehta', '+91 9828900295', '+91 9785669272', 'vivaan.mehta@parents.edu.in', 'Flat 202, Indiranagar 10th Main, Kolkata');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1005', 180, 156, 86.7, 'Good');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1005', 'Mathematics', 74, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1005', 'Science', 86, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1005', 'English', 76, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1005', 'Social Studies', 83, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1005', 'Computer Science', 69, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1005', 'Regional Language', 78, 100, 'B+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1005', 'Coding & Robotics, Analytical Problem Solving', 'Time Management in Exams', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Vivaan demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 6: Diya Joshi (Class 10)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1006', 'R-106', 'Diya', 'Joshi', 'Diya Joshi', 'Class 10', 'A', '2018-07-15', 'Female', 94.8, 'A+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1006', 'Mr. Diya Senior Joshi', 'Mrs. Sunita Joshi', '+91 9851248591', '+91 9795713698', 'diya.joshi@parents.edu.in', 'Flat 213, Koramangala 4th Block, Ahmedabad');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1006', 180, 145, 80.6, 'Good');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1006', 'Mathematics', 92, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1006', 'Science', 96, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1006', 'English', 100, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1006', 'Social Studies', 95, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1006', 'Computer Science', 93, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1006', 'Regional Language', 93, 100, 'A+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1006', 'Team Leadership, Creative Writing', 'Handwriting & Formatting', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Diya is an exemplary student with high analytical acumen and strong leadership skills.');

-- Record 7: Aditya Rao (Class 10)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1007', 'R-107', 'Aditya', 'Rao', 'Aditya Rao', 'Class 10', 'B', '2019-08-15', 'Male', 85.3, 'A');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1007', 'Mr. Aditya Senior Rao', 'Mrs. Sunita Rao', '+91 9814174972', '+91 9713823368', 'aditya.rao@parents.edu.in', 'Flat 511, Sector 15, Jaipur');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1007', 180, 168, 93.3, 'Excellent');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1007', 'Mathematics', 90, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1007', 'Science', 88, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1007', 'English', 92, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1007', 'Social Studies', 81, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1007', 'Computer Science', 79, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1007', 'Regional Language', 82, 100, 'A');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1007', 'Analytical Problem Solving, Logical Thinking', 'Consistent Class Participation', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Aditya is an exemplary student with high analytical acumen and strong leadership skills.');

-- Record 8: Isha Kumar (Class 10)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1008', 'R-108', 'Isha', 'Kumar', 'Isha Kumar', 'Class 10', 'C', '2012-09-15', 'Female', 80.2, 'A');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1008', 'Mr. Isha Senior Kumar', 'Mrs. Sunita Kumar', '+91 9842747488', '+91 9780006100', 'isha.kumar@parents.edu.in', 'Flat 159, Mayur Vihar, Mumbai');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1008', 180, 135, 75, 'Average');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1008', 'Mathematics', 82, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1008', 'Science', 79, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1008', 'English', 76, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1008', 'Social Studies', 77, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1008', 'Computer Science', 87, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1008', 'Regional Language', 80, 100, 'A');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1008', 'Creative Writing, Public Speaking', 'Proofreading Answers', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Isha demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 9: Vihaan Reddy (Class 10)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1009', 'R-109', 'Vihaan', 'Reddy', 'Vihaan Reddy', 'Class 10', 'A', '2013-01-15', 'Male', 72.2, 'B+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1009', 'Mr. Vihaan Senior Reddy', 'Mrs. Sunita Reddy', '+91 9889320435', '+91 9716651409', 'vihaan.reddy@parents.edu.in', 'Flat 162, Jubilee Hills, Delhi');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1009', 180, 167, 92.8, 'Excellent');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1009', 'Mathematics', 71, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1009', 'Science', 72, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1009', 'English', 73, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1009', 'Social Studies', 80, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1009', 'Computer Science', 69, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1009', 'Regional Language', 68, 100, 'B');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1009', 'Logical Thinking, Laboratory Experiments', 'Focus in Afternoon Sessions', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Vihaan demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 10: Kavya Chawla (Class 10)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1010', 'R-110', 'Kavya', 'Chawla', 'Kavya Chawla', 'Class 10', 'B', '2014-02-15', 'Female', 81.3, 'A');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1010', 'Mr. Kavya Senior Chawla', 'Mrs. Sunita Chawla', '+91 9815240797', '+91 9772478060', 'kavya.chawla@parents.edu.in', 'Flat 310, MG Road, Bengaluru');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1010', 180, 176, 97.8, 'Excellent');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1010', 'Mathematics', 88, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1010', 'Science', 74, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1010', 'English', 84, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1010', 'Social Studies', 82, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1010', 'Computer Science', 87, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1010', 'Regional Language', 73, 100, 'B+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1010', 'Public Speaking, Coding & Robotics', 'Time Management in Exams', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Kavya demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 11: Kabir Deshmukh (Class 9)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1011', 'R-111', 'Kabir', 'Deshmukh', 'Kabir Deshmukh', 'Class 9', 'C', '2015-03-15', 'Male', 73.3, 'B+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1011', 'Mr. Kabir Senior Deshmukh', 'Mrs. Sunita Deshmukh', '+91 9824446919', '+91 9745951049', 'kabir.deshmukh@parents.edu.in', 'Flat 523, Park Street, Hyderabad');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1011', 180, 176, 97.8, 'Excellent');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1011', 'Mathematics', 73, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1011', 'Science', 69, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1011', 'English', 71, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1011', 'Social Studies', 73, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1011', 'Computer Science', 79, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1011', 'Regional Language', 75, 100, 'B+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1011', 'Laboratory Experiments, Team Leadership', 'Handwriting & Formatting', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Kabir demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 12: Sanya Nair (Class 9)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1012', 'R-112', 'Sanya', 'Nair', 'Sanya Nair', 'Class 9', 'A', '2016-04-15', 'Female', 88.2, 'A');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1012', 'Mr. Sanya Senior Nair', 'Mrs. Sunita Nair', '+91 9865040522', '+91 9783727303', 'sanya.nair@parents.edu.in', 'Flat 527, Civil Lines, Pune');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1012', 180, 156, 86.7, 'Good');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1012', 'Mathematics', 83, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1012', 'Science', 88, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1012', 'English', 93, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1012', 'Social Studies', 90, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1012', 'Computer Science', 82, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1012', 'Regional Language', 93, 100, 'A+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1012', 'Coding & Robotics, Analytical Problem Solving', 'Consistent Class Participation', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Sanya is an exemplary student with high analytical acumen and strong leadership skills.');

-- Record 13: Arjun Agarwal (Class 9)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1013', 'R-113', 'Arjun', 'Agarwal', 'Arjun Agarwal', 'Class 9', 'B', '2017-05-15', 'Male', 87.2, 'A');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1013', 'Mr. Arjun Senior Agarwal', 'Mrs. Sunita Agarwal', '+91 9887597928', '+91 9767914074', 'arjun.agarwal@parents.edu.in', 'Flat 744, Brigade Road, Kolkata');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1013', 180, 155, 86.1, 'Good');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1013', 'Mathematics', 82, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1013', 'Science', 83, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1013', 'English', 90, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1013', 'Social Studies', 90, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1013', 'Computer Science', 91, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1013', 'Regional Language', 87, 100, 'A');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1013', 'Team Leadership, Creative Writing', 'Proofreading Answers', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Arjun is an exemplary student with high analytical acumen and strong leadership skills.');

-- Record 14: Riya Bhatia (Class 9)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1014', 'R-114', 'Riya', 'Bhatia', 'Riya Bhatia', 'Class 9', 'C', '2018-06-15', 'Female', 75.8, 'B+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1014', 'Mr. Riya Senior Bhatia', 'Mrs. Sunita Bhatia', '+91 9812205273', '+91 9763917480', 'riya.bhatia@parents.edu.in', 'Flat 168, GC Avenue, Ahmedabad');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1014', 180, 176, 97.8, 'Excellent');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1014', 'Mathematics', 86, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1014', 'Science', 74, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1014', 'English', 72, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1014', 'Social Studies', 71, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1014', 'Computer Science', 71, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1014', 'Regional Language', 81, 100, 'A');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1014', 'Analytical Problem Solving, Logical Thinking', 'Focus in Afternoon Sessions', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Riya demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 15: Dev Shah (Class 9)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1015', 'R-115', 'Dev', 'Shah', 'Dev Shah', 'Class 9', 'A', '2019-07-15', 'Male', 63.2, 'B');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1015', 'Mr. Dev Senior Shah', 'Mrs. Sunita Shah', '+91 9828192777', '+91 9761398590', 'dev.shah@parents.edu.in', 'Flat 733, Indiranagar 10th Main, Jaipur');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1015', 180, 152, 84.4, 'Good');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1015', 'Mathematics', 56, 100, 'C');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1015', 'Science', 69, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1015', 'English', 64, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1015', 'Social Studies', 70, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1015', 'Computer Science', 58, 100, 'C');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1015', 'Regional Language', 62, 100, 'B');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1015', 'Creative Writing, Public Speaking', 'Time Management in Exams', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Dev demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 16: Meera Kapoor (Class 9)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1016', 'R-116', 'Meera', 'Kapoor', 'Meera Kapoor', 'Class 9', 'B', '2012-08-15', 'Female', 91.7, 'A+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1016', 'Mr. Meera Senior Kapoor', 'Mrs. Sunita Kapoor', '+91 9894658654', '+91 9798834201', 'meera.kapoor@parents.edu.in', 'Flat 135, Koramangala 4th Block, Mumbai');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1016', 180, 165, 91.7, 'Good');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1016', 'Mathematics', 88, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1016', 'Science', 88, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1016', 'English', 100, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1016', 'Social Studies', 100, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1016', 'Computer Science', 85, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1016', 'Regional Language', 89, 100, 'A');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1016', 'Logical Thinking, Laboratory Experiments', 'Handwriting & Formatting', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Meera is an exemplary student with high analytical acumen and strong leadership skills.');

-- Record 17: Krishna Malhotra (Class 9)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1017', 'R-117', 'Krishna', 'Malhotra', 'Krishna Malhotra', 'Class 9', 'C', '2013-09-15', 'Male', 90, 'A+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1017', 'Mr. Krishna Senior Malhotra', 'Mrs. Sunita Malhotra', '+91 9874183993', '+91 9723704641', 'krishna.malhotra@parents.edu.in', 'Flat 238, Sector 15, Delhi');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1017', 180, 167, 92.8, 'Excellent');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1017', 'Mathematics', 84, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1017', 'Science', 90, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1017', 'English', 95, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1017', 'Social Studies', 92, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1017', 'Computer Science', 83, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1017', 'Regional Language', 96, 100, 'A+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1017', 'Public Speaking, Coding & Robotics', 'Consistent Class Participation', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Krishna is an exemplary student with high analytical acumen and strong leadership skills.');

-- Record 18: Tanvi Sinha (Class 9)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1018', 'R-118', 'Tanvi', 'Sinha', 'Tanvi Sinha', 'Class 9', 'A', '2014-01-15', 'Female', 88.7, 'A');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1018', 'Mr. Tanvi Senior Sinha', 'Mrs. Sunita Sinha', '+91 9818444440', '+91 9785904313', 'tanvi.sinha@parents.edu.in', 'Flat 259, Mayur Vihar, Bengaluru');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1018', 180, 134, 74.4, 'Average');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1018', 'Mathematics', 86, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1018', 'Science', 83, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1018', 'English', 83, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1018', 'Social Studies', 87, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1018', 'Computer Science', 97, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1018', 'Regional Language', 96, 100, 'A+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1018', 'Laboratory Experiments, Team Leadership', 'Proofreading Answers', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Tanvi is an exemplary student with high analytical acumen and strong leadership skills.');

-- Record 19: Ishaan Choudhury (Class 9)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1019', 'R-119', 'Ishaan', 'Choudhury', 'Ishaan Choudhury', 'Class 9', 'B', '2015-02-15', 'Male', 91.3, 'A+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1019', 'Mr. Ishaan Senior Choudhury', 'Mrs. Sunita Choudhury', '+91 9833705706', '+91 9747485770', 'ishaan.choudhury@parents.edu.in', 'Flat 116, Jubilee Hills, Hyderabad');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1019', 180, 141, 78.3, 'Average');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1019', 'Mathematics', 95, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1019', 'Science', 82, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1019', 'English', 94, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1019', 'Social Studies', 97, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1019', 'Computer Science', 93, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1019', 'Regional Language', 87, 100, 'A');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1019', 'Coding & Robotics, Analytical Problem Solving', 'Focus in Afternoon Sessions', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Ishaan is an exemplary student with high analytical acumen and strong leadership skills.');

-- Record 20: Neha Sharma (Class 9)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1020', 'R-120', 'Neha', 'Sharma', 'Neha Sharma', 'Class 9', 'C', '2016-03-15', 'Female', 64.2, 'B');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1020', 'Mr. Neha Senior Sharma', 'Mrs. Sunita Sharma', '+91 9843604121', '+91 9755394524', 'neha.sharma@parents.edu.in', 'Flat 219, MG Road, Pune');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1020', 180, 155, 86.1, 'Good');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1020', 'Mathematics', 60, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1020', 'Science', 68, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1020', 'English', 56, 100, 'C');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1020', 'Social Studies', 65, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1020', 'Computer Science', 65, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1020', 'Regional Language', 71, 100, 'B+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1020', 'Team Leadership, Creative Writing', 'Time Management in Exams', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Neha demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 21: Ayush Verma (Class 8)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1021', 'R-121', 'Ayush', 'Verma', 'Ayush Verma', 'Class 8', 'A', '2017-04-15', 'Male', 63.8, 'B');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1021', 'Mr. Ayush Senior Verma', 'Mrs. Sunita Verma', '+91 9815588142', '+91 9737698142', 'ayush.verma@parents.edu.in', 'Flat 725, Park Street, Kolkata');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1021', 180, 144, 80, 'Good');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1021', 'Mathematics', 54, 100, 'C');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1021', 'Science', 59, 100, 'C');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1021', 'English', 70, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1021', 'Social Studies', 60, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1021', 'Computer Science', 71, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1021', 'Regional Language', 69, 100, 'B');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1021', 'Analytical Problem Solving, Logical Thinking', 'Handwriting & Formatting', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Ayush demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 22: Pooja Patel (Class 8)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1022', 'R-122', 'Pooja', 'Patel', 'Pooja Patel', 'Class 8', 'B', '2018-05-15', 'Female', 78.5, 'B+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1022', 'Mr. Pooja Senior Patel', 'Mrs. Sunita Patel', '+91 9856784953', '+91 9745150365', 'pooja.patel@parents.edu.in', 'Flat 348, Civil Lines, Ahmedabad');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1022', 180, 151, 83.9, 'Good');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1022', 'Mathematics', 82, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1022', 'Science', 83, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1022', 'English', 75, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1022', 'Social Studies', 84, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1022', 'Computer Science', 73, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1022', 'Regional Language', 74, 100, 'B+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1022', 'Creative Writing, Public Speaking', 'Consistent Class Participation', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Pooja demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 23: Yash Singh (Class 8)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1023', 'R-123', 'Yash', 'Singh', 'Yash Singh', 'Class 8', 'C', '2019-06-15', 'Male', 85.8, 'A');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1023', 'Mr. Yash Senior Singh', 'Mrs. Sunita Singh', '+91 9818625643', '+91 9799859317', 'yash.singh@parents.edu.in', 'Flat 403, Brigade Road, Jaipur');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1023', 180, 158, 87.8, 'Good');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1023', 'Mathematics', 91, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1023', 'Science', 79, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1023', 'English', 93, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1023', 'Social Studies', 79, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1023', 'Computer Science', 80, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1023', 'Regional Language', 93, 100, 'A+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1023', 'Logical Thinking, Laboratory Experiments', 'Proofreading Answers', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Yash is an exemplary student with high analytical acumen and strong leadership skills.');

-- Record 24: Shruti Gupta (Class 8)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1024', 'R-124', 'Shruti', 'Gupta', 'Shruti Gupta', 'Class 8', 'A', '2012-07-15', 'Female', 75.3, 'B+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1024', 'Mr. Shruti Senior Gupta', 'Mrs. Sunita Gupta', '+91 9869861639', '+91 9785402441', 'shruti.gupta@parents.edu.in', 'Flat 637, GC Avenue, Mumbai');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1024', 180, 158, 87.8, 'Good');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1024', 'Mathematics', 71, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1024', 'Science', 80, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1024', 'English', 73, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1024', 'Social Studies', 76, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1024', 'Computer Science', 81, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1024', 'Regional Language', 71, 100, 'B+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1024', 'Public Speaking, Coding & Robotics', 'Focus in Afternoon Sessions', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Shruti demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 25: Siddharth Mehta (Class 8)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1025', 'R-125', 'Siddharth', 'Mehta', 'Siddharth Mehta', 'Class 8', 'B', '2013-08-15', 'Male', 65.2, 'B');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1025', 'Mr. Siddharth Senior Mehta', 'Mrs. Sunita Mehta', '+91 9824889569', '+91 9791952198', 'siddharth.mehta@parents.edu.in', 'Flat 389, Indiranagar 10th Main, Delhi');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1025', 180, 143, 79.4, 'Average');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1025', 'Mathematics', 72, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1025', 'Science', 65, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1025', 'English', 61, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1025', 'Social Studies', 75, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1025', 'Computer Science', 60, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1025', 'Regional Language', 58, 100, 'C');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1025', 'Laboratory Experiments, Team Leadership', 'Time Management in Exams', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Siddharth demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 26: Avani Joshi (Class 8)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1026', 'R-126', 'Avani', 'Joshi', 'Avani Joshi', 'Class 8', 'C', '2014-09-15', 'Female', 88.8, 'A');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1026', 'Mr. Avani Senior Joshi', 'Mrs. Sunita Joshi', '+91 9825911707', '+91 9719578406', 'avani.joshi@parents.edu.in', 'Flat 601, Koramangala 4th Block, Bengaluru');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1026', 180, 129, 71.7, 'Average');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1026', 'Mathematics', 82, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1026', 'Science', 89, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1026', 'English', 83, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1026', 'Social Studies', 92, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1026', 'Computer Science', 96, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1026', 'Regional Language', 91, 100, 'A+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1026', 'Coding & Robotics, Analytical Problem Solving', 'Handwriting & Formatting', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Avani is an exemplary student with high analytical acumen and strong leadership skills.');

-- Record 27: Dhruv Rao (Class 8)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1027', 'R-127', 'Dhruv', 'Rao', 'Dhruv Rao', 'Class 8', 'A', '2015-01-15', 'Male', 72.5, 'B+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1027', 'Mr. Dhruv Senior Rao', 'Mrs. Sunita Rao', '+91 9811487639', '+91 9716945117', 'dhruv.rao@parents.edu.in', 'Flat 472, Sector 15, Hyderabad');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1027', 180, 180, 100, 'Excellent');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1027', 'Mathematics', 78, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1027', 'Science', 67, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1027', 'English', 64, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1027', 'Social Studies', 74, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1027', 'Computer Science', 72, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1027', 'Regional Language', 80, 100, 'A');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1027', 'Team Leadership, Creative Writing', 'Consistent Class Participation', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Dhruv demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 28: Bhavya Kumar (Class 8)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1028', 'R-128', 'Bhavya', 'Kumar', 'Bhavya Kumar', 'Class 8', 'B', '2016-02-15', 'Female', 75.3, 'B+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1028', 'Mr. Bhavya Senior Kumar', 'Mrs. Sunita Kumar', '+91 9882884407', '+91 9793003836', 'bhavya.kumar@parents.edu.in', 'Flat 718, Mayur Vihar, Pune');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1028', 180, 149, 82.8, 'Good');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1028', 'Mathematics', 73, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1028', 'Science', 77, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1028', 'English', 74, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1028', 'Social Studies', 73, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1028', 'Computer Science', 80, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1028', 'Regional Language', 75, 100, 'B+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1028', 'Analytical Problem Solving, Logical Thinking', 'Proofreading Answers', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Bhavya demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 29: Varun Reddy (Class 5)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1029', 'R-129', 'Varun', 'Reddy', 'Varun Reddy', 'Class 5', 'C', '2017-03-15', 'Male', 82.5, 'A');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1029', 'Mr. Varun Senior Reddy', 'Mrs. Sunita Reddy', '+91 9832058178', '+91 9796588285', 'varun.reddy@parents.edu.in', 'Flat 320, Jubilee Hills, Kolkata');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1029', 180, 175, 97.2, 'Excellent');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1029', 'Mathematics', 83, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1029', 'Science', 83, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1029', 'English', 82, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1029', 'Social Studies', 82, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1029', 'Computer Science', 83, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1029', 'Regional Language', 82, 100, 'A');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1029', 'Creative Writing, Public Speaking', 'Focus in Afternoon Sessions', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Varun demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 30: Anika Chawla (Class 5)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1030', 'R-130', 'Anika', 'Chawla', 'Anika Chawla', 'Class 5', 'A', '2018-04-15', 'Female', 93.3, 'A+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1030', 'Mr. Anika Senior Chawla', 'Mrs. Sunita Chawla', '+91 9839667401', '+91 9740625225', 'anika.chawla@parents.edu.in', 'Flat 729, MG Road, Ahmedabad');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1030', 180, 176, 97.8, 'Excellent');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1030', 'Mathematics', 97, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1030', 'Science', 97, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1030', 'English', 88, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1030', 'Social Studies', 96, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1030', 'Computer Science', 85, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1030', 'Regional Language', 97, 100, 'A+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1030', 'Logical Thinking, Laboratory Experiments', 'Time Management in Exams', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Anika is an exemplary student with high analytical acumen and strong leadership skills.');

-- Record 31: Karan Deshmukh (Class 5)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1031', 'R-131', 'Karan', 'Deshmukh', 'Karan Deshmukh', 'Class 5', 'B', '2019-05-15', 'Male', 87.8, 'A');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1031', 'Mr. Karan Senior Deshmukh', 'Mrs. Sunita Deshmukh', '+91 9842839389', '+91 9744064820', 'karan.deshmukh@parents.edu.in', 'Flat 181, Park Street, Jaipur');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1031', 180, 147, 81.7, 'Good');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1031', 'Mathematics', 90, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1031', 'Science', 88, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1031', 'English', 79, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1031', 'Social Studies', 90, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1031', 'Computer Science', 90, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1031', 'Regional Language', 90, 100, 'A+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1031', 'Public Speaking, Coding & Robotics', 'Handwriting & Formatting', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Karan is an exemplary student with high analytical acumen and strong leadership skills.');

-- Record 32: Tara Nair (Class 5)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1032', 'R-132', 'Tara', 'Nair', 'Tara Nair', 'Class 5', 'C', '2012-06-15', 'Female', 85.3, 'A');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1032', 'Mr. Tara Senior Nair', 'Mrs. Sunita Nair', '+91 9842581063', '+91 9796507222', 'tara.nair@parents.edu.in', 'Flat 459, Civil Lines, Mumbai');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1032', 180, 140, 77.8, 'Average');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1032', 'Mathematics', 80, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1032', 'Science', 86, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1032', 'English', 91, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1032', 'Social Studies', 89, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1032', 'Computer Science', 88, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1032', 'Regional Language', 78, 100, 'B+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1032', 'Laboratory Experiments, Team Leadership', 'Consistent Class Participation', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Tara is an exemplary student with high analytical acumen and strong leadership skills.');

-- Record 33: Manav Agarwal (Class 5)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1033', 'R-133', 'Manav', 'Agarwal', 'Manav Agarwal', 'Class 5', 'A', '2013-07-15', 'Male', 82.2, 'A');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1033', 'Mr. Manav Senior Agarwal', 'Mrs. Sunita Agarwal', '+91 9830704213', '+91 9743854362', 'manav.agarwal@parents.edu.in', 'Flat 669, Brigade Road, Delhi');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1033', 180, 133, 73.9, 'Average');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1033', 'Mathematics', 86, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1033', 'Science', 85, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1033', 'English', 81, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1033', 'Social Studies', 76, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1033', 'Computer Science', 83, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1033', 'Regional Language', 82, 100, 'A');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1033', 'Coding & Robotics, Analytical Problem Solving', 'Proofreading Answers', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Manav demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 34: Khushi Bhatia (Class 5)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1034', 'R-134', 'Khushi', 'Bhatia', 'Khushi Bhatia', 'Class 5', 'B', '2014-08-15', 'Female', 82.7, 'A');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1034', 'Mr. Khushi Senior Bhatia', 'Mrs. Sunita Bhatia', '+91 9853473129', '+91 9738672582', 'khushi.bhatia@parents.edu.in', 'Flat 752, GC Avenue, Bengaluru');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1034', 180, 142, 78.9, 'Average');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1034', 'Mathematics', 80, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1034', 'Science', 81, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1034', 'English', 77, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1034', 'Social Studies', 94, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1034', 'Computer Science', 80, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1034', 'Regional Language', 84, 100, 'A');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1034', 'Team Leadership, Creative Writing', 'Focus in Afternoon Sessions', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Khushi demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 35: Pranav Shah (Class 5)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1035', 'R-135', 'Pranav', 'Shah', 'Pranav Shah', 'Class 5', 'C', '2015-09-15', 'Male', 68.2, 'B');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1035', 'Mr. Pranav Senior Shah', 'Mrs. Sunita Shah', '+91 9884342482', '+91 9789162655', 'pranav.shah@parents.edu.in', 'Flat 787, Indiranagar 10th Main, Hyderabad');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1035', 180, 152, 84.4, 'Good');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1035', 'Mathematics', 77, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1035', 'Science', 61, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1035', 'English', 64, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1035', 'Social Studies', 65, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1035', 'Computer Science', 77, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1035', 'Regional Language', 65, 100, 'B');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1035', 'Analytical Problem Solving, Logical Thinking', 'Time Management in Exams', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Pranav demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 36: Nisha Kapoor (Class 4)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1036', 'R-136', 'Nisha', 'Kapoor', 'Nisha Kapoor', 'Class 4', 'A', '2016-01-15', 'Female', 66.5, 'B');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1036', 'Mr. Nisha Senior Kapoor', 'Mrs. Sunita Kapoor', '+91 9866986249', '+91 9791388679', 'nisha.kapoor@parents.edu.in', 'Flat 621, Koramangala 4th Block, Pune');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1036', 180, 155, 86.1, 'Good');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1036', 'Mathematics', 69, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1036', 'Science', 74, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1036', 'English', 70, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1036', 'Social Studies', 68, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1036', 'Computer Science', 57, 100, 'C');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1036', 'Regional Language', 61, 100, 'B');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1036', 'Creative Writing, Public Speaking', 'Handwriting & Formatting', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Nisha demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 37: Rahul Malhotra (Class 4)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1037', 'R-137', 'Rahul', 'Malhotra', 'Rahul Malhotra', 'Class 4', 'B', '2017-02-15', 'Male', 91.7, 'A+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1037', 'Mr. Rahul Senior Malhotra', 'Mrs. Sunita Malhotra', '+91 9885330122', '+91 9766019772', 'rahul.malhotra@parents.edu.in', 'Flat 153, Sector 15, Kolkata');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1037', 180, 131, 72.8, 'Average');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1037', 'Mathematics', 100, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1037', 'Science', 90, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1037', 'English', 88, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1037', 'Social Studies', 89, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1037', 'Computer Science', 89, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1037', 'Regional Language', 94, 100, 'A+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1037', 'Logical Thinking, Laboratory Experiments', 'Consistent Class Participation', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Rahul is an exemplary student with high analytical acumen and strong leadership skills.');

-- Record 38: Simran Sinha (Class 4)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1038', 'R-138', 'Simran', 'Sinha', 'Simran Sinha', 'Class 4', 'C', '2018-03-15', 'Female', 84.3, 'A');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1038', 'Mr. Simran Senior Sinha', 'Mrs. Sunita Sinha', '+91 9881647004', '+91 9761515389', 'simran.sinha@parents.edu.in', 'Flat 552, Mayur Vihar, Ahmedabad');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1038', 180, 134, 74.4, 'Average');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1038', 'Mathematics', 79, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1038', 'Science', 89, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1038', 'English', 96, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1038', 'Social Studies', 79, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1038', 'Computer Science', 84, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1038', 'Regional Language', 79, 100, 'B+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1038', 'Public Speaking, Coding & Robotics', 'Proofreading Answers', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Simran demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 39: Aman Choudhury (Class 4)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1039', 'R-139', 'Aman', 'Choudhury', 'Aman Choudhury', 'Class 4', 'A', '2019-04-15', 'Male', 80.7, 'A');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1039', 'Mr. Aman Senior Choudhury', 'Mrs. Sunita Choudhury', '+91 9877819123', '+91 9798081403', 'aman.choudhury@parents.edu.in', 'Flat 790, Jubilee Hills, Jaipur');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1039', 180, 175, 97.2, 'Excellent');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1039', 'Mathematics', 91, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1039', 'Science', 75, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1039', 'English', 80, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1039', 'Social Studies', 74, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1039', 'Computer Science', 85, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1039', 'Regional Language', 79, 100, 'B+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1039', 'Laboratory Experiments, Team Leadership', 'Focus in Afternoon Sessions', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Aman demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 40: Sneha Sharma (Class 4)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1040', 'R-140', 'Sneha', 'Sharma', 'Sneha Sharma', 'Class 4', 'B', '2012-05-15', 'Female', 85.7, 'A');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1040', 'Mr. Sneha Senior Sharma', 'Mrs. Sunita Sharma', '+91 9861609685', '+91 9779310254', 'sneha.sharma@parents.edu.in', 'Flat 309, MG Road, Mumbai');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1040', 180, 167, 92.8, 'Excellent');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1040', 'Mathematics', 78, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1040', 'Science', 91, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1040', 'English', 89, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1040', 'Social Studies', 85, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1040', 'Computer Science', 90, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1040', 'Regional Language', 81, 100, 'A');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1040', 'Coding & Robotics, Analytical Problem Solving', 'Time Management in Exams', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Sneha is an exemplary student with high analytical acumen and strong leadership skills.');

-- Record 41: Tejas Verma (Class 4)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1041', 'R-141', 'Tejas', 'Verma', 'Tejas Verma', 'Class 4', 'C', '2013-06-15', 'Male', 85.7, 'A');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1041', 'Mr. Tejas Senior Verma', 'Mrs. Sunita Verma', '+91 9823624600', '+91 9715490017', 'tejas.verma@parents.edu.in', 'Flat 245, Park Street, Delhi');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1041', 180, 157, 87.2, 'Good');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1041', 'Mathematics', 85, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1041', 'Science', 92, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1041', 'English', 92, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1041', 'Social Studies', 82, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1041', 'Computer Science', 81, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1041', 'Regional Language', 82, 100, 'A');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1041', 'Team Leadership, Creative Writing', 'Handwriting & Formatting', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Tejas is an exemplary student with high analytical acumen and strong leadership skills.');

-- Record 42: Ridhi Patel (Class 4)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1042', 'R-142', 'Ridhi', 'Patel', 'Ridhi Patel', 'Class 4', 'A', '2014-07-15', 'Female', 78.2, 'B+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1042', 'Mr. Ridhi Senior Patel', 'Mrs. Sunita Patel', '+91 9848607921', '+91 9788298804', 'ridhi.patel@parents.edu.in', 'Flat 464, Civil Lines, Bengaluru');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1042', 180, 170, 94.4, 'Excellent');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1042', 'Mathematics', 80, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1042', 'Science', 84, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1042', 'English', 77, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1042', 'Social Studies', 71, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1042', 'Computer Science', 74, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1042', 'Regional Language', 83, 100, 'A');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1042', 'Analytical Problem Solving, Logical Thinking', 'Consistent Class Participation', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Ridhi demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 43: Harsh Singh (LKG)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1043', 'R-143', 'Harsh', 'Singh', 'Harsh Singh', 'LKG', 'B', '2015-08-15', 'Male', 88.7, 'A');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1043', 'Mr. Harsh Senior Singh', 'Mrs. Sunita Singh', '+91 9867445821', '+91 9711522245', 'harsh.singh@parents.edu.in', 'Flat 269, Brigade Road, Hyderabad');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1043', 180, 138, 76.7, 'Average');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1043', 'Mathematics', 88, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1043', 'Science', 88, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1043', 'English', 84, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1043', 'Social Studies', 94, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1043', 'Computer Science', 96, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1043', 'Regional Language', 82, 100, 'A');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1043', 'Creative Writing, Public Speaking', 'Proofreading Answers', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Harsh is an exemplary student with high analytical acumen and strong leadership skills.');

-- Record 44: Preeti Gupta (LKG)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1044', 'R-144', 'Preeti', 'Gupta', 'Preeti Gupta', 'LKG', 'C', '2016-09-15', 'Female', 88.7, 'A');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1044', 'Mr. Preeti Senior Gupta', 'Mrs. Sunita Gupta', '+91 9873296552', '+91 9715060479', 'preeti.gupta@parents.edu.in', 'Flat 314, GC Avenue, Pune');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1044', 180, 149, 82.8, 'Good');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1044', 'Mathematics', 90, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1044', 'Science', 86, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1044', 'English', 80, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1044', 'Social Studies', 89, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1044', 'Computer Science', 97, 100, 'A+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1044', 'Regional Language', 90, 100, 'A+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1044', 'Logical Thinking, Laboratory Experiments', 'Focus in Afternoon Sessions', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Preeti is an exemplary student with high analytical acumen and strong leadership skills.');

-- Record 45: Samarth Mehta (LKG)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1045', 'R-145', 'Samarth', 'Mehta', 'Samarth Mehta', 'LKG', 'A', '2017-01-15', 'Male', 71.8, 'B+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1045', 'Mr. Samarth Senior Mehta', 'Mrs. Sunita Mehta', '+91 9897380745', '+91 9726464281', 'samarth.mehta@parents.edu.in', 'Flat 335, Indiranagar 10th Main, Kolkata');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1045', 180, 159, 88.3, 'Good');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1045', 'Mathematics', 70, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1045', 'Science', 66, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1045', 'English', 74, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1045', 'Social Studies', 75, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1045', 'Computer Science', 71, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1045', 'Regional Language', 75, 100, 'B+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1045', 'Public Speaking, Coding & Robotics', 'Time Management in Exams', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Samarth demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 46: Shreya Joshi (LKG)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1046', 'R-146', 'Shreya', 'Joshi', 'Shreya Joshi', 'LKG', 'B', '2018-02-15', 'Female', 75.5, 'B+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1046', 'Mr. Shreya Senior Joshi', 'Mrs. Sunita Joshi', '+91 9837414929', '+91 9775690990', 'shreya.joshi@parents.edu.in', 'Flat 179, Koramangala 4th Block, Ahmedabad');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1046', 180, 179, 99.4, 'Excellent');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1046', 'Mathematics', 74, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1046', 'Science', 80, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1046', 'English', 72, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1046', 'Social Studies', 77, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1046', 'Computer Science', 77, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1046', 'Regional Language', 73, 100, 'B+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1046', 'Laboratory Experiments, Team Leadership', 'Handwriting & Formatting', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Shreya demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 47: Tanishq Rao (Class 12)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1047', 'R-147', 'Tanishq', 'Rao', 'Tanishq Rao', 'Class 12', 'C', '2019-03-15', 'Male', 71.3, 'B+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1047', 'Mr. Tanishq Senior Rao', 'Mrs. Sunita Rao', '+91 9851707863', '+91 9776002298', 'tanishq.rao@parents.edu.in', 'Flat 293, Sector 15, Jaipur');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1047', 180, 177, 98.3, 'Excellent');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1047', 'Mathematics', 70, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1047', 'Science', 81, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1047', 'English', 67, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1047', 'Social Studies', 70, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1047', 'Computer Science', 75, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1047', 'Regional Language', 65, 100, 'B');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1047', 'Coding & Robotics, Analytical Problem Solving', 'Consistent Class Participation', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Tanishq demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 48: Nidhi Kumar (Class 12)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1048', 'R-148', 'Nidhi', 'Kumar', 'Nidhi Kumar', 'Class 12', 'A', '2012-04-15', 'Female', 73.7, 'B+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1048', 'Mr. Nidhi Senior Kumar', 'Mrs. Sunita Kumar', '+91 9845230669', '+91 9751999088', 'nidhi.kumar@parents.edu.in', 'Flat 777, Mayur Vihar, Mumbai');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1048', 180, 172, 95.6, 'Excellent');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1048', 'Mathematics', 78, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1048', 'Science', 67, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1048', 'English', 69, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1048', 'Social Studies', 76, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1048', 'Computer Science', 73, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1048', 'Regional Language', 79, 100, 'B+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1048', 'Team Leadership, Creative Writing', 'Proofreading Answers', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Nidhi demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 49: Utkarsh Reddy (Class 12)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1049', 'R-149', 'Utkarsh', 'Reddy', 'Utkarsh Reddy', 'Class 12', 'B', '2013-05-15', 'Male', 78, 'B+');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1049', 'Mr. Utkarsh Senior Reddy', 'Mrs. Sunita Reddy', '+91 9818005281', '+91 9716864614', 'utkarsh.reddy@parents.edu.in', 'Flat 372, Jubilee Hills, Delhi');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1049', 180, 152, 84.4, 'Good');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1049', 'Mathematics', 87, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1049', 'Science', 83, 100, 'A');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1049', 'English', 78, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1049', 'Social Studies', 72, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1049', 'Computer Science', 74, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1049', 'Regional Language', 74, 100, 'B+');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1049', 'Analytical Problem Solving, Logical Thinking', 'Focus in Afternoon Sessions', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Utkarsh demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

-- Record 50: Divya Chawla (Class 12)
INSERT INTO students (student_id, roll_number, first_name, last_name, full_name, class_grade, section, dob, gender, overall_percentage, overall_grade) VALUES ('STU_1050', 'R-150', 'Divya', 'Chawla', 'Divya Chawla', 'Class 12', 'C', '2014-06-15', 'Female', 59.3, 'C');
INSERT INTO guardians (student_id, father_name, mother_name, contact_number, emergency_contact, email, address) VALUES ('STU_1050', 'Mr. Divya Senior Chawla', 'Mrs. Sunita Chawla', '+91 9860855717', '+91 9758695770', 'divya.chawla@parents.edu.in', 'Flat 167, MG Road, Bengaluru');
INSERT INTO attendance_records (student_id, total_sessions, attended_sessions, attendance_percentage, attendance_status) VALUES ('STU_1050', 180, 162, 90, 'Good');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1050', 'Mathematics', 70, 100, 'B+');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1050', 'Science', 63, 100, 'B');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1050', 'English', 54, 100, 'C');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1050', 'Social Studies', 54, 100, 'C');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1050', 'Computer Science', 55, 100, 'C');
INSERT INTO subject_marks (student_id, subject_name, marks_obtained, max_marks, grade) VALUES ('STU_1050', 'Regional Language', 60, 100, 'B');
INSERT INTO teacher_comments (student_id, academic_strengths, areas_for_improvement, extracurriculars, comments) VALUES ('STU_1050', 'Creative Writing, Public Speaking', 'Time Management in Exams', 'School Debate Club, Inter-House Chess, Science Exhibition', 'Divya demonstrates solid academic understanding and steady progress. Encouraged to participate actively.');

