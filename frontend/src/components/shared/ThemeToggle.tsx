'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useTranslation } from '@/lib/i18n/useTranslation';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, mounted } = useTheme();
  const { t } = useTranslation();

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-navy-850 border border-gray-200 dark:border-gold-500/30 animate-pulse" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={t('theme.toggle')}
      title={theme === 'light' ? t('theme.dark') : t('theme.light')}
      className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-navy-850 dark:hover:bg-navy-800 border border-slate-300 dark:border-gold-500/40 text-slate-700 dark:text-gold-300 transition-all duration-300 shadow-sm active:scale-95 flex items-center justify-center"
    >
      {theme === 'light' ? (
        <Sun className="w-4 h-4 text-amber-500" />
      ) : (
        <Moon className="w-4 h-4 text-gold-300" />
      )}
    </button>
  );
};
