'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { AmbassadorDirectory } from '@/components/ambassadors/AmbassadorDirectory';
import { AmbassadorsPublicV2 } from '@/components/shared-v2/AmbassadorsPublic';
import { useNewDesign } from '@/lib/newDesign';

export default function AmbassadorsPage() {
  const newDesign = useNewDesign();
  const { currentUser, isLoaded } = useAuthStore();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  // The public directory has no data source yet, so guests are sent home instead of an empty page.
  useEffect(() => {
    if (isLoaded && !currentUser) router.replace(`/${locale}`);
  }, [isLoaded, currentUser, router, locale]);
  if (!currentUser) return null;
  if (newDesign) return <AmbassadorsPublicV2 />;

  return (
    <div className="py-6 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      <AmbassadorDirectory />
    </div>
  );
}
