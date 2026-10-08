/* Osbert Senior High School Management System — server
 *
 * Serves the web app and stores ALL data in a real relational database
 * (SQLite, file: school.db) using the built-in node:sqlite module.
 * No npm install is needed. Requires Node.js 22.13 or newer.
 *
 *   node server.js            (or: npm start)
 *   then open http://localhost:3000
 *
 * Environment variables (all optional):
 *   PORT=3000                 port to listen on
 *   DB_PATH=./school.db       where the database file lives
 *   ADMIN_PASSWORD=...        password for the first 'admin' account
 *
 * What the server does:
 *   - schema.sql defines the tables, keys, indexes and constraints
 *   - passwords are hashed (scrypt); they are never stored or sent in plain text
 *   - login is checked on the server and uses an HttpOnly session cookie
 *   - every read/write is checked against the signed-in user's role
 *   - every write runs inside a transaction (all-or-nothing)
 *   - an old data.json from the previous version is imported automatically
 *     the first time the new database is created
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let DatabaseSync;
try {
  ({ DatabaseSync } = require('node:sqlite'));
} catch (e) {
  console.error('This version needs Node.js 22.13 or newer (it uses the built-in SQLite module).');
  console.error('You are running Node ' + process.version + '. Download the latest LTS from https://nodejs.org');
  process.exit(1);
}

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const DB_PATH = process.env.DB_PATH || path.join(ROOT, 'school.db');
const LEGACY_FILE = path.join(ROOT, 'data.json');
const SESSION_MS = 12 * 60 * 60 * 1000;
const MAX_BODY = 12 * 1024 * 1024; // photos are stored as data URLs

/* ------------------------------------------------------------------ */
/* Database                                                           */
/* ------------------------------------------------------------------ */
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
db.exec(fs.readFileSync(path.join(ROOT, 'schema.sql'), 'utf8'));

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function inTransaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (e) {
    try { db.exec('ROLLBACK'); } catch (_) { /* already rolled back */ }
    throw e;
  }
}

function friendlyDbError(e) {
  const m = String(e && e.message || e);
  if (/UNIQUE constraint failed: students\.roll/.test(m)) return 'A student with that roll number already exists';
  if (/UNIQUE constraint failed: users\.username/.test(m)) return 'Username already exists';
  if (/UNIQUE constraint failed: classes\.name/.test(m)) return 'A class with that name already exists';
  if (/UNIQUE constraint failed/.test(m)) return 'That record already exists';
  if (/FOREIGN KEY constraint failed/.test(m)) return 'This record points to something that no longer exists — refresh the page and try again';
  if (/CHECK constraint failed/.test(m)) return 'A value is outside the allowed range or list';
  if (/NOT NULL constraint failed/.test(m)) return 'A required field is missing';
  return null;
}

/* ------------------------------------------------------------------ */
/* Passwords                                                          */
/* ------------------------------------------------------------------ */
function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(pw), salt, 64);
  return 'scrypt$' + salt.toString('hex') + '$' + hash.toString('hex');
}
function verifyPassword(pw, stored) {
  try {
    const [scheme, saltHex, hashHex] = String(stored).split('$');
    if (scheme !== 'scrypt') return false;
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(String(pw), Buffer.from(saltHex, 'hex'), expected.length);
    return crypto.timingSafeEqual(actual, expected);
  } catch (e) { return false; }
}
const DUMMY_HASH = hashPassword('not-a-real-password'); // equalises timing for unknown usernames

