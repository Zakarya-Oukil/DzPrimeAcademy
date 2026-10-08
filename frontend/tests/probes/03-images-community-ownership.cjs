// Regression probes against a RUNNING dev server and a THROWAWAY local database. See tests/probes/README.md.
// Phase 3 probes (images, community, teacher ownership). Throwaway DB only (localhost:55432) and a local
// stand-in for Supabase Storage on :54999 (the dev server's .env.local points SUPABASE_URL at it).
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
const prisma = new PrismaClient();
const PW = 'P3-' + crypto.randomBytes(9).toString('hex');
const TAG = 'p3probe';
const mail = (k) => `${TAG}.${k.toLowerCase()}@test.local`;
const rnd = () => Math.floor(Math.random() * 250) + 1;

const ROLES = {
  owner: { role: 'OWNER' },
  commercial: { role: 'ADMIN', adminRole: 'COMMERCIAL' },
  finance: { role: 'ADMIN', adminRole: 'FINANCE' },
  moderator: { role: 'MODERATOR', adminRole: 'MODERATOR' },
  teacher: { role: 'TEACHER' },
  teacher2: { role: 'TEACHER' },
  ambassador: { role: 'AMBASSADOR' },
  ambassador2: { role: 'AMBASSADOR' },
  free: { role: 'STUDENT_FREE' },
  paid: { role: 'STUDENT_PAID' },
  paid2: { role: 'STUDENT_PAID' },
};
const users = {};
const jars = {};
let pass = 0, fail = 0;
const results = [];
function check(name, ok, detail = '') {
  (ok ? pass++ : fail++);
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + detail}`);
}

async function call(who, method, path, body, ip) {
  const headers = { 'content-type': 'application/json', 'x-forwarded-for': ip || `10.${rnd()}.${rnd()}.${rnd()}` };
  if (who && jars[who]) headers.cookie = jars[who];
  const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body), redirect: 'manual' });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

// ---- stand-in for Supabase Storage: only the signed-upload endpoint the app uses
const stubCalls = [];
const stub = http.createServer((rq, rs) => {
  let data = '';
  rq.on('data', (c) => (data += c));
  rq.on('end', () => {
    stubCalls.push({ url: rq.url, auth: rq.headers.authorization, method: rq.method });
    const m = rq.url.match(/^\/storage\/v1\/object\/upload\/sign\/([^/]+)\/(.+)$/);
    if (rq.method === 'POST' && m && rq.headers.authorization === 'Bearer test-service-key') {
      rs.writeHead(200, { 'content-type': 'application/json' });
      return rs.end(JSON.stringify({ url: `/object/upload/sign/${m[1]}/${m[2]}?token=tok123` }));
    }
    rs.writeHead(401, { 'content-type': 'application/json' });
    rs.end('{"error":"unauthorized"}');
  });
});

async function cleanup() {
  const us = await prisma.user.findMany({ where: { email: { startsWith: TAG + '.' } }, select: { id: true } });
  const ids = us.map((u) => u.id);
  await prisma.post.deleteMany({ where: { authorId: { in: ids } } });
  await prisma.liveSession.deleteMany({ where: { OR: [{ title: { startsWith: 'P3PROBE' } }, { teacherId: { in: ids } }] } });
  await prisma.course.deleteMany({ where: { titleAr: { startsWith: 'P3PROBE' } } });
  await prisma.bundle.deleteMany({ where: { titleAr: { startsWith: 'P3PROBE' } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: TAG + '.' } } });
}

async function setup() {
  await cleanup();
  const hash = await bcrypt.hash(PW, 8);
  let n = 0;
  for (const [k, def] of Object.entries(ROLES)) {
    n++;
    users[k] = await prisma.user.create({
      data: { email: mail(k), name: `P3 ${k} ${n}`, passwordHash: hash, isVerified: true, role: def.role, adminRole: def.adminRole || null, studentCardId: `DZ-ZZZ-16-P3${String(100 + n)}`, wilayaCode: 16 },
    });
  }
  for (const k of Object.keys(ROLES)) {
    const r = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: mail(k), password: PW }) });
    const m = (r.headers.get('set-cookie') || '').match(/dz_token=[^;]+/);
    if (!m) throw new Error(`login failed for ${k}: ${r.status}`);
    jars[k] = m[0];
  }
}

const sign = (who, kind, extra = {}) => call(who, 'POST', '/api/uploads/image', { kind, contentType: 'image/webp', size: 100000, ...extra });

async function run() {
  await new Promise((r) => stub.listen(54999, r));
  await setup();
  const S = users;
  let r;

  // ---- uploads
  r = await call(null, 'POST', '/api/uploads/image', { kind: 'course', contentType: 'image/webp', size: 1000 });
  check('UP anonymous cannot upload (401)', r.status === 401, r.status);
  for (const [who, kind, code] of [['free', 'course', 403], ['free', 'post', 403], ['paid', 'post', 403], ['teacher', 'bundle', 403], ['teacher', 'landing', 403], ['commercial', 'landing', 403], ['moderator', 'bundle', 403], ['finance', 'course', 403]]) {
    r = await sign(who, kind);
    check(`UP ${who} cannot upload ${kind} (${code})`, r.status === code, r.status);
  }
  const tCourse = await sign('teacher', 'course');
  check('UP teacher may upload a course image', tCourse.status === 200 && tCourse.json?.uploadUrl?.startsWith(STUB + '/storage/v1/object/upload/sign/dz-images/course/' + S.teacher.id + '/'), JSON.stringify(tCourse.json));
  check('UP signed URL carries a one-time token', /\?token=tok123$/.test(tCourse.json?.uploadUrl || ''));
  check('UP the storage key stayed on the server (sent as Bearer to storage)', stubCalls.some((c) => c.auth === 'Bearer test-service-key') && !JSON.stringify(tCourse.json).includes('test-service-key'));
  check('UP public URL points at our bucket and kind folder', (tCourse.json?.publicUrl || '').startsWith(STUB + '/storage/v1/object/public/dz-images/course/'), tCourse.json?.publicUrl);
  r = await sign('commercial', 'bundle');
  check('UP commercial may upload a bundle image', r.status === 200, r.status);
  const bundleImg = r.json?.publicUrl;
  r = await sign('owner', 'landing');
  check('UP owner may upload a landing image', r.status === 200, r.status);
  r = await sign('ambassador', 'post');
  check('UP ambassador may upload a post image', r.status === 200, r.status);
  r = await sign('teacher', 'course', { contentType: 'image/png' });
  check('UP png is refused (WebP only)', r.status === 400, r.status);
  r = await sign('teacher', 'course', { contentType: 'image/svg+xml' });
  check('UP svg is refused', r.status === 400, r.status);
  r = await sign('teacher', 'course', { size: 3 * 1024 * 1024 });
  check('UP 3MB is refused (limit 2MB)', r.status === 400, r.status);
  r = await sign('teacher', 'course', { size: 0 });
  check('UP size 0 refused', r.status === 400, r.status);
  r = await sign('teacher', 'course', { size: 'big' });
  check('UP non-numeric size refused', r.status === 400, r.status);
  r = await sign('teacher', 'avatar');
  check('UP unknown kind refused', r.status === 400, r.status);
  let got429 = false;
  for (let i = 0; i < 35; i++) { const x = await sign('ambassador2', 'post'); if (x.status === 429) { got429 = true; break; } }
  check('UP per-user upload rate limit (429)', got429);
  r = await call('commercial', 'POST', '/api/uploads/image', '{bad');
  check('UP malformed body -> 400', r.status === 400, r.status);

  // ---- image URLs are only accepted when they are ours
  const good = tCourse.json.publicUrl;
  const mk = (extra, who = 'teacher') => call(who, 'POST', '/api/courses', { titleAr: 'P3PROBE c', ...extra });
  r = await mk({ imageUrl: good });
  const ownCourse = r.json;
  check('IMG course with our uploaded image -> 201 and stored', r.status === 201 && ownCourse.imageUrl === good, JSON.stringify(r.json));
  for (const [label, url] of [['external https host', 'https://evil.example/x.png'], ['javascript:', 'javascript:alert(1)'], ['data: URI', 'data:image/png;base64,AAAA'], ['http://', 'http://example.com/a.png'], ['wrong kind folder', bundleImg], ['path traversal', good.replace('/course/', '/course/../bundle/')], ['svg with script', 'https://evil.example/a.svg']]) {
    r = await mk({ imageUrl: url });
    check(`IMG course rejects ${label} (400)`, r.status === 400, `${r.status} ${JSON.stringify(r.json)}`);
  }
  for (const [label, url] of [['percent-encoded dots', good.replace('/course/', '/course/%2e%2e/')], ['mixed encoded dots', good.replace('/course/', '/course/.%2e/')], ['query string', good + '?x=1'], ['fragment', good + '#x'], ['extra path segment', good.replace('.webp', '/x.webp')], ['non-webp extension', good.replace('.webp', '.html')], ['uppercase uuid with spaces', good.replace('.webp', ' .webp')]]) {
    r = await mk({ imageUrl: url });
    check(`IMG strict path check rejects ${label} (400)`, r.status === 400, `${r.status}`);
  }
  r = await call('commercial', 'POST', '/api/bundles', { titleAr: 'P3PROBE b', descriptionAr: 'd', originalPriceDzd: 100, currentPriceDzd: 80, imageUrl: bundleImg });
  const bundle = r.json;
  check('IMG bundle with our image -> 201 and stored', r.status === 201 && bundle.imageUrl === bundleImg, JSON.stringify(r.json));
  r = await call('commercial', 'PUT', `/api/bundles/${bundle.id}`, { imageUrl: 'https://evil.example/b.png' });
  check('IMG bundle update rejects a foreign URL (400)', r.status === 400, r.status);
  r = await call('commercial', 'PUT', `/api/bundles/${bundle.id}`, { imageUrl: null });
  check('IMG bundle image can be cleared', r.status === 200 && r.json.imageUrl === null, JSON.stringify(r.json));
  r = await call('commercial', 'POST', '/api/bundles', { titleAr: 'P3PROBE b2', descriptionAr: 'd', originalPriceDzd: 100, currentPriceDzd: 80, imageUrl: good });
  check('IMG bundle rejects a course-folder image (400)', r.status === 400, r.status);
  r = await fetch(`${BASE}/_next/image?url=${encodeURIComponent('https://evil.example/a.png')}&w=64&q=75`);
  check('IMG next/image no longer proxies arbitrary hosts', r.status === 400, r.status);

  // ---- D1: teachers manage their own courses only (by teacherId)
  r = await call('teacher', 'POST', '/api/courses', { titleAr: 'P3PROBE own', priceDzd: 5000, teacherId: S.teacher2.id, teacherName: 'Someone Else', rating: 1 });
  const c1 = r.json;
  check('D1 teacher creates a course owned by themselves', r.status === 201 && c1.teacherId === S.teacher.id && c1.teacherName === S.teacher.name, JSON.stringify(r.json));
  check('D1 teacher cannot set a price (starts free)', c1.priceDzd === 0 && !('rating' in c1));
  for (const who of ['free', 'paid', 'moderator', 'finance', 'ambassador']) {
    r = await call(who, 'POST', '/api/courses', { titleAr: 'P3PROBE nope' });
    check(`D1 ${who} cannot create a course (403)`, r.status === 403, r.status);
  }
  r = await call(null, 'POST', '/api/courses', { titleAr: 'P3PROBE nope' });
  check('D1 anonymous cannot create a course (401)', r.status === 401, r.status);
  r = await call('teacher2', 'PUT', `/api/courses/${c1.id}`, { titleAr: 'P3PROBE hijack' });
  check('D1 another teacher cannot edit it (403)', r.status === 403, r.status);
  r = await call('teacher2', 'DELETE', `/api/courses/${c1.id}`);
  check('D1 another teacher cannot delete it (403)', r.status === 403, r.status);
  await prisma.user.update({ where: { id: S.teacher2.id }, data: { name: S.teacher.name } });
  r = await call('teacher2', 'PUT', `/api/courses/${c1.id}`, { titleAr: 'P3PROBE hijack by name' });
  check('D1 copying the display name does not grant access (403)', r.status === 403, r.status);
  r = await call('teacher', 'PUT', `/api/courses/${c1.id}`, { titleAr: 'P3PROBE own edited', priceDzd: 99999, teacherName: 'X', description: 'hello' });
  const c1b = await prisma.course.findUnique({ where: { id: c1.id } });
  check('D1 owner edits content (200)', r.status === 200 && c1b.titleAr === 'P3PROBE own edited' && c1b.description === 'hello', r.status);
  check('D1 owner cannot change price or teacherName', c1b.priceDzd === 0 && c1b.teacherName === S.teacher.name, `${c1b.priceDzd} ${c1b.teacherName}`);
  r = await call('commercial', 'PUT', `/api/courses/${c1.id}`, { priceDzd: 2500 });
  check('D1 staff can price any course', r.status === 200 && (await prisma.course.findUnique({ where: { id: c1.id } })).priceDzd === 2500);
  r = await call('commercial', 'PUT', '/api/courses/nope', { priceDzd: 1 });
  check('D1 unknown course -> 404, not 500', r.status === 404, r.status);
  await prisma.enrollment.create({ data: { studentId: S.paid.id, courseId: c1.id, courseTitle: 'x', teacherName: 'T' } });
  r = await call('teacher', 'DELETE', `/api/courses/${c1.id}`);
  check('D1 teacher cannot delete a course that has students (409)', r.status === 409, r.status);
  r = await call('commercial', 'DELETE', `/api/courses/${c1.id}`);
  check('D1 staff can delete it (200)', r.status === 200, r.status);
  r = await call('teacher', 'POST', '/api/courses', { titleAr: 'P3PROBE empty' });
  const c2 = r.json;
  r = await call('teacher', 'DELETE', `/api/courses/${c2.id}`);
  check('D1 teacher deletes own empty course (200)', r.status === 200, r.status);

  // sessions
  const future = new Date(Date.now() + 7 * 86400000).toISOString();
  r = await call('teacher', 'POST', '/api/courses', { titleAr: 'P3PROBE sessions course' });
  const sc = r.json;
  r = await call('teacher2', 'POST', '/api/sessions', { title: 'P3PROBE s-other', scheduledAt: future, courseId: sc.id });
  check('D1 teacher cannot schedule a session on another teacher course (403)', r.status === 403, r.status);
  r = await call('teacher', 'POST', '/api/sessions', { title: 'P3PROBE s1', scheduledAt: future, courseId: sc.id, teacherId: S.teacher2.id, teacherName: 'Fake' });
  const s1 = r.json;
  check('D1 teacher schedules a session for themselves (teacherId forced)', r.status === 201 && s1.teacherId === S.teacher.id && s1.teacherName === S.teacher.name, JSON.stringify(r.json));
  r = await call('teacher2', 'PUT', `/api/sessions/${s1.id}`, { title: 'P3PROBE hijack' });
  check('D1 another teacher cannot edit the session (403)', r.status === 403, r.status);
  r = await call('teacher2', 'DELETE', `/api/sessions/${s1.id}`);
  check('D1 another teacher cannot delete the session (403)', r.status === 403, r.status);
  r = await call('teacher', 'PUT', `/api/sessions/${s1.id}`, { title: 'P3PROBE s1 edited', durationMinutes: 90 });
  check('D1 owner edits own session', r.status === 200 && r.json.title === 'P3PROBE s1 edited', r.status);
  for (const bad of ['javascript:alert(1)', 'http://insecure.example/m', 'not a url']) {
    r = await call('teacher', 'PUT', `/api/sessions/${s1.id}`, { meetUrl: bad });
    check(`D1 session meetUrl rejects ${bad.slice(0, 18)} (400)`, r.status === 400, r.status);
  }
  r = await call('teacher', 'PUT', `/api/sessions/${s1.id}`, { meetUrl: 'https://meet.google.com/abc-defg-hij' });
  check('D1 https meet link accepted', r.status === 200, r.status);
  r = await call('teacher', 'POST', '/api/sessions', { title: 'P3PROBE past', scheduledAt: '2020-01-01' });
  check('D1 past session -> 400', r.status === 400, r.status);
  r = await call('free', 'POST', '/api/sessions', { title: 'P3PROBE nope', scheduledAt: future });
  check('D1 student cannot schedule a session (403)', r.status === 403, r.status);
  r = await call('teacher', 'DELETE', `/api/sessions/${s1.id}`);
  check('D1 owner deletes own session', r.status === 200, r.status);
  r = await call('commercial', 'DELETE', '/api/sessions/nope');
  check('D1 unknown session -> 404', r.status === 404, r.status);

  // ---- community lives in the database
  r = await call('free', 'POST', '/api/posts', { title: 'P3 t', content: 'c' });
  check('POST free student cannot publish (403)', r.status === 403, r.status);
  r = await call(null, 'POST', '/api/posts', { title: 'P3 t', content: 'c' });
  check('POST anonymous cannot publish (401)', r.status === 401, r.status);
  r = await call('teacher', 'POST', '/api/posts', { title: 'P3 public', content: 'hello world' });
  const pub = r.json?.post;
  check('POST teacher publishes (stored in the database)', r.status === 200 && !!pub?.id && (await prisma.post.count({ where: { id: pub.id } })) === 1, JSON.stringify(r.json));
  r = await call('teacher', 'POST', '/api/posts', { title: 'P3 private', content: 'members only', isPrivate: true });
  const priv = r.json?.post;
  check('POST private post saved', r.status === 200 && priv?.isPrivate === true);
  r = await call('ambassador', 'POST', '/api/posts', { title: 'P3 amb', content: 'c', type: 'EVENT', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', linkUrl: 'https://example.org/x' });
  check('POST ambassador publishes with https links', r.status === 200 && r.json.post.videoUrl.startsWith('https://'), JSON.stringify(r.json));
  for (const [label, body] of [['missing title', { content: 'c' }], ['missing content', { title: 't' }], ['bad type', { title: 't', content: 'c', type: 'HACK' }], ['javascript: video', { title: 't', content: 'c', videoUrl: 'javascript:alert(1)' }], ['http link', { title: 't', content: 'c', linkUrl: 'http://x.example' }], ['foreign image', { title: 't', content: 'c', imageUrls: ['https://evil.example/a.png'] }], ['wilaya 99', { title: 't', content: 'c', wilayaCode: 99 }], ['data: image', { title: 't', content: 'c', imageUrls: ['data:image/png;base64,AA'] }]]) {
    r = await call('teacher', 'POST', '/api/posts', body);
    check(`POST rejects ${label} (400)`, r.status === 400, r.status);
  }
  r = await call('teacher', 'POST', '/api/posts', { title: 'T'.repeat(900), content: 'C'.repeat(20000) });
  check('POST long text is truncated (title 200, content 5000)', r.status === 200 && r.json.post.title.length === 200 && r.json.post.content.length === 5000);
  r = await call('teacher', 'POST', '/api/posts', '{bad');
  check('POST malformed JSON -> 400', r.status === 400, r.status);

  const feed = async (who) => (await call(who, 'GET', '/api/posts?limit=100')).json;
  const has = (f, id) => (f?.posts || []).some((p) => p.id === id);
  let f = await feed(null);
  check('FEED anonymous sees the public post, not the private one', has(f, pub.id) && !has(f, priv.id));
  f = await feed('free');
  check('FEED free student does not see private posts', has(f, pub.id) && !has(f, priv.id));
  f = await feed('paid');
  check('FEED paid student sees private posts', has(f, priv.id));
  f = await feed('teacher');
  check('FEED author sees own private post', has(f, priv.id));
  check('FEED the old invented demo posts are gone', !(f.posts || []).some((p) => String(p.id).startsWith('post-video') || p.authorId === 'prof-mansouri'));
  r = await call(null, 'GET', `/api/posts?authorId=${S.teacher.id}`);
  check('FEED author filter works', r.json.posts.every((p) => p.authorId === S.teacher.id) && r.json.posts.length >= 1);
  r = await call(null, 'GET', '/api/posts?mediaType=video');
  check('FEED media filter works', r.json.posts.every((p) => !!p.videoUrl));

  // comments and likes on a private post: invisible to free students and visitors
  r = await call('free', 'GET', `/api/posts/${priv.id}/comments`);
  check('PRIV free student cannot read comments of a private post (404)', r.status === 404, r.status);
  r = await call('free', 'POST', `/api/posts/${priv.id}/comments`, { content: 'let me in' });
  check('PRIV free student cannot comment on a private post (404)', r.status === 404, r.status);
  r = await call('free', 'POST', `/api/posts/${priv.id}/like`, {});
  check('PRIV free student cannot like a private post (404)', r.status === 404, r.status);
  r = await call(null, 'GET', `/api/posts/${priv.id}/comments`);
  check('PRIV visitor cannot read a private post thread (404)', r.status === 404, r.status);
  r = await call('paid', 'POST', `/api/posts/${priv.id}/comments`, { content: 'thanks, very useful' });
  check('PRIV paid student can comment', r.status === 200 && r.json.comment.authorId === S.paid.id, r.status);

  r = await call(null, 'POST', `/api/posts/${pub.id}/comments`, { content: 'x' });
  check('COM anonymous cannot comment (401)', r.status === 401, r.status);
  r = await call('free', 'POST', `/api/posts/${pub.id}/comments`, { content: '   ' });
  check('COM empty comment -> 400', r.status === 400, r.status);
  r = await call('free', 'POST', `/api/posts/${pub.id}/comments`, { content: 'W'.repeat(5000) });
  check('COM long comment truncated to 1000 and stored in the database', r.status === 200 && r.json.comment.content.length === 1000 && (await prisma.postComment.count({ where: { postId: pub.id } })) === 1);
  r = await call('teacher', 'POST', `/api/posts/${pub.id}/comments`, { content: 'answer' });
  check('COM teacher comment is marked as verified teacher', r.status === 200 && r.json.comment.isVerifiedTeacher === true);
  r = await call(null, 'GET', `/api/posts/${pub.id}/comments`);
  check('COM thread is public for public posts', r.status === 200 && r.json.comments.length === 2);
  r = await call('free', 'POST', '/api/posts/nope/comments', { content: 'x' });
  check('COM unknown post -> 404', r.status === 404, r.status);

  r = await call(null, 'POST', `/api/posts/${pub.id}/like`, {});
  check('LIKE anonymous cannot like (401)', r.status === 401, r.status);
  r = await call('free', 'POST', `/api/posts/${pub.id}/like`, { isLiked: true });
  check('LIKE client claim is ignored: first click likes', r.status === 200 && r.json.liked === true && r.json.likesCount === 1, JSON.stringify(r.json));
  r = await call('free', 'POST', `/api/posts/${pub.id}/like`, {});
  check('LIKE second click un-likes (count 0)', r.json.liked === false && r.json.likesCount === 0, JSON.stringify(r.json));
  await Promise.all(Array.from({ length: 6 }, () => call('paid', 'POST', `/api/posts/${pub.id}/like`, {})));
  const likeRows = await prisma.postLike.count({ where: { postId: pub.id, userId: S.paid.id } });
  check('LIKE rapid double-clicks never create duplicates (0 or 1 row)', likeRows <= 1, String(likeRows));
  if (likeRows === 0) await call('paid', 'POST', `/api/posts/${pub.id}/like`, {});
  await call('paid2', 'POST', `/api/posts/${pub.id}/like`, {});
  f = await feed('paid');
  const mine = f.posts.find((p) => p.id === pub.id);
  check('LIKE count is shared across users (2)', mine.likesCount === 2, String(mine.likesCount));
  check('LIKE likedBy shows only the viewer, other user ids are not exposed', JSON.stringify(mine.likedBy) === JSON.stringify([S.paid.id]) && !JSON.stringify(mine).includes(S.paid2.id));
  f = await feed(null);
  check('LIKE anonymous feed has no likedBy ids', f.posts.find((p) => p.id === pub.id).likedBy.length === 0);

  // edit / delete ownership
  r = await call('teacher2', 'PUT', `/api/posts/${pub.id}`, { title: 'hijacked' });
  check('OWN another teacher cannot edit the post (403)', r.status === 403, r.status);
  r = await call('teacher2', 'DELETE', `/api/posts/${pub.id}`);
  check('OWN another teacher cannot delete the post (403)', r.status === 403, r.status);
  r = await call('free', 'DELETE', `/api/posts/${pub.id}`);
  check('OWN student cannot delete the post (403)', r.status === 403, r.status);
  r = await call(null, 'DELETE', `/api/posts/${pub.id}`);
  check('OWN anonymous cannot delete (401)', r.status === 401, r.status);
  r = await call('teacher', 'PUT', `/api/posts/${pub.id}`, { title: 'P3 public edited', content: 'edited body' });
  check('OWN author edits the post and it persists', r.status === 200 && (await prisma.post.findUnique({ where: { id: pub.id } })).title === 'P3 public edited', r.status);
  r = await call('teacher', 'PUT', `/api/posts/${pub.id}`, { videoUrl: 'javascript:alert(1)' });
  check('OWN edit still validates urls (400)', r.status === 400, r.status);
  r = await call('moderator', 'PUT', `/api/posts/${pub.id}`, { content: 'moderated' });
  check('OWN a moderator can edit any post', r.status === 200, r.status);
  for (const who of ['finance', 'commercial']) {
    r = await call(who, 'PUT', `/api/posts/${pub.id}`, { content: 'staff but not a moderator' });
    check(`OWN ${who} staff is not a moderator (403)`, r.status === 403, r.status);
    r = await call(who, 'DELETE', `/api/posts/${pub.id}`);
    check(`OWN ${who} staff cannot delete posts (403)`, r.status === 403, r.status);
  }
  r = await call('owner', 'PUT', `/api/posts/${pub.id}`, { eventDate: 'not-a-date' });
  check('OWN invalid eventDate -> 400', r.status === 400, r.status);
  r = await call('owner', 'PUT', `/api/posts/${pub.id}`, { eventDate: '2027-01-15T10:00:00Z' });
  check('OWN valid eventDate saved', r.status === 200 && r.json.post.eventDate?.startsWith('2027-01-15'), JSON.stringify(r.json).slice(0, 100));
  r = await call('paid', 'PUT', '/api/account', { avatar: 'data:image/svg+xml;base64,PHN2Zz4=' });
  check('AVATAR data: URI refused (400)', r.status === 400, r.status);
  r = await call('paid', 'PUT', '/api/account', { avatar: 'http://tracker.example/a.png' });
  check('AVATAR plain http refused (400)', r.status === 400, r.status);
  r = await call('paid', 'PUT', '/api/account', { avatar: 'https://lh3.googleusercontent.com/a/abc=s96' });
  check('AVATAR https accepted (200)', r.status === 200, r.status);
  r = await call('paid', 'PUT', '/api/account', { avatar: '' });
  check('AVATAR can be cleared', r.status === 200, r.status);
  let likes429 = false;
  for (let i = 0; i < 125; i++) { const x = await call('paid2', 'POST', `/api/posts/${pub.id}/like`, {}); if (x.status === 429) { likes429 = true; break; } }
  check('LIKE spam is rate limited (429)', likes429);
  r = await call('teacher', 'PUT', '/api/posts/nope', { title: 'x' });
  check('OWN unknown post -> 404', r.status === 404, r.status);
  r = await call('teacher', 'DELETE', `/api/posts/${pub.id}`);
  check('OWN author deletes the post', r.status === 200 && (await prisma.post.count({ where: { id: pub.id } })) === 0);
  check('OWN deleting a post removes its comments and likes (no orphans)', (await prisma.postComment.count({ where: { postId: pub.id } })) === 0 && (await prisma.postLike.count({ where: { postId: pub.id } })) === 0);
  r = await call('moderator', 'DELETE', `/api/posts/${priv.id}`);
  check('OWN a moderator can delete any post', r.status === 200, r.status);

  // ---- landing config
  r = await call('owner', 'PUT', '/api/settings/landing', { landingConfig: { hero: { image: 'data:image/png;base64,' + 'A'.repeat(100) }, keep: 'https://ok.example/a.png' } });
  let stored = (await prisma.platformSettings.findUnique({ where: { id: 'singleton' } })).landingConfig;
  check('LAND inline data image is dropped, not stored, and reported (never locks the editor)', r.status === 200 && r.json.removedInlineImages === 1 && stored.hero.image === '' && stored.keep === 'https://ok.example/a.png', JSON.stringify(r.json).slice(0, 120));
  r = await call('owner', 'PUT', '/api/settings/landing', { landingConfig: { items: [{ pic: 'DATA:image/png;base64,AAAA' }, { pic: 'da\nta:text/html,x' }, { pic: ' javascript:alert(1)' }, { pic: 'java\tscript:alert(1)' }] } });
  stored = (await prisma.platformSettings.findUnique({ where: { id: 'singleton' } })).landingConfig;
  check('LAND nested, case-mixed, newline/tab-split data: and javascript: URLs are all stripped', r.status === 200 && r.json.removedInlineImages === 4 && stored.items.every((i) => i.pic === ''), JSON.stringify(stored).slice(0, 160));
  r = await call('owner', 'PUT', '/api/settings/landing', { landingConfig: { blob: 'x'.repeat(250000) } });
  check('LAND oversized config refused (413)', r.status === 413, r.status);
  r = await call('owner', 'PUT', '/api/settings/landing', '{bad');
  check('LAND malformed JSON -> 400', r.status === 400, r.status);
  r = await call('owner', 'PUT', '/api/settings/landing', { landingConfig: { title: 'P3 probe title', image: bundleImg } });
  check('LAND normal config with a stored image URL saves (200)', r.status === 200, r.status);
  r = await call('finance', 'PUT', '/api/settings/landing', { landingConfig: {} });
  check('LAND finance still cannot edit the landing (403)', r.status === 403, r.status);
  r = await call(null, 'GET', '/api/settings/landing');
  const students = await prisma.user.count(); // the landing shows "N مستخدم": every account, nothing invented
  check('LAND public user count is the real count (no +50,000)', r.json?.realStats?.studentsCount === String(students), `${r.json?.realStats?.studentsCount} vs ${students}`);
  check('LAND no invented satisfaction rate (null, nothing measures it)', r.json?.realStats && r.json.realStats.satisfactionRate === null);
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
