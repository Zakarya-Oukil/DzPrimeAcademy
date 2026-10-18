'use client';

import React, { useEffect, useState } from 'react';
import { use } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Btn } from '@/components/student-v2/ui';
import { Banner } from '@/components/shared-v2/Dialog';

interface VerifiedCard {
  cardId: string;
  holderName: string;
  role: string;
  institutionName: string | null;
  wilayaCode: number | null;
  wilayaName: string | null;
  isVerified: boolean;
  expiryDate: string | null;
}

export default function VerifyCardPage({
  params,
}: {
  params: Promise<{ locale: string; cardId: string }>;
}) {
  const resolvedParams = use(params);
  const { locale, cardId } = resolvedParams;
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [card, setCard] = useState<VerifiedCard | null>(null);

  useEffect(() => {
    fetch(`/api/card/verify/${encodeURIComponent(cardId)}`)
      .then((r) => r.json())
      .then((data) => {
        setIsValid(!!data.isValid);
        setCard(data.card || null);
      })
      .catch(() => setIsValid(false))
      .finally(() => setLoading(false));
  }, [cardId]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center" data-testid="verify-loading">
        <Loader2 className="w-6 h-6 text-gold-500 animate-spin" />
      </div>
    );
  }

  const roleLabel = card
    ? card.role === 'AMBASSADOR'
      ? t('brand.verifiedAmbassador')
      : card.role === 'OWNER' || card.role === 'ADMIN' || card.role === 'MODERATOR'
      ? t('roles.OWNER')
      : card.role === 'TEACHER'
      ? t('roles.TEACHER')
      : card.role === 'STUDENT_PAID'
      ? t('roles.STUDENT_PAID')
      : t('roles.STUDENT_FREE')
    : '';

  const ar = locale === 'ar';
  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-1 items-start justify-center px-4 py-10 sm:py-16">
      {!isValid || !card ? (
        <div className="flex w-full flex-col gap-[18px] rounded-[32px] bg-sheet p-6 text-sheet-text sm:p-10" data-testid="verify-invalid-card">
          <Banner kind="danger">{ar ? 'بطاقة غير صالحة' : 'Carte invalide'}</Banner>
          <p className="font-mono text-[14px] text-sheet-muted" dir="ltr">{cardId}</p>
          <p className="text-[15px] text-sheet-muted">{ar ? 'رقم البطاقة غير موجود في السجل الوطني للمنصة' : "Ce numéro de carte n'existe pas dans notre registre national"}</p>
          <Btn variant="secondary" full href={`/${locale}`}>{t('verify.backHome')}</Btn>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-[18px] rounded-[32px] bg-sheet p-6 text-sheet-text sm:p-10" data-testid="verify-valid-card">
          <Banner kind="ok">{t('verify.badgeValid')}</Banner>
          <h1 className="font-display-h text-[26px] leading-[1.3] sm:text-[32px]">{t('verify.title')}</h1>
          <p className="text-[15px] text-sheet-muted">{t('verify.subtitle')}</p>
          <dl className="flex flex-col gap-3 rounded-[16px] border border-sheet-line p-4 text-[14px]">
            {[
              [t('verify.memberName'), card.holderName],
              [t('verify.role'), roleLabel],
              [t('verify.cardId'), card.cardId],
              [t('verify.wilaya'), `${card.wilayaCode || 16} - ${card.wilayaName || 'Alger'}`],
              [t('verify.institution'), card.institutionName || '—'],
              [t('verify.validity'), card.expiryDate || '-'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4"><dt className="text-sheet-muted">{k}</dt><dd className="min-w-0 truncate font-semibold">{v}</dd></div>
            ))}
          </dl>
          <p className="text-[13px] text-sheet-muted">{t('verify.seal')}</p>
          <Btn full href={`/${locale}/profile/${cardId}`}>{ar ? 'عرض الملف الشخصي العام' : 'Voir le profil public'}</Btn>
          <Btn variant="secondary" full href={`/${locale}`}>{t('verify.backHome')}</Btn>
        </div>
      )}
    </div>
  );
}
