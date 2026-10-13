'use client';

import React from 'react';
import { Avatar, Btn, Empty, PageHead, Panel, SkeletonRows, Status, dateFmt, useTx } from '@/components/student-v2/ui';
import { useRoster } from './data';

/** Roster and attendance (Figma page 28): who registered for each of your sessions, and whether they attended. Read-only, as before. */
export const TeacherRosterV2: React.FC = () => {
  const { tx, locale } = useTx();
  const { items } = useRoster();
  const list = (items || []).slice().sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt));

  return (
    <div className="flex flex-col gap-7" data-testid="teacher-roster-v2">
      <PageHead title={tx('الطلبة والحضور', 'Étudiants et présence', 'Students and attendance')} sub={tx('المسجّلون في كل حصة وحالة حضورهم.', 'Les inscrits à chaque session et leur présence.', 'Who registered for each session and whether they attended.')} />
      {items === null ? (
        <SkeletonRows n={3} />
      ) : list.length === 0 ? (
        <Empty title={tx('لا توجد حصص بعد', 'Aucune session pour le moment', 'No sessions yet')} body={tx('تظهر هنا قوائم المسجّلين عندما تجدول حصصاً.', 'Les listes apparaissent ici dès que vous planifiez des sessions.', 'Registrant lists appear here once you schedule sessions.')} action={<Btn href={`/${locale}/teacher/sessions?new=1`}>{tx('حصة جديدة', 'Nouvelle session', 'New session')}</Btn>} />
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((s) => {
            const came = s.registrations.filter((r) => r.attended).length;
            return (
              <li key={s.id} data-testid={`roster-session-${s.id}`}>
                <Panel as="section" className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-[18px] font-semibold">{s.title}</h2>
                      <p className="text-[13px] text-sheet-muted">{dateFmt(s.scheduledAt, locale)}</p>
                    </div>
                    <p className="text-[14px] font-semibold tabular-nums">{tx(`حضر ${came} من ${s.registrations.length}`, `${came} présents sur ${s.registrations.length}`, `${came} of ${s.registrations.length} attended`)}</p>
                  </div>
                  {s.registrations.length === 0 ? (
                    <p className="text-[14px] text-sheet-muted">{tx('لم يسجّل أحد بعد.', "Personne ne s'est inscrit pour le moment.", 'No one has registered yet.')}</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {s.registrations.map((r) => (
                        <li key={r.id} className="flex items-center gap-3 rounded-[14px] bg-sheet-line px-3.5 py-3">
                          <Avatar name={r.studentName} size={36} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-medium">{r.studentName}</p>
                            <p className="text-[12px] text-sheet-muted">{tx('سجّل في', 'Inscrit le', 'Registered')} {dateFmt(r.registeredAt, locale, { day: 'numeric', month: 'short' })}</p>
                          </div>
                          {r.attended ? <Status kind="ok">{tx('حضر', 'Présent', 'Attended')}</Status> : <Status kind="pending">{tx('لم يحضر', 'Absent', 'Not attended')}</Status>}
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
