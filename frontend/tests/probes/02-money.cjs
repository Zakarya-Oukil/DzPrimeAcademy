// Regression probes against a RUNNING dev server and a THROWAWAY local database. See tests/probes/README.md.
// Phase 2 probes (money). Throwaway DB only (localhost:55432). Creates its own data, cleans up after.
const { createRequire } = require('module');
const FE = require('path').resolve(__dirname, '..', '..') + '/';
const req = createRequire(FE + 'package.json');
process.env.DATABASE_URL = require('./guard.cjs').probeDatabaseUrl();
process.env.DIRECT_URL = process.env.DATABASE_URL;
const { PrismaClient } = req('@prisma/client');
const bcrypt = req('bcryptjs');
const crypto = require('crypto');

const BASE = process.env.PROBE_BASE_URL || 'http://localhost:3000';
const prisma = new PrismaClient();
const PW = 'P2-' + crypto.randomBytes(9).toString('hex');
const TAG = 'p2probe';
const mail = (k) => `${TAG}.${k.toLowerCase()}@test.local`;
const rnd = () => Math.floor(Math.random() * 250) + 1;

const ROLES = {
  owner: { role: 'OWNER' },
  commercial: { role: 'ADMIN', adminRole: 'COMMERCIAL' },
  finance: { role: 'ADMIN', adminRole: 'FINANCE' },
  moderator: { role: 'MODERATOR', adminRole: 'MODERATOR' },
  teacher: { role: 'TEACHER' },
  ambassador: { role: 'AMBASSADOR' },
  free: { role: 'STUDENT_FREE' },
  free2: { role: 'STUDENT_FREE' },
  free3: { role: 'STUDENT_FREE' },
  paid: { role: 'STUDENT_PAID' },
};
const users = {};
const jars = {};
let pass = 0, fail = 0;
const results = [];
function check(name, ok, detail = '') {
  (ok ? pass++ : fail++);
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + detail}`);
}

// Every call gets its own fake client IP so the per-IP rate limit never couples unrelated checks.
async function call(who, method, path, body, ip) {
  const headers = { 'content-type': 'application/json', 'x-forwarded-for': ip || `10.${rnd()}.${rnd()}.${rnd()}` };
  if (who && jars[who]) headers.cookie = jars[who];
  const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body), redirect: 'manual' });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

let bundle, paidCourse, freeCourse, ambCode;

async function cleanup() {
  const us = await prisma.user.findMany({ where: { email: { startsWith: TAG + '.' } }, select: { id: true } });
  const ids = us.map((u) => u.id);
  await prisma.pendingOperation.deleteMany({ where: { OR: [{ userEmail: { startsWith: TAG + '.' } }, { userId: { in: ids } }, { userName: { startsWith: 'P2' } }] } });
  await prisma.bundlePurchase.deleteMany({ where: { bundleTitleAr: { startsWith: 'P2PROBE' } } });
  await prisma.bundle.deleteMany({ where: { titleAr: { startsWith: 'P2PROBE' } } });
  await prisma.course.deleteMany({ where: { titleAr: { startsWith: 'P2PROBE' } } });
  await prisma.promotion.deleteMany({ where: { code: { startsWith: 'P2' } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: TAG + '.' } } });
}

async function setup() {
  await cleanup();
  await prisma.platformSettings.upsert({ where: { id: 'singleton' }, update: { ambassadorCommissionRate: 10, vipPriceDzd: 10000 }, create: { id: 'singleton' } });
  const hash = await bcrypt.hash(PW, 8);
  let n = 0;
  for (const [k, def] of Object.entries(ROLES)) {
    n++;
    users[k] = await prisma.user.create({
      data: { email: mail(k), name: `P2 ${k} ${n}`, passwordHash: hash, isVerified: true, role: def.role, adminRole: def.adminRole || null, studentCardId: `DZ-ZZZ-16-P2${String(100 + n)}`, wilayaCode: 16 },
    });
  }
  ambCode = `P2AMB${Date.now() % 100000}`;
  users.ambProfile = await prisma.ambassadorProfile.create({
    data: { userId: users.ambassador.id, wilayaCode: 16, wilayaNameAr: 'x', institutionNameAr: 'y', promoCode: ambCode, isVerified: true },
  });
  bundle = await prisma.bundle.create({ data: { titleAr: 'P2PROBE bundle', descriptionAr: 'd', track: 'BAC', originalPriceDzd: 8000, currentPriceDzd: 5000 } });
  paidCourse = await prisma.course.create({ data: { titleAr: 'P2PROBE paid', teacherName: 'T', priceDzd: 3000 } });
  freeCourse = await prisma.course.create({ data: { titleAr: 'P2PROBE free', teacherName: 'T', priceDzd: 0 } });
  for (const k of Object.keys(ROLES)) {
    const r = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: mail(k), password: PW }) });
    const m = (r.headers.get('set-cookie') || '').match(/dz_token=[^;]+/);
    if (!m) throw new Error(`login failed for ${k}: ${r.status}`);
    jars[k] = m[0];
  }
}

const anon = (extra = {}) => ({ userName: 'P2 Visitor', userEmail: `${TAG}.visitor${Math.floor(Math.random() * 1e6)}@test.local`, ...extra });

async function run() {
  await setup();
  const S = users;
  let r;

  // ---- M-08: operations intake
  r = await call(null, 'POST', '/api/operations', anon({ type: 'VIP_MEMBERSHIP_UPGRADE' }));
  check('M-08 anonymous VIP request -> 401', r.status === 401, r.status);
  r = await call(null, 'POST', '/api/operations', anon({ type: 'COURSE_ENROLLMENT', targetId: paidCourse.id }));
  check('M-08 anonymous enrollment request -> 401', r.status === 401, r.status);
  r = await call(null, 'POST', '/api/operations', anon({ type: 'HACK' }));
  check('M-08 unknown type -> 400', r.status === 400, r.status);
  r = await call(null, 'POST', '/api/operations', anon({ type: 'BUNDLE_PURCHASE', targetId: bundle.id, amountDzd: -500 }));
  check('M-08 client amount ignored, bundle priced by server (5000)', r.status === 200 && r.json?.operation?.amountDzd === 5000, JSON.stringify(r.json));
  r = await call(null, 'POST', '/api/operations', anon({ type: 'MANUAL_SUPPORT', amountDzd: 999999 }));
  check('M-08 support request cannot carry money (amount 0)', r.status === 200 && r.json?.operation?.amountDzd === 0, JSON.stringify(r.json));
  r = await call(null, 'POST', '/api/operations', { type: 'MANUAL_SUPPORT' });
  check('M-08 anonymous with no name/contact -> 400', r.status === 400, r.status);
  r = await call(null, 'POST', '/api/operations', { type: 'MANUAL_SUPPORT', userName: 'P2 X', userEmail: 'not-an-email' });
  check('M-08 bad email -> 400', r.status === 400, r.status);
  r = await call(null, 'POST', '/api/operations', anon({ type: 'MANUAL_SUPPORT', details: 'x'.repeat(300000) }));
  check('M-08 300KB body -> 413', r.status === 413, r.status);
  r = await call(null, 'POST', '/api/operations', anon({ type: 'MANUAL_SUPPORT', details: 'y'.repeat(5000), title: 'T'.repeat(5000), userName: 'P2' + 'n'.repeat(500) }));
  const stored = r.json?.operation;
  check('M-08 long strings are truncated', r.status === 200 && stored.details.length <= 1000 && stored.title.length <= 200 && stored.userName.length <= 100, JSON.stringify(r.json).slice(0, 200));
  r = await call(null, 'POST', '/api/operations', anon({ type: 'BUNDLE_PURCHASE', targetId: 'nope-id' }));
  check('M-08 unknown bundle -> 404, no raw DB text', r.status === 404 && !/prisma|invocation|column/i.test(JSON.stringify(r.json)), JSON.stringify(r.json));
  r = await call(null, 'POST', '/api/operations', '{not json');
  check('M-08 malformed JSON -> 400', r.status === 400, r.status);
  const d1 = await call('paid', 'POST', '/api/operations', { type: 'MANUAL_SUPPORT', title: 'help' });
  const d2 = await call('paid', 'POST', '/api/operations', { type: 'MANUAL_SUPPORT', title: 'help again' });
  check('M-08 signed-in repeat is a duplicate and echoes no row', d1.json?.operation?.id && d2.json?.duplicate === true && !d2.json?.operation, JSON.stringify(d2.json));
  check('M-08 only one open row exists for that repeat', (await prisma.pendingOperation.count({ where: { userId: S.paid.id, type: 'MANUAL_SUPPORT', status: 'PENDING' } })) === 1);
  const victim = anon({ type: 'MANUAL_SUPPORT', userPhone: '0770000000' });
  const v1 = await call(null, 'POST', '/api/operations', victim);
  const probe = await call(null, 'POST', '/api/operations', { type: 'MANUAL_SUPPORT', userName: 'P2 Prober', userEmail: victim.userEmail });
  check('M-08 guest typing someone else email gets no duplicate and no data back', probe.status === 200 && !probe.json?.duplicate && probe.json.operation.id !== v1.json.operation.id && !JSON.stringify(probe.json).includes('0770000000'), JSON.stringify(probe.json));
  r = await call(null, 'POST', '/api/operations', 'null');
  check('M-08 JSON null body -> 400, not 500', r.status === 400, r.status);
  r = await call('commercial', 'POST', '/api/operations/anything/approve', 'null');
  check('M-08 JSON null on approve -> 404, not 500', r.status === 404, r.status);
  const fixedIp = `172.16.${rnd()}.${rnd()}`;
  let got429 = false;
  for (let i = 0; i < 25; i++) {
    const x = await call(null, 'POST', '/api/operations', anon({ type: 'MANUAL_SUPPORT', title: 'flood ' + i }), fixedIp);
    if (x.status === 429) { got429 = true; break; }
  }
  check('M-08 per-IP rate limit kicks in (429)', got429);

  // ---- M-10: free purchase / enrollment
  r = await call('free', 'POST', `/api/bundles/${bundle.id}/purchase`, {});
  check('M-10 mock purchase endpoint is gone', r.status === 404 || r.status === 405, r.status);
  r = await call('free', 'POST', '/api/enrollments', { courseId: paidCourse.id });
  check('M-10 priced course cannot be enrolled directly (402)', r.status === 402, r.status);
  r = await call('free', 'POST', '/api/enrollments', { courseId: freeCourse.id });
  check('M-10 free course enrolls (201)', r.status === 201, r.status);
  r = await call('free', 'POST', '/api/enrollments', { courseId: freeCourse.id });
  check('M-10 second enroll is idempotent (200)', r.status === 200, r.status);
  check('M-10 exactly one enrollment row', (await prisma.enrollment.count({ where: { studentId: S.free.id, courseId: freeCourse.id } })) === 1);
  r = await call('free', 'POST', '/api/enrollments', {});
  check('M-10 missing courseId -> 404, not 500', r.status === 404, r.status);
  r = await call('moderator', 'POST', '/api/enrollments', { courseId: freeCourse.id });
  check('M-10 staff cannot enroll through the student endpoint (403)', r.status === 403, r.status);

  // ---- server-side pricing for logged-in requests
  r = await call('free', 'POST', '/api/operations', { type: 'VIP_MEMBERSHIP_UPGRADE', amountDzd: 1 });
  const vipOp = r.json?.operation;
  check('PRICE VIP priced from settings (10000), client amount ignored', r.status === 200 && vipOp?.amountDzd === 10000 && vipOp.userId === S.free.id, JSON.stringify(r.json));
  r = await call('free', 'POST', '/api/operations', { type: 'COURSE_ENROLLMENT', targetId: paidCourse.id, amountDzd: 1 });
  const enrOp = r.json?.operation;
  check('PRICE course request priced from course (3000)', r.status === 200 && enrOp?.amountDzd === 3000, JSON.stringify(r.json));

  // ---- M-09: approval state machine
  r = await call('moderator', 'POST', `/api/operations/${vipOp.id}/approve`, {});
  check('M-09 moderator cannot approve (403)', r.status === 403, r.status);
  r = await call('commercial', 'POST', `/api/operations/${vipOp.id}/approve`, {});
  check('M-09 VIP approval succeeds (200)', r.status === 200 && r.json?.operation?.status === 'APPROVED', JSON.stringify(r.json));
  const upgraded = await prisma.user.findUnique({ where: { id: S.free.id } });
  check('M-09 free student became STUDENT_PAID with a subscription', upgraded.role === 'STUDENT_PAID' && (await prisma.subscription.count({ where: { userId: S.free.id, status: 'ACTIVE' } })) === 1);
  r = await call('commercial', 'POST', `/api/operations/${vipOp.id}/approve`, {});
  check('M-09 second approve -> 409', r.status === 409, r.status);
  r = await call('commercial', 'POST', `/api/operations/${vipOp.id}/reject`, {});
  check('M-09 reject after approve -> 409', r.status === 409, r.status);
  check('M-09 status stayed APPROVED', (await prisma.pendingOperation.findUnique({ where: { id: vipOp.id } })).status === 'APPROVED');

  r = await call('commercial', 'POST', `/api/operations/${enrOp.id}/reject`, { adminNotes: 'no payment' });
  check('M-09 reject pending -> 200', r.status === 200 && r.json?.operation?.status === 'REJECTED', JSON.stringify(r.json));
  r = await call('commercial', 'POST', `/api/operations/${enrOp.id}/approve`, {});
  check('M-09 approve after reject -> 409', r.status === 409, r.status);
  check('M-09 rejected enrollment created nothing', (await prisma.enrollment.count({ where: { studentId: S.free.id, courseId: paidCourse.id } })) === 0);
  r = await call('commercial', 'POST', `/api/operations/${enrOp.id}/reject`, {});
  check('M-09 reject twice -> 409', r.status === 409, r.status);
  r = await call('commercial', 'POST', '/api/operations/does-not-exist/approve', {});
  check('M-09 approve unknown id -> 404', r.status === 404, r.status);
  r = await call('commercial', 'POST', '/api/operations/does-not-exist/reject', {});
  check('M-09 reject unknown id -> 404', r.status === 404, r.status);

  // approve a paid enrollment: creates the enrollment once
  r = await call('paid', 'POST', '/api/operations', { type: 'COURSE_ENROLLMENT', targetId: paidCourse.id });
  const enrOp2 = r.json?.operation;
  r = await call('commercial', 'POST', `/api/operations/${enrOp2.id}/approve`, {});
  check('M-09 enrollment approval creates the enrollment', r.status === 200 && (await prisma.enrollment.count({ where: { studentId: S.paid.id, courseId: paidCourse.id } })) === 1, r.status);

  // rollback: a teacher asks for VIP; approval must fail AND leave the op pending and the role untouched
  r = await call('teacher', 'POST', '/api/operations', { type: 'VIP_MEMBERSHIP_UPGRADE' });
  const tOp = r.json?.operation;
  r = await call('commercial', 'POST', `/api/operations/${tOp.id}/approve`, {});
  const tAfter = await prisma.user.findUnique({ where: { id: S.teacher.id } });
  check('M-09 VIP approval for a teacher is refused (400)', r.status === 400, r.status);
  check('M-09 refused approval rolled back (still PENDING, role unchanged)', (await prisma.pendingOperation.findUnique({ where: { id: tOp.id } })).status === 'PENDING' && tAfter.role === 'TEACHER');
  r = await call('paid', 'POST', '/api/operations', { type: 'VIP_MEMBERSHIP_UPGRADE' });
  r = await call('commercial', 'POST', `/api/operations/${r.json.operation.id}/approve`, {});
  check('M-09 VIP approval for an already paid student -> 409', r.status === 409, r.status);

  // race: 6 simultaneous approvals of one 5000 DZD bundle purchase
  r = await call('free2', 'POST', '/api/operations', { type: 'BUNDLE_PURCHASE', targetId: bundle.id });
  const raceOp = r.json.operation;
  const before = await call('finance', 'GET', '/api/admin/financial');
  const rs = await Promise.all(Array.from({ length: 6 }, () => call('owner', 'POST', `/api/operations/${raceOp.id}/approve`, {})));
  const codes = rs.map((x) => x.status).sort().join(',');
  check('M-09 6 concurrent approvals: exactly one 200, five 409', rs.filter((x) => x.status === 200).length === 1 && rs.filter((x) => x.status === 409).length === 5, codes);
  check('M-09 race created exactly one purchase', (await prisma.bundlePurchase.count({ where: { operationId: raceOp.id } })) === 1);
  const after = await call('finance', 'GET', '/api/admin/financial');
  check('M-09/M-11 revenue rose by exactly 5000 (no double count)', after.json.realVerifiedRevenue - before.json.realVerifiedRevenue === 5000, `${before.json.realVerifiedRevenue} -> ${after.json.realVerifiedRevenue}`);

  // ---- M-11: finance numbers are real
  const agg = await prisma.pendingOperation.aggregate({ where: { status: 'APPROVED', amountDzd: { gt: 0 } }, _sum: { amountDzd: true } });
  const paidOut = await prisma.facultyPayout.aggregate({ where: { status: 'PAID' }, _sum: { amountDzd: true } });
  const fin = after.json;
  check('M-11 revenue equals the sum of approved operations', fin.realVerifiedRevenue === (agg._sum.amountDzd || 0), `${fin.realVerifiedRevenue} vs ${agg._sum.amountDzd}`);
  check('M-11 balance = revenue - paid payouts (no base capital)', fin.totalBalance === (agg._sum.amountDzd || 0) - (paidOut._sum.amountDzd || 0), String(fin.totalBalance));
  check('M-11 no invented ledger rows', !fin.transactions.some((t) => String(t.id).startsWith('base-')));
  check('M-11 no payroll/income floor (values can be below the old fake floors)', fin.payrollLiability !== 1791000 && fin.monthlyIncome !== 5420000);
  check('M-11 monthly series has 6 real months', Array.isArray(fin.monthly) && fin.monthly.length === 6);
  check('M-11 current month income matches DB', fin.monthly[5].income === fin.monthlyIncome, `${fin.monthly[5].income} vs ${fin.monthlyIncome}`);
  r = await call('commercial', 'GET', '/api/admin/financial');
  check('M-11 commercial still cannot read finance (403)', r.status === 403, r.status);

  // ---- M-12: promotions + ambassador commission
  r = await call('commercial', 'POST', '/api/promotions', { code: 'P2SALE', discountPercent: 40, type: 'FLASH_SALE', applicableTrack: 'ALL', maxUses: 1 });
  const promo = r.json;
  check('M-12 staff can create a promotion (201)', r.status === 201 && promo?.code === 'P2SALE', JSON.stringify(r.json));
  check('M-12 promotion is stored in the database', !!(await prisma.promotion.findUnique({ where: { code: 'P2SALE' } })));
  r = await call('moderator', 'POST', '/api/promotions', { code: 'P2NOPE', discountPercent: 10 });
  check('M-12 moderator cannot create a promotion (403)', r.status === 403, r.status);
  r = await call('commercial', 'POST', '/api/promotions', { code: 'P2SALE', discountPercent: 10 });
  check('M-12 duplicate code -> 400', r.status === 400, r.status);
  r = await call('commercial', 'POST', '/api/promotions', { code: 'P2BIG', discountPercent: 150 });
  check('M-12 discount 150% -> 400', r.status === 400, r.status);
  r = await call('commercial', 'POST', '/api/promotions', { code: 'bad code!', discountPercent: 10 });
  check('M-12 malformed code -> 400', r.status === 400, r.status);
  r = await call('commercial', 'POST', '/api/promotions', { code: ambCode, discountPercent: 10 });
  check('M-12 cannot reuse an ambassador code as a campaign (400)', r.status === 400, r.status);
  r = await call('commercial', 'POST', '/api/promotions', { code: 'P2EXP', discountPercent: 10, expiresAt: '2020-01-01' });
  r = await call(null, 'GET', '/api/promotions?validate=P2EXP');
  check('M-12 expired code is invalid (404)', r.status === 404, r.status);
  r = await call(null, 'GET', '/api/promotions?validate=P2SALE');
  check('M-12 live code validates with its percent', r.status === 200 && r.json?.discountPercent === 40, JSON.stringify(r.json));
  r = await call(null, 'GET', '/api/promotions?validate=P2NOTHING');
  check('M-12 unknown code -> 404', r.status === 404, r.status);
  r = await call('commercial', 'POST', '/api/promotions', { code: 'P2BACONLY', discountPercent: 10, applicableTrack: 'BAC' });
  r = await call(null, 'GET', '/api/promotions?validate=P2BACONLY&track=MEDICAL');
  check('M-12 wrong-track code is invalid (404)', r.status === 404, r.status);
  r = await call(null, 'GET', '/api/promotions?validate=P2BACONLY&track=BAC');
  check('M-12 right-track code is valid', r.status === 200, r.status);

  r = await call('free3', 'POST', '/api/operations', { type: 'BUNDLE_PURCHASE', targetId: bundle.id, promoCode: 'p2sale', amountDzd: 1 });
  const promoOp = r.json?.operation;
  check('M-12 server applies the discount (40% of 5000 = 3000)', r.status === 200 && promoOp?.amountDzd === 3000 && promoOp.discountDzd === 2000 && promoOp.promoCode === 'P2SALE', JSON.stringify(r.json));
  r = await call('free3', 'POST', '/api/operations', { type: 'BUNDLE_PURCHASE', targetId: bundle.id, promoCode: 'FAKECODE' });
  check('M-12 fake promo code on an operation -> 400', r.status === 400, r.status);
  r = await call('owner', 'POST', `/api/operations/${promoOp.id}/approve`, {});
  check('M-12 approving a promo operation succeeds', r.status === 200, r.status);
  check('M-12 promotion usageCount counted at approval (1)', (await prisma.promotion.findUnique({ where: { code: 'P2SALE' } })).usageCount === 1);
  r = await call(null, 'GET', '/api/promotions?validate=P2SALE');
  check('M-12 maxUses reached -> code now invalid (404)', r.status === 404, r.status);

  // ambassador code: discount, self-referral guard, commission ledger
  r = await call('ambassador', 'POST', '/api/operations', { type: 'BUNDLE_PURCHASE', targetId: bundle.id, promoCode: ambCode });
  check('M-12 ambassador cannot use their own code (400)', r.status === 400, r.status);
  r = await call('free2', 'POST', '/api/operations', { type: 'BUNDLE_PURCHASE', targetId: bundle.id, promoCode: ambCode });
  const ambOp = r.json?.operation;
  check('M-12 ambassador code gives 15% (4250)', r.status === 200 && ambOp?.amountDzd === 4250 && ambOp.discountDzd === 750, JSON.stringify(r.json));
  r = await call('owner', 'POST', `/api/operations/${ambOp.id}/approve`, {});
  const ce = await prisma.commissionEntry.findUnique({ where: { operationId: ambOp.id } });
  const prof = await prisma.ambassadorProfile.findUnique({ where: { id: S.ambProfile.id } });
  check('M-12 commission row written once (10% of 4250 = 425)', r.status === 200 && ce?.amountDzd === 425 && ce.ratePercent === 10, JSON.stringify(ce));
  check('M-12 ambassador totals updated (425 DZD, 1 referral)', prof.commissionDzd === 425 && prof.referralsCount === 1, `${prof.commissionDzd}/${prof.referralsCount}`);
  r = await call('owner', 'POST', `/api/operations/${ambOp.id}/approve`, {});
  check('M-12 re-approve cannot pay commission twice', r.status === 409 && (await prisma.commissionEntry.count({ where: { ambassadorId: S.ambProfile.id } })) === 1, r.status);
  // same person under another identity: anonymous request using the ambassador's own email
  r = await call(null, 'POST', '/api/operations', { type: 'BUNDLE_PURCHASE', targetId: bundle.id, promoCode: ambCode, userName: 'P2 Self', userEmail: mail('ambassador') });
  const selfOp = r.json?.operation;
  r = await call('owner', 'POST', `/api/operations/${selfOp.id}/approve`, {});
  check('M-12 self-referral by email earns no commission', r.status === 200 && (await prisma.commissionEntry.count({ where: { operationId: selfOp.id } })) === 0);
  await prisma.ambassadorProfile.update({ where: { id: S.ambProfile.id }, data: { isVerified: false } });
  r = await call(null, 'GET', `/api/promotions?validate=${ambCode}`);
  check('M-12 unverified ambassador code is invalid (404)', r.status === 404, r.status);
  await prisma.ambassadorProfile.update({ where: { id: S.ambProfile.id }, data: { isVerified: true } });
  r = await call('commercial', 'GET', '/api/promotions');
  const ambRow = r.json?.ambassadorCodes?.find((a) => a.code === ambCode);
  check('M-12 admin list shows the real commission (425, 1 referral)', ambRow?.commissionDzd === 425 && ambRow.referralsCount === 1, JSON.stringify(ambRow));
  check('M-12 default campaigns no longer carry invented usage counts', r.json.platformPromotions.filter((p) => ['PROMO2026', 'BAC20', 'EXCELLENCE30'].includes(p.code)).every((p) => ![142, 89, 57].includes(p.usageCount)));

  // ---- review findings
  r = await call('paid', 'POST', '/api/operations', { type: 'VIP_MEMBERSHIP_UPGRADE', promoCode: 'BAC20' });
  check('REV track-restricted code (BAC20) cannot discount a VIP request (400)', r.status === 400, r.status);
  r = await call(null, 'GET', '/api/promotions?validate=BAC20');
  check('REV restricted code validates only with a matching track (404 without)', r.status === 404, r.status);
  await prisma.ambassadorProfile.update({ where: { id: S.ambProfile.id }, data: { phone: '0555123456' } });
  r = await call(null, 'POST', '/api/operations', { type: 'BUNDLE_PURCHASE', targetId: bundle.id, promoCode: ambCode, userName: 'P2 Alias', userEmail: `${TAG}.ambassador+shop@test.local` });
  const aliasOp = r.json?.operation;
  await call('owner', 'POST', `/api/operations/${aliasOp.id}/approve`, {});
  check('REV +tag alias of the ambassador email earns no commission', (await prisma.commissionEntry.count({ where: { operationId: aliasOp.id } })) === 0);
  r = await call(null, 'POST', '/api/operations', { type: 'BUNDLE_PURCHASE', targetId: bundle.id, promoCode: ambCode, userName: 'P2 Phone', userPhone: '+213 555 123 456' });
  const phoneOp = r.json?.operation;
  await call('owner', 'POST', `/api/operations/${phoneOp.id}/approve`, {});
  check('REV same phone number as the ambassador earns no commission', (await prisma.commissionEntry.count({ where: { operationId: phoneOp.id } })) === 0);
  r = await call(null, 'POST', '/api/operations', { type: 'BUNDLE_PURCHASE', targetId: bundle.id, promoCode: ambCode, userName: 'P2 Stranger', userEmail: `${TAG}.stranger@test.local`, userPhone: '0661000111' });
  await call('owner', 'POST', `/api/operations/${r.json.operation.id}/approve`, {});
  check('REV a genuine stranger still earns the commission', (await prisma.commissionEntry.count({ where: { operationId: r.json.operation.id } })) === 1);

  await call('commercial', 'POST', '/api/promotions', { code: 'P2CAP', discountPercent: 10, maxUses: 1 });
  const capA = (await call('free3', 'POST', '/api/operations', { type: 'COURSE_ENROLLMENT', targetId: paidCourse.id, promoCode: 'P2CAP' })).json?.operation;
  const capB = (await call('paid', 'POST', '/api/operations', { type: 'BUNDLE_PURCHASE', targetId: bundle.id, promoCode: 'P2CAP' })).json?.operation;
  check('REV both requests got the discount while the cap was not yet reached', capA?.promoCode === 'P2CAP' && capB?.promoCode === 'P2CAP');
  const [okA, okB] = await Promise.all([call('owner', 'POST', `/api/operations/${capA.id}/approve`, {}), call('owner', 'POST', `/api/operations/${capB.id}/approve`, {})]);
  check('REV hard cap: one approval wins, the other gets 409', [okA.status, okB.status].sort().join() === '200,409', `${okA.status},${okB.status}`);
  check('REV usageCount never exceeds maxUses', (await prisma.promotion.findUnique({ where: { code: 'P2CAP' } })).usageCount === 1);
  const loser = okA.status === 409 ? capA : capB;
  check('REV the refused approval stays PENDING (rolled back)', (await prisma.pendingOperation.findUnique({ where: { id: loser.id } })).status === 'PENDING');

  r = await call(null, 'POST', '/api/operations', anon({ type: 'ACCOUNT_ACTIVATION' }));
  r = await call('owner', 'POST', `/api/operations/${r.json.operation.id}/approve`, {});
  check('REV approving an activation with no linked account -> 400', r.status === 400, r.status);

  r = await call('commercial', 'POST', '/api/courses', { titleAr: 'P2PROBE badprice', priceDzd: -5 });
  check('REV negative course price -> 400, not 500', r.status === 400, r.status);
  r = await call('commercial', 'POST', '/api/courses', { titleAr: 'P2PROBE ghostteacher', teacherId: 'nobody' });
  check('REV unknown teacherId -> 400, not 500', r.status === 400, r.status);
  r = await call('commercial', 'POST', '/api/bundles', { titleAr: 'P2PROBE neg', descriptionAr: 'd', originalPriceDzd: 10, currentPriceDzd: -1 });
  check('REV negative bundle price -> 400', r.status === 400, r.status);
  r = await call('owner', 'PUT', '/api/settings', { ambassadorCommissionRate: 150 });
  check('REV commission rate 150 -> 400', r.status === 400, r.status);
  r = await call('owner', 'PUT', '/api/settings', { ambassadorCommissionRate: -5 });
  check('REV commission rate -5 -> 400', r.status === 400, r.status);
  r = await call('owner', 'PUT', '/api/ambassadors', { id: S.ambProfile.id, promoCode: 'PROMO2026' });
  check('REV ambassador code cannot copy a platform campaign code (400)', r.status === 400, r.status);
  r = await call('owner', 'PUT', '/api/ambassadors', { id: S.ambProfile.id, promoCode: 'bad code' });
  check('REV malformed ambassador code -> 400', r.status === 400, r.status);
  r = await call('free', 'POST', '/api/account/upgrade', {});
  check('REV legacy /api/account/upgrade route is gone', r.status === 404 || r.status === 405, r.status);
  r = await call('commercial', 'GET', '/api/bundles?all=true');
  check('REV admin bundle list loads', r.status === 200 && Array.isArray(r.json), r.status);

  // ---- M-17: database rules (checked directly on the throwaway DB)
  let threw = false;
  try { await prisma.enrollment.create({ data: { studentId: S.free.id, courseId: freeCourse.id, courseTitle: 'dup', teacherName: 'T' } }); } catch { threw = true; }
  check('M-17 duplicate enrollment is rejected by the database', threw);
  threw = false;
  try { await prisma.pendingOperation.create({ data: { userName: 'P2 neg', userEmail: '', title: 't', amountDzd: -5 } }); } catch { threw = true; }
  check('M-17 negative operation amount is rejected by the database', threw);
  threw = false;
  try { await prisma.course.create({ data: { titleAr: 'P2PROBE neg', teacherName: 'T', priceDzd: -1 } }); } catch { threw = true; }
  check('M-17 negative course price is rejected by the database', threw);
  threw = false;
  try { await prisma.enrollment.create({ data: { studentId: 'ghost', courseId: freeCourse.id, courseTitle: 'x', teacherName: 'T' } }); } catch { threw = true; }
  check('M-17 enrollment for a non-existent student is rejected (foreign key)', threw);
  const tmp = await prisma.user.create({ data: { email: mail('tmpteacher'), name: 'P2 tmp', role: 'TEACHER', passwordHash: 'x' } });
  const tmpProfile = await prisma.teacherProfile.create({ data: { userId: tmp.id, university: 'U' } });
  await prisma.facultyPayout.create({ data: { teacherProfileId: tmpProfile.id, amountDzd: 100, periodMonth: '2026-10' } });
  const tmpCourse = await prisma.course.create({ data: { titleAr: 'P2PROBE tmp', teacherName: 'T', teacherId: tmp.id } });
  await prisma.enrollment.create({ data: { studentId: S.free2.id, courseId: tmpCourse.id, courseTitle: 'x', teacherName: 'T' } });
  await prisma.user.delete({ where: { id: tmp.id } });
  check('M-17 deleting a teacher removes the profile and payouts (no orphans)', (await prisma.teacherProfile.count({ where: { id: tmpProfile.id } })) === 0 && (await prisma.facultyPayout.count({ where: { teacherProfileId: tmpProfile.id } })) === 0);
  check('M-17 the teacher course stays, teacherId is cleared', (await prisma.course.findUnique({ where: { id: tmpCourse.id } }))?.teacherId === null);
  await prisma.course.delete({ where: { id: tmpCourse.id } });
  check('M-17 deleting a course removes its enrollments', (await prisma.enrollment.count({ where: { courseId: tmpCourse.id } })) === 0);
  const idx = await prisma.$queryRaw`SELECT indexname FROM pg_indexes WHERE indexname IN ('PendingOperation_status_createdAt_idx','Enrollment_studentId_courseId_key','User_role_idx')`;
  check('M-17 indexes exist', idx.length === 3, String(idx.length));
}

run()
  .catch((e) => { fail++; results.push('FAIL  harness crashed -> ' + (e.stack || e)); })
  .finally(async () => {
    try { await cleanup(); } catch (e) { results.push('cleanup error: ' + e.message); }
    await prisma.$disconnect();
    console.log(results.join('\n'));
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  });
