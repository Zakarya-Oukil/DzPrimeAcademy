'use client';

import React from 'react';
import { useNewDesign } from '@/lib/newDesign';
import { useAuthStore } from '@/lib/store';

/**
 * Shows the redesigned screen to a logged-in user of the allowed role(s) when the new design is on;
 * everyone else keeps the current screen. `allow` is 'student' (default), 'teacher', 'ambassador', 'both' (student + teacher) or 'all' (every redesigned role).
 */
export const V2Gate: React.FC<{ v2: React.ReactNode; legacy: React.ReactNode; allow?: 'student' | 'teacher' | 'ambassador' | 'both' | 'all' }> = ({ v2, legacy, allow = 'student' }) => {
  const newDesign = useNewDesign();
  const { currentUser } = useAuthStore();
  const role = currentUser?.role;
  const isStudent = role === 'STUDENT_FREE' || role === 'STUDENT_PAID';
  const isTeacher = role === 'TEACHER';
  const isAmbassador = role === 'AMBASSADOR';
  const ok = allow === 'all' ? isStudent || isTeacher || isAmbassador : allow === 'both' ? isStudent || isTeacher : allow === 'teacher' ? isTeacher : allow === 'ambassador' ? isAmbassador : isStudent;
  return <>{newDesign && ok ? v2 : legacy}</>;
};
