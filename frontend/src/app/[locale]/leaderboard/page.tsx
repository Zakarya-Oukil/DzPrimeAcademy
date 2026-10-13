'use client';

import React from 'react';
import SocialFeed from '@/components/community/SocialFeed';
import { V2Gate } from '@/components/student-v2/Gate';
import { StudentCommunityV2, StudentLeaderboardV2 } from '@/components/student-v2/Community';

function LegacyLeaderboardOrCommunityPage() {
  return (
    <div className="w-full min-h-screen p-3.5 sm:p-6 lg:p-8 font-arabic">
      <SocialFeed />
    </div>
  );
}

export default function LeaderboardOrCommunityPage() {
  return <V2Gate allow="both" v2={<StudentLeaderboardV2 />} legacy={<LegacyLeaderboardOrCommunityPage />} />;
}
