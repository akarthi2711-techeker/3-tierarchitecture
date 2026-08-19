-- ============================================================
-- aws-event-platform / database/commands.sql
-- Event Registration Portal only.
-- ============================================================

-- Create database
CREATE DATABASE IF NOT EXISTS aws_event_platform
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aws_event_platform;

-- ============================================================
-- TABLE: event_registrations
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

  UNIQUE KEY uq_email_event (email, event),
  INDEX idx_email   (email),
  INDEX idx_event   (event),
  INDEX idx_created (created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA: sample event registration
-- ============================================================
INSERT IGNORE INTO event_registrations
  (registration_id, student_name, email, phone, department, college, event, year)
VALUES
  ('EVT20260001', 'Demo Student', 'demo@example.com', '9876543210',
   'B.E. Electronics and Communication Engineering',
   'Demo Engineering College', 'Workshop', '3rd Year');

-- Verify
-- SELECT * FROM event_registrations;
