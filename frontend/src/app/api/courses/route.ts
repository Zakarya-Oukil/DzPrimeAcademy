import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requireCatalogActor } from '@/lib/ownership';
import { parseImageField } from '@/lib/safeUrl';

export async function GET() {
  await ensureSeeded();
  const courses = await prisma.course.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(courses);
}

export async function POST(request: NextRequest) {
  const actor = await requireCatalogActor(request);
  if ('error' in actor) return actor.error;
  const { user, isStaff } = actor;

  await ensureSeeded();
  const body = (await request.json().catch(() => null)) ?? {};
  if (!body.titleAr || (body.priceDzd !== undefined && !(Number.isInteger(body.priceDzd) && body.priceDzd >= 0))) {
    return NextResponse.json({ error: 'العنوان مطلوب والسعر عدد صحيح غير سالب' }, { status: 400 });
  }
  const image = parseImageField(body.imageUrl, 'course');
  if ('error' in image) return NextResponse.json({ error: image.error }, { status: 400 });

  // A teacher's course is always theirs and starts free; pricing and re-assigning are staff decisions.
  let teacherId: string | null = isStaff ? body.teacherId || null : user.id;
  if (isStaff && teacherId && !(await prisma.user.findFirst({ where: { id: teacherId, role: 'TEACHER' }, select: { id: true } }))) {
    return NextResponse.json({ error: 'الأستاذ غير موجود' }, { status: 400 });
  }
  const teacherName = isStaff ? body.teacherName || 'أستاذ معتمد DZ Prime' : user.name;
  if (isStaff && !teacherId && teacherName) {
    const matchedTeacher = await prisma.user.findFirst({ where: { name: teacherName, role: 'TEACHER' } });
    if (matchedTeacher) teacherId = matchedTeacher.id;
  }

  const course = await prisma.course.create({
    data: {
      titleAr: body.titleAr,
      titleFr: body.titleFr || null,
      titleEn: body.titleEn || null,
      description: body.description || null,
      imageUrl: image.value ?? null,
      teacherId,
      teacherName,
      category: body.category || 'UNIVERSITY_LMD',
      lessonsCount: body.lessonsCount ?? 8,
      rating: isStaff ? body.rating ?? 5.0 : 5.0,
      priceDzd: isStaff ? body.priceDzd ?? 0 : 0,
      isLive: body.isLive ?? false,
      colorTheme: body.colorTheme || 'lime',
    },
  });

  return NextResponse.json(course, { status: 201 });
}
