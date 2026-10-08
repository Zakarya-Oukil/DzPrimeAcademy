'use client';

import React, { useEffect, useState } from 'react';
import { X, Video, Bell } from 'lucide-react';
import { usePlatformStore } from '@/lib/platformStore';
import { useTranslation } from '@/lib/i18n/useTranslation';

const REMINDER_WINDOW_MINUTES = 60;

export const SessionReminderBanner: React.FC = () => {
  const { locale } = useTranslation();
  const { sessions } = usePlatformStore();
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetch('/api/sessions/my-registrations', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((ids: string[]) => setRegisteredIds(new Set(ids)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const upcoming = sessions.filter((s) => {
    if (!registeredIds.has(s.id) || dismissedIds.has(s.id)) return false;
    if (s.status === 'COMPLETED' || s.status === 'CANCELLED') return false;
    const start = new Date(s.scheduledAt).getTime();
    const end = start + s.durationMinutes * 60000;
    return now >= start - REMINDER_WINDOW_MINUTES * 60000 && now <= end;
  });

  if (upcoming.length === 0) return null;

  const dismiss = (id: string) => setDismissedIds((prev) => new Set(prev).add(id));

  return (
    <div className="px-3 sm:px-6 lg:px-8 pt-3 space-y-2" data-testid="session-reminder-banner">
      {upcoming.map((s) => {
        const start = new Date(s.scheduledAt).getTime();
        const minutesLeft = Math.max(0, Math.round((start - now) / 60000));
        const isLive = now >= start;
        return (
          <div
            key={s.id}
            data-testid={`session-reminder-${s.id}`}
            className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-lime-400/15 border border-lime-400/40 text-slate-900 dark:text-white"
          >
            <div className="w-8 h-8 rounded-xl bg-lime-400/20 border border-lime-400/40 flex items-center justify-center shrink-0">
              {isLive ? (
                <Video className="w-4 h-4 text-lime-600 dark:text-lime-300 " />
              ) : (
                <Bell className="w-4 h-4 text-lime-600 dark:text-lime-300" />
              )}
            </div>
            <div className="flex-1 min-w-0 text-xs sm:text-sm font-bold">
              {isLive
                ? locale === 'ar'
                  ? `حصة "${s.title}" بدأت الآن! انضم فوراً.`
                  : `La session "${s.title}" a commencé ! Rejoignez maintenant.`
                : locale === 'ar'
                ? `حصة "${s.title}" تبدأ بعد ${minutesLeft} دقيقة.`
                : `La session "${s.title}" commence dans ${minutesLeft} min.`}
            </div>
            {s.meetUrl && (
              <a
                href={s.meetUrl}
                target="_blank"
                rel="noreferrer"
                data-testid={`session-reminder-join-${s.id}`}
                className="px-3 py-1.5 rounded-xl bg-lime-400 text-navy-950 text-[11px] font-black shrink-0"
              >
                {locale === 'ar' ? 'انضم' : 'Rejoindre'}
              </a>
            )}
            <button
              onClick={() => dismiss(s.id)}
              data-testid={`session-reminder-dismiss-${s.id}`}
              className="p-1.5 rounded-lg hover:bg-black/10 text-slate-500 dark:text-gray-400 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
