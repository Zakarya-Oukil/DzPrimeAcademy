import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { canSeePost, text, toApiComment } from '@/lib/posts';

async function visiblePost(request: NextRequest, id: string) {
  const user = await getUserFromRequest(request);
  const post = await prisma.post.findUnique({ where: { id }, select: { id: true, isPrivate: true, isApproved: true, authorId: true } });
  // Same answer for "missing" and "not allowed to see": do not reveal that a private post exists.
  if (!post || !canSeePost(user, post)) return { user, post: null };
  return { user, post };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { post } = await visiblePost(request, id);
  if (!post) return NextResponse.json({ error: 'المنشور غير موجود' }, { status: 404 });

  const comments = await prisma.postComment.findMany({ where: { postId: id }, orderBy: { createdAt: 'asc' }, take: 200 });
  return NextResponse.json({ success: true, postId: id, comments: comments.map(toApiComment) });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, post } = await visiblePost(request, id);
  if (!user) return NextResponse.json({ error: 'يرجى تسجيل الدخول للتعليق على المنشور' }, { status: 401 });
  if (!post) return NextResponse.json({ error: 'المنشور غير موجود' }, { status: 404 });
  if (!rateLimit(`comment:${user.id}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'عدد كبير من التعليقات، حاول لاحقاً' }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) ?? {};
  const content = text(body.content, 1000);
  if (!content) return NextResponse.json({ error: 'محتوى التعليق لا يمكن أن يكون فارغاً' }, { status: 400 });

  const comment = await prisma.postComment.create({
    data: {
      postId: id,
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar ?? null,
      authorRole: user.role,
      content,
      isVerifiedTeacher: user.role === 'TEACHER',
    },
  });

  return NextResponse.json({ success: true, comment: toApiComment(comment), message: 'تمت إضافة التعليق بنجاح' });
}
