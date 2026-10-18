'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { AmbassadorsPublicV2 } from '@/components/shared-v2/AmbassadorsPublic';

export default function AmbassadorsPage() {
  const { currentUser, isLoaded } = useAuthStore();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  // The public directory has no data source yet, so guests are sent home instead of an empty page.
  useEffect(() => {
    if (isLoaded && !currentUser) router.replace(`/${locale}`);
  }, [isLoaded, currentUser, router, locale]);
  if (!currentUser) return null;
  return <AmbassadorsPublicV2 />;
}
