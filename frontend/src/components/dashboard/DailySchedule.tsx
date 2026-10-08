'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Sigma, FlaskConical, Dna, Calculator, Video, Calendar, Clock, User, X, ExternalLink } from 'lucide-react';
import { PlatformSession } from '@/lib/platformStore';

interface DailyScheduleProps {
  sessions: PlatformSession[];
  locale: string;
}

const CATEGORY_ICON: Record<string, React.ElementType> = {
  UNIVERSITY_LMD: Sigma,
  BAC: Calculator,
  MEDICAL: Dna,
};

const CATEGORY_COLOR: Record<string, string> = {
  UNIVERSITY_LMD: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  BAC: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  MEDICAL: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
};

export const DailySchedule: React.FC<DailyScheduleProps> = ({ sessions, locale }) => {
  const [selectedSession, setSelectedSession] = useState<PlatformSession | null>(null);
  const upcoming = sessions.slice(0, 4);

  return (
    <>
      <div
        data-testid="daily-schedule"
        className="p-5 rounded-3xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 shadow-sm font-arabic"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            {locale === 'ar' ? 'الجدول اليومي' : 'Daily Schedule'}
          </h3>
          <Link
            href={`/${locale}/dawarat`}
            className="text-[11px] font-bold text-gold-600 dark:text-gold-400 hover:underline flex items-center gap-1"
          >
            <span>{locale === 'ar' ? 'عرض الكل' : 'Voir tout'}</span>
            <span>←</span>
          </Link>
        </div>

        <div className="space-y-2">
          {upcoming.length === 0 && (
            <p className="text-xs text-slate-400 py-6 text-center">
              {locale === 'ar' ? 'لا توجد حصص مجدولة حالياً' : 'Aucune session planifiée'}
            </p>
          )}
          {upcoming.map((s) => {
            const Icon = CATEGORY_ICON[s.category] || Sigma;
            const colorClass = CATEGORY_COLOR[s.category] || CATEGORY_COLOR.UNIVERSITY_LMD;
            const date = new Date(s.scheduledAt);
            return (
              <div
                key={s.id}
                data-testid={`schedule-item-${s.id}`}
                onClick={() => setSelectedSession(s)}
                className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{s.title}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {date.toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} {s.teacherName?.trim().length > 1 && <> &bull; {s.teacherName}</>}
                  </p>
                </div>
                {s.platform === 'ONSITE' ? (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold shrink-0">
                    {locale === 'ar' ? 'حضوري' : 'Présentiel'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold shrink-0">
                    Live
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-lime-500 transition-colors shrink-0" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-arabic">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl relative text-slate-900 dark:text-white">
            <button
              onClick={() => setSelectedSession(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-lime-400/20 text-lime-700 dark:text-lime-300 text-[10px] font-black">
                {selectedSession.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-navy-900 text-[10px] font-mono font-bold">
                {selectedSession.platform}
              </span>
            </div>

            <h3 className="text-base font-black leading-snug">{selectedSession.title}</h3>

            <div className="space-y-2 text-xs text-slate-600 dark:text-gray-300 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                {selectedSession.teacherName?.trim().length > 1 && <span>{locale === 'ar' ? 'الأستاذ:' : 'Enseignant:'} {selectedSession.teacherName}</span>}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                <span>{new Date(selectedSession.scheduledAt).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                <span>{selectedSession.durationMinutes} {locale === 'ar' ? 'دقيقة' : 'minutes'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              {selectedSession.meetUrl ? (
                <a
                  href={selectedSession.meetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <Video className="w-4 h-4" />
                  <span>{locale === 'ar' ? 'دخول غرفة البث المباشر' : 'Rejoindre le Live'}</span>
                </a>
              ) : (
                <Link
                  href={`/${locale}/dawarat`}
                  onClick={() => setSelectedSession(null)}
                  className="flex-1 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>{locale === 'ar' ? 'الانتقال إلى دليل الدورات' : 'Voir dans le catalogue'}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

