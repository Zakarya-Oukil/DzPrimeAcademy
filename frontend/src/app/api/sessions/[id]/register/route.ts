import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';
import { guard } from '@/lib/http';

const STUDENT_ROLES = ['STUDENT_FREE', 'STUDENT_PAID'];
// ponytail: one platform-wide seat cap; a per-session capacity needs a new LiveSession column (schema change).
const MAX_SEATS = Number(process.env.SESSION_MAX_SEATS) > 0 ? Number(process.env.SESSION_MAX_SEATS) : 500;

async function GETHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(request);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;
  const { id } = await params;

  const session = await prisma.liveSession.findUnique({ where: { id } });
  if (!session) {
    return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 });
  }

  const isTeacherOfSession = user.role === 'TEACHER' && session.teacherId === user.id;
  const isStaff = user.role === 'ADMIN' || user.role === 'OWNER';

  if (isTeacherOfSession || isStaff) {
    // Teachers of this session and Admins can see the full registration roster
    const registrations = await prisma.sessionRegistration.findMany({
      where: { sessionId: id },
      orderBy: { registeredAt: 'asc' },
    });
    return NextResponse.json(registrations);
  }

  // Students can only see their own registration status for this session
  const myRegistration = await prisma.sessionRegistration.findMany({
    where: { sessionId: id, studentId: user.id },
  });
  return NextResponse.json(myRegistration);
}

async function POSTHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole(request, STUDENT_ROLES);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;
  const { id } = await params;

  const session = await prisma.liveSession.findUnique({ where: { id }, include: { course: { select: { priceDzd: true } } } });
  if (!session) {
    return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 });
  }

  if (session.status !== 'UPCOMING' && session.status !== 'LIVE') {
    return NextResponse.json({ error: 'التسجيل مغلق لهذه الحصة' }, { status: 409 });
  }

  // Tier: a session that belongs to a paid course is for Gold members or students enrolled in that course.
  if (session.courseId && (session.course?.priceDzd ?? 0) > 0 && user.role !== 'STUDENT_PAID') {
    const enrolled = await prisma.enrollment.findFirst({ where: { studentId: user.id, courseId: session.courseId }, select: { id: true } });
    if (!enrolled) {
      return NextResponse.json({ error: 'هذه الحصة مخصصة لمشتركي الدورة أو أعضاء Gold' }, { status: 403 });
    }
  }

  // Capacity (already-registered students may re-post without counting twice).
  const already = await prisma.sessionRegistration.findUnique({ where: { sessionId_studentId: { sessionId: id, studentId: user.id } }, select: { id: true } });
  if (!already && (await prisma.sessionRegistration.count({ where: { sessionId: id } })) >= MAX_SEATS) {
    return NextResponse.json({ error: 'اكتملت المقاعد لهذه الحصة' }, { status: 409 });
  }

  const registration = await prisma.sessionRegistration.upsert({
    where: { sessionId_studentId: { sessionId: id, studentId: user.id } },
    update: {},
    create: { sessionId: id, studentId: user.id, studentName: user.name },
  });

  return NextResponse.json(registration, { status: 201 });
}

async function DELETEHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole(request, STUDENT_ROLES);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;
  const { id } = await params;

  await prisma.sessionRegistration.deleteMany({ where: { sessionId: id, studentId: user.id } });
  return NextResponse.json({ success: true });
}

export const GET = guard(GETHandler);
export const POST = guard(POSTHandler);
export const DELETE = guard(DELETEHandler);
