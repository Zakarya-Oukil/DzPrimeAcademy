// Regression probes against a RUNNING dev server and a THROWAWAY local database. See tests/probes/README.md.
// Phase 6: video/image rules for courses and posts, real course ratings, admin-managed registration officers.
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
const PW = 'P6-' + crypto.randomBytes(9).toString('hex');
const TAG = 'p6probe';
const mail = (k) => `${TAG}.${k.toLowerCase()}@test.local`;
const rnd = () => Math.floor(Math.random() * 250) + 1;

const ROLES = {
  owner: { role: 'OWNER' },
  commercial: { role: 'ADMIN', adminRole: 'COMMERCIAL' },
  teacher: { role: 'TEACHER' },
  s1: { role: 'STUDENT_FREE' },
  s2: { role: 'STUDENT_FREE' },
  s3: { role: 'STUDENT_PAID' },
  outsider: { role: 'STUDENT_FREE' },
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

let officersBefore = null;
async function cleanup() {
  const us = await prisma.user.findMany({ where: { email: { startsWith: TAG + '.' } }, select: { id: true } });
  const ids = us.map((u) => u.id);
  await prisma.post.deleteMany({ where: { authorId: { in: ids } } });
  await prisma.course.deleteMany({ where: { titleAr: { startsWith: 'P6PROBE' } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: TAG + '.' } } });
}

