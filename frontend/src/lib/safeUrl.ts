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
