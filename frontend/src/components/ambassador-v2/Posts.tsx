'use client';

import React from 'react';
import { TeacherPostsV2 } from '@/components/teacher-v2/Posts';
import { useTx } from '@/components/student-v2/ui';

/** My posts and videos (Figma page 29): same screen as the Teacher's, with the ambassador wording. */
export const AmbassadorPostsV2: React.FC = () => {
  const { tx } = useTx();
  return <TeacherPostsV2 sub={tx('انشر نشاطك وفيديوهاتك عن ولايتك وتحكّم في خصوصيتها.', 'Publiez vos activités et vidéos sur votre wilaya et gérez leur visibilité.', 'Publish your activities and videos about your wilaya and control who sees them.')} />;
};
