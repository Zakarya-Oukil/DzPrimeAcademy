'use client';

import React from 'react';
import Image from 'next/image';
import { CheckCircle } from '@phosphor-icons/react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthModal } from '@/lib/authModalContext';
import { formatDZD } from '@/lib/format';
import { copyFor } from './copy';
import { Container, CtaButton, SrOnly, displayClass } from './ui';

const CardTile: React.FC<{ logo: string; label: string; gold?: boolean }> = ({ logo, label, gold }) => (
  <div className="flex flex-col items-center gap-2">
    <div className={`grid h-[108px] w-[172px] place-items-center rounded-2xl bg-navy-700 sm:h-[138px] sm:w-[220px] ${gold ? 'border-2 border-gold-700' : 'border border-[#909090]'}`}>
      <Image src={logo} alt="" width={64} height={64} className="h-14 w-14 object-contain sm:h-16 sm:w-16" />
    </div>
    <span className="text-[14px] font-medium text-muted">{label}</span>
  </div>
);

/** Free vs VIP comparison. The price is read from the admin setting (vipPriceDzd); no period is invented. */
export const Pricing: React.FC<{ vipPriceDzd: number | null }> = ({ vipPriceDzd }) => {
  const { locale } = useTranslation();
  const c = copyFor(locale).pricing;
  const { openAuth } = useAuthModal();
  const price = vipPriceDzd ? formatDZD(vipPriceDzd, locale) : null;

  const vipHead = (
    <>
      <h3 className={`${displayClass} text-[24px] leading-tight`}>{c.vipTitle}</h3>
      {price && <p className="mt-4 text-[40px] font-semibold leading-none">{price}</p>}
      <p className="mt-2 text-[14px] text-[#b0b0b0]">{c.priceNote}</p>
      <CtaButton onClick={() => openAuth('register')} className="mt-6 w-full">{c.vipCta}</CtaButton>
    </>
  );

  return (
    <section aria-labelledby="pricing-title">
      <Container className="flex flex-col gap-10 md:gap-12">
        <div className="flex flex-col gap-3">
          <h2 id="pricing-title" className={`${displayClass} text-[clamp(1.875rem,4vw,2.5rem)] leading-tight`}>{c.title}</h2>
          <p className="max-w-[52ch] text-[18px] text-muted">{c.sub}</p>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-12">
          <div className="flex max-w-[52ch] flex-col gap-2">
            <h3 className={`${displayClass} text-[24px] leading-tight`}>{c.cardTitle}</h3>
            <p className="text-[16px] leading-relaxed text-muted">{c.cardBody}</p>
          </div>
          <div className="flex gap-3 sm:gap-5">
            <CardTile logo="/images/dzprime-logo-blue.png" label={c.cardStd} />
            <CardTile logo="/images/dzprime-logo-amber.png" label={c.cardGold} gold />
          </div>
        </div>

        {/* Desktop: one comparison table. The VIP column is a tall navy panel at the end side. */}
        <table className="hidden w-full border-separate border-spacing-0 text-start md:table">
          <caption className="sr-only">{c.title}</caption>
          <thead>
            <tr>
              <th scope="col" className="w-auto align-bottom p-8 text-start text-[14px] font-medium text-muted">{c.whatYouGet}</th>
              <th scope="col" className="w-[300px] p-8 text-start align-top">
                <h3 className={`${displayClass} text-[24px] leading-tight`}>{c.freeTitle}</h3>
                <p className="mt-3 text-[15px] text-muted">{c.freeSub}</p>
                <button type="button" onClick={() => openAuth('register')} className="mt-3 inline-flex min-h-[44px] items-center text-[15px] font-semibold underline underline-offset-[5px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">{c.freeCta}</button>
              </th>
              <th scope="col" className="w-[340px] bg-navy-700 p-8 text-start align-top text-[#f2f2f0] ltr:rounded-tr-[32px] rtl:rounded-tl-[32px]">{vipHead}</th>
            </tr>
          </thead>
          <tbody>
            {c.rows.map((r, i) => {
              const last = i === c.rows.length - 1;
              const stripe = i % 2 === 0 ? 'bg-strip' : '';
              return (
                <tr key={r.label}>
                  <th scope="row" className={`p-7 text-start text-[18px] font-semibold ${stripe} ${i % 2 === 0 ? 'text-strip-text' : ''}`}>{r.label}</th>
                  <td className={`p-7 text-[15px] ${stripe} ${i % 2 === 0 ? 'text-strip-text' : 'text-muted'}`}>{r.free || (<><span aria-hidden="true">-</span><SrOnly>{c.notIncluded}</SrOnly></>)}</td>
                  <td className={`bg-navy-700 p-7 text-[16px] font-medium text-[#f2f2f0] ${last ? 'ltr:rounded-br-[32px] rtl:rounded-bl-[32px]' : ''}`}>
                    <span className="inline-flex items-center gap-2.5"><CheckCircle size={22} aria-hidden="true" />{r.vip}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Mobile: two stacked panels */}
        <div className="flex flex-col gap-5 md:hidden">
          <div className="rounded-[28px] bg-navy-700 p-6 text-[#f2f2f0]">
            {vipHead}
            <ul className="mt-6 flex flex-col gap-4">
              {c.rows.map((r) => (
                <li key={r.label} className="flex items-start gap-3">
                  <CheckCircle size={22} aria-hidden="true" className="mt-0.5 shrink-0" />
                  <span className="flex flex-col"><span className="text-[16px] font-semibold">{r.label}</span><span className="text-[14px] text-[#b0b0b0]">{r.vip}</span></span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[28px] bg-strip p-6 text-strip-text">
            <h3 className={`${displayClass} text-[24px] leading-tight`}>{c.freeTitle}</h3>
            <p className="mt-2 text-[15px] text-strip-muted">{c.freeSub}</p>
            <ul className="mt-5 flex flex-col gap-3">
              {c.rows.map((r) => (
                <li key={r.label} className="flex flex-col">
                  <span className="text-[16px] font-semibold">{r.label}</span>
                  <span className="text-[14px] text-strip-muted">{r.free || c.notIncluded}</span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => openAuth('register')} className="mt-5 min-h-[44px] text-[15px] font-semibold underline underline-offset-[5px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">{c.freeCta}</button>
          </div>
        </div>

        <p className="max-w-[60ch] text-[15px] text-muted">{c.note}</p>
      </Container>
    </section>
  );
};
