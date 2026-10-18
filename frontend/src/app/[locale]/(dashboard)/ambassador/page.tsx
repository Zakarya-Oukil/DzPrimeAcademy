'use client';

import React from 'react';
import { V2Gate } from '@/components/student-v2/Gate';
import { AmbassadorHomeV2 } from '@/components/ambassador-v2/Home';

export default function AmbassadorPage() {
  return <V2Gate allow="ambassador" v2={<AmbassadorHomeV2 />} />;
}
