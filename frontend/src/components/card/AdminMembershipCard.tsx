'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Download, FileDown, RotateCw, ExternalLink } from 'lucide-react';
import { MembershipCardData, User } from '@/types';
import { CardExportTemplate } from './CardExportTemplate';
import { CardCanvas, ScaledCard, CARD_SCENE_STYLE } from './CardArt';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/store';

interface AdminMembershipCardProps {
  user?: User | null;
  cardData?: MembershipCardData;
  allowExport?: boolean;
}

export const AdminMembershipCard: React.FC<AdminMembershipCardProps> = ({
  user,
  cardData: customCardData,
  allowExport = true,
}) => {
  const { t, locale } = useTranslation();
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);
  const exportFrontRef = useRef<HTMLDivElement>(null);
  const exportBackRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuthStore();

  const rawRole = user?.role || customCardData?.role || 'ADMIN';
  // The platform owner is recognised by role, not by a hard-coded name or email address.
  const isZakarya = user?.role === 'OWNER';

  const roleDisplayAr =
    customCardData?.jobTitle ||
    user?.jobTitle ||
    (rawRole === 'OWNER' || isZakarya
      ? 'Chief Technology Officer (CTO) & Co-Founder'
      : user?.adminRole === 'GENERAL_ADMIN'
      ? 'Admin Général (المدير العام التنفيذي)'
      : user?.adminRole === 'COMMERCIAL'
      ? 'Chargée Commerciale (المسؤولة التجارية وإدارة الدورات والعروض)'
      : user?.adminRole === 'HR_MANAGER'
      ? 'Chargée des Ressources Humaines (مسؤولة الموارد البشرية)'
      : user?.adminRole === 'HR_EMPLOYEE'
      ? 'مسؤول الموارد البشرية والتوظيف'
      : user?.adminRole === 'FINANCE'
      ? 'المسؤول المالي والمحاسبة'
      : 'إدارة المنصة المركزية');

  const card: MembershipCardData = customCardData || {
    cardId: user?.studentCardId || '',
    holderName: user?.name || (isZakarya || rawRole === 'OWNER' ? 'Zakarya Oukil' : 'إدارة المنصة المركزية'),
    holderNameAr: user?.name || (isZakarya || rawRole === 'OWNER' ? 'زكرياء أوكيل (Zakarya Oukil)' : 'إدارة المنصة المركزية'),
    role: rawRole,
    roleTitleAr: roleDisplayAr,
    roleTitleFr:
      user?.jobTitle ||
      (rawRole === 'OWNER' || isZakarya
        ? 'Directeur Technique & Co-Fondateur (CTO)'
        : user?.adminRole === 'GENERAL_ADMIN'
        ? 'Directeur Général (Admin Général)'
        : user?.adminRole === 'COMMERCIAL'
        ? 'Chargée Commerciale & Offres'
        : 'Administration'),
    roleTitleEn:
      user?.jobTitle ||
      (rawRole === 'OWNER' || isZakarya
        ? 'Chief Technology Officer (CTO) & Co-Founder'
        : user?.adminRole === 'GENERAL_ADMIN'
        ? 'General Manager (Admin Général)'
        : user?.adminRole === 'COMMERCIAL'
        ? 'Chief Commercial Officer'
        : 'Administration Staff'),
    jobTitle: user?.jobTitle || roleDisplayAr,
    institutionName: user?.institutionName || 'DZ Prime Academy HQ',
    wilayaCode: user?.wilayaCode || 16,
    wilayaName: user?.wilayaName || 'الجزائر العاصمة',
    issueDate: '',
    expiryDate: '',
    isVerified: user?.isVerified ?? true,
    qrPayload: `https://dzprimeacademy.live/verify/${user?.studentCardId || ''}`,
    phone: user?.phone || '',
    email: user?.email || '',
    bio: user?.bio,
  };

  const isCardOwner = Boolean(
    currentUser && (
      (user?.id && currentUser.id === user.id) ||
      (user?.email && currentUser.email === user.email) ||
      (customCardData?.cardId && (currentUser.studentCardId === customCardData.cardId || currentUser.id === customCardData.cardId)) ||
      (card?.cardId && (currentUser.studentCardId === card.cardId || currentUser.id === card.cardId))
    )
  );
  const isAdmin = Boolean(
    currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER')
  );
  const canExport = Boolean(allowExport && (isCardOwner || isAdmin));

  // Generate QR Code pointing directly to the public profile
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dzprimeacademy.live';
    const profileUrl = `${origin}/${locale}/profile/${card.cardId}`;

    QRCode.toDataURL(profileUrl, {
      margin: 1,
      width: 260,
      color: {
        dark: '#101010',
        light: '#FAFCF9',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR code generation error', err));
  }, [card.cardId, locale]);

  const canvasProps = {
    card,
    qrCodeDataUrl,
    tier: 'vip' as const,
    verifiedLabel: t('card.verifiedBadge'),
    notVerifiedLabel: t('card.notVerified'),
  };

  const exportCardAsPng = async () => {
    setIsExporting(true);
    try {
      const node = isFlipped ? exportBackRef.current : exportFrontRef.current;
      if (!node) return;
      const dataUrl = await toPng(node, { pixelRatio: 2.5, cacheBust: true });
      const link = document.createElement('a');
      link.download = `DZ_PRIME_ADMIN_VIP_${card.cardId}_${isFlipped ? 'back' : 'front'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('PNG export error', e);
    } finally {
      setIsExporting(false);
    }
  };

  const exportCardAsPdf = async () => {
    setIsExportingPdf(true);
    try {
      const frontNode = exportFrontRef.current;
      const backNode = exportBackRef.current;
      if (!frontNode || !backNode) return;

      const [frontPng, backPng] = await Promise.all([
        toPng(frontNode, { pixelRatio: 2.5, cacheBust: true }),
        toPng(backNode, { pixelRatio: 2.5, cacheBust: true }),
      ]);

      const CARD_WIDTH_MM = 85.6;
      const CARD_HEIGHT_MM = 54;
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [CARD_WIDTH_MM, CARD_HEIGHT_MM] });

      pdf.addImage(frontPng, 'PNG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);
      pdf.addPage([CARD_WIDTH_MM, CARD_HEIGHT_MM], 'landscape');
      pdf.addImage(backPng, 'PNG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);

      pdf.save(`DZ_PRIME_ADMIN_VIP_${card.cardId}_print.pdf`);
    } catch (e) {
      console.error('PDF export error', e);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto select-none px-1 font-arabic" data-testid="admin-membership-card">
      {/* 3D flip scene, 856:540 (CR80). The card art scales to the container width. */}
      <div
        className="w-full cursor-pointer group card-flip-scene shadow-2xl"
        style={CARD_SCENE_STYLE}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          className="card-flip-inner transition-all duration-700"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
          <div ref={frontCardRef} className="card-face">
            <ScaledCard>
              <CardCanvas {...canvasProps} side="front" />
            </ScaledCard>
          </div>
          <div ref={backCardRef} className="card-face card-face-back">
            <ScaledCard>
              <CardCanvas
                {...canvasProps}
                side="back"
                profileHref={`/${locale}/profile/${card.cardId}`}
                profileNewTab={false}
                qrTitle={locale === 'ar' ? 'الانتقال إلى الملف الشخصي' : 'Voir le profil'}
              />
            </ScaledCard>
          </div>
        </motion.div>
      </div>

      {/* Hidden 1:1 export templates for PNG & PDF */}
      <div style={{ position: 'fixed', top: 0, left: -9999, pointerEvents: 'none', opacity: 0 }} aria-hidden="true">
        <div ref={exportFrontRef}>
          <CardExportTemplate card={card} qrCodeDataUrl={qrCodeDataUrl} side="front" verifiedLabel={canvasProps.verifiedLabel} notVerifiedLabel={canvasProps.notVerifiedLabel} />
        </div>
        <div ref={exportBackRef}>
          <CardExportTemplate card={card} qrCodeDataUrl={qrCodeDataUrl} side="back" verifiedLabel={canvasProps.verifiedLabel} notVerifiedLabel={canvasProps.notVerifiedLabel} />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full">
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="px-3.5 sm:px-4 py-2 rounded-xl bg-navy-850 hover:bg-navy-800 border border-gold-500/30 text-gold-300 hover:text-gold-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isFlipped ? 'rotate-180' : ''} transition-transform duration-500`} />
          <span>{isFlipped ? t('card.front') : t('card.back')}</span>
        </button>

        {canExport && (
          <button
            onClick={exportCardAsPng}
            data-testid="card-download-png-btn"
            disabled={isExporting}
            className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-navy-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-gold-glow active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? t('card.generatingPng') : t('card.downloadPng')}</span>
          </button>
        )}

        {canExport && (
          <button
            onClick={exportCardAsPdf}
            data-testid="card-download-pdf-btn"
            disabled={isExportingPdf}
            className="px-4 sm:px-5 py-2 rounded-xl bg-navy-850 hover:bg-navy-800 border border-sky-400/40 text-sky-300 hover:text-sky-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{isExportingPdf ? t('card.generatingPdf') : t('card.downloadPdf')}</span>
          </button>
        )}

        <a
          href={`/${locale}/profile/${card.cardId}`}
          target="_blank"
          rel="noreferrer"
          className="px-3.5 sm:px-4 py-2 rounded-xl bg-dzBlue-dark hover:bg-dzBlue border border-dzBlue-neon/40 text-dzBlue-neon text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>{locale === 'ar' ? 'معاينة الملف العام' : 'Voir Profil Public'}</span>
        </a>
      </div>

      <p className="text-[10px] sm:text-[11px] text-gray-400 text-center font-arabic">
        {t('card.flipInstruction')}
      </p>
    </div>
  );
};
