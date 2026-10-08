import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission(request, 'operations.manage');
  if ('error' in authResult) return authResult.error;

  const { id } = await params;
  const operation = await prisma.pendingOperation.findUnique({
    where: { id },
  });

  if (!operation) {
    return NextResponse.json({ error: 'العملية غير موجودة' }, { status: 404 });
  }

  return NextResponse.json(operation);
}
