'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Btn, Empty, FormPanel, Modal, PageHead, SelectInput, SkeletonRows, Status, TextInput, dateFmt, useTx } from '@/components/student-v2/ui';
import { Platform, TSession, api, toLocalInput, useMyCourses, useMySessions } from './data';
import { platformLabel } from './Studio';

/** Teacher live sessions (Figma page 28): schedule, edit and delete your own sessions. */

const EMPTY = { title: '', courseId: '', scheduledAt: '', durationMinutes: 60, platform: 'GOOGLE_MEET' as Platform, meetUrl: '' };

export const TeacherSessionsV2: React.FC = () => {
  const { tx, locale } = useTx();
  const sessions = useMySessions();
  const courses = useMyCourses();
  const params = useSearchParams();
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<TSession | null>(null);

  const open = (s?: TSession) => {
    setError('');
    setEditing(s ? s.id : 'new');
    setForm(s ? { title: s.title, courseId: s.courseId || '', scheduledAt: toLocalInput(s.scheduledAt), durationMinutes: s.durationMinutes, platform: s.platform, meetUrl: s.meetUrl || '' } : EMPTY);
  };

  useEffect(() => {
    if (!sessions.items) return;
    if (params.get('new') === '1') open();
    const id = params.get('edit');
    const s = id ? sessions.items.find((x) => x.id === id) : undefined;
    if (s) open(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions.items === null]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.scheduledAt) { setError(tx('العنوان والموعد مطلوبان.', 'Le titre et la date sont obligatoires.', 'Title and date are required.')); return; }
    setSaving(true); setError('');
    const body = { title: form.title, courseId: form.courseId || null, scheduledAt: new Date(form.scheduledAt).toISOString(), durationMinutes: form.durationMinutes, platform: form.platform, meetUrl: form.meetUrl.trim() || null };
    const r = editing === 'new' ? await api('/api/sessions', 'POST', body) : await api(`/api/sessions/${editing}`, 'PUT', body);
    setSaving(false);
    if (!r.ok) { setError(r.json.error || tx('تعذر حفظ الحصة.', "Impossible d'enregistrer la session.", 'Could not save the session.')); return; }
    setEditing(null);
    sessions.reload();
  };

  const remove = async () => {
    if (!confirm) return;
    const r = await api(`/api/sessions/${confirm.id}`, 'DELETE');
    setConfirm(null);
    if (!r.ok) { setError(r.json.error || tx('تعذر حذف الحصة.', 'Suppression impossible.', 'Could not delete the session.')); return; }
    sessions.reload();
  };

  const statusOf = (s: TSession) => {
    const start = new Date(s.scheduledAt).getTime();
    if (s.status === 'CANCELLED') return <Status kind="danger">{tx('ملغاة', 'Annulée', 'Cancelled')}</Status>;
    if (s.status === 'COMPLETED' || start + s.durationMinutes * 60000 < Date.now()) return <Status kind="pending">{tx('انتهت', 'Terminée', 'Ended')}</Status>;
    if (s.status === 'LIVE' || start <= Date.now()) return <Status kind="pending">{tx('مباشرة الآن', 'En direct', 'Live now')}</Status>;
    return <Status kind="ok">{tx('مجدولة', 'Planifiée', 'Scheduled')}</Status>;
  };

  const list = (sessions.items || []).slice().sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt));

  return (
    <div className="flex flex-col gap-7" data-testid="teacher-sessions-v2">
      <PageHead
        title={tx('حصصي المباشرة', 'Mes sessions en direct', 'My live sessions')}
        sub={tx('جدول حصصك وعدّل مواعيدها وروابطها.', 'Planifiez vos sessions et modifiez horaires et liens.', 'Schedule your sessions and edit their times and links.')}
        action={editing === null ? <Btn onClick={() => open()} data-testid="teacher-add-session">{tx('حصة جديدة', 'Nouvelle session', 'New session')}</Btn> : undefined}
      />
      {error && editing === null ? <p role="alert" className="text-[14px] font-medium text-[#c0392b]">{error}</p> : null}

      {editing !== null ? (
        <form onSubmit={save} noValidate>
          <FormPanel title={editing === 'new' ? tx('حصة جديدة', 'Nouvelle session', 'New session') : tx('تعديل الحصة', 'Modifier la session', 'Edit session')}>
            <div className="flex flex-col gap-4">
              <TextInput id="ts-title" label={tx('عنوان الحصة', 'Titre de la session', 'Session title')} value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectInput id="ts-course" label={tx('المقرر', 'Cours', 'Module')} value={form.courseId} onChange={(v) => setForm({ ...form, courseId: v })} options={[{ value: '', label: tx('بدون مقرر', 'Sans cours', 'No module') }, ...(courses.items || []).map((c) => ({ value: c.id, label: locale === 'fr' && c.titleFr ? c.titleFr : c.titleAr }))]} />
                <TextInput id="ts-when" label={tx('الموعد', 'Date et heure', 'Date and time')} type="datetime-local" dir="ltr" value={form.scheduledAt} onChange={(v) => setForm({ ...form, scheduledAt: v })} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput id="ts-dur" label={tx('المدة بالدقائق', 'Durée (minutes)', 'Duration (minutes)')} type="number" min={15} value={String(form.durationMinutes)} onChange={(v) => setForm({ ...form, durationMinutes: Math.max(0, Number(v) || 0) })} />
                <SelectInput id="ts-plat" label={tx('المنصة', 'Plateforme', 'Platform')} value={form.platform} onChange={(v) => setForm({ ...form, platform: v as Platform })} options={(['GOOGLE_MEET', 'CLASSROOM', 'ONSITE'] as Platform[]).map((p) => ({ value: p, label: platformLabel(p, tx) }))} />
              </div>
              <TextInput id="ts-url" label={tx('رابط البث', 'Lien de la session', 'Session link')} dir="ltr" placeholder="https://meet.google.com/..." value={form.meetUrl} onChange={(v) => setForm({ ...form, meetUrl: v })} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p role="alert" className="min-h-[1.25rem] text-[14px] font-medium text-[#c0392b]">{error}</p>
                <div className="flex gap-3">
                  <Btn variant="secondary" onClick={() => setEditing(null)}>{tx('إلغاء', 'Annuler', 'Cancel')}</Btn>
                  <Btn type="submit" disabled={saving} data-testid="teacher-save-session">{saving ? tx('جارٍ الحفظ…', 'Enregistrement…', 'Saving…') : tx('حفظ الحصة', 'Enregistrer', 'Save session')}</Btn>
                </div>
              </div>
            </div>
          </FormPanel>
        </form>
      ) : sessions.items === null ? (
        <SkeletonRows n={3} />
      ) : list.length === 0 ? (
        <Empty title={tx('لا توجد حصص بعد', 'Aucune session pour le moment', 'No sessions yet')} body={tx('جدول حصتك الأولى ليسجّل فيها الطلبة.', 'Planifiez votre première session pour que les étudiants s’inscrivent.', 'Schedule your first session so students can register.')} action={<Btn onClick={() => open()}>{tx('حصة جديدة', 'Nouvelle session', 'New session')}</Btn>} />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((s) => (
            <li key={s.id} className="flex flex-col gap-3 rounded-[18px] bg-sheet-card p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5" data-testid={`teacher-session-${s.id}`}>
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <span className="grid h-[52px] w-[60px] shrink-0 place-items-center rounded-[14px] bg-sheet-line text-[14px] font-semibold tabular-nums">{dateFmt(s.scheduledAt, locale, { hour: '2-digit', minute: '2-digit' })}</span>
                <div className="min-w-0">
                  <p className="text-[16px] font-medium">{s.title}</p>
                  <p className="text-[13px] text-sheet-muted">{[platformLabel(s.platform, tx), dateFmt(s.scheduledAt, locale, { weekday: 'short', day: 'numeric', month: 'short' }), `${s.durationMinutes} ${tx('د', 'min', 'min')}`, `${s.registrationsCount ?? 0} ${tx('مسجّلاً', 'inscrits', 'registered')}`].join('  ·  ')}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {statusOf(s)}
                <Btn variant="secondary" onClick={() => open(s)}>{tx('تعديل', 'Modifier', 'Edit')}</Btn>
                <Btn variant="secondary" onClick={() => setConfirm(s)}>{tx('حذف', 'Supprimer', 'Delete')}</Btn>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={tx('حذف الحصة؟', 'Supprimer cette session ?', 'Delete this session?')}>
        <p className="mb-5 text-[15px] text-sheet-muted">{confirm?.title}</p>
        <div className="flex flex-wrap gap-3">
          <Btn onClick={remove} data-testid="teacher-confirm-delete">{tx('نعم، احذف', 'Oui, supprimer', 'Yes, delete')}</Btn>
          <Btn variant="secondary" onClick={() => setConfirm(null)}>{tx('إلغاء', 'Annuler', 'Cancel')}</Btn>
        </div>
      </Modal>
    </div>
  );
};
