'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { ExamItem } from '@/types';
import { useAuthStore } from '@/lib/store';

/** Data hooks shared by the redesigned Student screens. They call the same APIs as the old screens. */

export interface EnrollmentItem {
  id: string;
  courseId?: string;
  courseTitle: string;
  teacherName: string;
  progressPercent: number;
  remainingHours: number;
}

export function useEnrollments() {
  const { currentUser } = useAuthStore();
  const [items, setItems] = useState<EnrollmentItem[] | null>(null);
  useEffect(() => {
    if (!currentUser) { setItems([]); return; }
    let live = true;
    fetch(`/api/enrollments?studentId=${currentUser.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => live && setItems(Array.isArray(d) ? d : []))
      .catch(() => live && setItems([]));
    return () => { live = false; };
  }, [currentUser]);
  return items;
}

/** Sessions the student registered for, with a toggle that calls the register API. */
export function useRegistrations() {
  const { currentUser } = useAuthStore();
  const [ids, setIds] = useState<Set<string> | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => {
    if (!currentUser) { setIds(new Set()); return; }
    let live = true;
    fetch('/api/sessions/my-registrations', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((a: string[]) => live && setIds(new Set(a)))
      .catch(() => live && setIds(new Set()));
    return () => { live = false; };
  }, [currentUser]);

  const toggle = useCallback(async (sessionId: string) => {
    if (!ids) return;
    setPending(sessionId);
    const on = ids.has(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/register`, { method: on ? 'DELETE' : 'POST', credentials: 'include' });
      if (res.ok) {
        setIds((prev) => {
          const next = new Set(prev || []);
          if (on) next.delete(sessionId); else next.add(sessionId);
          return next;
        });
      }
    } finally {
      setPending(null);
    }
  }, [ids]);

  return { ids, pending, toggle };
}

export function useExams() {
  const { currentUser } = useAuthStore();
  const [exams, setExams] = useState<ExamItem[] | null>(null);
  useEffect(() => {
    let live = true;
    fetch('/api/exams')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && setExams(d && Array.isArray(d.exams) ? d.exams : []))
      .catch(() => live && setExams([]));
    return () => { live = false; };
  }, [currentUser?.id, currentUser?.role]);
  return exams;
}

// ---- Exam bag: the exams a student saved. Kept in this browser (the old screen lost it on every visit).
const BAG_KEY = 'dz_exam_bag';
const EMPTY: string[] = [];
let bag: string[] = EMPTY;
let bagLoaded = false;
const bagListeners = new Set<() => void>();

function loadBag() {
  if (bagLoaded || typeof window === 'undefined') return;
  bagLoaded = true;
  try {
    const raw = JSON.parse(localStorage.getItem(BAG_KEY) || '[]');
    if (Array.isArray(raw)) bag = raw.filter((x) => typeof x === 'string');
  } catch { /* storage unavailable: the bag stays empty */ }
}

function setBag(next: string[]) {
  bag = next;
  try { localStorage.setItem(BAG_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  bagListeners.forEach((l) => l());
}

export function useExamBag() {
  const ids = useSyncExternalStore(
    (cb) => { loadBag(); bagListeners.add(cb); return () => { bagListeners.delete(cb); }; },
    () => { loadBag(); return bag; },
    () => EMPTY,
  );
  const toggle = useCallback((id: string) => setBag(bag.includes(id) ? bag.filter((x) => x !== id) : [...bag, id]), []);
  return { ids, has: (id: string) => ids.includes(id), toggle, count: ids.length };
}

/** Re-renders every `ms` milliseconds with the current time (for countdowns). */
export function useNow(ms = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
