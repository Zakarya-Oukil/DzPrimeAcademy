'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Post, PostType } from '@/types';
import { Btn, Empty, Field, FormPanel, PageHead, SelectInput, SkeletonRows, Status, TextInput, dateFmt, fieldClass, useTx } from '@/components/student-v2/ui';
import { api, isAnnouncement, useMyPosts } from './data';
import { typeLabel } from './Home';

/** Sessions and workshops (Figma page 29): an announcement is a post (title, details, type, format, place). Same API as the old tab: POST /api/posts and /api/posts/:id/comments. */

const EMPTY = { title: '', content: '', type: 'SESSION_SCHEDULE' as PostType, isOnline: true, location: '' };

export const AmbassadorAnnouncementsV2: React.FC = () => {
  const { tx, locale } = useTx();
  const params = useSearchParams();
  const posts = useMyPosts();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [replying, setReplying] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [shown, setShown] = useState<string | null>(null);

  useEffect(() => { if (params.get('new') === '1') setOpen(true); }, [params]);

  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { setError(tx('العنوان والتفاصيل مطلوبان.', 'Le titre et les détails sont obligatoires.', 'Title and details are required.')); return; }
    setSaving(true); setError('');
    const r = await api('/api/posts', 'POST', { title: form.title, content: form.content, type: form.type, isOnline: form.isOnline, location: form.isOnline ? undefined : form.location || undefined });
    setSaving(false);
    if (!r.ok) { setError(r.json.error || tx('تعذر نشر الإعلان.', 'Publication impossible.', 'Could not publish the announcement.')); return; }
    setForm(EMPTY); setOpen(false);
    setNote(tx('تم نشر الإعلان ووصل لطلبة ولايتك.', 'Annonce publiée pour les étudiants de votre wilaya.', 'Announcement published to students in your wilaya.'));
    setTimeout(() => setNote(''), 4000);
    posts.reload();
  };

  const sendReply = async (post: Post) => {
    const text = reply.trim();
    if (!text) return;
    const r = await api(`/api/posts/${post.id}/comments`, 'POST', { content: text });
    if (!r.ok || !r.json.comment) { setNote(tx('تعذر إرسال الرد.', "Envoi de la réponse impossible.", 'Could not send the reply.')); return; }
    posts.setItems((prev) => (prev || []).map((p) => (p.id === post.id ? { ...p, comments: [...(p.comments || []), r.json.comment] } : p)));
    setReply(''); setReplying(null);
  };

  const list = (posts.items || []).filter(isAnnouncement);

  return (
    <div className="flex flex-col gap-7" data-testid="ambassador-sessions-v2">
      <PageHead
        title={tx('الحصص والورشات', 'Sessions et ateliers', 'Sessions and workshops')}
        sub={tx('أعلن حصة مراجعة أو ورشة لطلبة ولايتك وتابع الردود.', "Annoncez une session ou un atelier aux étudiants de votre wilaya et suivez les réponses.", 'Announce a study session or workshop to students in your wilaya and follow the replies.')}
        action={open ? undefined : <Btn onClick={() => setOpen(true)} data-testid="ambassador-new-announcement">{tx('إعلان جديد', 'Nouvelle annonce', 'New announcement')}</Btn>}
      />
      <p role="status" className="min-h-[1.25rem] text-[14px] font-medium">{note}</p>

      {open ? (
        <form onSubmit={publish} className="flex flex-col gap-4" data-testid="ambassador-announce-form">
          <FormPanel title={tx('إعلان ورشة أو حصة مراجعة', 'Annoncer un atelier ou une session', 'Announce a workshop or study session')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput id="am-title" label={tx('عنوان الورشة أو الحصة', "Titre de l'atelier ou de la session", 'Workshop or session title')} value={form.title} onChange={(v) => setForm((p) => ({ ...p, title: v }))} placeholder={tx('مثال: ورشة التحضير لامتحان الرياضيات EMD1', 'Ex : atelier de préparation EMD1', 'e.g. EMD1 maths prep workshop')} className="sm:col-span-2" />
              <SelectInput id="am-type" label={tx('نوع الفعالية', "Type d'événement", 'Event type')} value={form.type} onChange={(v) => setForm((p) => ({ ...p, type: v as PostType }))} options={(['SESSION_SCHEDULE', 'EVENT', 'STUDY_TIP', 'ANNOUNCEMENT'] as PostType[]).map((t) => ({ value: t, label: typeLabel(t, tx) }))} />
              <SelectInput id="am-format" label={tx('طريقة البث', 'Format', 'Format')} value={form.isOnline ? 'online' : 'onsite'} onChange={(v) => setForm((p) => ({ ...p, isOnline: v === 'online' }))} options={[{ value: 'online', label: tx('عن بُعد', 'En ligne', 'Online') }, { value: 'onsite', label: tx('حضوري', 'Présentiel', 'On site') }]} />
              {!form.isOnline ? <TextInput id="am-place" label={tx('المكان', 'Lieu', 'Place')} value={form.location} onChange={(v) => setForm((p) => ({ ...p, location: v }))} placeholder={tx('مثال: مدرج C - كلية العلوم', 'Ex : amphi C - faculté des sciences', 'e.g. Amphitheatre C')} className="sm:col-span-2" /> : null}
              <Field label={tx('التفاصيل', 'Détails', 'Details')} htmlFor="am-details" className="sm:col-span-2">
                <textarea id="am-details" rows={4} value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} placeholder={tx('اكتب محاور المراجعة ورابط المطبوعات...', 'Thèmes de révision, lien des supports…', 'Topics, link to materials…')} className={`${fieldClass} py-3`} />
              </Field>
            </div>
          </FormPanel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p role={error ? 'alert' : undefined} className="min-h-[1.25rem] text-[14px] font-medium text-[#c0392b]">{error}</p>
            <div className="flex gap-3">
              <Btn variant="secondary" type="button" onClick={() => { setOpen(false); setError(''); }}>{tx('إلغاء', 'Annuler', 'Cancel')}</Btn>
              <Btn type="submit" disabled={saving} data-testid="ambassador-publish">{saving ? tx('جارٍ النشر…', 'Publication…', 'Publishing…') : tx('نشر الإعلان للطلبة', 'Publier aux étudiants', 'Publish to students')}</Btn>
            </div>
          </div>
        </form>
      ) : null}

      {posts.items === null ? <SkeletonRows n={3} /> : list.length === 0 ? (
        <Empty title={tx('لا توجد إعلانات بعد', 'Aucune annonce pour le moment', 'No announcements yet')} body={tx('أعلن أول حصة أو ورشة لطلبة ولايتك.', 'Annoncez votre première session.', 'Announce your first session.')} />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((p) => {
            const comments = p.comments || [];
            return (
              <li key={p.id} className="flex flex-col gap-3 rounded-[18px] bg-sheet-card p-4 sm:px-5" data-testid={`ambassador-post-${p.id}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span aria-hidden="true" className="grid h-[52px] w-[60px] shrink-0 place-items-center rounded-[14px] bg-sheet-line text-[14px] font-semibold tabular-nums">{dateFmt(p.createdAt, locale, { day: 'numeric', month: 'short' })}</span>
                    <div className="min-w-0">
                      <p className="text-[16px] font-medium">{p.title}</p>
                      <p className="text-[13px] text-sheet-muted">{[typeLabel(p.type, tx), p.location, dateFmt(p.createdAt, locale, { day: 'numeric', month: 'short', year: 'numeric' })].filter(Boolean).join('  ·  ')}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Status kind={p.isOnline ? 'pending' : 'ok'}>{p.isOnline ? tx('عن بُعد', 'En ligne', 'Online') : tx('حضوري', 'Présentiel', 'On site')}</Status>
                    <Btn variant="secondary" onClick={() => setShown(shown === p.id ? null : p.id)} aria-expanded={shown === p.id}>{`${tx('الردود', 'Réponses', 'Replies')} (${comments.length})`}</Btn>
                  </div>
                </div>
                {shown === p.id ? (
                  <div className="flex flex-col gap-3 border-t border-sheet-line pt-3">
                    <p className="whitespace-pre-line text-[14px] text-sheet-muted">{p.content}</p>
                    {comments.length === 0 ? <p className="text-[14px] text-sheet-muted">{tx('لا توجد ردود بعد.', 'Aucune réponse pour le moment.', 'No replies yet.')}</p> : (
                      <ul className="flex flex-col gap-2">
                        {comments.map((c) => <li key={c.id} className="text-[14px]"><span className="font-semibold">{c.authorName}: </span>{c.content}</li>)}
                      </ul>
                    )}
                    {replying === p.id ? (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input aria-label={tx('اكتب رداً', 'Écrire une réponse', 'Write a reply')} value={reply} onChange={(e) => setReply(e.target.value)} className={fieldClass} />
                        <Btn onClick={() => sendReply(p)} disabled={!reply.trim()}>{tx('إرسال', 'Envoyer', 'Send')}</Btn>
                      </div>
                    ) : <div><Btn variant="text" onClick={() => { setReplying(p.id); setReply(''); }}>{tx('اكتب رداً', 'Répondre', 'Reply')}</Btn></div>}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
