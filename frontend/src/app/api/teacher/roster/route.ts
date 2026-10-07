import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { hasAnyPermission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, ['TEACHER', 'OWNER', 'ADMIN', 'MODERATOR']);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;

  const { searchParams } = new URL(request.url);
  const requestedTeacher = searchParams.get('teacherId');
  const teacherId = requestedTeacher && hasAnyPermission(user, 'users.manage') ? requestedTeacher : user.id;

  const sessions = await prisma.liveSession.findMany({
    where: { teacherId },
    orderBy: { scheduledAt: 'asc' },
  });

  const sessionIds = sessions.map((s) => s.id);
  const registrations = await prisma.sessionRegistration.findMany({
    where: { sessionId: { in: sessionIds } },
    orderBy: { registeredAt: 'asc' },
  });

  const bySession = new Map<string, typeof registrations>();
  for (const r of registrations) {
    bySession.set(r.sessionId, [...(bySession.get(r.sessionId) || []), r]);
  }

  const result = sessions.map((s) => ({ ...s, registrations: bySession.get(s.id) || [] }));
  return NextResponse.json(result);
}