/* ------------------------------------------------------------------ */
/* Table definitions: front-end field name -> SQL column              */
/* ------------------------------------------------------------------ */
const FLAT = {
  students: { table: 'students', pk: ['id'], ts: true, cols: {
    id: 'id', roll: 'roll', name: 'name', classId: 'class_id', course: 'course', status: 'status',
    guardian: 'guardian', contact: 'contact', dob: 'dob', gender: 'gender', location: 'location',
    ghanaCard: 'ghana_card', photo: 'photo' } },
  teachers: { table: 'teachers', pk: ['id'], ts: true, cols: {
    id: 'id', name: 'name', subject: 'subject', classId: 'class_id', contact: 'contact', dob: 'dob',
    gender: 'gender', location: 'location', ghanaCard: 'ghana_card', photo: 'photo' } },
  attendance: { table: 'attendance', pk: ['id'], conflict: ['student_id', 'date'], cols: {
    id: 'id', studentId: 'student_id', classId: 'class_id', date: 'date', status: 'status' } },
  results: { table: 'results', pk: ['id'], conflict: ['exam_id', 'student_id', 'subject'], cols: {
    id: 'id', examId: 'exam_id', studentId: 'student_id', subject: 'subject', marks: 'marks' } },
  fees: { table: 'fees', pk: ['id'], cols: {
    id: 'id', studentId: 'student_id', term: 'term', due: 'due', paid: 'paid', date: 'date' } },
  timetable: { table: 'timetable', pk: ['classId', 'day', 'period'], conflict: ['class_id', 'day', 'period'], cols: {
    classId: 'class_id', day: 'day', period: 'period', subject: 'subject' } },
  notifications: { table: 'notifications', pk: ['id'], insertOnly: true, cols: {
    id: 'id', scope: 'scope', targetId: 'target_id', message: 'message', from: 'from_name', date: 'date' } },
  sms: { table: 'sms', pk: ['id'], insertOnly: true, cols: {
    id: 'id', studentId: 'student_id', message: 'message', date: 'date' } },
  vc_courses: { table: 'vc_courses', pk: ['id'], cols: {
    id: 'id', title: 'title', category: 'category', description: 'description', teacherUsername: 'teacher_username' } },
  vc_assignments: { table: 'vc_assignments', pk: ['id'], cols: {
    id: 'id', courseId: 'course_id', title: 'title', description: 'description', dueDate: 'due_date', totalMarks: 'total_marks' } },
  vc_enrollments: { table: 'vc_enrollments', pk: ['id'], conflict: ['username', 'course_id'], cols: {
    id: 'id', username: 'username', courseId: 'course_id', progress: 'progress' } },
  vc_submissions: { table: 'vc_submissions', pk: ['id'], conflict: ['assignment_id', 'username'], cols: {
    id: 'id', assignmentId: 'assignment_id', username: 'username', answer: 'answer', marks: 'marks',
    feedback: 'feedback', status: 'status', submittedAt: 'submitted_at' } },
};
const CUSTOM = ['classes', 'exams', 'users'];
const ALL_COLLECTIONS = [...Object.keys(FLAT), ...CUSTOM];

function sqlValue(col, v) {
  if (v === undefined) return undefined;
  if (v === '' && col.endsWith('_id')) return null;
  if (v === true) return 1;
  if (v === false) return 0;
  if (v !== null && typeof v === 'object') throw new HttpError(400, 'Invalid value for ' + col);
  return v;
}

function upsertFlat(spec, row) {
  const names = [], values = [];
  for (const [js, col] of Object.entries(spec.cols)) {
    const v = sqlValue(col, row[js]);
    if (v !== undefined) { names.push(col); values.push(v); }
  }
  const pkCols = spec.pk.map(k => spec.cols[k]);
  const target = spec.conflict || pkCols;
  const update = names.filter(c => !target.includes(c) && c !== 'id');
  let sql = `INSERT INTO ${spec.table} (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')}) ON CONFLICT (${target.join(', ')}) `;
  if (spec.insertOnly || !update.length) {
    sql += 'DO NOTHING';
  } else {
    sql += 'DO UPDATE SET ' + update.map(c => `${c} = excluded.${c}`).join(', ') + (spec.ts ? ", updated_at = CURRENT_TIMESTAMP" : '');
  }
  db.prepare(sql).run(...values);
}

function deleteFlat(spec, row) {
  const where = spec.pk.map(k => `${spec.cols[k]} = ?`).join(' AND ');
  const vals = spec.pk.map(k => {
    if (row[k] === undefined || row[k] === null) throw new HttpError(400, 'Missing key ' + k);
    return row[k];
  });
  db.prepare(`DELETE FROM ${spec.table} WHERE ${where}`).run(...vals);
}

function readFlat(spec) {
  const inv = {};
  for (const [js, col] of Object.entries(spec.cols)) inv[col] = js;
  return db.prepare(`SELECT ${Object.values(spec.cols).join(', ')} FROM ${spec.table} ORDER BY rowid`).all()
    .map(r => { const o = {}; for (const c of Object.keys(r)) o[inv[c]] = r[c]; return o; });
}

