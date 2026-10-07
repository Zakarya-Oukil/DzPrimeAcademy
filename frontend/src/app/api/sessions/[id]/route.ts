import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { mayManage, requireCatalogActor } from '@/lib/ownership';
import { isHttpsUrl } from '@/lib/safeUrl';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireCatalogActor(request);
  if ('error' in actor) return actor.error;

  const { id } = await params;
  const existing = await prisma.liveSession.findUnique({ where: { id }, select: { id: true, teacherId: true } });
  if (!existing) return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 });
  if (!mayManage(actor, existing)) return NextResponse.json({ error: 'يمكنك تعديل حصصك فقط' }, { status: 403 });

  const body = (await request.json().catch(() => null)) ?? {};
  if (body.meetUrl && !isHttpsUrl(body.meetUrl)) return NextResponse.json({ error: 'رابط الحصة يجب أن يبدأ بـ https://' }, { status: 400 });
  const when = body.scheduledAt ? new Date(body.scheduledAt) : undefined;
  if (when && Number.isNaN(when.getTime())) return NextResponse.json({ error: 'تاريخ غير صالح' }, { status: 400 });

  const session = await prisma.liveSession.update({
    where: { id },
    data: {
      title: body.title,
      scheduledAt: when,
      durationMinutes: body.durationMinutes,
      platform: body.platform,
      meetUrl: body.meetUrl,
      status: body.status,
      ...(actor.isStaff ? { teacherName: body.teacherName } : {}),
    },
  });

  return NextResponse.json(session);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireCatalogActor(request);
  if ('error' in actor) return actor.error;

  const { id } = await params;
  const existing = await prisma.liveSession.findUnique({ where: { id }, select: { id: true, teacherId: true } });
  if (!existing) return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 });
  if (!mayManage(actor, existing)) return NextResponse.json({ error: 'يمكنك حذف حصصك فقط' }, { status: 403 });

  // Also correct before the phase 2 foreign keys exist on the live DB (they cascade this on their own).
  await prisma.sessionRegistration.deleteMany({ where: { sessionId: id } });
  await prisma.liveSession.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
