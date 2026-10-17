'use client';

import React, { useEffect, useState } from 'react';
import { Btn, Empty, Field, PageHead, SelectInput, Status, StatusKind, TextInput, dateFmt, fieldClass, focus, useTx } from '@/components/student-v2/ui';
import { Banner, Dialog } from '@/components/shared-v2/Dialog';
import { usePlatformStore, PlatformSession } from '@/lib/platformStore';
import { CardGrid, ConfirmDialog, FormGrid, InfoCard, RowAction } from './ui';

const blank = {
  title: '', teacherName: '', scheduledAt: '', durationMinutes: 60,
  platform: 'GOOGLE_MEET' as PlatformSession['platform'], meetUrl: '', status: 'UPCOMING' as PlatformSession['status'],
  category: 'UNIVERSITY_LMD' as PlatformSession['category'], wilayaCode: 16,
};

/** Live sessions (Figma page 31, "Live sessions"). Same store and API as the old tab. */
export const SessionsSection: React.FC = () => {
  const { tx, locale } = useTx();
  const { sessions, addSession, refresh } = usePlatformStore();
  const [teachers, setTeachers] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformSession | null>(null);
  const [form, setForm] = useState(blank);
  const [err, setErr] = useState('');
  const [del, setDel] = useState<PlatformSession | null>(null);

  useEffect(() => {
    fetch('/api/teachers').then((r) => (r.ok ? r.json() : [])).then((t) => {
      if (Array.isArray(t)) setTeachers(Array.from(new Set(t.map((x: any) => x.user?.name || x.name).filter(Boolean))) as string[]);
    }).catch(() => {});
  }, []);

  const minDate = new Date().toISOString().slice(0, 16);

  const openNew = () => { setEditing(null); setForm(blank); setErr(''); setOpen(true); };
  const openEdit = (s: PlatformSession) => {
    setEditing(s); setErr('');
    setForm({ title: s.title, teacherName: s.teacherName, scheduledAt: s.scheduledAt ? new Date(s.scheduledAt).toISOString().slice(0, 16) : '', durationMinutes: s.durationMinutes || 60, platform: s.platform || 'GOOGLE_MEET', meetUrl: s.meetUrl || '', status: s.status || 'UPCOMING', category: s.category || 'UNIVERSITY_LMD', wilayaCode: s.wilayaCode || 16 });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (editing) {
      try {
        const res = await fetch(`/api/sessions/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: form.title, teacherName: form.teacherName, scheduledAt: form.scheduledAt, durationMinutes: form.durationMinutes, platform: form.platform, meetUrl: form.meetUrl || null, status: form.status }) });
        if (res.ok) { setOpen(false); refresh(); } else { const j = await res.json().catch(() => ({})); setErr(j.error || tx('فشل تحديث الحصة', 'Échec de la mise à jour', 'Could not update the session')); }
      } catch {
        setErr(tx('خطأ في الاتصال', 'Erreur réseau', 'Network error'));
      }
    } else {
      const r = await addSession({ title: form.title, teacherName: form.teacherName, scheduledAt: form.scheduledAt, durationMinutes: form.durationMinutes, platform: form.platform, meetUrl: form.meetUrl || null, wilayaCode: form.wilayaCode, category: form.category, courseId: null, teacherId: null });
      if (r.success) setOpen(false); else setErr(r.error || tx('فشل جدولة الحصة', 'Échec de la planification', 'Could not schedule the session'));
    }
  };

  const remove = async () => { if (!del) return; await fetch(`/api/sessions/${del.id}`, { method: 'DELETE' }); setDel(null); refresh(); };

  const platformLabel = (p: string) => (p === 'GOOGLE_MEET' ? 'Google Meet' : p === 'CLASSROOM' ? 'Classroom' : tx('حضوري في القاعة', 'Présentiel', 'On site'));
  const statusView = (s: string): { kind: StatusKind; label: string } =>
    s === 'LIVE' ? { kind: 'ok', label: tx('مباشرة الآن', 'En direct', 'Live now') }
    : s === 'COMPLETED' ? { kind: 'locked', label: tx('مكتملة', 'Terminée', 'Completed') }
    : s === 'CANCELLED' ? { kind: 'danger', label: tx('ملغاة', 'Annulée', 'Cancelled') }
    : { kind: 'pending', label: tx('قادمة', 'À venir', 'Upcoming') };

  return (
    <div className="flex flex-col gap-6" data-testid="sessions-tab">
      <PageHead
        title={tx('الحصص المباشرة', 'Sessions en direct', 'Live sessions')}
        sub={tx('جدولة الحصص الوطنية المباشرة وتعديلها.', 'Planification et modification des sessions nationales en direct.', 'Schedule and edit the national live sessions.')}
        action={<Btn onClick={openNew} data-testid="add-session-btn">{tx('جدولة حصة جديدة', 'Planifier une session', 'Schedule a session')}</Btn>}
      />

      {sessions.length === 0 ? (
        <Empty title={tx('لا توجد حصص مجدولة', 'Aucune session planifiée', 'No sessions scheduled')} body={tx('جدول أول حصة مباشرة لتظهر للطلبة.', 'Planifiez la première session pour la montrer aux étudiants.', 'Schedule the first live session so students can see it.')} action={<Btn variant="secondary" onClick={openNew}>{tx('جدولة حصة', 'Planifier', 'Schedule')}</Btn>} />
      ) : (
        <CardGrid>
          {sessions.map((s) => {
            const v = statusView(s.status || 'UPCOMING');
            return (
              <InfoCard
                key={s.id}
                testId={`session-row-${s.id}`}
                title={s.title}
                sub={s.teacherName}
                status={<Status kind={v.kind}>{v.label}</Status>}
                lines={[
                  [tx('توقيت وتاريخ الحصة', 'Date et heure', 'Date and time'), <bdi key="d">{dateFmt(s.scheduledAt, locale)}</bdi>],
                  [tx('المدة بالدقائق', 'Durée (min)', 'Duration (min)'), <bdi key="m">{s.durationMinutes}</bdi>],
                  [tx('المنصة', 'Plateforme', 'Platform'), platformLabel(s.platform)],
                ]}
                actions={<><RowAction onClick={() => openEdit(s)}>{tx('تعديل', 'Modifier', 'Edit')}</RowAction><RowAction danger onClick={() => setDel(s)}>{tx('إلغاء', 'Supprimer', 'Delete')}</RowAction></>}
              />
            );
          })}
        </CardGrid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} size="lg" title={editing ? tx('تعديل الحصة', 'Modifier la session', 'Edit session') : tx('بيانات الحصة الوطنية المباشرة', 'Détails de la session', 'Session details')} sub={editing?.title} testId="add-session-form">
        <form onSubmit={submit} className="flex flex-col gap-4">
          {err ? <Banner kind="danger" testId="add-session-error">{err}</Banner> : null}
          <TextInput id="se-title" label={tx('عنوان الحصة', 'Titre', 'Title')} value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <Field label={tx('الأستاذ المكلّف', 'Enseignant', 'Teacher')} htmlFor="se-teacher">
            <input id="se-teacher" required list="session-teachers" value={form.teacherName} onChange={(e) => setForm({ ...form, teacherName: e.target.value })} className={fieldClass} />
            <datalist id="session-teachers">{teachers.map((n) => <option key={n} value={n} />)}</datalist>
          </Field>
          <FormGrid>
            <Field label={tx('توقيت وتاريخ الحصة', 'Date et heure', 'Date and time')} htmlFor="se-when">
              <input id="se-when" required type="datetime-local" min={minDate} dir="ltr" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className={fieldClass} />
            </Field>
            <TextInput id="se-dur" label={tx('المدة بالدقائق', 'Durée (minutes)', 'Duration (minutes)')} type="number" min={1} dir="ltr" value={String(form.durationMinutes)} onChange={(v) => setForm({ ...form, durationMinutes: Number(v) })} />
            <SelectInput id="se-platform" label={tx('المنصة', 'Plateforme', 'Platform')} value={form.platform} onChange={(v) => setForm({ ...form, platform: v as PlatformSession['platform'] })} options={[{ value: 'GOOGLE_MEET', label: 'Google Meet' }, { value: 'CLASSROOM', label: 'Classroom' }, { value: 'ONSITE', label: platformLabel('ONSITE') }]} />
            {editing ? <SelectInput id="se-status" label={tx('الحالة', 'Statut', 'Status')} value={form.status} onChange={(v) => setForm({ ...form, status: v as PlatformSession['status'] })} options={['UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED'].map((s) => ({ value: s, label: statusView(s).label }))} /> : null}
          </FormGrid>
          <TextInput id="se-url" label={tx('رابط الحصة', 'Lien de la session', 'Session link')} dir="ltr" placeholder="https://meet.google.com/..." value={form.meetUrl} onChange={(v) => setForm({ ...form, meetUrl: v })} />
          <div className="flex flex-wrap justify-end gap-2.5">
            <Btn variant="secondary" onClick={() => setOpen(false)}>{tx('إلغاء', 'Annuler', 'Cancel')}</Btn>
            <button type="submit" data-testid="submit-session-btn" className={`inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold-500 px-6 text-[15px] font-semibold text-[#050505] hover:bg-gold-400 ${focus}`}>{editing ? tx('حفظ التعديلات', 'Enregistrer', 'Save changes') : tx('تثبيت ونشر الموعد', 'Planifier', 'Schedule')}</button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} title={tx('إلغاء وحذف الحصة', 'Supprimer la session', 'Delete session')} body={`${tx('هل أنت متأكد من إلغاء وحذف هذه الحصة؟', 'Supprimer cette session ?', 'Delete this session?')} ${del?.title || ''}`} confirm={tx('حذف', 'Supprimer', 'Delete')} />
    </div>
  );
};
