'use client';

import React from 'react';
import { AmbassadorDirectory } from '@/components/ambassadors/AmbassadorDirectory';
import { AmbassadorsPublicV2 } from '@/components/shared-v2/AmbassadorsPublic';
import { useNewDesign } from '@/lib/newDesign';

export default function AmbassadorsPage() {
  const newDesign = useNewDesign();
  if (newDesign) return <AmbassadorsPublicV2 />;

  return (
    <div className="py-6 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      <AmbassadorDirectory />
    </div>
  );
}
