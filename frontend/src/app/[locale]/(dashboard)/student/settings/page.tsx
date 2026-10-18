'use client';

import React from 'react';
import { V2Gate } from '@/components/student-v2/Gate';
import { StudentSettingsV2 } from '@/components/student-v2/Settings';

export default function StudentSettingsPage() {
  return <V2Gate v2={<StudentSettingsV2 />} />;
}
