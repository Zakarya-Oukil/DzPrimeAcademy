// Regression probes against a RUNNING dev server and a THROWAWAY local database. See tests/probes/README.md.
// Phase 4 probes (sign-in lifecycle). Throwaway DB only (localhost:55432). Creates its own users, cleans up after.
const { createRequire } = require('module');
const { spawnSync } = require('child_process');
const FE = require('path').resolve(__dirname, '..', '..') + '/';
const req = createRequire(FE + 'package.json');
process.env.DATABASE_URL = require('./guard.cjs').probeDatabaseUrl();
process.env.DIRECT_URL = process.env.DATABASE_URL;
const { PrismaClient } = req('@prisma/client');
const bcrypt = req('bcryptjs');
const crypto = require('crypto');

const BASE = process.env.PROBE_BASE_URL || 'http://localhost:3000';
const prisma = new PrismaClient();
const PW = 'P4-' + crypto.randomBytes(9).toString('hex');
const TAG = 'p4probe';
const mail = (k) => `${TAG}.${k.toLowerCase()}@test.local`;
const rnd = () => Math.floor(Math.random() * 250) + 1;
const ip = () => `10.${rnd()}.${rnd()}.${rnd()}`;
const hex = () => crypto.randomBytes(32).toString('hex');

let pass = 0, fail = 0;
const results = [];
function check(name, ok, detail = '') {
  (ok ? pass++ : fail++);
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + detail}`);
}

async function call(method, path, body, { cookie, from } = {}) {
  const headers = { 'content-type': 'application/json', 'x-forwarded-for': from || ip() };
  if (cookie) headers.cookie = cookie;
  const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body), redirect: 'manual' });
  let json = null;
  try { json = await res.json(); } catch {}
  const sc = res.headers.get('set-cookie') || '';
  const m = sc.match(/dz_token=([^;]*)/);
  return { status: res.status, json, setCookie: sc, token: m && m[1] ? 'dz_token=' + m[1] : null };
}
const login = (email, password, from) => call('POST', '/api/auth/login', { email, password }, { from });
const me = (cookie) => call('GET', '/api/auth/me', undefined, { cookie });

const users = {};
async function mkUser(k, extra = {}) {
  users[k] = await prisma.user.create({ data: { email: mail(k), name: `P4 ${k}`, passwordHash: await bcrypt.hash(PW, 8), isVerified: true, role: 'STUDENT_FREE', studentCardId: `DZ-ZZZ-16-P4${crypto.randomBytes(3).toString('hex').toUpperCase()}`, ...extra } });
  return users[k];
}

async function cleanup() {
  const us = await prisma.user.findMany({ where: { email: { startsWith: TAG + '.' } }, select: { id: true } });
  const ids = us.map((u) => u.id);
  await prisma.pendingOperation.deleteMany({ where: { OR: [{ userId: { in: ids } }, { userEmail: { startsWith: TAG + '.' } }] } });
  await prisma.loginAttempt.deleteMany({ where: { identifier: { startsWith: TAG + '.' } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: TAG + '.' } } });
}

async function run() {
  await cleanup();
  await mkUser('owner', { role: 'OWNER' });
  await mkUser('student');
  await mkUser('student2');
  await mkUser('unverified', { isVerified: false });
  let r;

  // ---- login basics
  r = await login(mail('student'), PW);
  const tok1 = r.token;
  check('LOGIN correct password -> 200 with a cookie', r.status === 200 && !!tok1, r.status);
  check('LOGIN response never carries the hash or the token version', r.json?.user && !('passwordHash' in r.json.user) && !('tokenVersion' in r.json.user));
  r = await me(tok1);
  check('LOGIN cookie works on /api/auth/me', r.status === 200, r.status);
  r = await login(mail('student'), 'wrong-password');
  const wrong = r;
  r = await login('nobody.' + hex().slice(0, 8) + '@test.local', 'wrong-password');
  check('LOGIN unknown email and wrong password give the same answer (no account enumeration)', wrong.status === 401 && r.status === 401 && wrong.json.error === r.json.error);
  r = await call('POST', '/api/auth/login', { email: { $ne: 1 }, password: ['x'] });
  check('LOGIN non-string fields -> 400, not 500', r.status === 400, r.status);
  r = await call('POST', '/api/auth/login', 'null');
  check('LOGIN JSON null -> 400', r.status === 400, r.status);
  r = await login('a'.repeat(400) + '@x.com', 'pw');
  check('LOGIN oversized email -> 401 without touching the database', r.status === 401, r.status);
  r = await login(mail('unverified'), PW);
  check('LOGIN unverified account -> 403', r.status === 403 && r.json.code === 'ACCOUNT_NOT_VERIFIED', r.status);

  // ---- lockout can no longer be used to lock someone else out
  const attacker = ip();
  let last;
  for (let i = 0; i < 6; i++) last = await login(mail('student2'), 'wrong-' + i, attacker);
  check('LOCK repeated wrong passwords from one address lock that address (429)', last.status === 429, last.status);
  r = await login(mail('student2'), PW, ip());
  check('LOCK the real owner from another address still gets in (account not locked out)', r.status === 200, r.status);
  r = await login(mail('student2'), PW, attacker);
  check('LOCK the attacker address stays locked even with the right password', r.status === 429, r.status);
  const flood = ip();
  let got429 = false;
  for (let i = 0; i < 35; i++) { const x = await login(`flood${i}.${hex().slice(0, 6)}@test.local`, 'x', flood); if (x.status === 429) { got429 = true; break; } }
  check('LOCK per-address login rate limit (429)', got429);

  // ---- logout and token versions
  r = await login(mail('student'), PW);
  const tokA = r.token;
  r = await login(mail('student'), PW);
  const tokB = r.token;
  check('TOKEN two logins give two working cookies', (await me(tokA)).status === 200 && (await me(tokB)).status === 200);
  r = await call('POST', '/api/auth/logout', {}, { cookie: tokA });
  check('TOKEN logout -> 200 and clears the cookie', r.status === 200 && /dz_token=;/.test(r.setCookie));
  check('TOKEN the token used to log out is dead', (await me(tokA)).status === 401);
  check('TOKEN a copied token (other device) is dead too after logout', (await me(tokB)).status === 401);
  r = await call('POST', '/api/auth/logout', {});
  check('TOKEN logout without a login is harmless (200)', r.status === 200, r.status);
  check('TOKEN a tampered token is rejected', (await me(tokA.slice(0, -4) + 'AAAA')).status === 401);

  // ---- change password
  r = await login(mail('student'), PW);
  const t0 = r.token;
  for (const [label, pw] of [['7 characters', 'Abc1234'], ['digits only', '12345678'], ['empty', ''], ['129 characters', 'A1'.repeat(65)], ['not a string', 12345678]]) {
    r = await call('POST', '/api/account/change-password', { currentPassword: PW, newPassword: pw }, { cookie: t0 });
    check(`PWD change refuses ${label} (400)`, r.status === 400, r.status);
  }
  r = await call('POST', '/api/account/change-password', { currentPassword: 'not-it', newPassword: 'Newpass-12345' }, { cookie: t0 });
  check('PWD change needs the correct current password (400)', r.status === 400, r.status);
  r = await call('POST', '/api/account/change-password', { currentPassword: PW, newPassword: 'Newpass-12345' }, { cookie: t0 });
  const t1 = r.token;
  check('PWD change succeeds and hands back a fresh cookie', r.status === 200 && !!t1 && t1 !== t0, r.status);
  check('PWD the old token stops working after a password change', (await me(t0)).status === 401);
  check('PWD the fresh token works', (await me(t1)).status === 200);
  check('PWD new password logs in, old one does not', (await login(mail('student'), 'Newpass-12345')).status === 200 && (await login(mail('student'), PW)).status === 401);
  await prisma.user.update({ where: { id: users.student.id }, data: { passwordHash: await bcrypt.hash(PW, 8) } });

  // ---- forgot / reset
  r = await call('POST', '/api/auth/forgot-password', { email: 'nobody.' + hex().slice(0, 8) + '@test.local' });
  const unknown = r;
  r = await call('POST', '/api/auth/forgot-password', { email: mail('student') });
  check('FORGOT unknown and known addresses get the identical answer', unknown.status === 200 && r.status === 200 && unknown.json.message === r.json.message);
  const tokens1 = await prisma.passwordResetToken.findMany({ where: { userId: users.student.id }, orderBy: { createdAt: 'asc' } });
  check('FORGOT a reset token exists for the known address, valid ~30 minutes', tokens1.length === 1 && !tokens1[0].used && tokens1[0].expiresAt.getTime() - Date.now() > 25 * 60000 && tokens1[0].expiresAt.getTime() - Date.now() <= 30 * 60000 + 5000, JSON.stringify(tokens1.map((t) => t.used)));
  r = await call('POST', '/api/auth/forgot-password', { email: mail('student').toUpperCase() });
  const tokens2 = await prisma.passwordResetToken.findMany({ where: { userId: users.student.id }, orderBy: { createdAt: 'asc' } });
  check('FORGOT a newer request kills the older link (only the latest works)', tokens2.length === 2 && tokens2[0].used === true && tokens2[1].used === false);
  r = await call('POST', '/api/auth/forgot-password', { email: 12345 });
  check('FORGOT non-string email -> 400', r.status === 400, r.status);
  for (let i = 0; i < 5; i++) await call('POST', '/api/auth/forgot-password', { email: mail('student') });
  const t3 = await prisma.passwordResetToken.count({ where: { userId: users.student.id } });
  r = await call('POST', '/api/auth/forgot-password', { email: mail('student') });
  check('FORGOT per-mailbox limit: past 6 an hour no new link is made but the answer is the same', r.status === 200 && (await prisma.passwordResetToken.count({ where: { userId: users.student.id } })) === t3, `${t3}`);
  const fixed = ip();
  let f429 = false;
  for (let i = 0; i < 8; i++) { const x = await call('POST', '/api/auth/forgot-password', { email: `x${i}.${hex().slice(0, 6)}@test.local` }, { from: fixed }); if (x.status === 429) { f429 = true; break; } }
  check('FORGOT per-address limit (429)', f429);

  await mkUser('resetme');
  const mkReset = async (userId, extra = {}) => { const token = hex(); await prisma.passwordResetToken.create({ data: { token, userId, expiresAt: new Date(Date.now() + 20 * 60000), ...extra } }); return token; };
  let tok = await mkReset(users.resetme.id);
  for (const [label, body] of [['no token', { newPassword: 'Brand-new-1234' }], ['short token', { token: 'abc', newPassword: 'Brand-new-1234' }], ['unknown token', { token: hex(), newPassword: 'Brand-new-1234' }], ['non-string token', { token: { a: 1 }, newPassword: 'Brand-new-1234' }]]) {
    r = await call('POST', '/api/auth/reset-password', body);
    check(`RESET refuses ${label} (400)`, r.status === 400, r.status);
  }
  r = await call('POST', '/api/auth/reset-password', { token: tok, newPassword: 'short1' });
  check('RESET weak password refused and the link is NOT used up', r.status === 400 && (await prisma.passwordResetToken.findUnique({ where: { token: tok } })).used === false, r.status);
  const old = (await login(mail('resetme'), PW)).token;
  const results5 = await Promise.all(Array.from({ length: 5 }, () => call('POST', '/api/auth/reset-password', { token: tok, newPassword: 'Brand-new-1234' })));
  check('RESET 5 simultaneous uses of one link: exactly one succeeds', results5.filter((x) => x.status === 200).length === 1 && results5.filter((x) => x.status === 400).length === 4, results5.map((x) => x.status).join());
  check('RESET the link cannot be reused', (await call('POST', '/api/auth/reset-password', { token: tok, newPassword: 'Another-pass-99' })).status === 400);
  check('RESET sessions from before the reset are ended', (await me(old)).status === 401);
  check('RESET new password works, old one is dead', (await login(mail('resetme'), 'Brand-new-1234')).status === 200 && (await login(mail('resetme'), PW)).status === 401);
  const expired = await mkReset(users.resetme.id, { expiresAt: new Date(Date.now() - 1000) });
  r = await call('POST', '/api/auth/reset-password', { token: expired, newPassword: 'Brand-new-1234' });
  check('RESET expired link refused (400)', r.status === 400, r.status);
  const lockIp = ip();
  for (let i = 0; i < 6; i++) await login(mail('resetme'), 'bad-' + i, lockIp);
  const tok2 = await mkReset(users.resetme.id);
  await call('POST', '/api/auth/reset-password', { token: tok2, newPassword: 'Third-pass-5678' });
  check('RESET clears lockouts for that account', (await login(mail('resetme'), 'Third-pass-5678', lockIp)).status === 200);

  // ---- register validation
  const good = () => ({ name: 'P4 Newcomer', email: `${TAG}.new${hex().slice(0, 8)}@test.local`, password: 'Strong-pass-12', wilayaCode: 16 });
  for (const [label, patch] of [['object name', { name: { x: 1 } }], ['array email', { email: ['a@b.co'] }], ['numeric password', { password: 12345678 }], ['invalid email', { email: 'not-an-email' }], ['7-char password', { password: 'Abc1234' }], ['digits-only password', { password: '12345678' }], ['2MB name', { name: 'n'.repeat(2 * 1024 * 1024) }], ['1-char name', { name: 'x' }], ['wilaya 99', { wilayaCode: 99 }], ['wilaya text', { wilayaCode: 'abc' }], ['phone letters', { phone: 'call me' }], ['huge email', { email: 'a'.repeat(300) + '@x.com' }]]) {
    r = await call('POST', '/api/auth/register', { ...good(), ...patch });
    check(`REG refuses ${label} (400, never 500)`, r.status === 400, `${r.status} ${JSON.stringify(r.json).slice(0, 80)}`);
  }
  r = await call('POST', '/api/auth/register', 'null');
  check('REG JSON null -> 400', r.status === 400, r.status);
  const nu = good();
  r = await call('POST', '/api/auth/register', { ...nu, phone: '+213 555 12 34 56', locale: 'fr' });
  check('REG valid sign-up -> 201, unverified, no cookie', r.status === 201 && r.json.user.isVerified === false && !r.token, r.status);
  check('REG the stored card id is 8 random characters', /^DZ-STU-16-[A-Z2-9]{8}$/.test((await prisma.user.findUnique({ where: { email: nu.email } })).studentCardId));
  r = await call('POST', '/api/auth/register', { ...nu, email: nu.email.toUpperCase() });
  check('REG same email in other case -> 409', r.status === 409, r.status);
  const regIp = ip();
  let r429 = false;
  for (let i = 0; i < 13; i++) { const x = await call('POST', '/api/auth/register', good(), { from: regIp }); if (x.status === 429) { r429 = true; break; } }
  check('REG per-address limit (429)', r429);

  // ---- activation links
  const regUser = await prisma.user.findUnique({ where: { email: nu.email } });
  const act = await prisma.accountActivationToken.findFirst({ where: { userId: regUser.id } });
  for (const [label, t] of [['malformed token', 'zzz'], ['unknown token', hex()]]) {
    r = await call('GET', `/api/auth/activate?token=${t}`);
    check(`ACT ${label} refused (${label === 'malformed token' ? 400 : 404})`, r.status === (label === 'malformed token' ? 400 : 404), r.status);
  }
  r = await call('GET', `/api/auth/activate?token=${act.token}`);
  const actToken = r.token;
  check('ACT first use activates the account and signs that visit in', r.status === 200 && r.json.success && !!actToken && (await prisma.user.findUnique({ where: { id: regUser.id } })).isVerified === true, r.status);
  check('ACT the cookie works', (await me(actToken)).status === 200);
  r = await call('GET', `/api/auth/activate?token=${act.token}`);
  check('ACT the same link again: success message but NO cookie (used links never log anyone in)', r.status === 200 && r.json.alreadyVerified === true && r.json.requiresLogin === true && !r.token && !/dz_token=[^;]/.test(r.setCookie) && !r.json.user, `${r.status} ${r.setCookie}`);
  const burst = await prisma.accountActivationToken.create({ data: { token: hex(), userId: users.unverified.id, expiresAt: new Date(Date.now() + 3600000) } });
  const bursts = await Promise.all(Array.from({ length: 5 }, () => call('GET', `/api/auth/activate?token=${burst.token}`)));
  check('ACT 5 simultaneous clicks: only one is signed in', bursts.filter((x) => !!x.token).length === 1 && bursts.every((x) => x.status === 200), bursts.map((x) => `${x.status}/${!!x.token}`).join());
  const exp = await prisma.accountActivationToken.create({ data: { token: hex(), userId: users.student2.id, expiresAt: new Date(Date.now() - 1000) } });
  r = await call('GET', `/api/auth/activate?token=${exp.token}`);
  check('ACT expired link -> 410, no cookie', r.status === 410 && !r.token, r.status);
  const stale = await prisma.accountActivationToken.create({ data: { token: hex(), userId: users.owner.id, expiresAt: new Date(Date.now() + 3600000), used: true } });
  r = await call('GET', `/api/auth/activate?token=${stale.token}`);
  check('ACT an old used link for a verified account does not log in', r.status === 200 && !r.token, `${r.status} ${r.setCookie}`);

  await mkUser('pending', { isVerified: false });
  r = await call('POST', '/api/auth/activate', { email: 'nobody.' + hex().slice(0, 8) + '@test.local' });
  const same1 = r;
  r = await call('POST', '/api/auth/activate', { email: mail('student') });
  check('RESEND unknown and already-active addresses get the same answer', same1.status === 200 && r.status === 200 && same1.json.message === r.json.message);
  check('RESEND no token is created for an active account', (await prisma.accountActivationToken.count({ where: { userId: users.student.id } })) === 0);
  const pend1 = await prisma.accountActivationToken.create({ data: { token: hex(), userId: users.pending.id, expiresAt: new Date(Date.now() + 3600000) } });
  r = await call('POST', '/api/auth/activate', { email: mail('pending'), locale: 'fr' });
  const pendNow = await prisma.accountActivationToken.findMany({ where: { userId: users.pending.id } });
  check('RESEND a pending account gets a fresh link and the old one dies', r.status === 200 && pendNow.length === 2 && pendNow.find((t) => t.id === pend1.id).used === true && pendNow.some((t) => !t.used));
  const resIp = ip();
  let s429 = false;
  for (let i = 0; i < 8; i++) { const x = await call('POST', '/api/auth/activate', { email: `y${i}.${hex().slice(0, 6)}@test.local` }, { from: resIp }); if (x.status === 429) { s429 = true; break; } }
  check('RESEND per-address limit (429)', s429);
  r = await call('POST', '/api/auth/activate', { email: 5 });
  check('RESEND non-string email -> 400', r.status === 400, r.status);

  // ---- staff-created accounts: strong, generated, must be changed
  const ownerCookie = (await login(mail('owner'), PW)).token;
  const created = [];
  for (const [path, body] of [['/api/students', { name: 'P4 S1', email: mail('gen1') }], ['/api/students', { name: 'P4 S2', email: mail('gen2') }], ['/api/teachers', { name: 'P4 T1', email: mail('gen3'), university: 'U' }], ['/api/ambassadors', { name: 'P4 A1', email: mail('gen4') }]]) {
    r = await call('POST', path, body, { cookie: ownerCookie });
    created.push(r);
    check(`GEN ${path} account is created (201)`, r.status === 201, `${r.status} ${JSON.stringify(r.json).slice(0, 100)}`);
  }
  const pws = created.map((c) => c.json?.tempPassword);
  check('GEN generated passwords are 14 chars with upper, lower, digit and symbol', pws.every((p) => p && p.length === 14 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p) && /[!@#$%*?]/.test(p)), JSON.stringify(pws));
  check('GEN no two generated passwords match, none use the old Stu/Prof/Amb pattern', new Set(pws).size === pws.length && pws.every((p) => !/^(Stu|Prof|Amb)\d{4}!$/.test(p)));
  const dbGen = await prisma.user.findMany({ where: { email: { in: [mail('gen1'), mail('gen3'), mail('gen4')] } } });
  check('GEN these accounts are flagged mustChangePassword', dbGen.length === 3 && dbGen.every((u) => u.mustChangePassword === true));
  r = await login(mail('gen1'), pws[0]);
  check('GEN the generated password logs in and /me reports mustChangePassword', r.status === 200 && r.json.user.mustChangePassword === true && (await me(r.token)).json?.user?.mustChangePassword === true, JSON.stringify(r.json).slice(0, 120));
  const gateCookie = r.token;
  r = await call('GET', '/api/enrollments', undefined, { cookie: gateCookie });
  check('MUST while the temporary password is unchanged, protected routes answer 403 MUST_CHANGE_PASSWORD', r.status === 403 && r.json?.code === 'MUST_CHANGE_PASSWORD', `${r.status} ${JSON.stringify(r.json)}`);
  r = await call('POST', '/api/posts', { title: 't', content: 'c' }, { cookie: gateCookie });
  check('MUST the gate also covers write routes', r.status === 403, r.status);
  check('MUST /me and logout stay reachable', (await me(gateCookie)).status === 200);
  r = await login(mail('gen1'), pws[0]);
  r = await call('POST', '/api/account/change-password', { currentPassword: pws[0], newPassword: 'Mine-for-good-77' }, { cookie: r.token });
  check('GEN changing it clears the flag', r.status === 200 && (await prisma.user.findUnique({ where: { email: mail('gen1') } })).mustChangePassword === false);
  r = await call('GET', '/api/enrollments', undefined, { cookie: r.token });
  check('MUST after the change the account works normally (not 403)', r.status !== 403, r.status);
  r = await call('POST', '/api/students', { name: 'P4 S3', email: mail('gen5'), password: 'abc123' }, { cookie: ownerCookie });
  check('GEN a weak staff-typed password is refused (400), not silently replaced', r.status === 400 && !(await prisma.user.findUnique({ where: { email: mail('gen5') } })), `${r.status} ${JSON.stringify(r.json).slice(0, 100)}`);
  r = await call('POST', '/api/students', { name: 'P4 S3', email: mail('gen5'), password: '' }, { cookie: ownerCookie });
  check('GEN an empty password still gets a generated one', r.status === 201 && r.json.tempPassword.length === 14, JSON.stringify(r.json).slice(0, 100));
  check('GEN create responses never include the token version', !('tokenVersion' in (created[2].json?.user || {})) && !('tokenVersion' in (created[3].json?.user || {})));
  r = await call('POST', '/api/students', { name: 'P4 S4', email: mail('gen6'), password: 'Chosen-by-staff-1' }, { cookie: ownerCookie });
  check('GEN a strong staff-typed password is kept, but the account must still change it', r.status === 201 && r.json.tempPassword === 'Chosen-by-staff-1' && (await prisma.user.findUnique({ where: { email: mail('gen6') } })).mustChangePassword === true);
  r = await call('POST', '/api/admin/staff', { name: 'P4 Staff', email: mail('staffweak'), password: 'abc1234', role: 'ADMIN', adminRole: 'COMMERCIAL' }, { cookie: ownerCookie });
  check('GEN staff account with a weak password -> 400', r.status === 400, `${r.status} ${JSON.stringify(r.json)}`);
  r = await call('POST', '/api/admin/staff', { name: 'P4 Staff', email: mail('staffok'), password: 'Staff-pass-2026!', role: 'ADMIN', adminRole: 'COMMERCIAL' }, { cookie: ownerCookie });
  check('GEN staff account with a strong password -> 201, flagged', r.status === 201 && (await prisma.user.findUnique({ where: { email: mail('staffok') } }))?.mustChangePassword === true, `${r.status} ${JSON.stringify(r.json).slice(0, 100)}`);

  // ---- review fixes
  const stale2 = await prisma.accountActivationToken.create({ data: { token: hex(), userId: users.pending.id, expiresAt: new Date(Date.now() + 3600000), used: true } });
  r = await call('GET', `/api/auth/activate?token=${stale2.token}`);
  check('REV a link replaced by a resend does NOT claim an inactive account is active (410)', r.status === 410 && !r.token && !r.json?.alreadyVerified, `${r.status} ${JSON.stringify(r.json)}`);
  await mkUser('hijacked', { isVerified: false });
  const hijackTok = hex();
  await prisma.passwordResetToken.create({ data: { token: hijackTok, userId: users.hijacked.id, expiresAt: new Date(Date.now() + 20 * 60000) } });
  r = await call('POST', '/api/auth/reset-password', { token: hijackTok, newPassword: 'Owner-took-it-back-1' });
  check('REV the mailbox owner can take back an address someone else pre-registered (reset verifies and replaces the password)', r.status === 200 && (await prisma.user.findUnique({ where: { id: users.hijacked.id } })).isVerified === true && (await login(mail('hijacked'), PW)).status === 401 && (await login(mail('hijacked'), 'Owner-took-it-back-1')).status === 200);
  const unknownMail = `ghost.${hex().slice(0, 8)}@test.local`;
  for (let i = 0; i < 3; i++) await login(unknownMail, 'nope');
  check('REV failed logins for unknown emails create no database rows', (await prisma.loginAttempt.count({ where: { identifier: { startsWith: unknownMail } } })) === 0);
  await mkUser('a_b');
  await mkUser('aXb');
  await prisma.loginAttempt.create({ data: { identifier: `${mail('a_b')}|1.1.1.1`, attempts: 2 } });
  await prisma.loginAttempt.create({ data: { identifier: `${mail('aXb')}|1.1.1.1`, attempts: 2 } });
  const wild = hex();
  await prisma.passwordResetToken.create({ data: { token: wild, userId: users.a_b.id, expiresAt: new Date(Date.now() + 20 * 60000) } });
  await call('POST', '/api/auth/reset-password', { token: wild, newPassword: 'Wildcard-test-123' });
  check('REV clearing lockouts after a reset treats _ literally (does not touch a look-alike account)', (await prisma.loginAttempt.count({ where: { identifier: `${mail('a_b')}|1.1.1.1` } })) === 0 && (await prisma.loginAttempt.count({ where: { identifier: `${mail('aXb')}|1.1.1.1` } })) === 1);
  const frFor = `fr.${hex().slice(0, 6)}@test.local`;
  r = await call('POST', '/api/auth/forgot-password', { email: mail('student'), locale: 'fr' });
  check('REV forgot-password accepts a locale', r.status === 200, r.status);

  // ---- the third-party sign-in route is gone
  r = await call('POST', '/api/auth/google/session', { session_id: 'x' });
  check('GOOGLE the third-party session route no longer exists', r.status === 404 || r.status === 405, r.status);
  check('GOOGLE a session cookie alone grants nothing', !(await me('dz_session_token=anything')).json?.user);

  // ---- seeding: explicit, no hardcoded accounts
  const env = { ...process.env, DATABASE_URL: process.env.DATABASE_URL, DIRECT_URL: process.env.DATABASE_URL };
  const seed = (extra) => spawnSync('node', ['./node_modules/tsx/dist/cli.mjs', 'prisma/seed.ts'], { cwd: FE, env: { ...env, ...extra }, encoding: 'utf8', timeout: 120000 });
  let s = seed({ ADMIN_EMAIL: '', ADMIN_PASSWORD: '' });
  check('SEED without ADMIN_* creates no owner account and says so', s.status === 0 && /no owner account was created/.test(s.stdout), `${s.status} ${s.stdout} ${s.stderr}`.slice(0, 200));
  s = seed({ ADMIN_EMAIL: mail('seeded'), ADMIN_PASSWORD: '1234' });
  check('SEED refuses a weak ADMIN_PASSWORD', s.status !== 0 && /ADMIN_PASSWORD rejected/.test(s.stderr), `${s.status} ${s.stderr}`.slice(0, 200));
  s = seed({ ADMIN_EMAIL: mail('seeded'), ADMIN_PASSWORD: 'Owner-seed-pass-9' });
  const seeded = await prisma.user.findUnique({ where: { email: mail('seeded') } });
  check('SEED with strong ADMIN_* creates the owner, flagged to change the password', s.status === 0 && seeded?.role === 'OWNER' && seeded.mustChangePassword === true && seeded.isVerified === true && seeded.phone === null, `${s.status} ${s.stderr}`.slice(0, 200));
  s = seed({ ADMIN_EMAIL: mail('seeded'), ADMIN_PASSWORD: 'Different-pass-1' });
  check('SEED run twice leaves the existing owner unchanged', s.status === 0 && /already exists/.test(s.stdout) && (await bcrypt.compare('Owner-seed-pass-9', (await prisma.user.findUnique({ where: { email: mail('seeded') } })).passwordHash)), `${s.stdout}`.slice(0, 200));
  const hardcoded = await prisma.user.count({ where: { email: { in: ['general.admin@dzprime.academy', 'commercial@dzprime.academy'] }, createdAt: { gt: new Date(Date.now() - 600000) } } });
  check('SEED no hardcoded demo staff accounts are created any more', hardcoded === 0, String(hardcoded));
  check('SEED request paths no longer create accounts (ensureSeeded via /api/courses)', (await call('GET', '/api/courses')).status === 200 && (await prisma.user.count({ where: { email: { in: ['general.admin@dzprime.academy', 'commercial@dzprime.academy'] }, createdAt: { gt: new Date(Date.now() - 600000) } } })) === 0);
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
