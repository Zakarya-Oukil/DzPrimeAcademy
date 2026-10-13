'use client';

import React from 'react';
import { V2Gate } from '@/components/student-v2/Gate';
import { TeacherRosterV2 } from '@/components/teacher-v2/Roster';
import { LegacyRoster } from '@/components/teacher-v2/Legacy';

export default function TeacherRosterPage() {
  return <V2Gate allow="teacher" v2={<TeacherRosterV2 />} legacy={<LegacyRoster />} />;
}
