'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, MagnifyingGlass } from '@phosphor-icons/react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { telegramUrl, useContactSettings, whatsappUrl } from '@/lib/contactLinks';
import { copyFor } from './copy';
import { Container, displayClass } from './ui';

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current';

interface Entry { key: string; topic: number; q: string; a: string; steps?: string[] }

/**
 * Two-column FAQ: topic filters, a search field, a question list and one open answer.
 * Questions are a vertical tablist (arrow keys), the answer is its tabpanel, each question has a #faq-t-i link,
 * and the same data feeds FAQPage structured data.
 */
export const Faq: React.FC = () => {
  const { locale, isRtl } = useTranslation();
  const c = copyFor(locale).faq;
  const contacts = useContactSettings();
  const uid = useId();
  const [topic, setTopic] = useState(0);
  const [selected, setSelected] = useState('0-0');
  const [query, setQuery] = useState('');
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const all: Entry[] = useMemo(
    () => c.topics.flatMap((t, ti) => t.items.map((it, ii) => ({ key: `${ti}-${ii}`, topic: ti, q: it.q, a: it.a, steps: it.steps }))),
    [c.topics]
  );

  const q = query.trim().toLowerCase();
  const list = q ? all.filter((e) => e.q.toLowerCase().includes(q) || e.a.toLowerCase().includes(q)) : all.filter((e) => e.topic === topic);
  const current = list.find((e) => e.key === selected) || list[0];
  const idx = current ? list.indexOf(current) : -1;
  const next = idx >= 0 ? list[idx + 1] : undefined;

  // Deep link: #faq-<topic>-<index>
  useEffect(() => {
    const m = window.location.hash.match(/^#faq-(\d+)-(\d+)$/);
    if (m && all.some((e) => e.key === `${m[1]}-${m[2]}`)) {
      setTopic(Number(m[1]));
      setSelected(`${m[1]}-${m[2]}`);
    }
  }, [all]);

  const choose = (e: Entry, focusTab = false) => {
    setSelected(e.key);
    window.history.replaceState(null, '', `#faq-${e.key}`);
    if (focusTab) tabRefs.current[e.key]?.focus();
  };
  const onKey = (ev: React.KeyboardEvent, i: number) => {
    if (ev.key === 'ArrowDown' && list[i + 1]) { ev.preventDefault(); choose(list[i + 1], true); }
    if (ev.key === 'ArrowUp' && list[i - 1]) { ev.preventDefault(); choose(list[i - 1], true); }
    if (ev.key === 'Home') { ev.preventDefault(); choose(list[0], true); }
    if (ev.key === 'End') { ev.preventDefault(); choose(list[list.length - 1], true); }
  };

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: all.map((e) => ({ '@type': 'Question', name: e.q, acceptedAnswer: { '@type': 'Answer', text: e.a } })),
    }),
    [all]
  );

  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const contactLinks = (
    <div className="flex flex-col gap-1.5">
      <p className="text-[15px] text-sheet-muted">{c.contactLead}</p>
      <p className="flex gap-5">
        <a href={whatsappUrl(contacts.whatsappNumber)} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-[44px] items-center text-[15px] font-semibold underline underline-offset-[5px] ${focus}`}>{c.whatsapp}</a>
        <a href={telegramUrl(contacts.telegramUsername)} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-[44px] items-center text-[15px] font-semibold underline underline-offset-[5px] ${focus}`}>{c.telegram}</a>
      </p>
    </div>
  );

  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Container className="flex flex-col gap-8 md:gap-10">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <h2 id="faq-title" className={`${displayClass} text-[clamp(1.875rem,4vw,2.5rem)] leading-tight`}>{c.title}</h2>
          <form role="search" onSubmit={(e) => e.preventDefault()} className="flex w-full items-center gap-3 rounded-2xl bg-strip px-4 text-strip-text sm:w-[420px]">
            <label htmlFor={`${uid}-q`} className="sr-only">{c.search}</label>
            <MagnifyingGlass size={20} aria-hidden="true" className="shrink-0 text-strip-muted" />
            <input
              id={`${uid}-q`}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={c.search}
              className="min-h-[48px] w-full bg-transparent text-[15px] placeholder:text-strip-muted focus-visible:outline-none"
            />
          </form>
        </div>

        {!q && (
          <div role="group" aria-label={c.title} className="flex flex-wrap gap-x-7 gap-y-1">
            {c.topics.map((t, i) => (
              <button
                key={t.t}
                type="button"
                aria-pressed={topic === i}
                onClick={() => { setTopic(i); setSelected(`${i}-0`); }}
                className={`relative inline-flex min-h-[44px] items-center gap-1.5 text-[16px] ${topic === i ? 'font-semibold' : 'font-medium text-muted hover:text-foreground'} ${focus}`}
              >
                {t.t}
                <span className="text-[13px] text-muted">({t.items.length})</span>
                {topic === i && <span aria-hidden="true" className="absolute bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-foreground" />}
              </button>
            ))}
          </div>
        )}

        {list.length === 0 ? (
          <div role="status" className="rounded-[28px] bg-sheet p-8 text-sheet-text md:p-14">
            <p className={`${displayClass} text-[28px]`}>{c.noResults}</p>
            <p className="mt-3 text-[17px] text-sheet-muted">{c.noResultsHint}</p>
            <div className="mt-6">{contactLinks}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-12">
            <div role="tablist" aria-orientation="vertical" aria-label={c.title} className="flex flex-col gap-1.5">
              {list.map((e, i) => {
                const active = e.key === current?.key;
                return (
                  <button
                    key={e.key}
                    ref={(el) => { tabRefs.current[e.key] = el; }}
                    id={`${uid}-tab-${e.key}`}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    aria-controls={`${uid}-panel`}
                    tabIndex={active ? 0 : -1}
                    onClick={() => choose(e)}
                    onKeyDown={(ev) => onKey(ev, i)}
                    className={`min-h-[56px] rounded-[20px] px-5 py-3.5 text-start text-[17px] leading-snug transition-colors duration-200 motion-reduce:transition-none ${active ? 'bg-sheet font-semibold text-sheet-text' : 'font-medium text-muted hover:text-foreground'} ${focus}`}
                  >
                    {e.q}
                  </button>
                );
              })}
            </div>

            {current && (
              <div
                id={`${uid}-panel`}
                role="tabpanel"
                aria-labelledby={`${uid}-tab-${current.key}`}
                tabIndex={0}
                className={`flex min-h-[320px] flex-col gap-7 rounded-[28px] bg-sheet p-7 text-sheet-text md:rounded-[32px] md:p-12 ${focus}`}
              >
                <h3 className={`${displayClass} text-[clamp(1.5rem,3vw,2.25rem)] leading-snug`}>{current.q}</h3>
                <p className="max-w-[60ch] text-[19px] leading-relaxed text-sheet-muted">{current.a}</p>
                {current.steps && (
                  <ol className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
                    {current.steps.map((s, i) => (
                      <React.Fragment key={s}>
                        <li className="flex-1 rounded-[20px] bg-sheet-card px-5 py-4 text-[15px] font-medium">{s}</li>
                        {i < current.steps!.length - 1 && <Arrow size={20} aria-hidden="true" className="hidden shrink-0 text-sheet-muted md:block" />}
                      </React.Fragment>
                    ))}
                  </ol>
                )}
                <div className="mt-auto flex flex-wrap items-end justify-between gap-6 pt-4">
                  {contactLinks}
                  {next && (
                    <button type="button" onClick={() => choose(next, true)} className={`inline-flex min-h-[44px] items-center gap-2 text-[15px] font-semibold ${focus}`}>
                      <Arrow size={20} aria-hidden="true" />
                      {c.next}: {next.q}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Container>
    </section>
  );
};
