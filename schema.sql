-- Osbert Senior High School Management System (Greenwood Register)
-- Relational schema (SQLite). Written in portable SQL so it can be moved
-- to PostgreSQL or MySQL with only minor type changes.

PRAGMA foreign_keys = ON;

-- ---------- Core register ----------

CREATE TABLE IF NOT EXISTS classes (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE COLLATE NOCASE,
  teacher_id  TEXT REFERENCES teachers(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED,
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS class_subjects (
  class_id  TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject   TEXT NOT NULL,
  position  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (class_id, subject)
);

CREATE TABLE IF NOT EXISTS teachers (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  subject     TEXT NOT NULL DEFAULT '',
  class_id    TEXT REFERENCES classes(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED,
  contact     TEXT NOT NULL DEFAULT '',
  dob         TEXT NOT NULL DEFAULT '',
  gender      TEXT NOT NULL DEFAULT '' CHECK (gender IN ('', 'Male', 'Female')),
  location    TEXT NOT NULL DEFAULT '',
  ghana_card  TEXT NOT NULL DEFAULT '',
  photo       TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id          TEXT PRIMARY KEY,
  roll        TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name        TEXT NOT NULL,
  class_id    TEXT REFERENCES classes(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED,
  course      TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  guardian    TEXT NOT NULL DEFAULT '',
  contact     TEXT NOT NULL DEFAULT '',
  dob         TEXT NOT NULL DEFAULT '',
  gender      TEXT NOT NULL DEFAULT '' CHECK (gender IN ('', 'Male', 'Female')),
  location    TEXT NOT NULL DEFAULT '',
  ghana_card  TEXT NOT NULL DEFAULT '',
  photo       TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);

-- ---------- Accounts & sessions ----------

CREATE TABLE IF NOT EXISTS users (
  username       TEXT PRIMARY KEY COLLATE NOCASE,
  password_hash  TEXT NOT NULL,                       -- scrypt$salt$hash, never plain text
  role           TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  name           TEXT NOT NULL,
  teacher_id     TEXT REFERENCES teachers(id) ON DELETE CASCADE,
  student_id     TEXT REFERENCES students(id) ON DELETE CASCADE,
  created_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (role = 'admin'   AND teacher_id IS NULL AND student_id IS NULL) OR
    (role = 'teacher' AND student_id IS NULL) OR
    (role = 'student' AND teacher_id IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  username    TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  expires_at  INTEGER NOT NULL                         -- unix ms
);

-- ---------- Attendance, exams, results ----------

CREATE TABLE IF NOT EXISTS attendance (
  id          TEXT PRIMARY KEY,
  student_id  TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id    TEXT REFERENCES classes(id) ON DELETE SET NULL,
  date        TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent')),
  UNIQUE (student_id, date)
);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_id, date);

CREATE TABLE IF NOT EXISTS exams (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  class_id    TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date        TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS exam_subjects (
  exam_id   TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  subject   TEXT NOT NULL,
  position  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (exam_id, subject)
);

CREATE TABLE IF NOT EXISTS results (
  id          TEXT PRIMARY KEY,
  exam_id     TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id  TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject     TEXT NOT NULL,
  marks       REAL NOT NULL CHECK (marks >= 0 AND marks <= 100),
  UNIQUE (exam_id, student_id, subject)
);
CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);

-- ---------- Finance ----------

CREATE TABLE IF NOT EXISTS fees (
  id          TEXT PRIMARY KEY,
  student_id  TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  term        TEXT NOT NULL DEFAULT '',
  due         REAL NOT NULL DEFAULT 0 CHECK (due >= 0),
  paid        REAL NOT NULL DEFAULT 0 CHECK (paid >= 0),
  date        TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_fees_student ON fees(student_id);

-- ---------- Timetable ----------

CREATE TABLE IF NOT EXISTS timetable (
  class_id  TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  day       TEXT NOT NULL CHECK (day IN ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  period    INTEGER NOT NULL CHECK (period >= 0),
  subject   TEXT NOT NULL,
  PRIMARY KEY (class_id, day, period)
);

-- ---------- Messages & notices ----------

CREATE TABLE IF NOT EXISTS sms (
  id          TEXT PRIMARY KEY,
  student_id  TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  date        TEXT NOT NULL,
  is_read     INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1))
);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  scope      TEXT NOT NULL CHECK (scope IN ('teachers', 'students', 'teacher', 'student')),
  target_id  TEXT,                                      -- teacher/student id for personal notices
  message    TEXT NOT NULL,
  from_name  TEXT NOT NULL DEFAULT 'School Office',
  date       TEXT NOT NULL
);

-- "Dismissed" is tracked per person, so one teacher dismissing a
-- school-wide notice does not hide it from every other teacher.
CREATE TABLE IF NOT EXISTS notification_reads (
  notification_id  TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  username         TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY (notification_id, username)
);

-- ---------- Virtual Classroom (V-Class) ----------

CREATE TABLE IF NOT EXISTS vc_courses (
  id                TEXT PRIMARY KEY,
  title             TEXT NOT NULL,
  category          TEXT NOT NULL DEFAULT 'General',
  description       TEXT NOT NULL DEFAULT '',
  teacher_username  TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS vc_assignments (
  id           TEXT PRIMARY KEY,
  course_id    TEXT NOT NULL REFERENCES vc_courses(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  due_date     TEXT NOT NULL DEFAULT '',
  total_marks  REAL NOT NULL DEFAULT 100 CHECK (total_marks > 0)
);

CREATE TABLE IF NOT EXISTS vc_enrollments (
  id         TEXT PRIMARY KEY,
  username   TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  course_id  TEXT NOT NULL REFERENCES vc_courses(id) ON DELETE CASCADE,
  progress   INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  UNIQUE (username, course_id)
);

CREATE TABLE IF NOT EXISTS vc_submissions (
  id             TEXT PRIMARY KEY,
  assignment_id  TEXT NOT NULL REFERENCES vc_assignments(id) ON DELETE CASCADE,
  username       TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  answer         TEXT NOT NULL DEFAULT '',
  marks          REAL CHECK (marks IS NULL OR marks >= 0),
  feedback       TEXT NOT NULL DEFAULT '',
  status         TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Resubmitted', 'Graded')),
  submitted_at   TEXT NOT NULL DEFAULT '',
  UNIQUE (assignment_id, username)
);
