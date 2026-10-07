import { Prisma } from '@prisma/client';
import { isGeneralAdmin } from '@/lib/rbac';
import type { SafeUser } from '@/lib/auth';
import { isHttpsUrl, parseImageField } from '@/lib/safeUrl';

export const POST_AUTHOR_ROLES = ['TEACHER', 'AMBASSADOR', 'OWNER', 'ADMIN', 'MODERATOR'];
export const POST_TYPES = ['EVENT', 'STUDY_TIP', 'SESSION_SCHEDULE', 'ANNOUNCEMENT'] as const;

// Moderation is for MODERATOR accounts and general admins (and above). Finance, commercial and HR staff manage
// other things and are not moderators by that role alone.
export const canModerate = (user: SafeUser) => !!user && (user.role === 'MODERATOR' || isGeneralAdmin(user));

// Private posts are for members: paid students, teachers, ambassadors and staff. Free students and visitors
// do not see them. Authors always see their own posts.
export function canSeePrivate(user: SafeUser) {
  return !!user && user.role !== 'STUDENT_FREE';
}

export function visibleWhere(user: SafeUser): Prisma.PostWhereInput {
  if (!user) return { isPrivate: false, isApproved: true };
  if (canModerate(user)) return {};
  const base: Prisma.PostWhereInput[] = [{ isApproved: true, ...(canSeePrivate(user) ? {} : { isPrivate: false }) }, { authorId: user.id }];
  return { OR: base };
}

export function canSeePost(user: SafeUser, post: { isPrivate: boolean; isApproved: boolean; authorId: string }) {
  if (user && (canModerate(user) || post.authorId === user.id)) return true;
  if (!post.isApproved) return false;
  return !post.isPrivate || canSeePrivate(user);
}

export const postInclude = {
  comments: { orderBy: { createdAt: 'asc' as const }, take: 50 },
  _count: { select: { likes: true } },
} satisfies Prisma.PostInclude;

type PostRow = Prisma.PostGetPayload<{ include: typeof postInclude }>;

// DB row -> the shape the feed already uses. likedBy only ever holds the viewer's own id: other people's
// ids are not exposed, the count comes from likesCount.
export function toApiPost(p: PostRow, viewerId: string | null, likedByViewer: boolean) {
  return {
    id: p.id,
    title: p.title,
    content: p.content,
    type: p.type,
    wilayaCode: p.wilayaCode ?? undefined,
    wilayaName: p.wilayaName ?? undefined,
    institutionId: p.institutionId ?? undefined,
    institutionName: p.institutionName ?? undefined,
    eventDate: p.eventDate?.toISOString(),
    isOnline: p.isOnline,
    meetUrl: p.meetUrl ?? undefined,
    location: p.location ?? undefined,
    isApproved: p.isApproved,
    authorId: p.authorId,
    authorName: p.authorName,
    authorAvatar: p.authorAvatar ?? undefined,
    authorRole: p.authorRole,
    imageUrl: p.imageUrl ?? undefined,
    videoUrl: p.videoUrl ?? undefined,
    linkUrl: p.linkUrl ?? undefined,
    isPrivate: p.isPrivate,
    likesCount: p._count.likes,
    likedBy: viewerId && likedByViewer ? [viewerId] : [],
    comments: p.comments.map(toApiComment),
    createdAt: p.createdAt.toISOString(),
  };
}

export function toApiComment(c: { id: string; postId: string; authorId: string; authorName: string; authorAvatar: string | null; authorRole: string; content: string; isVerifiedTeacher: boolean; createdAt: Date }) {
  return {
    id: c.id,
    postId: c.postId,
    authorId: c.authorId,
    authorName: c.authorName,
    authorAvatar: c.authorAvatar ?? undefined,
    authorRole: c.authorRole,
    content: c.content,
    isVerifiedTeacher: c.isVerifiedTeacher,
    createdAt: c.createdAt.toISOString(),
  };
}

export const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Shared by create and edit. Only fields present in the body are returned; every URL is checked.
export function parsePostFields(body: Record<string, unknown>, partial: boolean): { data: Prisma.PostUncheckedUpdateInput } | { error: string } {
  const data: Prisma.PostUncheckedUpdateInput = {};

  if (!partial || body.title !== undefined) {
    const title = text(body.title, 200);
    if (!title) return { error: 'عنوان المنشور مطلوب' };
    data.title = title;
  }
  if (!partial || body.content !== undefined) {
    const content = text(body.content, 5000);
    if (!content) return { error: 'محتوى المنشور مطلوب' };
    data.content = content;
  }
  if (body.type !== undefined) {
    if (!(POST_TYPES as readonly string[]).includes(body.type as string)) return { error: 'نوع المنشور غير صالح' };
    data.type = body.type as (typeof POST_TYPES)[number];
  }
  for (const f of ['videoUrl', 'linkUrl', 'meetUrl'] as const) {
    if (body[f] === undefined) continue;
    if (body[f] === null || body[f] === '') data[f] = null;
    else if (isHttpsUrl(body[f])) data[f] = body[f] as string;
    else return { error: 'الروابط يجب أن تبدأ بـ https://' };
  }
  const image = parseImageField(body.imageUrl, 'post');
  if ('error' in image) return { error: image.error };
  if (image.value !== undefined) data.imageUrl = image.value;

  if (body.eventDate !== undefined) {
    const d = body.eventDate ? new Date(String(body.eventDate)) : null;
    if (d && Number.isNaN(d.getTime())) return { error: 'تاريخ الحدث غير صالح' };
    data.eventDate = d;
  }
  if (body.isPrivate !== undefined) data.isPrivate = Boolean(body.isPrivate);
  if (body.isOnline !== undefined) data.isOnline = Boolean(body.isOnline);
  if (body.location !== undefined) data.location = text(body.location, 200) || null;
  if (body.institutionName !== undefined) data.institutionName = text(body.institutionName, 150) || null;
  if (body.wilayaName !== undefined) data.wilayaName = text(body.wilayaName, 80) || null;
  if (body.wilayaCode !== undefined && body.wilayaCode !== null && body.wilayaCode !== '') {
    const w = Number(body.wilayaCode);
    if (!Number.isInteger(w) || w < 1 || w > 58) return { error: 'رمز الولاية غير صالح' };
    data.wilayaCode = w;
  }
  return { data };
}
