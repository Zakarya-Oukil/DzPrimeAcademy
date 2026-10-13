'use client';

import React from 'react';
import { V2Gate } from '@/components/student-v2/Gate';
import { TeacherPostsV2 } from '@/components/teacher-v2/Posts';
import { LegacyPosts } from '@/components/teacher-v2/Legacy';

export default function TeacherPostsPage() {
  return <V2Gate allow="teacher" v2={<TeacherPostsV2 />} legacy={<LegacyPosts />} />;
}
