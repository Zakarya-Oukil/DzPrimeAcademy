'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { EnvelopeSimple, MapPin, Phone } from '@phosphor-icons/react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthModal } from '@/lib/authModalContext';
import { DEFAULT_FOOTER_CONFIG, type FooterConfig } from '@/lib/footerConfig';
import { copyFor } from './copy';
import { Container, CtaButton, TextLink, displayClass } from './ui';
import { LanguageLinks, ThemeSegment } from './PillHeader';

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current';

/** One quiet line above the final call to action; the full ambassador network lives on its own page. */
export const AmbassadorsLine: React.FC = () => {
  const { locale } = useTranslation();
  const c = copyFor(locale).cta;
  return (
    <p className="-mt-4 flex flex-wrap items-center justify-center gap-x-3 px-4 text-center text-[16px] text-muted md:-mt-8">
      <TextLink href={`/${locale}/ambassadors`}>{c.ambassadorsLink}</TextLink>
      <span>{c.ambassadorsText}</span>
    </p>
  );
};

/** The single closing call to action: one gold button and one quiet link. */
export const FinalCta: React.FC = () => {
  const { locale } = useTranslation();
  const c = copyFor(locale).cta;
  const { openAuth } = useAuthModal();
  return (
    <section aria-labelledby="final-cta-title">
      <Container>
        <div className="flex flex-col gap-8 rounded-[32px] bg-sheet p-8 text-sheet-text md:flex-row md:items-center md:justify-between md:gap-12 md:rounded-[48px] md:p-16">
          <div className="flex flex-col gap-3">
            <h2 id="final-cta-title" className={`${displayClass} text-[clamp(1.875rem,4.2vw,3rem)] leading-tight`}>{c.title}</h2>
            <p className="max-w-[44ch] text-[18px] text-sheet-muted">{c.sub}</p>
          </div>
          <div className="flex flex-col gap-2 md:items-center">
            <CtaButton onClick={() => openAuth('register')} className="w-full px-10 py-4 text-[17px] md:w-auto">{c.button}</CtaButton>
            <TextLink href={`/${locale}/dawarat`}>{c.link}</TextLink>
          </div>
        </div>
      </Container>
    </section>
  );
};

const ExternalLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-[40px] items-center text-[15px] font-semibold underline underline-offset-[5px] ${focus}`}>{children}</a>
);

/** Footer. Brand text, social links and contact details come from the admin Footer settings. */
export const SiteFooter: React.FC = () => {
  const { locale } = useTranslation();
  const c = copyFor(locale);
  const f = c.footer;
  const { openAuth } = useAuthModal();
  const [cfg, setCfg] = useState<FooterConfig>(DEFAULT_FOOTER_CONFIG);

  useEffect(() => {
    const load = () =>
      fetch('/api/settings/footer')
        .then((r) => r.json())
        .then((d) => d && typeof d === 'object' && d.brandBio && setCfg(d))
        .catch(() => {});
    load();
    const onUpdate = (e: Event) => ((e as CustomEvent).detail ? setCfg((e as CustomEvent).detail) : load());
    window.addEventListener('dzprime-footer-updated', onUpdate);
    return () => window.removeEventListener('dzprime-footer-updated', onUpdate);
  }, []);

  const ar = locale === 'ar';
  const bio = ar ? cfg.brandBio.descriptionAr : cfg.brandBio.descriptionFr;
  const address = ar ? cfg.contactInfo.addressAr : cfg.contactInfo.addressFr;
  const copyright = (ar ? cfg.bottomBar.copyrightAr : cfg.bottomBar.copyrightFr) || f.rights;
  const slogan = ar ? cfg.bottomBar.sloganAr : cfg.bottomBar.sloganFr;
  const socials = cfg.socialLinks.filter((s) => s.enabled && s.url);

  const colHead = 'text-[15px] font-semibold text-strip-text';
  const colLink = `inline-flex min-h-[40px] items-center text-[15px] text-strip-muted transition-colors duration-200 hover:text-strip-text motion-reduce:transition-none ${focus}`;

  return (
    <footer className="rounded-t-[36px] bg-strip text-strip-text md:rounded-t-[48px]" data-testid="landing-footer">
      <Container className="flex flex-col gap-10 pb-8 pt-12 md:gap-14 md:pt-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-20">
          <div className="flex flex-col gap-5">
            <Link href={`/${locale}`} aria-label={c.nav.home} className={`flex w-fit items-center gap-3 ${focus}`}>
              <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-[#9a6b1e] bg-[#050505]">
                <Image src="/images/dzprime-logo-amber.png" alt="" width={38} height={38} className="h-[38px] w-[38px] object-contain" />
              </span>
              <span className="text-[17px] font-semibold">DZ Prime Academy</span>
            </Link>
            {bio && <p className="max-w-[44ch] text-[15px] leading-relaxed text-strip-muted">{bio}</p>}
            {socials.length > 0 && (
              <ul className="flex flex-wrap gap-x-5">
                {socials.map((s) => (
                  <li key={s.id}><ExternalLink href={s.url}>{s.title}</ExternalLink></li>
                ))}
              </ul>
            )}
            <ul className="flex flex-col gap-1.5 text-[15px] text-strip-muted">
              {cfg.contactInfo.email && <li className="flex items-center gap-2"><EnvelopeSimple size={18} aria-hidden="true" /><a href={`mailto:${cfg.contactInfo.email}`} className={`${focus} hover:text-strip-text`}>{cfg.contactInfo.email}</a></li>}
              {cfg.contactInfo.phone && <li className="flex items-center gap-2"><Phone size={18} aria-hidden="true" /><a href={`tel:${cfg.contactInfo.phone.replace(/\s+/g, '')}`} dir="ltr" className={`${focus} hover:text-strip-text`}>{cfg.contactInfo.phone}</a></li>}
              {address && <li className="flex items-center gap-2"><MapPin size={18} aria-hidden="true" /><span>{address}</span></li>}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:max-w-[520px]">
            <nav aria-label={f.account} className="flex flex-col">
              <p className={colHead}>{f.account}</p>
              <button type="button" onClick={() => openAuth('login')} className={`${colLink} text-start`}>{c.nav.login}</button>
              <button type="button" onClick={() => openAuth('register')} className={`${colLink} text-start`}>{c.nav.signup}</button>
              <Link href={`/${locale}/activate`} className={colLink}>{f.activate}</Link>
            </nav>
            <nav aria-label={f.platform} className="flex flex-col">
              <p className={colHead}>{f.platform}</p>
              <Link href={`/${locale}/dawarat`} className={colLink}>{c.nav.courses}</Link>
              <Link href={`/${locale}/exams`} className={colLink}>{c.nav.exams}</Link>
              <Link href={`/${locale}/community`} className={colLink}>{c.nav.community}</Link>
              <Link href={`/${locale}/ambassadors`} className={colLink}>{c.nav.ambassadors}</Link>
            </nav>
          </div>
        </div>

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-0.5 text-[14px] text-strip-muted">
            <span>{copyright}</span>
            {slogan && <span>{slogan}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <ThemeSegment tone="strip" />
            <LanguageLinks tone="strip" />
          </div>
        </div>
      </Container>
    </footer>
  );
};
