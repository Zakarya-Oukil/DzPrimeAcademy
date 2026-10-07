// Regression probes against a RUNNING dev server and a THROWAWAY local database. See tests/probes/README.md.
// Phase 5: public settings, join links, error handling, card expiry, account validation, private exam files, headers.
const { createRequire } = require('module');
const http = require('http');
const FE = require('path').resolve(__dirname, '..', '..') + '/';
const req = createRequire(FE + 'package.json');
process.env.DATABASE_URL = require('./guard.cjs').probeDatabaseUrl();
process.env.DIRECT_URL = process.env.DATABASE_URL;
const { PrismaClient } = req('@prisma/client');
const bcrypt = req('bcryptjs');
const crypto = require('crypto');

const BASE = process.env.PROBE_BASE_URL || 'http://localhost:3000';
const prisma = new PrismaClient();
const PW = 'P5-' + crypto.randomBytes(9).toString('hex');
const TAG = 'p5probe';
const mail = (k) => `${TAG}.${k.toLowerCase()}@test.local`;
const rnd = () => Math.floor(Math.random() * 250) + 1;

const ROLES = {
  owner: { role: 'OWNER' },
  commercial: { role: 'ADMIN', adminRole: 'COMMERCIAL' },
  hrm: { role: 'ADMIN', adminRole: 'HR_MANAGER' },
  teacher: { role: 'TEACHER' },
  free: { role: 'STUDENT_FREE' },
  free2: { role: 'STUDENT_FREE' },
  paid: { role: 'STUDENT_PAID' },
  expired: { role: 'STUDENT_PAID' },
};
const users = {};
const jars = {};
let pass = 0, fail = 0;
const results = [];
function check(name, ok, detail = '') {
  (ok ? pass++ : fail++);
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + detail}`);
}

async function call(who, method, path, body, extraHeaders = {}) {
  const headers = { 'content-type': 'application/json', 'x-forwarded-for': `10.${rnd()}.${rnd()}.${rnd()}`, ...extraHeaders };
  if (who && jars[who]) headers.cookie = jars[who];
  const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body), redirect: 'manual' });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json, headers: res.headers };
}

// Stand-in for the private exam bucket: signs only paths that exist in its list.
const exists = new Set(['probe/a.pdf', 'probe/b.pdf']);
const stub = http.createServer((rq, rs) => {
  rq.on('data', () => {});
  rq.on('end', () => {
    const m = rq.url.match(/^\/storage\/v1\/object\/sign\/([^/]+)\/(.+)$/);
    if (rq.method === 'POST' && m && rq.headers.authorization === 'Bearer test-service-key' && exists.has(m[2])) {
      rs.writeHead(200, { 'content-type': 'application/json' });
      return rs.end(JSON.stringify({ signedURL: `/object/sign/${m[1]}/${m[2]}?token=sig123` }));
    }
    rs.writeHead(404, { 'content-type': 'application/json' });
    rs.end('{"error":"not found"}');
  });
});

async function cleanup() {
  const us = await prisma.user.findMany({ where: { email: { startsWith: TAG + '.' } }, select: { id: true } });
  const ids = us.map((u) => u.id);
  await prisma.liveSession.deleteMany({ where: { title: { startsWith: 'P5PROBE' } } });
  await prisma.exam.deleteMany({ where: { moduleId: 'p5probe-mod' } });
  await prisma.subscription.deleteMany({ where: { userId: { in: ids } } });
  await prisma.bundle.deleteMany({ where: { titleAr: { startsWith: 'P5PROBE' } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: TAG + '.' } } });
}

async function setup() {
  await cleanup();
  const hash = await bcrypt.hash(PW, 8);
  for (const [k, def] of Object.entries(ROLES)) {
    users[k] = await prisma.user.create({
      data: { email: mail(k), name: `P5 ${k}`, passwordHash: hash, isVerified: true, role: def.role, adminRole: def.adminRole || null, studentCardId: `DZ-ZZZ-16-P5${crypto.randomBytes(3).toString('hex').toUpperCase()}`, wilayaCode: 16 },
    });
  }
  for (const k of Object.keys(ROLES)) {
    const r = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.${rnd()}.${rnd()}.${rnd()}` }, body: JSON.stringify({ email: mail(k), password: PW }) });
    const m = (r.headers.get('set-cookie') || '').match(/dz_token=[^;]+/);
    if (!m) throw new Error(`login failed for ${k}: ${r.status}`);
    jars[k] = m[0];
  }
}

