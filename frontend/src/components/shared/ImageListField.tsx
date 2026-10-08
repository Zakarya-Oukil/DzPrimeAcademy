'use client';

import React from 'react';
import { X } from 'lucide-react';
import { ImageUploader } from '@/components/shared/ImageUploader';

interface ImageListFieldProps {
  value: string[];
  onChange: (urls: string[]) => void;
  locale: string;
  max?: number;
  label?: string;
}

// Up to `max` images: thumbnails with a remove button, plus the normal uploader while there is room.
export const ImageListField: React.FC<ImageListFieldProps> = ({ value, onChange, locale, max = 4, label }) => {
  const ar = locale === 'ar';
  return (
    <div className="space-y-2" data-testid="image-list-field">
      {label && (
        <span className="block text-xs font-bold text-slate-400">
          {label} ({value.length}/{max})
        </span>
      )}
      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-2">
          {value.map((url, i) => (
            <li key={url} className="relative">
              <img src={url} alt={`${ar ? 'صورة' : 'Image'} ${i + 1}`} className="w-full aspect-video rounded-xl object-cover bg-white/10 border border-white/10" />
              <button
                type="button"
                onClick={() => onChange(value.filter((u) => u !== url))}
                aria-label={ar ? `إزالة الصورة ${i + 1}` : `Remove image ${i + 1}`}
                className="absolute top-1 end-1 w-11 h-11 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center focus-visible:outline-2 focus-visible:outline-gold-400"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {value.length < max && (
        <ImageUploader kind="post" locale={locale} value={null} onChange={(url) => url && onChange([...value, url])} />
      )}
    </div>
  );
};
