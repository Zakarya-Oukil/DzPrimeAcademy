import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { canManageUser } from '@/lib/rbac';
import { guard } from '@/lib/http';

async function DELETEHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requirePermission(request, 'users.manage');
  if ('error' in authResult) return authResult.error;

  const actor = authResult.user;
  const { id } = await params;
  const profile = await prisma.ambassadorProfile.findUnique({ where: { id } });
  if (!profile) {
    return NextResponse.json({ error: 'السفير غير موجود' }, { status: 404 });
  }

  const user = await prisma.user.findUnique({ where: { id: profile.userId } });

  if (user && !canManageUser(actor, user)) {
    return NextResponse.json(
      { error: 'ليس لديك الصلاحية لحذف هذا السفير وفق التسلسل الهرمي' },
      { status: 403 }
    );
  }

  await prisma.rating.deleteMany({ where: { ambassadorId: id } });
  await prisma.ambassadorProfile.delete({ where: { id } });
  if (user) {
    await prisma.sessionRegistration.deleteMany({ where: { studentId: user.id } }).catch(() => {});
    await prisma.enrollment.deleteMany({ where: { studentId: user.id } }).catch(() => {});
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  }

  return NextResponse.json({ success: true, message: 'تم حذف السفير بنجاح' });
}

export const DELETE = guard(DELETEHandler);
