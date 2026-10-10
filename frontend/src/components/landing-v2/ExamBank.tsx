'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, FileText, LockSimple, MagnifyingGlass } from '@phosphor-icons/react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { copyFor } from './copy';
import { Container, Sheet, TextLink, displayClass } from './ui';
import type { LandingExam } from './LandingV2';

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current';

/** A faithful preview of the real exam hub: search, tracks, session type and the first real papers. */
export const ExamBank: React.FC<{ exams: LandingExam[] }> = ({ exams }) => {
  const { locale } = useTranslation();
  const c = copyFor(locale).exam;
  const router = useRouter();
  const [q, setQ] = useState('');
  const examsHref = `/${locale}/exams`;
  const rows = exams.slice(0, 3);

  return (
    <Sheet labelledBy="exam-title" className="py-12 md:py-20">
      <Container>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div className="flex flex-col items-start gap-6">
            <h2 id="exam-title" className={`${displayClass} text-[clamp(1.875rem,4vw,2.5rem)] leading-tight`}>{c.title}</h2>
            <p className="max-w-[46ch] text-[18px] leading-relaxed text-sheet-muted">{c.lead}</p>
            <ul className="flex flex-col gap-5">
              {c.points.map((p) => (
                <li key={p.t}>
                  <p className="text-[19px] font-semibold">{p.t}</p>
                  <p className="mt-1 max-w-[46ch] text-[16px] leading-relaxed text-sheet-muted">{p.d}</p>
                </li>
              ))}
            </ul>
            <TextLink href={examsHref}>{c.link}</TextLink>
          </div>

          <div className="flex flex-col gap-4 rounded-[28px] bg-sheet-card p-4 sm:p-7">
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                router.push(q.trim() ? `${examsHref}?q=${encodeURIComponent(q.trim())}` : examsHref);
              }}
              className="flex items-center gap-3 rounded-[14px] bg-sheet px-4"
            >
              <label htmlFor="landing-exam-search" className="sr-only">{c.searchLabel}</label>
              <MagnifyingGlass size={20} aria-hidden="true" className="shrink-0 text-sheet-muted" />
              <input
                id="landing-exam-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={c.search}
                className="min-h-[48px] w-full bg-transparent text-[15px] text-sheet-text placeholder:text-sheet-muted focus-visible:outline-none"
              />
            </form>

            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {c.tracks.map((t, i) => (
                <Link key={t} href={examsHref} aria-current={i === 0 ? 'true' : undefined} className={`relative inline-flex min-h-[40px] items-center text-[15px] ${i === 0 ? 'font-semibold' : 'font-medium text-sheet-muted hover:text-sheet-text'} ${focus}`}>
                  {t}
                  {i === 0 && <span aria-hidden="true" className="absolute bottom-0.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-sheet-text" />}
                </Link>
              ))}
            </div>

            <div className="inline-flex flex-wrap gap-0.5 self-start rounded-[10px] bg-sheet p-[3px]">
              {c.types.map((t, i) => (
                <Link key={t} href={examsHref} className={`inline-flex min-h-[36px] items-center rounded-[8px] px-3.5 text-[14px] font-medium ${i === 0 ? 'bg-sheet-text text-sheet' : 'text-sheet-muted hover:text-sheet-text'} ${focus}`}>
                  {t}
                </Link>
              ))}
            </div>

            {rows.length === 0 ? (
              <p className="rounded-[18px] bg-sheet px-5 py-8 text-center text-[15px] text-sheet-muted">{c.empty}</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {rows.map((e) => {
                  const solved = !e.isLocked && !!e.solutionUrl;
                  const meta = [e.moduleName, e.institutionName, e.year].filter(Boolean).join('، ');
                  return (
                    <li key={e.id}>
                      <Link href={examsHref} className={`flex items-center justify-between gap-4 rounded-[18px] bg-sheet p-4 transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--sheet-line)_45%,var(--sheet))] motion-reduce:transition-none sm:p-[18px] ${focus}`}>
                        <span className="flex min-w-0 flex-col gap-1.5">
                          <span className="truncate text-[17px] font-semibold">{e.title}</span>
                          {meta && <span className="truncate text-[13px] text-sheet-muted">{meta}</span>}
                          {(solved || e.isLocked) && (
                            <span className="inline-flex items-center gap-1.5 text-[13px]">
                              {solved ? <CheckCircle size={16} aria-hidden="true" /> : <LockSimple size={16} aria-hidden="true" />}
                              {solved ? c.solved : c.vipSolution}
                            </span>
                          )}
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1 text-[14px]">
                          <span className="inline-flex items-center gap-1.5 font-semibold"><FileText size={18} aria-hidden="true" />{c.download}</span>
                          <span className="text-sheet-muted underline underline-offset-4">{c.preview}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </Container>
    </Sheet>
  );
};
