import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';

// Every figure here is computed from rows in the database. Nothing is estimated, floored or seeded.
// Revenue = approved operations only: a bundle purchase or VIP subscription row is a consequence of an
// approved operation, so adding it again would count the same money twice.

const date = (d: Date) => d.toLocaleDateString('fr-DZ', { day: 'numeric', month: 'short', year: 'numeric' });

export async function GET(request: NextRequest) {
  const authResult = await requirePermission(request, 'finance.manage');
  if ('error' in authResult) return authResult.error;

  try {
    const now = new Date();
    // UTC throughout: Postgres buckets the stored UTC timestamps, so the JS boundaries must be UTC too.
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const seriesStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

    const [
      opsByStatusType,
      monthAgg,
      payoutsByStatus,
      unpaidShares,
      commissionAgg,
      monthCommissionAgg,
      incomeRows,
      payoutRows,
      recentApproved,
      recentPending,
      recentPayouts,
    ] = await Promise.all([
      prisma.pendingOperation.groupBy({ by: ['status', 'type'], where: { status: { in: ['APPROVED', 'PENDING'] }, amountDzd: { gt: 0 } }, _sum: { amountDzd: true }, _count: true }),
      prisma.pendingOperation.aggregate({ where: { status: 'APPROVED', amountDzd: { gt: 0 }, approvedAt: { gte: monthStart } }, _sum: { amountDzd: true } }),
      prisma.facultyPayout.groupBy({ by: ['status'], where: { status: { in: ['PAID', 'PENDING'] } }, _sum: { amountDzd: true } }),
      prisma.teacherProfile.aggregate({ where: { payoutStatus: { not: 'PAID' } }, _sum: { monthlyShareDzd: true } }),
      prisma.commissionEntry.aggregate({ _sum: { amountDzd: true } }),
      prisma.commissionEntry.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { amountDzd: true } }),
      prisma.$queryRaw<{ m: string; v: bigint }[]>`
        SELECT to_char(date_trunc('month', "approvedAt"), 'YYYY-MM') AS m, COALESCE(SUM("amountDzd"), 0) AS v
        FROM "PendingOperation"
        WHERE "status" = 'APPROVED' AND "amountDzd" > 0 AND "approvedAt" >= ${seriesStart}
        GROUP BY 1`,
      prisma.$queryRaw<{ m: string; v: bigint }[]>`
        SELECT to_char(date_trunc('month', "approvedAt"), 'YYYY-MM') AS m, COALESCE(SUM("amountDzd"), 0) AS v
        FROM "FacultyPayout"
        WHERE "status" = 'PAID' AND "approvedAt" >= ${seriesStart}
        GROUP BY 1`,
      prisma.pendingOperation.findMany({ where: { status: 'APPROVED', amountDzd: { gt: 0 } }, orderBy: { approvedAt: { sort: 'desc', nulls: 'last' } }, take: 25 }),
      prisma.pendingOperation.findMany({ where: { status: 'PENDING', amountDzd: { gt: 0 } }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.facultyPayout.findMany({ where: { status: 'PAID' }, orderBy: { approvedAt: { sort: 'desc', nulls: 'last' } }, take: 10, include: { teacherProfile: { include: { user: { select: { name: true } } } } } }),
    ]);

    const approvedRows = opsByStatusType.filter((r) => r.status === 'APPROVED');
    const pendingRows = opsByStatusType.filter((r) => r.status === 'PENDING');
    const sum = (rows: { _sum: { amountDzd: number | null } }[]) => rows.reduce((a, r) => a + (r._sum.amountDzd || 0), 0);
    const count = (rows: { _count: number }[]) => rows.reduce((a, r) => a + r._count, 0);
    const payoutSum = (status: string) => payoutsByStatus.find((r) => r.status === status)?._sum.amountDzd || 0;
    const totalRevenue = sum(approvedRows);
    const totalPaidOut = payoutSum('PAID');
    const monthlyIncome = monthAgg._sum.amountDzd || 0;
    const payrollLiability = payoutSum('PENDING') + (unpaidShares._sum.monthlyShareDzd || 0);

    const incomeByMonth = new Map(incomeRows.map((r) => [r.m, Number(r.v)]));
    const payoutByMonth = new Map(payoutRows.map((r) => [r.m, Number(r.v)]));
    const monthly = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      return { month: key, income: incomeByMonth.get(key) || 0, payouts: payoutByMonth.get(key) || 0 };
    });

    const transactions = [
      ...recentApproved.map((op) => {
        const when = op.approvedAt || op.updatedAt;
        return {
          id: `op-${op.id}`,
          nameAr: `${op.title} (${op.userName})`,
          nameFr: `${op.title} (${op.userName})`,
          category: op.type,
          method: op.channel || '',
          amount: op.amountDzd,
          date: date(when),
          timestamp: when.getTime(),
          status: 'COMPLETE',
        };
      }),
      ...recentPending.map((op) => ({
        id: `pend-${op.id}`,
        nameAr: `طلب معلق: ${op.title} (${op.userName})`,
        nameFr: `En attente: ${op.title} (${op.userName})`,
        category: op.type,
        method: op.channel || '',
        amount: op.amountDzd,
        date: date(op.createdAt),
        timestamp: op.createdAt.getTime(),
        status: 'PENDING',
      })),
      ...recentPayouts.map((p) => {
        const when = p.approvedAt || p.createdAt;
        const name = p.teacherProfile.user.name;
        return {
          id: `payout-${p.id}`,
          nameAr: `صرف مستحقات أستاذ: ${name}`,
          nameFr: `Virement enseignant: ${name}`,
          category: 'TEACHER_PAYOUT',
          method: 'CCP',
          amount: -p.amountDzd,
          date: date(when),
          timestamp: when.getTime(),
          status: 'COMPLETE',
        };
      }),
    ]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 25);

    return NextResponse.json({
      success: true,
      totalBalance: totalRevenue - totalPaidOut,
      monthlyIncome,
      realVerifiedRevenue: totalRevenue,
      revenueByType: Object.fromEntries(approvedRows.map((r) => [r.type, r._sum.amountDzd || 0])),
      payrollLiability,
      ambassadorCommissions: commissionAgg._sum.amountDzd || 0,
      netMargin: monthlyIncome - payrollLiability - (monthCommissionAgg._sum.amountDzd || 0),
      pendingAmountDzd: sum(pendingRows),
      approvedOpsCount: count(approvedRows),
      pendingOpsCount: count(pendingRows),
      monthly,
      transactions,
    });
  } catch (err) {
    console.error('Error fetching financial overview:', err);
    return NextResponse.json({ error: 'فشل تحميل بيانات المركز المالي' }, { status: 500 });
  }
}
