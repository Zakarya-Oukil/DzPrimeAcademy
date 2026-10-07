import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireAuth, type SafeUser } from '@/lib/auth';
import { hasAnyPermission } from '@/lib/rbac';
import { POST_AUTHOR_ROLES } from '@/lib/posts';
import { MAX_IMAGE_BYTES, STORAGE_BUCKET, storageConfig, storagePublicBase, type UploadKind } from '@/lib/safeUrl';
import { rateLimit } from '@/lib/rateLimit';

const KINDS: UploadKind[] = ['course', 'bundle', 'post', 'landing'];

// Who may upload for what. Teachers upload course and post images; staff with the matching permission the rest.
function allowed(kind: UploadKind, user: NonNullable<SafeUser>) {
  if (kind === 'course') return user.role === 'TEACHER' || hasAnyPermission(user, 'catalog.manage');
  if (kind === 'bundle') return hasAnyPermission(user, 'catalog.manage');
  if (kind === 'landing') return hasAnyPermission(user, 'settings.manage');
  return POST_AUTHOR_ROLES.includes(user.role);
}

// Step 1 of a direct upload: the browser asks for a one-time signed URL, then sends the file straight to
// Supabase Storage (the file never passes through this server, so no 4.5MB serverless body limit).
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;

  const body = (await request.json().catch(() => null)) ?? {};
  const kind = body.kind as UploadKind;
  if (!KINDS.includes(kind)) return NextResponse.json({ error: 'نوع غير صالح' }, { status: 400 });
  if (!allowed(kind, user)) return NextResponse.json({ error: 'غير مصرح لك برفع هذه الصورة' }, { status: 403 });
  if (body.contentType !== 'image/webp') return NextResponse.json({ error: 'الصيغة المقبولة: WebP' }, { status: 400 });
  const size = Number(body.size);
  if (!Number.isInteger(size) || size < 1 || size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'حجم الصورة يجب ألا يتجاوز 2 ميغابايت' }, { status: 400 });
  }
  if (!rateLimit(`upload:${user.id}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'عدد كبير من عمليات الرفع، حاول لاحقاً' }, { status: 429 });
  }

  const cfg = storageConfig();
  const publicBase = storagePublicBase();
  if (!cfg || !publicBase) return NextResponse.json({ error: 'تخزين الصور غير مُعدّ بعد' }, { status: 503 });

  const path = `${kind}/${user.id}/${randomUUID()}.webp`;
  try {
    const res = await fetch(`${cfg.url}/storage/v1/object/upload/sign/${STORAGE_BUCKET}/${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.key}`, apikey: cfg.key, 'content-type': 'application/json' },
      body: '{}',
    });
    const signed = await res.json().catch(() => null);
    if (!res.ok || typeof signed?.url !== 'string') {
      console.error('Storage sign failed', res.status);
      return NextResponse.json({ error: 'تعذر تجهيز الرفع' }, { status: 502 });
    }
    return NextResponse.json({
      uploadUrl: `${cfg.url}/storage/v1${signed.url}`,
      publicUrl: `${publicBase}${path}`,
      path,
      maxBytes: MAX_IMAGE_BYTES,
    });
  } catch (e) {
    console.error('Storage sign error', e);
    return NextResponse.json({ error: 'تعذر تجهيز الرفع' }, { status: 502 });
  }
}
