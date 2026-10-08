import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest, requirePermission } from '@/lib/auth';
import { OperationType, OperationChannel } from '@prisma/client';
import { OpError, applyDiscount, priceTarget, resolvePromo } from '@/lib/operations';
import { clientIp, rateLimit } from '@/lib/rateLimit';

const TYPES = new Set<string>(Object.values(OperationType));
const CHANNELS = new Set<string>(Object.values(OperationChannel));
// Priced requests are tied to an account: approving them upgrades or enrols that account.
const NEEDS_ACCOUNT = new Set<string>(['VIP_MEMBERSHIP_UPGRADE', 'COURSE_ENROLLMENT']);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// POST: a student or visitor asks the team to activate, upgrade or sell something.
// The amount is decided here from the database, never taken from the request.
export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(`op:${clientIp(request)}`, 20, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'طلبات كثيرة، حاول لاحقاً' }, { status: 429 });
    }
    const raw = await request.text();
    if (raw.length > 20_000) return NextResponse.json({ error: 'الطلب كبير جداً' }, { status: 413 });
    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(raw || '{}') ?? {};
      if (typeof body !== 'object') throw new Error('not an object');
    } catch {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }

    const type = typeof body.type === 'string' ? body.type : 'MANUAL_SUPPORT';
    if (!TYPES.has(type)) return NextResponse.json({ error: 'نوع العملية غير صالح' }, { status: 400 });
    const channel = typeof body.channel === 'string' && CHANNELS.has(body.channel) ? (body.channel as OperationChannel) : null;
    const targetId = text(body.targetId, 100) || null;

    const currentUser = await getUserFromRequest(request);
    if (!currentUser && NEEDS_ACCOUNT.has(type)) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول لإتمام هذا الطلب' }, { status: 401 });
    }

    const userName = currentUser?.name || text(body.userName, 100);
    const userEmail = (currentUser?.email || text(body.userEmail, 254)).toLowerCase();
    const userPhone = currentUser?.phone || text(body.userPhone, 30) || null;
    const userWilaya =
      currentUser?.wilayaName ||
      (currentUser?.wilayaCode ? `ولاية ${currentUser.wilayaCode}` : null) ||
      text(body.userWilaya, 60) ||
      null;
    if (!currentUser) {
      if (!userName) return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
      if (userEmail ? !EMAIL.test(userEmail) : !userPhone) {
        return NextResponse.json({ error: 'بريد إلكتروني صالح أو رقم هاتف مطلوب' }, { status: 400 });
      }
    }

    const priced = await priceTarget(type, targetId);
    let amountDzd = priced.listPrice;
    let discountDzd = 0;
    let promoCode: string | null = null;
    if (priced.listPrice > 0 && body.promoCode) {
      const promo = await resolvePromo(body.promoCode, priced.track);
      if (!promo) return NextResponse.json({ error: 'كود التخفيض غير صالح أو منتهي الصلاحية' }, { status: 400 });
      if (promo.ambassadorUserId && currentUser && promo.ambassadorUserId === currentUser.id) {
        return NextResponse.json({ error: 'لا يمكنك استخدام كود الإحالة الخاص بك' }, { status: 400 });
      }
      ({ amount: amountDzd, discount: discountDzd } = applyDiscount(priced.listPrice, promo.percent));
      promoCode = promo.code;
    }

    const title =
      type === 'VIP_MEMBERSHIP_UPGRADE'
        ? 'طلب ترقية العضوية الذهبية VIP'
        : type === 'BUNDLE_PURCHASE'
        ? `طلب شراء باقة: ${priced.title}`
        : type === 'COURSE_ENROLLMENT'
        ? `طلب الالتحاق بمقرر: ${priced.title}`
        : text(body.title, 200) ||
          (type === 'ACCOUNT_ACTIVATION' ? 'طلب تفعيل حساب' : type === 'AMBASSADOR_APPLICATION' ? 'طلب الانضمام كسفير' : 'طلب تواصل ودعم');

    // One open request per signed-in user and item: a repeated click must not flood the admin queue.
    // Guests are not matched by the email they typed (that would let anyone probe or hijack another person's
    // request); they are limited per IP instead. A duplicate reply never echoes the stored row.
    if (currentUser) {
      const open = await prisma.pendingOperation.findFirst({
        where: { status: 'PENDING', type: type as OperationType, targetId, userId: currentUser.id },
        select: { id: true },
      });
      if (open) return NextResponse.json({ success: true, duplicate: true });
    }

    const operation = await prisma.pendingOperation.create({
      data: {
        userId: currentUser?.id || null,
        userName: userName || 'طالب جديد',
        userEmail,
        userPhone,
        userWilaya,
        type: type as OperationType,
        channel,
        title,
        details: text(body.details, 1000) || null,
        amountDzd,
        discountDzd,
        promoCode,
        targetId,
      },
    });

    return NextResponse.json({ success: true, operation });
  } catch (error) {
    if (error instanceof OpError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Error creating pending operation:', error);
    return NextResponse.json({ error: 'فشل تسجيل العملية' }, { status: 500 });
  }
}

// GET: Admin fetch all operations with filtering & summary stats
export async function GET(request: NextRequest) {
  const authResult = await requirePermission(request, 'operations.manage');
  if ('error' in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const channel = searchParams.get('channel');
  const search = searchParams.get('search')?.trim();

  const where: any = {};

  if (status && status !== 'ALL') {
    where.status = status;
  }
  if (type && type !== 'ALL') {
    where.type = type;
  }
  if (channel && channel !== 'ALL') {
    where.channel = channel;
  }

  if (search) {
    where.OR = [
      { userName: { contains: search, mode: 'insensitive' } },
      { userEmail: { contains: search, mode: 'insensitive' } },
      { userPhone: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
      { details: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [
    operations,
    total,
    pendingCount,
    pendingAmountResult,
    approvedCount,
    approvedAmountResult,
  ] = await Promise.all([
    prisma.pendingOperation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.pendingOperation.count({ where }),
    prisma.pendingOperation.count({
      where: { status: 'PENDING' },
    }),
    prisma.pendingOperation.aggregate({
      where: { status: 'PENDING', amountDzd: { gt: 0 } },
      _sum: { amountDzd: true },
    }),
    prisma.pendingOperation.count({
      where: { status: 'APPROVED' },
    }),
    prisma.pendingOperation.aggregate({
      where: { status: 'APPROVED', amountDzd: { gt: 0 } },
      _sum: { amountDzd: true },
    }),
  ]);

  return NextResponse.json({
    operations,
    total,
    pendingCount,
    totalPendingAmountDzd: pendingAmountResult._sum.amountDzd || 0,
    approvedCount,
    totalApprovedAmountDzd: approvedAmountResult._sum.amountDzd || 0,
  });
}
