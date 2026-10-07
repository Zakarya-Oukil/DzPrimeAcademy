'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PlatformSession } from '@/lib/platformStore';

interface MiniCalendarProps {
  sessions: PlatformSession[];
  locale: string;
}

const MONTHS_AR = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DOW_AR = ['أ', 'إ', 'ث', 'أ', 'خ', 'ج', 'س'];
const DOW_FR = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export const MiniCalendar: React.FC<MiniCalendarProps> = ({ sessions, locale }) => {
  const [cursor, setCursor] = useState(new Date());
  const months = locale === 'ar' ? MONTHS_AR : MONTHS_FR;
  const dow = locale === 'ar' ? DOW_AR : DOW_FR;

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const sessionDays = new Set(
    sessions
      .map((s) => new Date(s.scheduledAt))
      .filter((d) => d.getFullYear() === year && d.getMonth() === month)
      .map((d) => d.getDate())
  );

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div data-testid="mini-calendar" className="p-5 rounded-3xl bg-white dark:bg-[#0C1428] border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <button
          data-testid="calendar-prev-month"
          aria-label="Previous month"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h4 className="text-xs font-black text-slate-900 dark:text-white">
          {months[month]}, {year}
        </h4>
        <button
          data-testid="calendar-next-month"
          aria-label="Next month"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
        {dow.map((d, i) => (
          <span key={i} className="text-[10px] font-bold text-slate-400">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const hasSession = sessionDays.has(day);
          return (
            <div
              key={idx}
              data-testid={`calendar-day-${day}`}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                isToday ? 'bg-lime-400 text-slate-950' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <span>{day}</span>
              {hasSession && !isToday && <span className="w-1 h-1 rounded-full bg-lime-500 mt-0.5" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};
