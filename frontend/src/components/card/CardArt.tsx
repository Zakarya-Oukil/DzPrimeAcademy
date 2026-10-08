'use client';

import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { ShieldCheck, User as UserIcon } from 'lucide-react';
import { MembershipCardData } from '@/types';

/**
 * Membership card artwork, built from the Figma "Membership Cards" board (CR80, 856 x 540 at 10 px/mm).
 * Everything is drawn on a fixed 856 x 540 canvas with inline vector paths, so html-to-image exports it sharply.
 * <ScaledCard> shrinks that canvas to whatever width its container has.
 */
export const CARD_W = 856;
export const CARD_H = 540;

export type CardTier = 'vip' | 'standard';

/** Free students carry the standard (platinum and sapphire) card; every other member carries the VIP (gold) card. */
export const cardTierFor = (role?: string | null): CardTier => (!role || role === 'STUDENT_FREE' ? 'standard' : 'vip');

const PAL = {
  vip: {
    accent: '#F2AA34',
    soft: '#F4BF61',
    ink: '#101010',
    logo: '/images/dzprime-logo-amber.png',
    outer: ['#F4D58A', '#F2AA34', '#9A6B1E'],
    tab: ['#F4D58A', '#F2AA34', '#9A6B1E'],
  },
  standard: {
    accent: '#D0D0D0',
    soft: '#FAFCF9',
    ink: '#101010',
    logo: '/images/dzprime-logo-blue.png',
    outer: ['#7DB9EE', '#0880F0', '#0662C0'],
    tab: ['#FAFCF9', '#D0D0D0', '#909090'],
  },
} as const;
const BAND = ['#FAFCF9', '#D0D0D0', '#909090'];
const GROUND = '#050505';
const WHITE = '#FAFCF9';

const SANS = 'var(--font-sans), system-ui, sans-serif';
const DISPLAY = 'var(--font-display), var(--font-sans), system-ui, sans-serif';
const DIGITS = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

// Fixed-seed speckle so server and client render the same dots.
const speckle = (n: number, w: number, h: number, seed: number) => {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, () => ({ x: rnd() * w, y: rnd() * h, r: 0.6 + rnd() * 1.1, o: 0.35 + rnd() * 0.5 }));
};
const DOTS_FRONT = speckle(70, 230, 450, 7).map((d) => ({ ...d, y: d.y + 20 }));
const DOTS_BACK = speckle(64, 200, 460, 11).map((d) => ({ ...d, y: d.y + 40 }));

const nameSize = (name: string, big: number) => {
  const n = name.length;
  return n <= 14 ? big : n <= 22 ? Math.round(big * 0.8) : n <= 34 ? Math.round(big * 0.64) : Math.round(big * 0.52);
};

