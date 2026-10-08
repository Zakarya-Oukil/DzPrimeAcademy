'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Video, Calendar, Pencil, ShieldCheck, CheckCircle2, Clock, X, ExternalLink } from 'lucide-react';
import { usePlatformStore, PlatformSession } from '@/lib/platformStore';

interface SessionsTabProps {
  locale: string;
}

export const SessionsTab: React.FC<SessionsTabProps> = ({ locale }) => {
  const { sessions, addSession, refresh } = usePlatformStore();
  const [registeredTeachers, setRegisteredTeachers] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<PlatformSession | null>(null);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    title: '',
    teacherName: '',
    scheduledAt: '',
    durationMinutes: 60,
    platform: 'GOOGLE_MEET' as 'GOOGLE_MEET' | 'CLASSROOM' | 'ONSITE',
    meetUrl: '',
    status: 'UPCOMING' as 'UPCOMING' | 'COMPLETED' | 'CANCELLED',
    category: 'UNIVERSITY_LMD' as 'BAC' | 'UNIVERSITY_LMD' | 'MEDICAL',
    wilayaCode: 16,
  });

  const minDateTime = new Date().toISOString().slice(0, 16);

  useEffect(() => {
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

  const handleAddOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (editingSession) {
      try {
        const res = await fetch(`/api/sessions/${editingSession.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            teacherName: form.teacherName,
            scheduledAt: form.scheduledAt,
            durationMinutes: form.durationMinutes,
            platform: form.platform,
            meetUrl: form.meetUrl || null,
            status: form.status,
          }),
        });
        if (res.ok) {
          setEditingSession(null);
          setShowForm(false);
          refresh();
        } else {
          const err = await res.json().catch(() => ({}));
          setFormError(err.error || 'فشل تحديث الحصة');
        }
      } catch {
        setFormError('خطأ في الاتصال');
      }
    } else {
      const result = await addSession({
        title: form.title,
        teacherName: form.teacherName,
        scheduledAt: form.scheduledAt,
        durationMinutes: form.durationMinutes,
        platform: form.platform,
        meetUrl: form.meetUrl || null,
        wilayaCode: form.wilayaCode,
        category: form.category,
        courseId: null,
        teacherId: null,
      });

      if (result.success) {
        setForm({
          title: '',
          teacherName: '',
          scheduledAt: '',
          durationMinutes: 60,
          platform: 'GOOGLE_MEET',
          meetUrl: '',
          status: 'UPCOMING',
          category: 'UNIVERSITY_LMD',
          wilayaCode: 16,
        });
        setShowForm(false);
      } else {
        setFormError(result.error || (locale === 'ar' ? 'فشل جدولة الحصة' : 'Échec de la planification'));
      }
    }
  };

  const startEdit = (s: PlatformSession) => {
    setEditingSession(s);
    setForm({
      title: s.title,
      teacherName: s.teacherName,
      scheduledAt: s.scheduledAt ? new Date(s.scheduledAt).toISOString().slice(0, 16) : '',
      durationMinutes: s.durationMinutes || 60,
      platform: s.platform || 'GOOGLE_MEET',
      meetUrl: s.meetUrl || '',
      status: (s.status as any) || 'UPCOMING',
      category: s.category || 'UNIVERSITY_LMD',
      wilayaCode: s.wilayaCode || 16,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(locale === 'ar' ? 'هل أنت متأكد من إلغاء وحذف هذه الحصة؟' : 'Supprimer cette session ?')) {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      refresh();
    }
  };

  return (
    <div className="space-y-6" data-testid="sessions-tab">
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-[#111114] border border-gold-500/30 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-lime-500/20 border border-lime-400/40 text-lime-400 flex items-center justify-center shrink-0">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-white">
                {locale === 'ar' ? 'الحصص والمحاضرات الوطنية المباشرة (Live Masterclasses)' : 'Séances Live Nationales'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-lime-500/20 text-lime-300 text-[10px] font-bold border border-lime-400/30">
                COMMERCIAL CONTROL
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {locale === 'ar'
                ? 'جدولة وإدارة وتثبيت المواعيد الرسمية للحصص المباشرة والورشات لـ 58 ولاية'
                : 'Planification et gestion centralisée des sessions en direct pour les 58 wilayas'}
            </p>
          </div>
        </div>

        <button
          data-testid="add-session-btn"
          onClick={() => {
            setEditingSession(null);
            setForm({
              title: '',
              teacherName: '',
              scheduledAt: '',
              durationMinutes: 60,
              platform: 'GOOGLE_MEET',
              meetUrl: '',
              status: 'UPCOMING',
              category: 'UNIVERSITY_LMD',
              wilayaCode: 16,
            });
            setShowForm(!showForm);
          }}
          className="px-4 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{locale === 'ar' ? 'جدولة حصة جديدة' : 'Planifier une Session'}</span>
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddOrEdit}
          data-testid="add-session-form"
          className="p-5 rounded-3xl bg-white/[0.04] border border-lime-400/30 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-2xl relative"
        >
          <div className="sm:col-span-3 flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-black text-lime-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-lime-400" />
              {editingSession
                ? (locale === 'ar' ? `تعديل الحصة: ${editingSession.title}` : `Modifier: ${editingSession.title}`)
                : (locale === 'ar' ? 'بيانات الحصة الوطنية المباشرة' : 'Détails de la Session')}
            </span>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingSession(null);
              }}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <p data-testid="add-session-error" className="sm:col-span-3 text-xs font-bold text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
              {formError}
            </p>
          )}

          <input
            required
            placeholder={locale === 'ar' ? 'عنوان الحصة (مثال: مراجعة شاملة للوحدة 1)' : 'Titre'}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 sm:col-span-2"
          />

          <div className="relative">
            <input
              required
              list="session-teachers"
              placeholder={locale === 'ar' ? 'الأستاذ المكلّف' : 'Enseignant'}
              value={form.teacherName}
              onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-lime-400"
            />
            <datalist id="session-teachers">
              {registeredTeachers.map((tName) => (
                <option key={tName} value={tName} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1 font-bold">
              {locale === 'ar' ? 'توقيت وتاريخ الحصة:' : 'Date & Heure:'}
            </label>
            <input
              required
              type="datetime-local"
              min={minDateTime}
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-lime-400"
            />
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1 font-bold">
              {locale === 'ar' ? 'المدة بالدقائق:' : 'Durée (minutes):'}
            </label>
            <input
              type="number"
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-lime-400"
            />
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1 font-bold">
              {locale === 'ar' ? 'المنصة:' : 'Plateforme:'}
            </label>
            <select
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value as any })}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0b0b0d] border border-white/10 text-xs text-gray-200 focus:outline-none focus:border-lime-400"
            >
              <option value="GOOGLE_MEET">Google Meet</option>
              <option value="CLASSROOM">Classroom</option>
              <option value="ONSITE">{locale === 'ar' ? 'حضوري في القاعة' : 'Présentiel'}</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <input
              placeholder="Google Meet Link (https://meet.google.com/...)"
              value={form.meetUrl}
              onChange={(e) => setForm({ ...form, meetUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-lime-400"
            />
          </div>

          {editingSession && (
            <div>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-xs font-bold text-lime-400 focus:outline-none focus:border-lime-400"
              >
                <option value="UPCOMING">UPCOMING (قادمة)</option>
                <option value="LIVE">LIVE (مباشرة الآن)</option>
                <option value="COMPLETED">COMPLETED (مكتملة)</option>
                <option value="CANCELLED">CANCELLED (ملغاة)</option>
              </select>
            </div>
          )}

          <div className="sm:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              data-testid="submit-session-btn"
              className="px-6 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-xs shadow-md active:scale-95 transition-all"
            >
              {editingSession
                ? (locale === 'ar' ? 'حفظ تعديلات الحصة ✓' : 'Enregistrer les modifications')
                : (locale === 'ar' ? 'تثبيت ونشر الموعد ✓' : 'Planifier')}
            </button>
          </div>
        </form>
      )}

      {/* Sessions list */}
      <div className="space-y-2.5">
        {sessions.map((s) => {
          const isLive = s.status === 'LIVE';
          const isUpcoming = s.status === 'UPCOMING' || !s.status;

          return (
            <div
              key={s.id}
              data-testid={`session-row-${s.id}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-[#0b0b0d] border border-white/10 hover:border-gold-500/30 transition-all shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    isLive
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 '
                      : 'bg-lime-400/10 border border-lime-400/30 text-lime-400'
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-white truncate">{s.title}</h4>
                    {isLive && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[9px] font-black  border border-rose-500/30">
                        LIVE NOW
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                    {new Date(s.scheduledAt).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ')} &bull; {s.teacherName} &bull; {s.durationMinutes} min
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <span className="px-2.5 py-1 rounded-xl bg-white/10 text-[10px] font-mono font-bold text-gray-300">
                  {s.platform}
                </span>

                {s.meetUrl && (
                  <a
                    href={s.meetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors"
                    title="Ouvrir Google Meet"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <button
                  data-testid={`edit-session-${s.id}`}
                  onClick={() => startEdit(s)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title={locale === 'ar' ? 'تعديل' : 'Modifier'}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                <button
                  data-testid={`delete-session-${s.id}`}
                  onClick={() => handleDelete(s.id)}
                  className="p-1.5 rounded-xl hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-colors"
                  title={locale === 'ar' ? 'إلغاء' : 'Supprimer'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
