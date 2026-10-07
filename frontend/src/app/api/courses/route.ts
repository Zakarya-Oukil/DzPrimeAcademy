import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requirePermission } from '@/lib/auth';

export async function GET() {
  await ensureSeeded();
  const courses = await prisma.course.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(courses);
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermission(request, 'catalog.manage');
  if ('error' in authResult) return authResult.error;

  await ensureSeeded();
  const body = (await request.json().catch(() => null)) ?? {};
  if (!body.titleAr || (body.priceDzd !== undefined && !(Number.isInteger(body.priceDzd) && body.priceDzd >= 0))) {
    return NextResponse.json({ error: 'العنوان مطلوب والسعر عدد صحيح غير سالب' }, { status: 400 });
  }

  let teacherId: string | null = body.teacherId || null;
  if (teacherId && !(await prisma.user.findFirst({ where: { id: teacherId, role: 'TEACHER' }, select: { id: true } }))) {
    return NextResponse.json({ error: 'الأستاذ غير موجود' }, { status: 400 });
  }
  const teacherName = body.teacherName || 'أستاذ معتمد DZ Prime';
  if (!teacherId && teacherName) {
    const matchedTeacher = await prisma.user.findFirst({ where: { name: teacherName, role: 'TEACHER' } });
    if (matchedTeacher) teacherId = matchedTeacher.id;
  }

  const course = await prisma.course.create({
    data: {
      titleAr: body.titleAr,
      titleFr: body.titleFr || null,
      titleEn: body.titleEn || null,
      description: body.description || null,
      teacherId,
      teacherName,
      category: body.category || 'UNIVERSITY_LMD',
      lessonsCount: body.lessonsCount ?? 8,
      rating: body.rating ?? 5.0,
      priceDzd: body.priceDzd ?? 0,
      isLive: body.isLive ?? false,
      colorTheme: body.colorTheme || 'lime',
    },
  });

  return NextResponse.json(course, { status: 201 });
}
