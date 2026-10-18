'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/store';
import { telegramUrl, useContactSettings, whatsappUrl } from '@/lib/contactLinks';
import { ChooserView } from '@/components/shared-v2/Dialogs';

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

  return <ChooserView onClose={onClose} contacts={contacts} onWhatsapp={(n) => open(whatsappUrl(n, text))} onTelegram={(h) => open(telegramUrl(h, text))} />;
};
