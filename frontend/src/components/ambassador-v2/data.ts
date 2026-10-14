'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Post } from '@/types';
import { useAuthStore } from '@/lib/store';

export { api } from '@/components/teacher-v2/data';

/** What /api/account returns for an ambassador (AmbassadorProfile row). */
export interface AmbProfile {
  promoCode?: string | null;
  commissionDzd?: number | null;
  referralsCount?: number | null;
  telegramHandle?: string | null;
  bioAr?: string | null;
  institutionNameAr?: string | null;
  specialtyName?: string | null;
}

/** null while loading; `{}` when the account has no ambassador row yet. */
export function useAmbAccount() {
  const { currentUser } = useAuthStore();
  const [data, setData] = useState<AmbProfile | null>(null);
  useEffect(() => {
    if (!currentUser) return;
    let live = true;
    fetch('/api/account', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && setData(d?.ambassadorProfile || {}))
      .catch(() => live && setData({}));
    return () => { live = false; };
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return data;
}

/** The ambassador's own posts, newest first. Announcements are the ones without a video. */
export function useMyPosts() {
  const { currentUser } = useAuthStore();
  const [items, setItems] = useState<Post[] | null>(null);
  const load = useCallback(async () => {
    if (!currentUser) { setItems([]); return; }
    try {
      const r = await fetch(`/api/posts?authorId=${currentUser.id}`, { credentials: 'include' });
      const d = r.ok ? await r.json() : { posts: [] };
      setItems(d.posts || []);
    } catch { setItems([]); }
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);
  return { items, reload: load, setItems };
}

export const isAnnouncement = (p: Post) => !p.videoUrl;

/** Promo code shown when the account has none stored: the platform's own format. */
export const promoOf = (p: AmbProfile | null, wilayaCode?: number) => p?.promoCode || `WIL${wilayaCode || 16}-VIP`;
