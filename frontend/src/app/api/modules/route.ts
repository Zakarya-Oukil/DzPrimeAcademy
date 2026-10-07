import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requirePermission } from '@/lib/auth';
import { guard, textProblem, intInRange, badField } from '@/lib/http';

const TRACKS = ['BAC', 'UNIVERSITY_LMD', 'MEDICAL'];

// Shared field checks for create and edit; returns the offending field name or null.
function moduleProblem(b: any, creating: boolean): string | null {
  if (!b || typeof b !== 'object') return 'body';
  const t = textProblem({ nameAr: [b.nameAr, 160], nameFr: [b.nameFr, 160], code: [b.code, 40], academicYearId: [b.academicYearId, 80] });
  if (t) return t;
  if (creating && (!b.nameAr || !b.code)) return 'nameAr/code';
  if (!creating && (b.nameAr === '' || b.code === '')) return 'nameAr/code';
  if (!intInRange(b.coefficient, 1, 20)) return 'coefficient';
  if (!intInRange(b.examsCount, 0, 100000)) return 'examsCount';
  if (b.trackType !== undefined && !TRACKS.includes(b.trackType)) return 'trackType';
  return null;
}

async function GETHandler() {
  await ensureSeeded();
  const modules = await prisma.module.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 });
  return NextResponse.json(modules);
}

async function POSTHandler(request: NextRequest) {
  const authResult = await requirePermission(request, 'catalog.manage');
  if ('error' in authResult) return authResult.error;

  await ensureSeeded();
  const body = await request.json();
  const bad = moduleProblem(body, true);
  if (bad) return badField(bad);

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

async function PUTHandler(request: NextRequest) {
  const authResult = await requirePermission(request, 'catalog.manage');
  if ('error' in authResult) return authResult.error;

  const body = await request.json();
  const bad = moduleProblem(body, false);
  if (bad) return badField(bad);
  const { id, ...data } = body;
  if (typeof id !== 'string') return badField('id');

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

async function DELETEHandler(request: NextRequest) {
  const authResult = await requirePermission(request, 'catalog.manage');
  if ('error' in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.module.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export const GET = guard(GETHandler);
export const POST = guard(POSTHandler);
export const PUT = guard(PUTHandler);
export const DELETE = guard(DELETEHandler);
