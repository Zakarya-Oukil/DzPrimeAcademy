import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission(request, 'operations.manage');
  if ('error' in authResult) return authResult.error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { adminNotes } = body;

  const operation = await prisma.pendingOperation.findUnique({
    where: { id },
  });

  if (!operation) {
    return NextResponse.json({ error: 'العملية غير موجودة' }, { status: 404 });
  }

  const updated = await prisma.pendingOperation.update({
    where: { id },
    data: {
      status: 'REJECTED',
      adminNotes: adminNotes || 'تم الرفض بواسطة الإدارة',
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    message: 'تم رفض العملية وتحديث الحالة',
    operation: updated,
  });
}
