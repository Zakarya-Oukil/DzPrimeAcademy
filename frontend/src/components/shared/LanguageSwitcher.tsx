'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { Locale } from '@/types';
import { useTranslation } from '@/lib/i18n/useTranslation';

export const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale } = useTranslation();

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: 'ar', label: 'العربية', flag: '🇩🇿' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-navy-850 border border-slate-300 dark:border-gold-500/30 text-xs shadow-inner">
      {languages.map((lang) => {
        const isActive = locale === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            type="button"
            className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 text-[11px] font-semibold select-none cursor-pointer ${
              isActive
                ? 'bg-gold-500 text-navy-950 shadow-gold-glow font-bold'
                : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800'
            }`}
          >
            <span>{lang.flag}</span>
            <span className="hidden sm:inline">{lang.label}</span>
          </button>
        );
      })}
    </div>
  );
};
