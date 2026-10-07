import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { canModerate, parsePostFields, postInclude, toApiPost } from '@/lib/posts';

// Only the author, or a moderator and above, may change or remove a post.
async function loadOwned(request: NextRequest, id: string) {
  const user = await getUserFromRequest(request);
  if (!user) return { error: NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 }) };
  const post = await prisma.post.findUnique({ where: { id }, select: { id: true, authorId: true } });
  if (!post) return { error: NextResponse.json({ error: 'المنشور غير موجود' }, { status: 404 }) };
  if (post.authorId !== user.id && !canModerate(user)) {
    return { error: NextResponse.json({ error: 'لا يمكنك تعديل منشور غيرك' }, { status: 403 }) };
  }
  return { user };
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owned = await loadOwned(request, id);
  if ('error' in owned) return owned.error;

  const body = (await request.json().catch(() => null)) ?? {};
  const parsed = parsePostFields(body, true);
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const updated = await prisma.post.update({ where: { id }, data: parsed.data, include: postInclude });
  const liked = await prisma.postLike.count({ where: { postId: id, userId: owned.user.id } });
  return NextResponse.json({ success: true, message: 'تم تحديث المنشور بنجاح', post: toApiPost(updated, owned.user.id, liked > 0) });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owned = await loadOwned(request, id);
  if ('error' in owned) return owned.error;

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true, message: 'تم حذف المنشور بنجاح', deletedId: id });
}
