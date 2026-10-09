// Regression probes against a RUNNING dev server and a THROWAWAY local database. See tests/probes/README.md.
// Phase 7: admin-managed teacher cards for the landing page (switch, order, public bio, photo, public endpoint).
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
const STUB = 'http://localhost:54999';
const PUB = `${STUB}/storage/v1/object/public/dz-images/`;
const prisma = new PrismaClient();
const PW = 'P7-' + crypto.randomBytes(9).toString('hex');
const TAG = 'p7probe';
const mail = (k) => `${TAG}.${k.toLowerCase()}@test.local`;
const rnd = () => Math.floor(Math.random() * 250) + 1;

const ROLES = {
  owner: { role: 'OWNER' },
  commercial: { role: 'ADMIN', adminRole: 'COMMERCIAL' },
  t1: { role: 'TEACHER' },
  t2: { role: 'TEACHER' },
  t3: { role: 'TEACHER', unverified: true },
  student: { role: 'STUDENT_FREE' },
};
const users = {};
const profiles = {};
const jars = {};
let pass = 0, fail = 0;
const results = [];
function check(name, ok, detail = '') {
  (ok ? pass++ : fail++);
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + detail}`);
}

async function call(who, method, path, body) {
  const headers = { 'content-type': 'application/json', 'x-forwarded-for': `10.${rnd()}.${rnd()}.${rnd()}` };
  if (who && jars[who]) headers.cookie = jars[who];
  const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

// Stand-in for Supabase Storage: signs any upload path it is asked for.
const stub = http.createServer((rq, rs) => {
  rq.on('data', () => {});
  rq.on('end', () => {
    const m = rq.url.match(/^\/storage\/v1\/object\/upload\/sign\/([^/]+)\/(.+)$/);
    if (rq.method === 'POST' && m && rq.headers.authorization === 'Bearer test-service-key') {
      rs.writeHead(200, { 'content-type': 'application/json' });
      return rs.end(JSON.stringify({ url: `/object/upload/sign/${m[1]}/${m[2]}?token=tok123` }));
    }
    rs.writeHead(404, { 'content-type': 'application/json' });
    rs.end('{"error":"not found"}');
  });
});

async function cleanup() {
  await prisma.user.deleteMany({ where: { email: { startsWith: TAG + '.' } } }); // profiles cascade
}

async function setup() {
  await cleanup();
  const hash = await bcrypt.hash(PW, 8);
  for (const [k, def] of Object.entries(ROLES)) {
    users[k] = await prisma.user.create({
      data: { email: mail(k), name: `P7 ${k}`, passwordHash: hash, isVerified: !def.unverified, role: def.role, adminRole: def.adminRole || null, studentCardId: `DZ-ZZZ-16-P7${crypto.randomBytes(3).toString('hex').toUpperCase()}`, wilayaCode: 16 },
    });
    if (def.role === 'TEACHER') {
      profiles[k] = await prisma.teacherProfile.create({ data: { userId: users[k].id, university: 'P7 University', specialty: `P7 subject ${k}`, ccpAccount: '0012345678', hourlyRateDzd: 12345 } });
    }
  }
  for (const k of Object.keys(ROLES)) {
    if (ROLES[k].unverified) continue; // unverified accounts cannot sign in; only the owner edits them
    const r = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.${rnd()}.${rnd()}.${rnd()}` }, body: JSON.stringify({ email: mail(k), password: PW }) });
    const m = (r.headers.get('set-cookie') || '').match(/dz_token=[^;]+/);
    if (!m) throw new Error(`login failed for ${k}: ${r.status}`);
    jars[k] = m[0];
  }
}

const uuid = () => crypto.randomUUID();
const mine = (list) => list.filter((x) => String(x.specialty || '').startsWith('P7 subject'));

