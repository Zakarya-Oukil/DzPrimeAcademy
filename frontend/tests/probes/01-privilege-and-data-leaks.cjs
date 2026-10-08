// Regression probes against a RUNNING dev server and a THROWAWAY local database. See tests/probes/README.md.
// Phase 1 probes. Throwaway DB only (localhost:55432). Creates its own users, cleans up after.
const { createRequire } = require('module');
const FE = require('path').resolve(__dirname, '..', '..') + '/';
const req = createRequire(FE + 'package.json');
process.env.DATABASE_URL = 'postgresql://postgres:audit@localhost:55432/audit';
process.env.DIRECT_URL = process.env.DATABASE_URL;
const { PrismaClient } = req('@prisma/client');
const bcrypt = req('bcryptjs');
const crypto = require('crypto');

const BASE = process.env.PROBE_BASE_URL || 'http://localhost:3000';
const prisma = new PrismaClient();
const PW = 'P1-' + crypto.randomBytes(9).toString('hex');
const TAG = 'p1probe';
const mail = (k) => `${TAG}.${k.toLowerCase()}@test.local`;

const ROLES = {
  owner: { role: 'OWNER' },
  general: { role: 'ADMIN', adminRole: 'GENERAL_ADMIN' },
  hrm: { role: 'ADMIN', adminRole: 'HR_MANAGER' },
  hre: { role: 'ADMIN', adminRole: 'HR_EMPLOYEE' },
  commercial: { role: 'ADMIN', adminRole: 'COMMERCIAL' },
  finance: { role: 'ADMIN', adminRole: 'FINANCE' },
  moderator: { role: 'MODERATOR', adminRole: 'MODERATOR' },
  teacher: { role: 'TEACHER' },
  teacher2: { role: 'TEACHER' },
  ambassador: { role: 'AMBASSADOR' },
  free: { role: 'STUDENT_FREE' },
  paid: { role: 'STUDENT_PAID' },
  fakeSuper: { role: 'STUDENT_FREE', adminRole: 'SUPER_ADMIN' }, // student carrying a staff adminRole
};
const users = {};
const jars = {};
let pass = 0, fail = 0;
const results = [];

