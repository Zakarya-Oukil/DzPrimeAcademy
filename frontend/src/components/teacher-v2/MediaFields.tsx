'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Btn, Field, fieldClass, useTx } from '@/components/student-v2/ui';

/** Image and video fields in the new style. Same behaviour as the shared ImageUploader and VideoField: sign, then upload to storage. */

const MAX_IMAGE = 2 * 1024 * 1024;
const MAX_SIDE = 1600;
const MAX_VIDEO = 50 * 1024 * 1024;
const VIDEO_TYPES = ['video/mp4', 'video/webm'];

async function toWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  let scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  for (let attempt = 0; attempt < 5; attempt++) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const q of [0.85, 0.72, 0.6]) {
      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/webp', q));
      if (!blob) throw new Error('webp');
      if (blob.size <= MAX_IMAGE) { bitmap.close?.(); return blob; }
    }
    scale *= 0.75;
  }
  bitmap.close?.();
  throw new Error('too-big');
}

async function sign(kind: string, contentType: string, size: number) {
  const res = await fetch('/api/uploads/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, contentType, size }) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'sign');
  return json as { uploadUrl: string; publicUrl: string };
}

function put(url: string, body: Blob, onProgress: (n: number) => void, hold: (x: XMLHttpRequest | null) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    hold(xhr);
    xhr.open('PUT', url);
    xhr.upload.onprogress = (ev) => ev.lengthComputable && onProgress(Math.round((ev.loaded / ev.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('storage')));
    xhr.onerror = () => reject(new Error('network'));
    xhr.onabort = () => reject(new Error('cancelled'));
    const fd = new FormData();
    fd.append('cacheControl', '3600');
    fd.append('', body);
    xhr.send(fd);
  });
}

export const ImageField: React.FC<{ id: string; kind: 'course' | 'post'; label: string; value: string | null; onChange: (u: string | null) => void }> = ({ id, kind, label, value, onChange }) => {
  const { tx } = useTx();
  const input = useRef<HTMLInputElement>(null);
  const xhr = useRef<XMLHttpRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => () => xhr.current?.abort(), []);

  const upload = async (file: File) => {
    setError('');
    if (!file.type.startsWith('image/')) { setError(tx('اختر ملف صورة (JPEG أو PNG أو WebP).', 'Choisissez une image (JPEG, PNG ou WebP).', 'Choose an image (JPEG, PNG or WebP).')); return; }
    setBusy(true); setPct(0);
    try {
      const blob = await toWebp(file);
      const s = await sign(kind, 'image/webp', blob.size);
      await put(s.uploadUrl, blob, setPct, (x) => { xhr.current = x; });
      onChange(s.publicUrl);
    } catch (e) {
      const m = (e as Error)?.message;
      if (m !== 'cancelled') setError(m === 'too-big' ? tx('الصورة تتجاوز 2 ميغابايت حتى بعد التصغير.', 'Image encore trop lourde (2 Mo max).', 'Image is still over 2 MB after resizing.') : tx('فشل رفع الصورة. حاول مرة أخرى.', "Échec de l'envoi. Réessayez.", 'The upload failed. Try again.'));
    } finally { xhr.current = null; setBusy(false); }
  };

  return (
    <Field label={label} htmlFor={id}>
      <input ref={input} id={id} type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(f); }} />
      <div className="flex items-center gap-3 rounded-[14px] bg-sheet-card p-3">
        <span aria-hidden="true" className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-sheet-line text-[12px] text-sheet-muted">{value ? <img src={value} alt="" className="h-full w-full object-cover" /> : 'IMG'}</span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Btn variant="secondary" disabled={busy} onClick={() => input.current?.click()}>{busy ? `${pct}%` : value ? tx('تغيير الصورة', "Changer l'image", 'Change image') : tx('اختر صورة', 'Choisir une image', 'Choose an image')}</Btn>
          {value && !busy ? <Btn variant="text" onClick={() => onChange(null)}>{tx('إزالة', 'Retirer', 'Remove')}</Btn> : null}
        </div>
      </div>
      <p role="alert" className="min-h-[1.25rem] text-[13px] font-medium text-[#c0392b]">{error}</p>
    </Field>
  );
};

export const VideoUrlField: React.FC<{ id: string; kind: 'course' | 'post'; label: string; value: string | null; onChange: (u: string | null) => void }> = ({ id, kind, label, value, onChange }) => {
  const { tx } = useTx();
  const input = useRef<HTMLInputElement>(null);
  const xhr = useRef<XMLHttpRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  useEffect(() => () => xhr.current?.abort(), []);

  const addLink = () => {
    const v = draft.trim();
    if (!v) return;
    if (!/^(https:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be|vimeo\.com)\//i.test(v)) { setError(tx('الصق رابط يوتيوب أو فيميو صالحاً.', 'Collez un lien YouTube ou Vimeo valide.', 'Paste a valid YouTube or Vimeo link.')); return; }
    setError(''); onChange(v.startsWith('http') ? v : `https://${v}`); setDraft('');
  };

  const upload = async (file: File) => {
    setError('');
    if (!VIDEO_TYPES.includes(file.type)) { setError(tx('اختر ملف MP4 أو WebM.', 'Choisissez un fichier MP4 ou WebM.', 'Choose an MP4 or WebM file.')); return; }
    if (file.size > MAX_VIDEO) { setError(tx('الفيديو يتجاوز 50 ميغابايت. ارفعه على يوتيوب وألصق الرابط.', 'Plus de 50 Mo. Envoyez-la sur YouTube et collez le lien.', 'Over 50 MB. Upload it to YouTube and paste the link.')); return; }
    setBusy(true); setPct(0);
    try {
      const s = await sign(kind, file.type, file.size);
      await put(s.uploadUrl, file, setPct, (x) => { xhr.current = x; });
      onChange(s.publicUrl);
    } catch (e) {
      if ((e as Error)?.message !== 'cancelled') setError(tx('فشل رفع الفيديو. حاول مرة أخرى.', "Échec de l'envoi de la vidéo. Réessayez.", 'The video upload failed. Try again.'));
    } finally { xhr.current = null; setBusy(false); }
  };

  return (
    <Field label={label} htmlFor={id}>
      <input ref={input} type="file" accept="video/mp4,video/webm" className="sr-only" aria-label={label} disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(f); }} />
      {value ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[14px] bg-sheet-card p-3">
          <p className="min-w-0 flex-1 truncate text-[14px]" dir="ltr">{value}</p>
          <Btn variant="text" onClick={() => onChange(null)}>{tx('إزالة', 'Retirer', 'Remove')}</Btn>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input id={id} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="https://youtube.com/..." dir="ltr" className={`${fieldClass} flex-1`} />
            <Btn variant="secondary" onClick={addLink}>{tx('إضافة', 'Ajouter', 'Add')}</Btn>
          </div>
          <div><Btn variant="text" disabled={busy} onClick={() => input.current?.click()}>{busy ? `${pct}%` : tx('أو ارفع ملف فيديو (حتى 50 م.ب)', 'Ou envoyer un fichier (50 Mo max)', 'Or upload a file (up to 50 MB)')}</Btn></div>
        </div>
      )}
      <p role="alert" className="min-h-[1.25rem] text-[13px] font-medium text-[#c0392b]">{error}</p>
    </Field>
  );
};
