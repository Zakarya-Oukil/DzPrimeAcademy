'use client';

import React from 'react';
import { V2Gate } from '@/components/student-v2/Gate';
import { TeacherSessionsV2 } from '@/components/teacher-v2/Sessions';
import { LegacySessions } from '@/components/teacher-v2/Legacy';

export default function TeacherSessionsPage() {
  return <V2Gate allow="teacher" v2={<TeacherSessionsV2 />} legacy={<LegacySessions />} />;
}
