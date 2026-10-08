import { storageConfig } from '@/lib/safeUrl';

// Exam PDFs live in a PRIVATE bucket. The database stores a reference ("storage:<path inside the bucket>") and the
// server turns it into a link that works for 5 minutes, only for people allowed to open the file. A file under
// public/ (or a public bucket) would be downloadable by anyone who knows the URL.
export const EXAMS_BUCKET = process.env.SUPABASE_EXAMS_BUCKET || 'dz-exams';
export const STORAGE_REF = 'storage:';
const LINK_SECONDS = 300;

export const isStorageRef = (v: unknown): v is string => typeof v === 'string' && v.startsWith(STORAGE_REF);

// Returns a time-limited URL, or null when storage is not configured or the object cannot be signed.
export async function signedDownloadUrl(ref: string): Promise<string | null> {
  const cfg = storageConfig();
  const path = ref.slice(STORAGE_REF.length).replace(/^\/+/, '');
  if (!cfg || !path || path.includes('..') || path.includes('\\')) return null;
  try {
    const res = await fetch(`${cfg.url}/storage/v1/object/sign/${EXAMS_BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.key}`, apikey: cfg.key, 'content-type': 'application/json' },
      body: JSON.stringify({ expiresIn: LINK_SECONDS }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || typeof json?.signedURL !== 'string') return null;
    return `${cfg.url}/storage/v1${json.signedURL}`;
  } catch {
    return null;
  }
}
