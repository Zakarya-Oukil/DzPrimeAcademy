'use client';

import React from 'react';
import { X, MessageCircle, Send } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/store';
import { telegramUrl, useContactSettings, whatsappUrl } from '@/lib/contactLinks';

// Digital card activation: pick WhatsApp or Telegram, staff then activate Gold by hand (admin approvals).
export const CardActivationChooser: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { locale } = useTranslation();
  const { currentUser } = useAuthStore();
  const s = useContactSettings();
  if (!isOpen) return null;
  const isAr = locale === 'ar';

  const who = currentUser ? ` (${currentUser.name}${currentUser.email ? ` - ${currentUser.email}` : ''})` : '';
  const text = (isAr ? 'أريد تفعيل بطاقتي الرقمية' : 'Je souhaite activer ma carte numérique') + who;

  const contacts = [
    { name: isAr ? 'فريق DZ Prime' : "L'équipe DZ Prime", whatsapp: s.whatsappNumber, telegram: s.telegramUsername },
    ...s.officers.map((o) => ({ name: o.name, whatsapp: o.whatsapp, telegram: o.telegram })),
  ];

  const open = (url: string) => {
    if (currentUser) {
      fetch('/api/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'VIP_MEMBERSHIP_UPGRADE', channel: url.includes('t.me') ? 'TELEGRAM' : 'WHATSAPP' }),
      }).catch(() => {});
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'تفعيل البطاقة الرقمية' : 'Activer la carte numérique'}
      data-testid="card-activation-chooser"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-gold-500/40 bg-white dark:bg-[#0D152A] p-6 text-slate-900 dark:text-white shadow-2xl font-arabic"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={isAr ? 'إغلاق' : 'Fermer'}
          className="absolute top-4 end-4 p-2 rounded-full bg-slate-100 dark:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-xl font-black pe-10">{isAr ? 'تفعيل بطاقتك الرقمية' : 'Activer votre carte numérique'}</h3>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-gray-300">
          {isAr
            ? 'اختر وسيلة التواصل وسنفعّل عضويتك الذهبية يدوياً بعد التحقق.'
            : "Choisissez un canal de contact ; l'équipe active votre adhésion Gold manuellement."}
        </p>
        <div className="mt-5 space-y-4">
          {contacts.map((c) => (
            <div key={c.name} className="space-y-2">
              {contacts.length > 1 && <p className="text-xs font-bold text-slate-600 dark:text-gray-300">{c.name}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {c.whatsapp && (
                  <button
                    type="button"
                    data-testid="card-activation-whatsapp"
                    onClick={() => open(whatsappUrl(c.whatsapp!, text))}
                    className="p-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
                  </button>
                )}
                {c.telegram && (
                  <button
                    type="button"
                    data-testid="card-activation-telegram"
                    onClick={() => open(telegramUrl(c.telegram!, text))}
                    className="p-3.5 rounded-2xl bg-[#229ED9] hover:bg-[#1e8bc0] text-white font-black text-xs flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isAr ? 'تيليغرام' : 'Telegram'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
