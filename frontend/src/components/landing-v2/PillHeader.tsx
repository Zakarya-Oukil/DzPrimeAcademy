'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { List, X } from '@phosphor-icons/react';
import type { Locale } from '@/types';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useTheme } from '@/lib/theme';
import { copyFor } from './copy';
import { ctaClass } from './ui';

const LANGUAGES: { code: Locale; label: string }[] = [
  { code: 'ar', label: 'العربية' },
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
];

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current';

/** Light/dark segmented control, shared by the header menu and the footer. */
export const ThemeSegment: React.FC<{ tone: 'pill' | 'strip' }> = ({ tone }) => {
  const { locale } = useTranslation();
  const c = copyFor(locale).nav;
  const { theme, setTheme, mounted } = useTheme();
  const wrap = tone === 'pill' ? 'bg-pill-tint' : 'bg-strip-tint';
  const on = tone === 'pill' ? 'bg-pill-text text-pill' : 'bg-strip-text text-strip-on';
  const off = tone === 'pill' ? 'text-pill-muted hover:text-pill-text' : 'text-strip-muted hover:text-strip-text';
  return (
    <div role="group" aria-label={c.theme} className={`inline-flex gap-0.5 rounded-[10px] p-[3px] ${wrap}`}>
      {(['light', 'dark'] as const).map((m) => {
        const active = mounted && theme === m;
        return (
          <button
            key={m}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(m)}
            className={`min-h-[36px] rounded-[8px] px-3.5 text-[14px] font-medium transition-colors duration-200 motion-reduce:transition-none ${active ? on : off} ${focus}`}
          >
            {m === 'light' ? c.light : c.dark}
          </button>
        );
      })}
    </div>
  );
};

export const LanguageLinks: React.FC<{ tone: 'pill' | 'strip' | 'page'; className?: string }> = ({ tone, className = '' }) => {
  const { locale, setLocale } = useTranslation();
  const color = tone === 'pill' ? 'text-pill-muted hover:text-pill-text' : tone === 'strip' ? 'text-strip-muted hover:text-strip-text' : 'text-muted hover:text-foreground';
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {LANGUAGES.filter((l) => l.code !== locale).map((l) => (
        <button key={l.code} type="button" lang={l.code} onClick={() => setLocale(l.code)} className={`min-h-[40px] rounded-full px-2.5 text-[14px] font-medium transition-colors duration-200 motion-reduce:transition-none ${color} ${focus}`}>
          {l.label}
        </button>
      ))}
    </div>
  );
};

export const PillHeader: React.FC<{ onOpenAuth: (tab: 'login' | 'register') => void }> = ({ onOpenAuth }) => {
  const { locale } = useTranslation();
  const c = copyFor(locale).nav;
  const pathname = usePathname() || '';
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  // Scroll state without a scroll listener: a sentinel at the very top of the document leaves the viewport.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const links = [
    { href: `/${locale}/dawarat`, label: c.courses },
    { href: `/${locale}/exams`, label: c.exams },
    { href: `/${locale}/community`, label: c.community },
    { href: `/${locale}/ambassadors`, label: c.ambassadors },
  ];
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const shell = scrolled || open
    ? 'border-pill-line shadow-[0_6px_18px_rgba(0,0,0,0.28)]'
    : 'border-transparent shadow-none';

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-6 w-full" />
      <header className="pointer-events-none sticky top-0 z-40">
        <div className={`px-4 pt-3 transition-[padding] duration-200 ease-out motion-reduce:transition-none ${scrolled ? 'sm:px-6' : 'sm:px-12 sm:pt-6'}`}>
          <nav
            aria-label={c.main}
            className={`pointer-events-auto mx-auto max-w-[1344px] border bg-pill text-pill-text transition-[border-color,box-shadow,border-radius] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${open ? 'rounded-[28px]' : 'rounded-[36px]'} ${shell}`}
          >
            <div className={`flex items-center gap-1.5 px-2 sm:px-4 ${scrolled ? 'py-2' : 'py-2 lg:py-3.5'}`}>
              <Link href={`/${locale}`} aria-label={c.home} className={`flex items-center gap-2.5 rounded-full ps-1 pe-2 sm:gap-3 sm:pe-3 ${focus}`}>
                <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-[#9a6b1e] bg-[#050505]">
                  <Image src="/images/dzprime-logo-amber.png" alt="" width={38} height={38} priority className="h-[38px] w-[38px] object-contain" />
                </span>
                <span className="whitespace-nowrap text-[16px] font-semibold tracking-tight sm:text-[17px]">DZ Prime Academy</span>
              </Link>

              <ul className="hidden items-center lg:flex">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      aria-current={isActive(l.href) ? 'page' : undefined}
                      className={`relative inline-flex min-h-[44px] items-center px-3.5 text-[15px] transition-colors duration-200 motion-reduce:transition-none ${isActive(l.href) ? 'font-semibold text-pill-text' : 'font-medium text-pill-muted hover:text-pill-text'} ${focus}`}
                    >
                      {l.label}
                      {isActive(l.href) && <span aria-hidden="true" className="absolute bottom-1 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-pill-accent" />}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="flex-1" />

              <LanguageLinks tone="pill" className="hidden xl:flex" />
              <button type="button" onClick={() => onOpenAuth('login')} className={`hidden min-h-[44px] rounded-full px-3 text-[15px] font-semibold lg:inline-flex lg:items-center ${focus}`}>
                {c.login}
              </button>
              <button type="button" onClick={() => onOpenAuth('register')} className={`${ctaClass} hidden lg:inline-flex`}>
                {c.signup}
              </button>

              <button
                type="button"
                aria-expanded={open}
                aria-controls="landing-menu"
                onClick={() => setOpen((v) => !v)}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-full bg-pill-tint px-4 text-[15px] font-semibold lg:hidden ${focus}`}
              >
                {open ? <X size={18} aria-hidden="true" /> : <List size={18} aria-hidden="true" />}
                {open ? c.close : c.menu}
              </button>
            </div>

            {/* The panel opens by growing its row from 0fr to 1fr while it fades in; closed, it is inert so focus skips it. */}
            <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none lg:hidden ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div id="landing-menu" inert={!open} className="overflow-hidden">
            <div className="px-4 pb-5">
              <ul className="flex flex-col py-2">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} onClick={() => setOpen(false)} aria-current={isActive(l.href) ? 'page' : undefined} className={`flex min-h-[48px] items-center rounded-xl px-3 text-[20px] font-semibold ${isActive(l.href) ? 'text-pill-text' : 'text-pill-muted'} ${focus}`}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3">
                <ThemeSegment tone="pill" />
                <LanguageLinks tone="pill" />
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <button type="button" onClick={() => { setOpen(false); onOpenAuth('register'); }} className={`${ctaClass} w-full`}>{c.signup}</button>
                <button type="button" onClick={() => { setOpen(false); onOpenAuth('login'); }} className={`min-h-[44px] rounded-full text-[15px] font-semibold ${focus}`}>{c.login}</button>
              </div>
            </div>
            </div>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
};
