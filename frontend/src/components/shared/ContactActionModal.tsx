'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Send,
  MessageCircle,
  CheckCircle2,
  Sparkles,
  Crown,
  CreditCard,
  Phone,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Award,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { formatDZD } from '@/lib/format';

export type ContactModalOperationType =
  | 'ACCOUNT_ACTIVATION'
  | 'VIP_MEMBERSHIP_UPGRADE'
  | 'BUNDLE_PURCHASE'
  | 'COURSE_ENROLLMENT'
  | 'AMBASSADOR_APPLICATION'
  | 'MANUAL_PAYMENT';

export interface ContactModalOperation {
  type: ContactModalOperationType;
  title?: string;
  details?: string;
  amountDzd?: number;
  promoCode?: string;
  targetId?: string;
  user?: {
    name?: string;
    email?: string;
    phone?: string;
    wilayaName?: string;
  };
}

interface ContactActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  operation: ContactModalOperation;
}

export const ContactActionModal: React.FC<ContactActionModalProps> = ({
  isOpen,
  onClose,
  operation,
}) => {
  const { locale } = useTranslation();
  const isAr = locale === 'ar';

  const [contactSettings, setContactSettings] = useState({
    whatsappNumber: 'https://wa.me/qr/5473INCXN3HJI1',
    telegramUsername: 'dzprime_academy',
    ambassadorTelegram: 'MrK_ADMIN00',
  });

  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [contactedChannel, setContactedChannel] = useState<'WHATSAPP' | 'TELEGRAM' | null>(null);

  // Fetch admin configured channels
  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings')
        .then((r) => r.json())
        .then((data) => {
          if (data) {
            setContactSettings({
              whatsappNumber: data.whatsappNumber || 'https://wa.me/qr/5473INCXN3HJI1',
              telegramUsername: data.telegramUsername ? data.telegramUsername.replace('@', '') : 'dzprime_academy',
              ambassadorTelegram: data.ambassadorTelegram ? data.ambassadorTelegram.replace('@', '').replace('t.me/', '') : 'MrK_ADMIN00',
            });
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!isOpen) return null;

  const isAccountActivation = operation.type === 'ACCOUNT_ACTIVATION';
  const isAmbassadorApplication = operation.type === 'AMBASSADOR_APPLICATION';

  const buildPreFilledMessage = (channel: 'WHATSAPP' | 'TELEGRAM') => {
    const name = operation.user?.name || 'طالب';
    const email = operation.user?.email || '';
    const phone = operation.user?.phone || '';
    const wilaya = operation.user?.wilayaName || '';

    if (isAccountActivation) {
      return isAr
        ? `السلام عليكم DZ Prime Academy،\nأرغب في تأكيد تفعيل حسابي على المنصة.\nالاسم: ${name}\nالبريد الإلكتروني: ${email}\nالهاتف: ${phone}\nالولاية: ${wilaya}`
        : `Bonjour DZ Prime Academy,\nJe souhaite activer mon compte étudiant.\nNom: ${name}\nEmail: ${email}\nTéléphone: ${phone}\nWilaya: ${wilaya}`;
    }

    if (isAmbassadorApplication) {
      return isAr
        ? `السلام عليكم DZ Prime Academy،\nأرغب في التقديم للانضمام إلى شبكة السفراء المعتمدين لتمثيل الأكاديمية في ولايتي.\nالاسم: ${name}\nالهاتف: ${phone}\nالولاية: ${wilaya}`
        : `Bonjour DZ Prime Academy,\nJe souhaite postuler pour devenir Ambassadeur de l'académie dans ma wilaya.\nNom: ${name}\nTél: ${phone}\nWilaya: ${wilaya}`;
    }

    const opTitle = operation.title || 'طلب دفع';
    const amount = operation.amountDzd ? `${operation.amountDzd} DZD` : '';

    return isAr
      ? `السلام عليكم DZ Prime Academy،\nأرغب في إتمام عملية الدفع والتفعيل لـ: ${opTitle}\nالمبلغ: ${amount}\nالاسم: ${name}\nالبريد: ${email}\nالهاتف: ${phone}`
      : `Bonjour DZ Prime Academy,\nJe souhaite finaliser le paiement et l'activation pour: ${opTitle}\nMontant: ${amount}\nNom: ${name}\nEmail: ${email}\nTél: ${phone}`;
  };

  const handleContact = async (channel: 'WHATSAPP' | 'TELEGRAM') => {
    setContactedChannel(channel);

    // Record the operation in the database so admin gets live notification
    try {
      await fetch('/api/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: operation.type,
          channel,
          targetId: operation.targetId,
          title: operation.title,
          details: operation.details,
          promoCode: operation.promoCode,
          userName: operation.user?.name,
          userEmail: operation.user?.email,
          userPhone: operation.user?.phone,
          userWilaya: operation.user?.wilayaName,
        }),
      });
    } catch (e) {
      console.error('Failed to log contact operation:', e);
    }

    // Open chat / social in new tab
    if (channel === 'WHATSAPP') {
      const raw = (contactSettings.whatsappNumber || '').trim();
      const text = encodeURIComponent(buildPreFilledMessage('WHATSAPP'));
      
      if (raw.startsWith('http://') || raw.startsWith('https://')) {
        const sep = raw.includes('?') ? '&' : '?';
        window.open(`${raw}${sep}text=${text}`, '_blank');
      } else if (raw.includes('wa.me/')) {
        const url = raw.startsWith('wa.me/') ? `https://${raw}` : raw;
        const sep = url.includes('?') ? '&' : '?';
        window.open(`${url}${sep}text=${text}`, '_blank');
      } else {
        const cleanPhone = raw.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
      }
    } else if (channel === 'TELEGRAM') {
      const targetHandle = isAmbassadorApplication
        ? (contactSettings.ambassadorTelegram || 'MrK_ADMIN00')
        : (contactSettings.telegramUsername || 'dzprime_academy');
      const raw = targetHandle.trim();
      const text = encodeURIComponent(buildPreFilledMessage('TELEGRAM'));

      if (raw.startsWith('http://') || raw.startsWith('https://')) {
        const sep = raw.includes('?') ? '&' : '?';
        window.open(`${raw}${sep}text=${text}`, '_blank');
      } else if (raw.startsWith('t.me/')) {
        const sep = raw.includes('?') ? '&' : '?';
        window.open(`https://${raw}${sep}text=${text}`, '_blank');
      } else {
        const cleanUser = raw.replace('@', '');
        window.open(`https://t.me/${cleanUser}?text=${text}`, '_blank');
      }
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || !operation.user?.email) return;
    setResending(true);
    setResendSuccess('');
    setResendError('');

    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: operation.user.email,
          locale,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendSuccess(
          isAr
            ? 'تم إرسال رابط تفعيل جديد إلى بريدك! تفقد صندوق الوارد والبريد غير الهام (Spam).'
            : 'Un nouveau lien a été envoyé ! Vérifiez votre boîte de réception et vos spams.'
        );
        setResendCooldown(60);
      } else {
        setResendError(data.error || (isAr ? 'فشل إعادة الإرسال' : "Échec de l'envoi"));
      }
    } catch (err: any) {
      setResendError(err.message || (isAr ? 'خطأ في الاتصال' : 'Erreur réseau'));
    } finally {
      setResending(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        data-testid="contact-action-modal-backdrop"
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 16 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto no-scrollbar rounded-3xl border border-slate-200 dark:border-gold-500/40 bg-white dark:bg-gradient-to-b dark:from-[#0D152A] dark:to-[#060913] p-5 sm:p-7 text-slate-900 dark:text-white shadow-2xl my-auto font-arabic"
        >
          {/* Close button */}
          <button
            data-testid="contact-modal-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-navy-850 hover:bg-slate-200 dark:hover:bg-navy-800 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-300 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* ================= CASE 1: ACCOUNT ACTIVATION ================= */}
          {isAccountActivation ? (
            <div className="space-y-4">
              {/* Header Icon & Title */}
              <div className="text-center flex flex-col items-center pt-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-lime-500/20 via-emerald-500/20 to-lime-400/30 border border-lime-400/40 flex items-center justify-center mb-3 shadow-lg shadow-lime-500/10 relative">
                  <Mail className="w-8 h-8 text-lime-400 animate-bounce" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#0D152A]" />
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {isAr ? 'تحقق من بريدك الإلكتروني لتفعيل الحساب' : 'Vérifiez votre email pour activer le compte'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-300 mt-1.5 max-w-md leading-relaxed">
                  {isAr
                    ? 'أرسلنا رسالة تأكيد تتضمن زر تفعيل الحساب المباشر إلى بريدك:'
                    : 'Nous vous avons envoyé un lien de confirmation sécurisé à :'}
                </p>

                {operation.user?.email && (
                  <div className="mt-2.5 px-4 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-600 dark:text-lime-300 font-mono text-xs font-bold flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{operation.user.email}</span>
                  </div>
                )}
              </div>

              {/* Instructions Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2 text-xs">
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-gray-200">
                  <span className="w-5 h-5 rounded-full bg-lime-400 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    {isAr
                      ? 'افتح تطبيق البريد الإلكتروني أو Gmail وتفقد صندوق الوارد (Inbox).'
                      : 'Ouvrez votre application de messagerie ou Gmail.'}
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-gray-200">
                  <span className="w-5 h-5 rounded-full bg-lime-400 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    {isAr
                      ? 'اضغط على زر "تفعيل حسابي الآن" داخل الرسالة لبدء استخدام المنصة.'
                      : 'Cliquez sur le bouton "Activer mon compte" pour finaliser.'}
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-gray-200">
                  <span className="w-5 h-5 rounded-full bg-lime-400 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span className="text-slate-500 dark:text-gray-400 text-[11px]">
                    {isAr
                      ? 'إذا لم تجد الرسالة فوراً، يرجى تفقد مجلد الرسائل غير المرغوب فيها (Spam / Courrier indésirable).'
                      : 'Vérifiez également votre dossier Spams / Courrier indésirable.'}
                  </span>
                </div>
              </div>

              {/* Resend Action */}
              <div className="flex items-center justify-between px-1">
                <button
                  onClick={handleResendEmail}
                  disabled={resending || resendCooldown > 0}
                  className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline flex items-center gap-1.5 disabled:opacity-50 disabled:no-underline"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>
                    {resending
                      ? isAr
                        ? 'جارٍ الإرسال...'
                        : 'Envoi en cours...'
                      : resendCooldown > 0
                      ? isAr
                        ? `إعادة الإرسال بعد (${resendCooldown} ثانية)`
                        : `Renvoyer dans (${resendCooldown}s)`
                      : isAr
                      ? 'إعادة إرسال بريد التفعيل'
                      : "Renvoyer l'email d'activation"}
                  </span>
                </button>
              </div>

              {resendSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{resendSuccess}</span>
                </div>
              )}
              {resendError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{resendError}</span>
                </div>
              )}

              {/* Direct Support Section (WhatsApp + Telegram ONLY) */}
              <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                <p className="text-xs font-bold text-slate-700 dark:text-gray-300 mb-2.5">
                  {isAr
                    ? 'لم تستلم بريد التفعيل؟ تواصل معنا مباشرة وسنقوم بتفعيل حسابك فوراً:'
                    : "Vous n'avez pas reçu l'email ? Contactez-nous directement pour activation immédiate :"}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* WhatsApp Button */}
                  <button
                    data-testid="contact-modal-whatsapp-btn"
                    onClick={() => handleContact('WHATSAPP')}
                    className="p-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 active:scale-95 transition-all"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>{isAr ? 'تواصل عبر واتساب (WhatsApp)' : 'Contacter par WhatsApp'}</span>
                  </button>

                  {/* Telegram Button */}
                  <button
                    data-testid="contact-modal-telegram-btn"
                    onClick={() => handleContact('TELEGRAM')}
                    className="p-3.5 rounded-2xl bg-[#229ED9] hover:bg-[#1e8bc0] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#229ED9]/20 active:scale-95 transition-all"
                  >
                    <Send className="w-4 h-4 fill-white" />
                    <span>{isAr ? 'تواصل عبر تيليغرام (Telegram)' : 'Contacter sur Telegram'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : isAmbassadorApplication ? (
            /* ================= CASE 3: AMBASSADOR APPLICATION (TELEGRAM ONLY) ================= */
            <div className="space-y-4">
              <div className="text-center flex flex-col items-center pt-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500/20 via-blue-500/20 to-sky-400/30 border border-sky-400/40 flex items-center justify-center mb-3 shadow-lg shadow-sky-500/10">
                  <Award className="w-8 h-8 text-sky-400" />
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {isAr ? 'التقديم لشبكة السفراء المعتمدين' : 'Candidature Ambassadeur Officiel'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-300 mt-1 max-w-md">
                  {isAr
                    ? 'انضم لنخبة ممثلي DZ Prime Academy في جامعتك وولايتك. يتم تقديم الطلبات حصرياً عبر مسؤول السفراء في تيليغرام:'
                    : "Rejoignez l'élite des ambassadeurs dans votre wilaya. Candidatures gérées exclusivement via Telegram :"}
                </p>
              </div>

              {/* Ambassador Info Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-white dark:from-[#0E1528] dark:to-[#080D1A] border border-slate-200 dark:border-sky-500/30 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                  <span className="font-bold text-slate-600 dark:text-gray-300">
                    {isAr ? 'المسؤول المعتمد:' : 'Responsable Officiel :'}
                  </span>
                  <span className="font-black text-sky-600 dark:text-sky-400 font-mono">
                    @{contactSettings.ambassadorTelegram.replace('@', '').replace('t.me/', '')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-gray-400 space-y-1">
                  <div>🇩🇿 {isAr ? 'تمثيل الأكاديمية في 58 ولاية وتنسيق العمليات الطلابية.' : 'Représentation dans les 58 wilayas.'}</div>
                  <div>💰 {isAr ? 'عمولات مالية وبطاقة سفير رقمية مشفرة معتمدة.' : 'Commissions et carte officielle accréditée.'}</div>
                </div>
              </div>

              {/* Action Button: TELEGRAM ONLY */}
              <div className="pt-2">
                <button
                  data-testid="contact-modal-ambassador-telegram-btn"
                  onClick={() => handleContact('TELEGRAM')}
                  className="w-full p-4 rounded-2xl bg-[#229ED9] hover:bg-[#1c8ec4] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-[#229ED9]/25 active:scale-95 transition-all"
                >
                  <Send className="w-5 h-5 fill-white shrink-0" />
                  <span>
                    {isAr
                      ? `مراسلة إدارة السفراء عبر تيليغرام (@${contactSettings.ambassadorTelegram.replace('@', '').replace('t.me/', '')})`
                      : `Contacter via Telegram (@${contactSettings.ambassadorTelegram.replace('@', '').replace('t.me/', '')})`}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= CASE 2: PAYMENTS & ADMIN INTERACTIONS ================= */
            <div className="space-y-4">
              {/* Header Icon & Title */}
              <div className="text-center flex flex-col items-center pt-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-gold-500/20 via-amber-500/20 to-yellow-400/30 border border-gold-400/40 flex items-center justify-center mb-3 shadow-lg shadow-gold-500/10">
                  <Crown className="w-8 h-8 text-gold-400" />
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-transparent dark:bg-gradient-to-r dark:from-gold-300 dark:via-gold-400 dark:to-yellow-400 dark:bg-clip-text">
                  {isAr ? 'إتمام الدفع وتفعيل الخدمة' : 'Paiement & Activation Immédiate'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-300 mt-1 max-w-md">
                  {isAr
                    ? 'بوابة الدفع التلقائي قيد التطوير. يتم الدفع والتفعيل الفوري عبر مسؤولي المنصة:'
                    : 'Portail de paiement en cours d’intégration. Activation manuelle immédiate via support :'}
                </p>
              </div>

              {/* Order Summary Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-white dark:from-[#0E1528] dark:to-[#080D1A] border border-slate-200 dark:border-gold-500/30 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-white/10">
                  <span className="font-bold text-slate-600 dark:text-gray-300">
                    {isAr ? 'الخدمة المطلوبة:' : 'Service demandé :'}
                  </span>
                  <span className="font-black text-slate-900 dark:text-white font-arabic">
                    {operation.title || (isAr ? 'ترقية العضوية' : 'Mise à niveau')}
                  </span>
                </div>

                {operation.amountDzd !== undefined && operation.amountDzd > 0 && (
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-white/10">
                    <span className="font-bold text-slate-600 dark:text-gray-300">
                      {isAr ? 'المبلغ المطلوب:' : 'Montant :'}
                    </span>
                    <span className="text-base font-black text-lime-600 dark:text-lime-400 font-mono">
                      {formatDZD(operation.amountDzd, locale)}
                    </span>
                  </div>
                )}

                <div className="text-[11px] text-slate-500 dark:text-gray-400 space-y-1">
                  <div>
                    💳 {isAr ? 'طرق الدفع المعتمدة: بريدي موب (BaridiMob) • البطاقة الذهبية • CCP' : 'Modes acceptés : BaridiMob • Edahabia • CCP'}
                  </div>
                  <div>
                    ⚡ {isAr ? 'تفعيل فوري خلال دقائق بمجرد إرسال وصل التحويل للإدارة.' : 'Activation en quelques minutes après envoi du reçu.'}
                  </div>
                </div>
              </div>

              {/* Action Buttons (WhatsApp & Telegram ONLY) */}
              <div className="pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* WhatsApp Button */}
                  <button
                    data-testid="contact-modal-whatsapp-pay-btn"
                    onClick={() => handleContact('WHATSAPP')}
                    className="p-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/25 active:scale-95 transition-all"
                  >
                    <MessageCircle className="w-4 h-4 fill-white shrink-0" />
                    <span>{isAr ? 'الدفع والتفعيل عبر واتساب' : 'Payer via WhatsApp'}</span>
                  </button>

                  {/* Telegram Button */}
                  <button
                    data-testid="contact-modal-telegram-pay-btn"
                    onClick={() => handleContact('TELEGRAM')}
                    className="p-4 rounded-2xl bg-[#229ED9] hover:bg-[#1e8bc0] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#229ED9]/25 active:scale-95 transition-all"
                  >
                    <Send className="w-4 h-4 fill-white shrink-0" />
                    <span>{isAr ? 'الدفع والتفعيل عبر تيليغرام' : 'Payer via Telegram'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback after clicking contact channel */}
          {contactedChannel && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-400 text-xs font-bold"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {isAr
                  ? `تم تسجيل طلبك لدى الإدارة وتوجيهك إلى ${contactedChannel === 'WHATSAPP' ? 'واتساب' : 'تيليغرام'} — سيتم تفعيل حسابك فور استلام رسالتك!`
                  : `Votre demande est enregistrée auprès de l'administration — activation dès réception de votre message !`}
              </span>
            </motion.div>
          )}

          {/* Footer note */}
          <div className="mt-5 pt-3 border-t border-slate-200 dark:border-white/5 text-center">
            <span className="text-[10px] text-slate-400 dark:text-gray-500 font-mono">
              DZ PRIME ACADEMY 2026 • 58 WILAYAS OFFICIAL SUPPORT
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
