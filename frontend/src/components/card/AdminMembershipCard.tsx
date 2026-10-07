'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Download, FileDown, RotateCw, ExternalLink, ShieldCheck, User as UserIcon, Shield } from 'lucide-react';
import { MembershipCardData, User } from '@/types';
import { DzPrimeLogo } from '../shared/DzPrimeLogo';
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
        dark: '#D4AF37',
        light: '#05070D',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR code generation error', err));
  }, [card.cardId, locale]);

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
    <div className="flex flex-col items-center gap-5 w-full max-w-lg mx-auto select-none px-1 font-arabic" data-testid="admin-membership-card">
      {/* 3D Perspective Card Container */}
      <div
        className="w-full h-[265px] xs:h-[295px] sm:h-[330px] cursor-pointer group card-flip-scene"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          className="card-flip-inner transition-all duration-700 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
          {/* ================= 1:1 FRONT FACE ================= */}
          <div
            ref={frontCardRef}
            className="card-face w-full h-full rounded-3xl border border-[#D4AF37]/50 bg-[#07090E] shadow-[0_0_35px_rgba(212,175,55,0.3)] relative overflow-hidden flex flex-col justify-between p-4 sm:p-6 text-white"
          >
            {/* Background Texture & Stardust Sparkle Pattern */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen"
              style={{
                backgroundImage: `radial-gradient(1px 1px at 20px 30px, #FFF, rgba(0,0,0,0)),
                                  radial-gradient(1.5px 1.5px at 60px 80px, #D4AF37, rgba(0,0,0,0)),
                                  radial-gradient(1px 1px at 100px 40px, #FFF, rgba(0,0,0,0)),
                                  radial-gradient(2px 2px at 150px 140px, #F5D061, rgba(0,0,0,0)),
                                  radial-gradient(1.2px 1.2px at 220px 70px, #FFF, rgba(0,0,0,0)),
                                  radial-gradient(1.5px 1.5px at 290px 180px, #D4AF37, rgba(0,0,0,0))`,
                backgroundSize: '320px 220px',
              }}
            />

            {/* Luxurious Sweeping Gold & White Satin Wave Ribbons (Vector SVG) */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0"
              viewBox="0 0 600 360"
              fill="none"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="goldRibbonA" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF2B2" />
                  <stop offset="25%" stopColor="#F5D061" />
                  <stop offset="60%" stopColor="#D4AF37" />
                  <stop offset="85%" stopColor="#996D12" />
                  <stop offset="100%" stopColor="#684705" />
                </linearGradient>

                <linearGradient id="goldRibbonB" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F9DF7B" />
                  <stop offset="40%" stopColor="#D4AF37" />
                  <stop offset="80%" stopColor="#8C5C00" />
                  <stop offset="100%" stopColor="#4A2E00" />
                </linearGradient>

                <linearGradient id="whiteSatin" x1="20%" y1="0%" x2="80%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#E2E8F0" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.85" />
                </linearGradient>

                <radialGradient id="stardustGlow" cx="20%" cy="30%" r="60%">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#05070D" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Background dark glow beneath curves */}
              <path d="M0 0 C 120 40, 160 160, 240 360 L 0 360 Z" fill="url(#stardustGlow)" />

              {/* Gold Wave 1: Broad outer flourish */}
              <path
                d="M 0 30 C 130 50, 150 180, 260 360 L 220 360 C 130 190, 100 80, 0 50 Z"
                fill="url(#goldRibbonA)"
                opacity="0.95"
              />

              {/* White Satin Ribbon: Elegant middle swirl */}
              <path
                d="M 20 0 C 130 30, 175 160, 310 360 L 280 360 C 160 170, 115 50, 5 0 Z"
                fill="url(#whiteSatin)"
              />

              {/* Gold Wave 2: Sweeping inner highlight curve */}
              <path
                d="M 40 0 C 145 25, 195 150, 360 360 L 330 360 C 180 160, 130 40, 15 0 Z"
                fill="url(#goldRibbonB)"
              />

              {/* Bottom right subtle gold accent curve */}
              <path
                d="M 260 360 C 380 330, 480 345, 600 340 L 600 360 Z"
                fill="url(#goldRibbonA)"
                opacity="0.8"
              />
            </svg>

            {/* Right Side Column: Golden 3D Emblem and Slot (matching reference image) */}
            <div className="absolute top-3 sm:top-5 right-3 sm:right-7 z-10 flex flex-col items-center gap-2 sm:gap-3 pointer-events-none">
              <img
                src="/images/dzprime-gold-emblem.png"
                alt="DZ Prime Academy"
                className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_0_24px_rgba(212,175,55,0.95)] filter brightness-110"
              />
              <div className="w-36 sm:w-52 h-8 sm:h-10 rounded-xl sm:rounded-2xl border border-[#D4AF37]/90 bg-[#070B16]/80 backdrop-blur-md shadow-[0_0_15px_rgba(212,175,55,0.25)] flex items-center justify-center px-3">
                <span className="font-mono text-[10px] sm:text-xs text-[#F2D272] tracking-widest font-bold">
                  {card.cardId}
                </span>
              </div>
            </div>

            {/* Bottom Left: Official Member Plaque */}
            <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 z-10 pointer-events-none">
              <div className="flex flex-col items-start px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-tr-2xl rounded-bl-xl bg-gradient-to-r from-[#F5D061] via-[#D4AF37] to-[#AA771C] text-[#070B16] shadow-xl">
                <span className="text-xs sm:text-sm font-black font-arabic tracking-wide leading-tight">
                  عضو رسمي
                </span>
                <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest font-sans leading-tight">
                  OFFICIAL MEMBER
                </span>
              </div>
            </div>
          </div>

          {/* ================= 1:1 BACK FACE ================= */}
          <div
            ref={backCardRef}
            className="card-face card-face-back w-full h-full rounded-3xl border border-[#D4AF37]/50 bg-[#06080F] shadow-[0_0_35px_rgba(212,175,55,0.3)] relative overflow-hidden flex flex-col justify-between p-3.5 sm:p-5 text-white"
          >
            {/* Mirroring Wave Ribbon along the left */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0"
              viewBox="0 0 600 360"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M 0 0 C 80 80, 110 240, 0 360 L 0 0 Z"
                fill="url(#stardustGlow)"
              />
              <path
                d="M 0 10 C 90 90, 130 220, 10 360 L 0 360 Z"
                fill="url(#goldRibbonA)"
                opacity="0.9"
              />
              <path
                d="M 0 35 C 100 110, 140 200, 35 360 L 20 360 Z"
                fill="url(#whiteSatin)"
              />
              <path
                d="M 0 60 C 110 130, 150 180, 60 360 L 45 360 Z"
                fill="url(#goldRibbonB)"
              />
            </svg>

            {/* Upper Center: DZ Prime Logo on left, QR Code box on right */}
            <div className="relative z-10 flex items-center justify-around w-full my-auto px-1 sm:px-4">
              {/* Left Emblem: Significantly Bigger, Bolder 3D Golden Emblem with Orbit Ring */}
              <div className="flex flex-col items-center justify-center text-center pl-1 sm:pl-3 relative">
                {/* Thin golden circular orbit ring around emblem matching reference card */}
                <div className="absolute inset-0 m-auto w-32 h-32 xs:w-36 xs:h-36 sm:w-44 sm:h-44 rounded-full border border-[#D4AF37]/40 pointer-events-none" />
                <img
                  src="/images/dzprime-gold-emblem.png"
                  alt="DZ Prime Academy Golden Emblem"
                  className="w-28 h-28 xs:w-32 xs:h-32 sm:w-40 sm:h-40 object-contain drop-shadow-[0_0_32px_rgba(212,175,55,1)] filter brightness-115 contrast-115 transform hover:scale-105 transition-transform relative z-10"
                />
              </div>

              {/* Vertical Subtle Separator */}
              <div className="h-24 sm:h-28 w-[1px] bg-gradient-to-b from-transparent via-[#D4AF37]/50 to-transparent mx-2" />

              {/* Right: Square Gold-Bordered QR Code Box */}
              <Link
                href={`/${locale}/profile/${card.cardId}`}
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col items-center group/qr cursor-pointer hover:scale-105 transition-transform"
                title={locale === 'ar' ? 'الانتقال إلى الملف الشخصي' : 'Voir le profil'}
              >
                <div className="p-2 sm:p-2.5 rounded-2xl border-2 border-[#D4AF37] bg-[#05070D] shadow-[0_0_20px_rgba(212,175,55,0.25)] flex items-center justify-center group-hover/qr:border-[#FFF0A0] transition-colors">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="Admin Profile QR"
                      className="w-16 h-16 xs:w-20 xs:h-20 sm:w-22 sm:h-22 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-[#D4AF37]/20 animate-pulse rounded-lg" />
                  )}
                </div>
                <span className="text-[8px] sm:text-[9px] text-[#F2D272] group-hover/qr:text-white mt-1 font-mono tracking-wider font-bold">
                  SCAN FOR PROFILE
                </span>
              </Link>
            </div>

            {/* Bottom Section: Split Member Name & Member Role */}
            <div className="relative z-10 w-full pt-2 border-t border-[#D4AF37]/40">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Member Name */}
                <div className="flex items-center gap-2 pr-2 border-r border-[#D4AF37]/30">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#D4AF37] bg-[#D4AF37]/15 flex items-center justify-center shrink-0 text-[#F2D272]">
                    <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[7px] sm:text-[8px] text-gray-400 uppercase tracking-widest font-sans">
                      MEMBER NAME / اسم العضو
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-white drop-shadow-sm font-arabic break-words leading-tight">
                      {card.holderName}
                    </div>
                  </div>
                </div>

                {/* Member Role (Shows Fully Without Truncation) */}
                <div className="flex items-center gap-2 pl-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#D4AF37] bg-[#D4AF37]/15 flex items-center justify-center shrink-0 text-[#F2D272]">
                    <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[7px] sm:text-[8px] text-gray-400 uppercase tracking-widest font-sans">
                      MEMBER ROLE / الصفة
                    </div>
                    <div className="text-[10px] sm:text-xs font-black text-[#F2D272] drop-shadow-sm font-arabic leading-snug break-words">
                      {card.jobTitle || card.roleTitleAr}
                    </div>
                  </div>
                </div>
              </div>

              {/* Exact Arabic Disclaimer from reference image */}
              <div className="mt-2 text-center text-[8px] sm:text-[9px] text-[#F2D272]/90 font-arabic tracking-wide border-t border-[#D4AF37]/20 pt-1">
                • هذه البطاقة ملك حصري لمنصة Dz PRIME ACADEMY وهي غير قابلة للتحويل •
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Hidden Export Template for PNG & PDF */}
      <div style={{ position: 'fixed', top: 0, left: -9999, pointerEvents: 'none', opacity: 0 }} aria-hidden="true">
        <div ref={exportFrontRef} style={{ width: 650, height: 410 }} className="relative rounded-[28px] overflow-hidden border-[2px] border-[#D4AF37] bg-[#07090E] p-8 text-white font-arabic">
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 600 360" fill="none" preserveAspectRatio="none">
            <path d="M 0 30 C 130 50, 150 180, 260 360 L 220 360 C 130 190, 100 80, 0 50 Z" fill="#D4AF37" opacity="0.95" />
            <path d="M 20 0 C 130 30, 175 160, 310 360 L 280 360 C 160 170, 115 50, 5 0 Z" fill="#FFFFFF" />
            <path d="M 40 0 C 145 25, 195 150, 360 360 L 330 360 C 180 160, 130 40, 15 0 Z" fill="#C59838" />
          </svg>
          <div className="absolute top-6 right-8 z-10 flex flex-col items-center gap-3">
            <img src="/images/dzprime-gold-emblem.png" alt="DZ Prime" className="w-24 h-24 object-contain" />
            <div className="w-56 h-11 rounded-2xl border border-[#D4AF37] bg-[#070B16] flex items-center justify-center font-mono text-sm text-[#F2D272] font-bold">
              {card.cardId}
            </div>
          </div>
          <div className="absolute bottom-6 left-6 z-10">
            <div className="px-5 py-2 rounded-tr-2xl rounded-bl-xl bg-gradient-to-r from-[#F5D061] to-[#AA771C] text-[#070B16]">
              <div className="text-base font-black">عضو رسمي</div>
              <div className="text-[10px] font-extrabold uppercase tracking-widest font-sans">OFFICIAL MEMBER</div>
            </div>
          </div>
        </div>

        <div ref={exportBackRef} style={{ width: 650, height: 410 }} className="relative rounded-[28px] overflow-hidden border-[2px] border-[#D4AF37] bg-[#06080F] p-8 text-white font-arabic flex flex-col justify-between">
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 600 360" fill="none" preserveAspectRatio="none">
            <path d="M 0 10 C 90 90, 130 220, 10 360 L 0 360 Z" fill="#D4AF37" opacity="0.9" />
            <path d="M 0 35 C 100 110, 140 200, 35 360 L 20 360 Z" fill="#FFFFFF" />
            <path d="M 0 60 C 110 130, 150 180, 60 360 L 45 360 Z" fill="#C59838" />
          </svg>
          <div className="relative z-10 flex items-center justify-around w-full my-auto px-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 m-auto w-44 h-44 rounded-full border border-[#D4AF37]/50 pointer-events-none" />
              <img src="/images/dzprime-gold-emblem.png" alt="DZ Prime" className="w-36 h-36 object-contain relative z-10" />
            </div>
            <div className="h-28 w-[1px] bg-[#D4AF37]/40" />
            <div className="p-3 rounded-2xl border-2 border-[#D4AF37] bg-black flex items-center justify-center">
              {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR" className="w-28 h-28 object-contain" />}
            </div>
          </div>
          <div className="relative z-10 w-full pt-3 border-t border-[#D4AF37]/40">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 border-r border-[#D4AF37]/30 pr-4">
                <div className="w-10 h-10 rounded-full border border-[#D4AF37] bg-[#D4AF37]/20 flex items-center justify-center text-[#F2D272]">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[9px] text-gray-400 uppercase">MEMBER NAME / اسم العضو</div>
                  <div className="text-base font-black text-white">{card.holderName}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 pl-4">
                <div className="w-10 h-10 rounded-full border border-[#D4AF37] bg-[#D4AF37]/20 flex items-center justify-center text-[#F2D272]">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] text-gray-400 uppercase">MEMBER ROLE / الصفة</div>
                  <div className="text-sm font-black text-[#F2D272] leading-tight break-words">{card.jobTitle || card.roleTitleAr}</div>
                </div>
              </div>
            </div>
            <div className="mt-3 text-center text-[11px] text-[#F2D272] font-arabic border-t border-[#D4AF37]/20 pt-1.5">
              • هذه البطاقة ملك حصري لمنصة Dz PRIME ACADEMY وهي غير قابلة للتحويل •
            </div>
          </div>
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
        💡 {t('card.flipInstruction')}
      </p>
    </div>
  );
};
