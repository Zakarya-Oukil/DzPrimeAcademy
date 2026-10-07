import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, type SafeUser } from '@/lib/auth';
import { hasAnyPermission } from '@/lib/rbac';

// Decision D1: teachers manage their own courses and live sessions (matched by teacherId, never by display
// name). Staff with catalog.manage manage everything.
export async function requireCatalogActor(
  request: NextRequest
): Promise<{ user: NonNullable<SafeUser>; isStaff: boolean } | { error: NextResponse }> {
  const authResult = await requireAuth(request);
  if ('error' in authResult) return authResult;
  const isStaff = hasAnyPermission(authResult.user, 'catalog.manage');
  if (!isStaff && authResult.user.role !== 'TEACHER') {
    return { error: NextResponse.json({ error: 'لا تملك صلاحية الوصول لهذا الإجراء' }, { status: 403 }) };
  }
  return { user: authResult.user, isStaff };
}

export const mayManage = (actor: { user: NonNullable<SafeUser>; isStaff: boolean }, record: { teacherId: string | null }) =>
  actor.isStaff || (actor.user.role === 'TEACHER' && record.teacherId === actor.user.id);
