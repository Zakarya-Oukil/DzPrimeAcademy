'use client';

import React from 'react';
import { V2Gate } from '@/components/student-v2/Gate';
import { AmbassadorSettingsV2 } from '@/components/ambassador-v2/Settings';

export default function AmbassadorSettingsPage() {
  return <V2Gate allow="ambassador" v2={<AmbassadorSettingsV2 />} />;
}
