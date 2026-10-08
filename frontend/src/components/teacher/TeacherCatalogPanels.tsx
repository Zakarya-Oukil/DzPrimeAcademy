'use client';

import { trackLabel } from '@/lib/courseDisplay';
import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, Calendar, Clock, Pencil, Plus, Trash2, Video, X } from 'lucide-react';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { VideoField } from '@/components/shared/VideoField';
import { formatDZD } from '@/lib/format';

// Decision D1: a teacher manages their own courses and live sessions. The server decides ownership from the
// login (teacherId); these panels only show what /api/courses and /api/sessions say is theirs.

interface PanelProps {
  locale: string;
  userId: string;
}

interface Course {
  id: string;
  titleAr: string;
  titleFr?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  category: 'BAC' | 'UNIVERSITY_LMD' | 'MEDICAL';
  lessonsCount: number;
  priceDzd: number;
  isLive: boolean;
  teacherId?: string | null;
}

interface LiveSession {
  id: string;
  title: string;
  courseId?: string | null;
  scheduledAt: string;
  durationMinutes: number;
  platform: 'GOOGLE_MEET' | 'CLASSROOM' | 'ONSITE';
  meetUrl?: string | null;
  teacherId?: string | null;
  registrationsCount?: number;
}

const field = 'w-full min-h-11 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-gold-500';
const labelCls = 'block text-xs font-bold text-slate-600 dark:text-gray-300 mb-1.5';
const card = 'rounded-3xl bg-white dark:bg-[#111114] border border-amber-200/60 dark:border-gold-500/20 shadow-sm';
const primaryBtn = 'min-h-11 px-5 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50';
const ghostBtn = 'min-h-11 min-w-11 px-3 rounded-xl border border-slate-200 dark:border-white/15 text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-white/10 text-sm font-bold flex items-center justify-center gap-2';

