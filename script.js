const DB_KEYS = ['users','students','teachers','classes','attendance','exams','results','fees','timetable','sms','notifications'];
let DB = { users:[], students:[], teachers:[], classes:[], attendance:[], exams:[], results:[], fees:[], timetable:[], sms:[], notifications:[] };
let session = null;
let selectedRole = 'admin';

/* Senior High School programmes offered — shown on the student registration form */
const COURSES = ['General Science','Business','General Arts','Visual Art','Agricultural Science','Home Economics','STEM'];

const NAV = [
  {id:'dashboard', label:'Dashboard', roles:['admin','teacher','student']},
  {id:'vclass', label:'Virtual Classroom', roles:['teacher','student']},
  {id:'students', label:'Students', roles:['admin','teacher']},
  {id:'teachers', label:'Teachers', roles:['admin']},
  {id:'classes', label:'Classes & Subjects', roles:['admin']},
  {id:'attendance', label:'Attendance', roles:['admin','teacher']},
  {id:'exams', label:'Exams & Results', roles:['admin','teacher']},
  {id:'fees', label:'Fee Management', roles:['admin']},
  {id:'myfees', label:'My Fees', roles:['student']},
  {id:'myresults', label:'My Results', roles:['student']},
  {id:'timetable', label:'Timetable', roles:['admin','teacher','student']},
  {id:'reports', label:'Reports', roles:['admin','teacher']},
  {id:'users', label:'User Accounts', roles:['admin']},
];
const ICON = {
  dashboard:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>',
  vclass:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"></path><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"></path><path d="M22 10v6"></path></svg>',
  students:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"></path><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"></path></svg>',
  teachers:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"></path></svg>',
  classes:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"></path></svg>',
  attendance:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
  exams:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path><path d="M14 2v6h6"></path><path d="M9 15h6M9 11h2"></path></svg>',
  fees:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M15 9.5c0-1.1-1.3-2-3-2s-3 .9-3 2 1.3 1.8 3 2 3 .9 3 2-1.3 2-3 2-3-.9-3-2"></path><path d="M12 6.2v1.3M12 16.5v1.3"></path></svg>',
  myfees:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M15 9.5c0-1.1-1.3-2-3-2s-3 .9-3 2 1.3 1.8 3 2 3 .9 3 2-1.3 2-3 2-3-.9-3-2"></path><path d="M12 6.2v1.3M12 16.5v1.3"></path></svg>',
  myresults:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4"></path><path d="M6 3h12v5a6 6 0 0 1-12 0V3Z"></path><path d="M6 5H3v1a4 4 0 0 0 3 3.9M18 5h3v1a4 4 0 0 1-3 3.9"></path></svg>',
  timetable:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"></rect><path d="M3 9h18M8 2v4M16 2v4"></path></svg>',
  reports:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"></path><path d="M7 15v3M12 10v8M17 6v12"></path></svg>',
  users:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="4"></circle><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1"></path><path d="M19 8v6M22 11h-6"></path></svg>',
};
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat'];
const PERIODS = ['P1 · 8:00','P2 · 8:50','P3 · 9:40','P4 · 10:50','P5 · 11:40','P6 · 1:00'];

function uid(prefix){ return prefix + '-' + Math.random().toString(36).slice(2,7).toUpperCase(); }
function todayISO(){ return new Date().toISOString().slice(0,10); }

/* ---------- Data layer ----------
   All data now lives in a real SQL database (school.db) behind the
   server. The page keeps an in-memory copy (DB / VC) for fast
   rendering, and saveKey() sends only the rows that changed to the
   server, which writes them to the database inside a transaction. */
async function api(method, url, body){
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? {'Content-Type':'application/json'} : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'same-origin'
  });
  let data = null;
  try{ data = await res.json(); }catch(e){ /* empty body */ }
  if(!res.ok){
    if(res.status === 401 && session && !url.endsWith('/login')){ sessionExpired(); }
    const err = new Error((data && data.error) || ('Request failed ('+res.status+')'));
    err.status = res.status;
    throw err;
  }
  return data;
}
function sessionExpired(){
  session = null;
  document.getElementById('app').classList.remove('show');
  document.getElementById('loginScreen').style.display='flex';
  toast('Your session expired — please sign in again');
}

// Snapshots of what the server has, used to work out what changed.
const SNAP = {};
const KEYFN = {
  users: r=>r.username,
  timetable: r=>r.classId+'|'+r.day+'|'+r.period,
};
function keyOf(coll, r){ return (KEYFN[coll] || (x=>x.id))(r); }
function setSnapshot(coll, rows){
  SNAP[coll] = new Map(rows.map(r=>[keyOf(coll,r), JSON.stringify(r)]));
}
async function syncCollection(coll, rows){
  const snap = SNAP[coll] || new Map();
  const upserts = [], seen = new Set();
  rows.forEach(r=>{
    const k = keyOf(coll,r); seen.add(k);
    if(snap.get(k) !== JSON.stringify(r)) upserts.push(r);
  });
  const deletes = [];
  snap.forEach((json,k)=>{ if(!seen.has(k)) deletes.push(JSON.parse(json)); });
  if(!upserts.length && !deletes.length) return true;
  try{
    await api('POST', '/api/sync/'+coll, {upserts, deletes});
    // Remember exactly what we sent so the next save only sends new changes.
    const next = SNAP[coll] || (SNAP[coll] = new Map());
    upserts.forEach(r=>next.set(keyOf(coll,r), JSON.stringify(r)));
    deletes.forEach(r=>next.delete(keyOf(coll,r)));
    return true;
  }catch(e){
    toast(e.message || 'Could not save');
    await refreshData(true);   // put the screen back in line with the database
    throw e;                   // stops the caller, so the form stays open
  }
}

async function loadAll(){
  const data = await api('GET', '/api/data');
  for(const key of DB_KEYS){ DB[key] = data.db[key] || []; setSnapshot(key, DB[key]); }
  for(const key of VC_KEYS){ VC[key] = data.vc[key] || []; setSnapshot('vc_'+key, VC[key]); }
  return data;
}
let lastDataHash = '';
function hashStr(str){ let h=0; for(let i=0;i<str.length;i++){ h=(h*31+str.charCodeAt(i))|0; } return h; }
function dataHash(){ const j = JSON.stringify([DB, VC]); return j.length + ':' + hashStr(j); }
async function refreshData(force){
  if(!session) return;
  try{ await loadAll(); }catch(e){ return; }   // keep showing what we have
  const h = dataHash();
  const changed = h !== lastDataHash;
  lastDataHash = h;
  if(document.getElementById('modalOverlay').classList.contains('show')) return;
  if(force || changed){
    rerenderPage(document.querySelector('.nav-btn.active')?.dataset.page || 'dashboard');
  }
}

async function saveKey(key){
  if(key === 'users'){
    try{ await syncCollection('users', DB.users); }
    finally{ DB.users.forEach(u=>{ delete u.password; }); }   // never keep passwords in the browser
    setSnapshot('users', DB.users);
    return;
  }
  await syncCollection(key, DB[key]);
}

let toastTimer;
function toast(msg){
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2400);
}

document.getElementById('roleRow').addEventListener('click', e=>{
  const opt = e.target.closest('.role-opt'); if(!opt) return;
  document.querySelectorAll('.role-opt').forEach(o=>o.classList.remove('active'));
  opt.classList.add('active');
  selectedRole = opt.dataset.role;
});

async function attemptLogin(){
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  const err = document.getElementById('loginError');
  try{
    const res = await api('POST', '/api/login', {username:u, password:p, role:selectedRole});
    err.style.display='none';
    await startSession(res.user, true);
  }catch(e){
    err.textContent = e.message || 'Could not sign in';
    err.style.display='block';
  }
}
async function startSession(user, isNewLogin){
  session = user;
  await loadAll();
  lastDataHash = dataHash();
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('app').classList.add('show');
  buildNav();
  goPage('dashboard', true);
  if(isNewLogin) toast('Welcome back, ' + user.name.split(' ')[0]);
}
async function logout(){
  try{ await api('POST', '/api/logout', {}); }catch(e){ /* signing out locally anyway */ }
  session = null;
  for(const k of DB_KEYS) DB[k] = [];
  for(const k of VC_KEYS) VC[k] = [];
  for(const k of Object.keys(SNAP)) delete SNAP[k];
  document.getElementById('app').classList.remove('show');
  document.getElementById('loginScreen').style.display='flex';
  document.getElementById('loginUser').value=''; document.getElementById('loginPass').value='';
  closeMobileNav();
}

