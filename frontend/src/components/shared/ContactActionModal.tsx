'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { ContactView } from '@/components/shared-v2/ContactView';

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
    <ContactView
      kind={isAccountActivation ? 'activation' : isAmbassadorApplication ? 'ambassador' : 'payment'}
      onClose={onClose}
      title={operation.title}
      amountDzd={operation.amountDzd}
      email={operation.user?.email}
      ambassadorHandle={contactSettings.ambassadorTelegram}
      contacted={contactedChannel}
      onContact={handleContact}
      resend={{ busy: resending, ok: resendSuccess, error: resendError, cooldown: resendCooldown, onResend: handleResendEmail }}
    />
  );
};