async function run() {
  await new Promise((r) => stub.listen(54999, r));
  await setup();
  const put = (who, k, body) => call(who, 'PUT', `/api/teachers/${profiles[k].id}`, body);
  const photo = (who = 'owner', kind = 'teacher') => `${PUB}${kind}/${users[who].id}/${uuid()}.webp`;
  let r;

  // ---- hidden by default, public output carries public fields only
  r = await call(null, 'GET', '/api/teachers/public');
  check('PUB endpoint is public and teachers start hidden', r.status === 200 && Array.isArray(r.json) && mine(r.json).length === 0, JSON.stringify(r.json));

  // ---- who may edit and upload
  r = await put('commercial', 't1', { showOnLanding: true });
  check('PERM catalog admin cannot change landing cards', r.status === 403, r.status);
  r = await put('t1', 't1', { showOnLanding: true });
  check('PERM a teacher cannot show themselves', r.status === 403, r.status);
  r = await put(null, 't1', { showOnLanding: true });
  check('PERM anonymous cannot edit', r.status === 401 || r.status === 403, r.status);
  r = await call('owner', 'POST', '/api/uploads/image', { kind: 'teacher', contentType: 'image/webp', size: 1000 });
  check('PERM HR/owner gets a signed teacher-photo upload', r.status === 200 && r.json?.publicUrl?.startsWith(`${PUB}teacher/${users.owner.id}/`), JSON.stringify(r.json));
  for (const who of ['commercial', 't1', 'student']) {
    r = await call(who, 'POST', '/api/uploads/image', { kind: 'teacher', contentType: 'image/webp', size: 1000 });
    check(`PERM ${who} cannot upload a teacher photo`, r.status === 403, r.status);
  }

  // ---- validation
  const bads = {
    'bio over 400 chars': { publicBio: 'x'.repeat(401) },
    'bio not a string': { publicBio: 5 },
    'order -1': { landingOrder: -1 },
    'order 1000': { landingOrder: 1000 },
    'order a string': { landingOrder: '3' },
    'order a float': { landingOrder: 1.5 },
    'photo from another host': { photoUrl: 'https://evil.example/a.webp' },
    'photo of the wrong kind': { photoUrl: photo('owner', 'course') },
    'photo with path tricks': { photoUrl: `${PUB}teacher/${users.owner.id}/../../x.webp` },
  };
  for (const [label, body] of Object.entries(bads)) {
    r = await put('owner', 't1', body);
    check(`VAL rejects: ${label}`, r.status === 400, r.status);
  }
  r = await put('owner', 't1', { showOnLanding: 'yes' });
  const stillHidden = await prisma.teacherProfile.findUnique({ where: { id: profiles.t1.id } });
  check('VAL a non-boolean switch is ignored, not stored', r.status === 200 && stillHidden.showOnLanding === false, JSON.stringify(stillHidden));

  // ---- visibility, order and public fields
  const p1 = photo();
  r = await put('owner', 't1', { showOnLanding: true, landingOrder: 2, publicBio: '  Bio one  ', photoUrl: p1 });
  check('SHOW owner switches teacher one on with order, bio and photo', r.status === 200 && r.json.showOnLanding === true && r.json.publicBio === 'Bio one' && r.json.photoUrl === p1, JSON.stringify(r.json));
  await put('owner', 't2', { showOnLanding: true, landingOrder: 1, publicBio: 'Bio two' });
  await put('owner', 't3', { showOnLanding: true, landingOrder: 0, publicBio: 'Bio three' });
  r = await call(null, 'GET', '/api/teachers/public');
  const list = mine(r.json || []);
  check('SHOW public list is ordered by landingOrder', list.length === 2 && list[0].bio === 'Bio two' && list[1].bio === 'Bio one', JSON.stringify(list));
  check('SHOW an unverified teacher stays hidden even when switched on', !list.some((x) => x.bio === 'Bio three'));
  check('SHOW public items carry only public fields', list.every((x) => Object.keys(x).sort().join() === 'bio,id,name,photoUrl,specialty,university'), JSON.stringify(list[0]));
  const raw = JSON.stringify(mine(r.json || []));
  check('SHOW no email, phone or pay data in the public answer', !/p7probe|ccp|0012345678|12345|hourly|@/i.test(raw), raw.slice(0, 200));

  // ---- clearing and turning off
  r = await put('owner', 't1', { photoUrl: null, publicBio: '' });
  check('CLR photo and bio can be cleared', r.status === 200 && r.json.photoUrl === null && r.json.publicBio === null, JSON.stringify(r.json));
  await put('owner', 't2', { showOnLanding: false });
  r = await call(null, 'GET', '/api/teachers/public');
  check('CLR switching off removes the teacher from the public list', mine(r.json || []).length === 1);

  // ---- admin list still returns the fields for the Faculty tab
  r = await call('owner', 'GET', '/api/teachers');
  const row = (r.json || []).find((x) => x.id === profiles.t1.id);
  check('ADM staff list includes the landing fields', row && row.showOnLanding === true && row.landingOrder === 2, JSON.stringify(row));
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
