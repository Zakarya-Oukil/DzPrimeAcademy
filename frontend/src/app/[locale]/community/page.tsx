'use client';

import React from 'react';
import { V2Gate } from '@/components/student-v2/Gate';
import { StudentCommunityV2, } from '@/components/student-v2/Community';

export default function CommunityPage() {
  return <V2Gate allow="all" v2={<StudentCommunityV2 />} />;
}
