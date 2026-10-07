import { NextRequest, NextResponse } from 'next/server';
import { generateCardId } from '@/lib/cardId';
import { prisma } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { hashPassword, requirePermission } from '@/lib/auth';
import { hasAnyPermission } from '@/lib/rbac';

// Staff only. HR and finance see the full record; catalog managers (who only need a
// teacher picker for courses and sessions) get no bank, rate or payout data.
export async function GET(request: NextRequest) {
  const authResult = await requirePermission(request, ['users.manage', 'finance.manage', 'catalog.manage']);
  if ('error' in authResult) return authResult.error;
  const canSeeMoney = hasAnyPermission(authResult.user, ['users.manage', 'finance.manage']);
  const canSeeContact = hasAnyPermission(authResult.user, 'users.manage');

  await ensureSeeded();

  const profiles = await prisma.teacherProfile.findMany({
    include: { payouts: { orderBy: { createdAt: 'desc' }, take: 3 } },
    orderBy: { createdAt: 'asc' },
  });

  const userIds = profiles.map((p) => p.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      avatar: true,
      role: true,
      email: canSeeContact,
      phone: canSeeContact,
      wilayaCode: true,
      wilayaName: true,
      institutionName: true,
      specialty: true,
      studentCardId: true,
      isVerified: true,
      createdAt: true,
    },
  });
  const usersMap = new Map(users.map((u) => [u.id, u]));

  const result = profiles.map((p) => {
    const user = usersMap.get(p.userId) ?? null;
    if (canSeeMoney) return { ...p, user };
    // Catalog managers only need a picker: no rate, bank, payout or share data.
    return {
      id: p.id,
      userId: p.userId,
      university: p.university,
      specialty: p.specialty,
      hoursTaught: p.hoursTaught,
      studentsCount: p.studentsCount,
      createdAt: p.createdAt,
      payouts: [],
      user,
    };
  });

  return NextResponse.json(result);
}

function generateTempPassword(): string {
  return `Prof${Math.floor(1000 + Math.random() * 9000)}!`;
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermission(request, 'users.manage');
  if ('error' in authResult) return authResult.error;

  await ensureSeeded();
  try {
    const body = await request.json();
    const { name, email, password, phone, wilayaCode, wilayaName, university, specialty, hourlyRateDzd, ccpAccount, ccpCle } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'الاسم الكامل والبريد الإلكتروني مطلوبان' }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: 'هذا البريد الإلكتروني مسجل مسبقاً في المنصة' }, { status: 409 });
    }

    const clearPassword = (password && String(password).trim().length >= 6)
      ? String(password).trim()
      : generateTempPassword();

    const passwordHash = await hashPassword(clearPassword);
    const parsedWilayaCode = wilayaCode ? Number(wilayaCode) : 16;

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: String(name).trim(),
        phone: phone ? String(phone).trim() : null,
        role: 'TEACHER',
        passwordHash,
        wilayaCode: parsedWilayaCode,
        wilayaName: wilayaName || null,
        institutionName: university || 'Université Algérienne',
        specialty: specialty || null,
        studentCardId: generateCardId('TCH', parsedWilayaCode),
        isVerified: true,
      },
    });

    const profile = await prisma.teacherProfile.create({
      data: {
        userId: user.id,
        university: university || 'Université Algérienne',
        specialty: specialty || null,
        hourlyRateDzd: hourlyRateDzd ? Number(hourlyRateDzd) : 12000,
        ccpAccount: ccpAccount || null,
        ccpCle: ccpCle || null,
      },
    });

    const { passwordHash: _omit, ...safeUser } = user;
    return NextResponse.json({ ...profile, user: safeUser, tempPassword: clearPassword }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating teacher:', error);
    return NextResponse.json({ error: error?.message || 'فشل إضافة الأستاذ' }, { status: 500 });
  }
}
