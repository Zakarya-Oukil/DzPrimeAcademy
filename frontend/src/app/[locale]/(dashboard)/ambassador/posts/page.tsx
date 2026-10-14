'use client';

import React from 'react';
import { V2Gate } from '@/components/student-v2/Gate';
import { AmbassadorPostsV2 } from '@/components/ambassador-v2/Posts';
import { LegacyTab } from '@/components/ambassador-v2/Legacy';

export default function AmbassadorPostsPage() {
  return <V2Gate allow="ambassador" v2={<AmbassadorPostsV2 />} legacy={<LegacyTab tab="community" />} />;
}
