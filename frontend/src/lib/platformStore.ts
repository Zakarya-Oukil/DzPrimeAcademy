'use client';

import { useCallback, useSyncExternalStore } from 'react';

export interface PlatformCourse {
  id: string;
  titleAr: string;
  titleFr?: string | null;
  titleEn?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  teacherId?: string | null;
  teacherName: string;
  category: 'BAC' | 'UNIVERSITY_LMD' | 'MEDICAL';
  lessonsCount: number;
  /** Average of real student reviews, null until enough students have rated. */
  rating: number | null;
  ratingCount?: number;
  priceDzd: number;
  isLive: boolean;
  colorTheme: string;
  createdAt: string;
}

export interface PlatformSession {
  id: string;
  title: string;
  courseId?: string | null;
  teacherId?: string | null;
  teacherName: string;
  scheduledAt: string;
  durationMinutes: number;
  platform: 'GOOGLE_MEET' | 'CLASSROOM' | 'ONSITE';
  meetUrl?: string | null;
  wilayaCode?: number | null;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  category: 'BAC' | 'UNIVERSITY_LMD' | 'MEDICAL';
  createdAt: string;
  registrationsCount?: number;
}

const CACHE_KEY = 'dz_prime_platform_cache';

interface PlatformState {
  courses: PlatformCourse[];
  sessions: PlatformSession[];
  loaded: boolean;
}

let state: PlatformState = { courses: [], sessions: [], loaded: false };
const listeners = new Set<() => void>();

function readCache(): PlatformState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function writeCache() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch (e) {}
}

if (typeof window !== 'undefined') {
  const cached = readCache();
  if (cached) state = { ...cached, loaded: false };
}

function notify() {
  writeCache();
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): PlatformState {
  return state;
}

const SERVER_SNAPSHOT: PlatformState = { courses: [], sessions: [], loaded: false };

function getServerSnapshot(): PlatformState {
  return SERVER_SNAPSHOT;
}

let hasFetched = false;

async function refresh() {
  try {
    const [coursesRes, sessionsRes] = await Promise.all([
      fetch('/api/courses'),
      fetch('/api/sessions'),
    ]);
    const courses = coursesRes.ok ? await coursesRes.json() : [];
    const sessions = sessionsRes.ok ? await sessionsRes.json() : [];
    state = { courses, sessions, loaded: true };
    notify();
  } catch (e) {
    state = { ...state, loaded: true };
    notify();
  }
}

export function usePlatformStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (typeof window !== 'undefined' && !hasFetched) {
    hasFetched = true;
    refresh();
  }

  const addCourse = useCallback(
    async (course: Omit<PlatformCourse, 'id' | 'createdAt' | 'rating'>) => {
      const tempId = `temp-${Date.now()}`;
      const optimistic: PlatformCourse = {
        ...course,
        id: tempId,
        rating: null,
        createdAt: new Date().toISOString(),
      };
      state = { ...state, courses: [optimistic, ...state.courses] };
      notify();

      try {
        const res = await fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(course),
        });
        if (res.ok) {
          const saved = await res.json();
          state = {
            ...state,
            courses: state.courses.map((c) => (c.id === tempId ? saved : c)),
          };
          notify();
        }
      } catch (e) {}
    },
    []
  );

  const addSession = useCallback(
    async (session: Omit<PlatformSession, 'id' | 'createdAt' | 'status'>) => {
      const tempId = `temp-${Date.now()}`;
      const optimistic: PlatformSession = {
        ...session,
        id: tempId,
        status: 'UPCOMING',
        createdAt: new Date().toISOString(),
      };
      state = { ...state, sessions: [optimistic, ...state.sessions] };
      notify();

      try {
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(session),
        });
        if (res.ok) {
          const saved = await res.json();
          state = {
            ...state,
            sessions: state.sessions.map((s) => (s.id === tempId ? saved : s)),
          };
          notify();
          return { success: true };
        }
        const errData = await res.json().catch(() => ({}));
        state = { ...state, sessions: state.sessions.filter((s) => s.id !== tempId) };
        notify();
        return { success: false, error: errData.error };
      } catch (e) {
        state = { ...state, sessions: state.sessions.filter((s) => s.id !== tempId) };
        notify();
        return { success: false, error: 'network_error' };
      }
    },
    []
  );

  const removeCourse = useCallback(async (id: string) => {
    state = { ...state, courses: state.courses.filter((c) => c.id !== id) };
    notify();
    try {
      await fetch(`/api/courses/${id}`, { method: 'DELETE' });
    } catch (e) {}
  }, []);

  return {
    courses: snapshot.courses,
    sessions: snapshot.sessions,
    loaded: snapshot.loaded,
    addCourse,
    addSession,
    removeCourse,
    refresh,
  };
}
