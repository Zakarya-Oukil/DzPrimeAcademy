import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requireCatalogActor } from '@/lib/ownership';
import { parseImageField, parseVideoField } from '@/lib/safeUrl';
import { withRatings } from '@/lib/courseRating';
import { guard } from '@/lib/http';
import { badCourseFields } from '@/lib/courseValidation';

async function GETHandler() {
  await ensureSeeded();
  const courses = await prisma.course.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(await withRatings(courses));
}

async function POSTHandler(request: NextRequest) {
  const actor = await requireCatalogActor(request);
  if ('error' in actor) return actor.error;
  const { user, isStaff } = actor;

  await ensureSeeded();
  const body = (await request.json().catch(() => null)) ?? {};
  if (!body.titleAr || (body.priceDzd !== undefined && !(Number.isInteger(body.priceDzd) && body.priceDzd >= 0))) {
    return NextResponse.json({ error: 'العنوان مطلوب والسعر عدد صحيح غير سالب' }, { status: 400 });
  }
  const bad = badCourseFields(body);
  if (bad) return NextResponse.json({ error: bad }, { status: 400 });
  const image = parseImageField(body.imageUrl, 'course');
  if ('error' in image) return NextResponse.json({ error: image.error }, { status: 400 });
  const video = parseVideoField(body.videoUrl, 'course');
  if ('error' in video) return NextResponse.json({ error: video.error }, { status: 400 });

  // A teacher's course is always theirs and starts free; pricing and re-assigning are staff decisions.
  let teacherId: string | null = isStaff ? body.teacherId || null : user.id;
  const picked = isStaff && teacherId ? await prisma.user.findFirst({ where: { id: teacherId, role: 'TEACHER' }, select: { id: true, name: true } }) : null;
  if (isStaff && teacherId && !picked) {
    return NextResponse.json({ error: 'الأستاذ غير موجود' }, { status: 400 });
  }
  const teacherName = picked ? picked.name : isStaff ? body.teacherName || 'أستاذ معتمد DZ Prime' : user.name;
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
      videoUrl: video.value ?? null,
      teacherId,
      teacherName,
      category: body.category || 'UNIVERSITY_LMD',
      lessonsCount: body.lessonsCount ?? 8,
      priceDzd: isStaff ? body.priceDzd ?? 0 : 0,
      isLive: body.isLive ?? false,
      colorTheme: body.colorTheme || 'lime',
    },
  });

  return NextResponse.json(course, { status: 201 });
}

export const GET = guard(GETHandler);
export const POST = guard(POSTHandler);
