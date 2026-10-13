'use client';

import React from 'react';
import Link from 'next/link';
import { CaretDown, CheckCircle, Clock, Lock, MagnifyingGlass, WarningCircle } from '@phosphor-icons/react';
import { useTranslation } from '@/lib/i18n/useTranslation';

/** Building blocks of the redesigned Student area (Figma pages 26 and 27). Colours come from the CSS variables in globals.css. */

/** Picks the string for the current language. Arabic first; French is the fallback for English. */
export function useTx() {
  const { locale } = useTranslation();
  const tx = (ar: string, fr: string, en?: string) => (locale === 'ar' ? ar : locale === 'fr' ? fr : en ?? fr);
  return { tx, locale, isRtl: locale === 'ar' };
}

export const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current';

export const PageHead: React.FC<{ title: string; sub?: string; action?: React.ReactNode }> = ({ title, sub, action }) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0 flex-1">
      <h1 className="font-display-h text-[30px] leading-[1.2] tracking-tight sm:text-[40px]">{title}</h1>
      {sub ? <p className="mt-2 max-w-2xl text-[15px] text-sheet-muted">{sub}</p> : null}
    </div>
    {action}
  </div>
);

export const SectionHead: React.FC<{ title: string; href?: string; linkLabel?: string }> = ({ title, href, linkLabel }) => (
  <div className="flex items-center justify-between gap-3">
    <h2 className="text-[20px] font-semibold">{title}</h2>
    {href && linkLabel ? (
      <Link href={href} className={`inline-flex min-h-[44px] items-center text-[14px] font-medium underline underline-offset-4 ${focus}`}>{linkLabel}</Link>
    ) : null}
  </div>
);

/** Soft card on the sheet. */
export const Panel: React.FC<{ children: React.ReactNode; className?: string; as?: 'div' | 'section' | 'li' | 'article' }> = ({ children, className = '', as: As = 'div' }) => (
  <As className={`rounded-[24px] bg-sheet-card p-5 text-sheet-text sm:p-6 ${className}`}>{children}</As>
);

/** Outlined card used for forms, so fields (which sit on --sheet-card) stay visible. */
export const FormPanel: React.FC<{ children: React.ReactNode; title?: string; className?: string }> = ({ children, title, className = '' }) => (
  <section className={`rounded-[24px] border border-sheet-line p-5 sm:p-6 ${className}`}>
    {title ? <h2 className="mb-5 text-[20px] font-semibold">{title}</h2> : null}
    {children}
  </section>
);

type BtnProps = {
  variant?: 'primary' | 'secondary' | 'text';
  tone?: 'sheet' | 'strip';
  href?: string;
  full?: boolean;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'>;

export const Btn: React.FC<BtnProps> = ({ variant = 'primary', tone = 'sheet', href, full, className = '', children, ...rest }) => {
  const base = `inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap text-[15px] font-semibold transition-[background-color,opacity] duration-200 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 ${focus} ${full ? 'w-full' : ''}`;
  const look =
    variant === 'primary'
      ? 'rounded-full bg-gold-500 px-6 text-[#050505] hover:bg-gold-400'
      : variant === 'secondary'
      ? `rounded-full border px-6 ${tone === 'strip' ? 'border-strip-text text-strip-text hover:bg-strip-tint' : 'border-sheet-text text-sheet-text hover:bg-sheet-text/10'}`
      : `px-2 underline underline-offset-4 ${tone === 'strip' ? 'text-strip-text' : 'text-sheet-text'}`;
  const cls = `${base} ${look} ${className}`;
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button type="button" className={cls} {...rest}>{children}</button>;
};

export const Tabs: React.FC<{ items: { id: string; label: string }[]; value: string; onChange: (id: string) => void; label: string }> = ({ items, value, onChange, label }) => (
  <div role="tablist" aria-label={label} className="flex flex-wrap gap-x-6 gap-y-1">
    {items.map((it) => {
      const on = it.id === value;
      return (
        <button
          key={it.id}
          role="tab"
          type="button"
          aria-selected={on}
          onClick={() => onChange(it.id)}
          className={`relative min-h-[44px] text-[15px] transition-colors motion-reduce:transition-none ${on ? 'font-semibold text-sheet-text' : 'font-medium text-sheet-muted hover:text-sheet-text'} ${focus}`}
        >
          {it.label}
          {on ? <span aria-hidden="true" className="absolute inset-x-0 bottom-1 h-0.5 rounded-full bg-sheet-text" /> : null}
        </button>
      );
    })}
  </div>
);

export type StatusKind = 'ok' | 'pending' | 'locked' | 'danger';
export const Status: React.FC<{ kind: StatusKind; children: React.ReactNode }> = ({ kind, children }) => {
  const Icon = kind === 'ok' ? CheckCircle : kind === 'pending' ? Clock : kind === 'locked' ? Lock : WarningCircle;
  const color = kind === 'danger' ? 'text-[#c0392b]' : 'text-sheet-muted';
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${color}`}>
      <Icon size={16} aria-hidden="true" />
      {children}
    </span>
  );
};

/** A small neutral tag. */
export const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center rounded-full bg-sheet-line px-2.5 py-0.5 text-[12px] font-medium text-sheet-muted">{children}</span>
);

export const fieldClass =
  `min-h-[48px] w-full rounded-[14px] border border-transparent bg-sheet-card px-4 text-[15px] text-sheet-text placeholder:text-sheet-muted focus:border-sheet-text ${focus}`;

export const Field: React.FC<{ label: string; hint?: string; htmlFor: string; children: React.ReactNode; className?: string }> = ({ label, hint, htmlFor, children, className = '' }) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    <label htmlFor={htmlFor} className="text-[14px] font-semibold">{label}</label>
    {children}
    {hint ? <p className="text-[13px] text-sheet-muted">{hint}</p> : null}
  </div>
);

export const SearchInput: React.FC<{ id: string; label: string; value: string; onChange: (v: string) => void; placeholder: string; className?: string }> = ({ id, label, value, onChange, placeholder, className = '' }) => (
  <Field label={label} htmlFor={id} className={className}>
    <div className="relative">
      <MagnifyingGlass size={20} aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-sheet-muted" />
      <input id={id} type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${fieldClass} ps-12`} />
    </div>
  </Field>
);

