import { NextRequest, NextResponse } from 'next/server';
import { generateCardId } from '@/lib/cardId';
import { prisma } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { hashPassword, requirePermission } from '@/lib/auth';
import { hasAnyPermission } from '@/lib/rbac';

// Staff only: the list carries commission and promo data. Ambassadors' public
// face is /api/profile/[id].
export async function GET(request: NextRequest) {
  const authResult = await requirePermission(request, ['users.manage', 'catalog.manage']);
  if ('error' in authResult) return authResult.error;
  const isHR = hasAnyPermission(authResult.user, 'users.manage');

  await ensureSeeded();
  const ambassadors = await prisma.ambassadorProfile.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const userIds = ambassadors.map((a) => a.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      avatar: true,
      role: true,
      email: isHR,
      phone: isHR,
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

  const ambassadorIds = ambassadors.map((a) => a.id);
  const ratings = await prisma.rating.findMany({ where: { ambassadorId: { in: ambassadorIds } } });
  const ratingsMap = new Map<string, typeof ratings>();
  for (const r of ratings) {
    ratingsMap.set(r.ambassadorId, [...(ratingsMap.get(r.ambassadorId) || []), r]);
  }

  const result = ambassadors.map((a) => {
    const { commissionDzd, referralsCount, phone, ...pub } = a;
    return {
      ...pub,
      ...(isHR ? { commissionDzd, referralsCount, phone } : {}),
      user: usersMap.get(a.userId) ?? null,
      ratings: ratingsMap.get(a.id) || [],
    };
  });

  return NextResponse.json(result);
}

function generateTempPassword(): string {
  return `Amb${Math.floor(1000 + Math.random() * 9000)}!`;
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermission(request, 'users.manage');
  if ('error' in authResult) return authResult.error;

  await ensureSeeded();
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      phone,
      wilayaCode,
      wilayaNameAr,
      wilayaNameFr,
      institutionNameAr,
      institutionNameFr,
      specialtyName,
      promoCode,
      telegramHandle,
      bioAr,
    } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'الاسم الكامل والبريد الإلكتروني مطلوبان' }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: 'هذا البريد الإلكتروني مسجل مسبقاً في المنصة' }, { status: 409 });
    }

    const clearPassword = password && String(password).trim().length >= 6
      ? String(password).trim()
      : generateTempPassword();

    const passwordHash = await hashPassword(clearPassword);
    const parsedWilayaCode = wilayaCode ? Number(wilayaCode) : 16;

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: String(name).trim(),
        phone: phone ? String(phone).trim() : null,
        role: 'AMBASSADOR',
        passwordHash,
        wilayaCode: parsedWilayaCode,
        wilayaName: wilayaNameAr || wilayaNameFr || 'Alger',
        institutionName: institutionNameAr || institutionNameFr || 'Université',
        specialty: specialtyName || null,
        studentCardId: generateCardId('AMB', parsedWilayaCode),
        isVerified: true,
      },
    });

    let effectivePromoCode = promoCode ? String(promoCode).toUpperCase().trim() : `WIL${parsedWilayaCode}-AMB${Math.floor(100 + Math.random() * 900)}`;
    const existingPromo = await prisma.ambassadorProfile.findUnique({ where: { promoCode: effectivePromoCode } });
    if (existingPromo) {
      effectivePromoCode = `${effectivePromoCode}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const profile = await prisma.ambassadorProfile.create({
      data: {
        userId: user.id,
        wilayaCode: parsedWilayaCode,
        wilayaNameAr: wilayaNameAr || 'الجزائر',
        wilayaNameFr: wilayaNameFr || null,
        institutionNameAr: institutionNameAr || 'الجامعة',
        institutionNameFr: institutionNameFr || null,
        specialtyName: specialtyName || null,
        telegramHandle: telegramHandle ? String(telegramHandle).replace('@', '').trim() : null,
        phone: phone ? String(phone).trim() : null,
        bioAr: bioAr || null,
        promoCode: effectivePromoCode,
        isVerified: true,
      },
    });

    const { passwordHash: _omit, ...safeUser } = user;
    return NextResponse.json({ ...profile, user: safeUser, tempPassword: clearPassword }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating ambassador:', error);
    return NextResponse.json({ error: error?.message || 'فشل إضافة السفير' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await requirePermission(request, 'users.manage');
  if ('error' in authResult) return authResult.error;

  try {
    const body = await request.json();
    const { id, isVerified, upcomingSessionsCount, telegramHandle, bioAr, promoCode, specialtyName } = body;

    const profile = await prisma.ambassadorProfile.update({
      where: { id },
      data: {
        isVerified: isVerified !== undefined ? Boolean(isVerified) : undefined,
        upcomingSessionsCount: upcomingSessionsCount !== undefined ? Number(upcomingSessionsCount) : undefined,
        telegramHandle: telegramHandle !== undefined ? telegramHandle : undefined,
        bioAr: bioAr !== undefined ? bioAr : undefined,
        promoCode: promoCode !== undefined ? promoCode : undefined,
        specialtyName: specialtyName !== undefined ? specialtyName : undefined,
      },
    });

    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'فشل تحديث بيانات السفير' }, { status: 500 });
  }
}
