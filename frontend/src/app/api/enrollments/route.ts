import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requireRole } from '@/lib/auth';
import { hasAnyPermission } from '@/lib/rbac';

const STUDENT_ROLES = ['STUDENT_FREE', 'STUDENT_PAID'];

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, [...STUDENT_ROLES, 'OWNER', 'ADMIN', 'MODERATOR']);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;

  await ensureSeeded();
  const { searchParams } = new URL(request.url);
  const requestedId = searchParams.get('studentId');
  const studentId = requestedId && hasAnyPermission(user, 'users.manage') ? requestedId : user.id;

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(enrollments);
}

export async function POST(request: NextRequest) {
  const authResult = await requireRole(request, STUDENT_ROLES);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;

  const body = await request.json().catch(() => ({}));
  const course = typeof body.courseId === 'string' ? await prisma.course.findUnique({ where: { id: body.courseId } }) : null;
  if (!course) {
    return NextResponse.json({ error: 'المقرر غير موجود' }, { status: 404 });
  }

  // Priced courses are sold through an operation (POST /api/operations, COURSE_ENROLLMENT) that staff approve.
  if (course.priceDzd > 0) {
    return NextResponse.json({ error: 'هذا المقرر مدفوع: أرسل طلب التسجيل ليتم تأكيد الدفع' }, { status: 402 });
  }

  const existing = await prisma.enrollment.findFirst({ where: { studentId: user.id, courseId: course.id } });
  if (existing) {
    return NextResponse.json(existing, { status: 200 });
  }

  // Unique (studentId, courseId): a concurrent double click gets the existing row instead of a duplicate.
  const enrollment = await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: user.id, courseId: course.id } },
    update: {},
    create: {
      studentId: user.id,
      courseId: course.id,
      courseTitle: course.titleFr || course.titleAr,
      teacherName: course.teacherName,
      progressPercent: 0,
      remainingHours: 10,
    },
  });

  return NextResponse.json(enrollment, { status: 201 });
}
