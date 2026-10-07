import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requirePermission(request, 'catalog.manage');
  if ('error' in authResult) return authResult.error;

  const { id } = await params;
  const body = await request.json();
  const session = await prisma.liveSession.update({
    where: { id },
    data: {
      title: body.title,
      teacherName: body.teacherName,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      durationMinutes: body.durationMinutes,
      platform: body.platform,
      meetUrl: body.meetUrl,
      status: body.status,
    },
  });

  return NextResponse.json(session);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requirePermission(request, 'catalog.manage');
  if ('error' in authResult) return authResult.error;

  const { id } = await params;
  await prisma.sessionRegistration.deleteMany({ where: { sessionId: id } });
  await prisma.liveSession.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
