'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/store';
import { QuickStudyHub } from '@/components/study/QuickStudyHub';
import { V2Gate } from '@/components/student-v2/Gate';
import { StudentExamsV2 } from '@/components/student-v2/Exams';

function LegacyExamsBankPage() {
  const { locale } = useTranslation();
  const { currentUser } = useAuthStore();

  const isStudent = currentUser?.role === 'STUDENT_FREE' || currentUser?.role === 'STUDENT_PAID';

  return (
    <div className="w-full p-3.5 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 select-none font-arabic" data-testid="exam-bank-page">
      <div className="flex items-center gap-2 pb-1">
        <div className="px-4 py-2.5 rounded-2xl text-xs font-black bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-md flex items-center gap-2">
          <Zap className="w-4 h-4 text-gold-500" />
          <span>{locale === 'ar' ? 'بنك الامتحانات السريع (1-Click)' : "Banque d'Examens Directe"}</span>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <QuickStudyHub initialTrack={isStudent ? currentUser?.track : undefined} />
      </motion.div>
    </div>
  );
}


export default function ExamsBankPage() {
  return <V2Gate v2={<StudentExamsV2 />} legacy={<LegacyExamsBankPage />} />;
}
