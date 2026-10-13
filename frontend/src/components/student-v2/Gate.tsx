'use client';

import React from 'react';
import { useNewDesign } from '@/lib/newDesign';
import { useAuthStore } from '@/lib/store';

/** Shows the redesigned screen to a logged-in student when the new design is on; everyone else keeps the current screen. */
export const V2Gate: React.FC<{ v2: React.ReactNode; legacy: React.ReactNode }> = ({ v2, legacy }) => {
  const newDesign = useNewDesign();
  const { currentUser } = useAuthStore();
  const isStudent = currentUser?.role === 'STUDENT_FREE' || currentUser?.role === 'STUDENT_PAID';
  return <>{newDesign && isStudent ? v2 : legacy}</>;
};
