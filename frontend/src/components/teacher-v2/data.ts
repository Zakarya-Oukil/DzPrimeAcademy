'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';

/** Data hooks of the redesigned Teacher area. They call the same APIs as the old panels; the server decides ownership from the login. */

export type Track = 'BAC' | 'UNIVERSITY_LMD' | 'MEDICAL';
export type Platform = 'GOOGLE_MEET' | 'CLASSROOM' | 'ONSITE';

export interface TCourse {
  id: string;
  titleAr: string;
  titleFr?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  category: Track;
  lessonsCount: number;
  priceDzd: number;
  isLive: boolean;
  teacherId?: string | null;
}

export interface TSession {
  id: string;
  title: string;
  courseId?: string | null;
  scheduledAt: string;
  durationMinutes: number;
  platform: Platform;
  meetUrl?: string | null;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  teacherId?: string | null;
  registrationsCount?: number;
}

export interface RosterRegistration { id: string; studentName: string; registeredAt: string; attended: boolean }
export interface RosterSession { id: string; title: string; scheduledAt: string; registrations: RosterRegistration[] }

export interface Payout { id: string; amountDzd: number; periodMonth: string; status: 'PENDING' | 'APPROVED' | 'PAID'; approvedAt?: string | null; receiptRef?: string | null; createdAt: string }
export interface TeacherAccount { teacherProfile: { ccpAccount?: string | null; ccpCle?: string | null; university?: string | null; specialty?: string | null; payouts?: Payout[] } | null }

export async function api(path: string, method: string, body?: unknown) {
  const res = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

function useList<T>(url: string, pick: (d: unknown) => T[], mine: (x: T, userId: string) => boolean) {
  const { currentUser } = useAuthStore();
  const [items, setItems] = useState<T[] | null>(null);
  const load = useCallback(async () => {
    if (!currentUser) { setItems([]); return; }
    try {
      const r = await fetch(url, { credentials: 'include' });
      const d = r.ok ? await r.json() : [];
      setItems(pick(d).filter((x) => mine(x, currentUser.id)));
    } catch { setItems([]); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, currentUser?.id]);
  useEffect(() => { load(); }, [load]);
  return { items, reload: load };
}

export const useMyCourses = () => useList<TCourse>('/api/courses', (d) => (Array.isArray(d) ? d : []), (c, id) => c.teacherId === id);
export const useMySessions = () => useList<TSession>('/api/sessions', (d) => (Array.isArray(d) ? d : []), (s, id) => s.teacherId === id);
export const useRoster = () => useList<RosterSession>('/api/teacher/roster', (d) => (Array.isArray(d) ? d : []), () => true);

export function useAccount() {
  const { currentUser } = useAuthStore();
  const [data, setData] = useState<TeacherAccount | null>(null);
  useEffect(() => {
    if (!currentUser) return;
    let live = true;
    fetch('/api/account', { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)).then((d) => live && setData(d || { teacherProfile: null })).catch(() => live && setData({ teacherProfile: null }));
    return () => { live = false; };
  }, [currentUser?.id]);
  return data;
}

/** `datetime-local` value from an ISO date, in the viewer's time zone. */
export const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
