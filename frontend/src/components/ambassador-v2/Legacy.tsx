'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';

/** With the design switch off, the new Ambassador routes send people back to the current tabbed page. */
export const LegacyTab: React.FC<{ tab: string }> = ({ tab }) => {
  const router = useRouter();
  const { locale } = useTranslation();
  useEffect(() => { router.replace(`/${locale}/ambassador#${tab}`); }, [router, locale, tab]);
  return null;
};
