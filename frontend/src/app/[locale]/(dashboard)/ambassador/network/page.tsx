'use client';

import React from 'react';
import { V2Gate } from '@/components/student-v2/Gate';
import { AmbassadorNetworkV2 } from '@/components/ambassador-v2/Network';
import { LegacyTab } from '@/components/ambassador-v2/Legacy';

export default function AmbassadorNetworkPage() {
  return <V2Gate allow="ambassador" v2={<AmbassadorNetworkV2 />} legacy={<LegacyTab tab="network" />} />;
}
