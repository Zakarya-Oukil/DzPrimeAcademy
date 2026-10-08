'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Download, FileDown, RotateCw, ExternalLink } from 'lucide-react';
import { MembershipCardData, User } from '@/types';
import { CardExportTemplate } from './CardExportTemplate';
import { CardCanvas, ScaledCard, CARD_SCENE_STYLE, cardTierFor } from './CardArt';
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
        dark: '#101010',
        light: '#FAFCF9',
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

  const tier = cardTierFor(card.role);
  const canvasProps = {
    card,
    qrCodeDataUrl,
    tier,
    verifiedLabel: t('card.verifiedBadge'),
    notVerifiedLabel: t('card.notVerified'),
    idLabel: t('card.cardId'),
  };


  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto select-none px-1">
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
                qrTitle={locale === 'ar' ? 'عرض الملف الشخصي' : 'Voir le profil'}
              />
            </ScaledCard>
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
            idLabel={t('card.cardId')}
          />
        </div>
        <div ref={exportBackRef}>
          <CardExportTemplate
            card={card}
            qrCodeDataUrl={qrCodeDataUrl}
            side="back"
            verifiedLabel={t('card.verifiedBadge')}
            notVerifiedLabel={t('card.notVerified')}
            idLabel={t('card.cardId')}
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
        {t('card.flipInstruction')}
      </p>
    </div>
  );
};