/* ----- classes (+ subjects) ----- */
function upsertClass(row) {
  if (!row.id) throw new HttpError(400, 'Class id missing');
  const teacherId = row.teacherId ? row.teacherId : null;
  db.prepare(`INSERT INTO classes (id, name, teacher_id) VALUES (?, ?, ?)
              ON CONFLICT (id) DO UPDATE SET name = excluded.name, teacher_id = excluded.teacher_id, updated_at = CURRENT_TIMESTAMP`)
    .run(row.id, String(row.name || '').trim(), teacherId);
  db.prepare('DELETE FROM class_subjects WHERE class_id = ?').run(row.id);
  const ins = db.prepare('INSERT OR IGNORE INTO class_subjects (class_id, subject, position) VALUES (?, ?, ?)');
  (Array.isArray(row.subjects) ? row.subjects : []).forEach((s, i) => { if (String(s).trim()) ins.run(row.id, String(s).trim(), i); });
}
function readClasses() {
  const subs = {};
  db.prepare('SELECT class_id, subject FROM class_subjects ORDER BY class_id, position').all()
    .forEach(r => { (subs[r.class_id] = subs[r.class_id] || []).push(r.subject); });
  return db.prepare('SELECT id, name, teacher_id FROM classes ORDER BY rowid').all()
    .map(r => ({ id: r.id, name: r.name, teacherId: r.teacher_id, subjects: subs[r.id] || [] }));
}

/* ----- exams (+ subjects) ----- */
function upsertExam(row) {
  if (!row.id) throw new HttpError(400, 'Exam id missing');
  db.prepare(`INSERT INTO exams (id, name, class_id, date) VALUES (?, ?, ?, ?)
              ON CONFLICT (id) DO UPDATE SET name = excluded.name, class_id = excluded.class_id, date = excluded.date`)
    .run(row.id, String(row.name || '').trim(), row.classId || null, row.date || '');
  db.prepare('DELETE FROM exam_subjects WHERE exam_id = ?').run(row.id);
  const ins = db.prepare('INSERT OR IGNORE INTO exam_subjects (exam_id, subject, position) VALUES (?, ?, ?)');
  (Array.isArray(row.subjects) ? row.subjects : []).forEach((s, i) => { if (String(s).trim()) ins.run(row.id, String(s).trim(), i); });
}
function readExams() {
  const subs = {};
  db.prepare('SELECT exam_id, subject FROM exam_subjects ORDER BY exam_id, position').all()
    .forEach(r => { (subs[r.exam_id] = subs[r.exam_id] || []).push(r.subject); });
  return db.prepare('SELECT id, name, class_id, date FROM exams ORDER BY rowid').all()
    .map(r => ({ id: r.id, name: r.name, classId: r.class_id, date: r.date, subjects: subs[r.id] || [] }));
}

