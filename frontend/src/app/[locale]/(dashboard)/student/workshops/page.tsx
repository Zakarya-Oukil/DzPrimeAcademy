'use client';

import React from 'react';
import { V2Gate } from '@/components/student-v2/Gate';
import { StudentWorkshopsV2 } from '@/components/student-v2/Workshops';

export default function StudentWorkshopsPage() {
  return <V2Gate v2={<StudentWorkshopsV2 />} />;
}
