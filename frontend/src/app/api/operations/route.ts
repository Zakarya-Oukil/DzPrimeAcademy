import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest, requirePermission } from '@/lib/auth';
import { OperationType, OperationChannel, OperationStatus } from '@prisma/client';

// POST: Record an operation / contact action by a student or user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const currentUser = await getUserFromRequest(request);

    const {
      type = 'MANUAL_SUPPORT',
      channel,
      targetId,
      title,
      details,
      amountDzd = 0,
      userName,
      userEmail,
      userPhone,
      userWilaya,
    } = body;

    const finalUserName = currentUser?.name || userName || 'طالب جديد';
    const finalUserEmail = currentUser?.email || userEmail || '';
    const finalUserPhone = currentUser?.phone || userPhone || null;
    const finalUserWilaya =
      currentUser?.wilayaName ||
      (currentUser?.wilayaCode ? `ولاية ${currentUser.wilayaCode}` : null) ||
      userWilaya ||
      null;

    const finalTitle =
      title ||
      (type === 'ACCOUNT_ACTIVATION'
        ? 'طلب تفعيل حساب'
        : type === 'VIP_MEMBERSHIP_UPGRADE'
        ? 'طلب ترقية العضوية الذهبية VIP'
        : type === 'BUNDLE_PURCHASE'
        ? 'طلب شراء عرض ترويجي'
        : 'طلب تواصل ودعم');

    const operation = await prisma.pendingOperation.create({
      data: {
        userId: currentUser?.id || null,
        userName: finalUserName,
        userEmail: finalUserEmail,
        userPhone: finalUserPhone,
        userWilaya: finalUserWilaya,
        type: (type as OperationType) || OperationType.MANUAL_SUPPORT,
        channel: (channel as OperationChannel) || null,
        status: OperationStatus.PENDING,
        title: finalTitle,
        details: details || null,
        amountDzd: Number(amountDzd) || 0,
        targetId: targetId ? String(targetId) : null,
      },
    });

    return NextResponse.json({ success: true, operation });
  } catch (error: any) {
    console.error('Error creating pending operation:', error);
    return NextResponse.json(
      { error: error?.message || 'فشل تسجيل العملية' },
      { status: 500 }
    );
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
      where: { status: 'PENDING' },
      _sum: { amountDzd: true },
    }),
    prisma.pendingOperation.count({
      where: { status: 'APPROVED' },
    }),
    prisma.pendingOperation.aggregate({
      where: { status: 'APPROVED' },
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
