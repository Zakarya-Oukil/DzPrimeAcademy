'use client';

import { useEffect, useState } from 'react';
import { readOfficers, type Officer } from '@/lib/officers';

export interface ContactSettings {
  whatsappNumber: string;
  telegramUsername: string;
  ambassadorTelegram: string;
  officers: Officer[]; // active registration officers, managed by admins in Settings
}

export const DEFAULT_CONTACTS: ContactSettings = {
  whatsappNumber: 'https://wa.me/qr/5473INCXN3HJI1',
  telegramUsername: 'dzprime_academy',
  ambassadorTelegram: 'MrK_ADMIN00',
  officers: [],
};

const handleOf = (raw: string) => raw.trim().replace(/^https?:\/\//, '').replace(/^t\.me\//, '').replace(/^@/, '');

export const telegramUrl = (raw: string, text?: string) =>
  `https://t.me/${handleOf(raw)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const whatsappUrl = (raw: string, text?: string) => {
  const r = raw.trim();
  const base = /^https?:\/\//.test(r) ? r : r.includes('wa.me/') ? `https://${r}` : `https://wa.me/${r.replace(/[^0-9]/g, '')}`;
  return text ? `${base}${base.includes('?') ? '&' : '?'}text=${encodeURIComponent(text)}` : base;
};

/** Public contact settings (WhatsApp, Telegram, ambassador Telegram) from /api/settings, with safe defaults. */
export function useContactSettings(): ContactSettings {
  const [s, setS] = useState(DEFAULT_CONTACTS);
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) =>
        setS({
          whatsappNumber: d?.whatsappNumber || DEFAULT_CONTACTS.whatsappNumber,
          telegramUsername: d?.telegramUsername || DEFAULT_CONTACTS.telegramUsername,
          ambassadorTelegram: d?.ambassadorTelegram || DEFAULT_CONTACTS.ambassadorTelegram,
          officers: readOfficers(d?.officers).filter((o) => o.active),
        })
      )
      .catch(() => {});
  }, []);
  return s;
}
