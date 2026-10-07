'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, AlertTriangle, RefreshCw, Trash2, X } from 'lucide-react';

export type ImageUploadKind = 'course' | 'bundle' | 'post' | 'landing';

interface ImageUploaderProps {
  kind: ImageUploadKind;
  value?: string | null;
  onChange: (url: string | null) => void;
  locale: string;
  label?: string;
  disabled?: boolean;
}

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_SIDE = 1600;

type Phase = 'idle' | 'uploading' | 'error';

// Resize in the browser and save as WebP so the server and the bucket only ever see small, uniform files.
async function toWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  let scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  for (let attempt = 0; attempt < 5; attempt++) {
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, w, h);
    for (const quality of [0.85, 0.72, 0.6]) {
      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/webp', quality));
      if (!blob) throw new Error('webp-unsupported');
      if (blob.size <= MAX_BYTES) {
        bitmap.close?.();
        return blob;
      }
    }
    scale *= 0.75;
  }
  bitmap.close?.();
  throw new Error('too-big');
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ kind, value, onChange, locale, label, disabled }) => {
  const ar = locale === 'ar';
  const t = (a: string, e: string) => (ar ? a : e);

  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState('');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => () => xhrRef.current?.abort(), []);

  const fail = useCallback((msg: string) => {
    setPhase('error');
    setError(msg);
    setPreview(null);
  }, []);

  const upload = useCallback(
    async (file: File) => {
      setError('');
      if (!file.type.startsWith('image/')) return fail(t('اختر ملف صورة (JPEG أو PNG أو WebP).', 'Choose an image file (JPEG, PNG or WebP).'));
      setPhase('uploading');
      setProgress(0);
      setFileInfo(`${file.name}, ${(file.size / 1024 / 1024).toFixed(1)} MB`);
      setPreview(URL.createObjectURL(file));

      let blob: Blob;
      try {
        blob = await toWebp(file);
      } catch (e: any) {
        return fail(
          e?.message === 'too-big'
            ? t('الصورة تتجاوز 2 ميغابايت حتى بعد التصغير. اختر صورة أصغر.', 'This image is still over 2 MB after resizing. Choose a smaller one.')
            : t('تعذر قراءة هذه الصورة. جرّب ملفاً آخر.', 'This image could not be read. Try another file.')
        );
      }

      try {
        const res = await fetch('/api/uploads/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind, contentType: 'image/webp', size: blob.size }),
        });
        const sign = await res.json().catch(() => ({}));
        if (!res.ok) return fail(sign.error || t('تعذر تجهيز الرفع.', 'Upload could not be prepared.'));

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;
          xhr.open('PUT', sign.uploadUrl);
          xhr.upload.onprogress = (ev) => ev.lengthComputable && setProgress(Math.round((ev.loaded / ev.total) * 100));
          xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('storage')));
          xhr.onerror = () => reject(new Error('network'));
          xhr.onabort = () => reject(new Error('cancelled'));
          const fd = new FormData();
          fd.append('cacheControl', '3600');
          fd.append('', blob);
          xhr.send(fd);
        });
        xhrRef.current = null;
        setPhase('idle');
        setPreview(null);
        onChange(sign.publicUrl);
      } catch (e: any) {
        xhrRef.current = null;
        if (e?.message === 'cancelled') {
          setPhase('idle');
          setPreview(null);
          return;
        }
        fail(t('فشل رفع الصورة. تحقق من الاتصال وحاول مرة أخرى.', 'The upload failed. Check your connection and try again.'));
      }
    },
    [kind, onChange, fail, ar] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const pick = () => !disabled && inputRef.current?.click();
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) upload(f);
  };

  const btn = 'min-h-11 px-4 rounded-xl text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 disabled:opacity-50';
  const ghost = `${btn} bg-white/10 hover:bg-white/15 text-white border border-white/15 flex items-center justify-center gap-2`;
  const primary = `${btn} bg-gold-500 hover:bg-gold-400 text-navy-950 flex items-center justify-center gap-2`;

  return (
    <div className="space-y-2" data-testid={`image-uploader-${kind}`}>
      {label && <span className="block text-xs font-bold text-slate-400">{label}</span>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} onChange={onFile} disabled={disabled} />

      {phase === 'uploading' ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3" aria-live="polite">
          <div className="flex items-center gap-3">
            {preview && <img src={preview} alt="" className="h-[72px] w-[72px] rounded-xl object-cover bg-white/10" />}
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm font-bold text-white">{t('جارٍ الرفع', 'Uploading')} {progress}%</p>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-gold-500 transition-[width]" style={{ width: `${progress}%` }} />
              </div>
              <p className="truncate text-xs text-slate-400">{fileInfo}</p>
            </div>
          </div>
          <button type="button" onClick={() => xhrRef.current?.abort()} className={`${ghost} w-full`}>
            <X className="w-4 h-4" /> {t('إلغاء', 'Cancel')}
          </button>
        </div>
      ) : value ? (
        <div className="space-y-2">
          <img src={value} alt={label || t('معاينة الصورة', 'Image preview')} className="w-full aspect-video rounded-2xl object-cover bg-white/10 border border-white/10" />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={pick} disabled={disabled} className={ghost}>
              <RefreshCw className="w-4 h-4" /> {t('استبدال', 'Replace')}
            </button>
            <button type="button" onClick={() => onChange(null)} disabled={disabled} className={ghost}>
              <Trash2 className="w-4 h-4" /> {t('إزالة', 'Remove')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f && !disabled) upload(f); }}
            className={`rounded-2xl border-[1.5px] border-dashed p-6 flex flex-col items-center gap-2 text-center ${
              phase === 'error' ? 'border-rose-400/60' : dragging ? 'border-gold-400' : 'border-white/25'
            } bg-white/[0.03]`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${phase === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-gold-500/20 text-gold-400'}`}>
              {phase === 'error' ? <AlertTriangle className="w-5 h-5" /> : <ImagePlus className="w-5 h-5" />}
            </div>
            {phase === 'error' ? (
              <>
                <p className="text-sm font-bold text-white">{t('فشل الرفع', 'Upload failed')}</p>
                <p role="alert" className="max-w-xs text-xs text-rose-300">{error}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-white">{t('أضف صورة', 'Add an image')}</p>
                <p className="max-w-xs text-xs text-slate-400">{t('JPEG أو PNG أو WebP. تُصغَّر وتُحفظ بصيغة WebP حتى 2 ميغابايت.', 'JPEG, PNG or WebP. Resized and saved as WebP, up to 2 MB.')}</p>
              </>
            )}
          </div>
          <button type="button" onClick={pick} disabled={disabled} className={`${primary} w-full`}>
            {phase === 'error' ? t('اختر صورة أخرى', 'Choose another image') : t('اختر صورة', 'Choose image')}
          </button>
        </div>
      )}
    </div>
  );
};
