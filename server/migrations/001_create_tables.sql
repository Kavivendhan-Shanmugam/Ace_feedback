-- Create the feedback_portal database schema for MySQL

-- 1. Users table (replaces Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Profiles table (user profile information)
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(36) PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  email VARCHAR(255),
  batch_id VARCHAR(36),
  semester_number INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Batches table
CREATE TABLE IF NOT EXISTS batches (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Subjects table (renamed from classes)
CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  period INT,
  batch_id VARCHAR(36),
  semester_number INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);

-- 5. Timetables table
CREATE TABLE IF NOT EXISTS timetables (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  day_of_week INT NOT NULL,
  class_id VARCHAR(36) NOT NULL,
  batch_id VARCHAR(36),
  semester_number INT,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
  UNIQUE KEY unique_class_day_period (day_of_week, class_id)
);

-- 6. Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  student_id VARCHAR(36) NOT NULL,
  class_id VARCHAR(36) NOT NULL,
  batch_id VARCHAR(36),
  semester_number INT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  admin_response TEXT,
  is_response_seen_by_student BOOLEAN DEFAULT FALSE,
  additional_feedback JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);

-- 7. Feedback Questions table
CREATE TABLE IF NOT EXISTS feedback_questions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  question_text TEXT NOT NULL,
  question_type ENUM('text', 'multiple_choice') NOT NULL,
  options JSON,
  batch_id VARCHAR(36),
  semester_number INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);

-- Add foreign key constraints for profiles table
ALTER TABLE profiles 
ADD CONSTRAINT fk_profiles_batch 
FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL;

-- Create indexes for better performance (with error handling)
CREATE INDEX idx_profiles_batch_id ON profiles(batch_id);
CREATE INDEX idx_subjects_batch_semester ON subjects(batch_id, semester_number);
CREATE INDEX idx_timetables_batch_semester ON timetables(batch_id, semester_number);
CREATE INDEX idx_feedback_batch_semester ON feedback(batch_id, semester_number);
CREATE INDEX idx_feedback_questions_batch_semester ON feedback_questions(batch_id, semester_number);
CREATE INDEX idx_timetables_day_batch ON timetables(day_of_week, batch_id);
CREATE INDEX idx_feedback_student_class ON feedback(student_id, class_id);

-- Create a default admin user (password is 'admin123')
SET @admin_id = '550e8400-e29b-41d4-a716-446655440000';
INSERT INTO users (id, email, password_hash) 
VALUES (@admin_id, 'admin@feedback.com', '$2b$10$puJ9JggMi8VmQFonOsvX3.n1VAcGFO.4m.uX9rBvbSglzHZSyKPOC')
ON DUPLICATE KEY UPDATE email = email;

-- Create admin profile
INSERT INTO profiles (id, first_name, last_name, is_admin, email)
VALUES (@admin_id, 'Admin', 'User', TRUE, 'admin@feedback.com')
ON DUPLICATE KEY UPDATE first_name = first_name;

-- Create a test student user (password is 'test123')
INSERT INTO users (id, email, password_hash) 
VALUES (UUID(), 'student@test.com', '$2a$10$8K1p/kCEk0FLFLQNXjfJEu.UZGtHHw3T5/QyRKKhQq7F4bLW6yf22')
ON DUPLICATE KEY UPDATE email = email;

-- Create test student profile  
INSERT INTO profiles (id, first_name, last_name, is_admin, email)
SELECT u.id, 'Test', 'Student', FALSE, u.email
FROM users u
WHERE u.email = 'student@test.com'
ON DUPLICATE KEY UPDATE first_name = first_name;
