'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Btn, focus, useTx } from '@/components/student-v2/ui';
import { StudentBotV2 } from '@/components/student-v2/Bot';

/** Floating assistant in the redesigned shell (Figma page 30): a launcher pill and a non-modal panel with the guided exam finder. */
export const FloatingBotWidgetV2: React.FC = () => {
  const { tx, locale } = useTx();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const title = tx('مساعد الامتحانات', "Assistant d'examens", 'Exam assistant');
  return (
    <div className="fixed bottom-4 end-3 z-50 select-none print:hidden sm:bottom-6 sm:end-6" data-testid="floating-bot-v2">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} aria-label={title} data-testid="floating-bot-launcher" className={`flex min-h-[56px] items-center rounded-full bg-gold-500 px-6 text-[16px] font-semibold text-[#050505] shadow-[0_8px_20px_rgba(0,0,0,0.35)] hover:bg-gold-400 ${focus}`}>
          {title}
        </button>
      ) : (
        <section role="dialog" aria-label={title} data-testid="floating-bot-panel" className="flex max-h-[min(640px,calc(100dvh-32px))] w-[calc(100vw-24px)] flex-col gap-3 overflow-y-auto rounded-[28px] border border-sheet-line bg-sheet p-5 text-sheet-text shadow-[0_12px_32px_rgba(0,0,0,0.35)] sm:w-[400px]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display-h text-[22px] leading-[1.3]">{title}</h2>
              <p className="mt-1 text-[13px] text-sheet-muted">{tx('توجيه خطوة بخطوة بدون كتابة', 'Guidage pas à pas, sans rien écrire', 'Step-by-step guidance, no typing')}</p>
            </div>
            <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label={tx('إغلاق النافذة', 'Fermer la fenêtre', 'Close')} data-testid="floating-bot-close" className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-sheet-line hover:bg-sheet-line ${focus}`}>
              <span aria-hidden="true" className="text-[22px] leading-none">×</span>
            </button>
          </div>
          <StudentBotV2 compact />
          <div className="flex justify-end"><Btn variant="text" href={`/${locale}/bot`}>{tx('فتح الشاشة الكاملة', "Ouvrir en plein écran", 'Open full screen')}</Btn></div>
        </section>
      )}
    </div>
  );
};
