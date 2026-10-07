import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requirePermission } from '@/lib/auth';

export async function GET() {
  await ensureSeeded();
  const modules = await prisma.module.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(modules);
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermission(request, 'catalog.manage');
  if ('error' in authResult) return authResult.error;

  await ensureSeeded();
  const body = await request.json();

  const mod = await prisma.module.create({
    data: {
      nameAr: body.nameAr,
      nameFr: body.nameFr || null,
      code: body.code,
      coefficient: body.coefficient ?? 1,
      academicYearId: body.academicYearId || 'year-mi-s1',
      trackType: body.trackType || 'UNIVERSITY_LMD',
      examsCount: body.examsCount ?? 0,
    },
  });

  return NextResponse.json(mod, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const authResult = await requirePermission(request, 'catalog.manage');
  if ('error' in authResult) return authResult.error;

  const body = await request.json();
  const { id, ...data } = body;

  const mod = await prisma.module.update({
    where: { id },
    data: {
      nameAr: data.nameAr,
      nameFr: data.nameFr,
      code: data.code,
      coefficient: data.coefficient,
      trackType: data.trackType,
    },
  });

  return NextResponse.json(mod);
}

export async function DELETE(request: NextRequest) {
  const authResult = await requirePermission(request, 'catalog.manage');
  if ('error' in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.module.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
