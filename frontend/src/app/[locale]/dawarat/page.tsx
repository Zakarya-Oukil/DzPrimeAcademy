'use client';

import React from 'react';
import { V2Gate } from '@/components/student-v2/Gate';
import { StudentDawaratV2 } from '@/components/student-v2/Dawarat';

export default function DawaratCatalogPage() {
  return <V2Gate v2={<StudentDawaratV2 />} />;
}
