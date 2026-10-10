'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChatsCircle, X } from '@phosphor-icons/react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { telegramUrl, useContactSettings, whatsappUrl } from '@/lib/contactLinks';
import { copyFor } from './copy';

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current';

/**
 * One round button that opens a small panel with WhatsApp and Telegram.
 * Sits bottom-left in Arabic and bottom-right in French and English (logical `end`).
 * The "leave a message" row joins when the contact page exists.
 */
export const FloatingSupport: React.FC = () => {
  const { locale } = useTranslation();
  const c = copyFor(locale).support;
  const contacts = useContactSettings();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const firstItem = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    firstItem.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const channels = [
    { label: c.whatsapp, href: whatsappUrl(contacts.whatsappNumber) },
    { label: c.telegram, href: telegramUrl(contacts.telegramUsername) },
  ];

  return (
    <div ref={root} className="fixed bottom-4 end-4 z-50 sm:bottom-6 sm:end-6" data-testid="floating-support">
      {open && (
        <div
          id="support-panel"
          role="group"
          aria-label={c.title}
          className="absolute bottom-[72px] end-0 w-[min(320px,calc(100vw-2rem))] rounded-[24px] border border-pill-line bg-pill p-5 text-pill-text shadow-[0_10px_24px_rgba(0,0,0,0.4)]"
        >
          <p className="text-[19px] font-semibold leading-snug">{c.title}</p>
          <p className="mt-1 text-[15px] text-pill-muted">{c.sub}</p>
          <ul className="mt-4 flex flex-col gap-2">
            {channels.map((ch, i) => (
              <li key={ch.label}>
                <a
                  ref={i === 0 ? firstItem : undefined}
                  href={ch.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex min-h-[64px] items-center justify-between gap-3 rounded-2xl bg-pill-tint px-4 py-3 transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--pill-line)_40%,transparent)] motion-reduce:transition-none ${focus}`}
                >
                  <span className="flex flex-col">
                    <span className="text-[16px] font-semibold">{ch.label}</span>
                    <span className="text-[13px] text-pill-muted">{c.direct}</span>
                  </span>
                  <ArrowUpRight size={20} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-controls="support-panel"
        aria-label={open ? c.close : c.title}
        onClick={() => setOpen((v) => !v)}
        className={`grid h-[60px] w-[60px] place-items-center rounded-full bg-gold-500 text-[#050505] shadow-[0_6px_16px_rgba(0,0,0,0.35)] transition-[background-color,transform] duration-200 hover:bg-gold-400 active:translate-y-px motion-reduce:transition-none ${focus}`}
      >
        {open ? <X size={28} aria-hidden="true" /> : <ChatsCircle size={28} aria-hidden="true" />}
      </button>
    </div>
  );
};
