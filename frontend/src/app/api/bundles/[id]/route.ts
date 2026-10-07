import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { parseImageField } from '@/lib/safeUrl';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requirePermission(request, 'catalog.manage');
  if ('error' in authResult) return authResult.error;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) ?? {};
  if ([body.originalPriceDzd, body.currentPriceDzd].some((n) => n !== undefined && !(Number.isInteger(n) && n >= 0))) {
    return NextResponse.json({ error: 'الأسعار يجب أن تكون أعداداً صحيحة غير سالبة' }, { status: 400 });
  }

  const image = parseImageField(body.imageUrl, 'bundle');
  if ('error' in image) return NextResponse.json({ error: image.error }, { status: 400 });

  const bundle = await prisma.bundle.update({
    where: { id },
    data: {
      imageUrl: image.value,
      titleAr: body.titleAr,
      titleFr: body.titleFr ?? null,
      descriptionAr: body.descriptionAr,
      descriptionFr: body.descriptionFr ?? null,
      track: body.track,
      badge: body.badge ?? null,
      hours: body.hours,
      lecturesCount: body.lecturesCount,
      originalPriceDzd: body.originalPriceDzd,
      currentPriceDzd: body.currentPriceDzd,
      colorTheme: body.colorTheme,
      isActive: body.isActive,
      sortOrder: body.sortOrder,
    },
  });

  return NextResponse.json(bundle);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requirePermission(request, 'catalog.manage');
  if ('error' in authResult) return authResult.error;

  const { id } = await params;
  await prisma.bundle.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
