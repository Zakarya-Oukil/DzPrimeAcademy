'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChatCircle, Heart, ShareNetwork } from '@phosphor-icons/react';
import type { Post, PostComment } from '@/types';
import { useAuthStore } from '@/lib/store';
import VideoPlayerDefault, { VideoPlayer as VideoPlayerNamed } from '@/components/community/VideoPlayer';
import { Avatar, Btn, Empty, PageHead, Panel, SkeletonRows, Tabs, dateFmt, fieldClass, focus, useTx } from './ui';

/** Community feed and top contributors (Figma page 27). Students read, like and comment; only staff publish (same rule as before). */

const VideoPlayer = (VideoPlayerNamed || VideoPlayerDefault) as React.ComponentType<{ url: string; title?: string }>;

function usePosts() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const load = useCallback(() => {
    fetch('/api/posts')
      .then((r) => (r.ok ? r.json() : { posts: [] }))
      .then((d) => setPosts(d.posts || []))
      .catch(() => setPosts([]));
  }, []);
  useEffect(load, [load]);
  return { posts, setPosts, reload: load };
}

export function roleLabel(role: string, tx: (ar: string, fr: string, en?: string) => string) {
  if (role === 'TEACHER') return tx('أستاذ معتمد', 'Enseignant agréé', 'Certified teacher');
  if (role === 'AMBASSADOR') return tx('سفير الأكاديمية', "Ambassadeur", 'Ambassador');
  if (['OWNER', 'SUPER_ADMIN', 'GENERAL_ADMIN', 'ADMIN', 'MODERATOR', 'COMMERCIAL_DIRECTOR'].includes(role)) return tx('إدارة الأكاديمية', "Équipe de l'académie", 'Academy team');
  return tx('طالب', 'Étudiant', 'Student');
}

