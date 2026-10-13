'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Backpack, DownloadSimple } from '@phosphor-icons/react';
import type { ExamItem, TrackType } from '@/types';
import { useAuthStore } from '@/lib/store';
import { isGoldenMember } from '@/lib/rbac';
import { UpgradeModal } from '@/components/shared/UpgradeModal';
import { Btn, Empty, Modal, PageHead, Panel, SearchInput, SelectInput, SkeletonRows, Status, Tabs, focus, useTx } from './ui';
import { useExamBag, useExams } from './data';

/** Exam bank and study bag (Figma page 27, "Exam hub and bag"). Same /api/exams as before; the server decides who may open a file. */

type Term = 'ALL' | 'MIDTERM_EMD' | 'FINAL_SEMESTRIAL' | 'RATTRAPAGE';

export const StudentExamsV2: React.FC = () => {
  const { tx } = useTx();
  const { currentUser } = useAuthStore();
  const isGold = isGoldenMember(currentUser);
  const exams = useExams();
  const bag = useExamBag();
  const params = useSearchParams();
  const lockedTrack = (currentUser?.track as TrackType | undefined) || undefined;

  const [q, setQ] = useState('');
  const [track, setTrack] = useState<string>(lockedTrack || 'ALL');
  const [moduleId, setModuleId] = useState('ALL');
  const [term, setTerm] = useState<Term>('ALL');
  const [onlyBag, setOnlyBag] = useState(params.get('bag') === '1');
  const [preview, setPreview] = useState<ExamItem | null>(null);
  const [previewTab, setPreviewTab] = useState<'questions' | 'solution'>('questions');
  const [upgrade, setUpgrade] = useState(false);
  const bagRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (lockedTrack) setTrack(lockedTrack); }, [lockedTrack]);
  useEffect(() => { if (params.get('bag') === '1') bagRef.current?.scrollIntoView({ block: 'start' }); }, [params, exams]);

  const termLabel = (t: string) => (t === 'MIDTERM_EMD' ? tx('تقييم / EMD', 'Contrôle / EMD', 'Midterm') : t === 'FINAL_SEMESTRIAL' ? tx('امتحان شامل', 'Examen final', 'Final') : tx('استدراك', 'Rattrapage', 'Resit'));
  const trackLabel = (c: string) => (c === 'BAC' ? tx('البكالوريا', 'Baccalauréat', 'Baccalaureate') : c === 'MEDICAL' ? tx('الطب', 'Médecine', 'Medicine') : tx('الجامعة LMD', 'Université LMD', 'University LMD'));
  const locked = (x: ExamItem) => x.isLocked ?? (!x.isFreeSample && !isGold);

  const modules = useMemo(() => {
    const m = new Map<string, string>();
    (exams || []).forEach((x) => { if (x.moduleId) m.set(x.moduleId, x.moduleName || x.moduleId); });
    return [...m.entries()].map(([value, label]) => ({ value, label }));
  }, [exams]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (exams || []).filter((x) => {
      if (onlyBag && !bag.ids.includes(x.id)) return false;
      if (s && ![x.title, x.moduleName, x.authorName, x.institutionName, x.previewQuestionSnippet].some((f) => f?.toLowerCase().includes(s))) return false;
      if (track !== 'ALL' && x.trackType && x.trackType !== track) return false;
      if (moduleId !== 'ALL' && x.moduleId !== moduleId) return false;
      if (term !== 'ALL' && x.termType !== term) return false;
      return true;
    });
  }, [exams, q, track, moduleId, term, onlyBag, bag.ids]);

  const bagExams = (exams || []).filter((x) => bag.has(x.id));

  const rows = list.map((x) => {
    const lock = locked(x);
    const inBag = bag.has(x.id);
    return (
      <li key={x.id} data-testid={`exam-row-${x.id}`} className="flex flex-col gap-3 rounded-[18px] bg-sheet-card p-4 sm:px-5 2xl:flex-row 2xl:items-center 2xl:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sheet-line text-[12px] font-semibold text-sheet-muted">PDF</span>
          <div className="min-w-0">
            <p className="text-[16px] font-medium">{x.title}</p>
            <p className="text-[13px] text-sheet-muted">{[x.moduleName, x.year, termLabel(x.termType)].filter(Boolean).join('  ·  ')}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 2xl:justify-end">
          {lock ? <Status kind="locked">VIP</Status> : null}
          <Btn variant="secondary" onClick={() => { setPreview(x); setPreviewTab('questions'); }}>{tx('معاينة', 'Aperçu', 'Preview')}</Btn>
          {lock ? (
            <Btn variant="text" onClick={() => setUpgrade(true)}>{tx('ترقية للتحميل', 'Passer en VIP pour télécharger', 'Upgrade to download')}</Btn>
          ) : (
            <a href={x.fileUrl} download className={`inline-flex min-h-[44px] items-center gap-1.5 px-2 text-[15px] font-semibold underline underline-offset-4 ${focus}`}><DownloadSimple size={18} aria-hidden="true" />{tx('تحميل', 'Télécharger', 'Download')}</a>
          )}
          <Btn variant={inBag ? 'secondary' : 'primary'} aria-pressed={inBag} onClick={() => bag.toggle(x.id)} data-testid={`bag-toggle-${x.id}`}>
            {inBag ? tx('في الحقيبة', 'Dans le sac', 'In bag') : tx('أضف إلى الحقيبة', 'Ajouter au sac', 'Add to bag')}
          </Btn>
        </div>
      </li>
    );
  });

  return (
    <div className="flex flex-col gap-7" data-testid="student-exams-v2">
      <PageHead title={tx('بنك الامتحانات', "Banque d'examens", 'Exam bank')} sub={tx('موضوعات PDF للمعاينة والتحميل، مع حلول نموذجية.', 'Sujets PDF à consulter et télécharger, avec corrigés.', 'PDF exams to preview and download, with model solutions.')} />

      <div className="grid gap-4 sm:grid-cols-3">
        <SearchInput id="ex-q" label={tx('بحث', 'Recherche', 'Search')} value={q} onChange={setQ} placeholder={tx('ابحث عن موضوع', 'Rechercher un sujet', 'Search an exam')} />
        <SelectInput id="ex-mod" label={tx('المادة', 'Matière', 'Subject')} value={moduleId} onChange={setModuleId} options={[{ value: 'ALL', label: tx('كل المواد', 'Toutes les matières', 'All subjects') }, ...modules]} />
        <SelectInput id="ex-track" label={tx('المسار', 'Parcours', 'Track')} value={track} disabled={!!lockedTrack} onChange={setTrack} options={[{ value: 'ALL', label: tx('كل المسارات', 'Tous les parcours', 'All tracks') }, ...(['BAC', 'UNIVERSITY_LMD', 'MEDICAL'] as const).map((t) => ({ value: t, label: trackLabel(t) }))]} />
      </div>

      <Tabs label={tx('نوع الامتحان', "Type d'examen", 'Exam type')} value={term} onChange={(v) => setTerm(v as Term)} items={[
        { id: 'ALL', label: tx('الكل', 'Tous', 'All') },
        { id: 'MIDTERM_EMD', label: termLabel('MIDTERM_EMD') },
        { id: 'FINAL_SEMESTRIAL', label: termLabel('FINAL_SEMESTRIAL') },
        { id: 'RATTRAPAGE', label: termLabel('RATTRAPAGE') },
      ]} />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
        <div>
          {exams === null ? (
            <SkeletonRows n={4} />
          ) : list.length === 0 ? (
            <Empty
              title={onlyBag ? tx('الحقيبة فارغة', 'Le sac est vide', 'Your bag is empty') : tx('لا توجد موضوعات مطابقة', 'Aucun sujet correspondant', 'No matching exams')}
              body={onlyBag ? tx('أضف موضوعات إلى الحقيبة لمراجعتها لاحقاً.', 'Ajoutez des sujets au sac pour les réviser plus tard.', 'Add exams to your bag to revise them later.') : tx('غيّر المادة أو امسح البحث.', 'Changez la matière ou effacez la recherche.', 'Change the subject or clear the search.')}
              action={onlyBag ? <Btn variant="secondary" onClick={() => setOnlyBag(false)}>{tx('عرض كل الموضوعات', 'Voir tous les sujets', 'Show all exams')}</Btn> : undefined}
            />
          ) : (
            <ul className="flex flex-col gap-3">{rows}</ul>
          )}
        </div>

        <aside ref={bagRef} aria-labelledby="bag-h" className="scroll-mt-28">
          <Panel className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 id="bag-h" className="flex items-center gap-2 text-[18px] font-semibold"><Backpack size={22} aria-hidden="true" />{tx('حقيبتي الدراسية', "Mon sac d'études", 'My study bag')}</h2>
              <span className="text-[14px] font-semibold tabular-nums" aria-live="polite">{bag.count}</span>
            </div>
            {bagExams.length === 0 ? (
              <p className="text-[14px] text-sheet-muted">{tx('الحقيبة فارغة. أضف موضوعات لمراجعتها لاحقاً.', 'Le sac est vide. Ajoutez des sujets à réviser plus tard.', 'Your bag is empty. Add exams to revise later.')}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {bagExams.slice(0, 6).map((x) => (
                  <li key={x.id} className="flex items-center gap-2 rounded-[14px] bg-sheet-line px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{x.title}</span>
                    <button type="button" onClick={() => bag.toggle(x.id)} aria-label={`${tx('إزالة', 'Retirer', 'Remove')} ${x.title}`} className={`min-h-[44px] px-2 text-[13px] text-sheet-muted underline ${focus}`}>{tx('إزالة', 'Retirer', 'Remove')}</button>
                  </li>
                ))}
              </ul>
            )}
            <Btn full onClick={() => setOnlyBag((v) => !v)} aria-pressed={onlyBag} data-testid="bag-open">{onlyBag ? tx('عرض كل الموضوعات', 'Voir tous les sujets', 'Show all exams') : tx('فتح الحقيبة', 'Ouvrir le sac', 'Open bag')}</Btn>
            <p className="text-[12px] text-sheet-muted">{tx('محفوظة على هذا الجهاز.', 'Enregistré sur cet appareil.', 'Saved on this device.')}</p>
          </Panel>
        </aside>
      </div>

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.title || ''}>
        {preview ? (
          <div className="flex flex-col gap-4">
            <p className="text-[13px] text-sheet-muted">{[preview.moduleName, preview.year, termLabel(preview.termType), preview.authorName].filter(Boolean).join('  ·  ')}</p>
            {preview.solutionUrl ? (
              <Tabs label={tx('المعاينة', 'Aperçu', 'Preview')} value={previewTab} onChange={(v) => setPreviewTab(v as typeof previewTab)} items={[{ id: 'questions', label: tx('الأسئلة', 'Questions', 'Questions') }, { id: 'solution', label: tx('الحل', 'Corrigé', 'Solution') }]} />
            ) : null}
            <p className="whitespace-pre-line text-[15px]">
              {previewTab === 'questions'
                ? preview.previewQuestionSnippet || tx('لا توجد معاينة نصية لهذا الموضوع.', "Pas d'aperçu texte pour ce sujet.", 'No text preview for this exam.')
                : preview.solutionSummary || tx('لا يوجد ملخص للحل.', 'Pas de résumé du corrigé.', 'No solution summary.')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {locked(preview) ? (
                <Btn onClick={() => { setPreview(null); setUpgrade(true); }}>{tx('ترقية للتحميل الكامل', 'VIP pour le téléchargement complet', 'Upgrade for the full download')}</Btn>
              ) : (
                <a href={previewTab === 'solution' && preview.solutionUrl ? preview.solutionUrl : preview.fileUrl} download className={`inline-flex min-h-[44px] items-center gap-2 rounded-full bg-gold-500 px-6 text-[15px] font-semibold text-[#050505] hover:bg-gold-400 ${focus}`}><DownloadSimple size={18} aria-hidden="true" />{tx('تحميل PDF', 'Télécharger le PDF', 'Download PDF')}</a>
              )}
              <Btn variant={bag.has(preview.id) ? 'secondary' : 'primary'} onClick={() => bag.toggle(preview.id)}>{bag.has(preview.id) ? tx('في الحقيبة', 'Dans le sac', 'In bag') : tx('أضف إلى الحقيبة', 'Ajouter au sac', 'Add to bag')}</Btn>
            </div>
          </div>
        ) : null}
      </Modal>

      <UpgradeModal isOpen={upgrade} onClose={() => setUpgrade(false)} />
    </div>
  );
};