function buildNav(){
  const items = NAV.filter(n=>n.roles.includes(session.role));
  const navHtml = (i,n)=>`${ICON[n.id]||''}<span class="num">${String(i+1).padStart(2,'0')}</span>${n.label}`;

  const nav = document.getElementById('navList');
  nav.innerHTML='';
  items.forEach((n,i)=>{
    const b = document.createElement('button');
    b.className='nav-btn'+(n.id==='vclass'?' vclass-link':''); b.dataset.page=n.id;
    b.innerHTML = navHtml(i,n);
    b.onclick = ()=>goPage(n.id);
    nav.appendChild(b);
  });
  document.getElementById('whoName').textContent = session.name;
  document.getElementById('whoRole').innerHTML = `<span class="badge-role">${session.role}</span>`;

  const mnav = document.getElementById('mobileNavDropdown');
  mnav.innerHTML='';
  items.forEach((n,i)=>{
    const b = document.createElement('button');
    b.className='nav-btn'+(n.id==='vclass'?' vclass-link':''); b.dataset.page=n.id;
    b.innerHTML = navHtml(i,n);
    b.onclick = ()=>{ goPage(n.id); closeMobileNav(); };
    mnav.appendChild(b);
  });
  const mwho = document.createElement('div');
  mwho.className='who';
  mwho.innerHTML = `<b>${session.name}</b><span class="badge-role">${session.role}</span>`;
  mnav.appendChild(mwho);
  const mlogout = document.createElement('button');
  mlogout.className='logout-btn'; mlogout.textContent='Sign out';
  mlogout.onclick = ()=>{ closeMobileNav(); logout(); };
  mnav.appendChild(mlogout);
}
function toggleMobileNav(){
  document.getElementById('mobileNavDropdown').classList.toggle('show');
  document.getElementById('mobileMenuBtn').classList.toggle('open');
}
function closeMobileNav(){
  document.getElementById('mobileNavDropdown').classList.remove('show');
  document.getElementById('mobileMenuBtn').classList.remove('open');
}
function rerenderPage(id){
  const renderers = {dashboard:renderDashboard, vclass:vcRender, students:renderStudents, teachers:renderTeachers, classes:renderClasses,
    attendance:renderAttendancePage, exams:renderExams, fees:renderFees, myfees:renderMyFees, myresults:renderMyResults,
    timetable:renderTimetablePage, reports:renderReports, users:renderUsers};
  if(renderers[id]) renderers[id]();
}
function goPage(id, justLoaded){
  const navItem = NAV.find(n=>n.id===id);
  if(!navItem || !navItem.roles.includes(session.role)){
    toast("You don't have access to that page");
    id = 'dashboard';
  }
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active', p.dataset.page===id));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.page===id));
  const renderers = {dashboard:renderDashboard, vclass:renderVClass, students:renderStudents, teachers:renderTeachers, classes:renderClasses,
    attendance:renderAttendancePage, exams:renderExams, fees:renderFees, myfees:renderMyFees, myresults:renderMyResults,
    timetable:renderTimetablePage, reports:renderReports, users:renderUsers};
  if(renderers[id]) renderers[id]();
  // Pick up changes other people have saved since this page last loaded.
  if(!justLoaded) refreshData();
}

function className(id){ const c = DB.classes.find(x=>x.id===id); return c ? c.name : '—'; }
function studentsInClass(classId){ return DB.students.filter(s=>s.classId===classId && s.status==='active'); }
function fillClassSelect(sel, includeAll){
  sel.innerHTML = (includeAll?'<option value="">All classes</option>':'') + DB.classes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
}

function greetingWord(){
  const h = new Date().getHours();
  if(h<12) return 'Good morning';
  if(h<17) return 'Good afternoon';
  return 'Good evening';
}
function renderGreeting(){
  const el = document.getElementById('greetBanner');
  if(!el || !session) return;
  const first = session.name.split(' ')[0];
  const roleLine = session.role==='student'
    ? "Welcome back to your student portal — here's where you stand today."
    : session.role==='teacher'
      ? "Welcome back to the staff portal — here's today's overview."
      : "Welcome to the Osbert Senior High School Register.";
  el.innerHTML = `<div class="greet-card"><div class="greet-emoji">👋</div><div><b>${greetingWord()}, ${first}!</b><p>${roleLine}</p></div></div>`;
}
function renderStudentSmsBanner(student){
  const dashEl = document.getElementById('smsBannerDash');
  const feesEl = document.getElementById('smsBannerFees');
  const unread = student ? DB.sms.filter(m=>m.studentId===student.id && !m.read).slice().reverse() : [];
  const html = unread.map(m=>`
    <div class="sms-banner">
      <div class="sms-banner-icon">💬</div>
      <div class="sms-banner-body"><b>SMS Notification</b><p>${m.message}</p></div>
      <button class="btn-ghost" onclick="dismissSms('${m.id}')">Dismiss</button>
    </div>`).join('');
  if(dashEl) dashEl.innerHTML = html;
  if(feesEl) feesEl.innerHTML = html;
}
async function dismissSms(id){
  const m = DB.sms.find(x=>x.id===id);
  if(m){ m.read = true; try{ await api('POST','/api/sms/'+encodeURIComponent(id)+'/read'); }catch(e){ toast(e.message); } }
  renderStudentSmsBanner(currentStudentRecord());
}

/* ---------- Admin activity notifications ----------
   Whenever the admin does something noteworthy (admits a student,
   hires a teacher, records a fee payment, publishes results, etc.)
   a short notice is pushed out to the relevant dashboards:
   every teacher, every student, and — separately — the one person
   directly affected by the action. */
function pushNotice({toTeachers, toStudents, personRole, personId, personMessage, studentIds, studentMessage}){
  const date = new Date().toISOString();
  const from = session ? session.name : 'School Office';
  if(toTeachers) DB.notifications.push({id:uid('NTF'), scope:'teachers', message:toTeachers, from, date, read:false});
  if(toStudents) DB.notifications.push({id:uid('NTF'), scope:'students', message:toStudents, from, date, read:false});
  if(personRole && personId && personMessage) DB.notifications.push({id:uid('NTF'), scope:personRole, targetId:personId, message:personMessage, from, date, read:false});
  if(studentIds && studentIds.length && studentMessage){
    studentIds.forEach(sid=>DB.notifications.push({id:uid('NTF'), scope:'student', targetId:sid, message:studentMessage, from, date, read:false}));
  }
  saveKey('notifications');
}
function renderNoticeBanner(){
  const el = document.getElementById('noticeBannerDash');
  if(!el || !session) return;
  let list = [];
  if(session.role==='teacher'){
    list = DB.notifications.filter(n=>!n.read && (n.scope==='teachers' || (n.scope==='teacher' && n.targetId===session.linkedId)));
  } else if(session.role==='student'){
    list = DB.notifications.filter(n=>!n.read && (n.scope==='students' || (n.scope==='student' && n.targetId===session.linkedId)));
  } else {
    el.innerHTML = ''; return;
  }
  list = list.slice().reverse();
  el.innerHTML = list.map(n=>`
    <div class="notice-banner">
      <div class="notice-banner-icon">📢</div>
      <div class="notice-banner-body"><b>Notice from ${n.from||'School Office'}</b><p>${n.message}</p></div>
      <button class="btn-ghost" onclick="dismissNotice('${n.id}')">Dismiss</button>
    </div>`).join('');
}
async function dismissNotice(id){
  const n = DB.notifications.find(x=>x.id===id);
  if(n){ n.read = true; try{ await api('POST','/api/notifications/'+encodeURIComponent(id)+'/read'); }catch(e){ toast(e.message); } }
  renderNoticeBanner();
}

function renderDashboard(){
  document.getElementById('dashDate').textContent = new Date().toLocaleDateString(undefined,{weekday:'long', year:'numeric', month:'long', day:'numeric'});
  renderGreeting();
  renderNoticeBanner();
  if(session.role==='student'){ renderStudentDashboard(); return; }

  const totalStudents = DB.students.filter(s=>s.status==='active').length;
  const totalTeachers = DB.teachers.length;
  const totalClasses = DB.classes.length;
  const cards = [
    {n:totalStudents, l:'Active Students'},
    {n:totalTeachers, l:'Teaching Staff'},
    {n:totalClasses, l:'Classes'},
  ];
  if(session.role==='admin'){
    const feeCollected = DB.fees.reduce((a,f)=>a+f.paid,0);
    const feeDue = DB.fees.reduce((a,f)=>a+(f.due-f.paid),0);
    cards.push({n:'$'+feeCollected.toLocaleString(), l:'Fees Collected'});
    cards.push({n:'$'+feeDue.toLocaleString(), l:'Fees Outstanding'});
  }
  document.getElementById('statCards').innerHTML = cards.map(c=>`<div class="stat"><b>${c.n}</b><span>${c.l}</span></div>`).join('');

  const today = todayISO();
  const todAtt = DB.attendance.filter(a=>a.date===today);
  const presentCount = todAtt.filter(a=>a.status==='present').length;
  let body = '';
  if(todAtt.length===0){
    body = `<div class="empty">No attendance has been marked yet today. Head to <strong>Attendance</strong> to record it.</div>`;
  } else {
    body = `<div class="bar-row"><span class="lbl">Present today</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(presentCount/todAtt.length*100)}%"></div></div><span class="val">${presentCount}/${todAtt.length}</span></div>`;
  }
  const upcoming = DB.exams.slice(-3).reverse().map(e=>`<div class="bar-row"><span class="lbl">${e.name}</span><span style="color:var(--muted);font-size:12.5px;">${className(e.classId)} · ${e.date}</span></div>`).join('');
  body += upcoming ? `<div style="margin-top:14px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:8px;">Recent exams</div>${upcoming}` : '';
  document.getElementById('dashBody').innerHTML = body;
}

