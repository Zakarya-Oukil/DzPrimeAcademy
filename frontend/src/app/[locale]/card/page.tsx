'use client';

import React from 'react';
import { V2Gate } from '@/components/student-v2/Gate';
import { StudentCardV2 } from '@/components/student-v2/CardPage';

export default function CardStudioPage() {
  return <V2Gate v2={<StudentCardV2 />} />;
}
