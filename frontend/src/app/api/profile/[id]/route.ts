import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { getUserFromRequest } from '@/lib/auth';
import { normalizeCardId } from '@/lib/cardId';
import { hasAnyPermission } from '@/lib/rbac';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeeded();
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
  }

  const requester = await getUserFromRequest(request);

  // Exact lookup only: by internal id, or by a well-formed card ID. Raw text is never used
  // as a pattern, so "%" / "_" cannot enumerate users.
  const cardId = normalizeCardId(id);
  const user = await prisma.user.findFirst({
    where: cardId ? { OR: [{ id }, { studentCardId: cardId }] } : { id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      jobTitle: true,
      adminRole: true,
      bio: true,
      facebook: true,
      instagram: true,
      linkedin: true,
      telegram: true,
      youtube: true,
      whatsapp: true,
      website: true,
      twitter: true,
      github: true,
      phone: true,
      wilayaCode: true,
      wilayaName: true,
      institutionName: true,
      track: true,
      specialty: true,
      academicYear: true,
      studentCardId: true,
      isVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
  }

  // Private contact details (email, phone) are visible only to the profile owner
  // and to staff who manage users. Everyone else gets the public profile.
  const isOwner = !!requester && requester.id === user.id;
  const canViewSensitiveInfo = isOwner || hasAnyPermission(requester, 'users.manage');
  const isStudent = user.role === 'STUDENT_FREE' || user.role === 'STUDENT_PAID';

  const { email, phone, ...publicFields } = user;
  const sanitizedUser = canViewSensitiveInfo ? user : publicFields;

  let teacherProfile = null;
  let courses: any[] = [];
  let sessions: any[] = [];
  let bundles: any[] = [];
  let ambassadorProfile = null;
  let enrollments: any[] = [];

  if (user.role === 'TEACHER') {
    // Public fields only: never the CCP account, payout data or hourly rate.
    teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      select: { university: true, specialty: true, hoursTaught: true, studentsCount: true },
    });

    courses = await prisma.course.findMany({
      where: { teacherId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    sessions = await prisma.liveSession.findMany({
      where: { teacherId: user.id },
      orderBy: { scheduledAt: 'desc' },
    });
    // Join links are for registered students and staff only.
    if (!canViewSensitiveInfo) sessions = sessions.map(({ meetUrl, ...rest }) => rest);

    bundles = await prisma.bundle.findMany({
      where: { isActive: true },
      take: 4,
      orderBy: { sortOrder: 'asc' },
    });
  } else if (user.role === 'AMBASSADOR') {
    // Public fields only; commission and payout data stay private.
    ambassadorProfile = await prisma.ambassadorProfile.findUnique({
      where: { userId: user.id },
      select: {
        wilayaNameAr: true,
        wilayaNameFr: true,
        institutionNameAr: true,
        institutionNameFr: true,
        specialtyName: true,
        promoCode: true,
        ratingAverage: true,
        ratingsCount: true,
      },
    });
  } else if (isStudent && canViewSensitiveInfo) {
    enrollments = await prisma.enrollment.findMany({
      where: { studentId: user.id },
      take: 6,
      orderBy: { createdAt: 'desc' },
    });
  }

  return NextResponse.json({
    user: sanitizedUser,
    teacherProfile,
    courses,
    sessions,
    bundles,
    ambassadorProfile,
    enrollments,
  });
}
