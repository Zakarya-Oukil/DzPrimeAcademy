import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requirePermission } from '@/lib/auth';

export interface PromotionItem {
  id: string;
  code: string;
  discountPercent: number;
  descriptionAr: string;
  descriptionFr: string;
  isActive: boolean;
  type: 'CAMPAIGN' | 'AMBASSADOR' | 'FLASH_SALE';
  applicableTrack?: 'ALL' | 'BAC' | 'UNIVERSITY_LMD' | 'MEDICAL';
  usageCount: number;
  createdAt: string;
}

// In-memory persistent active commercial campaigns with official defaults
let platformPromotions: PromotionItem[] = [
  {
    id: 'promo-1',
    code: 'PROMO2026',
    discountPercent: 25,
    descriptionAr: 'تخفيض الافتتاح الوطني الرسمي 2026',
    descriptionFr: 'Remise officielle d\'ouverture nationale 2026',
    isActive: true,
    type: 'CAMPAIGN',
    applicableTrack: 'ALL',
    usageCount: 142,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'promo-2',
    code: 'BAC20',
    discountPercent: 20,
    descriptionAr: 'عرض خاص لطلبة البكالوريا BAC 2026',
    descriptionFr: 'Offre spéciale candidats BAC 2026',
    isActive: true,
    type: 'CAMPAIGN',
    applicableTrack: 'BAC',
    usageCount: 89,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'promo-3',
    code: 'EXCELLENCE30',
    discountPercent: 30,
    descriptionAr: 'عرض حزم الامتياز الجامعي والماستر',
    descriptionFr: 'Pack Excellence Universitaire & Master',
    isActive: true,
    type: 'FLASH_SALE',
    applicableTrack: 'UNIVERSITY_LMD',
    usageCount: 57,
    createdAt: new Date().toISOString(),
  },
];

export async function GET(request: NextRequest) {
  await ensureSeeded();
  const { searchParams } = new URL(request.url);
  const codeToValidate = searchParams.get('validate');

  // If a student or checkout is validating a code:
  if (codeToValidate) {
    const cleanCode = codeToValidate.trim().toUpperCase();

    // 1. Check Platform Promo Campaigns
    const promo = platformPromotions.find((p) => p.code.toUpperCase() === cleanCode && p.isActive);
    if (promo) {
      return NextResponse.json({
        valid: true,
        code: promo.code,
        discountPercent: promo.discountPercent,
        descriptionAr: promo.descriptionAr,
        descriptionFr: promo.descriptionFr,
        type: promo.type,
      });
    }

    // 2. Check Ambassador Promo Codes in Database
    const ambassador = await prisma.ambassadorProfile.findUnique({
      where: { promoCode: cleanCode },
    });

    if (ambassador) {
      return NextResponse.json({
        valid: true,
        code: ambassador.promoCode,
        discountPercent: 15, // Standard 15% discount for ambassador referrals
        descriptionAr: `كود السفير المعتمد — ولاية ${ambassador.wilayaNameAr}`,
        descriptionFr: `Code Ambassadeur Agréé — Wilaya ${ambassador.wilayaCode}`,
        type: 'AMBASSADOR',
      });
    }

    return NextResponse.json(
      { valid: false, error: 'كود التخفيض غير صالح أو منتهي الصلاحية' },
      { status: 404 }
    );
  }

  // Otherwise, return full promotions list for Admin / Commercial management
  const authResult = await requirePermission(request, 'catalog.manage');
  if ('error' in authResult) return authResult.error;

  // Retrieve ambassador promo codes for comprehensive overview
  const ambassadors = await prisma.ambassadorProfile.findMany({
    where: { promoCode: { not: null } },
    select: {
      id: true,
      promoCode: true,
      wilayaNameAr: true,
      wilayaCode: true,
      referralsCount: true,
      commissionDzd: true,
      isVerified: true,
    },
  });

  return NextResponse.json({
    platformPromotions,
    ambassadorCodes: ambassadors.map((a) => ({
      id: a.id,
      code: a.promoCode!,
      discountPercent: 15,
      wilayaNameAr: a.wilayaNameAr,
      wilayaCode: a.wilayaCode,
      referralsCount: a.referralsCount,
      commissionDzd: a.commissionDzd,
      isVerified: a.isVerified,
    })),
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermission(request, 'catalog.manage');
  if ('error' in authResult) return authResult.error;

  const body = await request.json();
  const cleanCode = (body.code || '').trim().toUpperCase();

  if (!cleanCode) {
    return NextResponse.json({ error: 'رمز التخفيض مطلوب' }, { status: 400 });
  }

  // Check if exists
  if (platformPromotions.some((p) => p.code === cleanCode)) {
    return NextResponse.json({ error: 'كود التخفيض مسجل مسبقاً' }, { status: 400 });
  }

  const newPromo: PromotionItem = {
    id: `promo-${Date.now()}`,
    code: cleanCode,
    discountPercent: Number(body.discountPercent) || 15,
    descriptionAr: body.descriptionAr || `تخفيض بنسبة ${body.discountPercent}%`,
    descriptionFr: body.descriptionFr || `Remise de ${body.discountPercent}%`,
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    type: body.type || 'CAMPAIGN',
    applicableTrack: body.applicableTrack || 'ALL',
    usageCount: 0,
    createdAt: new Date().toISOString(),
  };

  platformPromotions.unshift(newPromo);
  return NextResponse.json(newPromo, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const authResult = await requirePermission(request, 'catalog.manage');
  if ('error' in authResult) return authResult.error;

  const body = await request.json();
  const { id, isActive, discountPercent, descriptionAr, descriptionFr } = body;

  platformPromotions = platformPromotions.map((p) => {
    if (p.id === id) {
      return {
        ...p,
        isActive: isActive !== undefined ? isActive : p.isActive,
        discountPercent: discountPercent !== undefined ? Number(discountPercent) : p.discountPercent,
        descriptionAr: descriptionAr !== undefined ? descriptionAr : p.descriptionAr,
        descriptionFr: descriptionFr !== undefined ? descriptionFr : p.descriptionFr,
      };
    }
    return p;
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const authResult = await requirePermission(request, 'catalog.manage');
  if ('error' in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID مطلوب' }, { status: 400 });
  }

  platformPromotions = platformPromotions.filter((p) => p.id !== id);
  return NextResponse.json({ success: true });
}
