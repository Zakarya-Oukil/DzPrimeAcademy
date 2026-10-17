'use client';

import React, { useEffect, useState } from 'react';
import { Btn, Empty, Field, PageHead, SelectInput, Status, TextInput, Toggle, fieldClass, focus, useTx } from '@/components/student-v2/ui';
import { Banner, Dialog } from '@/components/shared-v2/Dialog';
import { ImageField, VideoUrlField } from '@/components/teacher-v2/MediaFields';
import { usePlatformStore, PlatformCourse } from '@/lib/platformStore';
import { formatDZD } from '@/lib/format';
import { trackLabel } from '@/lib/courseDisplay';
import { Actions, CardGrid, Col, ConfirmDialog, DataTable, FormGrid, H2, InfoCard, RowAction } from './ui';

type CourseForm = {
  titleAr: string; titleFr: string; description: string; teacherId: string; teacherName: string;
  category: 'BAC' | 'UNIVERSITY_LMD' | 'MEDICAL'; priceDzd: number; lessonsCount: number; isLive: boolean;
  colorTheme: string; imageUrl: string | null; videoUrl: string | null;
};
const EMPTY: CourseForm = { titleAr: '', titleFr: '', description: '', teacherId: '', teacherName: '', category: 'UNIVERSITY_LMD', priceDzd: 3000, lessonsCount: 10, isLive: true, colorTheme: 'lime', imageUrl: null, videoUrl: null };
const TRACKS = ['UNIVERSITY_LMD', 'BAC', 'MEDICAL'] as const;