function renderStudentDashboard(){
  const student = currentStudentRecord();
  renderStudentSmsBanner(student);
  if(!student){
    document.getElementById('statCards').innerHTML = '';
    document.getElementById('dashBody').innerHTML = `<div class="empty">Your account isn't linked to a student record yet — ask an admin to link it.</div>`;
    return;
  }
  const myFees = DB.fees.filter(f=>f.studentId===student.id);
  const due = myFees.reduce((a,f)=>a+f.due,0), paid = myFees.reduce((a,f)=>a+f.paid,0);
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-30);
  const myAtt = DB.attendance.filter(a=>a.studentId===student.id && new Date(a.date)>=cutoff);
  const present = myAtt.filter(a=>a.status==='present'||a.status==='late').length;
  const attPct = myAtt.length ? Math.round(present/myAtt.length*100) : 0;
  const cards = [
    {n:className(student.classId), l:'Your Class'},
    {n:student.course||'—', l:'Your Course'},
    {n:attPct+'%', l:'Attendance (30d)'},
    {n:'$'+Math.max(due-paid,0).toLocaleString(), l:'Fee Balance'},
  ];
  document.getElementById('statCards').innerHTML = cards.map(c=>`<div class="stat"><b>${c.n}</b><span>${c.l}</span></div>`).join('');

  const myExamIds = DB.exams.filter(e=>e.classId===student.classId).map(e=>e.id);
  const myResults = DB.results.filter(r=>myExamIds.includes(r.examId) && r.studentId===student.id);
  const avg = myResults.length ? Math.round(myResults.reduce((a,r)=>a+r.marks,0)/myResults.length) : null;
  let body = avg!==null
    ? `<div class="bar-row"><span class="lbl">Average across exams</span><div class="bar-track"><div class="bar-fill" style="width:${avg}%"></div></div><span class="val">${avg}% · ${grade(avg)}</span></div>`
    : `<div class="empty">No results recorded for you yet. Check <strong>My Results</strong> once exams are graded.</div>`;
  document.getElementById('dashBody').innerHTML = body;
}
function renderStudents(){
  const sel = document.getElementById('stuFilterClass');
  if(sel.options.length<=1) fillClassSelect(sel, true);
  const q = document.getElementById('stuSearch').value.toLowerCase();
  const clsFilter = sel.value;
  const rows = DB.students.filter(s=>{
    const matchQ = s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q);
    const matchC = !clsFilter || s.classId===clsFilter;
    return matchQ && matchC;
  });
  const tbody = document.getElementById('studentTable');
  tbody.innerHTML = rows.length ? rows.map(s=>`
    <tr>
      <td class="mono">${s.roll}</td>
      <td><div style="display:flex;align-items:center;gap:9px;">${s.photo?`<img src="${s.photo}" style="width:30px;height:30px;border-radius:6px;object-fit:cover;">`:`<div style="width:30px;height:30px;border-radius:6px;background:var(--paper-2);flex-shrink:0;"></div>`}<strong>${s.name}</strong></div></td>
      <td>${className(s.classId)}</td>
      <td>${s.course||'—'}</td>
      <td>${s.guardian}</td>
      <td class="mono">${s.contact}</td>
      <td><span class="badge ${s.status}">${s.status}</span></td>
      <td class="cell-actions">
        <button class="btn-ghost" onclick="openStudentModal('${s.id}')">Edit</button>
        <button class="btn-danger" onclick="deleteStudent('${s.id}')">Remove</button>
      </td>
    </tr>`).join('') : `<tr><td colspan="8" class="empty">No students match.</td></tr>`;
}
function openStudentModal(id){
  const s = id ? DB.students.find(x=>x.id===id) : null;
  const classOpts = DB.classes.map(c=>`<option value="${c.id}" ${s&&s.classId===c.id?'selected':''}>${c.name}</option>`).join('');
  const courseOpts = '<option value="">Select course…</option>' + COURSES.map(co=>`<option value="${co}" ${s&&s.course===co?'selected':''}>${co}</option>`).join('');
  showModal(`
    <h3>${s?'Edit Student':'Admit Student'}</h3>
    <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:14px;">
      <div id="photoPreview" data-photo="${s&&s.photo?s.photo:''}" style="width:74px;height:74px;flex-shrink:0;border-radius:8px;border:1px solid var(--line);background:var(--paper-2);display:flex;align-items:center;justify-content:center;overflow:hidden;">
        ${s&&s.photo?`<img src="${s.photo}" style="width:100%;height:100%;object-fit:cover;">`:'<span style="font-size:10px;color:var(--muted);">No photo</span>'}
      </div>
      <div style="flex:1;"><label>Passport picture</label>
        <label class="file-btn">📷 Choose file
          <input type="file" accept="image/*" onchange="previewPhoto(event,'photoPreview')">
        </label>
        <span class="file-name" id="photoFileName">${s&&s.photo?'Current photo on file':'No file chosen'}</span>
      </div>
    </div>
    <div class="grid-2">
      <div><label>Full name</label><input id="f_name" value="${s?s.name:''}"></div>
      <div><label>Roll number</label><input id="f_roll" value="${s?s.roll:''}"></div>
      <div><label>Class</label><select id="f_class">${classOpts}</select></div>
      <div><label>Course (Programme)</label><select id="f_course">${courseOpts}</select></div>
      <div><label>Status</label><select id="f_status"><option ${s&&s.status==='active'?'selected':''}>active</option><option ${s&&s.status==='inactive'?'selected':''}>inactive</option></select></div>
      <div><label>Date of birth</label><input type="date" id="f_dob" value="${s?s.dob||'':''}"></div>
      <div><label>Gender</label><select id="f_gender"><option value="Male" ${s&&s.gender==='Male'?'selected':''}>Male</option><option value="Female" ${s&&s.gender==='Female'?'selected':''}>Female</option></select></div>
      <div><label>Location / Address</label><input id="f_location" value="${s?s.location||'':''}"></div>
      <div><label>Ghana Card No.</label><input id="f_ghanacard" value="${s?s.ghanaCard||'':''}" placeholder="GHA-000000000-0"></div>
      <div><label>Guardian name</label><input id="f_guardian" value="${s?s.guardian:''}"></div>
      <div><label>Contact</label><input id="f_contact" value="${s?s.contact:''}"></div>
    </div>
    <button class="btn-primary" onclick="saveStudent('${id||''}')">Save student</button>
  `);
}
function previewPhoto(ev, previewId){
  const file = ev.target.files[0];
  if(!file) return;
  const nameEl = document.getElementById('photoFileName');
  if(nameEl) nameEl.textContent = file.name;
  const reader = new FileReader();
  reader.onload = ()=>{
    const img = new Image();
    img.onload = ()=>{
      // downscale to keep stored records small
      const maxDim = 300;
      let w = img.width, h = img.height;
      if(w > maxDim || h > maxDim){
        if(w > h){ h = Math.round(h * maxDim / w); w = maxDim; }
        else { w = Math.round(w * maxDim / h); h = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      const el = document.getElementById(previewId);
      el.innerHTML = `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:cover;">`;
      el.dataset.photo = dataUrl;
    };
    img.src = reader.result;
  };
  reader.onerror = ()=>{ toast('Could not read that image file'); };
  reader.readAsDataURL(file);
}
async function saveStudent(id){
  const name = document.getElementById('f_name').value.trim();
  const roll = document.getElementById('f_roll').value.trim();
  if(!name || !roll){ toast('Name and roll number are required'); return; }
  const data = { name, roll, classId:document.getElementById('f_class').value, course:document.getElementById('f_course').value, status:document.getElementById('f_status').value,
    guardian:document.getElementById('f_guardian').value.trim(), contact:document.getElementById('f_contact').value.trim(),
    dob:document.getElementById('f_dob').value, gender:document.getElementById('f_gender').value,
    location:document.getElementById('f_location').value.trim(), ghanaCard:document.getElementById('f_ghanacard').value.trim(),
    photo:document.getElementById('photoPreview').dataset.photo || '' };
  let newId = null;
  if(id){
    const s = DB.students.find(x=>x.id===id); Object.assign(s, data);
  } else {
    newId = uid('STU');
    DB.students.push({id:newId, ...data});
  }
  await saveKey('students'); closeModal(); renderStudents(); toast('Student record saved');
  if(newId){
    const cls = className(data.classId);
    pushNotice({
      toTeachers: `New student admitted: ${name} has just been enrolled in ${cls}. Please review your class list and update your attendance and results records to include them.`,
      toStudents: `Please join us in welcoming ${name}, who has just been admitted into ${cls}. Take a moment to introduce yourself if you share any classes together.`,
      personRole:'student', personId:newId,
      personMessage: `Welcome to Osbert Senior High School, ${name}! Your admission into ${cls} is now complete. Your dashboard now shows your class, course, attendance, fees and results — take a look around. We're glad to have you with us.`
    });
  }
}
async function deleteStudent(id){
  if(!confirm('Remove this student record?')) return;
  DB.students = DB.students.filter(s=>s.id!==id);
  await saveKey('students'); renderStudents(); toast('Student removed');
}

function renderTeachers(){
  const tbody = document.getElementById('teacherTable');
  tbody.innerHTML = DB.teachers.length ? DB.teachers.map(t=>`
    <tr><td class="mono">${t.id}</td><td><div style="display:flex;align-items:center;gap:9px;">${t.photo?`<img src="${t.photo}" style="width:30px;height:30px;border-radius:6px;object-fit:cover;">`:`<div style="width:30px;height:30px;border-radius:6px;background:var(--paper-2);flex-shrink:0;"></div>`}<strong>${t.name}</strong></div></td><td>${t.subject}</td><td>${className(t.classId)}</td><td class="mono">${t.contact}</td>
    <td class="cell-actions"><button class="btn-ghost" onclick="openTeacherModal('${t.id}')">Edit</button><button class="btn-danger" onclick="deleteTeacher('${t.id}')">Remove</button></td></tr>
  `).join('') : `<tr><td colspan="6" class="empty">No teachers added yet.</td></tr>`;
}
function openTeacherModal(id){
  const t = id ? DB.teachers.find(x=>x.id===id) : null;
  const classOpts = '<option value="">Unassigned</option>' + DB.classes.map(c=>`<option value="${c.id}" ${t&&t.classId===c.id?'selected':''}>${c.name}</option>`).join('');
  showModal(`
    <h3>${t?'Edit Teacher':'Add Teacher'}</h3>
    <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:14px;">
      <div id="photoPreview" data-photo="${t&&t.photo?t.photo:''}" style="width:74px;height:74px;flex-shrink:0;border-radius:8px;border:1px solid var(--line);background:var(--paper-2);display:flex;align-items:center;justify-content:center;overflow:hidden;">
        ${t&&t.photo?`<img src="${t.photo}" style="width:100%;height:100%;object-fit:cover;">`:'<span style="font-size:10px;color:var(--muted);">No photo</span>'}
      </div>
      <div style="flex:1;"><label>Passport picture</label>
        <label class="file-btn">📷 Choose file
          <input type="file" accept="image/*" onchange="previewPhoto(event,'photoPreview')">
        </label>
        <span class="file-name" id="photoFileName">${t&&t.photo?'Current photo on file':'No file chosen'}</span>
      </div>
    </div>
    <div class="grid-2">
      <div><label>Full name</label><input id="f_name" value="${t?t.name:''}"></div>
      <div><label>Subject</label><input id="f_subject" value="${t?t.subject:''}"></div>
      <div><label>Assigned class</label><select id="f_class">${classOpts}</select></div>
      <div><label>Contact email</label><input id="f_contact" value="${t?t.contact:''}"></div>
      <div><label>Date of birth</label><input type="date" id="f_dob" value="${t?t.dob||'':''}"></div>
      <div><label>Gender</label><select id="f_gender"><option value="Male" ${t&&t.gender==='Male'?'selected':''}>Male</option><option value="Female" ${t&&t.gender==='Female'?'selected':''}>Female</option></select></div>
      <div><label>Location / Address</label><input id="f_location" value="${t?t.location||'':''}"></div>
      <div><label>Ghana Card No.</label><input id="f_ghanacard" value="${t?t.ghanaCard||'':''}" placeholder="GHA-000000000-0"></div>
    </div>
    <button class="btn-primary" onclick="saveTeacher('${id||''}')">Save teacher</button>
  `);
}
async function saveTeacher(id){
  const name = document.getElementById('f_name').value.trim();
  if(!name){ toast('Name is required'); return; }
  const data = {name, subject:document.getElementById('f_subject').value.trim(), classId:document.getElementById('f_class').value||null, contact:document.getElementById('f_contact').value.trim(),
    dob:document.getElementById('f_dob').value, gender:document.getElementById('f_gender').value,
    location:document.getElementById('f_location').value.trim(), ghanaCard:document.getElementById('f_ghanacard').value.trim(),
    photo:document.getElementById('photoPreview').dataset.photo || '' };
  let newId = null;
  if(id){ Object.assign(DB.teachers.find(x=>x.id===id), data); }
  else { newId = uid('TCH'); DB.teachers.push({id:newId, ...data}); }
  await saveKey('teachers'); closeModal(); renderTeachers(); toast('Teacher record saved');
  if(newId){
    const cls = data.classId ? className(data.classId) : 'no class yet';
    pushNotice({
      toTeachers: `A new colleague has joined the staff: ${name}, teaching ${data.subject||'their subject'} and assigned to ${cls}. Please welcome them to the team.`,
      toStudents: `A new teacher, ${name}, has joined the school teaching ${data.subject||'their subject'}. Please give them a warm welcome.`,
      personRole:'teacher', personId:newId,
      personMessage: `Welcome to Osbert Senior High School, ${name}! You've been assigned to teach ${data.subject||'your subject'} for ${cls}. Your dashboard now shows your class, timetable and student records. We're excited to have you on the team.`
    });
  }
}
async function deleteTeacher(id){
  if(!confirm('Remove this teacher?')) return;
  DB.teachers = DB.teachers.filter(t=>t.id!==id);
  await saveKey('teachers'); renderTeachers(); toast('Teacher removed');
}

function renderClasses(){
  const tbody = document.getElementById('classTable');
  tbody.innerHTML = DB.classes.length ? DB.classes.map(c=>{
    const t = DB.teachers.find(x=>x.id===c.teacherId);
    return `<tr><td><strong>${c.name}</strong></td><td>${t?t.name:'—'}</td><td>${c.subjects.join(', ')||'—'}</td><td>${studentsInClass(c.id).length}</td>
    <td class="cell-actions"><button class="btn-ghost" onclick="openClassModal('${c.id}')">Edit</button><button class="btn-danger" onclick="deleteClass('${c.id}')">Remove</button></td></tr>`;
  }).join('') : `<tr><td colspan="5" class="empty">No classes defined yet.</td></tr>`;
}
function openClassModal(id){
  const c = id ? DB.classes.find(x=>x.id===id) : null;
  const teacherOpts = '<option value="">Unassigned</option>' + DB.teachers.map(t=>`<option value="${t.id}" ${c&&c.teacherId===t.id?'selected':''}>${t.name}</option>`).join('');
  showModal(`
    <h3>${c?'Edit Class':'Add Class'}</h3>
    <label>Class name</label><input id="f_name" value="${c?c.name:''}" placeholder="e.g. Grade 8 - A">
    <label>Class teacher</label><select id="f_teacher">${teacherOpts}</select>
    <label>Subjects (comma separated)</label><textarea id="f_subjects" rows="2">${c?c.subjects.join(', '):''}</textarea>
    <button class="btn-primary" onclick="saveClass('${id||''}')">Save class</button>
  `);
}
async function saveClass(id){
  const name = document.getElementById('f_name').value.trim();
  if(!name){ toast('Class name required'); return; }
  const subjects = document.getElementById('f_subjects').value.split(',').map(s=>s.trim()).filter(Boolean);
  const data = {name, teacherId:document.getElementById('f_teacher').value||null, subjects};
  if(id){ Object.assign(DB.classes.find(x=>x.id===id), data); }
  else { DB.classes.push({id:uid('CLS'), ...data}); }
  await saveKey('classes'); closeModal(); renderClasses(); toast('Class saved');
}
async function deleteClass(id){
  if(!confirm('Remove this class? Students remain but will show an empty class.')) return;
  DB.classes = DB.classes.filter(c=>c.id!==id);
  await saveKey('classes'); renderClasses(); toast('Class removed');
}

function renderAttendancePage(){
  const sel = document.getElementById('attClass');
  fillClassSelect(sel, false);
  document.getElementById('attDate').value = document.getElementById('attDate').value || todayISO();
  renderAttendanceGrid();
}
function renderAttendanceGrid(){
  const classId = document.getElementById('attClass').value;
  const date = document.getElementById('attDate').value || todayISO();
  const students = studentsInClass(classId);
  const existing = {};
  DB.attendance.filter(a=>a.classId===classId && a.date===date).forEach(a=>existing[a.studentId]=a.status);
  const grid = document.getElementById('attGrid');
  grid.innerHTML = students.length ? students.map(s=>`
    <div class="att-row" data-student="${s.id}">
      <div class="nm">${s.name} <span class="mono" style="color:var(--muted);font-weight:400;">${s.roll}</span></div>
      <div class="att-toggle">
        <button class="att-opt present ${existing[s.id]==='present'?'on present':''}" onclick="setAtt('${s.id}','present')">Present</button>
        <button class="att-opt late ${existing[s.id]==='late'?'on late':''}" onclick="setAtt('${s.id}','late')">Late</button>
        <button class="att-opt absent ${existing[s.id]==='absent'?'on absent':''}" onclick="setAtt('${s.id}','absent')">Absent</button>
      </div>
    </div>`).join('') : `<div class="empty">No active students in this class.</div>`;
  renderAttSummary();
}
function setAtt(studentId, status){
  const row = document.querySelector(`.att-row[data-student="${studentId}"]`);
  row.querySelectorAll('.att-opt').forEach(b=>b.classList.remove('on','present','late','absent'));
  row.querySelector(`.att-opt.${status}`).classList.add('on', status);
}
async function saveAttendance(){
  const classId = document.getElementById('attClass').value;
  const date = document.getElementById('attDate').value || todayISO();
  if(!classId){ toast('Select a class first'); return; }
  document.querySelectorAll('.att-row').forEach(row=>{
    const studentId = row.dataset.student;
    const onBtn = row.querySelector('.att-opt.on');
    if(!onBtn) return;
    const status = onBtn.classList.contains('present')?'present':onBtn.classList.contains('late')?'late':'absent';
    DB.attendance = DB.attendance.filter(a=>!(a.studentId===studentId && a.date===date));
    DB.attendance.push({id:uid('ATT'), studentId, classId, date, status});
  });
  await saveKey('attendance');
  toast('Attendance saved for ' + date);
  renderAttSummary();
}
function renderAttSummary(){
  const classId = document.getElementById('attClass').value;
  const students = studentsInClass(classId);
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-30);
  const recs = DB.attendance.filter(a=>a.classId===classId && new Date(a.date)>=cutoff);
  const html = students.map(s=>{
    const mine = recs.filter(r=>r.studentId===s.id);
    const present = mine.filter(r=>r.status==='present'||r.status==='late').length;
    const pct = mine.length ? Math.round(present/mine.length*100) : 0;
    return `<div class="bar-row"><span class="lbl">${s.name}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><span class="val">${pct}%</span></div>`;
  }).join('');
  document.getElementById('attSummary').innerHTML = html || `<div class="empty">No data for this class yet.</div>`;
}

function renderExams(){
  const tbody = document.getElementById('examTable');
  tbody.innerHTML = DB.exams.length ? DB.exams.map(e=>`
    <tr><td><strong>${e.name}</strong></td><td>${className(e.classId)}</td><td>${e.date}</td><td>${e.subjects.join(', ')}</td>
    <td class="cell-actions"><button class="btn-ghost" onclick="openResultsModal('${e.id}')">Enter marks</button><button class="btn-danger" onclick="deleteExam('${e.id}')">Remove</button></td></tr>
  `).join('') : `<tr><td colspan="5" class="empty">No exams created yet.</td></tr>`;
}
function openExamModal(){
  const classOpts = DB.classes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  showModal(`
    <h3>New Exam</h3>
    <label>Exam name</label><input id="f_name" placeholder="e.g. End of Term Exam">
    <label>Class</label><select id="f_class">${classOpts}</select>
    <label>Date</label><input type="date" id="f_date" value="${todayISO()}">
    <label>Subjects (comma separated — defaults to class subjects)</label><textarea id="f_subjects" rows="2"></textarea>
    <button class="btn-primary" onclick="saveExam()">Create exam</button>
  `);
  document.getElementById('f_class').addEventListener('change', e=>{
    const c = DB.classes.find(x=>x.id===e.target.value);
    document.getElementById('f_subjects').value = c ? c.subjects.join(', ') : '';
  });
  document.getElementById('f_class').dispatchEvent(new Event('change'));
}
async function saveExam(){
  const name = document.getElementById('f_name').value.trim();
  const classId = document.getElementById('f_class').value;
  if(!name || !classId){ toast('Exam name and class are required'); return; }
  const subjects = document.getElementById('f_subjects').value.split(',').map(s=>s.trim()).filter(Boolean);
  const date = document.getElementById('f_date').value;
  DB.exams.push({id:uid('EXM'), name, classId, date, subjects});
  await saveKey('exams'); closeModal(); renderExams(); toast('Exam created');
  const students = studentsInClass(classId);
  if(students.length){
    pushNotice({
      toTeachers: `A new exam has been scheduled: "${name}" for ${className(classId)} on ${date}, covering ${subjects.join(', ')||'the class subjects'}. Please prepare your students accordingly.`,
      studentIds: students.map(s=>s.id),
      studentMessage: `An exam, "${name}", has been scheduled for ${date}. It will cover: ${subjects.join(', ')||'your class subjects'}. Please check the Exams section and start revising ahead of time. Good luck!`
    });
  }
}
async function deleteExam(id){
  if(!confirm('Delete this exam and its recorded results?')) return;
  DB.exams = DB.exams.filter(e=>e.id!==id);
  DB.results = DB.results.filter(r=>r.examId!==id);
  await saveKey('exams'); await saveKey('results'); renderExams(); toast('Exam deleted');
}
function grade(pct){
  if(pct>=70) return 'A1'; if(pct>=60) return 'B2'; if(pct>=50) return 'C'; if(pct>=40) return 'D'; return 'F';
}
function openResultsModal(examId){
  const exam = DB.exams.find(e=>e.id===examId);
  const students = studentsInClass(exam.classId);
  const rows = students.map(s=>{
    const cells = exam.subjects.map(sub=>{
      const rec = DB.results.find(r=>r.examId===examId && r.studentId===s.id && r.subject===sub);
      return `<td><input type="number" min="0" max="100" data-student="${s.id}" data-subject="${sub}" value="${rec?rec.marks:''}" style="margin:0;padding:6px;font-size:12.5px;"></td>`;
    }).join('');
    return `<tr><td style="white-space:nowrap;"><strong>${s.name}</strong></td>${cells}</tr>`;
  }).join('');
  showModal(`
    <h3>${exam.name} — ${className(exam.classId)}</h3>
    <div style="overflow-x:auto;max-width:100%;">
    <table class="mono" style="font-size:12.5px;"><thead><tr><th>Student</th>${exam.subjects.map(s=>`<th>${s}</th>`).join('')}</tr></thead>
    <tbody>${rows || '<tr><td class="empty">No students in this class.</td></tr>'}</tbody></table>
    </div>
    <button class="btn-primary" style="margin-top:16px;" onclick="saveResults('${examId}')">Save marks</button>
  `, true);
}
async function saveResults(examId){
  const exam = DB.exams.find(e=>e.id===examId);
  const savedStudentIds = new Set();
  document.querySelectorAll('#modalBox input[data-student]').forEach(inp=>{
    const studentId = inp.dataset.student, subject = inp.dataset.subject, marks = inp.value;
    if(marks===''){ return; }
    DB.results = DB.results.filter(r=>!(r.examId===examId && r.studentId===studentId && r.subject===subject));
    DB.results.push({id:uid('RES'), examId, studentId, subject, marks:Number(marks)});
    savedStudentIds.add(studentId);
  });
  await saveKey('results'); closeModal(); toast('Results saved');
  if(savedStudentIds.size && exam){
    pushNotice({
      studentIds:[...savedStudentIds],
      studentMessage: `Your results for "${exam.name}" have been published. Log in to My Results to see your marks and grade for each subject. Well done on completing the exam — keep up the good work!`
    });
  }
}

function renderFees(){
  const totalDue = DB.fees.reduce((a,f)=>a+f.due,0);
  const totalPaid = DB.fees.reduce((a,f)=>a+f.paid,0);
  document.getElementById('feeStats').innerHTML = `
    <div class="stat"><b>$${totalPaid.toLocaleString()}</b><span>Total Collected</span></div>
    <div class="stat"><b>$${(totalDue-totalPaid).toLocaleString()}</b><span>Total Outstanding</span></div>
    <div class="stat"><b>${DB.fees.filter(f=>f.paid>=f.due).length}</b><span>Fully Paid Students</span></div>`;
  const tbody = document.getElementById('feeTable');
  tbody.innerHTML = DB.fees.length ? DB.fees.map(f=>{
    const s = DB.students.find(x=>x.id===f.studentId);
    const status = f.paid>=f.due ? 'paid' : 'due';
    return `<tr><td><strong>${s?s.name:'—'}</strong></td><td>${s?className(s.classId):'—'}</td><td>${f.term}</td>
    <td class="mono">$${f.due.toLocaleString()}</td><td class="mono">$${f.paid.toLocaleString()}</td>
    <td><span class="badge ${status}">${status}</span></td>
    <td class="cell-actions"><button class="btn-ghost" onclick="openFeeModal('${f.id}')">Edit</button><button class="btn-danger" onclick="deleteFee('${f.id}')">Remove</button></td></tr>`;
  }).join('') : `<tr><td colspan="7" class="empty">No fee records yet.</td></tr>`;
}
function openFeeModal(id){
  const f = id ? DB.fees.find(x=>x.id===id) : null;
  const studentOpts = DB.students.map(s=>`<option value="${s.id}" ${f&&f.studentId===s.id?'selected':''}>${s.name} (${s.roll})</option>`).join('');
  showModal(`
    <h3>${f?'Edit Fee Record':'Record Payment'}</h3>
    <label>Student</label><select id="f_student">${studentOpts}</select>
    <div class="grid-2">
      <div><label>Term</label><input id="f_term" value="${f?f.term:'Term 1'}"></div>
      <div><label>Amount Due</label><input type="number" id="f_due" value="${f?f.due:''}"></div>
      <div><label>Amount Paid</label><input type="number" id="f_paid" value="${f?f.paid:''}"></div>
      <div><label>Date</label><input type="date" id="f_date" value="${f?f.date:todayISO()}"></div>
    </div>
    <button class="btn-primary" onclick="saveFee('${id||''}')">Save record</button>
  `);
}
async function saveFee(id){
  const studentId = document.getElementById('f_student').value;
  const due = Number(document.getElementById('f_due').value||0);
  const paid = Number(document.getElementById('f_paid').value||0);
  const term = document.getElementById('f_term').value.trim();
  const data = {studentId, term, due, paid, date:document.getElementById('f_date').value};
  let prevPaid = 0;
  if(id){
    const existing = DB.fees.find(x=>x.id===id);
    prevPaid = existing ? existing.paid : 0;
    Object.assign(existing, data);
  } else {
    DB.fees.push({id:uid('FEE'), ...data});
  }
  // Send an SMS-style payment notification whenever a new payment is recorded.
  if(paid > prevPaid){
    const amount = paid - prevPaid;
    const student = DB.students.find(s=>s.id===studentId);
    const balance = Math.max(due-paid,0);
    const name = student ? student.name : 'Student';
    const message = `Dear ${name}, we have received your payment of $${amount.toLocaleString()} for ${term}. Total paid: $${paid.toLocaleString()}. Balance: $${balance.toLocaleString()}. Thank you — Osbert Senior High School.`;
    DB.sms.push({id:uid('SMS'), studentId, message, date:new Date().toISOString(), read:false});
    await saveKey('sms');
    pushNotice({
      toTeachers: `Fee payment recorded: ${name} (${className(student?student.classId:null)}) has paid $${amount.toLocaleString()} toward ${term}. Their outstanding balance is now $${balance.toLocaleString()}.`,
      personRole:'student', personId:studentId,
      personMessage: `Your payment of $${amount.toLocaleString()} for ${term} has been recorded successfully. Total paid so far: $${paid.toLocaleString()}. Remaining balance: $${balance.toLocaleString()}. Thank you for keeping your fees up to date — check My Fees for the full breakdown.`
    });
  }
  await saveKey('fees'); closeModal(); renderFees(); toast('Fee record saved');
}
async function deleteFee(id){
  if(!confirm('Remove this fee record?')) return;
  DB.fees = DB.fees.filter(f=>f.id!==id);
  await saveKey('fees'); renderFees(); toast('Fee record removed');
}

function currentStudentRecord(){
  return DB.students.find(s=>s.id===session.linkedId) || null;
}
function renderMyFees(){
  const student = currentStudentRecord();
  renderStudentSmsBanner(student);
  if(!student){
    document.getElementById('myFeeStats').innerHTML='';
    document.getElementById('myFeeTable').innerHTML = `<tr><td class="empty">Your account isn't linked to a student record yet — ask an admin to link it.</td></tr>`;
    return;
  }
  const rows = DB.fees.filter(f=>f.studentId===student.id);
  const due = rows.reduce((a,f)=>a+f.due,0), paid = rows.reduce((a,f)=>a+f.paid,0);
  document.getElementById('myFeeStats').innerHTML = `
    <div class="stat"><b>$${paid.toLocaleString()}</b><span>Paid So Far</span></div>
    <div class="stat"><b>$${(due-paid).toLocaleString()}</b><span>Balance Outstanding</span></div>`;
  document.getElementById('myFeeTable').innerHTML = rows.length ? rows.map(f=>{
    const status = f.paid>=f.due ? 'paid' : 'due';
    return `<tr><td><strong>${f.term}</strong></td><td class="mono">$${f.due.toLocaleString()}</td><td class="mono">$${f.paid.toLocaleString()}</td>
      <td class="mono">$${Math.max(f.due-f.paid,0).toLocaleString()}</td><td><span class="badge ${status}">${status}</span></td></tr>`;
  }).join('') : `<tr><td colspan="5" class="empty">No fee records on file yet.</td></tr>`;
}
function renderMyResults(){
  const student = currentStudentRecord();
  const wrap = document.getElementById('myResultsBody');
  if(!student){ wrap.innerHTML = `<div class="empty">Your account isn't linked to a student record yet — ask an admin to link it.</div>`; return; }
  const myExams = DB.exams.filter(e=>e.classId===student.classId);
  if(!myExams.length){ wrap.innerHTML = `<div class="empty">No exams have been recorded for your class yet.</div>`; return; }
  wrap.innerHTML = myExams.map(exam=>{
    const rows = exam.subjects.map(sub=>{
      const rec = DB.results.find(r=>r.examId===exam.id && r.studentId===student.id && r.subject===sub);
      const pct = rec ? rec.marks : null;
      return `<div class="bar-row"><span class="lbl">${sub}</span><div class="bar-track"><div class="bar-fill" style="width:${pct||0}%"></div></div><span class="val">${pct!==null ? pct+'% · '+grade(pct) : '—'}</span></div>`;
    }).join('');
    return `<div class="report-block"><h4>${exam.name} <span style="color:var(--muted);font-weight:400;font-size:13px;">— ${exam.date}</span></h4>${rows}</div>`;
  }).join('');
}

function renderTimetablePage(){
  fillClassSelect(document.getElementById('ttClass'), false);
  const canEdit = session.role==='admin' || session.role==='teacher';
  const saveBtn = document.getElementById('ttSaveBtn');
  const sub = document.getElementById('ttSub');
  if(saveBtn) saveBtn.style.display = canEdit ? '' : 'none';
  if(sub) sub.textContent = canEdit ? 'Weekly period plan for a class.' : 'Weekly period plan for your class — view only.';
  renderTimetable();
}
function renderTimetable(){
  const classId = document.getElementById('ttClass').value;
  const canEdit = session.role==='admin' || session.role==='teacher';
  const existing = {};
  DB.timetable.filter(t=>t.classId===classId).forEach(t=>existing[t.day+'-'+t.period]=t.subject);
  let html = '<table class="tt-table"><thead><tr><th></th>' + PERIODS.map(p=>`<th>${p}</th>`).join('') + '</tr></thead><tbody>';
  DAYS.forEach(day=>{
    html += `<tr><td class="day-label">${day}</td>`;
    PERIODS.forEach((p,pi)=>{
      const val = existing[day+'-'+pi] || '';
      html += canEdit
        ? `<td><input data-day="${day}" data-period="${pi}" value="${val}" placeholder="—"></td>`
        : `<td class="tt-readonly">${val || '—'}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  document.getElementById('ttWrap').innerHTML = html;
}
async function saveTimetable(){
  if(session.role!=='admin' && session.role!=='teacher'){ toast("You don't have permission to edit the timetable"); return; }
  const classId = document.getElementById('ttClass').value;
  if(!classId){ toast('Select a class first'); return; }
  DB.timetable = DB.timetable.filter(t=>t.classId!==classId);
  document.querySelectorAll('#ttWrap input').forEach(inp=>{
    if(inp.value.trim()) DB.timetable.push({classId, day:inp.dataset.day, period:Number(inp.dataset.period), subject:inp.value.trim()});
  });
  await saveKey('timetable');
  toast('Timetable saved');
}

function renderReports(){
  let html = '';
  html += `<div class="report-block"><h4>Attendance rate by class (last 30 days)</h4>`;
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-30);
  DB.classes.forEach(c=>{
    const recs = DB.attendance.filter(a=>a.classId===c.id && new Date(a.date)>=cutoff);
    const present = recs.filter(r=>r.status==='present'||r.status==='late').length;
    const pct = recs.length ? Math.round(present/recs.length*100) : 0;
    html += `<div class="bar-row"><span class="lbl">${c.name}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><span class="val">${pct}%</span></div>`;
  });
  if(!DB.classes.length) html += `<div class="empty">No classes defined.</div>`;
  html += `</div>`;

  html += `<div class="report-block"><h4>Average exam performance by class</h4>`;
  DB.classes.forEach(c=>{
    const examIds = DB.exams.filter(e=>e.classId===c.id).map(e=>e.id);
    const recs = DB.results.filter(r=>examIds.includes(r.examId));
    const avg = recs.length ? Math.round(recs.reduce((a,r)=>a+r.marks,0)/recs.length) : 0;
    html += `<div class="bar-row"><span class="lbl">${c.name}</span><div class="bar-track"><div class="bar-fill" style="width:${avg}%;background:var(--amber);"></div></div><span class="val">${avg}${recs.length?'%':''}</span></div>`;
  });
  if(!DB.classes.length) html += `<div class="empty">No classes defined.</div>`;
  html += `</div>`;

  html += `<div class="report-block"><h4>Fee collection by class</h4>`;
  DB.classes.forEach(c=>{
    const ids = studentsInClass(c.id).map(s=>s.id);
    const recs = DB.fees.filter(f=>ids.includes(f.studentId));
    const due = recs.reduce((a,f)=>a+f.due,0), paid = recs.reduce((a,f)=>a+f.paid,0);
    const pct = due ? Math.round(paid/due*100) : 0;
    html += `<div class="bar-row"><span class="lbl">${c.name}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:var(--register);"></div></div><span class="val">${pct}%</span></div>`;
  });
  html += `</div>`;

  const perStudent = {};
  DB.results.forEach(r=>{ perStudent[r.studentId] = perStudent[r.studentId] || []; perStudent[r.studentId].push(r.marks); });
  const ranked = Object.entries(perStudent).map(([sid, marks])=>({
    student: DB.students.find(s=>s.id===sid), avg: marks.reduce((a,b)=>a+b,0)/marks.length
  })).filter(r=>r.student).sort((a,b)=>b.avg-a.avg).slice(0,5);
  html += `<div class="report-block"><h4>Top performers (all exams)</h4>`;
  html += ranked.length ? ranked.map(r=>`<div class="bar-row"><span class="lbl">${r.student.name}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(r.avg)}%"></div></div><span class="val">${Math.round(r.avg)}% · ${grade(r.avg)}</span></div>`).join('') : `<div class="empty">No results recorded yet.</div>`;
  html += `</div>`;

  document.getElementById('reportsBody').innerHTML = html;
}

function renderUsers(){
  const tbody = document.getElementById('userTable');
  tbody.innerHTML = DB.users.map(u=>{
    let linked = '—';
    if(u.role==='teacher'){ const t=DB.teachers.find(x=>x.id===u.linkedId); linked = t?t.name:'—'; }
    if(u.role==='student'){ const s=DB.students.find(x=>x.id===u.linkedId); linked = s?s.name:'—'; }
    return `<tr><td class="mono">${u.username}</td><td><span class="badge-role">${u.role}</span></td><td>${linked}</td>
    <td class="cell-actions">${u.username!=='admin' ? `<button class="btn-danger" onclick="deleteUser('${u.username}')">Remove</button>` : ''}</td></tr>`;
  }).join('');
}
let userModalOpts = { teacher:'', student:'' };
function openUserModal(){
  userModalOpts.teacher = DB.teachers.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
  userModalOpts.student = DB.students.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
  showModal(`
    <h3>Add User Account</h3>
    <label>Role</label>
    <select id="f_role" onchange="toggleUserLink()"><option value="teacher">Teacher</option><option value="student">Student</option><option value="admin">Admin</option></select>
    <label>Username</label><input id="f_username" placeholder="e.g. jdoe">
    <label>Password</label><input id="f_password" placeholder="Set a temporary password">
    <div id="linkWrap"><label>Link to teacher record</label><select id="f_link">${userModalOpts.teacher}</select></div>
    <button class="btn-primary" onclick="saveUser()">Create account</button>
  `);
}
function toggleUserLink(){
  const role = document.getElementById('f_role').value;
  const wrap = document.getElementById('linkWrap');
  if(role==='admin'){ wrap.style.display='none'; return; }
  wrap.style.display='block';
  wrap.querySelector('label').textContent = role==='teacher' ? 'Link to teacher record' : 'Link to student record';
  wrap.querySelector('select').innerHTML = role==='teacher' ? userModalOpts.teacher : userModalOpts.student;
}
async function saveUser(){
  const username = document.getElementById('f_username').value.trim();
  const password = document.getElementById('f_password').value;
  const role = document.getElementById('f_role').value;
  if(!username || !password){ toast('Username and password required'); return; }
  if(DB.users.find(u=>u.username.toLowerCase()===username.toLowerCase())){ toast('Username already exists'); return; }
  const linkedId = role==='admin' ? null : document.getElementById('f_link').value;
  let name = username;
  if(role==='teacher'){ const t=DB.teachers.find(x=>x.id===linkedId); if(t) name=t.name; }
  if(role==='student'){ const s=DB.students.find(x=>x.id===linkedId); if(s) name=s.name; }
  DB.users.push({username, password, role, linkedId, name});
  await saveKey('users'); closeModal(); renderUsers(); toast('User account created');
}
async function deleteUser(username){
  if(!confirm('Remove this login?')) return;
  DB.users = DB.users.filter(u=>u.username!==username);
  await saveKey('users'); renderUsers(); toast('User removed');
}

/* ================================================================
   VIRTUAL CLASSROOM (V-Class) — a separate portal with its own
   database. It does not read or write anything in DB / DB_KEYS.
   It reuses the school register's login session only to know who
   is signed in (username / role / name) and gates access to
   teacher & student roles — admins do not see this portal.
   ================================================================ */
const VC_KEYS = ['courses','assignments','submissions','enrollments'];
let VC = { courses:[], assignments:[], submissions:[], enrollments:[] };
let vcState = { tab:'dashboard' };

async function saveVCKey(key){ await syncCollection('vc_'+key, VC[key]); }

function vcCourseTeacherName(username){ const u = DB.users.find(x=>x.username===username); return u ? u.name : username; }
function vcCourseTitle(id){ const c = VC.courses.find(x=>x.id===id); return c ? c.title : '—'; }
function vcEnrolled(courseId){ return VC.enrollments.some(e=>e.username===session.username && e.courseId===courseId); }

function renderVClass(){
  vcState.tab = 'dashboard';
  vcRender();
}
function vcBuildTabs(){
  const tabs = session.role==='teacher'
    ? [['dashboard','Dashboard'],['courses','Courses'],['assignments','Assignments'],['submissions','Submissions']]
    : [['dashboard','Dashboard'],['courses','Courses'],['assignments','Assignments']];
  document.getElementById('vcTabs').innerHTML = tabs.map(([id,label])=>
    `<button class="vc-tab ${vcState.tab===id?'active':''}" onclick="vcGoTab('${id}')">${label}</button>`
  ).join('');
}
function vcGoTab(tab){ vcState.tab = tab; vcRender(); }
function vcRender(){
  vcBuildTabs();
  const c = document.getElementById('vcContent');
  if(vcState.tab==='dashboard') return vcDashboard(c);
  if(vcState.tab==='courses') return vcCourses(c);
  if(vcState.tab==='assignments') return vcAssignments(c);
  if(vcState.tab==='submissions') return vcSubmissions(c);
}

function vcDashboard(c){
  if(session.role==='teacher'){
    const myCourses = VC.courses.filter(co=>co.teacherUsername===session.username);
    const myCourseIds = myCourses.map(co=>co.id);
    const myAssignments = VC.assignments.filter(a=>myCourseIds.includes(a.courseId));
    const myAssignIds = myAssignments.map(a=>a.id);
    const subs = VC.submissions.filter(s=>myAssignIds.includes(s.assignmentId));
    c.innerHTML = `
    <div class="vc-welcome"><h3>Welcome back, ${session.name.split(' ')[0]}</h3><p>Manage your courses, set assignments, and grade student submissions — all kept separate from the register.</p></div>
    <div class="vc-cards">
      <div class="vc-card"><b>${myCourses.length}</b><span>Your Courses</span></div>
      <div class="vc-card"><b>${myAssignments.length}</b><span>Assignments Set</span></div>
      <div class="vc-card"><b>${subs.length}</b><span>Submissions Received</span></div>
      <div class="vc-card"><b>${subs.filter(s=>s.status!=='Graded').length}</b><span>Awaiting Grading</span></div>
    </div>`;
  } else {
    const myEnroll = VC.enrollments.filter(e=>e.username===session.username);
    const myCourseIds = myEnroll.map(e=>e.courseId);
    const myAssignments = VC.assignments.filter(a=>myCourseIds.includes(a.courseId));
    const mySubs = VC.submissions.filter(s=>s.username===session.username);
    const submittedIds = mySubs.map(s=>s.assignmentId);
    const pending = myAssignments.filter(a=>!submittedIds.includes(a.id)).length;
    c.innerHTML = `
    <div class="vc-welcome"><h3>Welcome back, ${session.name.split(' ')[0]}</h3><p>Explore courses, complete assignments, and track your progress — a separate portal from the register.</p></div>
    <div class="vc-cards">
      <div class="vc-card"><b>${myEnroll.length}</b><span>Enrolled Courses</span></div>
      <div class="vc-card"><b>${myAssignments.length}</b><span>My Assignments</span></div>
      <div class="vc-card"><b>${pending}</b><span>Pending Submission</span></div>
      <div class="vc-card"><b>${mySubs.filter(s=>s.status==='Graded').length}</b><span>Graded</span></div>
    </div>`;
  }
}

function vcCourses(c){
  if(session.role==='teacher'){
    const mine = VC.courses.filter(co=>co.teacherUsername===session.username);
    c.innerHTML = `<div class="vc-row"><h4>Manage Courses</h4><button class="vc-btn" onclick="vcOpenCourseModal()">+ New Course</button></div>
    <div class="vc-grid">${mine.length ? mine.map(co=>`
      <div class="vc-course"><span class="vc-tag">${co.category}</span><h4>${co.title}</h4><p>${co.description||''}</p>
      <div class="vc-course-actions"><button class="vc-btn-ghost" onclick="vcOpenCourseModal('${co.id}')">Edit</button><button class="vc-btn-danger" onclick="vcDeleteCourse('${co.id}')">Delete</button></div></div>
    `).join('') : '<div class="vc-empty">You have not created any courses yet.</div>'}</div>`;
  } else {
    c.innerHTML = `<h4 style="font-family:'Fraunces',serif;margin:0 0 16px;">All Courses</h4><div class="vc-grid">${VC.courses.length ? VC.courses.map(co=>{
      const enrolled = vcEnrolled(co.id);
      return `<div class="vc-course"><span class="vc-tag">${co.category}</span><h4>${co.title}</h4><p>${co.description||''}</p><p class="vc-muted">Teacher: ${vcCourseTeacherName(co.teacherUsername)}</p>
      ${enrolled?'<span class="vc-tag vc-tag-done">✓ Enrolled</span>':`<button class="vc-btn" onclick="vcEnroll('${co.id}')">Enroll</button>`}</div>`;
    }).join('') : '<div class="vc-empty">No courses available yet.</div>'}</div>`;
  }
}
async function vcEnroll(courseId){
  if(!vcEnrolled(courseId)){
    VC.enrollments.push({id:uid('ENR'), username:session.username, courseId, progress:0});
    await saveVCKey('enrollments'); toast('Enrolled in course');
    vcCourses(document.getElementById('vcContent'));
  }
}
function vcOpenCourseModal(id){
  const co = id ? VC.courses.find(x=>x.id===id) : null;
  showModal(`
    <h3>${co?'Edit Course':'New Course'}</h3>
    <label>Course title</label><input id="vf_title" value="${co?co.title:''}" placeholder="e.g. Introduction to Databases">
    <label>Category</label><input id="vf_cat" value="${co?co.category:''}" placeholder="e.g. Computer Science">
    <label>Description</label><textarea id="vf_desc" rows="3">${co?co.description||'':''}</textarea>
    <button class="btn-primary" onclick="vcSaveCourse('${id||''}')">Save course</button>
  `);
}
async function vcSaveCourse(id){
  const title = document.getElementById('vf_title').value.trim();
  if(!title){ toast('Course title is required'); return; }
  const data = {title, category:document.getElementById('vf_cat').value.trim()||'General', description:document.getElementById('vf_desc').value.trim(), teacherUsername:session.username};
  if(id){ Object.assign(VC.courses.find(x=>x.id===id), data); }
  else { VC.courses.push({id:uid('CRS'), ...data}); }
  await saveVCKey('courses'); closeModal(); vcCourses(document.getElementById('vcContent')); toast('Course saved');
}
async function vcDeleteCourse(id){
  if(!confirm('Delete this course, its assignments and submissions?')) return;
  VC.courses = VC.courses.filter(c=>c.id!==id);
  const removedAssignIds = VC.assignments.filter(a=>a.courseId===id).map(a=>a.id);
  VC.assignments = VC.assignments.filter(a=>a.courseId!==id);
  VC.submissions = VC.submissions.filter(s=>!removedAssignIds.includes(s.assignmentId));
  VC.enrollments = VC.enrollments.filter(e=>e.courseId!==id);
  await saveVCKey('courses'); await saveVCKey('assignments'); await saveVCKey('submissions'); await saveVCKey('enrollments');
  vcCourses(document.getElementById('vcContent')); toast('Course deleted');
}

function vcAssignments(c){
  if(session.role==='teacher'){
    const myCourseIds = VC.courses.filter(co=>co.teacherUsername===session.username).map(co=>co.id);
    const mine = VC.assignments.filter(a=>myCourseIds.includes(a.courseId));
    c.innerHTML = `<div class="vc-row"><h4>Manage Assignments</h4><button class="vc-btn" onclick="vcOpenAssignModal()">+ New Assignment</button></div>
    ${mine.length ? mine.map(a=>{
      const subCount = VC.submissions.filter(s=>s.assignmentId===a.id).length;
      return `<div class="vc-panel"><div class="vc-panel-head"><h4>${a.title}</h4><span class="vc-muted">${vcCourseTitle(a.courseId)} · Due ${a.dueDate||'—'}</span></div>
      <div class="vc-panel-body"><p>${a.description||''}</p><p class="vc-muted">Total marks: ${a.totalMarks} · ${subCount} submission(s)</p>
      <div class="vc-course-actions"><button class="vc-btn-ghost" onclick="vcOpenAssignModal('${a.id}')">Edit</button><button class="vc-btn-danger" onclick="vcDeleteAssign('${a.id}')">Delete</button></div></div></div>`;
    }).join('') : '<div class="vc-empty">No assignments yet. Create a course first, then set an assignment.</div>'}`;
  } else {
    const myCourseIds = VC.enrollments.filter(e=>e.username===session.username).map(e=>e.courseId);
    const mine = VC.assignments.filter(a=>myCourseIds.includes(a.courseId));
    c.innerHTML = mine.length ? mine.map(a=>{
      const s = VC.submissions.find(x=>x.assignmentId===a.id && x.username===session.username);
      return `<div class="vc-panel"><div class="vc-panel-head"><h4>${a.title}</h4><span class="vc-muted">${vcCourseTitle(a.courseId)} · Due ${a.dueDate||'—'}</span></div>
      <div class="vc-panel-body">
        <p>${a.description||''}</p><p class="vc-muted">Total marks: ${a.totalMarks}</p>
        ${s ? `<div class="vc-status ${s.status==='Graded'?'graded':'pending'}">${s.status}${(s.marks!==null&&s.marks!==undefined)?' · '+s.marks+'/'+a.totalMarks:''}</div>${s.feedback?`<p class="vc-muted">Feedback: ${s.feedback}</p>`:''}` : ''}
        <label>Your answer</label><textarea id="vans_${a.id}" rows="3">${s?s.answer||'':''}</textarea>
        <button class="vc-btn" onclick="vcSubmit('${a.id}')">${s?'Resubmit':'Submit'}</button>
      </div></div>`;
    }).join('') : '<div class="vc-empty">Enroll in a course (see the Courses tab) to see its assignments.</div>';
  }
}
function vcOpenAssignModal(id){
  const a = id ? VC.assignments.find(x=>x.id===id) : null;
  const myCourses = VC.courses.filter(co=>co.teacherUsername===session.username);
  const opts = myCourses.map(co=>`<option value="${co.id}" ${a&&a.courseId===co.id?'selected':''}>${co.title}</option>`).join('');
  showModal(`
    <h3>${a?'Edit Assignment':'New Assignment'}</h3>
    <label>Course</label><select id="vf_course">${opts || '<option value="">Create a course first</option>'}</select>
    <label>Title</label><input id="vf_title" value="${a?a.title:''}">
    <label>Instructions</label><textarea id="vf_desc" rows="3">${a?a.description||'':''}</textarea>
    <div class="grid-2">
      <div><label>Due date</label><input type="date" id="vf_due" value="${a?a.dueDate||'':''}"></div>
      <div><label>Total marks</label><input type="number" id="vf_marks" value="${a?a.totalMarks:100}"></div>
    </div>
    <button class="btn-primary" onclick="vcSaveAssign('${id||''}')">Save assignment</button>
  `);
}
async function vcSaveAssign(id){
  const courseId = document.getElementById('vf_course').value;
  const title = document.getElementById('vf_title').value.trim();
  if(!courseId){ toast('Create a course first'); return; }
  if(!title){ toast('Assignment title is required'); return; }
  const data = {courseId, title, description:document.getElementById('vf_desc').value.trim(), dueDate:document.getElementById('vf_due').value, totalMarks:Number(document.getElementById('vf_marks').value||100)};
  let newId = null;
  if(id){ Object.assign(VC.assignments.find(x=>x.id===id), data); }
  else { newId = uid('ASG'); VC.assignments.push({id:newId, ...data}); }
  await saveVCKey('assignments'); closeModal(); vcAssignments(document.getElementById('vcContent')); toast('Assignment saved');
  if(newId){
    const course = VC.courses.find(c=>c.id===courseId);
    const enrolledUsernames = VC.enrollments.filter(e=>e.courseId===courseId).map(e=>e.username);
    const studentIds = enrolledUsernames
      .map(u=>{ const usr = DB.users.find(x=>x.username===u && x.role==='student'); return usr ? usr.linkedId : null; })
      .filter(Boolean);
    if(studentIds.length){
      pushNotice({
        studentIds,
        studentMessage: `A new assignment, "${title}", has been posted in ${course?course.title:'your course'}${data.dueDate?`, due ${data.dueDate}`:''}. Total marks: ${data.totalMarks}. Head to Virtual Classroom to view the instructions and submit your work.`
      });
    }
  }
}
async function vcDeleteAssign(id){
  if(!confirm('Delete this assignment and its submissions?')) return;
  VC.assignments = VC.assignments.filter(a=>a.id!==id);
  VC.submissions = VC.submissions.filter(s=>s.assignmentId!==id);
  await saveVCKey('assignments'); await saveVCKey('submissions');
  vcAssignments(document.getElementById('vcContent')); toast('Assignment deleted');
}
async function vcSubmit(assignmentId){
  const answer = document.getElementById('vans_'+assignmentId).value.trim();
  if(!answer){ toast('Write an answer before submitting'); return; }
  let s = VC.submissions.find(x=>x.assignmentId===assignmentId && x.username===session.username);
  if(s){ s.answer=answer; s.status='Resubmitted'; s.marks=null; s.feedback=''; s.submittedAt=new Date().toLocaleString(); }
  else { VC.submissions.push({id:uid('SUB'), assignmentId, username:session.username, answer, marks:null, feedback:'', status:'Submitted', submittedAt:new Date().toLocaleString()}); }
  await saveVCKey('submissions'); vcAssignments(document.getElementById('vcContent')); toast('Assignment submitted');
}

function vcSubmissions(c){
  const myCourseIds = VC.courses.filter(co=>co.teacherUsername===session.username).map(co=>co.id);
  const myAssignIds = VC.assignments.filter(a=>myCourseIds.includes(a.courseId)).map(a=>a.id);
  const rows = VC.submissions.filter(s=>myAssignIds.includes(s.assignmentId));
  c.innerHTML = rows.length ? rows.map(s=>{
    const a = VC.assignments.find(x=>x.id===s.assignmentId);
    const u = DB.users.find(x=>x.username===s.username);
    return `<div class="vc-panel"><div class="vc-panel-head"><h4>${a?a.title:'—'}</h4><span class="vc-muted">${u?u.name:s.username} · ${s.submittedAt||''}</span></div>
    <div class="vc-panel-body">
      <p class="vc-answer">${s.answer||''}</p>
      <div class="grid-2">
        <div><label>Marks (max ${a?a.totalMarks:100})</label><input type="number" id="vmk_${s.id}" min="0" max="${a?a.totalMarks:100}" value="${s.marks??''}"></div>
        <div><label>Feedback</label><input id="vfb_${s.id}" value="${s.feedback||''}"></div>
      </div>
      <button class="vc-btn" onclick="vcGrade('${s.id}')">Save grade</button>
    </div></div>`;
  }).join('') : '<div class="vc-empty">No submissions yet.</div>';
}
async function vcGrade(id){
  const s = VC.submissions.find(x=>x.id===id);
  const a = VC.assignments.find(x=>x.id===s.assignmentId);
  const cap = a ? a.totalMarks : 100;
  s.marks = Math.max(0, Math.min(cap, Number(document.getElementById('vmk_'+id).value||0)));
  s.feedback = document.getElementById('vfb_'+id).value.trim();
  s.status = 'Graded';
  await saveVCKey('submissions'); vcSubmissions(document.getElementById('vcContent')); toast('Grade saved');
}

function showModal(html, wide){
  document.getElementById('modalBox').innerHTML = `<button class="close" onclick="closeModal()">&times;</button>${html}`;
  document.getElementById('modalBox').style.maxWidth = wide ? '760px' : '520px';
  document.getElementById('modalOverlay').classList.add('show');
}
function closeModal(){ document.getElementById('modalOverlay').classList.remove('show'); }
document.getElementById('modalOverlay').addEventListener('click', e=>{ if(e.target.id==='modalOverlay') closeModal(); });

// If a valid sign-in session already exists (e.g. page refresh), resume it.
(async function init(){
  try{
    const res = await api('GET', '/api/session');
    await startSession(res.user, false);
  }catch(e){ /* not signed in: the login screen stays visible */ }
})();
