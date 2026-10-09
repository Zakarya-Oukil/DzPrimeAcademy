'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Layers, BookOpen, Pencil, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { usePlatformStore, PlatformCourse } from '@/lib/platformStore';
import { formatDZD } from '@/lib/format';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { VideoField } from '@/components/shared/VideoField';
import { trackLabel } from '@/lib/courseDisplay';

interface CoursesTabProps {
  locale: string;
}

type CourseForm = {
  titleAr: string;
  titleFr: string;
  description: string;
  teacherId: string;
  teacherName: string;
  category: 'BAC' | 'UNIVERSITY_LMD' | 'MEDICAL';
  priceDzd: number;
  lessonsCount: number;
  isLive: boolean;
  colorTheme: string;
  imageUrl: string | null;
  videoUrl: string | null;
};

const EMPTY_COURSE: CourseForm = {
  titleAr: '',
  titleFr: '',
  description: '',
  teacherId: '',
  teacherName: '',
  category: 'UNIVERSITY_LMD',
  priceDzd: 3000,
  lessonsCount: 10,
  isLive: true,
  colorTheme: 'lime',
  imageUrl: null,
  videoUrl: null,
};

export const CoursesTab: React.FC<CoursesTabProps> = ({ locale }) => {
  const { courses, removeCourse, refresh } = usePlatformStore();
  const [modules, setModules] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [formError, setFormError] = useState('');
  const [moduleError, setModuleError] = useState('');
  const [saving, setSaving] = useState(false);
  const ar = locale === 'ar';
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<PlatformCourse | null>(null);

  const [courseForm, setCourseForm] = useState<CourseForm>(EMPTY_COURSE);

  const [moduleForm, setModuleForm] = useState({
    nameAr: '',
    nameFr: '',
    code: '',
    coefficient: 2,
    trackType: 'UNIVERSITY_LMD' as const,
  });

  const loadModules = () => fetch('/api/modules').then((r) => r.json()).then(setModules).catch(() => {});

  useEffect(() => {
    loadModules();
    // Load registered teachers to populate dropdown
    fetch('/api/teachers')
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (Array.isArray(list)) {
          const seen = new Map<string, string>();
          list.forEach((t: any) => t.user?.id && seen.set(t.user.id, t.user.name));
          setTeachers(Array.from(seen, ([id, name]) => ({ id, name })));
        }
      })
      .catch(() => {});
  }, []);

  const handleAddOrEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const f = courseForm;
    if (f.titleAr.trim().length < 3) return setFormError(ar ? 'العنوان بالعربية مطلوب (3 أحرف على الأقل)' : 'Le titre arabe est requis (3 caractères minimum)');
    if (!Number.isInteger(f.priceDzd) || f.priceDzd < 0) return setFormError(ar ? 'السعر عدد صحيح غير سالب' : 'Le prix doit être un entier positif ou nul');
    if (!Number.isInteger(f.lessonsCount) || f.lessonsCount < 0 || f.lessonsCount > 1000) return setFormError(ar ? 'عدد الدروس بين 0 و1000' : 'Le nombre de leçons doit être entre 0 et 1000');
    if (!f.teacherId && !f.teacherName.trim()) return setFormError(ar ? 'اختر الأستاذ المكلّف' : "Choisissez l'enseignant assigné");
    const teacherName = teachers.find((t) => t.id === f.teacherId)?.name || f.teacherName;
    const payload = { ...f, teacherName, teacherId: f.teacherId || null, titleAr: f.titleAr.trim(), description: f.description.trim() || null };
    setSaving(true);
    try {
      const res = await fetch(editingCourse ? `/api/courses/${editingCourse.id}` : '/api/courses', {
        method: editingCourse ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        return setFormError(d.error || (ar ? 'تعذر حفظ الدورة' : "Échec de l'enregistrement"));
      }
      setEditingCourse(null);
      setShowCourseForm(false);
      setCourseForm(EMPTY_COURSE);
      await refresh();
    } catch {
      setFormError(ar ? 'خطأ في الاتصال بالخادم' : 'Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (c: PlatformCourse) => {
    if (!window.confirm(ar ? `حذف الدورة "${c.titleAr}" نهائياً؟` : `Supprimer définitivement « ${c.titleFr || c.titleAr} » ?`)) return;
    await removeCourse(c.id);
    await refresh(); // shows the real state if the server refused
  };

  const startEditCourse = (c: PlatformCourse) => {
    setEditingCourse(c);
    setFormError('');
    setCourseForm({
      titleAr: c.titleAr,
      titleFr: c.titleFr || '',
      description: c.description || '',
      teacherId: c.teacherId || '',
      teacherName: c.teacherName,
      category: c.category,
      priceDzd: c.priceDzd,
      lessonsCount: c.lessonsCount,
      isLive: c.isLive,
      colorTheme: c.colorTheme || 'lime',
      imageUrl: c.imageUrl ?? null,
      videoUrl: c.videoUrl ?? null,
    });
    setShowCourseForm(true);
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setModuleError('');
    try {
      const res = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moduleForm),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        return setModuleError(d.error || (ar ? 'تعذر حفظ المقياس' : "Échec de l'enregistrement du module"));
      }
    } catch {
      return setModuleError(ar ? 'خطأ في الاتصال بالخادم' : 'Erreur de connexion');
    }
    setModuleForm({ nameAr: '', nameFr: '', code: '', coefficient: 2, trackType: 'UNIVERSITY_LMD' });
    setShowModuleForm(false);
    loadModules();
  };

  const handleDeleteModule = async (id: string) => {
    if (!window.confirm(ar ? 'حذف هذا المقياس نهائياً؟' : 'Supprimer définitivement ce module ?')) return;
    try {
      const res = await fetch(`/api/modules?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setModuleError(d.error || (ar ? 'تعذر حذف المقياس' : 'Échec de la suppression du module'));
        return;
      }
      setModuleError('');
    } catch {
      setModuleError(ar ? 'خطأ في الاتصال بالخادم' : 'Erreur de connexion');
      return;
    }
    loadModules();
  };

  return (
    <div className="space-y-8" data-testid="courses-tab">
      {/* Top Commercial Banner */}
      <div className="p-5 rounded-3xl bg-[#111114] border border-gold-500/30 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-white">
                {locale === 'ar' ? 'إدارة دورات ومقررات الامتياز (Dawarat)' : 'Gestion des Dawarat & Modules d\'Excellence'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                {ar ? 'الإدارة التجارية' : 'Direction commerciale'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {locale === 'ar'
                ? 'نظام الإدارة الحصري للمصلحة التجارية: إنشاء المقررات، إسناد الأساتذة، وتحديد الأسعار'
                : 'Administration exclusive Direction Commerciale : création, assignation enseignants et tarifs'}
            </p>
          </div>
        </div>

        <button
          data-testid="add-course-btn"
          onClick={() => {
            setEditingCourse(null);
            setCourseForm(EMPTY_COURSE);
            setFormError('');
            setShowCourseForm(!showCourseForm);
          }}
          className="px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-black text-xs flex items-center gap-2 shadow-gold-glow active:scale-95 transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{locale === 'ar' ? 'إضافة دورة أو مقرر جديد' : 'Ajouter un Cours'}</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Course Form Modal / Accordion */}
        {showCourseForm && (
          <form
            onSubmit={handleAddOrEditCourse}
            data-testid="add-course-form"
            className="p-5 rounded-3xl bg-white/[0.04] border border-gold-400/30 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-2xl relative"
          >
            <div className="sm:col-span-3 flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-black text-gold-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-gold-400" />
                {editingCourse
                  ? (locale === 'ar' ? `تعديل الدورة: ${editingCourse.titleAr}` : `Modifier: ${editingCourse.titleAr}`)
                  : (locale === 'ar' ? 'بيانات المقرر أو الدورة الجديدة (Dawra)' : 'Nouveau Cours')}
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowCourseForm(false);
                  setEditingCourse(null);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400"
                aria-label={ar ? 'إغلاق' : 'Fermer'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-gray-300">{ar ? 'العنوان بالعربية *' : 'Titre (arabe) *'}</span>
              <input
                required
                minLength={3}
                maxLength={160}
                value={courseForm.titleAr}
                onChange={(e) => setCourseForm({ ...courseForm, titleAr: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-400"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-gray-300">{ar ? 'العنوان بالفرنسية' : 'Titre (français)'}</span>
              <input
                maxLength={160}
                value={courseForm.titleFr}
                onChange={(e) => setCourseForm({ ...courseForm, titleFr: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-400"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-gray-300">{ar ? 'الأستاذ المكلّف *' : 'Enseignant assigné *'}</span>
              <select
                value={courseForm.teacherId}
                onChange={(e) => setCourseForm({ ...courseForm, teacherId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-xs text-gray-200 focus:outline-none focus:border-gold-400"
              >
                <option value="">{ar ? '— اختر الأستاذ —' : '— Choisir —'}</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-gray-300">{ar ? 'المسار' : 'Parcours'}</span>
              <select
                value={courseForm.category}
                onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value as CourseForm['category'] })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-xs text-gray-200 focus:outline-none focus:border-gold-400"
              >
                {(['UNIVERSITY_LMD', 'BAC', 'MEDICAL'] as const).map((k) => (
                  <option key={k} value={k}>{trackLabel(k, locale)}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-gray-300">{ar ? 'السعر (دج)' : 'Prix (DZD)'}</span>
              <input
                type="number"
                min={0}
                step={1}
                value={courseForm.priceDzd}
                onChange={(e) => setCourseForm({ ...courseForm, priceDzd: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-400 font-mono"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-gray-300">{ar ? 'عدد الدروس' : 'Nombre de leçons'}</span>
              <input
                type="number"
                min={0}
                max={1000}
                step={1}
                value={courseForm.lessonsCount}
                onChange={(e) => setCourseForm({ ...courseForm, lessonsCount: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-400 font-mono"
              />
            </label>

            <label className="block space-y-1 sm:col-span-3">
              <span className="text-[11px] font-bold text-gray-300">{ar ? 'الوصف' : 'Description'}</span>
              <textarea
                rows={3}
                maxLength={4000}
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-400"
              />
            </label>

            <div className="sm:col-span-3 max-w-md">
              <ImageUploader
                kind="course"
                locale={locale}
                label={ar ? 'صورة المقرر' : 'Image du cours'}
                value={courseForm.imageUrl}
                onChange={(url) => setCourseForm({ ...courseForm, imageUrl: url })}
              />
            </div>

            <div className="sm:col-span-3 max-w-md">
              <VideoField
                kind="course"
                locale={locale}
                label={ar ? 'فيديو تعريفي (اختياري)' : 'Vidéo de présentation (optionnel)'}
                value={courseForm.videoUrl}
                onChange={(url) => setCourseForm({ ...courseForm, videoUrl: url })}
              />
            </div>

            {formError && (
              <p role="alert" data-testid="course-form-error" className="sm:col-span-3 text-xs font-bold text-rose-400">{formError}</p>
            )}

            <div className="sm:col-span-3 flex items-center justify-between pt-2">
              <label className="text-xs text-gray-400 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={courseForm.isLive}
                  onChange={(e) => setCourseForm({ ...courseForm, isLive: e.target.checked })}
                  className="rounded border-gray-700 text-gold-500 focus:ring-gold-400"
                />
                <span>{ar ? 'دورة مباشرة مع حصص تفاعلية Live' : 'Cours Live interactif'}</span>
              </label>

              <button
                type="submit"
                disabled={saving}
                data-testid="submit-course-btn"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-navy-950 font-black text-xs shadow-md active:scale-95 transition-all disabled:opacity-60"
              >
                {editingCourse
                  ? (ar ? 'تحديث ونشر التعديلات ✓' : 'Mettre à jour')
                  : (ar ? 'نشر الدورة فوراً ✓' : 'Publier le cours')}
              </button>
            </div>
          </form>
        )}

        {/* Courses Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {courses.map((c) => (
            <div
              key={c.id}
              data-testid={`admin-course-card-${c.id}`}
              className="p-4 rounded-3xl bg-[#0b0b0d] border border-white/10 hover:border-gold-500/40 transition-all space-y-2.5 shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-lg bg-gold-400/10 text-gold-300 text-[10px] font-bold border border-gold-400/20">
                  {trackLabel(c.category, locale)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    data-testid={`edit-course-${c.id}`}
                    onClick={() => startEditCourse(c)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gold-300 transition-colors"
                    title={ar ? 'تعديل الدورة' : 'Modifier'}
                    aria-label={ar ? 'تعديل الدورة' : 'Modifier'}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    data-testid={`remove-course-${c.id}`}
                    onClick={() => handleDeleteCourse(c)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-colors"
                    title={ar ? 'حذف' : 'Supprimer'}
                    aria-label={ar ? 'حذف الدورة' : 'Supprimer le cours'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h4 className="text-xs font-bold text-white truncate">
                {locale === 'ar' ? c.titleAr : c.titleFr || c.titleAr}
              </h4>
              <p className="text-[11px] text-gray-400">
                {c.teacherName} &bull; {c.lessonsCount} {locale === 'ar' ? 'حصة معتمدة' : 'leçons'}
              </p>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-lime-400">{formatDZD(c.priceDzd, locale)}</span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{locale === 'ar' ? 'معتمد تجارياً' : 'Actif'}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modules Curriculum Section */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-lime-400" />
            {locale === 'ar' ? 'دليل المقاييس الأكاديمية (LMD & BAC)' : 'Curriculum Modules (LMD & BAC)'}
          </h3>
          <button
            data-testid="add-module-btn"
            onClick={() => setShowModuleForm(!showModuleForm)}
            className="px-3.5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{locale === 'ar' ? 'إضافة مقياس' : 'Ajouter'}</span>
          </button>
        </div>

        {showModuleForm && (
          <form
            onSubmit={handleAddModule}
            data-testid="add-module-form"
            className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 grid grid-cols-1 sm:grid-cols-4 gap-3"
          >
            <input
              required
              placeholder={ar ? 'اسم المقياس (عربي)' : 'Nom (arabe)'}
              aria-label={ar ? 'اسم المقياس (عربي)' : 'Nom (arabe)'}
              value={moduleForm.nameAr}
              onChange={(e) => setModuleForm({ ...moduleForm, nameAr: e.target.value })}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500"
            />
            <input
              placeholder={ar ? 'اسم المقياس (فرنسي)' : 'Nom (français)'}
              aria-label={ar ? 'اسم المقياس (فرنسي)' : 'Nom (français)'}
              value={moduleForm.nameFr}
              onChange={(e) => setModuleForm({ ...moduleForm, nameFr: e.target.value })}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500"
            />
            <input
              required
              placeholder={ar ? 'الرمز' : 'Code'}
              aria-label={ar ? 'رمز المقياس' : 'Code du module'}
              value={moduleForm.code}
              onChange={(e) => setModuleForm({ ...moduleForm, code: e.target.value })}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500"
            />
            <input
              type="number"
              placeholder={ar ? 'المعامل' : 'Coefficient'}
              aria-label={ar ? 'المعامل' : 'Coefficient'}
              value={moduleForm.coefficient}
              onChange={(e) => setModuleForm({ ...moduleForm, coefficient: Number(e.target.value) })}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500"
            />
            {moduleError && (
              <p role="alert" data-testid="module-form-error" className="sm:col-span-4 text-xs font-bold text-rose-400">{moduleError}</p>
            )}
            <button
              type="submit"
              data-testid="submit-module-btn"
              className="sm:col-span-4 py-2 rounded-xl bg-lime-400 text-navy-950 font-bold text-xs"
            >
              {locale === 'ar' ? 'حفظ المقياس' : 'Enregistrer'}
            </button>
          </form>
        )}

        {moduleError && !showModuleForm && (
          <p role="alert" className="text-xs font-bold text-rose-400">{moduleError}</p>
        )}

        <div className="overflow-x-auto no-scrollbar rounded-2xl border border-white/10">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-[11px] uppercase bg-white/[0.02]">
                <th className="py-3 px-4">{locale === 'ar' ? 'المقياس' : 'Module'}</th>
                <th className="py-3 px-4">{ar ? 'الرمز' : 'Code'}</th>
                <th className="py-3 px-4">{ar ? 'المعامل' : 'Coef.'}</th>
                <th className="py-3 px-4">{ar ? 'المسار' : 'Parcours'}</th>
                <th className="py-3 px-4 text-center">{locale === 'ar' ? 'إجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-200">
              {modules.map((m) => (
                <tr key={m.id} data-testid={`module-row-${m.id}`} className="hover:bg-white/[0.03]">
                  <td className="py-3 px-4 font-bold text-white">
                    {locale === 'ar' ? m.nameAr : m.nameFr || m.nameAr}
                  </td>
                  <td className="py-3 px-4 font-mono">{m.code}</td>
                  <td className="py-3 px-4 font-mono">{m.coefficient}</td>
                  <td className="py-3 px-4">{trackLabel(m.trackType, locale)}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      data-testid={`delete-module-${m.id}`}
                      onClick={() => handleDeleteModule(m.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-gray-500 hover:text-rose-400"
                      aria-label={ar ? 'حذف المقياس' : 'Supprimer le module'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
