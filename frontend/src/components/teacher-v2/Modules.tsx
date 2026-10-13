'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatDZD } from '@/lib/format';
import { Btn, Empty, Field, FormPanel, Modal, PageHead, SelectInput, SkeletonRows, Tag, TextInput, fieldClass, useTx } from '@/components/student-v2/ui';
import { TCourse, Track, api, useMyCourses } from './data';
import { ImageField, VideoUrlField } from './MediaFields';

/** Teacher modules (Figma page 28): create, edit and delete your own modules. The price is set by the commercial director. */

const EMPTY = { titleAr: '', titleFr: '', description: '', category: 'UNIVERSITY_LMD' as Track, lessonsCount: 8, isLive: false, imageUrl: null as string | null, videoUrl: null as string | null };

export const TeacherModulesV2: React.FC = () => {
  const { tx, locale } = useTx();
  const { items, reload } = useMyCourses();
  const params = useSearchParams();
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<TCourse | null>(null);

  const trackLabel = (c: string) => (c === 'BAC' ? tx('البكالوريا', 'Baccalauréat', 'Baccalaureate') : c === 'MEDICAL' ? tx('الطب', 'Médecine', 'Medicine') : tx('الجامعة LMD', 'Université LMD', 'University LMD'));

  const open = (c?: TCourse) => {
    setError('');
    setEditing(c ? c.id : 'new');
    setForm(c ? { titleAr: c.titleAr, titleFr: c.titleFr || '', description: c.description || '', category: c.category, lessonsCount: c.lessonsCount, isLive: c.isLive, imageUrl: c.imageUrl || null, videoUrl: c.videoUrl || null } : EMPTY);
  };

  useEffect(() => {
    if (!items) return;
    if (params.get('new') === '1') open();
    const id = params.get('edit');
    const c = id ? items.find((x) => x.id === id) : undefined;
    if (c) open(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items === null]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titleAr.trim()) { setError(tx('عنوان المقرر مطلوب.', 'Le titre est obligatoire.', 'The title is required.')); return; }
    setSaving(true); setError('');
    const r = editing === 'new' ? await api('/api/courses', 'POST', form) : await api(`/api/courses/${editing}`, 'PUT', form);
    setSaving(false);
    if (!r.ok) { setError(r.json.error || tx('تعذر حفظ المقرر.', "Impossible d'enregistrer le cours.", 'Could not save the module.')); return; }
    setEditing(null);
    reload();
  };

  const remove = async () => {
    if (!confirm) return;
    const r = await api(`/api/courses/${confirm.id}`, 'DELETE');
    setConfirm(null);
    if (!r.ok) { setError(r.json.error || tx('تعذر حذف المقرر.', 'Suppression impossible.', 'Could not delete the module.')); return; }
    reload();
  };

  return (
    <div className="flex flex-col gap-7" data-testid="teacher-modules-v2">
      <PageHead
        title={tx('مقرراتي', 'Mes cours', 'My modules')}
        sub={tx('أنشئ مقرراتك وعدّلها. تحدّد الإدارة التجارية السعر.', 'Créez et modifiez vos cours. Le prix est fixé par la direction commerciale.', 'Create and edit your modules. The price is set by the commercial director.')}
        action={editing === null ? <Btn onClick={() => open()} data-testid="teacher-add-course">{tx('مقرر جديد', 'Nouveau cours', 'New module')}</Btn> : undefined}
      />
      {error && editing === null ? <p role="alert" className="text-[14px] font-medium text-[#c0392b]">{error}</p> : null}

      {editing !== null ? (
        <form onSubmit={save} noValidate>
          <FormPanel title={editing === 'new' ? tx('مقرر جديد', 'Nouveau cours', 'New module') : tx('تعديل المقرر', 'Modifier le cours', 'Edit module')}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput id="tm-ar" label={tx('عنوان المقرر', 'Titre (arabe)', 'Title (Arabic)')} value={form.titleAr} onChange={(v) => setForm({ ...form, titleAr: v })} required />
                <TextInput id="tm-fr" label={tx('العنوان بالفرنسية', 'Titre en français', 'Title in French')} value={form.titleFr} onChange={(v) => setForm({ ...form, titleFr: v })} dir="ltr" />
              </div>
              <Field label={tx('الوصف', 'Description', 'Description')} htmlFor="tm-desc">
                <textarea id="tm-desc" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${fieldClass} py-3`} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <SelectInput id="tm-cat" label={tx('المسار', 'Parcours', 'Track')} value={form.category} onChange={(v) => setForm({ ...form, category: v as Track })} options={(['BAC', 'UNIVERSITY_LMD', 'MEDICAL'] as Track[]).map((t) => ({ value: t, label: trackLabel(t) }))} />
                <TextInput id="tm-les" label={tx('عدد الدروس', 'Nombre de leçons', 'Lessons')} type="number" min={0} value={String(form.lessonsCount)} onChange={(v) => setForm({ ...form, lessonsCount: Math.max(0, Number(v) || 0) })} />
                <SelectInput id="tm-live" label={tx('النوع', 'Type', 'Type')} value={form.isLive ? 'live' : 'rec'} onChange={(v) => setForm({ ...form, isLive: v === 'live' })} options={[{ value: 'rec', label: tx('مسجّل', 'Enregistré', 'Recorded') }, { value: 'live', label: tx('مباشر', 'En direct', 'Live') }]} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageField id="tm-img" kind="course" label={tx('صورة المقرر', 'Image du cours', 'Cover image')} value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
                <VideoUrlField id="tm-vid" kind="course" label={tx('فيديو تعريفي (اختياري)', 'Vidéo de présentation (optionnel)', 'Intro video (optional)')} value={form.videoUrl} onChange={(url) => setForm({ ...form, videoUrl: url })} />
              </div>
              <p className="text-[13px] text-sheet-muted">{tx('السعر تحدده الإدارة التجارية ولا يظهر هنا.', 'Le prix est fixé par la direction commerciale.', 'The price is set by the commercial director.')}</p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p role="alert" className="min-h-[1.25rem] text-[14px] font-medium text-[#c0392b]">{error}</p>
                <div className="flex gap-3">
                  <Btn variant="secondary" onClick={() => setEditing(null)}>{tx('إلغاء', 'Annuler', 'Cancel')}</Btn>
                  <Btn type="submit" disabled={saving} data-testid="teacher-save-course">{saving ? tx('جارٍ الحفظ…', 'Enregistrement…', 'Saving…') : tx('حفظ المقرر', 'Enregistrer', 'Save module')}</Btn>
                </div>
              </div>
            </div>
          </FormPanel>
        </form>
      ) : items === null ? (
        <SkeletonRows n={3} />
      ) : items.length === 0 ? (
        <Empty title={tx('لا توجد مقررات بعد', 'Aucun cours pour le moment', 'No modules yet')} body={tx('أنشئ أول مقرر ليظهر للطلبة.', 'Créez votre premier cours pour le rendre visible.', 'Create your first module to make it visible to students.')} action={<Btn onClick={() => open()}>{tx('مقرر جديد', 'Nouveau cours', 'New module')}</Btn>} />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((c) => (
            <li key={c.id} className="flex flex-col gap-3 rounded-[18px] bg-sheet-card p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5" data-testid={`teacher-course-${c.id}`}>
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-sheet-line text-[12px] font-semibold text-sheet-muted">{c.imageUrl ? <img src={c.imageUrl} alt="" className="h-full w-full object-cover" /> : 'IMG'}</span>
                <div className="min-w-0">
                  <p className="text-[16px] font-medium">{locale === 'fr' && c.titleFr ? c.titleFr : c.titleAr}</p>
                  <p className="flex flex-wrap items-center gap-2 text-[13px] text-sheet-muted">{c.lessonsCount} {tx('درساً', 'leçons', 'lessons')}<Tag>{trackLabel(c.category)}</Tag><Tag>{c.isLive ? tx('مباشر', 'En direct', 'Live') : tx('مسجّل', 'Enregistré', 'Recorded')}</Tag></p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span className="text-[13px] text-sheet-muted">{c.priceDzd ? formatDZD(c.priceDzd, locale) : tx('السعر تحدده الإدارة', 'Prix fixé par la direction', 'Price set by management')}</span>
                <Btn variant="secondary" onClick={() => open(c)}>{tx('تعديل', 'Modifier', 'Edit')}</Btn>
                <Btn variant="secondary" onClick={() => setConfirm(c)}>{tx('حذف', 'Supprimer', 'Delete')}</Btn>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={tx('حذف المقرر؟', 'Supprimer ce cours ?', 'Delete this module?')}>
        <p className="mb-5 text-[15px] text-sheet-muted">{confirm ? (locale === 'fr' && confirm.titleFr ? confirm.titleFr : confirm.titleAr) : ''}</p>
        <div className="flex flex-wrap gap-3">
          <Btn onClick={remove} data-testid="teacher-confirm-delete">{tx('نعم، احذف', 'Oui, supprimer', 'Yes, delete')}</Btn>
          <Btn variant="secondary" onClick={() => setConfirm(null)}>{tx('إلغاء', 'Annuler', 'Cancel')}</Btn>
        </div>
      </Modal>
    </div>
  );
};
