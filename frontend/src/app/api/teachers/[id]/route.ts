import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { canManageUser, hasAnyPermission } from '@/lib/rbac';

// Pay-related fields (CCP, rate) need HR or finance; the rest is HR only.
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requirePermission(request, ['users.manage', 'finance.manage']);
  if ('error' in authResult) return authResult.error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  }

  const isHR = hasAnyPermission(authResult.user, 'users.manage');
  const optionalInt = (v: unknown) => (v === undefined ? undefined : Number.isInteger(Number(v)) && Number(v) >= 0 ? Number(v) : null);
  const hourlyRateDzd = optionalInt(body.hourlyRateDzd);
  const hoursTaught = optionalInt(body.hoursTaught);
  const studentsCount = optionalInt(body.studentsCount);
  if (hourlyRateDzd === null || hoursTaught === null || studentsCount === null) {
    return NextResponse.json({ error: 'قيمة رقمية غير صالحة' }, { status: 400 });
  }

  const existing = await prisma.teacherProfile.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'الأستاذ غير موجود' }, { status: 404 });
  }

  const profile = await prisma.teacherProfile.update({
    where: { id },
    data: {
      // HR-only fields
      university: isHR ? body.university : undefined,
      specialty: isHR ? body.specialty : undefined,
      hoursTaught: isHR ? hoursTaught : undefined,
      studentsCount: isHR ? studentsCount : undefined,
      // pay fields: HR or finance
      hourlyRateDzd,
      ccpAccount: body.ccpAccount,
      ccpCle: body.ccpCle,
    },
  });

  if (isHR && body.isVerified !== undefined) {
    await prisma.user.update({ where: { id: profile.userId }, data: { isVerified: Boolean(body.isVerified) } });
  }

  return NextResponse.json(profile);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requirePermission(request, 'users.manage');
  if ('error' in authResult) return authResult.error;

  const actor = authResult.user;
  const { id } = await params;
  const profile = await prisma.teacherProfile.findUnique({ where: { id } });
  if (!profile) {
    return NextResponse.json({ error: 'الأستاذ غير موجود' }, { status: 404 });
  }

  const user = await prisma.user.findUnique({ where: { id: profile.userId } });

  if (user && !canManageUser(actor, user)) {
    return NextResponse.json(
      { error: 'ليس لديك الصلاحية لحذف هذا الأستاذ وفق التسلسل الهرمي' },
      { status: 403 }
    );
  }

  await prisma.facultyPayout.deleteMany({ where: { teacherProfileId: id } });
  await prisma.teacherProfile.delete({ where: { id } });
  if (user) {
    await prisma.sessionRegistration.deleteMany({ where: { studentId: user.id } }).catch(() => {});
    await prisma.enrollment.deleteMany({ where: { studentId: user.id } }).catch(() => {});
    await prisma.session.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  }
  return NextResponse.json({ success: true, message: 'تم حذف الأستاذ بنجاح' });
}
