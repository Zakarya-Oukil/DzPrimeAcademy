'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Locale } from '@/types';
import arDict from './ar.json';
import frDict from './fr.json';
import enDict from './en.json';

const dictionaries: Record<Locale, any> = {
  ar: arDict,
  fr: frDict,
  en: enDict,
};

const STORAGE_KEY = 'dz_prime_locale';

// --- Singleton Locale Store ---
let currentLocale: Locale = 'ar';
const localeListeners = new Set<() => void>();

function localeFromPath(pathname?: string | null): Locale | null {
  const first = (pathname || '').split('/').filter(Boolean)[0];
  return first === 'ar' || first === 'fr' || first === 'en' ? first : null;
}

// The URL prefix is the source of truth (the server renders from it too), so hydration matches the server.
function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'ar';
  const fromUrl = localeFromPath(window.location?.pathname);
  if (fromUrl) return fromUrl;
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale;
    if (saved === 'ar' || saved === 'fr' || saved === 'en') {
      return saved;
    }
  } catch (e) {}
  return 'ar';
}

// Initialize store in browser environment
if (typeof window !== 'undefined') {
  currentLocale = getStoredLocale();
}

function subscribeLocale(callback: () => void) {
  localeListeners.add(callback);
  return () => {
    localeListeners.delete(callback);
  };
}

function getLocaleSnapshot(): Locale {
  return currentLocale;
}

function notifyLocaleChange(newLocale: Locale) {
  currentLocale = newLocale;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.cookie = `${STORAGE_KEY}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = newLocale;
      document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
    } catch (e) {}
  }
  localeListeners.forEach((listener) => listener());
}

export function getTranslation(locale: Locale = 'ar') {
  const dict = dictionaries[locale] || dictionaries.ar;

  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let current: any = dict;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to Arabic if missing
        let fallbackCurrent: any = dictionaries.ar;
        for (const fbKey of keys) {
          if (fallbackCurrent && typeof fallbackCurrent === 'object' && fbKey in fallbackCurrent) {
            fallbackCurrent = fallbackCurrent[fbKey];
          } else {
            return path;
          }
        }
        current = fallbackCurrent;
        break;
      }
    }

    if (typeof current !== 'string') {
      return path;
    }

    let result = current;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
    }
    return result;
  };

  return { t, dict, locale, isRtl: locale === 'ar' };
}

export function useTranslation() {
  const pathname = usePathname();
  const router = useRouter();

  // Server snapshot comes from the URL, so French/English pages are rendered in their own language on the server.
  const pathLocale = localeFromPath(pathname) || 'ar';
  const locale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, () => pathLocale);

  // Sync with pathname if navigating directly to a different language prefix
  useEffect(() => {
    if (!pathname) return;
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      const first = segments[0];
      if ((first === 'ar' || first === 'fr' || first === 'en') && first !== currentLocale) {
        notifyLocaleChange(first as Locale);
      }
    }
  }, [pathname]);

  const changeLocale = useCallback(
    (newLocale: Locale) => {
      if (newLocale === currentLocale) return;

      // 1. Notify all subscribers immediately for instant UI re-render
      notifyLocaleChange(newLocale);

      // 2. Smoothly update URL route without full page refresh
      if (pathname) {
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length > 0 && (segments[0] === 'ar' || segments[0] === 'fr' || segments[0] === 'en')) {
          segments[0] = newLocale;
          const newPath = '/' + segments.join('/');
          router.replace(newPath, { scroll: false });
        } else {
          router.replace(`/${newLocale}`, { scroll: false });
        }
      }
    },
    [pathname, router]
  );

  const { t, dict, isRtl } = getTranslation(locale);

  return {
    locale,
    setLocale: changeLocale,
    t,
    dict,
    isRtl,
  };
}