/* ----- users ----- */
function upsertUser(row) {
  const username = String(row.username || '').trim();
  if (!username) throw new HttpError(400, 'Username required');
  const role = row.role;
  if (!['admin', 'teacher', 'student'].includes(role)) throw new HttpError(400, 'Invalid role');
  const teacherId = role === 'teacher' && row.linkedId ? row.linkedId : null;
  const studentId = role === 'student' && row.linkedId ? row.linkedId : null;
  const existing = db.prepare('SELECT username FROM users WHERE username = ?').get(username);
  if (!existing) {
    if (!row.password || String(row.password).length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
    db.prepare('INSERT INTO users (username, password_hash, role, name, teacher_id, student_id) VALUES (?, ?, ?, ?, ?, ?)')
      .run(username, hashPassword(row.password), role, row.name || username, teacherId, studentId);
  } else {
    db.prepare('UPDATE users SET role = ?, name = ?, teacher_id = ?, student_id = ? WHERE username = ?')
      .run(role, row.name || username, teacherId, studentId, username);
    if (row.password) {
      if (String(row.password).length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
      db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hashPassword(row.password), username);
    }
  }
}
function readUsers() {
  return db.prepare('SELECT username, role, name, teacher_id, student_id FROM users ORDER BY rowid').all()
    .map(r => ({ username: r.username, role: r.role, name: r.name, linkedId: r.teacher_id || r.student_id || null }));
}

/* ------------------------------------------------------------------ */
/* Authorisation                                                      */
/* ------------------------------------------------------------------ */
const ROLE_WRITE = {
  admin: new Set(ALL_COLLECTIONS),
  teacher: new Set(['students', 'attendance', 'exams', 'results', 'timetable', 'notifications',
    'vc_courses', 'vc_assignments', 'vc_enrollments', 'vc_submissions']),
  student: new Set(['vc_enrollments', 'vc_submissions']),
};

function courseOwner(courseId) {
  const r = db.prepare('SELECT teacher_username FROM vc_courses WHERE id = ?').get(courseId);
  return r ? r.teacher_username : null;
}
function assignmentCourseOwner(assignmentId) {
  const r = db.prepare(`SELECT c.teacher_username AS t FROM vc_assignments a JOIN vc_courses c ON c.id = a.course_id WHERE a.id = ?`).get(assignmentId);
  return r ? r.t : null;
}

/* Returns the row to actually write (possibly adjusted), or null to skip. */
function checkUpsert(user, coll, row) {
  if (user.role === 'admin') return row;
  const me = user.username;
  if (coll === 'vc_courses') {
    const owner = courseOwner(row.id);
    if (owner && owner !== me) throw new HttpError(403, 'You can only change your own courses');
    return { ...row, teacherUsername: me };
  }
  if (coll === 'vc_assignments') {
    if (courseOwner(row.courseId) !== me) throw new HttpError(403, 'You can only add assignments to your own courses');
    return row;
  }
  if (coll === 'vc_enrollments') {
    if (user.role !== 'student') throw new HttpError(403, 'Only students can enroll');
    return { ...row, username: me, progress: row.progress || 0 };
  }
  if (coll === 'vc_submissions') {
    if (user.role === 'student') {
      const prev = db.prepare('SELECT id FROM vc_submissions WHERE assignment_id = ? AND username = ?').get(row.assignmentId, me);
      return { id: row.id, assignmentId: row.assignmentId, username: me, answer: row.answer, marks: null, feedback: '',
        status: prev ? 'Resubmitted' : 'Submitted', submittedAt: row.submittedAt || new Date().toLocaleString() };
    }
    if (assignmentCourseOwner(row.assignmentId) !== me) throw new HttpError(403, 'You can only grade work for your own courses');
    return row;
  }
  if (coll === 'notifications' && user.role !== 'teacher') throw new HttpError(403, 'Not allowed');
  return row;
}

function checkDelete(user, coll, row) {
  if (user.role === 'admin') return true;
  const me = user.username;
  if (coll === 'vc_courses') { const o = courseOwner(row.id); return o === null ? false : (o === me || deny()); }
  if (coll === 'vc_assignments') {
    const r = db.prepare('SELECT 1 FROM vc_assignments WHERE id = ?').get(row.id);
    if (!r) return false;
    if (assignmentCourseOwner(row.id) !== me) deny();
    return true;
  }
  if (coll === 'vc_enrollments') {
    const e = db.prepare('SELECT username, course_id FROM vc_enrollments WHERE id = ?').get(row.id);
    if (!e) return false;
    if (e.username === me || courseOwner(e.course_id) === me) return true;
    return deny();
  }
  if (coll === 'vc_submissions') {
    const s = db.prepare('SELECT assignment_id FROM vc_submissions WHERE id = ?').get(row.id);
    if (!s) return false;
    if (assignmentCourseOwner(s.assignment_id) === me) return true;
    return deny();
  }
  if (coll === 'students' || coll === 'exams' || coll === 'results' || coll === 'attendance' || coll === 'timetable') return true;
  return deny();
}
function deny() { throw new HttpError(403, "You don't have permission to do that"); }

/* ------------------------------------------------------------------ */
/* Write path: apply upserts/deletes for one collection               */
/* ------------------------------------------------------------------ */
function applyChanges(user, coll, upserts, deletes) {
  if (!ALL_COLLECTIONS.includes(coll)) throw new HttpError(404, 'Unknown collection');
  if (!ROLE_WRITE[user.role] || !ROLE_WRITE[user.role].has(coll)) throw new HttpError(403, "You don't have permission to change this data");
  upserts = Array.isArray(upserts) ? upserts : [];
  deletes = Array.isArray(deletes) ? deletes : [];

  // Deletes first so a replaced row (same natural key, new id) never collides.
  for (const row of deletes) {
    if (coll === 'users') {
      if (row.username === 'admin' || row.username === user.username) throw new HttpError(400, 'That account cannot be removed');
      db.prepare('DELETE FROM users WHERE username = ?').run(row.username);
    } else if (coll === 'classes') {
      db.prepare('DELETE FROM classes WHERE id = ?').run(row.id);
    } else if (coll === 'exams') {
      db.prepare('DELETE FROM exams WHERE id = ?').run(row.id);
    } else if (FLAT[coll].pk.length && checkDelete(user, coll, row)) {
      deleteFlat(FLAT[coll], row);
    }
  }
  for (const raw of upserts) {
    if (!raw || typeof raw !== 'object') throw new HttpError(400, 'Bad record');
    const row = checkUpsert(user, coll, raw);
    if (coll === 'classes') upsertClass(row);
    else if (coll === 'exams') upsertExam(row);
    else if (coll === 'users') upsertUser(row);
    else upsertFlat(FLAT[coll], row);
  }
}

/* ------------------------------------------------------------------ */
/* Read path: everything the signed-in user is allowed to see         */
/* ------------------------------------------------------------------ */
function loadData(user) {
  const readSet = new Set(db.prepare('SELECT notification_id FROM notification_reads WHERE username = ?').all(user.username).map(r => r.notification_id));
  const smsRows = readFlat(FLAT.sms);
  const smsRead = new Map(db.prepare('SELECT id, is_read FROM sms').all().map(r => [r.id, !!r.is_read]));
  smsRows.forEach(s => { s.read = smsRead.get(s.id) || false; });

  const all = {
    users: readUsers(),
    students: readFlat(FLAT.students),
    teachers: readFlat(FLAT.teachers),
    classes: readClasses(),
    attendance: readFlat(FLAT.attendance),
    exams: readExams(),
    results: readFlat(FLAT.results),
    fees: readFlat(FLAT.fees),
    timetable: readFlat(FLAT.timetable),
    sms: smsRows,
    notifications: readFlat(FLAT.notifications).map(n => ({ ...n, read: readSet.has(n.id) })),
  };
  const vc = {
    courses: readFlat(FLAT.vc_courses),
    assignments: readFlat(FLAT.vc_assignments),
    submissions: readFlat(FLAT.vc_submissions),
    enrollments: readFlat(FLAT.vc_enrollments),
  };

  if (user.role === 'admin') return { db: all, vc: { courses: [], assignments: [], submissions: [], enrollments: [] } };

  const me = user.linkedId;
  if (user.role === 'teacher') {
    all.teachers = all.teachers.map(t => ({ id: t.id, name: t.name, subject: t.subject, classId: t.classId, gender: t.gender }));
    all.fees = all.fees; // needed by the Reports page
    all.notifications = all.notifications.filter(n => n.scope === 'teachers' || (n.scope === 'teacher' && n.targetId === me));
    all.sms = [];
    const myCourses = vc.courses.filter(c => c.teacherUsername === user.username);
    const ids = new Set(myCourses.map(c => c.id));
    const myAssign = vc.assignments.filter(a => ids.has(a.courseId));
    const aIds = new Set(myAssign.map(a => a.id));
    return { db: all, vc: {
      courses: myCourses, assignments: myAssign,
      submissions: vc.submissions.filter(s => aIds.has(s.assignmentId)),
      enrollments: vc.enrollments.filter(e => ids.has(e.courseId)) } };
  }

  // student
  const mine = all.students.find(s => s.id === me) || null;
  const classId = mine ? mine.classId : null;
  const filtered = {
    users: all.users.filter(u => u.role === 'teacher' || u.username === user.username),
    students: mine ? [mine] : [],
    teachers: [],
    classes: all.classes,
    attendance: mine ? all.attendance.filter(a => a.studentId === mine.id) : [],
    exams: all.exams.filter(e => e.classId === classId),
    results: mine ? all.results.filter(r => r.studentId === mine.id) : [],
    fees: mine ? all.fees.filter(f => f.studentId === mine.id) : [],
    timetable: all.timetable.filter(t => t.classId === classId),
    sms: mine ? all.sms.filter(s => s.studentId === mine.id) : [],
    notifications: all.notifications.filter(n => n.scope === 'students' || (n.scope === 'student' && n.targetId === me)),
  };
  return { db: filtered, vc: {
    courses: vc.courses,
    assignments: vc.assignments,
    submissions: vc.submissions.filter(s => s.username === user.username),
    enrollments: vc.enrollments.filter(e => e.username === user.username) } };
}

/* ------------------------------------------------------------------ */
/* Sessions & login                                                   */
/* ------------------------------------------------------------------ */
const sha = s => crypto.createHash('sha256').update(s).digest('hex');

function createSession(username) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token_hash, username, expires_at) VALUES (?, ?, ?)').run(sha(token), username, Date.now() + SESSION_MS);
  return token;
}
function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function sessionUser(req) {
  const token = parseCookies(req).sid;
  if (!token) return null;
  const row = db.prepare(`SELECT u.username, u.role, u.name, COALESCE(u.teacher_id, u.student_id) AS linked_id, s.expires_at
                          FROM sessions s JOIN users u ON u.username = s.username WHERE s.token_hash = ?`).get(sha(token));
  if (!row) return null;
  if (row.expires_at < Date.now()) { db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(token)); return null; }
  return { username: row.username, role: row.role, name: row.name, linkedId: row.linked_id || null };
}
function cookieHeader(token, maxAgeSec) {
  return `sid=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAgeSec}`;
}

