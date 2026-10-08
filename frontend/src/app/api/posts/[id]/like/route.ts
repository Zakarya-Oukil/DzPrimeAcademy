import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { canSeePost } from '@/lib/posts';
import { rateLimit } from '@/lib/rateLimit';

// Toggle: the server decides from what is stored, never from what the client claims it already did.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'يرجى تسجيل الدخول للإعجاب بالمنشور' }, { status: 401 });

  if (!rateLimit(`like:${user.id}`, 120, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'عدد كبير من الإعجابات، حاول لاحقاً' }, { status: 429 });
  }

  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id }, select: { id: true, isPrivate: true, isApproved: true, authorId: true } });
  if (!post || !canSeePost(user, post)) return NextResponse.json({ error: 'المنشور غير موجود' }, { status: 404 });

  const key = { postId_userId: { postId: id, userId: user.id } };
  const existing = await prisma.postLike.findUnique({ where: key });
  let liked: boolean;
  if (existing) {
    await prisma.postLike.deleteMany({ where: { postId: id, userId: user.id } });
    liked = false;
  } else {
    // A double click can race past the check above; the unique index makes the second insert a no-op.
    await prisma.postLike.createMany({ data: [{ postId: id, userId: user.id }], skipDuplicates: true });
    liked = true;
  }

  const likesCount = await prisma.postLike.count({ where: { postId: id } });
  return NextResponse.json({ success: true, postId: id, liked, likesCount, likedBy: liked ? [user.id] : [] });
}
