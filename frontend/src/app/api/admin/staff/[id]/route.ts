import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requirePermission } from '@/lib/auth';
import { canManageUser, canAssignAdminRole, isAssignableAdminRole } from '@/lib/rbac';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission(request, 'staff.manage');
  if ('error' in authResult) return authResult.error;
  const actor = authResult.user;

  const { id } = await params;

  if (actor.id === id) {
    return NextResponse.json({ error: 'لا يمكنك حذف حسابك الخاص' }, { status: 400 });
  }

  await ensureSeeded();

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, adminRole: true, name: true },
  });

  if (!target) {
    return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
  }

  const allowed = canManageUser(actor, target);
  if (!allowed) {
    return NextResponse.json(
      { error: 'ليس لديك الصلاحية لحذف هذا المسؤول أو الموظف حسب التسلسل الهرمي' },
      { status: 403 }
    );
  }

  // Delete user and associated sessions/tokens
  await prisma.session.deleteMany({ where: { userId: id } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true, message: `تم حذف ${target.name} بنجاح` });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission(request, 'staff.manage');
  if ('error' in authResult) return authResult.error;
  const actor = authResult.user;

  const { id } = await params;

  await ensureSeeded();

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, adminRole: true, name: true },
  });

  if (!target) {
    return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
  }

  const allowed = canManageUser(actor, target);
  if (!allowed) {
    return NextResponse.json(
      { error: 'ليس لديك الصلاحية لتعديل بيانات هذا المسؤول' },
      { status: 403 }
    );
  }

  // This endpoint edits staff accounts only; students, teachers and ambassadors have their own.
  if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(target.role)) {
    return NextResponse.json({ error: 'هذا الحساب ليس حساباً إدارياً' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const { jobTitle, adminRole, phone, wilayaCode, wilayaName, bio } = body;

  if (adminRole !== undefined) {
    if (!isAssignableAdminRole(adminRole)) {
      return NextResponse.json({ error: 'دور إداري غير صالح' }, { status: 400 });
    }
    if (target.role === 'OWNER') {
      return NextResponse.json({ error: 'لا يمكن تغيير دور المالك' }, { status: 403 });
    }
    if (!canAssignAdminRole(actor, adminRole)) {
      return NextResponse.json(
        { error: 'لا يمكنك تعيين دور إداري أعلى من مستواك أو مساوٍ له' },
        { status: 403 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      jobTitle: jobTitle !== undefined ? (jobTitle ? String(jobTitle).trim() : null) : undefined,
      adminRole: adminRole !== undefined ? adminRole : undefined,
      role: adminRole !== undefined ? (adminRole === 'MODERATOR' ? 'MODERATOR' : 'ADMIN') : undefined,
      phone: phone !== undefined ? phone : undefined,
      wilayaCode: wilayaCode !== undefined ? (wilayaCode ? Number(wilayaCode) : null) : undefined,
      wilayaName: wilayaName !== undefined ? wilayaName : undefined,
      bio: bio !== undefined ? bio : undefined,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      jobTitle: true,
      adminRole: true,
      bio: true,
      phone: true,
      wilayaCode: true,
      wilayaName: true,
      studentCardId: true,
      isVerified: true,
    },
  });

  return NextResponse.json(updated);
}
