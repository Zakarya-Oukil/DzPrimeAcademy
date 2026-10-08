// One place that decides which URLs the platform stores. Anything that ends up in an <img src>, <a href> or
// <iframe src> goes through here first (no javascript:, data:, http: or look-alike hosts).

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'dz-images';

export type UploadKind = 'course' | 'bundle' | 'post' | 'landing';

export function storageConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

// Public URL prefix of objects uploaded through /api/uploads/image, e.g. https://x.supabase.co/storage/v1/object/public/dz-images/
export function storagePublicBase(): string | null {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  return url ? `${url}/storage/v1/object/public/${STORAGE_BUCKET}/` : null;
}

export function isHttpsUrl(v: unknown, max = 500): v is string {
  if (typeof v !== 'string' || v.length === 0 || v.length > max) return false;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && !u.username && !u.password;
  } catch {
    return false;
  }
}

// An image we stored ourselves, for the right kind of record. Nothing else is accepted as an imageUrl.
export function isUploadedImageUrl(v: unknown, kind: UploadKind): v is string {
  const base = storagePublicBase();
  if (!base || typeof v !== 'string' || v.length > 600 || !v.startsWith(`${base}${kind}/`)) return false;
  // https always; plain http only for a local storage stub outside production.
  const localStub = process.env.NODE_ENV !== 'production' && v.startsWith('http://localhost');
  if (!isHttpsUrl(v, 600) && !localStub) return false;
  // Exact shape of what /api/uploads/image hands out: <kind>/<user id>/<uuid>.webp. No query, fragment,
  // encoded dots or extra segments, so the URL cannot point at any other object in the project.
  return /^[A-Za-z0-9_-]{8,40}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/.test(v.slice(base.length + kind.length + 1));
}

// Validates an optional imageUrl field: undefined = leave alone, null/'' = clear, otherwise must be one of ours.
export function parseImageField(v: unknown, kind: UploadKind): { value: string | null | undefined } | { error: string } {
  if (v === undefined) return { value: undefined };
  if (v === null || v === '') return { value: null };
  if (isUploadedImageUrl(v, kind)) return { value: v };
  return { error: 'الصورة يجب أن تُرفع عبر المنصة (WebP، حتى 2 ميغابايت)' };
}

// Videos. Two sources are accepted and nothing else: a file we stored (video/<kind>/<user id>/<uuid>.mp4|webm,
// signed by /api/uploads/image) or a YouTube / Vimeo link, which is rewritten to its canonical form so what is
// stored is always one of three known shapes.
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // the most Supabase's free plan accepts per file
export const VIDEO_EXT: Record<string, string> = { 'video/mp4': 'mp4', 'video/webm': 'webm' };
export const MAX_POST_IMAGES = 4;

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const YOUTUBE = /^(?:https:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^#\s]*&)?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?:[?&#/][^\s]*)?$/;
const VIMEO = /^https:\/\/(?:www\.)?vimeo\.com\/(\d{6,12})(?:[/?#][^\s]*)?$/;

export function isUploadedVideoUrl(v: unknown, kind: UploadKind): v is string {
  const base = storagePublicBase();
  const prefix = `video/${kind}/`;
  if (!base || typeof v !== 'string' || v.length > 600 || !v.startsWith(`${base}${prefix}`)) return false;
  const localStub = process.env.NODE_ENV !== 'production' && v.startsWith('http://localhost');
  if (!isHttpsUrl(v, 600) && !localStub) return false;
  return new RegExp(`^[A-Za-z0-9_-]{8,40}/${UUID}\\.(mp4|webm)$`).test(v.slice(base.length + prefix.length));
}

// Same contract as parseImageField: undefined = leave alone, null/'' = clear, otherwise valid or an error.
export function parseVideoField(v: unknown, kind: UploadKind): { value: string | null | undefined } | { error: string } {
  if (v === undefined) return { value: undefined };
  if (v === null || v === '') return { value: null };
  if (typeof v !== 'string' || v.length > 600) return { error: 'رابط الفيديو غير صالح' };
  const s = v.trim();
  if (isUploadedVideoUrl(s, kind)) return { value: s };
  const yt = YOUTUBE.exec(s);
  if (yt) return { value: `https://www.youtube.com/watch?v=${yt[1]}` };
  const vm = VIMEO.exec(s);
  if (vm) return { value: `https://vimeo.com/${vm[1]}` };
  return { error: 'الفيديو: رابط YouTube أو Vimeo، أو ملف MP4/WebM يُرفع عبر المنصة (حتى 50 ميغابايت)' };
}

// Up to MAX_POST_IMAGES uploaded images. undefined = leave alone.
export function parseImageList(v: unknown, kind: UploadKind): { value: string[] | undefined } | { error: string } {
  if (v === undefined) return { value: undefined };
  if (v === null) return { value: [] };
  if (!Array.isArray(v) || v.length > MAX_POST_IMAGES) return { error: `حتى ${MAX_POST_IMAGES} صور لكل منشور` };
  if (!v.every((u) => isUploadedImageUrl(u, kind))) return { error: 'الصور يجب أن تُرفع عبر المنصة (WebP، حتى 2 ميغابايت)' };
  return { value: [...new Set(v as string[])] };
}

// Landing config is stored as JSON; images in it must be URLs, never inline data.
// Browsers ignore tabs and newlines inside a URL scheme ("da\nta:"), so strip them before testing.
const UNSAFE_SCHEME = /^(data|javascript|vbscript):/i;
export const isUnsafeUrlString = (s: string) => UNSAFE_SCHEME.test(s.replace(/[\s\u0000-\u001f]/g, ''));

export function containsDataUri(value: unknown): boolean {
  if (typeof value === 'string') return isUnsafeUrlString(value);
  if (Array.isArray(value)) return value.some(containsDataUri);
  if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>).some(containsDataUri);
  return false;
}

// Replaces every unsafe-scheme string (inline images, javascript: links) with '' and counts them.
export function stripUnsafeUrls<T>(value: T): { value: T; removed: number } {
  let removed = 0;
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') {
      if (isUnsafeUrlString(v)) { removed++; return ''; }
      return v;
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return { value: walk(value) as T, removed };
}