const attempts = new Map(); // ip|user -> {n, first}
function tooManyAttempts(key) {
  const a = attempts.get(key);
  if (!a) return false;
  if (Date.now() - a.first > 10 * 60 * 1000) { attempts.delete(key); return false; }
  return a.n >= 8;
}
function noteFailure(key) {
  const a = attempts.get(key);
  if (!a || Date.now() - a.first > 10 * 60 * 1000) attempts.set(key, { n: 1, first: Date.now() });
  else a.n++;
}

/* ------------------------------------------------------------------ */
/* Seed data & one-time import of the old data.json                   */
/* ------------------------------------------------------------------ */
function seedIfEmpty() {
  const hasUsers = db.prepare('SELECT COUNT(*) AS n FROM users').get().n > 0;
  if (hasUsers) return;

  if (fs.existsSync(LEGACY_FILE)) {
    try {
      importLegacy();
      const dest = LEGACY_FILE + '.imported';
      fs.renameSync(LEGACY_FILE, dest);
      console.log('Imported your previous data from data.json (kept as ' + path.basename(dest) + ').');
    } catch (e) {
      console.error('Could not import data.json:', e.message);
    }
  }

  inTransaction(() => {
    if (!db.prepare('SELECT 1 FROM classes').get()) {
      ['SHS 1', 'SHS 2', 'SHS 3'].forEach(n => upsertClass({ id: n, name: n, teacherId: null, subjects: [] }));
    }
    if (!db.prepare("SELECT 1 FROM users WHERE role = 'admin'").get()) {
      const pw = process.env.ADMIN_PASSWORD || 'admin123';
      upsertUser({ username: 'admin', password: pw, role: 'admin', linkedId: null, name: 'Administrator' });
      if (!process.env.ADMIN_PASSWORD) {
        console.log("Created the first admin account: username 'admin', password 'admin123'.");
        console.log('Sign in and change it, or set ADMIN_PASSWORD before the first start.');
      }
    }
  });
}

