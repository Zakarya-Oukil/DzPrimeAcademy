'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Video, Upload, Trash2, X, AlertTriangle, Link as LinkIcon } from 'lucide-react';
import { VideoPlayer } from '@/components/community/VideoPlayer';

interface VideoFieldProps {
  kind: 'course' | 'post';
  value: string | null;
  onChange: (url: string | null) => void;
  locale: string;
  label?: string;
  disabled?: boolean;
}

const MAX_BYTES = 50 * 1024 * 1024;
const TYPES = ['video/mp4', 'video/webm'];

// Optional video: paste a YouTube / Vimeo link, or upload an MP4 / WebM (up to 50 MB). The file goes straight to
// storage through a one-time signed URL, the same way images do. The server re-checks whatever is saved.
export const VideoField: React.FC<VideoFieldProps> = ({ kind, value, onChange, locale, label, disabled }) => {
  const ar = locale === 'ar';
  const t = (a: string, e: string) => (ar ? a : e);
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  useEffect(() => () => xhrRef.current?.abort(), []);

  const addLink = () => {
    const v = draft.trim();
    if (!v) return;
    if (!/^(https:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be|vimeo\.com)\//i.test(v)) {
      return setError(t('الصق رابط يوتيوب أو فيميو صالحاً.', 'Paste a valid YouTube or Vimeo link.'));
    }
    setError('');
    onChange(v.startsWith('http') ? v : `https://${v}`);
    setDraft('');
  };

  const upload = async (file: File) => {
    setError('');
    if (!TYPES.includes(file.type)) return setError(t('اختر ملف MP4 أو WebM.', 'Choose an MP4 or WebM file.'));
    if (file.size > MAX_BYTES) return setError(t('الفيديو يتجاوز 50 ميغابايت. ارفعه على يوتيوب وألصق الرابط.', 'This video is over 50 MB. Upload it to YouTube and paste the link.'));
    setUploading(true);
    setProgress(0);
    try {
      const res = await fetch('/api/uploads/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, contentType: file.type, size: file.size }),
      });
      const sign = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(sign.error || 'sign');
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
        fd.append('', file);
        xhr.send(fd);
      });
      onChange(sign.publicUrl);
    } catch (e: any) {
      const m = e?.message;
      if (m !== 'cancelled') setError(m && !['sign', 'storage', 'network'].includes(m) ? m : t('فشل رفع الفيديو. حاول مرة أخرى.', 'The video upload failed. Try again.'));
    } finally {
      xhrRef.current = null;
      setUploading(false);
    }
  };

  const btn = 'min-h-11 px-4 rounded-xl text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 disabled:opacity-50 flex items-center justify-center gap-2';
  const ghost = `${btn} bg-white/10 hover:bg-white/15 text-white border border-white/15`;

  return (
    <div className="space-y-2" data-testid={`video-field-${kind}`}>
      {label && (
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
          <Video className="w-3.5 h-3.5" aria-hidden="true" /> {label}
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm"
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) upload(f);
        }}
      />

      {uploading ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3" aria-live="polite">
          <p className="text-sm font-bold text-white">{t('جارٍ رفع الفيديو', 'Uploading video')} {progress}%</p>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-gold-500 transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <button type="button" onClick={() => xhrRef.current?.abort()} className={`${ghost} w-full`}>
            <X className="w-4 h-4" /> {t('إلغاء', 'Cancel')}
          </button>
        </div>
      ) : value ? (
        <div className="space-y-2">
          <VideoPlayer url={value} title={label || t('معاينة الفيديو', 'Video preview')} />
          <button type="button" onClick={() => onChange(null)} disabled={disabled} className={`${ghost} w-full`}>
            <Trash2 className="w-4 h-4" /> {t('إزالة الفيديو', 'Remove video')}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              inputMode="url"
              dir="ltr"
              value={draft}
              disabled={disabled}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
              aria-label={t('رابط يوتيوب أو فيميو', 'YouTube or Vimeo link')}
              placeholder="https://www.youtube.com/watch?v=… / https://vimeo.com/…"
              className="min-w-0 flex-1 min-h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-gold-400 placeholder:text-gray-600"
            />
            <button type="button" onClick={addLink} disabled={disabled || !draft.trim()} className={ghost}>
              <LinkIcon className="w-4 h-4" /> {t('إضافة', 'Add')}
            </button>
          </div>
          <p className="text-center text-[11px] text-slate-500">{t('أو', 'or')}</p>
          <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled} className={`${ghost} w-full`}>
            <Upload className="w-4 h-4" /> {t('ارفع ملف فيديو (MP4 / WebM، حتى 50 ميغابايت)', 'Upload a video file (MP4 / WebM, up to 50 MB)')}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-xs text-rose-300">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
};
