import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';

const STUDENT_ROLES = ['STUDENT_FREE', 'STUDENT_PAID'];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole(request, STUDENT_ROLES);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;
  const { id } = await params;

  const session = await prisma.liveSession.findUnique({ where: { id } });
  if (!session) {
    return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 });
  }

  const registration = await prisma.sessionRegistration.upsert({
    where: { sessionId_studentId: { sessionId: id, studentId: user.id } },
    update: {},
    create: { sessionId: id, studentId: user.id, studentName: user.name },
  });

  return NextResponse.json(registration, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole(request, STUDENT_ROLES);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;
  const { id } = await params;

  await prisma.sessionRegistration.deleteMany({ where: { sessionId: id, studentId: user.id } });
  return NextResponse.json({ success: true });
}
