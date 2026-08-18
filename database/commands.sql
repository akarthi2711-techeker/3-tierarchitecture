-- ============================================================
-- aws-event-platform / database/commands.sql
-- Single RDS MySQL database shared by both portals.
-- Run this script once to initialise the schema and seed data.
-- ============================================================

-- Create database
CREATE DATABASE IF NOT EXISTS aws_event_platform
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aws_event_platform;

-- ============================================================
-- TABLE: event_registrations  (Event Registration Portal)
-- ============================================================
CREATE TABLE IF NOT EXISTS event_registrations (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  registration_id  VARCHAR(30)  UNIQUE NOT NULL,
  student_name     VARCHAR(100) NOT NULL,
  email            VARCHAR(150) NOT NULL,
  phone            VARCHAR(15)  NOT NULL,
  department       VARCHAR(150) NOT NULL,
  college          VARCHAR(200) NOT NULL,
  event            VARCHAR(100) NOT NULL,
  year             VARCHAR(20)  NOT NULL,
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  -- Prevent duplicate registration for same email + event
  UNIQUE KEY uq_email_event (email, event),
  INDEX idx_email   (email),
  INDEX idx_event   (event),
  INDEX idx_created (created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: students  (Student Result Portal)
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  registration_number VARCHAR(20)  UNIQUE NOT NULL,
  name                VARCHAR(150) NOT NULL,
  date_of_birth       DATE         NOT NULL,
  branch              VARCHAR(200) NOT NULL,
  semester            TINYINT UNSIGNED NOT NULL,
  email               VARCHAR(150),
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_reg_dob (registration_number, date_of_birth)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: student_results  (Student Result Portal)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_results (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  registration_number VARCHAR(20) NOT NULL,
  semester            TINYINT UNSIGNED NOT NULL,
  subject_code        VARCHAR(20) NOT NULL,
  grade               VARCHAR(5)  NOT NULL,
  result              CHAR(1)     NOT NULL COMMENT 'P = Pass, F = Fail',
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_reg_sem_sub (registration_number, semester, subject_code),
  INDEX idx_reg_no    (registration_number),
  INDEX idx_semester  (semester),

  CONSTRAINT fk_results_student
    FOREIGN KEY (registration_number)
    REFERENCES students (registration_number)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA: students
-- ============================================================
INSERT IGNORE INTO students
  (registration_number, name, date_of_birth, branch, semester, email)
VALUES
  ('23ECE001', 'Arjun Ramaswamy',    '2005-01-15', 'B.E. Electronics and Communication Engineering', 5, 'arjun.r@college.edu'),
  ('23CSE001', 'Priya Subramaniam',  '2004-08-22', 'B.E. Computer Science and Engineering',          5, 'priya.s@college.edu'),
  ('23IT001',  'Karthik Venkatesh',  '2005-03-10', 'B.Tech Information Technology',                  5, 'karthik.v@college.edu'),
  ('23EEE001', 'Divya Krishnamurthy','2004-11-05', 'B.E. Electrical and Electronics Engineering',    5, 'divya.k@college.edu'),
  ('23MECH001','Siva Shankar',       '2005-06-18', 'B.E. Mechanical Engineering',                    5, 'siva.s@college.edu'),
  ('23AIDS001','Meena Rajendran',    '2004-09-30', 'B.Tech Artificial Intelligence and Data Science',5, 'meena.r@college.edu');

-- ============================================================
-- SEED DATA: student_results
-- ============================================================

-- 23ECE001 – Arjun Ramaswamy (Semester 5)
INSERT IGNORE INTO student_results (registration_number, semester, subject_code, grade, result) VALUES
  ('23ECE001', 5, '25EC501', 'A',  'P'),
  ('23ECE001', 5, '25EC502', 'A+', 'P'),
  ('23ECE001', 5, '25EC503', 'B+', 'P'),
  ('23ECE001', 5, '25EC504', 'A',  'P'),
  ('23ECE001', 5, '25EC505', 'O',  'P'),
  ('23ECE001', 5, '25EC506', 'B',  'P');

-- 23CSE001 – Priya Subramaniam (Semester 5)
INSERT IGNORE INTO student_results (registration_number, semester, subject_code, grade, result) VALUES
  ('23CSE001', 5, '25CS501', 'O',  'P'),
  ('23CSE001', 5, '25CS502', 'A+', 'P'),
  ('23CSE001', 5, '25CS503', 'A',  'P'),
  ('23CSE001', 5, '25CS504', 'A+', 'P'),
  ('23CSE001', 5, '25CS505', 'O',  'P'),
  ('23CSE001', 5, '25CS506', 'A',  'P');

-- 23IT001 – Karthik Venkatesh (Semester 5)
INSERT IGNORE INTO student_results (registration_number, semester, subject_code, grade, result) VALUES
  ('23IT001',  5, '25IT501', 'B+', 'P'),
  ('23IT001',  5, '25IT502', 'A',  'P'),
  ('23IT001',  5, '25IT503', 'B',  'P'),
  ('23IT001',  5, '25IT504', 'A+', 'P'),
  ('23IT001',  5, '25IT505', 'B+', 'P'),
  ('23IT001',  5, '25IT506', 'C',  'P');

-- 23EEE001 – Divya Krishnamurthy (Semester 5)
INSERT IGNORE INTO student_results (registration_number, semester, subject_code, grade, result) VALUES
  ('23EEE001', 5, '25EE501', 'A',  'P'),
  ('23EEE001', 5, '25EE502', 'B+', 'P'),
  ('23EEE001', 5, '25EE503', 'A+', 'P'),
  ('23EEE001', 5, '25EE504', 'U',  'F'),
  ('23EEE001', 5, '25EE505', 'B',  'P'),
  ('23EEE001', 5, '25EE506', 'A',  'P');

-- 23MECH001 – Siva Shankar (Semester 5)
INSERT IGNORE INTO student_results (registration_number, semester, subject_code, grade, result) VALUES
  ('23MECH001',5, '25ME501', 'B',  'P'),
  ('23MECH001',5, '25ME502', 'A',  'P'),
  ('23MECH001',5, '25ME503', 'B+', 'P'),
  ('23MECH001',5, '25ME504', 'C',  'P'),
  ('23MECH001',5, '25ME505', 'B',  'P'),
  ('23MECH001',5, '25ME506', 'A',  'P');

-- 23AIDS001 – Meena Rajendran (Semester 5)
INSERT IGNORE INTO student_results (registration_number, semester, subject_code, grade, result) VALUES
  ('23AIDS001', 5, '25AD501', 'O',  'P'),
  ('23AIDS001', 5, '25AD502', 'A+', 'P'),
  ('23AIDS001', 5, '25AD503', 'O',  'P'),
  ('23AIDS001', 5, '25AD504', 'A',  'P'),
  ('23AIDS001', 5, '25AD505', 'A+', 'P'),
  ('23AIDS001', 5, '25AD506', 'O',  'P');

-- ============================================================
-- SEED DATA: sample event registration (for testing)
-- ============================================================
INSERT IGNORE INTO event_registrations
  (registration_id, student_name, email, phone, department, college, event, year)
VALUES
  ('EVT20260001', 'Demo Student', 'demo@example.com', '9876543210',
   'B.E. Electronics and Communication Engineering',
   'Demo Engineering College', 'Workshop', '3rd Year');

-- ============================================================
-- Verification queries (optional – run manually to confirm)
-- ============================================================
-- SELECT * FROM event_registrations;
-- SELECT * FROM students;
-- SELECT * FROM student_results WHERE registration_number = '23ECE001';
