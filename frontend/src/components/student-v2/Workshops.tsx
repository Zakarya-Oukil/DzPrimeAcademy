'use client';

import React, { useMemo, useState } from 'react';
import { usePlatformStore, PlatformSession } from '@/lib/platformStore';
import { Btn, Empty, PageHead, SearchInput, SelectInput, SkeletonRows, Status, Tabs, dateFmt, focus, useTx } from './ui';
import { useNow, useRegistrations } from './data';

/** Live sessions (Figma page 27, "Workshops"): browse, register, cancel. Uses the same register API as the old panel. */

const endOf = (s: PlatformSession) => new Date(s.scheduledAt).getTime() + s.durationMinutes * 60000;

export const StudentWorkshopsV2: React.FC = () => {
  const { tx, locale } = useTx();
  const { sessions } = usePlatformStore();
  const regs = useRegistrations();
  const now = useNow();
  const [tab, setTab] = useState<'upcoming' | 'mine' | 'past'>('upcoming');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('ALL');

  const list = useMemo(() => {
    const s = sessions.filter((x) => (cat === 'ALL' || x.category === cat) && (!q.trim() || `${x.title} ${x.teacherName}`.toLowerCase().includes(q.trim().toLowerCase())));
    const live = (x: PlatformSession) => x.status !== 'CANCELLED' && x.status !== 'COMPLETED' && endOf(x) > now;
    if (tab === 'past') return s.filter((x) => !live(x) && x.status !== 'CANCELLED').sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt));
    const open = s.filter(live).sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
    return tab === 'mine' ? open.filter((x) => regs.ids?.has(x.id)) : open;
  }, [sessions, tab, q, cat, now, regs.ids]);

  const catLabel = (c: string) => (c === 'BAC' ? tx('البكالوريا', 'Baccalauréat', 'Baccalaureate') : c === 'MEDICAL' ? tx('الطب', 'Médecine', 'Medicine') : tx('الجامعة LMD', 'Université LMD', 'University LMD'));

  return (
    <div className="flex flex-col gap-7" data-testid="student-workshops-v2">
      <PageHead title={tx('الحصص المباشرة', 'Sessions en direct', 'Live sessions')} sub={tx('سجّل في الحصص القادمة وتابعها من هنا.', 'Inscrivez-vous aux prochaines sessions et suivez-les ici.', 'Register for upcoming sessions and follow them here.')} />

      <Tabs
        label={tx('تصفية الحصص', 'Filtrer les sessions', 'Filter sessions')}
        value={tab}
        onChange={(v) => setTab(v as typeof tab)}
        items={[
          { id: 'upcoming', label: tx('القادمة', 'À venir', 'Upcoming') },
          { id: 'mine', label: tx('مسجّل بها', 'Mes inscriptions', 'My registrations') },
          { id: 'past', label: tx('السابقة', 'Passées', 'Past') },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-[1fr_260px]">
        <SearchInput id="ws-q" label={tx('بحث', 'Recherche', 'Search')} value={q} onChange={setQ} placeholder={tx('ابحث عن حصة أو مدرس', 'Rechercher une session ou un enseignant', 'Search a session or teacher')} />
        <SelectInput id="ws-cat" label={tx('المسار', 'Parcours', 'Track')} value={cat} onChange={setCat} options={[{ value: 'ALL', label: tx('كل المسارات', 'Tous les parcours', 'All tracks') }, { value: 'BAC', label: catLabel('BAC') }, { value: 'UNIVERSITY_LMD', label: catLabel('UNIVERSITY_LMD') }, { value: 'MEDICAL', label: catLabel('MEDICAL') }]} />
      </div>

      {regs.ids === null ? (
        <SkeletonRows n={3} />
      ) : list.length === 0 ? (
        <Empty
          title={tab === 'mine' ? tx('لم تسجّل في أي حصة بعد', "Aucune inscription pour l'instant", 'No registrations yet') : tab === 'past' ? tx('لا توجد حصص سابقة', 'Aucune session passée', 'No past sessions') : tx('لا توجد حصص مجدولة حالياً', 'Aucune session planifiée', 'No sessions scheduled')}
          body={tab === 'mine' ? tx('اختر حصة من القائمة القادمة وسجّل فيها.', 'Choisissez une session dans « À venir ».', 'Pick a session from "Upcoming".') : undefined}
          action={tab === 'mine' ? <Btn variant="secondary" onClick={() => setTab('upcoming')}>{tx('عرض الحصص القادمة', 'Voir les sessions à venir', 'See upcoming sessions')}</Btn> : undefined}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((s) => {
            const on = regs.ids!.has(s.id);
            const live = s.status === 'LIVE' || (now >= new Date(s.scheduledAt).getTime() && now < endOf(s));
            const past = tab === 'past';
            return (
              <li key={s.id} data-testid={`ws-row-${s.id}`} className="flex flex-col gap-3 rounded-[18px] bg-sheet-card p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span className="grid h-[52px] w-[60px] shrink-0 place-items-center rounded-[14px] bg-sheet-line text-[14px] font-semibold tabular-nums">{dateFmt(s.scheduledAt, locale, { hour: '2-digit', minute: '2-digit' })}</span>
                  <div className="min-w-0">
                    <p className="text-[16px] font-medium">{s.title}</p>
                    <p className="text-[13px] text-sheet-muted">{[s.teacherName, s.platform === 'ONSITE' ? tx('حضوري', 'Présentiel', 'On site') : tx('عبر الإنترنت', 'En ligne', 'Online'), dateFmt(s.scheduledAt, locale, { weekday: 'short', day: 'numeric', month: 'short' }), `${s.durationMinutes} ${tx('د', 'min', 'min')}`].join('  ·  ')}</p>
                  </div>
                </div>
                {!past ? (
                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    {live ? <Status kind="pending">{tx('مباشر الآن', 'En direct', 'Live now')}</Status> : null}
                    {on ? <Status kind="ok">{tx('مسجّل', 'Inscrit', 'Registered')}</Status> : null}
                    {on && live && s.meetUrl ? (
                      <a href={s.meetUrl} target="_blank" rel="noreferrer" className={`inline-flex min-h-[44px] items-center rounded-full bg-gold-500 px-6 text-[15px] font-semibold text-[#050505] hover:bg-gold-400 ${focus}`}>{tx('انضم الآن', 'Rejoindre', 'Join now')}</a>
                    ) : null}
                    <Btn variant={on ? 'secondary' : 'primary'} disabled={regs.pending === s.id} onClick={() => regs.toggle(s.id)} data-testid={`ws-toggle-${s.id}`}>
                      {on ? tx('إلغاء التسجيل', "Annuler l'inscription", 'Cancel registration') : tx('سجّل', "S'inscrire", 'Register')}
                    </Btn>
                  </div>
                ) : (
                  <Status kind="pending">{tx('انتهت', 'Terminée', 'Ended')}</Status>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
