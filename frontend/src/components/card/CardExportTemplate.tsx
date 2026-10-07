'use client';

import React from 'react';
import { ShieldCheck, Phone, Mail, Globe } from 'lucide-react';
import { MembershipCardData } from '@/types';
import { DzPrimeLogo } from '../shared/DzPrimeLogo';

interface CardExportTemplateProps {
  card: MembershipCardData;
  qrCodeDataUrl: string;
  side: 'front' | 'back';
  verifiedLabel: string;
  notVerifiedLabel: string;
}

const W = 650;
const H = 410;

export const CardExportTemplate: React.FC<CardExportTemplateProps> = ({
  card,
  qrCodeDataUrl,
  side,
  verifiedLabel,
  notVerifiedLabel,
}) => {
  const isStudent = card.role === 'STUDENT_FREE' || card.role === 'STUDENT_PAID';
  const logoVariant = isStudent ? 'amber' : 'blue';

  if (side === 'front') {
    return (
      <div
        style={{ width: W, height: H }}
        className="relative rounded-[28px] overflow-hidden border-[3px] border-[#D4AF37] bg-gradient-to-br from-[#0B1224] via-[#060A14] to-[#04070F] flex flex-col justify-between p-8 text-white font-arabic"
        dir="rtl"
      >
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between w-full" style={{ direction: 'ltr' }}>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#F2D272] text-sm font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>{card.isVerified ? verifiedLabel : notVerifiedLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <img src="/images/dzprime-gold-emblem.png" alt="DZ Prime" className="w-12 h-12 object-contain" />
            <span className="text-base font-black text-gold-300 font-sans tracking-wide">DZ PRIME ACADEMY</span>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center my-auto px-2">
          <h2 className="text-3xl font-extrabold text-white tracking-wide">{card.holderName}</h2>
          <div className="mt-2 flex items-center gap-2 flex-wrap justify-center">
            <span className="px-4 py-1 rounded-md bg-gradient-to-r from-[#946608]/40 via-[#D4AF37]/50 to-[#946608]/40 border border-[#D4AF37]/60 text-[#F2D272] text-base font-bold">
              {card.roleTitleAr}
            </span>
            <span className="text-sm text-gray-400 font-mono">
              W.{card.wilayaCode} ({card.wilayaName})
            </span>
          </div>
          <p className="text-sm text-gray-300 mt-2 max-w-[480px] truncate">{card.institutionName}</p>
        </div>

        <div className="relative z-10 flex items-end justify-between pt-3 border-t border-[#D4AF37]/30">
          <div className="flex flex-col">
            <span className="text-[11px] text-[#D4AF37]/80 uppercase font-semibold tracking-wider">CARD ID</span>
            <span className="font-mono text-base font-bold text-[#F2D272] tracking-wider">{card.cardId}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-[#D4AF37] uppercase tracking-widest font-bold">MEMBERSHIP</span>
            <span className="text-sm text-[#F2D272] font-bold">عضوية</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[11px] text-[#D4AF37]/80 uppercase font-semibold tracking-wider">VALID UNTIL</span>
            <span className="text-base font-semibold text-gray-200">{card.expiryDate || '-'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ width: W, height: H }}
      className="relative rounded-[28px] overflow-hidden border-[3px] border-[#D4AF37] flex text-[#0B1224] font-arabic"
      dir="rtl"
    >
      <div className="w-[58%] h-full p-7 flex flex-col justify-between bg-gradient-to-br from-[#F5D97A] via-[#E8C455] to-[#D4AF37]">
        <div>
          <h3 className="text-xl font-extrabold truncate">{card.holderName}</h3>
          <p className="text-base font-bold text-[#0B1224]/90 flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-[#0B1224] shrink-0" />
            <span>{card.roleTitleAr}</span>
          </p>
        </div>

        <div className="space-y-2.5 text-sm font-medium text-[#0B1224]/90">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 shrink-0" />
            <span dir="ltr" className="font-mono font-semibold">{card.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 shrink-0" />
            <span>{card.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 shrink-0" />
            <span>dzprimeacademy.live</span>
          </div>
        </div>

        <div className="text-xs font-bold border-t border-[#0B1224]/20 pt-2">منصة تعليمية جزائرية متكاملة</div>
      </div>

      <div className="w-[42%] h-full bg-[#070B16] p-5 flex flex-col items-center justify-between text-center border-l border-[#D4AF37]/40">
        <img src="/images/dzprime-gold-emblem.png" alt="DZ Prime" className="w-16 h-16 object-contain" />
        <div className="p-2 rounded-2xl bg-[#D4AF37] flex items-center justify-center">
          {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="Card QR" className="w-28 h-28 rounded-lg object-contain" />}
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-[#F2D272] font-mono tracking-wider font-bold">{card.cardId}</span>
          <span className="text-[10px] text-gray-400 mt-1">SCAN TO VERIFY</span>
        </div>
      </div>
    </div>
  );
};

export const CARD_EXPORT_WIDTH = W;
export const CARD_EXPORT_HEIGHT = H;
