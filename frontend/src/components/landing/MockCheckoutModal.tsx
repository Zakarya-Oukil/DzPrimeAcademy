'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, BookOpen, CheckCircle2, Sparkles, Loader2, LogIn, Tag, Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/store';
import { useAuthModal } from '@/lib/authModalContext';
import { formatDZD } from '@/lib/format';
import { ContactActionModal } from '@/components/shared/ContactActionModal';

interface MockCheckoutModalProps {
  bundle: any;
  onClose: () => void;
}

export const MockCheckoutModal: React.FC<MockCheckoutModalProps> = ({ bundle, onClose }) => {
  const { locale } = useTranslation();
  const { currentUser } = useAuthStore();
  const { openAuth } = useAuthModal();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountPercent: number;
    descriptionAr: string;
  } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  const title = locale === 'ar' ? bundle.titleAr : bundle.titleFr || bundle.titleAr;
  const desc = locale === 'ar' ? bundle.descriptionAr : bundle.descriptionFr || bundle.descriptionAr;

  const basePrice = bundle.currentPriceDzd;
  const effectivePrice = appliedPromo
    ? Math.round(basePrice * (1 - appliedPromo.discountPercent / 100))
    : basePrice;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;
    setPromoError('');
    setIsValidatingPromo(true);

    try {
      const res = await fetch(`/api/promotions?validate=${encodeURIComponent(promoCodeInput.trim())}&track=${encodeURIComponent(bundle.track)}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedPromo(data);
      } else {
        setPromoError(data.error || (locale === 'ar' ? 'كود التخفيض غير صالح' : 'Code promo invalide'));
      }
    } catch {
      setPromoError(locale === 'ar' ? 'خطأ في التحقق من الكود' : 'Erreur de validation');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleConfirm = () => {
    setContactModalOpen(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
        data-testid="mock-checkout-modal-backdrop"
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          onClick={(e) => e.stopPropagation()}
          data-testid="mock-checkout-modal"
          className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0C1428] border border-slate-200 dark:border-white/10 p-6 relative font-arabic shadow-2xl"
        >
          <button
            data-testid="mock-checkout-close-btn"
            aria-label="Close"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-600 dark:text-amber-300 text-[10px] font-black">
            <Sparkles className="w-3 h-3" />
            {locale === 'ar' ? 'عرض ترويجي خاص 2026' : 'Offre Promotionnelle 2026'}
          </span>

          <h3 className="mt-3 text-base font-black text-slate-900 dark:text-white leading-snug">{title}</h3>
          <p className="mt-2 text-xs text-slate-500 dark:text-gray-400 leading-relaxed">{desc}</p>

          <div className="mt-4 flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-gray-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-lime-500" /> {bundle.hours} {locale === 'ar' ? 'ساعة' : 'h'}
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-lime-500" /> {bundle.lecturesCount} {locale === 'ar' ? 'محاضرات' : 'lectures'}
            </span>
          </div>

          {/* Pricing Box */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-lime-600 dark:text-lime-400">
                  {formatDZD(effectivePrice, locale)}
                </span>
                <span className="text-xs text-slate-400 line-through mr-2 font-mono">
                  {formatDZD(bundle.originalPriceDzd, locale)}
                </span>
              </div>
              {appliedPromo && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black font-mono">
                  -{appliedPromo.discountPercent}% APPLIED
                </span>
              )}
            </div>

            {/* Promo code input form */}
            {!appliedPromo ? (
              <form onSubmit={handleApplyPromo} className="pt-2 flex items-center gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={locale === 'ar' ? 'كود التخفيض (مثال: BAC20)' : 'Code promo (ex: BAC20)'}
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    className="w-full pr-8 pl-3 py-1.5 rounded-xl bg-white dark:bg-[#070B16] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-gold-400 uppercase"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isValidatingPromo || !promoCodeInput.trim()}
                  className="px-3 py-1.5 rounded-xl bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-navy-950 font-bold text-xs shrink-0"
                >
                  {isValidatingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (locale === 'ar' ? 'تطبيق' : 'Appliquer')}
                </button>
              </form>
            ) : (
              <div className="pt-1 flex items-center justify-between text-xs text-emerald-500 font-bold">
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{locale === 'ar' ? `تم تفعيل الكود: ${appliedPromo.code}` : `Code activé: ${appliedPromo.code}`}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedPromo(null);
                    setPromoCodeInput('');
                  }}
                  className="text-[10px] text-slate-400 hover:text-rose-400 underline"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Retirer'}
                </button>
              </div>
            )}

            {promoError && <p className="text-[11px] text-rose-500 font-bold">{promoError}</p>}
          </div>

          {!currentUser ? (
            <button
              data-testid="mock-checkout-login-btn"
              onClick={() => {
                onClose();
                openAuth('register');
              }}
              className="mt-5 w-full py-3.5 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {locale === 'ar' ? 'سجّل مجاناً لإكمال الشراء' : "S'inscrire pour continuer"}
            </button>
          ) : (
            <button
              data-testid="mock-checkout-confirm-btn"
              onClick={handleConfirm}
              className="mt-5 w-full py-3.5 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{locale === 'ar' ? 'إتمام الشراء وتأكيد الدفع (واتساب / تيليغرام)' : 'Payer via WhatsApp / Telegram'}</span>
            </button>
          )}
        </motion.div>
      </motion.div>

      {contactModalOpen && (
        <ContactActionModal
          isOpen={contactModalOpen}
          onClose={() => {
            setContactModalOpen(false);
            onClose();
          }}
          operation={{
            type: 'BUNDLE_PURCHASE',
            title,
            amountDzd: effectivePrice,
            promoCode: appliedPromo?.code,
            details: `ID: ${bundle.id}${appliedPromo ? ` (Promo: ${appliedPromo.code} -${appliedPromo.discountPercent}%)` : ''}`,
            targetId: bundle.id,
            user: currentUser ? {
              name: currentUser.name,
              email: currentUser.email,
              phone: currentUser.phone || undefined,
              wilayaName: currentUser.wilayaName || undefined,
            } : undefined,
          }}
        />
      )}
    </AnimatePresence>
  );
};

