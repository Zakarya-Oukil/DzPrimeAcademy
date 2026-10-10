'use client';

import React from 'react';
import Link from 'next/link';
import { Star } from '@phosphor-icons/react';

/** Shared building blocks of the redesigned landing. Tokens come from the CSS variables in globals.css (Figma pages 10 to 24). */

export const Container: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`mx-auto w-full max-w-[1344px] px-4 sm:px-8 xl:px-12 ${className}`}>{children}</div>
);

/** A rounded panel: platinum on the black page in dark mode, near-black on the light page in light mode. */
export const Sheet: React.FC<{ children: React.ReactNode; labelledBy?: string; className?: string; id?: string }> = ({ children, labelledBy, className = '', id }) => (
  <section id={id} aria-labelledby={labelledBy} className={`rounded-[32px] bg-sheet text-sheet-text md:rounded-[48px] ${className}`}>
    {children}
  </section>
);

/** Display headings: Reem Kufi (bold) for Arabic, Marcellus (regular) for Latin. */
export const displayClass = 'font-display-h tracking-tight';

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current';

/** The one gold call to action. Fully round to match the pill header. */
export const ctaClass =
  `inline-flex min-h-[48px] items-center justify-center whitespace-nowrap rounded-full bg-gold-500 px-7 py-3 text-[15px] font-semibold text-[#050505] transition-[background-color,transform] duration-200 ease-out hover:bg-gold-400 active:translate-y-px motion-reduce:transition-none ${focus}`;

export const CtaButton: React.FC<{ onClick?: () => void; href?: string; children: React.ReactNode; className?: string }> = ({ onClick, href, children, className = '' }) =>
  href ? (
    <Link href={href} className={`${ctaClass} ${className}`}>{children}</Link>
  ) : (
    <button type="button" onClick={onClick} className={`${ctaClass} ${className}`}>{children}</button>
  );

export const TextLink: React.FC<{ href: string; children: React.ReactNode; className?: string }> = ({ href, children, className = '' }) => (
  <Link href={href} className={`inline-flex min-h-[44px] items-center text-[15px] font-semibold underline decoration-1 underline-offset-[5px] hover:decoration-2 ${focus} ${className}`}>
    {children}
  </Link>
);

/** Five outline stars; `value` fills them. Decorative: pass the numeric rating as visible or sr-only text. */
export const Stars: React.FC<{ value?: number; size?: number; className?: string }> = ({ value = 0, size = 16, className = '' }) => (
  <span className={`inline-flex items-center gap-0.5 ${className}`} aria-hidden="true">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} size={size} weight={value >= i - 0.25 ? 'fill' : 'regular'} />
    ))}
  </span>
);

export const SrOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="sr-only">{children}</span>;
