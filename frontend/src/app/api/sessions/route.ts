import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requireCatalogActor } from '@/lib/ownership';
import { getUserFromRequest } from '@/lib/auth';
import { hasAnyPermission } from '@/lib/rbac';
import { isHttpsUrl } from '@/lib/safeUrl';
import { guard } from '@/lib/http';

// The schedule is public; the join link is not. It is shown only to staff, the session's own teacher, and students
// who registered for that session (it used to be sent to every anonymous visitor).
async function GETHandler(request: NextRequest) {
  await ensureSeeded();
  const user = await getUserFromRequest(request);
  const sessions = await prisma.liveSession.findMany({ orderBy: { scheduledAt: 'asc' } });
  const sessionIds = sessions.map((s) => s.id);
  const registrations = await prisma.sessionRegistration.groupBy({
    by: ['sessionId'],
    where: { sessionId: { in: sessionIds } },
    _count: { id: true },
  });
  const countMap = new Map(registrations.map((r) => [r.sessionId, r._count.id]));

  const isStaff = !!user && hasAnyPermission(user, 'catalog.manage');
  const mine = user && !isStaff
    ? new Set((await prisma.sessionRegistration.findMany({ where: { studentId: user.id, sessionId: { in: sessionIds } }, select: { sessionId: true } })).map((r) => r.sessionId))
    : new Set<string>();

  return NextResponse.json(
    sessions.map((s) => ({
      ...s,
      meetUrl: isStaff || (user && s.teacherId === user.id) || mine.has(s.id) ? s.meetUrl : null,
      registrationsCount: countMap.get(s.id) || 0,
    }))
  );
}

async function POSTHandler(request: NextRequest) {
  const actor = await requireCatalogActor(request);
  if ('error' in actor) return actor.error;
  const { user, isStaff } = actor;

  await ensureSeeded();
  const body = (await request.json().catch(() => null)) ?? {};
  if (!body.title) return NextResponse.json({ error: 'عنوان الحصة مطلوب' }, { status: 400 });
  if (body.meetUrl && !isHttpsUrl(body.meetUrl)) return NextResponse.json({ error: 'رابط الحصة يجب أن يبدأ بـ https://' }, { status: 400 });

  const scheduledDate = new Date(body.scheduledAt);
  if (isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
    return NextResponse.json({ error: 'لا يمكن جدولة حصة في تاريخ ماضٍ' }, { status: 400 });
  }

  // A teacher can only schedule sessions for themselves (teacherId from the login, never from the request).
  let teacherId = isStaff ? body.teacherId || null : user.id;
  if (isStaff && teacherId && !(await prisma.user.findFirst({ where: { id: teacherId, role: 'TEACHER' }, select: { id: true } }))) {
    return NextResponse.json({ error: 'الأستاذ غير موجود' }, { status: 400 });
  }
  if (body.courseId) {
    const course = await prisma.course.findUnique({ where: { id: body.courseId }, select: { id: true, teacherId: true } });
    if (!course) return NextResponse.json({ error: 'المقرر غير موجود' }, { status: 400 });
    if (!isStaff && course.teacherId !== user.id) return NextResponse.json({ error: 'يمكنك جدولة حصص لمقرراتك فقط' }, { status: 403 });
  }
  const teacherName = isStaff ? body.teacherName || 'أستاذ معتمد DZ Prime' : user.name;
  if (isStaff && !teacherId && teacherName) {
    const matchedTeacher = await prisma.user.findFirst({ where: { name: teacherName, role: 'TEACHER' } });
    if (matchedTeacher) teacherId = matchedTeacher.id;
  }

  const session = await prisma.liveSession.create({
    data: {
      title: body.title,
      courseId: body.courseId || null,
      teacherId,
      teacherName,
      scheduledAt: scheduledDate,
      durationMinutes: body.durationMinutes ?? 60,
      platform: body.platform || 'GOOGLE_MEET',
      meetUrl: body.meetUrl || null,
      wilayaCode: body.wilayaCode ?? null,
      category: body.category || 'UNIVERSITY_LMD',
      status: 'UPCOMING',
    },
  });

  return NextResponse.json(session, { status: 201 });
}

export const GET = guard(GETHandler);
export const POST = guard(POSTHandler);
