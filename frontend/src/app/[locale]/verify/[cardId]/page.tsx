'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { CheckCircle2, XCircle, Award, Loader2 } from 'lucide-react';
import { DzPrimeLogo } from '@/components/shared/DzPrimeLogo';
import { useTranslation } from '@/lib/i18n/useTranslation';

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

  const roleLabel =
    card.role === 'AMBASSADOR'
      ? t('brand.verifiedAmbassador')
      : card.role === 'OWNER' || card.role === 'ADMIN' || card.role === 'MODERATOR'
      ? t('roles.OWNER')
      : card.role === 'TEACHER'
      ? t('roles.TEACHER')
      : card.role === 'STUDENT_PAID'
      ? t('roles.STUDENT_PAID')
      : t('roles.STUDENT_FREE');

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div
        data-testid="verify-valid-card"
        className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-gold-500/50 bg-white dark:bg-[#111114] p-6 sm:p-10 text-slate-900 dark:text-white shadow-xl dark:shadow-gold-glow-lg text-center relative overflow-hidden transition-colors"
      >
        {/* Background Aura */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-gold-500/15 rounded-full blur-3xl pointer-events-none" />

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
