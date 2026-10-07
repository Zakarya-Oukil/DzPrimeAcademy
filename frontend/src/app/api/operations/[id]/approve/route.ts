import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { OpError, approveOperation } from '@/lib/operations';

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
    const operation = await approveOperation(id, authResult.user.name || authResult.user.email, adminNotes);
    return NextResponse.json({
      success: true,
      message: 'تمت الموافقة على العملية وتفعيل الامتيازات للطالب بنجاح!',
      operation,
    });
  } catch (error) {
    if (error instanceof OpError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Error approving operation:', error);
    return NextResponse.json({ error: 'فشلت الموافقة على العملية' }, { status: 500 });
  }
}
