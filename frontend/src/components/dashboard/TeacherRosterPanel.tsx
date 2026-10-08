'use client';

import React, { useEffect, useState } from 'react';
import { Users2, Video, Loader2 } from 'lucide-react';

interface RosterRegistration {
  id: string;
  studentName: string;
  registeredAt: string;
  attended: boolean;
}

interface RosterSession {
  id: string;
  title: string;
  scheduledAt: string;
  registrations: RosterRegistration[];
}

interface TeacherRosterPanelProps {
  locale: string;
}

export const TeacherRosterPanel: React.FC<TeacherRosterPanelProps> = ({ locale }) => {
  const [sessions, setSessions] = useState<RosterSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/teacher/roster', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center" data-testid="teacher-roster-loading">
        <Loader2 className="w-5 h-5 text-lime-500 animate-spin" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div
        className="p-8 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400"
        data-testid="teacher-roster-placeholder"
      >
        {locale === 'ar'
          ? 'ستظهر قائمة الطلبة المسجلين وحضورهم هنا فور تسجيلهم في حصصك.'
          : 'La liste des étudiants inscrits et leur présence apparaîtra ici.'}
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="teacher-roster-panel">
      {sessions.map((s) => (
        <div
          key={s.id}
          data-testid={`roster-session-${s.id}`}
          className="p-4 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <Video className="w-4 h-4 text-lime-500 shrink-0" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{s.title}</h4>
            </div>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-lime-500/15 text-lime-700 dark:text-lime-300 text-[10px] font-bold shrink-0">
              <Users2 className="w-3 h-3" /> {s.registrations.length}
            </span>
          </div>
          {s.registrations.length === 0 ? (
            <p className="text-[11px] text-slate-400">
              {locale === 'ar' ? 'لا يوجد طلبة مسجلون بعد' : 'Aucun étudiant inscrit'}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {s.registrations.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between text-[11px] text-slate-700 dark:text-gray-300 border-t border-slate-100 dark:border-slate-800 pt-1.5"
                >
                  <span className="font-semibold">{r.studentName}</span>
                  <span className="text-slate-400 font-mono">
                    {new Date(r.registeredAt).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};