function importLegacy() {
  const raw = JSON.parse(fs.readFileSync(LEGACY_FILE, 'utf8'));
  const get = (k) => { try { return raw[k] ? JSON.parse(raw[k]) : []; } catch (e) { return []; } };
  const D = {};
  ['users', 'students', 'teachers', 'classes', 'attendance', 'exams', 'results', 'fees', 'timetable', 'sms', 'notifications']
    .forEach(k => { D[k] = get('db:' + k); });
  const V = {};
  ['courses', 'assignments', 'submissions', 'enrollments'].forEach(k => { V[k] = get('vclass:' + k); });

  const ids = k => new Set(D[k].map(r => r.id));
  const teacherIds = ids('teachers'), classIds = ids('classes'), studentIds = ids('students'), examIds = ids('exams');
  const userNames = new Set(D.users.map(u => String(u.username).toLowerCase()));
  const lc = s => String(s || '').toLowerCase();

  inTransaction(() => {
    D.classes.forEach(c => upsertClass({ ...c, teacherId: teacherIds.has(c.teacherId) ? c.teacherId : null }));
    D.teachers.forEach(t => upsertFlat(FLAT.teachers, { ...t, classId: classIds.has(t.classId) ? t.classId : null }));
    D.students.forEach(s => {
      const row = { ...s, classId: classIds.has(s.classId) ? s.classId : null };
      try { upsertFlat(FLAT.students, row); } catch (e) { console.warn('Skipped student', s.name, '-', e.message); }
    });
    D.users.forEach(u => {
      const linked = u.role === 'teacher' ? teacherIds.has(u.linkedId) : u.role === 'student' ? studentIds.has(u.linkedId) : true;
      try { upsertUser({ ...u, linkedId: linked ? u.linkedId : null, password: u.password || crypto.randomBytes(9).toString('base64') }); }
      catch (e) { console.warn('Skipped user', u.username, '-', e.message); }
    });
    D.attendance.filter(a => studentIds.has(a.studentId)).forEach(a => upsertFlat(FLAT.attendance, { ...a, classId: classIds.has(a.classId) ? a.classId : null }));
    D.exams.filter(e => classIds.has(e.classId)).forEach(upsertExam);
    D.results.filter(r => examIds.has(r.examId) && studentIds.has(r.studentId)).forEach(r => upsertFlat(FLAT.results, r));
    D.fees.filter(f => studentIds.has(f.studentId)).forEach(f => upsertFlat(FLAT.fees, f));
    D.timetable.filter(t => classIds.has(t.classId)).forEach(t => upsertFlat(FLAT.timetable, t));
    D.sms.filter(s => studentIds.has(s.studentId)).forEach(s => {
      upsertFlat(FLAT.sms, s);
      if (s.read) db.prepare('UPDATE sms SET is_read = 1 WHERE id = ?').run(s.id);
    });
    D.notifications.forEach(n => {
      upsertFlat(FLAT.notifications, n);
      if (n.read) db.prepare('INSERT OR IGNORE INTO notification_reads (notification_id, username) SELECT ?, username FROM users').run(n.id);
    });

    V.courses.filter(c => userNames.has(lc(c.teacherUsername))).forEach(c => upsertFlat(FLAT.vc_courses, c));
    const courseIds = new Set(V.courses.map(c => c.id));
    V.assignments.filter(a => courseIds.has(a.courseId)).forEach(a => upsertFlat(FLAT.vc_assignments, a));
    const asgIds = new Set(V.assignments.map(a => a.id));
    V.enrollments.filter(e => courseIds.has(e.courseId) && userNames.has(lc(e.username))).forEach(e => upsertFlat(FLAT.vc_enrollments, e));
    V.submissions.filter(s => asgIds.has(s.assignmentId) && userNames.has(lc(s.username))).forEach(s => {
      const status = ['Submitted', 'Resubmitted', 'Graded'].includes(s.status) ? s.status : 'Submitted';
      upsertFlat(FLAT.vc_submissions, { ...s, status, marks: s.marks === undefined ? null : s.marks });
    });
  });
}

