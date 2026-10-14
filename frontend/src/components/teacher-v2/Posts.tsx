'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Post } from '@/types';
import { useAuthStore } from '@/lib/store';
import PostStudioModal from '@/components/community/PostStudioModal';
import { Btn, Empty, Modal, PageHead, SkeletonRows, Status, Tabs, dateFmt, useTx } from '@/components/student-v2/ui';
import { api } from './data';

/** My posts and videos (Figma page 28): publish (same studio as before), change privacy, delete. */
export const TeacherPostsV2: React.FC<{ sub?: string }> = ({ sub }) => {
  const { tx, locale } = useTx();
  const { currentUser } = useAuthStore();
  const params = useSearchParams();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [filter, setFilter] = useState<'all' | 'videos' | 'articles'>('all');
  const [studio, setStudio] = useState(false);
  const [confirm, setConfirm] = useState<Post | null>(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    if (!currentUser) return;
    try {
      const r = await fetch(`/api/posts?authorId=${currentUser.id}`, { credentials: 'include' });
      const d = r.ok ? await r.json() : { posts: [] };
      setPosts(d.posts || []);
    } catch { setPosts([]); }
  }, [currentUser]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (params.get('new') === '1') setStudio(true); }, [params]);

  const flash = (m: string) => { setNote(m); setTimeout(() => setNote(''), 3500); };

  const togglePrivacy = async (p: Post) => {
    const next = !p.isPrivate;
    const r = await api(`/api/posts/${p.id}`, 'PUT', { isPrivate: next });
    if (!r.ok) { flash(tx('فشل تغيير الخصوصية', 'Échec du changement de visibilité', 'Could not change visibility')); return; }
    setPosts((prev) => (prev || []).map((x) => (x.id === p.id ? { ...x, isPrivate: next } : x)));
  };

  const remove = async () => {
    if (!confirm) return;
    const r = await api(`/api/posts/${confirm.id}`, 'DELETE');
    setConfirm(null);
    if (!r.ok) { flash(tx('تعذر حذف المنشور', 'Suppression impossible', 'Could not delete the post')); return; }
    setPosts((prev) => (prev || []).filter((x) => x.id !== confirm.id));
  };

  const list = (posts || []).filter((p) => (filter === 'videos' ? !!p.videoUrl : filter === 'articles' ? !p.videoUrl : true));

  return (
    <div className="flex flex-col gap-7" data-testid="teacher-posts-v2">
      <PageHead
        title={tx('منشوراتي وفيديوهاتي', 'Mes publications et vidéos', 'My posts and videos')}
        sub={sub ?? tx('انشر دروساً ونصائح وتحكّم في خصوصيتها.', 'Publiez des cours et conseils et gérez leur visibilité.', 'Publish lessons and tips and control who sees them.')}
        action={<Btn onClick={() => setStudio(true)} data-testid="teacher-new-post">{tx('منشور أو فيديو جديد', 'Nouvelle publication', 'New post or video')}</Btn>}
      />
      <Tabs label={tx('تصفية المنشورات', 'Filtrer', 'Filter posts')} value={filter} onChange={(v) => setFilter(v as typeof filter)} items={[
        { id: 'all', label: tx('الكل', 'Tout', 'All') },
        { id: 'videos', label: tx('فيديوهات', 'Vidéos', 'Videos') },
        { id: 'articles', label: tx('مقالات', 'Articles', 'Articles') },
      ]} />
      <p role="status" className="min-h-[1.25rem] text-[14px] font-medium">{note}</p>

      {posts === null ? (
        <SkeletonRows n={3} />
      ) : list.length === 0 ? (
        <Empty title={tx('لم تنشر شيئاً بعد', 'Vous n’avez rien publié', 'You have not published anything yet')} body={tx('انشر أول فيديو أو درس ليراه الطلبة.', 'Publiez votre première vidéo ou leçon.', 'Publish your first video or lesson for students to see.')} action={<Btn onClick={() => setStudio(true)}>{tx('منشور جديد', 'Nouvelle publication', 'New post')}</Btn>} />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((p) => (
            <li key={p.id} className="flex flex-col gap-3 rounded-[18px] bg-sheet-card p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5" data-testid={`teacher-post-${p.id}`}>
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sheet-line text-[12px] font-semibold text-sheet-muted">{p.videoUrl ? 'VID' : 'TXT'}</span>
                <div className="min-w-0">
                  <p className="text-[16px] font-medium">{p.title}</p>
                  <p className="text-[13px] text-sheet-muted">{[p.videoUrl ? tx('فيديو', 'Vidéo', 'Video') : tx('مقال', 'Article', 'Article'), dateFmt(p.createdAt, locale, { day: 'numeric', month: 'short' }), `${p.likesCount || 0} ${tx('إعجاباً', "j'aime", 'likes')}`, `${(p.comments || []).length} ${tx('تعليقاً', 'commentaires', 'comments')}`].join('  ·  ')}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {p.isPrivate ? <Status kind="locked">{tx('خاص بالأعضاء', 'Réservé aux membres', 'Members only')}</Status> : <Status kind="ok">{tx('عام', 'Public', 'Public')}</Status>}
                <Btn variant="text" onClick={() => togglePrivacy(p)}>{tx('تغيير الخصوصية', 'Changer la visibilité', 'Change visibility')}</Btn>
                <Btn variant="secondary" onClick={() => setConfirm(p)}>{tx('حذف', 'Supprimer', 'Delete')}</Btn>
              </div>
            </li>
          ))}
        </ul>
      )}

      <PostStudioModal isOpen={studio} onClose={() => setStudio(false)} onPostCreated={() => { setStudio(false); load(); }} locale={locale} />

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={tx('حذف المنشور؟', 'Supprimer cette publication ?', 'Delete this post?')}>
        <p className="mb-5 text-[15px] text-sheet-muted">{confirm?.title}</p>
        <div className="flex flex-wrap gap-3">
          <Btn onClick={remove} data-testid="teacher-confirm-delete">{tx('نعم، احذف', 'Oui, supprimer', 'Yes, delete')}</Btn>
          <Btn variant="secondary" onClick={() => setConfirm(null)}>{tx('إلغاء', 'Annuler', 'Cancel')}</Btn>
        </div>
      </Modal>
    </div>
  );
};
