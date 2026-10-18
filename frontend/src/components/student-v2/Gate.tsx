'use client';

import React from 'react';
import { AccessDenied } from '@/components/layout/AuthGate';
import { useAuthStore } from '@/lib/store';
import { useTx } from './ui';

const HOME: Record<string, string> = {
  OWNER: 'admin', ADMIN: 'admin', MODERATOR: 'admin', TEACHER: 'teacher', AMBASSADOR: 'ambassador', STUDENT_FREE: 'student', STUDENT_PAID: 'student',
};

/**
 * Shows the screen to a logged-in user of the allowed role(s); anyone else gets the access-denied notice.
 * `allow` is 'student' (default), 'teacher', 'ambassador', 'both' (student + teacher) or 'all' (every member role).
 */
export const V2Gate: React.FC<{ v2: React.ReactNode; allow?: 'student' | 'teacher' | 'ambassador' | 'both' | 'all' }> = ({ v2, allow = 'student' }) => {
  const { locale } = useTx();
  const role = useAuthStore().currentUser?.role;
  const isStudent = role === 'STUDENT_FREE' || role === 'STUDENT_PAID';
  const isTeacher = role === 'TEACHER';
  const isAmbassador = role === 'AMBASSADOR';
  const ok = allow === 'all' ? isStudent || isTeacher || isAmbassador : allow === 'both' ? isStudent || isTeacher : allow === 'teacher' ? isTeacher : allow === 'ambassador' ? isAmbassador : isStudent;
  return <>{ok ? v2 : <AccessDenied homeHref={`/${locale}/${(role && HOME[role]) || ''}`} />}</>;
};
