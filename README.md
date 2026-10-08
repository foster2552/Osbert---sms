# School Management System (SQL database version)

## Run it
1. Install Node.js 22.13 or newer (https://nodejs.org).
2. In this folder run: `npm start`  (or `node server.js`)
3. Open http://localhost:3000

No `npm install` is needed. The database is created automatically as `school.db`.

First sign-in: username `admin`, password `admin123` (change it, or set
`ADMIN_PASSWORD=yourpassword` before the very first start).

## Moving your old data
If you have a `data.json` from the previous version, put it in this folder
before the first start. It is imported into the database automatically
(passwords are hashed during import) and renamed to `data.json.imported`.

## Where the data lives
`school.db` is a standard SQLite database. Open it with DB Browser for SQLite
or `sqlite3 school.db`. The full design is in `schema.sql`.

Tables: classes, class_subjects, teachers, students, users, sessions,
attendance, exams, exam_subjects, results, fees, timetable, sms,
notifications, notification_reads, vc_courses, vc_assignments,
vc_enrollments, vc_submissions.

## Backups
Stop the server and copy `school.db` (and `school.db-wal` if present), or run
`sqlite3 school.db ".backup backup.db"` while it is running.

## Settings (environment variables)
PORT, DB_PATH, ADMIN_PASSWORD
