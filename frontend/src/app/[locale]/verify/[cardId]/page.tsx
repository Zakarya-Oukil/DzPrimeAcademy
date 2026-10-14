'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { CheckCircle2, XCircle, Award, Loader2 } from 'lucide-react';
import { DzPrimeLogo } from '@/components/shared/DzPrimeLogo';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useNewDesign } from '@/lib/newDesign';
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
  const newDesign = useNewDesign();

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

  if (newDesign) {
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
            <Btn full href={`/${locale}/profile/${card.cardId}`}>{ar ? 'عرض الملف الشخصي العام' : 'Voir le profil public'}</Btn>
            <Btn variant="secondary" full href={`/${locale}`}>{t('verify.backHome')}</Btn>
          </div>
        )}
      </div>
    );
  }

  if (!isValid || !card) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div
          className="w-full max-w-lg rounded-3xl border border-rose-300 dark:border-rose-500/40 bg-white dark:bg-[#111114] p-6 sm:p-10 text-center shadow-xl"
          data-testid="verify-invalid-card"
        >
          <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h1 className="text-lg sm:text-xl font-black font-arabic text-slate-900 dark:text-white">
            {locale === 'ar' ? 'بطاقة غير صالحة' : 'Carte invalide'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-2 font-mono">{cardId}</p>
          <p className="text-xs text-slate-600 dark:text-gray-300 font-arabic mt-3">
            {locale === 'ar'
              ? 'رقم البطاقة غير موجود في السجل الوطني للمنصة'
              : "Ce numéro de carte n'existe pas dans notre registre national"}
          </p>
          <Link
            href={`/${locale}`}
            className="inline-flex mt-6 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs items-center justify-center gap-2 transition-all"
          >
            {t('verify.backHome')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div
        data-testid="verify-valid-card"
        className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-gold-500/50 bg-white dark:bg-[#111114] p-6 sm:p-10 text-slate-900 dark:text-white shadow-xl dark:shadow-gold-glow-lg text-center relative overflow-hidden transition-colors"
      >
        {/* Background Aura */}

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <DzPrimeLogo size={48} showText={true} />
        </div>

        {/* Verification Status Badge */}
        <div className="my-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-bold font-arabic shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{t('verify.badgeValid')}</span>
        </div>

        <h1 className="text-lg sm:text-2xl font-black font-arabic text-slate-900 dark:text-gold-200">
          {t('verify.title')}
        </h1>
        <p className="text-xs text-slate-600 dark:text-gray-300 font-arabic mt-1">{t('verify.subtitle')}</p>

        {/* Details Grid */}
        <div className="my-6 space-y-3 bg-slate-50 dark:bg-navy-900/80 border border-slate-200 dark:border-gold-500/30 rounded-2xl p-5 text-left font-arabic text-xs shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-2">
            <span className="text-slate-500 dark:text-gray-400">{t('verify.memberName')}:</span>
            <strong className="text-slate-900 dark:text-white text-sm font-extrabold">{card.holderName}</strong>
          </div>

          <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-2">
            <span className="text-slate-500 dark:text-gray-400">{t('verify.role')}:</span>
            <span className="px-2.5 py-0.5 rounded-md bg-gold-500/20 text-gold-800 dark:text-gold-300 font-bold">
              {roleLabel}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-2">
            <span className="text-slate-500 dark:text-gray-400">{t('verify.cardId')}:</span>
            <strong className="font-mono text-gold-700 dark:text-gold-400 font-bold tracking-wider">{card.cardId}</strong>
          </div>

          <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-2">
            <span className="text-slate-500 dark:text-gray-400">{t('verify.wilaya')}:</span>
            <span className="text-slate-700 dark:text-gray-200">
              Wilaya {card.wilayaCode || 16} ({card.wilayaName || 'Alger'})
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-2">
            <span className="text-slate-500 dark:text-gray-400">{t('verify.institution')}:</span>
            <span className="text-slate-700 dark:text-gray-200 max-w-[220px] truncate">
              {card.institutionName || '—'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-gray-400">{t('verify.validity')}:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">{card.expiryDate || '-'}</span>
          </div>
        </div>

        {/* Official Security Watermark */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-gray-800 text-[11px] text-slate-500 dark:text-gray-400 font-arabic">
          <div className="flex items-center gap-1.5 text-gold-700 dark:text-gold-400">
            <Award className="w-4 h-4" />
            <span>{t('verify.seal')}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/profile/${card.cardId}`}
              className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-gold-glow"
            >
              <span>{locale === 'ar' ? 'عرض الملف الشخصي العام' : 'Voir Profil Public'}</span>
            </Link>

            <Link
              href={`/${locale}`}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-800 dark:text-gold-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <span>{t('verify.backHome')}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
