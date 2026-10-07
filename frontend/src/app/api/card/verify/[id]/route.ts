import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { normalizeCardId } from '@/lib/cardId';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Exact match on a well-formed card ID only. Raw text is never used as a pattern,
  // so "%" or "_" cannot turn this into a wildcard search of the user base.
  const cardId = normalizeCardId(id);
  const matchedUser = cardId
    ? await prisma.user.findUnique({ where: { studentCardId: cardId } })
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

  return NextResponse.json({
    isValid: true,
    message: 'بطاقة عضوية معتمدة ورسمية',
    card: {
      cardId: matchedUser.studentCardId,
      holderName: matchedUser.name,
      role: matchedUser.role,
      institutionName: matchedUser.institutionName,
      wilayaCode: matchedUser.wilayaCode,
      wilayaName: matchedUser.wilayaName,
      isVerified: matchedUser.isVerified,
      expiryDate: '2026/09/30',
    },
  });
}
