import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { guard } from '@/lib/http';

// Read-only directory for signed-in ambassadors. Only the fields a fellow ambassador
// needs to get in touch: never commission, promo code, referrals, email or phone.
// (/api/ambassadors stays staff-only because it carries those.)
async function GETHandler(request: NextRequest) {
  const currentUser = await getUserFromRequest(request);
  if (!currentUser) return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
  if (currentUser.role !== 'AMBASSADOR') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

  const rows = await prisma.ambassadorProfile.findMany({
    orderBy: [{ wilayaCode: 'asc' }, { createdAt: 'asc' }],
    take: 500,
    select: {
      id: true,
      wilayaCode: true,
      wilayaNameAr: true,
      wilayaNameFr: true,
      institutionNameAr: true,
      institutionNameFr: true,
      specialtyName: true,
      telegramHandle: true,
      bioAr: true,
      isVerified: true,
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  return NextResponse.json(rows);
}

export const GET = guard(GETHandler);
