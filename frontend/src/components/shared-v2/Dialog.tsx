'use client';

import React, { useEffect, useRef } from 'react';
import { focus, useTx } from '@/components/student-v2/ui';

/**
 * Dialog of the redesigned app (Figma page 30): native <dialog>, so focus is trapped and Escape closes it.
 * Title at the start edge, close button at the end edge, optional one-line sub.
 */
export const Dialog: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  size?: 'md' | 'lg';
  testId?: string;
  closeTestId?: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, sub, size = 'md', testId, closeTestId, children }) => {
  const { tx } = useTx();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const width = size === 'lg' ? 'sm:w-[640px]' : 'sm:w-[480px]';
  return (
    <dialog
      ref={ref}
      aria-label={title}
      data-testid={testId}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className={`m-auto max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] ${width} overflow-y-auto rounded-[28px] border border-sheet-line bg-sheet p-0 text-sheet-text backdrop:bg-black/60`}
    >
      {open ? (
        <div className="flex flex-col gap-[18px] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="font-display-h text-[24px] leading-[1.3] sm:text-[28px]">{title}</h2>
              {sub ? <p className="mt-2 text-[15px] text-sheet-muted">{sub}</p> : null}
            </div>
            <button type="button" onClick={onClose} aria-label={tx('إغلاق', 'Fermer', 'Close')} data-testid={closeTestId} className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-sheet-line hover:bg-sheet-line ${focus}`}>
              <span aria-hidden="true" className="text-[22px] leading-none">×</span>
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
};

/** Inline message (Figma "Banner"): info, ok or danger, tinted at 16%. */
export const Banner: React.FC<{ kind: 'info' | 'ok' | 'danger'; children: React.ReactNode; testId?: string }> = ({ kind, children, testId }) => {
  const tone = kind === 'danger' ? 'bg-[#c0392b]/15' : kind === 'ok' ? 'bg-[#2e86c1]/15' : 'bg-gold-500/15';
  return (
    <div role={kind === 'danger' ? 'alert' : 'status'} data-testid={testId} className={`rounded-[14px] px-4 py-3.5 text-[14px] font-medium ${tone}`}>
      {children}
    </div>
  );
};

/** Chips that wrap, one selected (post type, region filters). */
export const ChipGroup: React.FC<{ label: string; items: { id: string; label: string }[]; value: string; onChange: (id: string) => void }> = ({ label, items, value, onChange }) => (
  <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
    {items.map((it) => {
      const on = it.id === value;
      return (
        <button key={it.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(it.id)} className={`min-h-[44px] rounded-full px-4 text-[14px] ${on ? 'bg-gold-500 font-semibold text-[#050505]' : 'bg-sheet-card font-medium text-sheet-text hover:bg-sheet-line'} ${focus}`}>
          {it.label}
        </button>
      );
    })}
  </div>
);
