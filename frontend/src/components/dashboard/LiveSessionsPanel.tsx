'use client';

import React, { useEffect, useState } from 'react';
import { Video, Check, Loader2 } from 'lucide-react';
import { PlatformSession } from '@/lib/platformStore';
import { useAuthStore } from '@/lib/store';
import { useAuthModal } from '@/lib/authModalContext';

interface LiveSessionsPanelProps {
  sessions: PlatformSession[];
  locale: string;
}

export const LiveSessionsPanel: React.FC<LiveSessionsPanelProps> = ({ sessions, locale }) => {
  const { currentUser } = useAuthStore();
  const { openAuth } = useAuthModal();
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setRegisteredIds(new Set());
      return;
    }
    fetch('/api/sessions/my-registrations', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((ids: string[]) => setRegisteredIds(new Set(ids)))
      .catch(() => {});
  }, [currentUser]);

  const toggleRegistration = async (sessionId: string) => {
    if (!currentUser) {
      openAuth('login');
      return;
    }
    setPendingId(sessionId);
    const isRegistered = registeredIds.has(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/register`, {
        method: isRegistered ? 'DELETE' : 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setRegisteredIds((prev) => {
          const next = new Set(prev);
          if (isRegistered) next.delete(sessionId);
          else next.add(sessionId);
          return next;
        });
      }
    } finally {
      setPendingId(null);
    }
  };

  const upcoming = sessions.filter((s) => s.status !== 'COMPLETED' && s.status !== 'CANCELLED');

  return (
    <div className="space-y-3" data-testid="live-sessions-panel">
      <h3 className="text-sm font-black text-slate-900 dark:text-white">
        {locale === 'ar' ? 'الحصص المباشرة والورشات' : 'Sessions Live & Ateliers'}
      </h3>
      {upcoming.length === 0 && (
        <p className="text-xs text-slate-400 py-6 text-center" data-testid="live-sessions-empty">
          {locale === 'ar' ? 'لا توجد حصص مجدولة حالياً' : 'Aucune session planifiée'}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {upcoming.map((s) => {
          const isRegistered = registeredIds.has(s.id);
          const date = new Date(s.scheduledAt);
          return (
            <div
              key={s.id}
              data-testid={`live-session-item-${s.id}`}
              className="p-4 rounded-3xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  <Video className="w-3 h-3" />
                  {s.platform === 'ONSITE' ? (locale === 'ar' ? 'حضوري' : 'Présentiel') : 'Live'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {date.toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">{s.title}</h4>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">{s.teacherName}</p>
              <button
                data-testid={`live-session-register-btn-${s.id}`}
                onClick={() => toggleRegistration(s.id)}
                disabled={pendingId === s.id}
                className={`w-full py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-60 ${
                  isRegistered
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                    : 'bg-lime-400 text-navy-950 hover:bg-lime-300'
                }`}
              >
                {pendingId === s.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isRegistered ? (
                  <Check className="w-3.5 h-3.5" />
                ) : null}
                <span>
                  {!currentUser
                    ? locale === 'ar'
                      ? 'سجل الدخول للتسجيل'
                      : 'Connexion requise'
                    : isRegistered
                    ? locale === 'ar'
                      ? 'مسجل ✓ (إلغاء)'
                      : 'Inscrit ✓ (Annuler)'
                    : locale === 'ar'
                    ? 'سجل في الحصة'
                    : "S'inscrire"}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
