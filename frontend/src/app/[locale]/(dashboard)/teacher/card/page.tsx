'use client';

import React from 'react';
import { V2Gate } from '@/components/student-v2/Gate';
import { StudentCardV2 } from '@/components/student-v2/CardPage';
import { LegacyCard } from '@/components/teacher-v2/Legacy';

export default function TeacherCardPage() {
  return <V2Gate allow="teacher" v2={<StudentCardV2 />} legacy={<LegacyCard />} />;
}
