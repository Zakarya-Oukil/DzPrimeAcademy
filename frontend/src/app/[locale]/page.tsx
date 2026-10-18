'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/store';
import { getDashboardPath } from '@/lib/rbac';
import { LandingV2 } from '@/components/landing-v2/LandingV2';

export default function HomePage() {
  const { locale } = useTranslation();
  const { currentUser, isLoaded } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && currentUser) {
      router.replace(getDashboardPath(currentUser.role, locale));
    }
  }, [isLoaded, currentUser, locale, router]);

  if (isLoaded && currentUser) return null;

  return <LandingV2 />;
}