async function setup() {
  await cleanup();
  const hash = await bcrypt.hash(PW, 8);
  for (const [k, def] of Object.entries(ROLES)) {
    users[k] = await prisma.user.create({
      data: { email: mail(k), name: `P6 ${k}`, passwordHash: hash, isVerified: true, role: def.role, adminRole: def.adminRole || null, studentCardId: `DZ-ZZZ-16-P6${crypto.randomBytes(3).toString('hex').toUpperCase()}`, wilayaCode: 16 },
    });
  }
  for (const k of Object.keys(ROLES)) {
    const r = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.${rnd()}.${rnd()}.${rnd()}` }, body: JSON.stringify({ email: mail(k), password: PW }) });
    const m = (r.headers.get('set-cookie') || '').match(/dz_token=[^;]+/);
    if (!m) throw new Error(`login failed for ${k}: ${r.status}`);
    jars[k] = m[0];
  }
}

const uuid = () => crypto.randomUUID();

async function run() {
  await new Promise((r) => stub.listen(54999, r));
  officersBefore = (await prisma.platformSettings.findUnique({ where: { id: 'singleton' } }))?.officers ?? null;
  await setup();
  const S = users;
  let r;

  // ---- video uploads are signed under video/<kind>/, with their own limits
  const MB = 1024 * 1024;
  r = await call('teacher', 'POST', '/api/uploads/image', { kind: 'course', contentType: 'video/mp4', size: 10 * MB });
  check('VID teacher gets a signed upload for a course video', r.status === 200 && r.json?.publicUrl?.startsWith(`${PUB}video/course/${S.teacher.id}/`) && r.json.publicUrl.endsWith('.mp4') && r.json.maxBytes === 50 * MB, JSON.stringify(r.json));
  r = await call('teacher', 'POST', '/api/uploads/image', { kind: 'post', contentType: 'video/webm', size: 5 * MB });
  check('VID teacher gets a signed upload for a post video (webm)', r.status === 200 && r.json?.publicUrl?.endsWith('.webm'), JSON.stringify(r.json));
  r = await call('teacher', 'POST', '/api/uploads/image', { kind: 'course', contentType: 'video/mp4', size: 51 * MB });
  check('VID over 50 MB is refused', r.status === 400, r.status);
  r = await call('teacher', 'POST', '/api/uploads/image', { kind: 'course', contentType: 'video/x-msvideo', size: MB });
  check('VID other formats are refused', r.status === 400, r.status);
  r = await call('commercial', 'POST', '/api/uploads/image', { kind: 'bundle', contentType: 'video/mp4', size: MB });
  check('VID bundles cannot take videos', r.status === 400, r.status);
  r = await call('s1', 'POST', '/api/uploads/image', { kind: 'post', contentType: 'video/mp4', size: MB });
  check('VID students cannot upload post videos', r.status === 403, r.status);
  r = await call('teacher', 'POST', '/api/uploads/image', { kind: 'post', contentType: 'image/webp', size: 3 * MB });
  check('VID images are still capped at 2 MB', r.status === 400, r.status);
  r = await call('teacher', 'POST', '/api/uploads/image', { kind: 'post', contentType: 'toString', size: MB });
  check('VID a prototype-key content type is refused', r.status === 400, r.status);

  // ---- posts: video link rules and up to 4 images
  const upVideo = `${PUB}video/post/${S.teacher.id}/${uuid()}.mp4`;
  const img = () => `${PUB}post/${S.teacher.id}/${uuid()}.webp`;
  const post = (extra) => call('teacher', 'POST', '/api/posts', { title: 'P6PROBE post', content: 'body', type: 'STUDY_TIP', ...extra });
  r = await post({ videoUrl: 'https://youtu.be/dQw4w9WgXcQ?t=5' });
  check('POST a YouTube link is stored in canonical form', r.status === 200 && r.json.post.videoUrl === 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', JSON.stringify(r.json));
  r = await post({ videoUrl: 'https://vimeo.com/123456789' });
  check('POST a Vimeo link is accepted', r.status === 200 && r.json.post.videoUrl === 'https://vimeo.com/123456789');
  r = await post({ videoUrl: upVideo });
  check('POST an uploaded video of ours is accepted', r.status === 200 && r.json.post.videoUrl === upVideo, JSON.stringify(r.json));
  for (const bad of ['https://evil.example/video.mp4', 'javascript:alert(1)', 'https://www.youtube.com.evil.example/watch?v=dQw4w9WgXcQ', `${PUB}video/course/${S.teacher.id}/${uuid()}.mp4`, `${PUB}video/post/${S.teacher.id}/../../x.mp4`]) {
    r = await post({ videoUrl: bad });
    check(`POST rejects video "${bad.slice(0, 50)}"`, r.status === 400, r.status);
  }
  r = await post({ imageUrls: [img(), img()] });
  check('POST two uploaded images are stored and returned', r.status === 200 && r.json.post.imageUrls.length === 2, JSON.stringify(r.json));
  const withImages = r.json?.post?.id;
  r = await post({ imageUrls: [img(), img(), img(), img(), img()] });
  check('POST more than 4 images is refused', r.status === 400, r.status);
  r = await post({ imageUrls: ['https://evil.example/a.webp'] });
  check('POST an image that was not uploaded through the platform is refused', r.status === 400, r.status);
  r = await post({ imageUrls: img() });
  check('POST imageUrls must be a list', r.status === 400, r.status);
  r = await call(null, 'GET', '/api/posts?mediaType=image&limit=100');
  check('POST the image filter finds posts that have images', r.status === 200 && r.json.posts.some((p) => p.id === withImages) && r.json.posts.every((p) => p.imageUrls.length > 0), r.status);
  if (withImages) {
    r = await call('teacher', 'PUT', `/api/posts/${withImages}`, { imageUrls: [] });
    check('POST the author can remove all images', r.status === 200 && r.json.post.imageUrls.length === 0, JSON.stringify(r.json));
  }

  // ---- courses: optional cover video
  r = await call('teacher', 'POST', '/api/courses', { titleAr: 'P6PROBE دورة', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
  const course = r.json;
  check('CRS a teacher can create a course with a video link', r.status === 201 && course.videoUrl === 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', JSON.stringify(r.json));
  r = await call('teacher', 'POST', '/api/courses', { titleAr: 'P6PROBE bad', videoUrl: 'https://evil.example/x' });
  check('CRS an arbitrary video URL is refused', r.status === 400, r.status);
  r = await call('teacher', 'PUT', `/api/courses/${course.id}`, { titleFr: 'Mon cours' });
  check('CRS editing other fields leaves the video untouched', r.status === 200 && r.json.videoUrl === 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', JSON.stringify(r.json));
  r = await call('teacher', 'PUT', `/api/courses/${course.id}`, { videoUrl: null });
  check('CRS the video can be removed', r.status === 200 && r.json.videoUrl === null, JSON.stringify(r.json));

  // ---- real ratings
  const listed = async () => (await call(null, 'GET', '/api/courses')).json.find((c) => c.id === course.id);
  let c0 = await listed();
  check('RATE a new course has no rating (no invented 5.0)', c0.rating === null && c0.ratingCount === 0, JSON.stringify(c0));
  for (const k of ['s1', 's2', 's3']) {
    await prisma.enrollment.create({ data: { studentId: S[k].id, courseId: course.id, courseTitle: course.titleAr, teacherName: course.teacherName } });
  }
  r = await call('outsider', 'POST', `/api/courses/${course.id}/reviews`, { stars: 5 });
  check('RATE a student who is not enrolled cannot rate (403)', r.status === 403, r.status);
  r = await call(null, 'POST', `/api/courses/${course.id}/reviews`, { stars: 5 });
  check('RATE a visitor cannot rate (401)', r.status === 401, r.status);
  for (const bad of [0, 6, 2.5, '5', null]) {
    r = await call('s1', 'POST', `/api/courses/${course.id}/reviews`, { stars: bad });
    check(`RATE stars=${JSON.stringify(bad)} is refused`, r.status === 400, r.status);
  }
  r = await call('s1', 'POST', `/api/courses/${course.id}/reviews`, { stars: 5 });
  check('RATE an enrolled student can rate and sees their vote', r.status === 200 && r.json.mine === 5 && r.json.rating === null && r.json.ratingCount === 1, JSON.stringify(r.json));
  await call('s2', 'POST', `/api/courses/${course.id}/reviews`, { stars: 4 });
  c0 = await listed();
  check('RATE with 2 votes the rating is still hidden', c0.rating === null && c0.ratingCount === 2, JSON.stringify(c0));
  await call('s3', 'POST', `/api/courses/${course.id}/reviews`, { stars: 3 });
  c0 = await listed();
  check('RATE with 3 votes the average is shown (4)', c0.rating === 4 && c0.ratingCount === 3, JSON.stringify(c0));
  r = await call('s1', 'POST', `/api/courses/${course.id}/reviews`, { stars: 1 });
  c0 = await listed();
  check('RATE rating again replaces the vote (one per student): (1+4+3)/3 = 2.7', r.status === 200 && c0.ratingCount === 3 && c0.rating === 2.7, JSON.stringify(c0));
  r = await call('s2', 'GET', `/api/courses/${course.id}/reviews`);
  check('RATE a student can read their own vote', r.status === 200 && r.json.mine === 4, JSON.stringify(r.json));
  r = await call('s1', 'DELETE', `/api/courses/${course.id}/reviews?studentId=${S.s2.id}`);
  check('RATE students cannot delete votes', r.status === 403, r.status);
  r = await call('commercial', 'DELETE', `/api/courses/${course.id}/reviews?studentId=${S.s2.id}`);
  c0 = await listed();
  check('RATE catalog staff can remove a vote; the rating hides again below 3', r.status === 200 && c0.ratingCount === 2 && c0.rating === null, JSON.stringify(c0));
  r = await call('commercial', 'DELETE', `/api/courses/${course.id}/reviews?studentId=${S.s2.id}`);
  check('RATE removing a vote that is gone answers 404, not 500', r.status === 404, r.status);
  r = await call(null, 'GET', '/api/courses/does-not-exist/reviews');
  check('RATE unknown course answers 404', r.status === 404, r.status);

  // ---- registration officers (admin-managed, settings JSON)
  const off = (o) => call('owner', 'PUT', '/api/settings', { officers: o });
  r = await off([{ name: 'P6 Officer A', whatsapp: '+213 550 12 34 56', telegram: 'https://t.me/a_user1', active: true }, { name: 'P6 Officer B', whatsapp: '213660000000', active: false }]);
  check('OFF the owner can save officers', r.status === 200, JSON.stringify(r.json));
  r = await call(null, 'GET', '/api/settings');
  const pub = r.json.officers;
  check('OFF visitors see only active officers, with numbers and handles cleaned', Array.isArray(pub) && pub.length === 1 && pub[0].name === 'P6 Officer A' && pub[0].whatsapp === '213550123456' && pub[0].telegram === 'a_user1', JSON.stringify(pub));
  r = await call('owner', 'GET', '/api/settings');
  check('OFF the admin editor receives every officer, inactive included', r.json.officers.length === 2, JSON.stringify(r.json.officers));
  r = await call('commercial', 'PUT', '/api/settings', { officers: [] });
  check('OFF staff without settings.manage cannot change officers (403)', r.status === 403, r.status);
  r = await call('s1', 'PUT', '/api/settings', { officers: [] });
  check('OFF students cannot change officers', r.status === 403, r.status);
  const bads = {
    'not a list': 'x',
    'no name': [{ name: '', whatsapp: '213550123456' }],
    'no contact': [{ name: 'X' }],
    'short phone': [{ name: 'X', whatsapp: '12345' }],
    'bad handle': [{ name: 'X', telegram: 'a b!' }],
    'script as handle': [{ name: 'X', telegram: 'javascript:alert(1)' }],
    'eleven officers': Array.from({ length: 11 }, (_, i) => ({ name: `O${i}`, telegram: `officer_${i}x` })),
  };
  for (const [label, val] of Object.entries(bads)) {
    r = await off(val);
    check(`OFF rejects: ${label}`, r.status === 400, r.status);
  }
  r = await call('owner', 'GET', '/api/settings');
  check('OFF rejected saves left the stored list unchanged', r.json.officers.length === 2);
  await call('owner', 'PUT', '/api/settings', { academicYear: '2025/2026' });
  r = await call('owner', 'GET', '/api/settings');
  check('OFF saving other settings does not wipe the officers', r.json.officers.length === 2);
}

run()
  .catch((e) => { fail++; results.push('FAIL  harness crashed -> ' + (e.stack || e)); })
  .finally(async () => {
    try {
      await cleanup();
      if (officersBefore === null) await prisma.$executeRaw`UPDATE "PlatformSettings" SET "officers" = NULL WHERE id = 'singleton'`;
      else await prisma.platformSettings.update({ where: { id: 'singleton' }, data: { officers: officersBefore } });
    } catch (e) { results.push('cleanup error: ' + e.message); }
    await prisma.$disconnect();
    stub.close();
    console.log(results.join('\n'));
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  });
