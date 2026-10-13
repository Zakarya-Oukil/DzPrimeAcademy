'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Btn, Empty, PageHead, Panel, SectionHead, SkeletonRows, dateFmt, focus, useTx } from '@/components/student-v2/ui';
import { useNow } from '@/components/student-v2/data';
import { TSession, useMyCourses, useMySessions, useRoster } from './data';

/** Teacher studio (Figma page 28): the next session first, then quick actions and a calm summary. All numbers come from the system. */

const endOf = (s: TSession) => new Date(s.scheduledAt).getTime() + s.durationMinutes * 60000;
export const platformLabel = (p: string, tx: (ar: string, fr: string, en?: string) => string) => (p === 'ONSITE' ? tx('حضوري', 'Présentiel', 'On site') : p === 'CLASSROOM' ? 'Classroom' : 'Google Meet');

// The old Teacher page used #hash tabs; keep those links working.
const HASH_ROUTES: Record<string, string> = { community: 'posts', courses: 'modules', sessions: 'sessions', roster: 'roster', profile: 'settings' };

export const TeacherStudioV2: React.FC = () => {
  const { tx, locale } = useTx();
  const router = useRouter();
  const base = `/${locale}/teacher`;
  const sessions = useMySessions();
  const courses = useMyCourses();
  const roster = useRoster();
  const now = useNow();

  useEffect(() => {
    const go = () => { const h = window.location.hash.replace('#', ''); if (HASH_ROUTES[h]) router.replace(`${base}/${HASH_ROUTES[h]}`); };
    go();
    window.addEventListener('hashchange', go);
    return () => window.removeEventListener('hashchange', go);
  }, [base, router]);

  const mine = sessions.items || [];
  const upcoming = useMemo(() => mine.filter((s) => s.status !== 'CANCELLED' && s.status !== 'COMPLETED' && endOf(s) > now).sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt)), [mine, now]);
  const next = upcoming[0];
  const regOf = (id: string) => roster.items?.find((r) => r.id === id)?.registrations.length ?? mine.find((s) => s.id === id)?.registrationsCount ?? 0;
  const totalRegs = (roster.items || []).reduce((n, r) => n + r.registrations.length, 0);
  const liveHours = Math.round(mine.filter((s) => s.status !== 'CANCELLED').reduce((t, s) => t + (s.durationMinutes || 0), 0) / 60);

  const live = !!next && (next.status === 'LIVE' || now >= new Date(next.scheduledAt).getTime());
  const mins = next ? Math.max(0, Math.round((new Date(next.scheduledAt).getTime() - now) / 60000)) : 0;
  const count = !next ? '' : live ? tx('الآن', 'En cours', 'Now') : mins >= 1440 ? `${Math.floor(mins / 1440)} ${tx('يوم', 'j', 'd')}` : `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

  const week = useMemo(() => {
    const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [now]);

  return (
    <div className="flex flex-col gap-9" data-testid="teacher-studio-v2">
      <PageHead title={tx('استوديو التدريس', "Studio d'enseignement", 'Teaching studio')} sub={tx('حصتك القادمة أولاً، ثم أدوات التدريس.', "Votre prochaine session d'abord, puis vos outils.", 'Your next session first, then your tools.')} />

      {sessions.items === null ? (
        <SkeletonRows n={1} />
      ) : !next ? (
        <section className="rounded-[28px] bg-strip p-6 text-strip-text sm:p-8" aria-labelledby="th-h">
          <p className="text-[13px] font-semibold text-gold-700 dark:text-gold-500">{tx('حصتك القادمة', 'Votre prochaine session', 'Your next session')}</p>
          <h2 id="th-h" className="mt-3 text-[26px] font-bold leading-[1.25] sm:text-[30px]">{tx('لا توجد حصة مجدولة', 'Aucune session planifiée', 'No session scheduled')}</h2>
          <p className="mt-2 text-[15px] text-strip-muted">{tx('جدول حصتك الأولى ليتمكن الطلبة من التسجيل.', 'Planifiez votre première session pour que les étudiants puissent s’inscrire.', 'Schedule your first session so students can register.')}</p>
          <div className="mt-6"><Btn href={`${base}/sessions?new=1`}>{tx('حصة جديدة', 'Nouvelle session', 'New session')}</Btn></div>
        </section>
      ) : (
        <section className="flex flex-col gap-6 rounded-[28px] bg-strip p-6 text-strip-text sm:p-8 md:flex-row md:items-center md:gap-8" aria-labelledby="th-h" data-testid="teacher-hero">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <p className="w-fit rounded-full bg-strip-tint px-3 py-1 text-[13px] font-semibold text-gold-700 dark:text-gold-500">{tx('حصتك القادمة', 'Votre prochaine session', 'Your next session')}</p>
            <h2 id="th-h" className="text-[26px] font-bold leading-[1.25] sm:text-[30px]">{next.title}</h2>
            <p className="text-[15px] text-strip-muted">{[platformLabel(next.platform, tx), dateFmt(next.scheduledAt, locale), `${regOf(next.id)} ${tx('طالباً مسجّلاً', 'inscrits', 'registered')}`].join('  ·  ')}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {next.meetUrl ? <a href={next.meetUrl} target="_blank" rel="noreferrer" className={`inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold-500 px-6 text-[15px] font-semibold text-[#050505] hover:bg-gold-400 ${focus}`} data-testid="teacher-start">{tx('ابدأ البث', 'Lancer la session', 'Start the session')}</a> : <Btn href={`${base}/sessions?edit=${next.id}`}>{tx('أضف رابط البث', 'Ajouter le lien', 'Add the link')}</Btn>}
              <Btn href={`${base}/roster`} variant="secondary" tone="strip">{tx('قائمة المسجّلين', 'Liste des inscrits', 'Registrants')}</Btn>
              <Btn href={`${base}/sessions?edit=${next.id}`} variant="text" tone="strip">{tx('عدّل الحصة', 'Modifier la session', 'Edit the session')}</Btn>
            </div>
          </div>
          <div className="flex min-w-[170px] flex-row items-center justify-between gap-3 rounded-[22px] bg-strip-tint px-7 py-5 md:flex-col md:justify-center md:gap-1 md:py-7" aria-live="polite">
            <span className="text-[14px] font-medium text-strip-muted">{live ? tx('الحالة', 'Statut', 'Status') : tx('تبدأ خلال', 'Début dans', 'Starts in')}</span>
            <span className="text-[30px] font-bold leading-none tabular-nums md:text-[44px]">{count}</span>
          </div>
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-start" data-testid="teacher-quick-actions">
        <Btn href={`${base}/sessions?new=1`}>{tx('حصة جديدة', 'Nouvelle session', 'New session')}</Btn>
        <Btn href={`${base}/modules?new=1`} variant="secondary">{tx('مقرر جديد', 'Nouveau cours', 'New module')}</Btn>
        <Btn href={`${base}/posts?new=1`} variant="secondary">{tx('منشور جديد', 'Nouvelle publication', 'New post')}</Btn>
      </div>

      <section aria-label={tx('ملخص', 'Résumé', 'Summary')} className="grid grid-cols-3 gap-3 sm:gap-4">
        <Stat label={tx('مقرراتي', 'Mes cours', 'My modules')} value={courses.items ? String(courses.items.length) : null} />
        <Stat label={tx('ساعات البث', 'Heures de direct', 'Live hours')} value={sessions.items ? String(liveHours) : null} />
        <Stat label={tx('تسجيلات الطلبة', 'Inscriptions', 'Registrations')} value={roster.items ? String(totalRegs) : null} />
      </section>

      <section aria-labelledby="th-week" className="flex flex-col gap-3">
        <h2 id="th-week" className="text-[20px] font-semibold">{tx('هذا الأسبوع', 'Cette semaine', 'This week')}</h2>
        <ol className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {week.map((d) => {
            const today = d.toDateString() === new Date(now).toDateString();
            const has = mine.some((s) => s.status !== 'CANCELLED' && new Date(s.scheduledAt).toDateString() === d.toDateString());
            return (
              <li key={d.toISOString()} className={`flex flex-col items-center gap-0.5 rounded-[14px] py-2.5 ${today ? 'bg-strip text-strip-text' : 'bg-sheet-card'}`} aria-current={today ? 'date' : undefined}>
                <span className={`text-[11px] font-medium sm:text-[12px] ${today ? 'text-strip-muted' : 'text-sheet-muted'}`}>{d.toLocaleDateString(locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-DZ' : 'en-GB', { weekday: 'short' })}</span>
                <span className="text-[18px] font-bold tabular-nums">{d.getDate()}</span>
                <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${has ? 'bg-gold-500' : 'bg-transparent'}`} />
                {has ? <span className="sr-only">{tx('توجد حصة', 'Session prévue', 'Session scheduled')}</span> : null}
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="th-up" className="flex flex-col gap-3">
        <SectionHead title={tx('حصصي القادمة', 'Mes prochaines sessions', 'My upcoming sessions')} href={`${base}/sessions`} linkLabel={tx('كل الحصص', 'Toutes les sessions', 'All sessions')} />
        <h2 id="th-up" className="sr-only">{tx('حصصي القادمة', 'Mes prochaines sessions', 'My upcoming sessions')}</h2>
        {sessions.items === null ? <SkeletonRows n={3} /> : upcoming.length === 0 ? (
          <Empty title={tx('لا توجد حصص قادمة', 'Aucune session à venir', 'No upcoming sessions')} />
        ) : (
          <ul className="flex flex-col gap-3">
            {upcoming.slice(0, 5).map((s) => (
              <li key={s.id} className="flex flex-col gap-3 rounded-[18px] bg-sheet-card p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span className="grid h-[52px] w-[60px] shrink-0 place-items-center rounded-[14px] bg-sheet-line text-[14px] font-semibold tabular-nums">{dateFmt(s.scheduledAt, locale, { hour: '2-digit', minute: '2-digit' })}</span>
                  <div className="min-w-0">
                    <p className="text-[16px] font-medium">{s.title}</p>
                    <p className="text-[13px] text-sheet-muted">{[platformLabel(s.platform, tx), dateFmt(s.scheduledAt, locale, { weekday: 'short', day: 'numeric', month: 'short' }), `${regOf(s.id)} ${tx('طالباً', 'inscrits', 'registered')}`].join('  ·  ')}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Btn href={`${base}/roster`} variant="secondary">{tx('المسجّلون', 'Inscrits', 'Registrants')}</Btn>
                  {s.meetUrl ? <a href={s.meetUrl} target="_blank" rel="noreferrer" className={`inline-flex min-h-[44px] items-center rounded-full bg-gold-500 px-6 text-[15px] font-semibold text-[#050505] hover:bg-gold-400 ${focus}`}>{tx('ابدأ', 'Lancer', 'Start')}</a> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string | null }> = ({ label, value }) => (
  <Panel className="flex flex-col gap-2 !p-4 sm:!p-6">
    <p className="text-[13px] font-medium text-sheet-muted sm:text-[14px]">{label}</p>
    <p className="text-[28px] font-bold leading-none tabular-nums sm:text-[40px]" aria-live="polite">{value ?? '–'}</p>
  </Panel>
);
