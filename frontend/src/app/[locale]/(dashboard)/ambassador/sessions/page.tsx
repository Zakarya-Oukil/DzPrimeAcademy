'use client';

import React from 'react';
import { V2Gate } from '@/components/student-v2/Gate';
import { AmbassadorAnnouncementsV2 } from '@/components/ambassador-v2/Announcements';

export default function AmbassadorSessionsPage() {
  return <V2Gate allow="ambassador" v2={<AmbassadorAnnouncementsV2 />} />;
}
