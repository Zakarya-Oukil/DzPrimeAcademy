'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { V2Gate } from '@/components/student-v2/Gate';
import { StudentSettingsV2 } from '@/components/student-v2/Settings';

function LegacySettings() {
  const router = useRouter();
  return <SettingsModal isOpen onClose={() => router.back()} />;
}

export default function StudentSettingsPage() {
  return <V2Gate v2={<StudentSettingsV2 />} legacy={<LegacySettings />} />;
}
