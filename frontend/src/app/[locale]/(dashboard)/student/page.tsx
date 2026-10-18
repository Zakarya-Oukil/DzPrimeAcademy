'use client';

import React from 'react';
import { V2Gate } from '@/components/student-v2/Gate';
import { StudentDashboardV2 } from '@/components/student-v2/Dashboard';

export default function StudentDashboardPage() {
  return <V2Gate v2={<StudentDashboardV2 />} />;
}
