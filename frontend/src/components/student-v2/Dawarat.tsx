'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Star } from '@phosphor-icons/react';
import { usePlatformStore, PlatformCourse } from '@/lib/platformStore';
import { useAuthStore } from '@/lib/store';
import { useAuthModal } from '@/lib/authModalContext';
import { formatDZD } from '@/lib/format';
import { isShowableCourse } from '@/lib/courseDisplay';
import { ContactActionModal, ContactModalOperation } from '@/components/shared/ContactActionModal';
import { Btn, Empty, Modal, PageHead, SearchInput, SelectInput, SkeletonRows, Status, Tabs, Tag, useTx } from './ui';

/** Courses and workshops catalogue (Figma page 27, "Dawarat"). Enrolment still goes through the contact flow, as before. */

type Track = 'ALL' | 'BAC' | 'UNIVERSITY_LMD' | 'MEDICAL';
const TRACKS: Track[] = ['BAC', 'UNIVERSITY_LMD', 'MEDICAL'];

export const StudentDawaratV2: React.FC = () => {
  const { tx, locale } = useTx();
  const { currentUser } = useAuthStore();
  const { openAuth } = useAuthModal();
  const { courses, loaded } = usePlatformStore();
  const params = useSearchParams();
  const locked = currentUser?.track ? (currentUser.track as Track) : null;
  const urlTrack = params.get('track') as Track | null;
  const [track, setTrack] = useState<Track>(locked || (urlTrack && TRACKS.includes(urlTrack) ? urlTrack : 'ALL'));
  const [kind, setKind] = useState<'all' | 'live' | 'recorded' | 'free'>('all');
  const [q, setQ] = useState('');
  const [enrolled, setEnrolled] = useState<string[]>([]);
  const [open, setOpen] = useState<PlatformCourse | null>(null);
  const [op, setOp] = useState<ContactModalOperation | null>(null);

  useEffect(() => { if (locked) setTrack(locked); }, [locked]);
  useEffect(() => {
    fetch('/api/enrollments').then((r) => (r.ok ? r.json() : [])).then((d) => Array.isArray(d) && setEnrolled(d.map((e: { courseId: string }) => e.courseId))).catch(() => {});
  }, []);

  const trackLabel = (c: string) => (c === 'BAC' ? tx('البكالوريا', 'Baccalauréat', 'Baccalaureate') : c === 'MEDICAL' ? tx('الطب', 'Médecine', 'Medicine') : tx('الجامعة LMD', 'Université LMD', 'University LMD'));
  const title = (c: PlatformCourse) => (locale === 'ar' ? c.titleAr : (locale === 'fr' ? c.titleFr : c.titleEn) || c.titleFr || c.titleAr);

  const enroll = (c: PlatformCourse) => {
    if (!currentUser) { openAuth('login'); return; }
    if (enrolled.includes(c.id)) return;
    setOpen(null);
    setOp({
      type: 'COURSE_ENROLLMENT',
      title: locale === 'ar' ? `دورة: ${c.titleAr}` : `Cours: ${c.titleFr || c.titleAr}`,
      details: `Course ID: ${c.id} | Formateur: ${c.teacherName} | ${c.category}`,
      amountDzd: c.priceDzd ?? 0,
      targetId: c.id,
      user: { name: currentUser.name, email: currentUser.email, phone: currentUser.phone || undefined, wilayaName: currentUser.wilayaName || undefined },
    });
  };

  const shown = courses
    .filter(isShowableCourse)
    .filter((c) => track === 'ALL' || c.category === track)
    .filter((c) => (kind === 'live' ? c.isLive : kind === 'recorded' ? !c.isLive : kind === 'free' ? !c.priceDzd : true))
    .filter((c) => !q.trim() || `${c.titleAr} ${c.titleFr || ''} ${c.teacherName}`.toLowerCase().includes(q.trim().toLowerCase()));

  const price = (c: PlatformCourse) => (c.priceDzd ? formatDZD(c.priceDzd, locale) : tx('مجاني', 'Gratuit', 'Free'));

  return (
    <div className="flex flex-col gap-7" data-testid="student-dawarat-v2">
      <PageHead title={tx('الدورات والورشات', 'Cours et ateliers', 'Courses and workshops')} sub={tx('ورشات ومحاضرات مباشرة ومسجّلة من أساتذة المنصة.', 'Ateliers et cours en direct ou enregistrés par les enseignants.', 'Live and recorded workshops from the platform teachers.')} />

      <div className="grid gap-4 sm:grid-cols-[1fr_260px]">
        <SearchInput id="dw-q" label={tx('بحث', 'Recherche', 'Search')} value={q} onChange={setQ} placeholder={tx('ابحث عن دورة أو مدرس', 'Rechercher un cours ou un enseignant', 'Search a course or teacher')} />
        <SelectInput id="dw-track" label={tx('المسار', 'Parcours', 'Track')} value={track} disabled={!!locked} onChange={(v) => setTrack(v as Track)} options={[{ value: 'ALL', label: tx('كل المسارات', 'Tous les parcours', 'All tracks') }, ...TRACKS.map((t) => ({ value: t, label: trackLabel(t) }))]} />
      </div>

      <Tabs label={tx('نوع الدورة', 'Type de cours', 'Course type')} value={kind} onChange={(v) => setKind(v as typeof kind)} items={[
        { id: 'all', label: tx('الكل', 'Tous', 'All') },
        { id: 'live', label: tx('مباشرة', 'En direct', 'Live') },
        { id: 'recorded', label: tx('مسجّلة', 'Enregistrés', 'Recorded') },
        { id: 'free', label: tx('مجانية', 'Gratuits', 'Free') },
      ]} />

      {!loaded && courses.length === 0 ? (
        <SkeletonRows n={3} />
      ) : shown.length === 0 ? (
        <Empty title={tx('لا توجد دورات مطابقة', 'Aucun cours correspondant', 'No matching courses')} body={tx('جرّب مساراً آخر أو امسح البحث.', 'Essayez un autre parcours ou effacez la recherche.', 'Try another track or clear the search.')} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((c) => {
            const on = enrolled.includes(c.id);
            return (
              <li key={c.id} className="flex flex-col gap-3 rounded-[22px] bg-sheet-card p-3.5" data-testid={`course-card-${c.id}`}>
                <div className="grid h-[130px] place-items-center overflow-hidden rounded-[16px] bg-sheet-line text-[13px] font-medium text-sheet-muted">
                  {c.imageUrl ? <img src={c.imageUrl} alt="" className="h-full w-full object-cover" /> : <span>{tx('غلاف الدورة', 'Couverture', 'Cover')}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2 px-1">
                  <Tag>{trackLabel(c.category)}</Tag>
                  {c.isLive ? <Tag>{tx('مباشرة', 'En direct', 'Live')}</Tag> : null}
                  {c.rating != null ? <span className="inline-flex items-center gap-1 text-[13px] font-medium"><Star size={14} weight="fill" aria-hidden="true" />{c.rating.toFixed(1)}</span> : null}
                </div>
                <button type="button" onClick={() => setOpen(c)} className="px-1 text-start text-[17px] font-semibold leading-snug hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">{title(c)}</button>
                <p className="px-1 text-[13px] text-sheet-muted">{c.teacherName}  ·  {c.lessonsCount} {tx('درس', 'leçons', 'lessons')}</p>
                <div className="mt-auto flex items-center justify-between gap-3 px-1 pt-1">
                  <span className="text-[16px] font-bold">{price(c)}</span>
                  {on ? <Status kind="ok">{tx('مسجّل', 'Inscrit', 'Enrolled')}</Status> : <Btn onClick={() => enroll(c)} data-testid={`enroll-btn-${c.id}`}>{tx('سجّل', "S'inscrire", 'Enrol')}</Btn>}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? title(open) : ''}>
        {open ? (
          <div className="flex flex-col gap-4">
            <p className="text-[15px] text-sheet-muted">{open.description || tx('لا يوجد وصف لهذه الدورة بعد.', "Pas encore de description.", 'No description yet.')}</p>
            <p className="text-[14px]">{open.teacherName}  ·  {open.lessonsCount} {tx('درس', 'leçons', 'lessons')}  ·  {price(open)}</p>
            <div className="flex flex-wrap gap-3">
              {enrolled.includes(open.id) ? <Status kind="ok">{tx('مسجّل', 'Inscrit', 'Enrolled')}</Status> : <Btn onClick={() => enroll(open)}>{tx('سجّل في الدورة', 'Je m’inscris', 'Enrol in this course')}</Btn>}
              <Btn variant="secondary" onClick={() => setOpen(null)}>{tx('إغلاق', 'Fermer', 'Close')}</Btn>
            </div>
          </div>
        ) : null}
      </Modal>

      {op ? <ContactActionModal isOpen={!!op} onClose={() => setOp(null)} operation={op} /> : null}
    </div>
  );
};
