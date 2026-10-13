'use client';

import React from 'react';
import { V2Gate } from '@/components/student-v2/Gate';
import { TeacherSettingsV2 } from '@/components/teacher-v2/Settings';
import { LegacySettings } from '@/components/teacher-v2/Legacy';

export default function TeacherSettingsPage() {
  return <V2Gate allow="teacher" v2={<TeacherSettingsV2 />} legacy={<LegacySettings />} />;
}
