import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { OpError, rejectOperation } from '@/lib/operations';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission(request, 'operations.manage');
  if ('error' in authResult) return authResult.error;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) ?? {};
  const adminNotes = typeof body.adminNotes === 'string' ? body.adminNotes.slice(0, 1000) : undefined;

  try {
    const operation = await rejectOperation(id, adminNotes);
    return NextResponse.json({ success: true, message: 'تم رفض العملية وتحديث الحالة', operation });
  } catch (error) {
    if (error instanceof OpError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Error rejecting operation:', error);
    return NextResponse.json({ error: 'فشل رفض العملية' }, { status: 500 });
  }
}
