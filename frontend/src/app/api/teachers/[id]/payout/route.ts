import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requirePermission(request, 'finance.manage');
  if ('error' in authResult) return authResult.error;

  const { id } = await params;

  const profile = await prisma.teacherProfile.findUnique({ where: { id } });
  if (!profile) {
    return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
  }

  const now = new Date();

  await prisma.facultyPayout.updateMany({
    where: { teacherProfileId: id, status: 'PENDING' },
    data: { status: 'PAID', approvedAt: now, receiptRef: `RCPT-${Date.now()}` },
  });

  const updated = await prisma.teacherProfile.update({
    where: { id },
    data: { payoutStatus: 'PAID', lastPayoutAt: now },
    include: { payouts: { orderBy: { createdAt: 'desc' }, take: 3 } },
  });

  return NextResponse.json(updated);
}
