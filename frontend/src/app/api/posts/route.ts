import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { POST_AUTHOR_ROLES, POST_TYPES, parsePostFields, postInclude, toApiPost, visibleWhere } from '@/lib/posts';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const currentUser = await getUserFromRequest(request);

  const filters: Record<string, unknown>[] = [visibleWhere(currentUser)];
  const authorId = searchParams.get('authorId');
  const type = searchParams.get('type');
  const mediaType = searchParams.get('mediaType'); // 'video' | 'image'
  const wilayaCode = Number(searchParams.get('wilayaCode'));
  if (authorId) filters.push({ authorId });
  if (type && (POST_TYPES as readonly string[]).includes(type)) filters.push({ type });
  if (mediaType === 'video') filters.push({ videoUrl: { not: null } });
  if (mediaType === 'image') filters.push({ imageUrls: { isEmpty: false } });
  if (Number.isInteger(wilayaCode) && wilayaCode > 0) filters.push({ wilayaCode });

  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), 100);
  const posts = await prisma.post.findMany({
    where: { AND: filters },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: postInclude,
  });

  const liked = currentUser
    ? new Set((await prisma.postLike.findMany({ where: { userId: currentUser.id, postId: { in: posts.map((p) => p.id) } }, select: { postId: true } })).map((l) => l.postId))
    : new Set<string>();

  return NextResponse.json({
    success: true,
    posts: posts.map((p) => toApiPost(p, currentUser?.id ?? null, liked.has(p.id))),
    total: posts.length,
    isAuthenticated: Boolean(currentUser),
  });
}

export async function POST(request: NextRequest) {
  const currentUser = await getUserFromRequest(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول لنشر المقالات ومقاطع الفيديو' }, { status: 401 });
  }
  if (!POST_AUTHOR_ROLES.includes(currentUser.role)) {
    return NextResponse.json({ error: 'النشر محصور حصرياً بالأساتذة، السفراء والطاقم الإداري' }, { status: 403 });
  }
  if (!rateLimit(`post:${currentUser.id}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'عدد كبير من المنشورات، حاول لاحقاً' }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) ?? {};
  const parsed = parsePostFields(body, false);
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const f = parsed.data as Record<string, any>;

  const created = await prisma.post.create({
    data: {
      title: f.title,
      content: f.content,
      type: f.type ?? 'STUDY_TIP',
      wilayaCode: f.wilayaCode ?? currentUser.wilayaCode ?? 16,
      wilayaName: f.wilayaName ?? currentUser.wilayaName ?? null,
      institutionName: f.institutionName ?? currentUser.institutionName ?? null,
      isOnline: Boolean(f.isOnline || f.meetUrl || f.videoUrl),
      location: f.location ?? null,
      meetUrl: f.meetUrl ?? null,
      videoUrl: f.videoUrl ?? null,
      imageUrls: f.imageUrls ?? [],
      linkUrl: f.linkUrl ?? null,
      isPrivate: Boolean(f.isPrivate),
      isApproved: true,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar ?? null,
      authorRole: currentUser.role,
    },
    include: postInclude,
  });

  return NextResponse.json({ success: true, post: toApiPost(created, currentUser.id, false), message: 'تم نشر المحتوى بنجاح' });
}
