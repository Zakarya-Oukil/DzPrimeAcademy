'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Download, FileDown, CheckCircle, RotateCw, ExternalLink, ShieldCheck, Phone, Mail, Globe } from 'lucide-react';
import { MembershipCardData, User } from '@/types';
import { DzPrimeLogo } from '../shared/DzPrimeLogo';
import { CardExportTemplate, CARD_EXPORT_WIDTH, CARD_EXPORT_HEIGHT } from './CardExportTemplate';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/store';

import { AdminMembershipCard } from './AdminMembershipCard';

interface MembershipCardProps {
  user?: User | null;
  cardData?: MembershipCardData;
  allowExport?: boolean;
}

export const MembershipCard: React.FC<MembershipCardProps> = (props) => {
  const targetRole = props.user?.role || props.cardData?.role;
  const isAdminOrEmployee =
    targetRole === 'OWNER' ||
    targetRole === 'ADMIN' ||
    targetRole === 'MODERATOR' ||
    Boolean(props.user?.adminRole) ||
    Boolean(props.cardData?.adminRole);

  if (isAdminOrEmployee) {
    return <AdminMembershipCard {...props} />;
  }

  return <StandardMembershipCard {...props} />;
};

const StandardMembershipCard: React.FC<MembershipCardProps> = ({
  user,
  cardData: customCardData,
  allowExport = true,
}) => {
  const { t, locale } = useTranslation();
  const { currentUser } = useAuthStore();
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  // The real membership end date comes from the server (the card itself carries no date of its own).
  const [membershipExpiry, setMembershipExpiry] = useState('');
  useEffect(() => {
    const id = user?.studentCardId;
    if (!id) return;
    fetch('/api/card/verify/' + encodeURIComponent(id))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMembershipExpiry(d?.card?.expiryDate || ''))
      .catch(() => {});
  }, [user?.studentCardId]);
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);
  const exportFrontRef = useRef<HTMLDivElement>(null);
  const exportBackRef = useRef<HTMLDivElement>(null);

  // Card owner and admin access check for anti-forgery protection
  const isCardOwner = Boolean(
    currentUser && (
      (user?.id && currentUser.id === user.id) ||
      (user?.studentCardId && currentUser.studentCardId === user.studentCardId) ||
      (customCardData?.cardId && currentUser.studentCardId === customCardData.cardId) ||
      (user?.email && currentUser.email === user.email)
    )
  );
  const isAdmin = Boolean(
    currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER')
  );
  const canExport = Boolean(allowExport && (isCardOwner || isAdmin));

  // Synthesize card data from user or props
  const card: MembershipCardData = customCardData || {
    cardId: user?.studentCardId || '',
    holderName: user?.name || '',
    holderNameAr: user?.name || '',
    role: user?.role || 'STUDENT_PAID',
    roleTitleAr:
      user?.role === 'AMBASSADOR'
        ? 'سفير المنصة'
        : user?.role === 'OWNER'
        ? 'المدير العام (المؤسس)'
        : user?.role === 'TEACHER'
        ? 'أستاذ معتمد'
        : user?.role === 'STUDENT_PAID'
        ? 'عضوية ذهبية'
        : 'طالب مسجل',
    roleTitleFr:
      user?.role === 'AMBASSADOR'
        ? 'Ambassadeur Officiel'
        : user?.role === 'OWNER'
        ? 'Directeur Général'
        : user?.role === 'TEACHER'
        ? 'Enseignant Agréé'
        : user?.role === 'STUDENT_PAID'
        ? 'Membre Gold'
        : 'Étudiant',
    roleTitleEn:
      user?.role === 'AMBASSADOR'
        ? 'Platform Ambassador'
        : user?.role === 'OWNER'
        ? 'General Manager'
        : user?.role === 'TEACHER'
        ? 'Certified Teacher'
        : user?.role === 'STUDENT_PAID'
        ? 'Golden Member'
        : 'Student',
    institutionName: user?.institutionName || '',
    wilayaCode: user?.wilayaCode || 16,
    wilayaName: user?.wilayaName || 'الجزائر العاصمة',
    issueDate: '',
    expiryDate: membershipExpiry,
    isVerified: user?.isVerified ?? true,
    qrPayload: user?.studentCardId ? `https://dzprimeacademy.live/verify/${user.studentCardId}` : '',
    phone: user?.phone || '',
    email: user?.email || '',
  };

  // Generate dynamic QR Code for the card back (points to public profile)
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dzprimeacademy.live';
    const profileUrl = `${origin}/${locale}/profile/${card.cardId}`;
    
    QRCode.toDataURL(profileUrl, {
      margin: 1,
      width: 240,
      color: {
        dark: '#000000',
        light: '#F5D061',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR code generation error', err));
  }, [card.cardId, locale]);

  // Captures the actual rendered card design (front or back) as a high-res PNG
  const exportCardAsPng = async () => {
    setIsExporting(true);
    try {
      const node = isFlipped ? exportBackRef.current : exportFrontRef.current;
      if (!node) return;
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement('a');
      link.download = `DZ_PRIME_CARD_${card.cardId}_${isFlipped ? 'back' : 'front'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('PNG export error', e);
    } finally {
      setIsExporting(false);
    }
  };

  // Generates a print-ready PDF sized to a real CR80 plastic card (85.6mm x 54mm), front + back on separate pages
  const exportCardAsPdf = async () => {
    setIsExportingPdf(true);
    try {
      const frontNode = exportFrontRef.current;
      const backNode = exportBackRef.current;
      if (!frontNode || !backNode) return;

      const [frontPng, backPng] = await Promise.all([
        toPng(frontNode, { pixelRatio: 2, cacheBust: true }),
        toPng(backNode, { pixelRatio: 2, cacheBust: true }),
      ]);

      const CARD_WIDTH_MM = 85.6;
      const CARD_HEIGHT_MM = 54;
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [CARD_WIDTH_MM, CARD_HEIGHT_MM] });

      pdf.addImage(frontPng, 'PNG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);
      pdf.addPage([CARD_WIDTH_MM, CARD_HEIGHT_MM], 'landscape');
      pdf.addImage(backPng, 'PNG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);

      pdf.save(`DZ_PRIME_CARD_${card.cardId}_print.pdf`);
    } catch (e) {
      console.error('PDF export error', e);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const isTeacherOrAmbassador = card.role === 'TEACHER' || card.role === 'AMBASSADOR';
  const cardLogoVariant = isTeacherOrAmbassador ? 'blue' : 'amber';

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-md mx-auto select-none px-1">
      {/* 3D Perspective Card Container */}
      <div
        className="w-full h-[240px] xs:h-[270px] sm:h-[290px] cursor-pointer group card-flip-scene"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          className="card-flip-inner transition-all duration-700 rounded-2xl shadow-2xl"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
          {/* ================= FRONT SIDE ================= */}
          <div
            ref={frontCardRef}
            className="card-face w-full h-full border-2 border-gold-500/60 bg-gradient-to-br from-[#0B1224] via-[#060A14] to-[#04070F] shadow-gold-glow flex flex-col justify-between p-3.5 sm:p-5 text-white"
          >
            {/* Background Texture & Light sheen */}
            <div className="absolute inset-0 bg-radial-glow opacity-60 pointer-events-none" />
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-gold-400/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-dzBlue-neon/10 blur-2xl pointer-events-none" />

            {/* Top Bar: Verification Pill on Left, Brand Logo on Right */}
            <div className="relative z-10 flex items-center justify-between w-full" style={{ direction: 'ltr' }}>
              <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-gold-500/15 border border-gold-400/40 text-gold-300 text-[10px] sm:text-xs font-semibold backdrop-blur-md">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold-400" />
                <span>{card.isVerified ? t('card.verifiedBadge') : t('card.notVerified')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <img src="/images/dzprime-gold-emblem.png" alt="DZ Prime" className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-[0_0_10px_rgba(212,175,55,0.7)]" />
                <span className="text-xs sm:text-sm font-black text-gold-300 font-sans tracking-wide">DZ PRIME</span>
              </div>
            </div>

            {/* Center: Crest, Member Name, & Role */}
            <div className="relative z-10 flex flex-col items-center text-center my-auto px-1">
              <h2 className="text-base xs:text-lg sm:text-2xl font-extrabold text-white font-arabic tracking-wide drop-shadow-md truncate max-w-full">
                {card.holderName}
              </h2>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap justify-center">
                <span className="px-2.5 py-0.5 rounded-md bg-gradient-to-r from-gold-600/30 via-gold-500/40 to-gold-600/30 border border-gold-400/60 text-gold-200 text-[10px] sm:text-xs font-bold font-arabic shadow-sm">
                  {card.roleTitleAr}
                </span>
                <span className="text-[10px] sm:text-[11px] text-gray-400 font-mono">
                  W.{card.wilayaCode} ({card.wilayaName})
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-gray-300 mt-1 max-w-[260px] sm:max-w-[280px] truncate">
                {card.institutionName}
              </p>
            </div>

            {/* Bottom Metallic Curved Waves & Details */}
            <div className="relative z-10 flex items-end justify-between pt-1.5 sm:pt-2 border-t border-gold-500/30 text-[10px]">
              <div className="flex flex-col">
                <span className="text-[8px] sm:text-[9px] text-gold-400/80 uppercase font-semibold tracking-wider">
                  {t('card.cardId')}
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-white tracking-wider">
                  {card.cardId}
                </span>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[8px] sm:text-[9px] text-gold-400/80 uppercase font-semibold tracking-wider">
                  {t('card.validThru')}
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-gray-200">
                  {card.expiryDate || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* ================= BACK SIDE ================= */}
          <div
            ref={backCardRef}
            className="card-face card-face-back w-full h-full border-2 border-gold-500/60 bg-gradient-to-r from-gold-500 via-gold-400 to-navy-950 shadow-gold-glow flex text-navy-950 p-0"
          >
            {/* Left Half: Gold Metallic */}
            <div className="w-[58%] sm:w-[60%] h-full p-2.5 sm:p-4 flex flex-col justify-between bg-gradient-to-br from-gold-300 via-gold-400 to-gold-500 text-navy-950">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold font-arabic text-navy-950 truncate">
                  {card.holderName}
                </h3>
                <p className="text-[10px] sm:text-xs font-bold text-navy-900/90 font-arabic flex items-center gap-1 mt-0.5 leading-tight break-words">
                  <span className="w-1.5 h-1.5 rounded-full bg-navy-950 shrink-0" />
                  <span>{card.roleTitleAr}</span>
                </p>
              </div>

              {/* Official Algerian Channels */}
              <div className="space-y-1 sm:space-y-1.5 text-[9px] sm:text-[10px] font-medium text-navy-900">
                <div className="flex items-center gap-1">
                  <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-navy-950 shrink-0" />
                  <span dir="ltr" className="font-mono font-semibold truncate">{card.phone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-navy-950 shrink-0" />
                  <span className="truncate">{card.email}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-navy-950 shrink-0" />
                  <span className="truncate">dzprimeacademy.live</span>
                </div>
              </div>

              <div className="text-[8px] sm:text-[9px] font-bold text-navy-900 border-t border-navy-900/20 pt-0.5">
                منصة تعليمية جزائرية متكاملة
              </div>
            </div>

            {/* Right Half: Obsidian Half with QR Code */}
            <div className="w-[42%] sm:w-[40%] h-full bg-[#070B16] p-2 sm:p-3 flex flex-col items-center justify-between text-center relative border-l border-gold-400/40">
              <img src="/images/dzprime-gold-emblem.png" alt="DZ Prime Emblem" className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-[0_0_24px_rgba(212,175,55,1)] filter brightness-115 contrast-110" />

              <a
                href={`/${locale}/profile/${card.cardId}`}
                target="_blank"
                rel="noreferrer"
                title={locale === 'ar' ? 'عرض الملف الشخصي' : 'Voir le profil'}
                className="p-1 rounded-xl bg-gold-400 hover:bg-gold-300 transition-colors shadow-inner flex items-center justify-center cursor-pointer group/qr"
              >
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Card QR"
                    className="w-16 h-16 xs:w-18 xs:h-18 sm:w-20 sm:h-20 rounded-lg object-contain group-hover/qr:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gold-500 animate-pulse rounded-lg" />
                )}
              </a>

              <div className="flex flex-col items-center">
                <span className="text-[7px] sm:text-[8px] text-gold-300 font-mono tracking-wider font-bold truncate max-w-full">
                  {card.cardId}
                </span>
                <span className="text-[6px] sm:text-[7px] text-gray-400 mt-0.5">
                  SCAN FOR PROFILE
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Hidden high-res export templates (not part of the 3D flip stack, captured 1:1 for PNG/PDF) */}
      <div style={{ position: 'fixed', top: 0, left: -9999, pointerEvents: 'none', opacity: 0 }} aria-hidden="true">
        <div ref={exportFrontRef}>
          <CardExportTemplate
            card={card}
            qrCodeDataUrl={qrCodeDataUrl}
            side="front"
            verifiedLabel={t('card.verifiedBadge')}
            notVerifiedLabel={t('card.notVerified')}
          />
        </div>
        <div ref={exportBackRef}>
          <CardExportTemplate
            card={card}
            qrCodeDataUrl={qrCodeDataUrl}
            side="back"
            verifiedLabel={t('card.verifiedBadge')}
            notVerifiedLabel={t('card.notVerified')}
          />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full">
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="px-3.5 sm:px-4 py-2 rounded-xl bg-navy-850 hover:bg-navy-800 border border-gold-500/30 text-gold-300 hover:text-gold-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 touch-target justify-center"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isFlipped ? 'rotate-180' : ''} transition-transform duration-500`} />
          <span>{isFlipped ? t('card.front') : t('card.back')}</span>
        </button>

        {canExport && (
          <button
            onClick={exportCardAsPng}
            disabled={isExporting}
            data-testid="card-download-png-btn"
            className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-navy-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-gold-glow hover:shadow-gold-glow-lg active:scale-95 disabled:opacity-50 touch-target justify-center"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? t('card.generatingPng') : t('card.downloadPng')}</span>
          </button>
        )}

        {canExport && (
          <button
            onClick={exportCardAsPdf}
            disabled={isExportingPdf}
            data-testid="card-download-pdf-btn"
            className="px-4 sm:px-5 py-2 rounded-xl bg-navy-850 hover:bg-navy-800 border border-sky-400/40 text-sky-300 hover:text-sky-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 touch-target justify-center"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{isExportingPdf ? t('card.generatingPdf') : t('card.downloadPdf')}</span>
          </button>
        )}

        <a
          href={`/${locale}/profile/${card.cardId}`}
          target="_blank"
          rel="noreferrer"
          className="px-3.5 sm:px-4 py-2 rounded-xl bg-dzBlue-dark hover:bg-dzBlue border border-dzBlue-neon/40 text-dzBlue-neon text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm touch-target justify-center"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>{locale === 'ar' ? 'معاينة الملف العام' : 'Voir Profil Public'}</span>
        </a>
      </div>

      <p className="text-[10px] sm:text-[11px] text-gray-400 text-center font-arabic">
        💡 {t('card.flipInstruction')}
      </p>
    </div>
  );
};
