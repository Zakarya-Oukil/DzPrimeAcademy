'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/store';
import { useAuthModal } from '@/lib/authModalContext';
import { ContactActionModal } from './ContactActionModal';
import { UpgradeView } from '@/components/shared-v2/Dialogs';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { t, locale } = useTranslation();
  const { currentUser } = useAuthStore();
  const { openAuth } = useAuthModal();
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [vipPrice, setVipPrice] = useState(10000);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data?.vipPriceDzd) setVipPrice(Number(data.vipPriceDzd));
      })
      .catch(() => {});
  }, []);

  const handleOpenContactPayment = () => {
    if (!currentUser) {
      onClose();
      openAuth('login');
      return;
    }
    setContactModalOpen(true);
  };

  if (!isOpen) return null;

  const contactModal = contactModalOpen ? (
    <ContactActionModal
          isOpen={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
          operation={{
            type: 'VIP_MEMBERSHIP_UPGRADE',
            title: locale === 'ar' ? 'ترقية العضوية الذهبية VIP' : 'Adhésion Gold VIP',
            amountDzd: vipPrice,
            details: 'DZ Prime Academy 2026 Annual Pass',
            user: currentUser ? {
              name: currentUser.name,
              email: currentUser.email,
              phone: currentUser.phone || undefined,
              wilayaName: currentUser.wilayaName || undefined,
            } : undefined,
          }}
        />
  ) : null;

  return (
    <>
      <UpgradeView onClose={onClose} sub={t('bot.upgradePrompt')} onPay={handleOpenContactPayment} />
      {contactModal}
    </>
  );
};

