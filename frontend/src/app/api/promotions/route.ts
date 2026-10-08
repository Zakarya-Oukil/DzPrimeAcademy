import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { AMBASSADOR_DISCOUNT_PERCENT, resolvePromo } from '@/lib/operations';
import { clientIp, rateLimit } from '@/lib/rateLimit';

const TYPES = ['CAMPAIGN', 'AMBASSADOR', 'FLASH_SALE'];
const TRACKS = ['ALL', 'BAC', 'UNIVERSITY_LMD', 'MEDICAL'];
const CODE = /^[A-Z0-9_-]{3,30}$/;

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

// Shared field checks for create and update. Returns the clean data or an error message.
function parsePromo(body: Record<string, unknown>, partial: boolean): { data: Record<string, unknown> } | { error: string } {
  const data: Record<string, unknown> = {};
  if (!partial || body.discountPercent !== undefined) {
    const pct = Number(body.discountPercent);
    if (!Number.isInteger(pct) || pct < 1 || pct > 100) return { error: 'نسبة التخفيض يجب أن تكون بين 1 و100' };
    data.discountPercent = pct;
  }
  if (text(body.descriptionAr, 200)) data.descriptionAr = text(body.descriptionAr, 200);
  if (text(body.descriptionFr, 200)) data.descriptionFr = text(body.descriptionFr, 200);
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (body.type !== undefined) {
    if (!TYPES.includes(body.type as string)) return { error: 'نوع غير صالح' };
    data.type = body.type;
  }
  if (body.applicableTrack !== undefined) {
    if (!TRACKS.includes(body.applicableTrack as string)) return { error: 'مسار غير صالح' };
    data.applicableTrack = body.applicableTrack;
  }
  if (body.maxUses !== undefined) {
    const n = body.maxUses === null || body.maxUses === '' ? null : Number(body.maxUses);
    if (n !== null && (!Number.isInteger(n) || n < 1)) return { error: 'الحد الأقصى للاستخدام غير صالح' };
    data.maxUses = n;
  }
  if (body.expiresAt !== undefined) {
    const d = body.expiresAt ? new Date(String(body.expiresAt)) : null;
    if (d && Number.isNaN(d.getTime())) return { error: 'تاريخ الانتهاء غير صالح' };
    data.expiresAt = d;
  }
  return { data };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const codeToValidate = searchParams.get('validate');

  // Checkout asks "is this code good, and for how much?". The server re-checks it when the operation is created.
  if (codeToValidate) {
    if (!rateLimit(`promo:${clientIp(request)}`, 30, 10 * 60 * 1000)) {
      return NextResponse.json({ valid: false, error: 'محاولات كثيرة، حاول لاحقاً' }, { status: 429 });
    }
    const promo = await resolvePromo(codeToValidate, searchParams.get('track'));
    if (!promo) {
      return NextResponse.json({ valid: false, error: 'كود التخفيض غير صالح أو منتهي الصلاحية' }, { status: 404 });
    }
    return NextResponse.json({
      valid: true,
      code: promo.code,
      discountPercent: promo.percent,
      descriptionAr: promo.descriptionAr,
      descriptionFr: promo.descriptionFr,
      type: promo.type,
    });
  }

  const authResult = await requirePermission(request, 'catalog.manage');
  if ('error' in authResult) return authResult.error;

  const [platformPromotions, ambassadors] = await Promise.all([
    prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.ambassadorProfile.findMany({
      where: { promoCode: { not: null } },
      select: { id: true, promoCode: true, wilayaNameAr: true, wilayaCode: true, referralsCount: true, commissionDzd: true, isVerified: true },
    }),
  ]);

  return NextResponse.json({
    platformPromotions,
    ambassadorCodes: ambassadors.map((a) => ({
      id: a.id,
      code: a.promoCode!,
      discountPercent: AMBASSADOR_DISCOUNT_PERCENT,
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

  const body = (await request.json().catch(() => null)) ?? {};
  const code = text(body.code, 30).toUpperCase();
  if (!CODE.test(code)) return bad('رمز التخفيض: 3 إلى 30 حرفاً (A-Z، 0-9، - أو _)');

  const parsed = parsePromo(body, false);
  if ('error' in parsed) return bad(parsed.error);

  if ((await prisma.promotion.findUnique({ where: { code } })) || (await prisma.ambassadorProfile.findUnique({ where: { promoCode: code } }))) {
    return bad('كود التخفيض مسجل مسبقاً');
  }

  const pct = parsed.data.discountPercent;
  try {
    const promo = await prisma.promotion.create({
      data: {
        code,
        descriptionAr: `تخفيض بنسبة ${pct}%`,
        descriptionFr: `Remise de ${pct}%`,
        ...(parsed.data as { discountPercent: number }),
      },
    });
    return NextResponse.json(promo, { status: 201 });
  } catch (e: any) {
    if (e?.code === 'P2002') return bad('كود التخفيض مسجل مسبقاً');
    throw e;
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await requirePermission(request, 'catalog.manage');
  if ('error' in authResult) return authResult.error;

  const body = (await request.json().catch(() => null)) ?? {};
  const id = text(body.id, 100);
  const parsed = parsePromo(body, true);
  if ('error' in parsed) return bad(parsed.error);

  const result = await prisma.promotion.updateMany({ where: { id }, data: parsed.data });
  if (result.count === 0) return NextResponse.json({ error: 'الكود غير موجود' }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const authResult = await requirePermission(request, 'catalog.manage');
  if ('error' in authResult) return authResult.error;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return bad('ID مطلوب');

  const result = await prisma.promotion.deleteMany({ where: { id } });
  if (result.count === 0) return NextResponse.json({ error: 'الكود غير موجود' }, { status: 404 });
  return NextResponse.json({ success: true });
}
