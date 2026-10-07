import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { canManageUser } from '@/lib/rbac';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getUserFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
  }

  const { id } = await params;

  const student = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, adminRole: true, name: true },
  });

  if (!student) {
    return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 });
  }

  if (student.role !== 'STUDENT_FREE' && student.role !== 'STUDENT_PAID') {
    return NextResponse.json({ error: 'هذا الحساب ليس حساب طالب' }, { status: 400 });
  }

  const allowed = canManageUser(actor, student);
  if (!allowed) {
    return NextResponse.json(
      { error: 'ليس لديك الصلاحية لحذف هذا الطالب' },
      { status: 403 }
    );
  }

  await prisma.sessionRegistration.deleteMany({ where: { studentId: id } });
  await prisma.enrollment.deleteMany({ where: { studentId: id } });
  await prisma.subscription.deleteMany({ where: { userId: id } });
  await prisma.session.deleteMany({ where: { userId: id } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true, message: `تم حذف الطالب ${student.name} بنجاح` });
}
