import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { clientIp, rateLimit } from '@/lib/rateLimit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Card numbers are sequential, so lookups are throttled per visitor to stop a scan of the whole register.
  if (!rateLimit(`card-verify:${clientIp(request)}`, 30, 60 * 1000)) {
    return NextResponse.json({ isValid: false, message: 'محاولات كثيرة، حاول لاحقاً', card: null }, { status: 429 });
  }

  // Exact match on the random public token only (the sequential card number cannot be used to look anyone up).
  const matchedUser = /^[a-f0-9]{32}$/.test(id)
    ? await prisma.user.findUnique({ where: { publicToken: id } })
    : null;

  if (!matchedUser) {
    return NextResponse.json(
      {
        isValid: false,
        message: 'رقم البطاقة غير موجود في السجل الوطني للمنصة',
        card: null,
      },
      { status: 404 }
    );
  }

  // The end date is the real subscription's; accounts without one (free students, staff) have no expiry to show.
  const subscription = await prisma.subscription.findFirst({
    where: { userId: matchedUser.id },
    orderBy: { endDate: 'desc' },
    select: { endDate: true, status: true },
  });
  const membership = !subscription ? 'NONE' : subscription.status === 'ACTIVE' && subscription.endDate > new Date() ? 'ACTIVE' : 'EXPIRED';

  return NextResponse.json({
    isValid: membership !== 'EXPIRED',
    message: membership === 'EXPIRED' ? 'انتهت صلاحية هذه العضوية' : 'بطاقة عضوية معتمدة ورسمية',
    card: {
      cardId: matchedUser.studentCardId,
      holderName: matchedUser.name,
      role: matchedUser.role,
      institutionName: matchedUser.institutionName,
      wilayaCode: matchedUser.wilayaCode,
      wilayaName: matchedUser.wilayaName,
      isVerified: matchedUser.isVerified,
      membership,
      expiryDate: subscription ? subscription.endDate.toISOString().slice(0, 10).replace(/-/g, '/') : null,
    },
  });
}
