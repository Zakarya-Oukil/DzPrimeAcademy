import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest, requireAuth } from '@/lib/auth';
import { hasAnyPermission } from '@/lib/rbac';
import { guard } from '@/lib/http';
import { rateLimit } from '@/lib/rateLimit';
import { withRatings } from '@/lib/courseRating';

// Public numbers for one course plus, for a signed-in viewer, their own vote.
async function GETHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id }, select: { id: true } });
  if (!course) return NextResponse.json({ error: 'المقرر غير موجود' }, { status: 404 });
  const [{ rating, ratingCount }] = await withRatings([course]);
  const user = await getUserFromRequest(request);
  const mine = user ? await prisma.courseReview.findUnique({ where: { courseId_studentId: { courseId: id, studentId: user.id } }, select: { stars: true } }) : null;
  return NextResponse.json({ rating, ratingCount, mine: mine?.stars ?? null });
}

// Only a student enrolled in the course can rate it, once; rating again replaces the earlier vote.
async function POSTHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;
  const { id } = await params;

  const body = (await request.json().catch(() => null)) ?? {};
  if (!Number.isInteger(body.stars) || body.stars < 1 || body.stars > 5) {
    return NextResponse.json({ error: 'التقييم من 1 إلى 5' }, { status: 400 });
  }
  if (!rateLimit(`review:${user.id}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'عدد كبير من التقييمات، حاول لاحقاً' }, { status: 429 });
  }
  const enrolled = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId: user.id, courseId: id } }, select: { id: true } });
  if (!enrolled) return NextResponse.json({ error: 'يمكن تقييم المقررات المسجّل فيها فقط' }, { status: 403 });

  await prisma.courseReview.upsert({
    where: { courseId_studentId: { courseId: id, studentId: user.id } },
    update: { stars: body.stars },
    create: { courseId: id, studentId: user.id, stars: body.stars },
  });
  const [{ rating, ratingCount }] = await withRatings([{ id }]);
  return NextResponse.json({ rating, ratingCount, mine: body.stars });
}

// Staff with catalog rights can remove an abusive or mistaken vote: DELETE ?studentId=<id>.
async function DELETEHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  if (!hasAnyPermission(auth.user, 'catalog.manage')) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  const { id } = await params;
  const studentId = new URL(request.url).searchParams.get('studentId');
  if (!studentId) return NextResponse.json({ error: 'studentId مطلوب' }, { status: 400 });
  await prisma.courseReview.delete({ where: { courseId_studentId: { courseId: id, studentId } } });
  return NextResponse.json({ success: true });
}

export const GET = guard(GETHandler);
export const POST = guard(POSTHandler);
export const DELETE = guard(DELETEHandler);