export const StudentCommunityV2: React.FC = () => {
  const { tx, locale } = useTx();
  const { currentUser } = useAuthStore();
  const { posts, setPosts, reload } = usePosts();
  const [filter, setFilter] = useState<'all' | 'videos' | 'articles'>('all');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState('');

  const list = useMemo(() => (posts || []).filter((p) => (filter === 'videos' ? !!p.videoUrl : filter === 'articles' ? !p.videoUrl : true)), [posts, filter]);

  const flash = (m: string) => { setNote(m); setTimeout(() => setNote(''), 3000); };

  const like = async (id: string) => {
    if (!currentUser || busy['l' + id]) return;
    setBusy((b) => ({ ...b, ['l' + id]: true }));
    setPosts((prev) => (prev || []).map((p) => {
      if (p.id !== id) return p;
      const was = (p.likedBy || []).includes(currentUser.id);
      return { ...p, likedBy: was ? (p.likedBy || []).filter((x) => x !== currentUser.id) : [...(p.likedBy || []), currentUser.id], likesCount: Math.max(0, (p.likesCount || 0) + (was ? -1 : 1)) };
    }));
    try {
      const r = await fetch(`/api/posts/${id}/like`, { method: 'POST' });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setPosts((prev) => (prev || []).map((p) => (p.id === id ? { ...p, likesCount: d.likesCount, likedBy: d.likedBy } : p)));
    } catch {
      flash(tx('تعذر تحديث الإعجاب', "Impossible de mettre à jour le j'aime", 'Could not update the like'));
      reload();
    } finally {
      setBusy((b) => ({ ...b, ['l' + id]: false }));
    }
  };

  const comment = async (id: string) => {
    const text = (draft[id] || '').trim();
    if (!text || !currentUser) return;
    setBusy((b) => ({ ...b, ['c' + id]: true }));
    try {
      const r = await fetch(`/api/posts/${id}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text }) });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setPosts((prev) => (prev || []).map((p) => (p.id === id ? { ...p, comments: [...(p.comments || []), d.comment as PostComment] } : p)));
      setDraft((x) => ({ ...x, [id]: '' }));
      setOpen((o) => ({ ...o, [id]: true }));
    } catch {
      flash(tx('تعذر نشر التعليق', "Impossible de publier le commentaire", 'Could not post the comment'));
    } finally {
      setBusy((b) => ({ ...b, ['c' + id]: false }));
    }
  };

  const share = (p: Post) => {
    navigator.clipboard?.writeText(`${window.location.origin}/${locale}/community#post-${p.id}`);
    flash(tx('تم نسخ رابط المنشور', 'Lien copié', 'Link copied'));
  };

  return (
    <div className="flex flex-col gap-7" data-testid="student-community-v2">
      <PageHead title={tx('المجتمع', 'Communauté', 'Community')} sub={tx('فيديوهات ومنشورات من الأساتذة وسفراء الولايات.', 'Vidéos et publications des enseignants et ambassadeurs.', 'Videos and posts from teachers and ambassadors.')} />
      <Tabs label={tx('تصفية المنشورات', 'Filtrer les publications', 'Filter posts')} value={filter} onChange={(v) => setFilter(v as typeof filter)} items={[
        { id: 'all', label: tx('الأحدث', 'Récent', 'Latest') },
        { id: 'videos', label: tx('فيديوهات', 'Vidéos', 'Videos') },
        { id: 'articles', label: tx('مقالات', 'Articles', 'Articles') },
      ]} />
      <p role="status" className="min-h-[1.25rem] text-[14px] font-medium">{note}</p>

      {posts === null ? (
        <SkeletonRows n={3} />
      ) : list.length === 0 ? (
        <Empty title={tx('لا توجد منشورات بعد', 'Aucune publication pour le moment', 'No posts yet')} body={tx('ستظهر هنا فيديوهات ومنشورات الأساتذة والسفراء.', 'Les vidéos et publications apparaîtront ici.', 'Teacher and ambassador posts will show up here.')} />
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((p) => {
            const liked = !!currentUser && (p.likedBy || []).includes(currentUser.id);
            const cs = p.comments || [];
            return (
              <li key={p.id} id={`post-${p.id}`}>
                <Panel as="article" className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={p.authorName} src={p.authorAvatar} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold">{p.authorName}</p>
                      <p className="text-[12px] text-sheet-muted">{roleLabel(p.authorRole, tx)}</p>
                    </div>
                    <time dateTime={p.createdAt} className="text-[12px] text-sheet-muted">{dateFmt(p.createdAt, locale, { day: 'numeric', month: 'short' })}</time>
                  </div>
                  {p.title ? <h2 className="text-[18px] font-semibold">{p.title}</h2> : null}
                  <p className="whitespace-pre-line text-[15px]">{p.content}</p>
                  {p.videoUrl ? <div className="overflow-hidden rounded-[16px]"><VideoPlayer url={p.videoUrl} title={p.title} /></div> : null}
                  {p.imageUrls && p.imageUrls.length > 0 ? (
                    <div className={`grid gap-2 ${p.imageUrls.length > 1 ? 'grid-cols-2' : ''}`}>
                      {p.imageUrls.slice(0, 4).map((u) => <img key={u} src={u} alt="" className="max-h-[320px] w-full rounded-[16px] object-cover" loading="lazy" />)}
                    </div>
                  ) : null}
                  {p.linkUrl ? <a href={p.linkUrl} target="_blank" rel="noreferrer" className={`w-fit text-[14px] font-medium underline underline-offset-4 ${focus}`}>{tx('فتح الرابط', 'Ouvrir le lien', 'Open link')}</a> : null}

                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <button type="button" onClick={() => like(p.id)} aria-pressed={liked} disabled={!currentUser} className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-3 text-[14px] font-semibold hover:bg-sheet-line ${focus}`}>
                      <Heart size={20} weight={liked ? 'fill' : 'regular'} aria-hidden="true" />
                      <span className="tabular-nums">{p.likesCount || 0}</span>
                      <span className="sr-only">{tx('إعجاب', "J'aime", 'Like')}</span>
                    </button>
                    <button type="button" onClick={() => setOpen((o) => ({ ...o, [p.id]: !o[p.id] }))} aria-expanded={!!open[p.id]} className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-3 text-[14px] font-semibold hover:bg-sheet-line ${focus}`}>
                      <ChatCircle size={20} aria-hidden="true" />
                      <span className="tabular-nums">{cs.length}</span>
                      <span className="sr-only">{tx('تعليقات', 'Commentaires', 'Comments')}</span>
                    </button>
                    <button type="button" onClick={() => share(p)} className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-3 text-[14px] font-semibold hover:bg-sheet-line ${focus}`}>
                      <ShareNetwork size={20} aria-hidden="true" />
                      <span className="sr-only">{tx('مشاركة', 'Partager', 'Share')}</span>
                    </button>
                  </div>

                  {open[p.id] ? (
                    <div className="flex flex-col gap-3 border-t border-sheet-line pt-3">
                      {cs.length === 0 ? <p className="text-[14px] text-sheet-muted">{tx('كن أول من يعلّق.', 'Soyez le premier à commenter.', 'Be the first to comment.')}</p> : (
                        <ul className="flex flex-col gap-3">
                          {cs.map((c) => (
                            <li key={c.id} className="flex gap-3">
                              <Avatar name={c.authorName} src={c.authorAvatar} size={36} />
                              <div className="min-w-0">
                                <p className="text-[14px] font-semibold">{c.authorName} <span className="font-normal text-sheet-muted">· {roleLabel(c.authorRole, tx)}</span></p>
                                <p className="text-[14px]">{c.content}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      {currentUser ? (
                        <form onSubmit={(e) => { e.preventDefault(); comment(p.id); }} className="flex gap-2">
                          <label htmlFor={`cm-${p.id}`} className="sr-only">{tx('اكتب تعليقاً', 'Écrire un commentaire', 'Write a comment')}</label>
                          <input id={`cm-${p.id}`} value={draft[p.id] || ''} onChange={(e) => setDraft((d) => ({ ...d, [p.id]: e.target.value }))} placeholder={tx('اكتب تعليقاً', 'Écrire un commentaire', 'Write a comment')} className={`${fieldClass} flex-1 !bg-sheet`} />
                          <Btn type="submit" disabled={busy['c' + p.id] || !(draft[p.id] || '').trim()}>{tx('نشر', 'Publier', 'Post')}</Btn>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                </Panel>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

/** Top contributors: publishers ranked by the likes and comments their posts received. Real data from /api/posts; there is no points system. */
export const StudentLeaderboardV2: React.FC = () => {
  const { tx } = useTx();
  const { posts } = usePosts();
  const [range, setRange] = useState<'week' | 'month' | 'all'>('all');

  const ranked = useMemo(() => {
    const since = range === 'all' ? 0 : Date.now() - (range === 'week' ? 7 : 30) * 86400000;
    const m = new Map<string, { id: string; name: string; avatar?: string; role: string; likes: number; comments: number; posts: number }>();
    (posts || []).filter((p) => new Date(p.createdAt).getTime() >= since).forEach((p) => {
      const r = m.get(p.authorId) || { id: p.authorId, name: p.authorName, avatar: p.authorAvatar, role: p.authorRole, likes: 0, comments: 0, posts: 0 };
      r.likes += p.likesCount || 0; r.comments += (p.comments || []).length; r.posts += 1;
      m.set(p.authorId, r);
    });
    return [...m.values()].sort((a, b) => b.likes + b.comments - (a.likes + a.comments) || b.posts - a.posts);
  }, [posts, range]);

  const pts = (r: { likes: number; comments: number }) => `${r.likes + r.comments} ${tx('تفاعل', 'interactions', 'interactions')}`;
  const top = ranked.slice(0, 3);
  const order = [top[2], top[0], top[1]];

  return (
    <div className="flex flex-col gap-7" data-testid="student-leaderboard-v2">
      <PageHead title={tx('أبرز المساهمين', 'Meilleurs contributeurs', 'Top contributors')} sub={tx('ترتيب الناشرين حسب تفاعل المجتمع مع منشوراتهم.', 'Classement des auteurs selon les réactions de la communauté.', 'Authors ranked by how the community reacts to their posts.')} />
      <Tabs label={tx('الفترة', 'Période', 'Period')} value={range} onChange={(v) => setRange(v as typeof range)} items={[
        { id: 'week', label: tx('هذا الأسبوع', 'Cette semaine', 'This week') },
        { id: 'month', label: tx('هذا الشهر', 'Ce mois', 'This month') },
        { id: 'all', label: tx('الكل', 'Tout', 'All time') },
      ]} />
      {posts === null ? <SkeletonRows n={4} /> : ranked.length === 0 ? (
        <Empty title={tx('لا توجد بيانات بعد', 'Pas encore de données', 'No data yet')} body={tx('يظهر الترتيب عندما ينشر الأساتذة والسفراء ويتفاعل المجتمع.', "Le classement apparaît quand les enseignants publient et que la communauté réagit.", 'The ranking appears once teachers publish and the community reacts.')} />
      ) : (
        <>
          <ol className="grid grid-cols-3 items-end gap-3 sm:gap-4" aria-label={tx('المراكز الثلاثة الأولى', 'Les trois premiers', 'Top three')}>
            {order.map((r, i) => {
              if (!r) return <li key={i} />;
              const first = i === 1;
              const rank = i === 1 ? 1 : i === 0 ? 3 : 2;
              return (
                <li key={r.id} className={`flex flex-col items-center gap-2 rounded-[24px] px-2 text-center sm:px-4 ${first ? 'bg-strip py-8 text-strip-text' : 'bg-sheet-card py-5'}`}>
                  <span className={`text-[28px] font-bold ${first ? 'text-gold-700 dark:text-gold-500' : ''}`}>{rank}</span>
                  <Avatar name={r.name} src={r.avatar} size={first ? 72 : 56} />
                  <span className="max-w-full truncate text-[14px] font-medium">{r.name}</span>
                  <span className={`text-[13px] ${first ? 'text-strip-muted' : 'text-sheet-muted'}`}>{pts(r)}</span>
                </li>
              );
            })}
          </ol>
          <ol start={4} className="flex flex-col gap-3">
            {ranked.slice(3, 10).map((r, i) => (
              <li key={r.id} className="flex items-center gap-4 rounded-[18px] bg-sheet-card px-5 py-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sheet-line text-[14px] font-semibold">{i + 4}</span>
                <Avatar name={r.name} src={r.avatar} size={36} />
                <span className="min-w-0 flex-1 truncate text-[16px] font-medium">{r.name}</span>
                <span className="text-[14px] font-semibold tabular-nums">{pts(r)}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
};
