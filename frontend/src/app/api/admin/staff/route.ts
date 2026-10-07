import { NextRequest, NextResponse } from 'next/server';
import { generateCardId } from '@/lib/cardId';
import { prisma } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { hashPassword, requirePermission } from '@/lib/auth';
import { isSuperAdmin, isAssignableAdminRole, canAssignAdminRole } from '@/lib/rbac';
import { Role } from '@/types';

export async function GET(request: NextRequest) {
  const authResult = await requirePermission(request, 'staff.manage');
  if ('error' in authResult) return authResult.error;

  await ensureSeeded();

  // Find all users who are staff/admins (OWNER, ADMIN, MODERATOR or have adminRole)
  const staff = await prisma.user.findMany({
    where: {
      OR: [
        { role: { in: ['OWNER', 'ADMIN', 'MODERATOR'] } },
        { adminRole: { not: null } },
      ],
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      jobTitle: true,
      adminRole: true,
      bio: true,
      phone: true,
      wilayaCode: true,
      wilayaName: true,
      institutionName: true,
      studentCardId: true,
      isVerified: true,
      createdAt: true,
    },
  });

  return NextResponse.json(staff);
}

export async function POST(request: NextRequest) {
  // Only roles holding staff.manage (Super Admin, General Admin, HR Manager) may add staff.
  const authResult = await requirePermission(request, 'staff.manage');
  if ('error' in authResult) return authResult.error;
  const actor = authResult.user;
  const actorIsSuper = isSuperAdmin(actor);

  await ensureSeeded();

  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      role = 'ADMIN',
      adminRole = 'ADMIN',
      jobTitle,
      phone,
      wilayaCode,
      wilayaName,
      bio,
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'الاسم، البريد الإلكتروني وكلمة المرور مطلوبة' },
        { status: 400 }
      );
    }

    if (String(password).trim().length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
        { status: 400 }
      );
    }

    if (!isAssignableAdminRole(adminRole) || !['ADMIN', 'MODERATOR', 'OWNER'].includes(role)) {
      return NextResponse.json({ error: 'دور إداري غير صالح' }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: 'هذا البريد الإلكتروني مسجل مسبقاً' },
        { status: 409 }
      );
    }

    // Hierarchy: nobody may grant a role at or above their own level, and only a
    // Super Admin may create an OWNER or hand out SUPER_ADMIN / GENERAL_ADMIN.
    if (role === 'OWNER' && !actorIsSuper) {
      return NextResponse.json({ error: 'فقط المسؤول الأعلى يمكنه إنشاء مالك' }, { status: 403 });
    }
    if (!canAssignAdminRole(actor, adminRole)) {
      return NextResponse.json(
        { error: 'لا يمكنك تعيين دور إداري أعلى من مستواك أو مساوٍ له' },
        { status: 403 }
      );
    }

    const passwordHash = await hashPassword(String(password).trim());
    const parsedWilayaCode = wilayaCode ? Number(wilayaCode) : 16;
    const finalRole: Role = role === 'OWNER' ? 'OWNER' : adminRole === 'MODERATOR' ? 'MODERATOR' : 'ADMIN';

    const cardPrefix =
      adminRole === 'GENERAL_ADMIN'
        ? 'GEN'
        : adminRole === 'COMMERCIAL'
        ? 'COM'
        : adminRole === 'HR_MANAGER' || adminRole === 'HR_EMPLOYEE'
        ? 'HR'
        : adminRole === 'FINANCE'
        ? 'FIN'
        : 'ADM';

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: String(name).trim(),
        phone: phone ? String(phone).trim() : null,
        role: finalRole,
        adminRole,
        jobTitle: jobTitle ? String(jobTitle).trim() : null,
        bio: bio ? String(bio).trim() : null,
        passwordHash,
        wilayaCode: parsedWilayaCode,
        wilayaName: wilayaName || 'Alger',
        institutionName: 'DZ Prime Academy HQ',
        studentCardId: generateCardId(cardPrefix, parsedWilayaCode),
        isVerified: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        jobTitle: true,
        adminRole: true,
        bio: true,
        phone: true,
        wilayaCode: true,
        wilayaName: true,
        institutionName: true,
        studentCardId: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('Error creating staff member:', error);
    return NextResponse.json(
      { error: error?.message || 'فشل إضافة الإداري' },
      { status: 500 }
    );
  }
}
