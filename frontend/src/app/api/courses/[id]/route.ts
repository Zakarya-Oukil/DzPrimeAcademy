import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { mayManage, requireCatalogActor } from '@/lib/ownership';
import { parseImageField } from '@/lib/safeUrl';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  const image = parseImageField(body.imageUrl, 'course');
  if ('error' in image) return NextResponse.json({ error: image.error }, { status: 400 });

  const course = await prisma.course.update({
    where: { id },
    data: {
      titleAr: body.titleAr,
      titleFr: body.titleFr,
      description: body.description,
      imageUrl: image.value,
      category: body.category,
      lessonsCount: body.lessonsCount,
      isLive: body.isLive,
      colorTheme: body.colorTheme,
      // Money and assignment stay with staff.
      ...(actor.isStaff ? { teacherName: body.teacherName, priceDzd: body.priceDzd } : {}),
    },
  });

  return NextResponse.json(course);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
