import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requirePermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
  await ensureSeeded();
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('all') === 'true';

  const bundles = await prisma.bundle.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  if (includeInactive) {
    const counts = await prisma.bundlePurchase.groupBy({ by: ['bundleId'], _count: { id: true } });
    const countMap = new Map(counts.map((c) => [c.bundleId, c._count.id]));
    return NextResponse.json(bundles.map((b) => ({ ...b, purchasesCount: countMap.get(b.id) || 0 })));
  }

  return NextResponse.json(bundles);
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermission(request, 'catalog.manage');
  if ('error' in authResult) return authResult.error;

  await ensureSeeded();
  const body = await request.json();

  const bundle = await prisma.bundle.create({
    data: {
      titleAr: body.titleAr,
      titleFr: body.titleFr || null,
      descriptionAr: body.descriptionAr,
      descriptionFr: body.descriptionFr || null,
      track: body.track || 'BAC',
      badge: body.badge || null,
      hours: body.hours ?? 24,
      lecturesCount: body.lecturesCount ?? 3,
      originalPriceDzd: body.originalPriceDzd,
      currentPriceDzd: body.currentPriceDzd,
      colorTheme: body.colorTheme || 'gold',
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  return NextResponse.json(bundle, { status: 201 });
}