async function run() {
  await new Promise((r) => stub.listen(54999, r));
  await setup();
  const S = users;
  let r;

  // ---- public settings
  const before = (await prisma.platformSettings.findUnique({ where: { id: 'singleton' } }))?.updatedAt?.getTime();
  r = await call(null, 'GET', '/api/settings');
  const hidden = ['landingConfig', 'footerConfig', 'ambassadorCommissionRate', 'autoVerifyCards', 'id', 'updatedAt'];
  check('SET a visitor gets only the public fields', r.status === 200 && hidden.every((k) => !(k in r.json)) && 'vipPriceDzd' in r.json && 'whatsappNumber' in r.json, JSON.stringify(Object.keys(r.json || {})));
  r = await call('free', 'GET', '/api/settings');
  check('SET a signed-in student gets the same public subset', hidden.every((k) => !(k in r.json)));
  r = await call('commercial', 'GET', '/api/settings');
  check('SET staff without settings.manage get the public subset', hidden.every((k) => !(k in r.json)));
  r = await call('owner', 'GET', '/api/settings');
  check('SET staff with settings.manage get everything', 'ambassadorCommissionRate' in r.json && 'landingConfig' in r.json && 'footerConfig' in r.json);
  await call(null, 'GET', '/api/settings');
  const after = (await prisma.platformSettings.findUnique({ where: { id: 'singleton' } }))?.updatedAt?.getTime();
  check('SET reading the settings never writes (updatedAt unchanged)', before === after, `${before} vs ${after}`);

  // ---- live-session join links
  const future = new Date(Date.now() + 5 * 86400000).toISOString();
  r = await call('teacher', 'POST', '/api/sessions', { title: 'P5PROBE live', scheduledAt: future, meetUrl: 'https://meet.google.com/p5p-robe-xyz' });
  const ses = r.json;
  const link = (list) => list.find((x) => x.id === ses.id)?.meetUrl;
  check('JOIN the session is created with a link', r.status === 201 && ses.meetUrl === 'https://meet.google.com/p5p-robe-xyz');
  const anonList = (await call(null, 'GET', '/api/sessions')).json;
  check('JOIN anonymous visitors see the session but not the link', link(anonList) === null && !!anonList.find((x) => x.id === ses.id));
  check('JOIN a signed-in student who is not registered does not get the link', link((await call('free', 'GET', '/api/sessions')).json) === null);
  check('JOIN another teacher does not get the link', link((await call('hrm', 'GET', '/api/sessions')).json) === null);
  check('JOIN the session teacher gets the link', link((await call('teacher', 'GET', '/api/sessions')).json) === 'https://meet.google.com/p5p-robe-xyz');
  check('JOIN catalog staff get the link', link((await call('commercial', 'GET', '/api/sessions')).json) === 'https://meet.google.com/p5p-robe-xyz');
  r = await call('free', 'POST', `/api/sessions/${ses.id}/register`, {});
  check('JOIN a student can register (201)', r.status === 201, r.status);
  check('JOIN after registering the student gets the link', link((await call('free', 'GET', '/api/sessions')).json) === 'https://meet.google.com/p5p-robe-xyz');
  check('JOIN a different student still does not', link((await call('free2', 'GET', '/api/sessions')).json) === null);
  await prisma.liveSession.update({ where: { id: ses.id }, data: { status: 'COMPLETED' } });
  r = await call('free2', 'POST', `/api/sessions/${ses.id}/register`, {});
  check('JOIN registering for a finished session is refused (409)', r.status === 409, r.status);
  r = await call(null, 'POST', `/api/sessions/${ses.id}/register`, {});
  check('JOIN anonymous registration is refused', r.status === 401, r.status);

  // ---- errors are answered properly, without database text
  for (const [label, who, method, path, body] of [
    ['unknown bundle PUT', 'commercial', 'PUT', '/api/bundles/does-not-exist', { titleAr: 'x' }],
    ['unknown bundle DELETE', 'commercial', 'DELETE', '/api/bundles/does-not-exist'],
    ['unknown student DELETE', 'hrm', 'DELETE', '/api/students/does-not-exist'],
    ['unknown teacher PUT', 'hrm', 'PUT', '/api/teachers/does-not-exist', { bio: 'x' }],
    ['unknown teacher DELETE', 'hrm', 'DELETE', '/api/teachers/does-not-exist'],
    ['unknown staff DELETE', 'owner', 'DELETE', '/api/admin/staff/does-not-exist'],
    ['unknown ambassador DELETE', 'hrm', 'DELETE', '/api/ambassadors/does-not-exist'],
  ]) {
    r = await call(who, method, path, body);
    check(`ERR ${label} -> 404, not 500`, r.status === 404, `${r.status} ${JSON.stringify(r.json)}`);
  }
  for (const [label, who, method, path] of [['settings', 'owner', 'PUT', '/api/settings'], ['promotions', 'commercial', 'POST', '/api/promotions'], ['students', 'hrm', 'POST', '/api/students'], ['account', 'free', 'PUT', '/api/account']]) {
    r = await call(who, method, path, '{not json');
    check(`ERR malformed JSON on ${label} -> 400, not 500`, r.status === 400, `${r.status} ${JSON.stringify(r.json)}`);
  }
  r = await call('hrm', 'POST', '/api/students', { name: 'P5 dup', email: mail('free') });
  check('ERR duplicate email -> 409 with a plain message', r.status === 409 && !/prisma|unique|constraint/i.test(JSON.stringify(r.json)), `${r.status} ${JSON.stringify(r.json)}`);

  // ---- card verification
  r = await call(null, 'GET', `/api/card/verify/${S.free.studentCardId}`);
  check('CARD a free student card has no invented expiry date', r.status === 200 && r.json.card.expiryDate === null && r.json.card.membership === 'NONE' && r.json.isValid === true, JSON.stringify(r.json));
  const end = new Date(Date.now() + 200 * 86400000);
  await prisma.subscription.create({ data: { userId: S.paid.id, cardId: S.paid.studentCardId, endDate: end } });
  r = await call(null, 'GET', `/api/card/verify/${S.paid.studentCardId}`);
  check('CARD an active membership shows its real end date', r.json.card.membership === 'ACTIVE' && r.json.card.expiryDate === end.toISOString().slice(0, 10).replace(/-/g, '/') && r.json.isValid === true, JSON.stringify(r.json.card));
  await prisma.subscription.create({ data: { userId: S.expired.id, cardId: S.expired.studentCardId, endDate: new Date(Date.now() - 86400000) } });
  r = await call(null, 'GET', `/api/card/verify/${S.expired.studentCardId}`);
  check('CARD an expired membership is reported as expired and not valid', r.json.card.membership === 'EXPIRED' && r.json.isValid === false, JSON.stringify(r.json));
  r = await call(null, 'GET', '/api/card/verify/DZ-STU-16-NOSUCHID');
  check('CARD unknown card -> 404', r.status === 404, r.status);

  // ---- account update validation
  for (const [label, body] of [['bio over 1000 characters', { bio: 'b'.repeat(1001) }], ['object name', { name: { x: 1 } }], ['javascript: link', { facebook: 'javascript:alert(1)' }], ['http link', { website: 'http://plain.example' }], ['phone with letters', { phone: 'call me' }], ['wilaya 99', { wilayaCode: 99 }], ['wilaya text', { wilayaCode: 'abc' }], ['200-character telegram', { telegram: 't'.repeat(200) }]]) {
    r = await call('free', 'PUT', '/api/account', body);
    check(`ACC refuses ${label} (400)`, r.status === 400, `${r.status} ${JSON.stringify(r.json)}`);
  }
  r = await call('free', 'PUT', '/api/account', { bio: 'Hello', facebook: 'https://facebook.com/p5', phone: '+213 555 12 34 56', wilayaCode: 31 });
  check('ACC valid update is accepted and stored', r.status === 200 && r.json.user.bio === 'Hello' && r.json.user.wilayaCode === 31, `${r.status} ${JSON.stringify(r.json).slice(0, 100)}`);

  // ---- exam files: tier rule on the server, private files only through short-lived links
  const mk = (year, extra) => prisma.exam.create({ data: { title: `P5PROBE ${year}`, year, termType: 'FINAL_SEMESTRIAL', fileUrl: '/exams/plain.pdf', moduleId: 'p5probe-mod', ...extra } });
  await mk(3004, { fileUrl: 'storage:probe/a.pdf' });
  await mk(3003, { fileUrl: '/exams/second.pdf' });
  await mk(3002, { fileUrl: 'storage:probe/b.pdf', solutionUrl: 'storage:probe/a.pdf' });
  await mk(3001, { fileUrl: 'storage:probe/missing.pdf' });
  const exams = async (who) => (await call(who, 'GET', '/api/exams?moduleId=p5probe-mod')).json.exams;
  let list = await exams(null);
  check('EXAM list comes from the database, newest first', list.length === 4 && list[0].year === 3004);
  check('EXAM an open exam with a private file gets a signed, expiring link', list[0].fileUrl.includes('/object/sign/dz-exams/probe/a.pdf?token=sig123') && !list[0].fileUrl.includes('storage:'), list[0].fileUrl);
  check('EXAM a visitor sees the first two as open and the rest locked', !list[0].isLocked && !list[1].isLocked && list[2].isLocked && list[3].isLocked);
  check('EXAM a locked exam exposes no file link and no solution', list[2].fileUrl === '#locked' && list[2].solutionUrl === null && !JSON.stringify(list[2]).includes('probe/b.pdf'));
  check('EXAM a free student is locked out of the same exams', (await exams('free'))[2].isLocked === true);
  list = await exams('paid');
  check('EXAM a paid student gets signed links for private files, solution included', !list[2].isLocked && list[2].fileUrl.includes('sig123') && list[2].solutionUrl.includes('sig123'));
  check('EXAM a private file that cannot be signed is "unavailable", never the raw reference', list[3].fileUrl === '#unavailable', list[3].fileUrl);
  check('EXAM plain URLs are passed through unchanged', list[1].fileUrl === '/exams/second.pdf');

  // ---- response headers
  r = await call(null, 'GET', '/api/courses');
  const h = r.headers;
  check('HDR clickjacking and sniffing protections are set', h.get('x-frame-options') === 'DENY' && h.get('x-content-type-options') === 'nosniff' && /frame-ancestors 'none'/.test(h.get('content-security-policy') || ''), JSON.stringify([...h.entries()].filter(([k]) => /x-frame|x-content|content-security/.test(k))));
  check('HDR referrer and permissions policies are set', h.get('referrer-policy') === 'strict-origin-when-cross-origin' && /camera=\(\)/.test(h.get('permissions-policy') || ''));
  check('HDR the framework is not advertised', !h.get('x-powered-by'));
  const page = await fetch(BASE + '/ar');
  check('HDR pages carry the same headers', page.headers.get('x-frame-options') === 'DENY');
}

run()
  .catch((e) => { fail++; results.push('FAIL  harness crashed -> ' + (e.stack || e)); })
  .finally(async () => {
    try { await cleanup(); } catch (e) { results.push('cleanup error: ' + e.message); }
    await prisma.$disconnect();
    stub.close();
    console.log(results.join('\n'));
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  });
