'use client';

import React from 'react';
import { CourseStarRating } from './CourseStarRating';

interface EnrollmentItem {
  id: string;
  courseId?: string;
  courseTitle: string;
  teacherName: string;
  progressPercent: number;
  remainingHours: number;
}

interface ActiveCoursesProgressProps {
  enrollments: EnrollmentItem[];
  locale: string;
}

const CircularProgress: React.FC<{ percent: number }> = ({ percent }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="shrink-0">
      <circle cx="24" cy="24" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-100 dark:text-white/10" />
      <circle
        cx="24"
        cy="24"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
        className="text-lime-500"
      />
      <text x="24" y="27" textAnchor="middle" className="text-[10px] font-bold fill-slate-900 dark:fill-white">
        {percent}%
      </text>
    </svg>
  );
};

export const ActiveCoursesProgress: React.FC<ActiveCoursesProgressProps> = ({ enrollments, locale }) => {
  return (
    <div data-testid="active-courses-progress" className="p-5 rounded-3xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">
        {locale === 'ar' ? 'المقررات النشطة' : 'Active Courses'}
      </h3>

      <div className="space-y-3">
        {enrollments.length === 0 && (
          <p className="text-xs text-slate-400 py-6 text-center">
            {locale === 'ar' ? 'لم تسجل في أي دورة بعد' : 'Aucune inscription active'}
          </p>
        )}
        {enrollments.map((e) => (
          <div key={e.id} data-testid={`enrollment-item-${e.id}`}>
            <div className="flex items-center gap-3">
              <CircularProgress percent={e.progressPercent} />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{e.courseTitle}</h4>
                <p className="text-[10px] text-slate-400">{e.teacherName}</p>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                {e.remainingHours.toFixed(1)}h {locale === 'ar' ? 'متبقية' : 'restantes'}
              </span>
            </div>
            {e.courseId && <CourseStarRating courseId={e.courseId} locale={locale} />}
          </div>
        ))}
      </div>
    </div>
  );
};