function check(name, ok, detail = '') {
  (ok ? pass++ : fail++);
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + detail}`);
}

async function call(who, method, path, body) {
  const headers = { 'content-type': 'application/json' };
  if (who && jars[who]) headers.cookie = jars[who];
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined, redirect: 'manual' });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

async function setup() {
  await cleanup();
  const hash = await bcrypt.hash(PW, 8);
  let n = 0;
  for (const [k, def] of Object.entries(ROLES)) {
    n++;
    users[k] = await prisma.user.create({
      data: {
        email: mail(k), name: `P1 ${k} ${n}`, passwordHash: hash, isVerified: true,
        role: def.role, adminRole: def.adminRole || null,
        studentCardId: `DZ-ZZZ-16-${String(9000 + n)}`, wilayaCode: 16,
      },
    });
  }
  await prisma.teacherProfile.create({
    data: { userId: users.teacher.id, university: 'Test U', hourlyRateDzd: 777777, ccpAccount: 'CCP-SECRET-123', ccpCle: '99' },
  });
  await prisma.ambassadorProfile.create({
    data: { userId: users.ambassador.id, wilayaCode: 16, wilayaNameAr: 'x', institutionNameAr: 'y', promoCode: `P1PROMO${Date.now() % 100000}`, commissionDzd: 424242 },
  });
  for (const k of Object.keys(ROLES)) {
    const r = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: mail(k), password: PW }) });
    const sc = r.headers.get('set-cookie') || '';
    const m = sc.match(/dz_token=[^;]+/);
    if (!m) throw new Error(`login failed for ${k}: ${r.status}`);
    jars[k] = m[0];
  }
}

async function cleanup() {
  const us = await prisma.user.findMany({ where: { email: { startsWith: TAG + '.' } }, select: { id: true } });
  const ids = us.map((u) => u.id);
  if (ids.length) {
    await prisma.ambassadorProfile.deleteMany({ where: { userId: { in: ids } } });
    const tp = await prisma.teacherProfile.findMany({ where: { userId: { in: ids } }, select: { id: true } });
    await prisma.facultyPayout.deleteMany({ where: { teacherProfileId: { in: tp.map((t) => t.id) } } });
    await prisma.teacherProfile.deleteMany({ where: { userId: { in: ids } } });
  }
  await prisma.course.deleteMany({ where: { titleAr: { startsWith: 'P1PROBE' } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: TAG + '.' } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: 'p1new.' } } });
}

async function run() {
  await setup();
  const S = users;

  // ---- M-01: role escalation via PUT /api/students
  for (const who of ['moderator', 'finance', 'commercial', 'teacher', 'free']) {
    const r = await call(who, 'PUT', '/api/students', { id: S.free.id, role: 'OWNER' });
    check(`M-01 ${who} cannot set role OWNER`, [401, 403].includes(r.status), r.status);
  }
  let r = await call('hre', 'PUT', '/api/students', { id: S.free.id, role: 'OWNER' });
  check('M-01 HR employee role=OWNER rejected (400)', r.status === 400, r.status);
  r = await call('hre', 'PUT', '/api/students', { id: S.free.id, role: 'ADMIN' });
  check('M-01 HR employee role=ADMIN rejected (400)', r.status === 400, r.status);
  r = await call('hre', 'PUT', '/api/students', { id: S.owner.id, role: 'STUDENT_FREE' });
  check('M-01 HR employee cannot demote OWNER (403)', r.status === 403, r.status);
  r = await call('hre', 'PUT', '/api/students', { id: S.general.id, role: 'STUDENT_FREE' });
  check('M-01 HR employee cannot demote GENERAL_ADMIN (403)', r.status === 403, r.status);
  r = await call('hre', 'PUT', '/api/students', { id: S.teacher.id, role: 'STUDENT_FREE' });
  check('M-01 students endpoint cannot touch a teacher (403)', r.status === 403, r.status);
  r = await call('hre', 'PUT', '/api/students', { id: S.free.id, role: 'STUDENT_PAID' });
  check('M-01 HR employee may set student role (200)', r.status === 200, r.status);
  await prisma.user.update({ where: { id: S.free.id }, data: { role: 'STUDENT_FREE' } });
  r = await call('hre', 'PUT', '/api/students', { id: 'nope', role: 'STUDENT_FREE' });
  check('M-01 unknown id -> 404', r.status === 404, r.status);

  // ---- M-02: staff role minting
  r = await call('hre', 'PUT', `/api/admin/staff/${S.free.id}`, { adminRole: 'SUPER_ADMIN' });
  check('M-02 HR employee cannot edit staff (403)', r.status === 403, r.status);
  r = await call('hrm', 'PUT', `/api/admin/staff/${S.free.id}`, { adminRole: 'SUPER_ADMIN' });
  check('M-02 HR manager cannot turn a student into staff (400)', r.status === 400, r.status);
  for (const ar of ['SUPER_ADMIN', 'GENERAL_ADMIN', 'HR_MANAGER']) {
    r = await call('hrm', 'PUT', `/api/admin/staff/${S.commercial.id}`, { adminRole: ar });
    check(`M-02 HR manager cannot grant ${ar} (403)`, r.status === 403, r.status);
  }
  r = await call('hrm', 'PUT', `/api/admin/staff/${S.commercial.id}`, { adminRole: 'NOT_A_ROLE' });
  check('M-02 junk adminRole rejected (400)', r.status === 400, r.status);
  r = await call('hrm', 'PUT', `/api/admin/staff/${S.commercial.id}`, { adminRole: 'FINANCE' });
  check('M-02 HR manager may grant FINANCE (200)', r.status === 200, r.status);
  await prisma.user.update({ where: { id: S.commercial.id }, data: { adminRole: 'COMMERCIAL', role: 'ADMIN' } });
  r = await call('general', 'PUT', `/api/admin/staff/${S.commercial.id}`, { adminRole: 'SUPER_ADMIN' });
  check('M-02 GENERAL_ADMIN cannot mint SUPER_ADMIN (403)', r.status === 403, r.status);
  r = await call('general', 'PUT', `/api/admin/staff/${S.owner.id}`, { adminRole: 'FINANCE' });
  check('M-02 GENERAL_ADMIN cannot edit OWNER (403)', r.status === 403, r.status);
  r = await call('hrm', 'POST', '/api/admin/staff', { name: 'x', email: 'p1new.a@test.local', password: 'abcdef12', adminRole: 'SUPER_ADMIN' });
  check('M-02 HR manager cannot create SUPER_ADMIN (403)', r.status === 403, r.status);
  r = await call('hre', 'POST', '/api/admin/staff', { name: 'x', email: 'p1new.b@test.local', password: 'abcdef12', adminRole: 'FINANCE' });
  check('M-02 HR employee cannot create staff (403)', r.status === 403, r.status);
  r = await call('general', 'POST', '/api/admin/staff', { name: 'x', email: 'p1new.c@test.local', password: 'abcdef12', adminRole: 'GENERAL_ADMIN' });
  check('M-02 GENERAL_ADMIN cannot create GENERAL_ADMIN (403)', r.status === 403, r.status);
  r = await call('owner', 'POST', '/api/admin/staff', { name: 'x', email: 'p1new.d@test.local', password: 'abcdef12', adminRole: 'SUPER_ADMIN' });
  check('M-02 OWNER may create SUPER_ADMIN (201)', r.status === 201, r.status);
  r = await call('hrm', 'POST', '/api/admin/staff', { name: 'x', email: 'p1new.e@test.local', password: 'abcdef12', adminRole: 'MODERATOR' });
  check('M-02 HR manager may create MODERATOR (201)', r.status === 201, r.status);
  if (r.json?.role) check('M-02 MODERATOR account gets role MODERATOR', r.json.role === 'MODERATOR', r.json.role);
  // student carrying adminRole SUPER_ADMIN has no power
  r = await call('fakeSuper', 'PUT', '/api/settings', { academicYear: '1999/2000' });
  check('M-02 student with adminRole=SUPER_ADMIN cannot write settings (403)', r.status === 403, r.status);
  r = await call('fakeSuper', 'GET', '/api/operations');
  check('M-02 student with adminRole=SUPER_ADMIN cannot read operations (403)', r.status === 403, r.status);
  r = await call('fakeSuper', 'DELETE', `/api/admin/staff/${S.general.id}`);
  check('M-02 student with adminRole=SUPER_ADMIN cannot delete staff (403)', r.status === 403, r.status);

  // ---- M-03: data leaks
  r = await call(null, 'GET', '/api/teachers');
  check('M-03 anonymous GET /api/teachers -> 401', r.status === 401, r.status);
  r = await call(null, 'GET', '/api/ambassadors');
  check('M-03 anonymous GET /api/ambassadors -> 401', r.status === 401, r.status);
  for (const who of ['free', 'paid', 'teacher', 'ambassador', 'moderator']) {
    r = await call(who, 'GET', '/api/teachers');
    check(`M-03 ${who} GET /api/teachers -> 403`, r.status === 403, r.status);
    r = await call(who, 'GET', '/api/ambassadors');
    check(`M-03 ${who} GET /api/ambassadors -> 403`, r.status === 403, r.status);
  }
  r = await call('commercial', 'GET', '/api/teachers');
  const txt = JSON.stringify(r.json);
  check('M-03 commercial sees teacher list (200)', r.status === 200, r.status);
  check('M-03 commercial list has no CCP / rate / email', !/CCP-SECRET|777777|ccpAccount|hourlyRateDzd|test\.local/.test(txt), txt.slice(0, 200));
  r = await call('hrm', 'GET', '/api/teachers');
  check('M-03 HR manager sees CCP data (200)', r.status === 200 && /CCP-SECRET/.test(JSON.stringify(r.json)), r.status);
  check('M-03 teachers list has no passwordHash', !/passwordHash/.test(JSON.stringify(r.json)), 'leak');
  r = await call('hrm', 'GET', '/api/ambassadors');
  check('M-03 HR manager ambassadors list (200) no passwordHash', r.status === 200 && !/passwordHash/.test(JSON.stringify(r.json)), r.status);
  r = await call(null, 'GET', `/api/profile/${S.teacher.id}`);
  const pt = JSON.stringify(r.json);
  check('M-03 public teacher profile loads (200)', r.status === 200, r.status);
  check('M-03 public teacher profile hides email/phone/CCP/rate', !/CCP-SECRET|777777|ccpAccount|hourlyRateDzd|test\.local|"phone"/.test(pt), pt.slice(0, 300));
  r = await call(null, 'GET', `/api/profile/${S.ambassador.id}`);
  const pa = JSON.stringify(r.json);
  check('M-03 public ambassador profile hides commission and email', !/424242|commissionDzd|test\.local/.test(pa), pa.slice(0, 300));
  r = await call('free', 'GET', `/api/profile/${S.teacher.id}`);
  check('M-03 a free student also sees no teacher email', !/test\.local/.test(JSON.stringify(r.json)), 'leak');
  r = await call('teacher', 'GET', `/api/profile/${S.teacher.id}`);
  check('M-03 owner of profile sees own email', /test\.local/.test(JSON.stringify(r.json)), 'missing');
  r = await call('hre', 'GET', `/api/profile/${S.free.id}`);
  check('M-03 HR employee sees student email', /test\.local/.test(JSON.stringify(r.json)), 'missing');
  r = await call(null, 'GET', `/api/profile/${S.free.id}`);
  check('M-03 anonymous cannot see student email/enrollments', !/test\.local|enrollments":\[\{/.test(JSON.stringify(r.json)), 'leak');

  // ---- M-04: wildcard + enumeration
  for (const bad of ['%25', '_', '%25%25', '%25-%25', 'DZ-STU-%25', 'DZ-%25', '*']) {
    r = await call(null, 'GET', `/api/profile/${bad}`);
    check(`M-04 profile/${bad} -> 404`, r.status === 404, r.status + ' ' + JSON.stringify(r.json).slice(0, 80));
  }
  for (const bad of ['%25', 'DZ-STU-%25', 'DZ-___-__-____', 'dz-stu-%25', "x'%20OR%201=1"]) {
    r = await call(null, 'GET', `/api/card/verify/${bad}`);
    check(`M-04 card/verify/${bad} -> 404`, r.status === 404, r.status);
  }
  r = await call(null, 'GET', `/api/card/verify/${S.free.studentCardId}`);
  check('M-04 exact card id verifies (200)', r.status === 200 && r.json?.isValid === true, r.status);
  r = await call(null, 'GET', `/api/card/verify/${S.free.studentCardId.toLowerCase()}`);
  check('M-04 exact card id is case-insensitive (200)', r.status === 200, r.status);
  r = await call(null, 'GET', `/api/profile/${S.free.studentCardId}`);
  check('M-04 profile by exact card id (200)', r.status === 200, r.status);
  r = await call(null, 'GET', `/api/profile/${S.teacher.id}`);
  check('M-04 profile by exact user id (200)', r.status === 200, r.status);
  // new IDs are long and random
  const reg = await call(null, 'POST', '/api/auth/register', { name: 'P1 New', email: 'p1new.reg@test.local', password: 'Abcdef12!x', wilayaCode: 16 });
  const created = await prisma.user.findUnique({ where: { email: 'p1new.reg@test.local' } });
  check('M-04 new card ID is 8 random chars', !!created && /^DZ-STU-16-[A-Z2-9]{8}$/.test(created.studentCardId || ''), `${reg.status} ${created?.studentCardId}`);

  // ---- M-05: voucher bypass
  for (const code of ['DZPRIME2026', 'GOLD2026', 'VIP-PRIME-2026', 'VIP2026', 'vip2026']) {
    r = await call('free', 'POST', '/api/account/upgrade', { code });
    check(`M-05 voucher ${code} no longer upgrades (400)`, [400, 404].includes(r.status), r.status);
  }
  const still = await prisma.user.findUnique({ where: { id: S.free.id } });
  check('M-05 free student is still free', still.role === 'STUDENT_FREE', still.role);

  // ---- M-07: per-role permissions
  const ops = { moderator: 403, hre: 403, hrm: 403, commercial: 200, finance: 200, general: 200, owner: 200, teacher: 403, free: 403 };
  for (const [who, exp] of Object.entries(ops)) {
    r = await call(who, 'GET', '/api/operations');
    check(`M-07 ${who} GET /api/operations -> ${exp}`, r.status === exp, r.status);
  }
  const settingsW = { moderator: 403, hre: 403, hrm: 403, commercial: 403, finance: 403, general: 200, owner: 200 };
  for (const [who, exp] of Object.entries(settingsW)) {
    r = await call(who, 'PUT', '/api/settings', { academicYear: '2025/2026' });
    check(`M-07 ${who} PUT /api/settings -> ${exp}`, r.status === exp, r.status);
  }
  const footer = { moderator: 403, finance: 403, hrm: 403, general: 200 };
  for (const [who, exp] of Object.entries(footer)) {
    r = await call(who, 'PUT', '/api/settings/footer', { footerConfig: {} });
    check(`M-07 ${who} PUT /api/settings/footer -> ${exp}`, exp === 200 ? r.status < 300 : r.status === exp, r.status);
    r = await call(who, 'PUT', '/api/settings/landing', { landingConfig: {} });
    check(`M-07 ${who} PUT /api/settings/landing -> ${exp}`, exp === 200 ? r.status < 300 : r.status === exp, r.status);
  }
  const fin = { moderator: 403, hre: 403, commercial: 403, finance: 200, general: 200, owner: 200 };
  for (const [who, exp] of Object.entries(fin)) {
    r = await call(who, 'GET', '/api/admin/financial');
    check(`M-07 ${who} GET /api/admin/financial -> ${exp}`, r.status === exp, r.status);
  }
  const tp = await prisma.teacherProfile.findUnique({ where: { userId: S.teacher.id } });
  for (const [who, exp] of Object.entries({ moderator: 403, hre: 403, commercial: 403, finance: 200 })) {
    r = await call(who, 'POST', `/api/teachers/${tp.id}/payout`);
    check(`M-07 ${who} POST payout -> ${exp}`, r.status === exp, r.status);
  }
  for (const who of ['moderator', 'finance', 'commercial']) {
    r = await call(who, 'PUT', `/api/teachers/${tp.id}`, { ccpAccount: 'FAKE', university: 'Hacked' });
    const expect403 = who === 'moderator' || who === 'commercial';
    check(`M-07 ${who} PUT teacher ${expect403 ? '-> 403' : '(finance: pay fields only)'}`, expect403 ? r.status === 403 : r.status === 200, r.status);
  }
  const after = await prisma.teacherProfile.findUnique({ where: { id: tp.id } });
  check('M-07 finance cannot change university (HR-only field)', after.university === 'Test U', after.university);
  await prisma.teacherProfile.update({ where: { id: tp.id }, data: { ccpAccount: 'CCP-SECRET-123' } });
  const staffList = { moderator: 403, hre: 403, hrm: 200, commercial: 403, finance: 403 };
  for (const [who, exp] of Object.entries(staffList)) {
    r = await call(who, 'GET', '/api/admin/staff');
    check(`M-07 ${who} GET /api/admin/staff -> ${exp}`, r.status === exp, r.status);
  }
  for (const [who, exp] of Object.entries({ moderator: 403, finance: 403, commercial: 200, general: 200 })) {
    r = await call(who, 'POST', '/api/courses', { titleAr: 'P1PROBE ' + who, titleFr: 'x', priceDzd: 1, category: 'BAC' });
    check(`M-07 ${who} POST /api/courses -> ${exp === 200 ? '2xx' : exp}`, exp === 200 ? r.status < 300 : r.status === exp, r.status);
  }

  // review follow-ups
  r = await call('commercial', 'GET', '/api/ambassadors');
  check('R commercial ambassador list hides commission/email', r.status === 200 && !/424242|commissionDzd|test\.local/.test(JSON.stringify(r.json)), r.status);
  r = await call('commercial', 'DELETE', `/api/students/${S.paid.id}`);
  check('R commercial cannot delete a student (403)', r.status === 403, r.status);
  r = await call('hre', 'DELETE', `/api/students/${S.teacher2.id}`);
  check('R students DELETE refuses a non-student target (400)', r.status === 400, r.status);
  r = await call('moderator', 'GET', `/api/enrollments?studentId=${S.paid.id}`);
  check('R moderator cannot read another student enrollments by override', r.status === 200 && JSON.stringify(r.json) === '[]', r.status);
  r = await call('moderator', 'GET', `/api/teacher/roster?teacherId=${S.teacher.id}`);
  check('R moderator roster override ignored', r.status === 200 && JSON.stringify(r.json) === '[]', r.status);
  r = await call('hrm', 'DELETE', `/api/admin/staff/${S.owner.id}`);
  check('R HR manager cannot delete OWNER (403)', r.status === 403, r.status);
  r = await call('general', 'DELETE', `/api/admin/staff/${S.owner.id}`);
  check('R GENERAL_ADMIN cannot delete OWNER (403)', r.status === 403, r.status);

  // ---- M-16: ownership by teacherId, not display name
  await prisma.course.create({ data: { titleAr: 'P1PROBE named', titleFr: 'x', teacherName: S.teacher.name, priceDzd: 1, category: 'BAC', teacherId: null } });
  await prisma.course.create({ data: { titleAr: 'P1PROBE owned', titleFr: 'x', teacherName: 'someone else', priceDzd: 1, category: 'BAC', teacherId: S.teacher.id } });
  r = await call(null, 'GET', `/api/profile/${S.teacher.id}`);
  const titles = (r.json?.courses || []).map((c) => c.titleAr);
  check('M-16 profile lists only courses owned by teacherId', titles.includes('P1PROBE owned') && !titles.includes('P1PROBE named'), JSON.stringify(titles));

  await cleanup();
  console.log(results.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  await prisma.$disconnect();
  process.exit(fail ? 1 : 0);
}
run().catch(async (e) => { console.error(e); try { await cleanup(); } catch {} process.exit(2); });
