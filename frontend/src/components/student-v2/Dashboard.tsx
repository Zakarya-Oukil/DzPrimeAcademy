'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { usePlatformStore, PlatformSession } from '@/lib/platformStore';
import { Btn, Empty, PageHead, Panel, SectionHead, SkeletonRows, Status, dateFmt, focus, useTx } from './ui';
import { useEnrollments, useExamBag, useExams, useNow, useRegistrations } from './data';

/** Student dashboard (Figma page 26): the next action first, then a calm summary. All numbers come from the system. */

const isOpen = (s: PlatformSession) => s.status !== 'COMPLETED' && s.status !== 'CANCELLED';

export const StudentDashboardV2: React.FC = () => {
  const { tx, locale } = useTx();
  const { currentUser } = useAuthStore();
  const { sessions } = usePlatformStore();
  const enrollments = useEnrollments();
  const regs = useRegistrations();
  const exams = useExams();
  const bag = useExamBag();
  const now = useNow();
  const base = `/${locale}`;

  const upcoming = useMemo(
    () => sessions.filter(isOpen).filter((s) => new Date(s.scheduledAt).getTime() + s.durationMinutes * 60000 > now).sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt)),
    [sessions, now],
  );
  const mine = regs.ids ? upcoming.filter((s) => regs.ids!.has(s.id)) : [];
  const next = mine[0] || upcoming[0];
  const isMine = !!next && !!regs.ids?.has(next.id);
  const today = upcoming.filter((s) => new Date(s.scheduledAt).toDateString() === new Date(now).toDateString());

  const first = (currentUser?.name || '').split(' ')[0];

  return (
    <div className="flex flex-col gap-9" data-testid="student-dashboard-v2">
      <PageHead
        title={tx('لوحتي', 'Mon espace', 'My space')}
        sub={first ? tx(`أهلاً ${first}. ما يجب فعله الآن، ثم ملخص هادئ لدراستك.`, `Bonjour ${first}. Ce qu'il faut faire maintenant, puis un résumé calme.`, `Hello ${first}. What to do now, then a calm summary.`) : undefined}
      />

      <Hero next={next} isMine={isMine} now={now} />

      <section aria-label={tx('ملخص', 'Résumé', 'Summary')} className="grid grid-cols-3 gap-3 sm:gap-4">
        <Stat label={tx('الدورات النشطة', 'Cours actifs', 'Active courses')} value={enrollments ? String(enrollments.length) : null} />
        <Stat label={tx('حصص مسجّل بها', 'Sessions inscrites', 'Registered sessions')} value={regs.ids ? String(mine.length) : null} />
        <Stat label={tx('امتحانات في حقيبتي', "Examens dans mon sac", 'Exams in my bag')} value={String(bag.count)} />
      </section>

      <div className="grid gap-9 lg:grid-cols-2 lg:gap-6">
        <section aria-labelledby="sd-today" className="flex flex-col gap-3">
          <SectionHead title={tx('جدول اليوم', "Aujourd'hui", 'Today')} href={`${base}/student/workshops`} linkLabel={tx('كل الحصص', 'Toutes les sessions', 'All sessions')} />
          <h2 id="sd-today" className="sr-only">{tx('جدول اليوم', "Aujourd'hui", 'Today')}</h2>
          {today.length === 0 ? (
            <Empty title={tx('لا توجد حصص اليوم', "Aucune session aujourd'hui", 'No sessions today')} body={tx('الحصص القادمة تظهر هنا.', 'Les prochaines sessions apparaissent ici.', 'Upcoming sessions show up here.')} />
          ) : (
            <ul className="flex flex-col gap-3">
              {today.slice(0, 4).map((s) => (
                <li key={s.id} className="flex items-center gap-4 rounded-[18px] bg-sheet-card px-5 py-4">
                  <span className="grid h-[52px] w-[60px] shrink-0 place-items-center rounded-[14px] bg-sheet-line text-[14px] font-semibold tabular-nums">{dateFmt(s.scheduledAt, locale, { hour: '2-digit', minute: '2-digit' })}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-medium">{s.title}</p>
                    <p className="truncate text-[13px] text-sheet-muted">{s.teacherName}</p>
                  </div>
                  {regs.ids?.has(s.id) ? <Status kind="ok">{tx('مسجّل', 'Inscrit', 'Registered')}</Status> : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="sd-courses" className="flex flex-col gap-3">
          <SectionHead title={tx('دوراتي', 'Mes cours', 'My courses')} href={`${base}/dawarat`} linkLabel={tx('عرض الكل', 'Voir tout', 'View all')} />
          <h2 id="sd-courses" className="sr-only">{tx('دوراتي', 'Mes cours', 'My courses')}</h2>
          {enrollments === null ? (
            <SkeletonRows n={3} />
          ) : enrollments.length === 0 ? (
            <Empty title={tx('لم تسجّل في أي دورة بعد', 'Aucune inscription pour le moment', 'No enrolments yet')} action={<Btn href={`${base}/dawarat`} variant="secondary">{tx('تصفّح الدورات', 'Parcourir les cours', 'Browse courses')}</Btn>} />
          ) : (
            <ul className="flex flex-col gap-3">
              {enrollments.slice(0, 4).map((e) => (
                <li key={e.id} className="rounded-[18px] bg-sheet-card px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-[16px] font-medium">{e.courseTitle}</p>
                    <span className="text-[14px] font-semibold tabular-nums">{e.progressPercent}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-sheet-line" role="progressbar" aria-valuenow={e.progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label={e.courseTitle}>
                    <div className="h-full rounded-full bg-gold-500" style={{ width: `${Math.min(100, Math.max(0, e.progressPercent))}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="sd-exams" className="flex flex-col gap-3">
        <SectionHead title={tx('تابع في بنك الامتحانات', "Continuer dans la banque d'examens", 'Continue in the exam bank')} href={`${base}/exams`} linkLabel={tx('فتح البنك', 'Ouvrir la banque', 'Open the bank')} />
        <h2 id="sd-exams" className="sr-only">{tx('بنك الامتحانات', "Banque d'examens", 'Exam bank')}</h2>
        {exams === null ? (
          <SkeletonRows n={2} />
        ) : exams.length === 0 ? (
          <Empty title={tx('لا توجد موضوعات منشورة بعد', 'Aucun sujet publié pour le moment', 'No exams published yet')} />
        ) : (
          <ul className="grid gap-3 md:grid-cols-3">
            {exams.slice(0, 3).map((x) => (
              <li key={x.id}>
                <Link href={`${base}/exams`} className={`flex h-full flex-col gap-2 rounded-[20px] bg-sheet-card p-5 hover:bg-sheet-line/50 ${focus}`}>
                  <span className="flex items-center justify-between gap-2 text-[13px] text-sheet-muted">
                    <span>{x.moduleName || tx('امتحان', 'Examen', 'Exam')} · {x.year}</span>
                    {x.isLocked ? <Status kind="locked">VIP</Status> : null}
                  </span>
                  <span className="text-[16px] font-semibold">{x.title}</span>
                  <span className="text-[13px] text-sheet-muted">{x.isLocked ? tx('التحميل الكامل لأعضاء VIP', 'Téléchargement complet pour les membres VIP', 'Full download for VIP members') : tx('معاينة وتحميل', 'Aperçu et téléchargement', 'Preview and download')}</span>
                </Link>
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

const Hero: React.FC<{ next?: PlatformSession; isMine: boolean; now: number }> = ({ next, isMine, now }) => {
  const { tx, locale } = useTx();
  const base = `/${locale}`;
  const regs = useRegistrations();
  const live = !!next && (next.status === 'LIVE' || now >= new Date(next.scheduledAt).getTime());
  const diff = next ? new Date(next.scheduledAt).getTime() - now : 0;
  const mins = Math.max(0, Math.round(diff / 60000));
  const count = !next ? '' : live ? tx('الآن', 'En cours', 'Now') : mins >= 1440 ? `${Math.floor(mins / 1440)} ${tx('يوم', 'j', 'd')}` : `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

  if (!next) {
    return (
      <section className="rounded-[28px] bg-strip p-6 text-strip-text sm:p-8" aria-labelledby="hero-h">
        <p className="text-[13px] font-semibold text-gold-700 dark:text-gold-500">{tx('الخطوة التالية', 'Prochaine étape', 'Next step')}</p>
        <h2 id="hero-h" className="mt-3 text-[26px] font-bold leading-[1.25] sm:text-[30px]">{tx('لا توجد حصة قادمة الآن', "Aucune session à venir pour l'instant", 'No upcoming session right now')}</h2>
        <p className="mt-2 text-[15px] text-strip-muted">{tx('تصفّح الدورات أو راجع الامتحانات حتى تُجدول حصة جديدة.', "Parcourez les cours ou révisez les examens en attendant une nouvelle session.", 'Browse courses or revise exams until a new session is scheduled.')}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Btn href={`${base}/dawarat`}>{tx('تصفّح الدورات', 'Parcourir les cours', 'Browse courses')}</Btn>
          <Btn href={`${base}/exams`} variant="text" tone="strip">{tx('بنك الامتحانات', "Banque d'examens", 'Exam bank')}</Btn>
        </div>
      </section>
    );
  }

  const canJoin = isMine && !!next.meetUrl && (live || mins <= 15);
  return (
    <section className="flex flex-col gap-6 rounded-[28px] bg-strip p-6 text-strip-text sm:p-8 md:flex-row md:items-center md:gap-8" aria-labelledby="hero-h" data-testid="student-hero">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <p className="w-fit rounded-full bg-strip-tint px-3 py-1 text-[13px] font-semibold text-gold-700 dark:text-gold-500">{tx('الخطوة التالية', 'Prochaine étape', 'Next step')}</p>
        <h2 id="hero-h" className="text-[26px] font-bold leading-[1.25] sm:text-[30px]">{next.title}</h2>
        <p className="text-[15px] text-strip-muted">{[next.teacherName, next.platform === 'ONSITE' ? tx('حضوري', 'Présentiel', 'On site') : tx('مباشر عبر الإنترنت', 'En ligne', 'Online'), dateFmt(next.scheduledAt, locale)].join('  ·  ')}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {isMine ? (
            canJoin ? (
              <a href={next.meetUrl!} target="_blank" rel="noreferrer" className={`inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold-500 px-6 text-[15px] font-semibold text-[#050505] hover:bg-gold-400 ${focus}`}>{tx('انضم الآن', 'Rejoindre', 'Join now')}</a>
            ) : (
              <Btn href={`${base}/student/workshops`}>{tx('تفاصيل الحصة', 'Détails', 'Details')}</Btn>
            )
          ) : (
            <Btn onClick={() => regs.toggle(next.id)} disabled={regs.pending === next.id || !regs.ids}>{tx('سجّل في الحصة', "S'inscrire", 'Register')}</Btn>
          )}
          {isMine ? <Btn href={`${base}/student/workshops`} variant="secondary" tone="strip">{tx('كل حصصي', 'Toutes mes sessions', 'All my sessions')}</Btn> : null}
          <Btn href={`${base}/exams`} variant="text" tone="strip">{tx('أو تابع بنك الامتحانات', "Ou continuer avec les examens", 'Or continue with exams')}</Btn>
        </div>
      </div>
      <div className="flex min-w-[170px] flex-row items-center justify-between gap-3 rounded-[22px] bg-strip-tint px-7 py-5 md:flex-col md:justify-center md:gap-1 md:py-7" aria-live="polite">
        <span className="text-[14px] font-medium text-strip-muted">{live ? tx('الحالة', 'Statut', 'Status') : tx('تبدأ خلال', 'Début dans', 'Starts in')}</span>
        <span className="text-[30px] font-bold leading-none tabular-nums md:text-[44px]" data-testid="hero-countdown">{count}</span>
      </div>
    </section>
  );
};