const clamp = (lines: number): React.CSSProperties => ({
  display: '-webkit-box',
  WebkitLineClamp: lines,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

function Stops({ c }: { c: readonly string[] }) {
  return (
    <>
      <stop offset="0" stopColor={c[0]} />
      <stop offset="0.5" stopColor={c[1]} />
      <stop offset="1" stopColor={c[2]} />
    </>
  );
}

export interface CardCanvasProps {
  card: MembershipCardData;
  qrCodeDataUrl: string;
  side: 'front' | 'back';
  tier: CardTier;
  verifiedLabel: string;
  notVerifiedLabel: string;
  idLabel?: string;
  validLabel?: string;
  /** When set, the QR window links to the public profile. */
  profileHref?: string;
  profileNewTab?: boolean;
  qrTitle?: string;
}

/** The fixed 856 x 540 card face. Always wrap it in <ScaledCard> (screen) or render it 1:1 (export). */
export const CardCanvas: React.FC<CardCanvasProps> = ({
  card,
  qrCodeDataUrl,
  side,
  tier,
  verifiedLabel,
  notVerifiedLabel,
  idLabel = 'رقم البطاقة',
  validLabel = 'صالحة حتى',
  profileHref,
  profileNewTab = true,
  qrTitle,
}) => {
  const p = PAL[tier];
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gOuter = `o${uid}`;
  const gBand = `b${uid}`;
  const gTab = `t${uid}`;
  const roleText = card.jobTitle || card.roleTitleAr || '';
  const tabAr = tier === 'vip' ? 'عضو رسمي' : 'عضو';
  const tabEn = tier === 'vip' ? 'OFFICIAL MEMBER' : 'MEMBER';

  const defs = (
    <defs>
      <linearGradient id={gOuter} x1="1" y1="250" x2="707" y2="250" gradientUnits="userSpaceOnUse">
        <Stops c={p.outer} />
      </linearGradient>
      <linearGradient id={gBand} x1="1" y1="250" x2="797" y2="250" gradientUnits="userSpaceOnUse">
        <Stops c={BAND} />
      </linearGradient>
      <linearGradient id={gTab} x1="0.5" y1="52" x2="420" y2="52" gradientUnits="userSpaceOnUse">
        <Stops c={p.tab} />
      </linearGradient>
    </defs>
  );

  const frame = (
    <rect x="14" y="14" width="828" height="512" rx="28" fill="none" stroke={p.accent} strokeWidth="1.6" opacity="0.9" />
  );

  const base: React.CSSProperties = {
    width: CARD_W,
    height: CARD_H,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 35,
    background: GROUND,
    color: WHITE,
    fontFamily: SANS,
  };
  const abs = (style: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', ...style });

  if (side === 'front') {
    return (
      <div style={base} dir="rtl">
        <svg width={CARD_W} height={CARD_H} viewBox={`0 0 ${CARD_W} ${CARD_H}`} style={abs({ inset: 0 })} aria-hidden="true">
          {defs}
          {DOTS_FRONT.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={p.accent} opacity={d.o} />
          ))}
          <path
            transform="translate(148.7 -0.5)"
            d="M41.2854 0.5C171.285 100.5 201.285 270.5 351.285 365.5C461.285 440.5 591.285 470.5 707.285 480.5V500.5C571.285 490.5 431.285 465.5 321.285 390.5C151.285 270.5 121.285 110.5 1.2854 0.5H41.2854Z"
            fill={`url(#${gOuter})`}
            stroke={GROUND}
          />
          <path
            transform="translate(58.72 -0.5)"
            d="M91.2788 0.5C211.279 110.5 241.279 270.5 411.279 390.5C521.279 465.5 661.279 490.5 797.279 500.5C661.279 512.5 501.279 498.5 371.279 418.5C191.279 310.5 131.279 120.5 1.27883 0.5H91.2788Z"
            fill={`url(#${gBand})`}
            stroke={GROUND}
          />
          <path
            transform="translate(-0.4 298.55)"
            d="M0.386494 1.44935C150.386 41.4494 330.386 141.449 560.386 221.449"
            fill="none"
            stroke={p.accent}
            strokeWidth="3"
          />
          <path
            transform="translate(39.3 -0.29)"
            d="M0.692308 0.288462C50.6923 120.288 100.692 230.288 260.692 330.288C360.692 395.288 480.692 440.288 660.692 470.288"
            fill="none"
            stroke={p.accent}
            strokeWidth="1.5"
          />
          {frame}
          <path transform="translate(0 436)" d="M0.5 0.5H372.5L420.5 104.5H0.5V0.5Z" fill={`url(#${gTab})`} />
          <rect x="540.75" y="244.75" width="268.5" height="66.5" rx="20" fill="none" stroke={p.accent} strokeWidth="1.6" />
        </svg>

        <img src={p.logo} alt="DZ Prime Academy" style={abs({ left: 559, top: 4, width: 232, height: 232, objectFit: 'contain' })} />

        {/* Name plate */}
        <div
          style={abs({ left: 548, top: 246, width: 254, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' })}
        >
          <span
            style={{
              ...clamp(2),
              fontFamily: DISPLAY,
              fontWeight: 700,
              lineHeight: 1.25,
              fontSize: nameSize(card.holderName || '', 30),
              color: WHITE,
              wordBreak: 'break-word',
            }}
          >
            {card.holderName}
          </span>
        </div>

        {/* Role, card number, validity */}
        <div style={abs({ left: 548, top: 322, width: 254, textAlign: 'center' })}>
          <div style={{ ...clamp(2), fontSize: 18, lineHeight: 1.35, fontWeight: 600, color: p.soft, wordBreak: 'break-word' }}>{roleText}</div>
        </div>
        <div style={abs({ left: 580, top: 378, width: 230, display: 'grid', gap: 6 })}>
          {card.cardId ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 14, color: p.soft, opacity: 0.85 }}>{idLabel}</span>
              <span dir="ltr" style={{ fontFamily: DIGITS, fontSize: 17, fontWeight: 700, letterSpacing: 0.5, color: WHITE }}>
                {card.cardId}
              </span>
            </div>
          ) : null}
          {card.expiryDate ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 14, color: p.soft, opacity: 0.85 }}>{validLabel}</span>
              <span dir="ltr" style={{ fontSize: 17, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: WHITE }}>
                {card.expiryDate}
              </span>
            </div>
          ) : null}
        </div>

        {/* Tab */}
        <div style={abs({ left: 70, top: 448, color: p.ink, textAlign: 'left' })} dir="rtl">
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 46, lineHeight: 1.1 }}>{tabAr}</div>
          <div dir="ltr" style={{ fontWeight: 700, fontSize: 19, letterSpacing: 1.4, marginTop: 2 }}>{tabEn}</div>
        </div>
        <div style={abs({ left: 266, top: 456, width: 104, color: p.ink, fontSize: 13, fontWeight: 600, lineHeight: 1.3 })} dir="rtl">
          <ShieldCheck size={20} strokeWidth={2.2} />
          <div style={{ ...clamp(2), marginTop: 2 }}>{card.isVerified ? verifiedLabel : notVerifiedLabel}</div>
        </div>
      </div>
    );
  }

  const qr = qrCodeDataUrl ? (
    <img src={qrCodeDataUrl} alt="Card QR" style={{ width: 148, height: 148, borderRadius: 10, display: 'block' }} />
  ) : (
    <div style={{ width: 148, height: 148, borderRadius: 10, background: p.accent, opacity: 0.25 }} />
  );

  const circle = (left: number, icon: React.ReactNode) => (
    <div
      style={abs({ left, top: 380, width: 50, height: 50, borderRadius: 25, border: `1.6px solid ${p.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.accent })}
    >
      {icon}
    </div>
  );

  return (
    <div style={base} dir="rtl">
      <svg width={CARD_W} height={CARD_H} viewBox={`0 0 ${CARD_W} ${CARD_H}`} style={abs({ inset: 0 })} aria-hidden="true">
        {defs}
        {DOTS_BACK.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={p.accent} opacity={d.o} />
        ))}
        <path
          transform="translate(101.35 -0.5)"
          d="M168.686 0.5H228.686C38.6857 130.5 8.68568 360.5 143.686 540.5H83.6857C-51.3143 360.5 -21.3143 120.5 168.686 0.5Z"
          fill={`url(#${gOuter})`}
          stroke={GROUND}
        />
        <path
          transform="translate(18.78 -0.5)"
          d="M91.25 0.5H251.25C61.25 120.5 31.25 360.5 166.25 540.5H61.25C-28.75 400.5 -18.75 150.5 91.25 0.5Z"
          fill={`url(#${gBand})`}
          stroke={GROUND}
        />
        {frame}
        <path d="M575 60V210" stroke={p.accent} strokeWidth="1.6" opacity="0.8" />
        <path transform="translate(328.5 236)" d="M1.5 0C1.5 64 31.5 80 111.5 80H527.5" fill="none" stroke={p.accent} strokeWidth="3" />
        <path d="M575 372V440" stroke={p.accent} strokeWidth="1.2" opacity="0.6" />
        <rect x="617" y="45" width="180" height="198" rx="22" fill="none" stroke={p.accent} strokeWidth="1.6" />
      </svg>

      <img src={p.logo} alt="DZ Prime Academy" style={abs({ left: 340, top: 18, width: 224, height: 224, objectFit: 'contain' })} />

      {/* QR window */}
      <div style={abs({ left: 617, top: 45, width: 180, height: 198, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12 })}>
        {profileHref ? (
          <a
            href={profileHref}
            {...(profileNewTab ? { target: '_blank', rel: 'noreferrer' } : {})}
            onClick={(e) => e.stopPropagation()}
            title={qrTitle}
            style={{ display: 'block', lineHeight: 0 }}
          >
            {qr}
          </a>
        ) : (
          qr
        )}
        <span style={{ marginTop: 10, fontSize: 16, fontWeight: 500, color: WHITE, opacity: 0.85 }}>رمز التحقق</span>
      </div>

      {/* Member name */}
      {circle(330, <UserIcon size={26} strokeWidth={1.8} />)}
      <div style={abs({ left: 394, top: 370, width: 170 })}>
        <div dir="ltr" style={{ textAlign: 'right', fontSize: 12, letterSpacing: 1.6, color: p.soft, opacity: 0.85 }}>MEMBER NAME</div>
        <div style={{ ...clamp(2), fontFamily: DISPLAY, fontWeight: 700, fontSize: nameSize(card.holderName || '', 24), lineHeight: 1.25, marginTop: 3, wordBreak: 'break-word' }}>
          {card.holderName}
        </div>
        <div dir="ltr" style={{ textAlign: 'right', fontFamily: DIGITS, fontSize: 13, letterSpacing: 0.4, marginTop: 3, color: p.soft, opacity: 0.9 }}>{card.cardId}</div>
      </div>

      {/* Member role */}
      {circle(592, <ShieldCheck size={26} strokeWidth={1.8} />)}
      <div style={abs({ left: 656, top: 370, width: 156 })}>
        <div dir="ltr" style={{ textAlign: 'right', fontSize: 12, letterSpacing: 1.6, color: p.soft, opacity: 0.85 }}>MEMBER ROLE</div>
        <div style={{ ...clamp(3), fontWeight: 600, fontSize: 16, lineHeight: 1.3, marginTop: 3, wordBreak: 'break-word' }}>{roleText}</div>
        {roleText.length <= 26 ? <div style={{ fontSize: 14, marginTop: 3, color: p.soft, opacity: 0.9 }}>{tabAr}</div> : null}
      </div>

      {/* Ownership line */}
      <div style={abs({ left: 300, top: 478, width: 520, textAlign: 'center', fontSize: 15, lineHeight: 1.5, color: p.soft, opacity: 0.9 })}>
        هذه البطاقة ملك حصري لمنصة DZ PRIME ACADEMY وهي غير قابلة للتحويل.
      </div>
    </div>
  );
};

/** Scales the fixed canvas to the container width; the container owns the 856 / 540 aspect ratio. */
export const ScaledCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => el.clientWidth && setScale(el.clientWidth / CARD_W);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0, overflow: 'hidden', direction: 'ltr' }}>
      <div style={{ width: CARD_W, height: CARD_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
    </div>
  );
};

export const CARD_SCENE_STYLE: React.CSSProperties = { aspectRatio: `${CARD_W} / ${CARD_H}`, borderRadius: '4.09% / 6.48%' };
