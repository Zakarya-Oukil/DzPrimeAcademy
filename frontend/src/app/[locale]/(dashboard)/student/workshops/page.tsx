'use client';

import React from 'react';
import { LiveSessionsPanel } from '@/components/dashboard/LiveSessionsPanel';
import { usePlatformStore } from '@/lib/platformStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { V2Gate } from '@/components/student-v2/Gate';
import { StudentWorkshopsV2 } from '@/components/student-v2/Workshops';

function LegacyWorkshops() {
  const { locale } = useTranslation();
  const { sessions } = usePlatformStore();
  return (
    <div className="py-6 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto font-arabic">
      <LiveSessionsPanel sessions={sessions} locale={locale} />
    </div>
  );
}

export default function StudentWorkshopsPage() {
  return <V2Gate v2={<StudentWorkshopsV2 />} legacy={<LegacyWorkshops />} />;
}
