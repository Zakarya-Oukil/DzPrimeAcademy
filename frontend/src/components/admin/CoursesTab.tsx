'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Layers, BookOpen, Pencil, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { usePlatformStore, PlatformCourse } from '@/lib/platformStore';
import { formatDZD } from '@/lib/format';
import { ImageUploader } from '@/components/shared/ImageUploader';

interface CoursesTabProps {
  locale: string;
}

export const CoursesTab: React.FC<CoursesTabProps> = ({ locale }) => {
  const { courses, addCourse, removeCourse, refresh } = usePlatformStore();
  const [modules, setModules] = useState<any[]>([]);
  const [registeredTeachers, setRegisteredTeachers] = useState<string[]>([]);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<PlatformCourse | null>(null);

  const [courseForm, setCourseForm] = useState({
    titleAr: '',
    titleFr: '',
    teacherName: '',
    category: 'UNIVERSITY_LMD' as 'BAC' | 'UNIVERSITY_LMD' | 'MEDICAL',
    priceDzd: 3000,
    lessonsCount: 10,
    isLive: true,
    colorTheme: 'lime',
    imageUrl: null as string | null,
  });

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
      .then((teachers) => {
        if (Array.isArray(teachers)) {
          const names = teachers.map((t: any) => t.user?.name || t.name).filter(Boolean);
          setRegisteredTeachers(Array.from(new Set(names)));
        }
      })
      .catch(() => {});
  }, []);

  const handleAddOrEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCourse) {
      // Update existing course via PUT
      try {
        const res = await fetch(`/api/courses/${editingCourse.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(courseForm),
        });
        if (res.ok) {
          setEditingCourse(null);
          setShowCourseForm(false);
          refresh();
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // Create new course
      await addCourse(courseForm);
      setCourseForm({
        titleAr: '',
        titleFr: '',
        teacherName: '',
        category: 'UNIVERSITY_LMD',
        priceDzd: 3000,
        lessonsCount: 10,
        isLive: true,
        colorTheme: 'lime',
    imageUrl: null as string | null,
      });
      setShowCourseForm(false);
    }
  };

  const startEditCourse = (c: PlatformCourse) => {
    setEditingCourse(c);
    setCourseForm({
      titleAr: c.titleAr,
      titleFr: c.titleFr || '',
      teacherName: c.teacherName,
      category: c.category,
      priceDzd: c.priceDzd,
      lessonsCount: c.lessonsCount,
      isLive: c.isLive,
      colorTheme: c.colorTheme || 'lime',
      imageUrl: c.imageUrl ?? null,
    });
    setShowCourseForm(true);
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(moduleForm),
    });
    setModuleForm({ nameAr: '', nameFr: '', code: '', coefficient: 2, trackType: 'UNIVERSITY_LMD' });
    setShowModuleForm(false);
    loadModules();
  };

  const handleDeleteModule = async (id: string) => {
    await fetch(`/api/modules?id=${id}`, { method: 'DELETE' });
    loadModules();
  };

  return (
    <div className="space-y-8" data-testid="courses-tab">
      {/* Top Commercial Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#0C152E] via-[#0E1B3D] to-[#0A1024] border border-gold-500/30 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                COMMERCIAL GOVERNANCE
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
            setCourseForm({
              titleAr: '',
              titleFr: '',
              teacherName: '',
              category: 'UNIVERSITY_LMD',
              priceDzd: 3000,
              lessonsCount: 10,
              isLive: true,
              colorTheme: 'lime',
    imageUrl: null as string | null,
            });
            setShowCourseForm(!showCourseForm);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-navy-950 font-black text-xs flex items-center gap-2 shadow-gold-glow active:scale-95 transition-all self-start sm:self-auto shrink-0"
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
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              required
              placeholder={locale === 'ar' ? 'العنوان بالعربية (مثال: دورة التحضير للفيزياء)' : 'Titre (AR)'}
              value={courseForm.titleAr}
              onChange={(e) => setCourseForm({ ...courseForm, titleAr: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-400"
            />
            <input
              placeholder="Titre (FR)"
              value={courseForm.titleFr}
              onChange={(e) => setCourseForm({ ...courseForm, titleFr: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-400"
            />

            {/* Teacher Selection or Input */}
            <div className="relative">
              <input
                required
                list="teachers-list"
                placeholder={locale === 'ar' ? 'اسم الأستاذ المكلّف' : 'Enseignant assigné'}
                value={courseForm.teacherName}
                onChange={(e) => setCourseForm({ ...courseForm, teacherName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-400"
              />
              <datalist id="teachers-list">
                {registeredTeachers.map((tName) => (
                  <option key={tName} value={tName} />
                ))}
              </datalist>
            </div>

            <select
              value={courseForm.category}
              onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value as any })}
              className="px-3.5 py-2.5 rounded-xl bg-[#0A0E1A] border border-white/10 text-xs text-gray-200 focus:outline-none focus:border-gold-400"
            >
              <option value="UNIVERSITY_LMD">University LMD</option>
              <option value="BAC">BAC (البكالوريا)</option>
              <option value="MEDICAL">Medical (العلوم الطبية)</option>
            </select>

            <input
              type="number"
              placeholder={locale === 'ar' ? 'السعر (دج)' : 'Prix (DZD)'}
              value={courseForm.priceDzd}
              onChange={(e) => setCourseForm({ ...courseForm, priceDzd: Number(e.target.value) })}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-gold-400"
            />

            <input
              type="number"
              placeholder={locale === 'ar' ? 'عدد الدروس' : 'Nombre de leçons'}
              value={courseForm.lessonsCount}
              onChange={(e) => setCourseForm({ ...courseForm, lessonsCount: Number(e.target.value) })}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-gold-400"
            />

            <div className="sm:col-span-3 max-w-md">
              <ImageUploader
                kind="course"
                locale={locale}
                label={locale === 'ar' ? 'صورة المقرر' : 'Image du cours'}
                value={courseForm.imageUrl}
                onChange={(url) => setCourseForm({ ...courseForm, imageUrl: url })}
              />
            </div>

            <div className="sm:col-span-3 flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={courseForm.isLive}
                    onChange={(e) => setCourseForm({ ...courseForm, isLive: e.target.checked })}
                    className="rounded border-gray-700 text-gold-500 focus:ring-gold-400"
                  />
                  <span>{locale === 'ar' ? 'دورة مباشرة مع حصص تفاعلية Live' : 'Cours Live interactif'}</span>
                </label>
              </div>

              <button
                type="submit"
                data-testid="submit-course-btn"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-navy-950 font-black text-xs shadow-md active:scale-95 transition-all"
              >
                {editingCourse
                  ? (locale === 'ar' ? 'تحديث ونشر التعديلات ✓' : 'Mettre à jour')
                  : (locale === 'ar' ? 'نشر الدورة فوراً ✓' : 'Publier le cours')}
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
              className="p-4 rounded-3xl bg-[#0A0E1A] border border-white/10 hover:border-gold-500/40 transition-all space-y-2.5 shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-lg bg-gold-400/10 text-gold-300 text-[10px] font-bold border border-gold-400/20">
                  {c.category}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    data-testid={`edit-course-${c.id}`}
                    onClick={() => startEditCourse(c)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gold-300 transition-colors"
                    title={locale === 'ar' ? 'تعديل الدورة' : 'Modifier'}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    data-testid={`remove-course-${c.id}`}
                    onClick={() => removeCourse(c.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-colors"
                    title={locale === 'ar' ? 'حذف' : 'Supprimer'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h4 className="text-xs font-bold text-white truncate">
                {locale === 'ar' ? c.titleAr : c.titleFr || c.titleAr}
              </h4>
              <p className="text-[11px] text-gray-400">
                👨‍🏫 {c.teacherName} &bull; {c.lessonsCount} {locale === 'ar' ? 'حصة معتمدة' : 'leçons'}
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
            className="px-3.5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all"
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
              placeholder={locale === 'ar' ? 'اسم المقياس (عربي)' : 'Nom (AR)'}
              value={moduleForm.nameAr}
              onChange={(e) => setModuleForm({ ...moduleForm, nameAr: e.target.value })}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500"
            />
            <input
              placeholder="Nom (FR)"
              value={moduleForm.nameFr}
              onChange={(e) => setModuleForm({ ...moduleForm, nameFr: e.target.value })}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500"
            />
            <input
              required
              placeholder="Code"
              value={moduleForm.code}
              onChange={(e) => setModuleForm({ ...moduleForm, code: e.target.value })}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500"
            />
            <input
              type="number"
              placeholder="Coefficient"
              value={moduleForm.coefficient}
              onChange={(e) => setModuleForm({ ...moduleForm, coefficient: Number(e.target.value) })}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500"
            />
            <button
              type="submit"
              data-testid="submit-module-btn"
              className="sm:col-span-4 py-2 rounded-xl bg-lime-400 text-slate-950 font-bold text-xs"
            >
              {locale === 'ar' ? 'حفظ المقياس' : 'Enregistrer'}
            </button>
          </form>
        )}

        <div className="overflow-x-auto no-scrollbar rounded-2xl border border-white/10">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-[11px] uppercase bg-white/[0.02]">
                <th className="py-3 px-4">{locale === 'ar' ? 'المقياس' : 'Module'}</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Coef.</th>
                <th className="py-3 px-4">Track</th>
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
                  <td className="py-3 px-4">{m.trackType}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      data-testid={`delete-module-${m.id}`}
                      onClick={() => handleDeleteModule(m.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-gray-500 hover:text-rose-400"
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