/** Courses and modules (Figma page 31, "Courses"). Same store, API and validation as the old tab. */
export const CoursesSection: React.FC = () => {
  const { tx, locale } = useTx();
  const { courses, removeCourse, refresh } = usePlatformStore();
  const [modules, setModules] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [courseOpen, setCourseOpen] = useState(false);
  const [moduleOpen, setModuleOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformCourse | null>(null);
  const [form, setForm] = useState<CourseForm>(EMPTY);
  const [formErr, setFormErr] = useState('');
  const [moduleErr, setModuleErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [mForm, setMForm] = useState({ nameAr: '', nameFr: '', code: '', coefficient: 2, trackType: 'UNIVERSITY_LMD' as string });
  const [delCourse, setDelCourse] = useState<PlatformCourse | null>(null);
  const [delModule, setDelModule] = useState<any | null>(null);

  const loadModules = () => fetch('/api/modules').then((r) => r.json()).then((d) => setModules(Array.isArray(d) ? d : [])).catch(() => {});
  useEffect(() => {
    loadModules();
    fetch('/api/teachers').then((r) => (r.ok ? r.json() : [])).then((list) => {
      if (Array.isArray(list)) {
        const seen = new Map<string, string>();
        list.forEach((t: any) => t.user?.id && seen.set(t.user.id, t.user.name));
        setTeachers(Array.from(seen, ([id, name]) => ({ id, name })));
      }
    }).catch(() => {});
  }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY); setFormErr(''); setCourseOpen(true); };
  const openEdit = (c: PlatformCourse) => {
    setEditing(c); setFormErr('');
    setForm({ titleAr: c.titleAr, titleFr: c.titleFr || '', description: c.description || '', teacherId: c.teacherId || '', teacherName: c.teacherName, category: c.category, priceDzd: c.priceDzd, lessonsCount: c.lessonsCount, isLive: c.isLive, colorTheme: c.colorTheme || 'lime', imageUrl: c.imageUrl ?? null, videoUrl: c.videoUrl ?? null });
    setCourseOpen(true);
  };

  const saveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr('');
    const f = form;
    if (f.titleAr.trim().length < 3) return setFormErr(tx('العنوان بالعربية مطلوب (3 أحرف على الأقل)', 'Le titre arabe est requis (3 caractères minimum)', 'The Arabic title is required (3+ characters)'));
    if (!Number.isInteger(f.priceDzd) || f.priceDzd < 0) return setFormErr(tx('السعر عدد صحيح غير سالب', 'Le prix doit être un entier positif ou nul', 'The price must be a whole number, 0 or more'));
    if (!Number.isInteger(f.lessonsCount) || f.lessonsCount < 0 || f.lessonsCount > 1000) return setFormErr(tx('عدد الدروس بين 0 و1000', 'Le nombre de leçons doit être entre 0 et 1000', 'Lessons must be between 0 and 1000'));
    if (!f.teacherId && !f.teacherName.trim()) return setFormErr(tx('اختر الأستاذ المكلّف', "Choisissez l'enseignant assigné", 'Choose the assigned teacher'));
    const teacherName = teachers.find((t) => t.id === f.teacherId)?.name || f.teacherName;
    const payload = { ...f, teacherName, teacherId: f.teacherId || null, titleAr: f.titleAr.trim(), description: f.description.trim() || null };
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/courses/${editing.id}` : '/api/courses', { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); return setFormErr(d.error || tx('تعذر حفظ الدورة', "Échec de l'enregistrement", 'Could not save the course')); }
      setCourseOpen(false); setEditing(null); setForm(EMPTY);
      await refresh();
    } catch {
      setFormErr(tx('خطأ في الاتصال بالخادم', 'Erreur de connexion', 'Network error'));
    } finally {
      setSaving(false);
    }
  };

  const removeCourseNow = async () => { if (!delCourse) return; await removeCourse(delCourse.id); setDelCourse(null); await refresh(); };

  const saveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setModuleErr('');
    try {
      const res = await fetch('/api/modules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mForm) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); return setModuleErr(d.error || tx('تعذر حفظ المقياس', "Échec de l'enregistrement du module", 'Could not save the module')); }
    } catch {
      return setModuleErr(tx('خطأ في الاتصال بالخادم', 'Erreur de connexion', 'Network error'));
    }
    setMForm({ nameAr: '', nameFr: '', code: '', coefficient: 2, trackType: 'UNIVERSITY_LMD' });
    setModuleOpen(false);
    loadModules();
  };

  const removeModuleNow = async () => {
    if (!delModule) return;
    try {
      const res = await fetch(`/api/modules?id=${delModule.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setModuleErr(d.error || tx('تعذر حذف المقياس', 'Échec de la suppression du module', 'Could not delete the module')); }
      else setModuleErr('');
    } catch {
      setModuleErr(tx('خطأ في الاتصال بالخادم', 'Erreur de connexion', 'Network error'));
    }
    setDelModule(null);
    loadModules();
  };

  const mCols: Col<any>[] = [
    { id: 'name', header: tx('المقياس', 'Module', 'Module'), w: '2fr', cell: (m) => <span className="font-semibold">{locale === 'ar' ? m.nameAr : m.nameFr || m.nameAr}</span> },
    { id: 'code', header: tx('الرمز', 'Code', 'Code'), w: '1fr', cell: (m) => <bdi>{m.code}</bdi> },
    { id: 'coef', header: tx('المعامل', 'Coef.', 'Coefficient'), w: '0.8fr', cell: (m) => <bdi>{m.coefficient}</bdi> },
    { id: 'track', header: tx('المسار', 'Parcours', 'Track'), w: '1.2fr', cell: (m) => trackLabel(m.trackType, locale) || m.trackType },
    { id: 'act', header: tx('إجراء', 'Action', 'Action'), w: '0.9fr', m: 'actions', cell: (m) => <Actions><RowAction danger onClick={() => setDelModule(m)}>{tx('حذف', 'Supprimer', 'Delete')}</RowAction></Actions> },
  ];

  const trackOpts = TRACKS.map((k) => ({ value: k, label: trackLabel(k, locale) }));

  return (
    <div className="flex flex-col gap-8" data-testid="courses-tab">
      <PageHead
        title={tx('الدورات والمقررات', 'Cours et modules', 'Courses and modules')}
        sub={tx('إنشاء المقررات وإسناد الأساتذة وتحديد الأسعار.', 'Créer les cours, assigner les enseignants et fixer les tarifs.', 'Create courses, assign teachers and set prices.')}
        action={<Btn onClick={openNew} data-testid="add-course-btn">{tx('إضافة دورة أو مقرر جديد', 'Ajouter un cours', 'Add a course')}</Btn>}
      />

      <section className="flex flex-col gap-3">
        <H2>{tx('الدورات', 'Cours', 'Courses')}</H2>
        {courses.length === 0 ? (
          <Empty title={tx('لا توجد دورات بعد', 'Aucun cours', 'No courses yet')} body={tx('أنشئ أول دورة وأسندها لأستاذ.', 'Créez le premier cours et assignez-le.', 'Create the first course and assign a teacher.')} action={<Btn variant="secondary" onClick={openNew}>{tx('إضافة دورة', 'Ajouter', 'Add')}</Btn>} />
        ) : (
          <CardGrid>
            {courses.map((c) => (
              <InfoCard
                key={c.id}
                testId={`course-row-${c.id}`}
                title={locale === 'ar' ? c.titleAr : c.titleFr || c.titleAr}
                sub={c.teacherName}
                image={c.imageUrl}
                status={<Status kind="ok">{tx('معتمد تجارياً', 'Validé commercialement', 'Commercially approved')}</Status>}
                lines={[
                  [tx('السعر (دج)', 'Prix (DZD)', 'Price (DZD)'), <bdi key="p">{formatDZD(c.priceDzd, locale)}</bdi>],
                  [tx('عدد الدروس', 'Leçons', 'Lessons'), <bdi key="l">{c.lessonsCount}</bdi>],
                  [tx('المسار', 'Parcours', 'Track'), trackLabel(c.category, locale)],
                  [tx('النوع', 'Type', 'Type'), c.isLive ? tx('دورة مباشرة مع حصص تفاعلية', 'Cours en direct avec sessions interactives', 'Live course with interactive sessions') : tx('دورة مسجلة', 'Cours enregistré', 'Recorded course')],
                ]}
                actions={<><RowAction onClick={() => openEdit(c)} label={tx('تعديل الدورة', 'Modifier', 'Edit')}>{tx('تعديل الدورة', 'Modifier', 'Edit course')}</RowAction><RowAction danger onClick={() => setDelCourse(c)} label={tx('حذف الدورة', 'Supprimer le cours', 'Delete course')}>{tx('حذف الدورة', 'Supprimer', 'Delete course')}</RowAction></>}
              />
            ))}
          </CardGrid>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <H2 action={<Btn variant="secondary" onClick={() => { setModuleErr(''); setModuleOpen(true); }}>{tx('إضافة مقياس', 'Ajouter un module', 'Add a module')}</Btn>}>{tx('دليل المقاييس الأكاديمية (LMD & BAC)', 'Répertoire des modules (LMD et BAC)', 'Academic modules (LMD and BAC)')}</H2>
        {moduleErr ? <Banner kind="danger">{moduleErr}</Banner> : null}
        {modules.length === 0 ? <Empty title={tx('لا توجد مقاييس بعد', 'Aucun module', 'No modules yet')} /> : <DataTable cols={mCols} rows={modules} rowKey={(m) => m.id} label={tx('المقاييس', 'Modules', 'Modules')} testId="modules-table" />}
      </section>

      <Dialog open={courseOpen} onClose={() => setCourseOpen(false)} size="lg" title={editing ? tx('تعديل الدورة', 'Modifier le cours', 'Edit course') : tx('بيانات الدورة الجديدة', 'Nouveau cours', 'New course')} testId="add-course-form">
        <form onSubmit={saveCourse} className="flex flex-col gap-4">
          {formErr ? <Banner kind="danger" testId="add-course-error">{formErr}</Banner> : null}
          <FormGrid>
            <TextInput id="co-ar" label={tx('العنوان بالعربية *', 'Titre en arabe *', 'Arabic title *')} value={form.titleAr} onChange={(v) => setForm({ ...form, titleAr: v })} />
            <TextInput id="co-fr" label={tx('العنوان بالفرنسية', 'Titre en français', 'French title')} dir="ltr" value={form.titleFr} onChange={(v) => setForm({ ...form, titleFr: v })} />
            <SelectInput id="co-teacher" label={tx('الأستاذ المكلّف *', 'Enseignant assigné *', 'Assigned teacher *')} value={form.teacherId} onChange={(v) => setForm({ ...form, teacherId: v })} options={[{ value: '', label: tx('— اختر الأستاذ —', '— Choisir —', '— Choose —') }, ...teachers.map((t) => ({ value: t.id, label: t.name }))]} />
            <SelectInput id="co-track" label={tx('المسار', 'Parcours', 'Track')} value={form.category} onChange={(v) => setForm({ ...form, category: v as CourseForm['category'] })} options={trackOpts} />
            <TextInput id="co-price" label={tx('السعر (دج)', 'Prix (DZD)', 'Price (DZD)')} type="number" min={0} dir="ltr" value={String(form.priceDzd)} onChange={(v) => setForm({ ...form, priceDzd: Number(v) })} />
            <TextInput id="co-lessons" label={tx('عدد الدروس', 'Nombre de leçons', 'Lessons')} type="number" min={0} dir="ltr" value={String(form.lessonsCount)} onChange={(v) => setForm({ ...form, lessonsCount: Number(v) })} />
          </FormGrid>
          <Field label={tx('الوصف', 'Description', 'Description')} htmlFor="co-desc">
            <textarea id="co-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${fieldClass} py-3`} />
          </Field>
          <ImageField id="co-img" kind="course" label={tx('صورة المقرر', 'Image du cours', 'Course image')} value={form.imageUrl} onChange={(u) => setForm({ ...form, imageUrl: u })} />
          <VideoUrlField id="co-video" kind="course" label={tx('فيديو تعريفي (اختياري)', 'Vidéo de présentation (optionnel)', 'Intro video (optional)')} value={form.videoUrl} onChange={(u) => setForm({ ...form, videoUrl: u })} />
          <div className="flex items-center justify-between gap-4 rounded-[14px] bg-sheet-card px-4 py-3">
            <span className="text-[15px] font-semibold">{tx('دورة مباشرة مع حصص تفاعلية', 'Cours en direct avec sessions interactives', 'Live course with interactive sessions')}</span>
            <Toggle on={form.isLive} onChange={(v) => setForm({ ...form, isLive: v })} label={tx('دورة مباشرة', 'En direct', 'Live course')} />
          </div>
          <div className="flex flex-wrap justify-end gap-2.5">
            <Btn variant="secondary" onClick={() => setCourseOpen(false)}>{tx('إلغاء', 'Annuler', 'Cancel')}</Btn>
            <button type="submit" disabled={saving} data-testid="submit-course-btn" className={`inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold-500 px-6 text-[15px] font-semibold text-[#050505] hover:bg-gold-400 disabled:opacity-60 ${focus}`}>{saving ? '…' : editing ? tx('تحديث ونشر التعديلات', 'Mettre à jour', 'Update') : tx('نشر الدورة فوراً', 'Publier le cours', 'Publish course')}</button>
          </div>
        </form>
      </Dialog>

      <Dialog open={moduleOpen} onClose={() => setModuleOpen(false)} title={tx('إضافة مقياس', 'Ajouter un module', 'Add a module')} testId="add-module-form">
        <form onSubmit={saveModule} className="flex flex-col gap-4">
          {moduleErr ? <Banner kind="danger">{moduleErr}</Banner> : null}
          <FormGrid>
            <TextInput id="mo-ar" label={tx('اسم المقياس (عربي)', 'Nom (arabe)', 'Name (Arabic)')} value={mForm.nameAr} onChange={(v) => setMForm({ ...mForm, nameAr: v })} required />
            <TextInput id="mo-fr" label={tx('اسم المقياس (فرنسي)', 'Nom (français)', 'Name (French)')} dir="ltr" value={mForm.nameFr} onChange={(v) => setMForm({ ...mForm, nameFr: v })} />
            <TextInput id="mo-code" label={tx('رمز المقياس', 'Code du module', 'Module code')} dir="ltr" value={mForm.code} onChange={(v) => setMForm({ ...mForm, code: v })} required />
            <TextInput id="mo-coef" label={tx('المعامل', 'Coefficient', 'Coefficient')} type="number" min={0} dir="ltr" value={String(mForm.coefficient)} onChange={(v) => setMForm({ ...mForm, coefficient: Number(v) })} />
          </FormGrid>
          <SelectInput id="mo-track" label={tx('المسار', 'Parcours', 'Track')} value={mForm.trackType} onChange={(v) => setMForm({ ...mForm, trackType: v })} options={trackOpts} />
          <div className="flex flex-wrap justify-end gap-2.5">
            <Btn variant="secondary" onClick={() => setModuleOpen(false)}>{tx('إلغاء', 'Annuler', 'Cancel')}</Btn>
            <button type="submit" className={`inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold-500 px-6 text-[15px] font-semibold text-[#050505] hover:bg-gold-400 ${focus}`}>{tx('حفظ المقياس', 'Enregistrer le module', 'Save module')}</button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog open={!!delCourse} onClose={() => setDelCourse(null)} onConfirm={removeCourseNow} title={tx('حذف الدورة', 'Supprimer le cours', 'Delete course')} body={`${tx('حذف الدورة نهائياً؟', 'Supprimer définitivement ce cours ?', 'Delete this course permanently?')} ${delCourse ? (locale === 'ar' ? delCourse.titleAr : delCourse.titleFr || delCourse.titleAr) : ''}`} confirm={tx('حذف', 'Supprimer', 'Delete')} />
      <ConfirmDialog open={!!delModule} onClose={() => setDelModule(null)} onConfirm={removeModuleNow} title={tx('حذف المقياس', 'Supprimer le module', 'Delete module')} body={tx('حذف هذا المقياس نهائياً؟', 'Supprimer définitivement ce module ?', 'Delete this module permanently?')} confirm={tx('حذف', 'Supprimer', 'Delete')} />
    </div>
  );
};
