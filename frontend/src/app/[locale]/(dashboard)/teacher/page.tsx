'use client';

import React from 'react';
import { V2Gate } from '@/components/student-v2/Gate';
import { TeacherStudioV2 } from '@/components/teacher-v2/Studio';

export default function TeacherStudioPage() {
  return <V2Gate allow="teacher" v2={<TeacherStudioV2 />} />;
}