/* ------------------------------------------------------------------ */
/* HTTP                                                               */
/* ------------------------------------------------------------------ */
const STATIC = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
  '/script.js': ['script.js', 'text/javascript; charset=utf-8'],
};

function send(res, status, body, headers = {}) {
  const isJson = typeof body === 'object' && !Buffer.isBuffer(body);
  res.writeHead(status, {
    'Content-Type': isJson ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(isJson ? JSON.stringify(body) : body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { reject(new HttpError(413, 'Request too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (e) { reject(new HttpError(400, 'Bad JSON')); }
    });
    req.on('error', reject);
  });
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch (e) { return false; }
}

async function handleApi(req, res, urlPath) {
  if (req.method !== 'GET' && !sameOrigin(req)) throw new HttpError(403, 'Cross-site request blocked');

  if (urlPath === '/api/ping') return send(res, 200, { ok: true });

  if (urlPath === '/api/login' && req.method === 'POST') {
    const b = await readBody(req);
    const username = String(b.username || '').trim();
    const key = (req.socket.remoteAddress || '') + '|' + username.toLowerCase();
    if (tooManyAttempts(key)) throw new HttpError(429, 'Too many attempts — please wait a few minutes and try again');
    const row = db.prepare('SELECT username, password_hash, role, name, COALESCE(teacher_id, student_id) AS linked_id FROM users WHERE username = ?').get(username);
    const ok = verifyPassword(b.password || '', row ? row.password_hash : DUMMY_HASH);
    if (!row || !ok || row.role !== b.role) { noteFailure(key); throw new HttpError(401, 'Incorrect username or password for this role.'); }
    attempts.delete(key);
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
    const token = createSession(row.username);
    return send(res, 200, { user: { username: row.username, role: row.role, name: row.name, linkedId: row.linked_id || null } },
      { 'Set-Cookie': cookieHeader(token, SESSION_MS / 1000) });
  }

  if (urlPath === '/api/logout' && req.method === 'POST') {
    const t = parseCookies(req).sid;
    if (t) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(t));
    return send(res, 200, { ok: true }, { 'Set-Cookie': cookieHeader('', 0) });
  }

  const user = sessionUser(req);
  if (!user) throw new HttpError(401, 'Please sign in');

  if (urlPath === '/api/session' && req.method === 'GET') return send(res, 200, { user });
  if (urlPath === '/api/data' && req.method === 'GET') return send(res, 200, loadData(user));

  let m;
  if ((m = urlPath.match(/^\/api\/sync\/([a-z_]+)$/)) && req.method === 'POST') {
    const b = await readBody(req);
    inTransaction(() => applyChanges(user, m[1], b.upserts, b.deletes));
    return send(res, 200, { ok: true });
  }

  if ((m = urlPath.match(/^\/api\/notifications\/([^/]+)\/read$/)) && req.method === 'POST') {
    const id = decodeURIComponent(m[1]);
    db.prepare('INSERT OR IGNORE INTO notification_reads (notification_id, username) SELECT id, ? FROM notifications WHERE id = ?').run(user.username, id);
    return send(res, 200, { ok: true });
  }
  if ((m = urlPath.match(/^\/api\/sms\/([^/]+)\/read$/)) && req.method === 'POST') {
    if (user.role !== 'student') throw new HttpError(403, 'Not allowed');
    db.prepare('UPDATE sms SET is_read = 1 WHERE id = ? AND student_id = ?').run(decodeURIComponent(m[1]), user.linkedId);
    return send(res, 200, { ok: true });
  }

  throw new HttpError(404, 'Not found');
}

const server = http.createServer(async (req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent(req.url.split('?')[0]); }
  catch (e) { return send(res, 400, 'Bad request'); }

  if (urlPath.startsWith('/api/')) {
    try { await handleApi(req, res, urlPath); }
    catch (e) {
      if (e instanceof HttpError) return send(res, e.status, { error: e.message });
      const friendly = friendlyDbError(e);
      if (friendly) return send(res, 400, { error: friendly });
      console.error(e);
      return send(res, 500, { error: 'Something went wrong on the server' });
    }
    return;
  }

  const entry = STATIC[urlPath];
  if (!entry || req.method !== 'GET') return send(res, 404, 'Not found');
  fs.readFile(path.join(ROOT, entry[0]), (err, content) => {
    if (err) return send(res, 404, 'Not found');
    res.writeHead(200, { 'Content-Type': entry[1], 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Cache-Control': 'no-cache' });
    res.end(content);
  });
});

seedIfEmpty();
server.listen(PORT, () => {
  console.log(`School Management System running at http://localhost:${PORT}`);
  console.log(`Database file: ${DB_PATH}`);
});

function shutdown() { try { db.close(); } catch (e) { /* ignore */ } process.exit(0); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
