'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ArrowRight, ArrowLeft } from 'lucide-react';
import { PlatformCourse } from '@/lib/platformStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { isShowableCourse, trackLabel, validRating } from '@/lib/courseDisplay';

interface NewCoursesGridProps {
  courses: PlatformCourse[];
  locale: string;
}

const THEME_BG: Record<string, string> = {
  lime: 'bg-lime-500/15 text-lime-600 dark:text-lime-400',
  gold: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  sky: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  violet: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  rose: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
};

export const NewCoursesGrid: React.FC<NewCoursesGridProps> = ({ courses, locale }) => {
  const { isRtl } = useTranslation();
  const display = courses.filter(isShowableCourse).slice(0, 3);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5" data-testid="new-courses-grid">
      {display.map((c) => (
        <Link
          key={c.id}
          href={`/${locale}/dawarat`}
          data-testid={`new-course-card-${c.id}`}
          className="group p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111114] shadow-sm hover:shadow-md hover:border-gold-500/50 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${THEME_BG[c.colorTheme] || THEME_BG.lime}`}>
                {(c.titleFr || c.titleAr).charAt(0)}
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-900 text-slate-500 dark:text-slate-400">
                {trackLabel(c.category, locale)}
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-gold-500 transition-colors">
              {locale === 'ar' ? c.titleAr : c.titleFr || c.titleAr}
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">{c.lessonsCount} {locale === 'ar' ? 'حصة مسجلة وتفاعلية' : 'leçons'}</p>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
            {validRating(c.rating) ? (
              <span className="flex items-center gap-1 font-bold text-amber-500">
                <Star className="w-3 h-3 fill-amber-500" />
                {validRating(c.rating)}
              </span>
            ) : (
              <span />
            )}
            <span className="text-slate-400 truncate max-w-[100px] text-[10px]">{c.teacherName}</span>
          </div>
        </Link>
      ))}
    </div>
  );
};