async function api(path: string, method: string, body?: unknown) {
  const res = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

const emptyCourse = { titleAr: '', titleFr: '', description: '', category: 'UNIVERSITY_LMD' as Course['category'], lessonsCount: 8, isLive: false, imageUrl: null as string | null, videoUrl: null as string | null };

export const TeacherCoursesPanel: React.FC<PanelProps> = ({ locale, userId }) => {
  const ar = locale === 'ar';
  const t = (a: string, f: string) => (ar ? a : f);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState(emptyCourse);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/courses');
    const all: Course[] = res.ok ? await res.json() : [];
    setCourses(all.filter((c) => c.teacherId === userId));
    setLoading(false);
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  const open = (c?: Course) => {
    setError('');
    setEditing(c ? c.id : 'new');
    setForm(c ? { titleAr: c.titleAr, titleFr: c.titleFr || '', description: c.description || '', category: c.category, lessonsCount: c.lessonsCount, isLive: c.isLive, imageUrl: c.imageUrl ?? null, videoUrl: c.videoUrl ?? null } : emptyCourse);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titleAr.trim()) return setError(t('عنوان المقرر مطلوب.', 'Le titre est obligatoire.'));
    setSaving(true);
    setError('');
    const r = editing === 'new' ? await api('/api/courses', 'POST', form) : await api(`/api/courses/${editing}`, 'PUT', form);
    setSaving(false);
    if (!r.ok) return setError(r.json.error || t('تعذر حفظ المقرر.', 'Impossible d\'enregistrer le cours.'));
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    const r = await api(`/api/courses/${id}`, 'DELETE');
    setConfirmDelete(null);
    if (!r.ok) return setError(r.json.error || t('تعذر حذف المقرر.', 'Suppression impossible.'));
    load();
  };

  return (
    <div className="space-y-6" data-testid="teacher-courses-panel">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-amber-200/60 dark:border-gray-800 gap-3">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gold-500" />
            <span>{t('مقرراتي', 'Mes cours')}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
            {t('أنشئ مقرراتك وعدّلها. تحدّد الإدارة التجارية السعر.', 'Créez et modifiez vos cours. Le prix est fixé par la Direction Commerciale.')}
          </p>
        </div>
        {editing === null && (
          <button type="button" onClick={() => open()} className={primaryBtn} data-testid="teacher-add-course">
            <Plus className="w-4 h-4" /> {t('مقرر جديد', 'Nouveau cours')}
          </button>
        )}
      </div>

      {editing !== null && (
        <form onSubmit={save} className={`${card} p-5 space-y-4`}>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-900 dark:text-white">{editing === 'new' ? t('مقرر جديد', 'Nouveau cours') : t('تعديل المقرر', 'Modifier le cours')}</h4>
            <button type="button" onClick={() => setEditing(null)} aria-label={t('إغلاق', 'Fermer')} className={ghostBtn}><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="tc-title-ar">{t('العنوان بالعربية', 'Titre (arabe)')}</label>
              <input aria-label={t('العنوان بالعربية', 'Titre (arabe)')} id="tc-title-ar" required value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} className={field} />
            </div>
            <div>
              <label className={labelCls} htmlFor="tc-title-fr">{t('العنوان بالفرنسية', 'Titre (français)')}</label>
              <input aria-label={t('العنوان بالفرنسية', 'Titre (français)')} id="tc-title-fr" value={form.titleFr} onChange={(e) => setForm({ ...form, titleFr: e.target.value })} className={field} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="tc-desc">{t('وصف المقرر', 'Description')}</label>
              <textarea aria-label={t('وصف المقرر', 'Description')} id="tc-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={field} />
            </div>
            <div>
              <label className={labelCls} htmlFor="tc-cat">{t('المسار', 'Filière')}</label>
              <select aria-label={t('المسار', 'Filière')} id="tc-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Course['category'] })} className={field}>
                <option value="BAC">BAC</option>
                <option value="UNIVERSITY_LMD">LMD</option>
                <option value="MEDICAL">{t('طب', 'Médecine')}</option>
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="tc-lessons">{t('عدد الدروس', 'Nombre de leçons')}</label>
              <input aria-label={t('عدد الدروس', 'Nombre de leçons')} id="tc-lessons" type="number" min={1} value={form.lessonsCount} onChange={(e) => setForm({ ...form, lessonsCount: Math.max(1, Number(e.target.value) || 1) })} className={field} />
            </div>
            <label className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-700 dark:text-gray-200 min-h-11">
              <input type="checkbox" checked={form.isLive} onChange={(e) => setForm({ ...form, isLive: e.target.checked })} className="w-4 h-4 rounded" />
              {t('مقرر مباشر مع حصص تفاعلية', 'Cours en direct avec séances interactives')}
            </label>
            <div className="sm:col-span-2 max-w-md rounded-2xl bg-[#111114] p-4">
              <ImageUploader kind="course" locale={locale} label={t('صورة المقرر', 'Image du cours')} value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
            </div>
            <div className="sm:col-span-2 max-w-md rounded-2xl bg-[#111114] p-4">
              <VideoField kind="course" locale={locale} label={t('فيديو تعريفي (اختياري)', 'Vidéo de présentation (optionnel)')} value={form.videoUrl} onChange={(url) => setForm({ ...form, videoUrl: url })} />
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className={primaryBtn}>{saving ? t('جارٍ الحفظ', 'Enregistrement') : t('حفظ', 'Enregistrer')}</button>
            <button type="button" onClick={() => setEditing(null)} className={ghostBtn}>{t('إلغاء', 'Annuler')}</button>
          </div>
        </form>
      )}

      {editing === null && error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{[0, 1, 2].map((i) => <div key={i} className="h-56 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />)}</div>
      ) : courses.length === 0 ? (
        <div className={`${card} p-8 text-center text-slate-500 dark:text-gray-400 space-y-3`}>
          <BookOpen className="w-8 h-8 text-gold-500/50 mx-auto" />
          <p className="text-sm font-bold">{t('لا توجد مقررات بعد. أنشئ أول مقرر لك وسيظهر للطلبة.', 'Aucun cours pour le moment. Créez votre premier cours, il sera visible des étudiants.')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c) => (
            <div key={c.id} className={`${card} overflow-hidden flex flex-col`}>
              {c.imageUrl ? <img src={c.imageUrl} alt="" className="w-full aspect-video object-cover" /> : <div className="w-full aspect-video bg-slate-100 dark:bg-white/5" aria-hidden="true" />}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-700 dark:text-gold-400 text-[11px] font-bold">{trackLabel(c.category, locale)}</span>
                    <span className="text-xs font-mono font-black text-slate-900 dark:text-white">{c.priceDzd > 0 ? formatDZD(c.priceDzd) : t('مجاني', 'Gratuit')}</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mt-2">{ar ? c.titleAr : c.titleFr || c.titleAr}</h4>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">{c.lessonsCount} {t('درس', 'leçons')}</p>
                </div>
                {confirmDelete === c.id ? (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600 dark:text-gray-300">{t('حذف هذا المقرر نهائياً؟', 'Supprimer ce cours définitivement ?')}</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => remove(c.id)} className="min-h-11 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold">{t('نعم، احذف', 'Oui, supprimer')}</button>
                      <button type="button" onClick={() => setConfirmDelete(null)} className={ghostBtn}>{t('تراجع', 'Annuler')}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-gray-800">
                    <button type="button" onClick={() => open(c)} className={`${ghostBtn} flex-1`}><Pencil className="w-4 h-4" /> {t('تعديل', 'Modifier')}</button>
                    <button type="button" onClick={() => setConfirmDelete(c.id)} aria-label={t('حذف', 'Supprimer')} className={ghostBtn}><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const emptySession = { title: '', courseId: '', scheduledAt: '', durationMinutes: 60, platform: 'GOOGLE_MEET' as LiveSession['platform'], meetUrl: '' };
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export const TeacherSessionsPanel: React.FC<PanelProps> = ({ locale, userId }) => {
  const ar = locale === 'ar';
  const t = (a: string, f: string) => (ar ? a : f);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState(emptySession);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [s, c] = await Promise.all([fetch('/api/sessions'), fetch('/api/courses')]);
    const allSessions: LiveSession[] = s.ok ? await s.json() : [];
    const allCourses: Course[] = c.ok ? await c.json() : [];
    setSessions(allSessions.filter((x) => x.teacherId === userId));
    setCourses(allCourses.filter((x) => x.teacherId === userId));
    setLoading(false);
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  const open = (s?: LiveSession) => {
    setError('');
    setEditing(s ? s.id : 'new');
    setForm(s ? { title: s.title, courseId: s.courseId || '', scheduledAt: toLocalInput(s.scheduledAt), durationMinutes: s.durationMinutes, platform: s.platform, meetUrl: s.meetUrl || '' } : emptySession);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.scheduledAt) return setError(t('العنوان والموعد مطلوبان.', 'Le titre et la date sont obligatoires.'));
    setSaving(true);
    setError('');
    const body = { title: form.title, courseId: form.courseId || null, scheduledAt: new Date(form.scheduledAt).toISOString(), durationMinutes: form.durationMinutes, platform: form.platform, meetUrl: form.meetUrl.trim() || null };
    const r = editing === 'new' ? await api('/api/sessions', 'POST', body) : await api(`/api/sessions/${editing}`, 'PUT', body);
    setSaving(false);
    if (!r.ok) return setError(r.json.error || t('تعذر حفظ الحصة.', 'Impossible d\'enregistrer la séance.'));
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    const r = await api(`/api/sessions/${id}`, 'DELETE');
    setConfirmDelete(null);
    if (!r.ok) return setError(r.json.error || t('تعذر حذف الحصة.', 'Suppression impossible.'));
    load();
  };

  return (
    <div className="space-y-6" data-testid="teacher-sessions-panel">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-amber-200/60 dark:border-gray-800 gap-3">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-gold-500" />
            <span>{t('حصصي المباشرة', 'Mes séances en direct')}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{t('جدول حصصك وعدّل مواعيدها وروابطها.', 'Planifiez vos séances et modifiez leurs horaires et liens.')}</p>
        </div>
        {editing === null && (
          <button type="button" onClick={() => open()} className={primaryBtn} data-testid="teacher-add-session">
            <Plus className="w-4 h-4" /> {t('حصة جديدة', 'Nouvelle séance')}
          </button>
        )}
      </div>

      {editing !== null && (
        <form onSubmit={save} className={`${card} p-5 space-y-4`}>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-900 dark:text-white">{editing === 'new' ? t('حصة جديدة', 'Nouvelle séance') : t('تعديل الحصة', 'Modifier la séance')}</h4>
            <button type="button" onClick={() => setEditing(null)} aria-label={t('إغلاق', 'Fermer')} className={ghostBtn}><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="ts-title">{t('عنوان الحصة', 'Titre de la séance')}</label>
              <input aria-label={t('عنوان الحصة', 'Titre de la séance')} id="ts-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={field} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ts-course">{t('المقرر (اختياري)', 'Cours (facultatif)')}</label>
              <select aria-label={t('المقرر (اختياري)', 'Cours (facultatif)')} id="ts-course" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} className={field}>
                <option value="">{t('بدون مقرر', 'Aucun cours')}</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{ar ? c.titleAr : c.titleFr || c.titleAr}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="ts-when">{t('الموعد', 'Date et heure')}</label>
              <input aria-label={t('الموعد', 'Date et heure')} id="ts-when" required type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className={field} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ts-dur">{t('المدة (دقيقة)', 'Durée (minutes)')}</label>
              <input aria-label={t('المدة (دقيقة)', 'Durée (minutes)')} id="ts-dur" type="number" min={15} step={15} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Math.max(15, Number(e.target.value) || 60) })} className={field} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ts-platform">{t('المنصة', 'Plateforme')}</label>
              <select aria-label={t('المنصة', 'Plateforme')} id="ts-platform" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as LiveSession['platform'] })} className={field}>
                <option value="GOOGLE_MEET">Google Meet</option>
                <option value="CLASSROOM">Classroom</option>
                <option value="ONSITE">{t('حضوري', 'Sur place')}</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="ts-url">{t('رابط الحصة (https)', 'Lien de la séance (https)')}</label>
              <input aria-label="https://meet.google.com/..." id="ts-url" type="url" dir="ltr" placeholder="https://meet.google.com/..." value={form.meetUrl} onChange={(e) => setForm({ ...form, meetUrl: e.target.value })} className={field} />
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className={primaryBtn}>{saving ? t('جارٍ الحفظ', 'Enregistrement') : t('حفظ', 'Enregistrer')}</button>
            <button type="button" onClick={() => setEditing(null)} className={ghostBtn}>{t('إلغاء', 'Annuler')}</button>
          </div>
        </form>
      )}

      {editing === null && error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{[0, 1, 2].map((i) => <div key={i} className="h-44 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />)}</div>
      ) : sessions.length === 0 ? (
        <div className={`${card} p-8 text-center text-slate-500 dark:text-gray-400 space-y-3`}>
          <Video className="w-8 h-8 text-gold-500/50 mx-auto" />
          <p className="text-sm font-bold">{t('لا توجد حصص مجدولة. اضغط على «حصة جديدة» لتحديد موعد.', 'Aucune séance planifiée. Utilisez « Nouvelle séance » pour fixer une date.')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sessions.map((s) => {
            const past = new Date(s.scheduledAt).getTime() < Date.now();
            return (
              <div key={s.id} className={`${card} p-5 space-y-3 flex flex-col justify-between ${past ? 'opacity-70' : ''}`}>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-700 dark:text-gold-400 text-[11px] font-bold">{s.platform}</span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mt-2">{s.title}</h4>
                  <div className="text-xs text-slate-500 dark:text-gray-400 mt-2 space-y-1 font-mono">
                    <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-gold-500" /><span>{new Date(s.scheduledAt).toLocaleString()}</span></div>
                    <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-gold-500" /><span>{s.durationMinutes} min</span>{typeof s.registrationsCount === 'number' && <span> · {s.registrationsCount} {t('مسجّل', 'inscrits')}</span>}</div>
                  </div>
                </div>
                {confirmDelete === s.id ? (
                  <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-gray-800">
                    <p className="text-xs text-slate-600 dark:text-gray-300">{t('حذف هذه الحصة؟', 'Supprimer cette séance ?')}</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => remove(s.id)} className="min-h-11 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold">{t('نعم، احذف', 'Oui, supprimer')}</button>
                      <button type="button" onClick={() => setConfirmDelete(null)} className={ghostBtn}>{t('تراجع', 'Annuler')}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-gray-800">
                    {s.meetUrl && <a href={s.meetUrl} target="_blank" rel="noopener noreferrer" className={`${ghostBtn} flex-1`}><Video className="w-4 h-4" /> {t('دخول', 'Rejoindre')}</a>}
                    <button type="button" onClick={() => open(s)} aria-label={t('تعديل', 'Modifier')} className={ghostBtn}><Pencil className="w-4 h-4" /></button>
                    <button type="button" onClick={() => setConfirmDelete(s.id)} aria-label={t('حذف', 'Supprimer')} className={ghostBtn}><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
