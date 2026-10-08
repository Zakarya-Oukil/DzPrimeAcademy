import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { mayManage, requireCatalogActor } from '@/lib/ownership';
import { parseImageField, parseVideoField } from '@/lib/safeUrl';
import { guard } from '@/lib/http';
import { badCourseFields } from '@/lib/courseValidation';

async function PUTHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireCatalogActor(request);
  if ('error' in actor) return actor.error;

  const { id } = await params;
  const existing = await prisma.course.findUnique({ where: { id }, select: { id: true, teacherId: true } });
  if (!existing) return NextResponse.json({ error: 'المقرر غير موجود' }, { status: 404 });
  if (!mayManage(actor, existing)) return NextResponse.json({ error: 'يمكنك تعديل مقرراتك فقط' }, { status: 403 });

  const body = (await request.json().catch(() => null)) ?? {};
  if (actor.isStaff && body.priceDzd !== undefined && !(Number.isInteger(body.priceDzd) && body.priceDzd >= 0)) {
    return NextResponse.json({ error: 'السعر يجب أن يكون عدداً صحيحاً غير سالب' }, { status: 400 });
  }
  const bad = badCourseFields(body);
  if (bad) return NextResponse.json({ error: bad }, { status: 400 });
  const image = parseImageField(body.imageUrl, 'course');
  if ('error' in image) return NextResponse.json({ error: image.error }, { status: 400 });
  const video = parseVideoField(body.videoUrl, 'course');
  if ('error' in video) return NextResponse.json({ error: video.error }, { status: 400 });

  // Staff may re-assign the teacher; the name follows the account.
  let teacher: { id: string; name: string } | null | undefined;
  if (actor.isStaff && body.teacherId !== undefined) {
    teacher = body.teacherId ? await prisma.user.findFirst({ where: { id: body.teacherId, role: 'TEACHER' }, select: { id: true, name: true } }) : null;
    if (body.teacherId && !teacher) return NextResponse.json({ error: 'الأستاذ غير موجود' }, { status: 400 });
  }

  const course = await prisma.course.update({
    where: { id },
    data: {
      titleAr: body.titleAr,
      titleFr: body.titleFr,
      titleEn: body.titleEn,
      description: body.description,
      imageUrl: image.value,
      videoUrl: video.value,
      category: body.category,
      lessonsCount: body.lessonsCount,
      isLive: body.isLive,
      colorTheme: body.colorTheme,
      // Money and assignment stay with staff.
      ...(actor.isStaff
        ? {
            priceDzd: body.priceDzd,
            ...(teacher ? { teacherId: teacher.id, teacherName: teacher.name } : teacher === null ? { teacherId: null, teacherName: body.teacherName || undefined } : { teacherName: body.teacherName }),
          }
        : {}),
    },
  });

  return NextResponse.json(course);
}

async function DELETEHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireCatalogActor(request);
  if ('error' in actor) return actor.error;

  const { id } = await params;
  const existing = await prisma.course.findUnique({ where: { id }, select: { id: true, teacherId: true } });
  if (!existing) return NextResponse.json({ error: 'المقرر غير موجود' }, { status: 404 });
  if (!mayManage(actor, existing)) return NextResponse.json({ error: 'يمكنك حذف مقرراتك فقط' }, { status: 403 });

  // Deleting a course removes its students' enrollments; a teacher may not do that, staff may.
  if (!actor.isStaff && (await prisma.enrollment.count({ where: { courseId: id } })) > 0) {
    return NextResponse.json({ error: 'لا يمكن حذف مقرر مسجّل فيه طلبة، تواصل مع الإدارة' }, { status: 409 });
  }

  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export const PUT = guard(PUTHandler);
export const DELETE = guard(DELETEHandler);
