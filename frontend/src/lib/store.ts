'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { User } from '@/types';

let currentUser: User | null = null;
let authChecked = false;
let checkPromise: Promise<void> | null = null;
let snapshot: { currentUser: User | null; authChecked: boolean } = { currentUser, authChecked };
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return snapshot;
}

const SERVER_SNAPSHOT = { currentUser: null, authChecked: false };

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function notify() {
  snapshot = { currentUser, authChecked };
  listeners.forEach((l) => l());
}

function setUser(user: User | null) {
  currentUser = user;
  authChecked = true;
  notify();
}

async function checkAuth(): Promise<void> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
    } else {
      currentUser = null;
    }
  } catch (e) {
    currentUser = null;
  }
  authChecked = true;
  notify();
}

export function refreshAuth() {
  checkPromise = null;
  return checkAuth();
}

export function setCurrentUserDirectly(user: User | null) {
  setUser(user);
}

export function useAuthStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!checkPromise) {
      checkPromise = checkAuth();
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'فشل تسجيل الدخول',
          requiresVerification: Boolean(data.requiresVerification),
          unverifiedUser: data.requiresVerification
            ? {
                email: data.email || email,
                name: data.name || '',
                phone: data.phone,
                wilayaName: data.wilayaName,
              }
            : undefined,
        };
      }
      setUser(data.user);
      return { success: true, user: data.user as User };
    } catch (err: unknown) {
      return { success: false, error: (err as Error)?.message || 'فشل الاتصال بالخادم' };
    }
  }, []);

  const register = useCallback(
    async (payload: { name: string; email: string; password: string; phone?: string; wilayaCode?: number; wilayaName?: string }) => {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return { success: false, error: data.error || 'فشل إنشاء الحساب' };
        }
        // If account requires activation / email verification, do not set current user
        if (data.requiresActivation || (data.user && !data.user.isVerified)) {
          return { success: true, requiresActivation: true, user: data.user as User };
        }
        setUser(data.user);
        return { success: true, user: data.user as User };
      } catch (err: unknown) {
        return { success: false, error: (err as Error)?.message || 'فشل الاتصال بالخادم' };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    setUser(null);
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/^\/(ar|fr|en)/);
      const currentLocale = match ? match[1] : 'ar';
      window.location.href = `/${currentLocale}`;
    }
  }, []);

  const updateProfile = useCallback(async (payload: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.user) {
        setUser(data.user);
        return { success: true, user: data.user as User };
      }
      return { success: false, error: data.error || 'فشل حفظ التعديلات' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'خطأ في الاتصال بالخادم' };
    }
  }, []);

  return {
    currentUser: snapshot.currentUser,
    isLoaded: snapshot.authChecked,
    isAuthenticated: !!snapshot.currentUser,
    login,
    register,
    signOut,
    updateProfile,
    setCurrentUser: setUser,
  };
}