export const SelectInput: React.FC<{ id: string; label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string; disabled?: boolean }> = ({ id, label, value, onChange, options, className = '', disabled }) => (
  <Field label={label} htmlFor={id} className={className}>
    <div className="relative">
      <select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={`${fieldClass} appearance-none pe-11`}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <CaretDown size={18} aria-hidden="true" className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-sheet-muted" />
    </div>
  </Field>
);

export const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void; label: string }> = ({ on, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={() => onChange(!on)}
    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors motion-reduce:transition-none ${on ? 'bg-sheet-text' : 'bg-sheet-line'} ${focus}`}
  >
    <span aria-hidden="true" className={`absolute top-1 h-5 w-5 rounded-full transition-[inset-inline-start] motion-reduce:transition-none ${on ? 'start-6 bg-sheet' : 'start-1 bg-sheet-muted'}`} />
  </button>
);

/** Labelled empty state. Real data only: when there is nothing, say so and offer the next step. */
export const Empty: React.FC<{ title: string; body?: string; action?: React.ReactNode }> = ({ title, body, action }) => (
  <Panel className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="text-[16px] font-semibold">{title}</p>
      {body ? <p className="mt-1 text-[14px] text-sheet-muted">{body}</p> : null}
    </div>
    {action}
  </Panel>
);

export const SkeletonRows: React.FC<{ n?: number }> = ({ n = 3 }) => (
  <div className="flex flex-col gap-3" aria-hidden="true">
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} className="flex h-[68px] items-center gap-4 rounded-[18px] bg-sheet-card px-5">
        <div className="h-8 w-8 rounded-full bg-sheet-line" />
        <div className="h-3 flex-1 rounded-full bg-sheet-line" />
        <div className="h-2.5 w-16 rounded-full bg-sheet-line" />
      </div>
    ))}
  </div>
);

/** Round avatar: the photo when there is one, otherwise the first letter. */
export const Avatar: React.FC<{ name?: string; src?: string; size?: number }> = ({ name = '', src, size = 44 }) => (
  <span
    className="inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-sheet-line text-[15px] font-semibold text-sheet-muted"
    style={{ width: size, height: size }}
    aria-hidden="true"
  >
    {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : name.trim().slice(0, 1)}
  </span>
);

export const dateFmt = (iso: string, locale: string, o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) =>
  new Date(iso).toLocaleString(locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-DZ' : 'en-GB', { hourCycle: 'h23', ...o });

/** Modal on the native <dialog>: focus is trapped and Escape closes it for free. */
export const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ open, onClose, title, children }) => {
  const ref = React.useRef<HTMLDialogElement>(null);
  React.useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className="m-auto w-[min(560px,calc(100vw-32px))] rounded-[28px] border border-sheet-line bg-sheet p-0 text-sheet-text backdrop:bg-black/60"
    >
      {open ? (
        <div className="p-6 sm:p-8">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 className="text-[22px] font-semibold leading-snug">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className={`grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-sheet-line ${focus}`}>
              <span aria-hidden="true" className="text-[22px] leading-none">×</span>
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
};

/** Labelled single-line text input. */
export const TextInput: React.FC<{ id: string; label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; dir?: 'ltr' | 'rtl'; autoComplete?: string; hint?: string; required?: boolean; min?: number; className?: string }> = ({ id, label, value, onChange, type = 'text', placeholder, dir, autoComplete, hint, required, min, className }) => (
  <Field label={label} htmlFor={id} hint={hint} className={className}>
    <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} dir={dir} autoComplete={autoComplete} required={required} min={min} className={fieldClass} />
  </Field>
);
