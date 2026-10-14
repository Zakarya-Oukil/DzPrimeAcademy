'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { ExamItem, TrackType } from '@/types';
import { ACADEMIC_YEARS, FACULTIES, INSTITUTIONS, MODULES, SPECIALTIES, getLocalizedItemName } from '@/lib/initial-data';
import { Btn, Empty, FormPanel, PageHead, Status, focus, useTx } from './ui';
import { useExams } from './data';

/** Assistant (Figma page 27): the same guided exam finder as before (track, institution, faculty, specialty, year, module), shown as a chat. */

type Named = { id: string; nameAr: string; nameFr: string; nameEn?: string };
type Step = { key: string; question: string; options: { id: string; label: string }[]; chosen?: { id: string; label: string } };

export const StudentBotV2: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { tx, locale } = useTx();
  const exams = useExams();
  const [picked, setPicked] = useState<{ id: string; label: string }[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const name = (i: Named) => getLocalizedItemName(i, locale as 'ar' | 'fr' | 'en');
  const opt = (arr: Named[]) => arr.map((i) => ({ id: i.id, label: name(i) }));

  const track = picked[0]?.id as TrackType | undefined;
  const steps: Step[] = [
    { key: 'track', question: tx('مرحباً! ما هو مسارك الدراسي؟', 'Bonjour ! Quel est votre parcours ?', 'Hi! Which track are you in?'), options: [
      { id: 'BAC', label: tx('البكالوريا', 'Baccalauréat', 'Baccalaureate') },
      { id: 'UNIVERSITY_LMD', label: tx('الجامعة LMD', 'Université LMD', 'University LMD') },
      { id: 'MEDICAL', label: tx('الطب والصحة', 'Médecine et santé', 'Medicine and health') },
    ] },
    { key: 'inst', question: track === 'BAC' ? tx('في أي ثانوية؟', 'Dans quel lycée ?', 'Which high school?') : tx('في أي جامعة؟', 'Dans quelle université ?', 'Which university?'), options: opt(INSTITUTIONS.filter((i) => (track === 'BAC' ? i.type === 'HIGH_SCHOOL' : i.type === 'UNIVERSITY'))) },
    { key: 'fac', question: tx('أي كلية أو شعبة؟', 'Quelle faculté ou filière ?', 'Which faculty or stream?'), options: opt(FACULTIES.filter((f) => f.institutionId === picked[1]?.id)) },
    { key: 'spec', question: tx('أي تخصص؟', 'Quelle spécialité ?', 'Which specialty?'), options: opt(SPECIALTIES.filter((s) => s.facultyId === picked[2]?.id)) },
    { key: 'year', question: tx('أي سنة وسداسي؟', 'Quelle année et semestre ?', 'Which year and semester?'), options: opt(ACADEMIC_YEARS.filter((y) => y.specialtyId === picked[3]?.id)) },
    { key: 'mod', question: tx('أي مادة تريد مراجعتها؟', 'Quelle matière voulez-vous réviser ?', 'Which subject do you want to revise?'), options: opt(MODULES.filter((m) => m.academicYearId === picked[4]?.id)) },
  ];
  const idx = picked.length;
  const done = idx >= steps.length;
  const current = done ? null : steps[idx];
  const moduleId = picked[5]?.id;
  const found: ExamItem[] = done && exams ? exams.filter((x) => x.moduleId === moduleId) : [];

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [picked.length]);

  const Wrap: React.ElementType = compact ? 'div' : FormPanel;
  const bubble = 'max-w-[85%] rounded-[18px] px-4 py-3 text-[15px] sm:max-w-[70%]';

  return (
    <div className="flex flex-col gap-7" data-testid="student-bot-v2">
      {compact ? null : (
  <PageHead title={tx('المساعد', 'Assistant', 'Assistant')} sub={tx('اختر خطوة بخطوة وسأجد لك الامتحانات المناسبة.', 'Choisissez étape par étape et je trouve les bons examens.', 'Choose step by step and I will find the right exams.')} />
      )}
      <Wrap>
        <div className="flex flex-col gap-4" aria-live="polite">
          {steps.slice(0, Math.min(idx + 1, steps.length)).map((s, i) => (
            <React.Fragment key={s.key}>
              <div className="flex justify-start"><p className={`${bubble} bg-sheet-line`}>{s.question}</p></div>
              {picked[i] ? (
                <div className="flex justify-end">
                  <button type="button" onClick={() => setPicked(picked.slice(0, i))} title={tx('تعديل هذا الاختيار', 'Modifier ce choix', 'Change this choice')} className={`${bubble} bg-gold-500 text-start font-medium text-[#050505] ${focus}`}>{picked[i].label}</button>
                </div>
              ) : s.options.length === 0 ? (
                <Empty title={tx('لا توجد خيارات متاحة بعد لهذا الاختيار', "Pas encore d'options pour ce choix", 'No options available for this choice yet')} action={<Btn variant="secondary" onClick={() => setPicked(picked.slice(0, Math.max(0, i - 1)))}>{tx('رجوع', 'Retour', 'Back')}</Btn>} />
              ) : (
                <div className="flex flex-wrap justify-start gap-2" role="group" aria-label={s.question}>
                  {s.options.map((o) => (
                    <button key={o.id} type="button" onClick={() => setPicked([...picked, o])} className={`min-h-[44px] rounded-full border border-sheet-text px-5 text-[15px] font-semibold hover:bg-sheet-text/10 ${focus}`}>{o.label}</button>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}

          {done ? (
            <>
              <div className="flex justify-start"><p className={`${bubble} bg-sheet-line`}>{found.length ? tx('وجدت هذه الامتحانات لمادتك:', 'Voici les examens pour votre matière :', 'Here are the exams for your subject:') : tx('لا توجد امتحانات منشورة لهذه المادة بعد.', "Aucun examen publié pour cette matière pour l'instant.", 'No exams published for this subject yet.')}</p></div>
              {found.length ? (
                <ul className="flex flex-col gap-2">
                  {found.map((x) => (
                    <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-sheet-card px-4 py-3">
                      <span className="min-w-0 text-[15px] font-medium">{x.title} <span className="text-sheet-muted">· {x.year}</span></span>
                      <span className="flex items-center gap-3">
                        {x.isLocked ? <Status kind="locked">VIP</Status> : null}
                        <Btn href={`/${locale}/exams`} variant="secondary">{tx('فتح في البنك', 'Ouvrir dans la banque', 'Open in the bank')}</Btn>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div><Btn href={`/${locale}/exams`}>{tx('تصفّح بنك الامتحانات', "Parcourir la banque d'examens", 'Browse the exam bank')}</Btn></div>
              )}
            </>
          ) : null}
          <div ref={endRef} />
        </div>
        {picked.length > 0 ? <div className="mt-5 border-t border-sheet-line pt-4"><Btn variant="text" onClick={() => setPicked([])}>{tx('ابدأ من جديد', 'Recommencer', 'Start over')}</Btn></div> : null}
      </Wrap>
    </div>
  );
};
