'use client';

import React from 'react';
import { V2Gate } from '@/components/student-v2/Gate';
import { StudentExamsV2 } from '@/components/student-v2/Exams';

export default function ExamsBankPage() {
  return <V2Gate v2={<StudentExamsV2 />} />;
}
