'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { ArrowSquareOut, DownloadSimple, FilePdf } from '@phosphor-icons/react';
import type { MembershipCardData } from '@/types';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { isGoldenMember } from '@/lib/rbac';
import { CardCanvas, CardTier, CARD_SCENE_STYLE, ScaledCard, cardTierFor } from '@/components/card/CardArt';
import { CardExportTemplate } from '@/components/card/CardExportTemplate';
import { Btn, Empty, PageHead, Panel, SectionHead, Status, useTx } from './ui';

/** Membership card (Figma page 27): the real card art (CardArt.tsx), front and back, export, and the VIP card as a preview for free members. */

const Scene: React.FC<{ children: React.ReactNode; label: string }> = ({ children, label }) => (
  <div role="img" aria-label={label} className="relative w-full max-w-[460px] overflow-hidden" style={CARD_SCENE_STYLE}>
    <ScaledCard>{children}</ScaledCard>
  </div>
);

export const StudentCardV2: React.FC = () => {
  const { tx, locale } = useTx();
  const { t } = useTranslation();
  const { currentUser } = useAuthStore();
  const [qr, setQr] = useState('');
  const [expiry, setExpiry] = useState('');
  const [busy, setBusy] = useState<'png' | 'pdf' | null>(null);
  const [face, setFace] = useState<'front' | 'back'>('front');
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const gold = isGoldenMember(currentUser);
  const cardId = currentUser?.studentCardId || '';

  useEffect(() => {
    if (!cardId) return;
    fetch('/api/card/verify/' + encodeURIComponent(cardId))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setExpiry(d?.card?.expiryDate || ''))
      .catch(() => {});
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    QRCode.toDataURL(`${origin}/${locale}/profile/${cardId}`, { margin: 1, width: 240, color: { dark: '#101010', light: '#FAFCF9' } }).then(setQr).catch(() => {});
  }, [cardId, locale]);

  if (!currentUser) return null;
  if (!cardId) {
    return (
      <div className="flex flex-col gap-7">
        <PageHead title={tx('بطاقة العضوية', 'Carte de membre', 'Membership card')} />
        <Empty title={tx('بطاقتك لم تُفعَّل بعد', "Votre carte n'est pas encore activée", 'Your card is not active yet')} body={tx('تظهر البطاقة هنا بعد تفعيل حسابك.', 'La carte apparaît ici après activation de votre compte.', 'The card appears here once your account is activated.')} />
      </div>
    );
  }

  const isPaid = currentUser.role === 'STUDENT_PAID';
  const card: MembershipCardData = {
    cardId,
    holderName: currentUser.name,
    holderNameAr: currentUser.name,
    role: currentUser.role,
    roleTitleAr: isPaid ? 'عضوية ذهبية' : 'طالب مسجل',
    roleTitleFr: isPaid ? 'Membre Gold' : 'Étudiant',
    roleTitleEn: isPaid ? 'Golden Member' : 'Student',
    institutionName: currentUser.institutionName || '',
    wilayaCode: currentUser.wilayaCode || 16,
    wilayaName: currentUser.wilayaName || '',
    issueDate: '',
    expiryDate: expiry,
    isVerified: currentUser.isVerified ?? true,
    qrPayload: `https://dzprimeacademy.live/verify/${cardId}`,
    phone: currentUser.phone || '',
    email: currentUser.email,
  };
  const tier: CardTier = cardTierFor(card.role);
  const props = { card, qrCodeDataUrl: qr, verifiedLabel: t('card.verifiedBadge'), notVerifiedLabel: t('card.notVerified'), idLabel: t('card.cardId') };

  const png = async () => {
    setBusy('png');
    try {
      const node = face === 'back' ? backRef.current : frontRef.current;
      if (!node) return;
      const url = await toPng(node, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement('a');
      a.download = `DZ_PRIME_CARD_${cardId}_${face}.png`;
      a.href = url;
      a.click();
    } finally { setBusy(null); }
  };
  const pdf = async () => {
    setBusy('pdf');
    try {
      if (!frontRef.current || !backRef.current) return;
      const [f, b] = await Promise.all([toPng(frontRef.current, { pixelRatio: 2, cacheBust: true }), toPng(backRef.current, { pixelRatio: 2, cacheBust: true })]);
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] });
      doc.addImage(f, 'PNG', 0, 0, 85.6, 54);
      doc.addPage([85.6, 54], 'landscape');
      doc.addImage(b, 'PNG', 0, 0, 85.6, 54);
      doc.save(`DZ_PRIME_CARD_${cardId}_print.pdf`);
    } finally { setBusy(null); }
  };

  const rows: [string, React.ReactNode][] = [
    [tx('رقم البطاقة', 'Numéro de carte', 'Card number'), <span key="id" dir="ltr" className="font-mono text-[15px] font-semibold">{cardId}</span>],
    [tx('الحالة', 'Statut', 'Status'), card.isVerified ? <Status key="s" kind="ok">{tx('موثّقة', 'Vérifiée', 'Verified')}</Status> : <Status key="s" kind="pending">{tx('قيد التوثيق', 'En vérification', 'Pending')}</Status>],
    [tx('نوع العضوية', 'Type de membre', 'Membership'), <span key="t" className="text-[15px] font-semibold">{gold ? 'VIP' : tx('مجانية', 'Gratuite', 'Free')}</span>],
  ];
  if (expiry) rows.push([tx('صالحة حتى', "Valable jusqu'au", 'Valid until'), <span key="e" dir="ltr" className="text-[15px] font-semibold tabular-nums">{expiry}</span>]);

  return (
    <div className="flex flex-col gap-8" data-testid="student-card-v2">
      <PageHead title={tx('بطاقة العضوية', 'Carte de membre', 'Membership card')} sub={tx('بطاقتك الرسمية، ورمز QR لملفك العام.', 'Votre carte officielle et le QR de votre profil public.', 'Your official card and the QR code of your public profile.')} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,460px)_1fr] lg:items-start">
        <div className="flex flex-col gap-5">
          <Scene label={tx('الوجه الأمامي للبطاقة', 'Recto de la carte', 'Card front')}><CardCanvas {...props} side="front" tier={tier} /></Scene>
          <Scene label={tx('الوجه الخلفي للبطاقة', 'Verso de la carte', 'Card back')}><CardCanvas {...props} side="back" tier={tier} /></Scene>
          {!gold ? (
            <section className="flex flex-col gap-3 pt-2" aria-label={tx('معاينة بطاقة VIP', 'Aperçu de la carte VIP', 'VIP card preview')}>
              <p className="text-[16px] font-semibold">{tx('بطاقتك بعد الترقية إلى VIP', 'Votre carte après le passage en VIP', 'Your card after upgrading to VIP')}</p>
              <Scene label={tx('بطاقة VIP', 'Carte VIP', 'VIP card')}><CardCanvas {...props} side="front" tier="vip" /></Scene>
            </section>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <SectionHead title={tx('تفاصيل البطاقة', 'Détails de la carte', 'Card details')} />
          <Panel className="flex flex-col gap-4">
            {rows.map(([k, v], i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <span className="text-[14px] text-sheet-muted">{k}</span>
                {v}
              </div>
            ))}
          </Panel>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2" role="group" aria-label={tx('وجه التصدير', "Face à exporter", 'Face to export')}>
              {(['front', 'back'] as const).map((f) => (
                <button key={f} type="button" aria-pressed={face === f} onClick={() => setFace(f)} className={`min-h-[44px] flex-1 rounded-full border text-[14px] font-semibold ${face === f ? 'border-sheet-text bg-sheet-text text-sheet' : 'border-sheet-line text-sheet-muted'}`}>
                  {f === 'front' ? tx('الوجه', 'Recto', 'Front') : tx('الظهر', 'Verso', 'Back')}
                </button>
              ))}
            </div>
            <Btn full onClick={png} disabled={busy !== null} data-testid="card-download-png-btn"><DownloadSimple size={20} aria-hidden="true" />{busy === 'png' ? t('card.generatingPng') : tx('تصدير PNG', 'Exporter en PNG', 'Export PNG')}</Btn>
            <Btn full variant="secondary" onClick={pdf} disabled={busy !== null} data-testid="card-download-pdf-btn"><FilePdf size={20} aria-hidden="true" />{busy === 'pdf' ? t('card.generatingPdf') : tx('تصدير PDF للطباعة', 'Exporter en PDF (impression)', 'Export print PDF')}</Btn>
            <Btn variant="text" href={`/${locale}/profile/${cardId}`}><ArrowSquareOut size={18} aria-hidden="true" />{tx('عرض ملفي العام', 'Voir mon profil public', 'View my public profile')}</Btn>
            <Btn variant="text" href={`/${locale}/student/settings`}>{tx('تعديل بياناتي', 'Modifier mes informations', 'Edit my details')}</Btn>
          </div>
        </div>
      </div>

      {/* Hidden full-size templates, captured 1:1 for PNG and PDF. */}
      <div style={{ position: 'fixed', top: 0, left: -9999, pointerEvents: 'none', opacity: 0 }} aria-hidden="true">
        <div ref={frontRef}><CardExportTemplate {...props} side="front" /></div>
        <div ref={backRef}><CardExportTemplate {...props} side="back" /></div>
      </div>
    </div>
  );
};
