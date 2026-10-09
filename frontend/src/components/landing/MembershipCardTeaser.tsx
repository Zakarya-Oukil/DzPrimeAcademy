'use client';

import { useState } from 'react';
import { ShieldCheck, QrCode, Mail, Phone, Globe } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { CardActivationChooser } from '../shared/CardActivationChooser';

export const MembershipCardTeaser: React.FC = () => {
  const { locale } = useTranslation();
  const [cardModalOpen, setCardModalOpen] = useState(false);

  const copy = {
    ar: {
      title: 'بطاقة العضوية الرقمية المشفّرة',
      body: 'DZ Prime تمنحك الحق في تتبع كافة موادك الرقمية وفتح جميع الدروس والورشات، بتحقق فوري عبر رمز QR.',
      cta: 'فعّل بطاقتك الرقمية',
    },
    fr: {
      title: 'Carte de Membre Numérique Chiffrée',
      body: 'DZ Prime vous donne accès à toutes vos matières numériques et débloque tous les cours, vérifiable instantanément par QR.',
      cta: 'Activer ma carte',
    },
    en: {
      title: 'Encrypted Digital Membership Card',
      body: 'DZ Prime grants you access to all your digital subjects and unlocks every lesson, instantly verifiable via QR.',
      cta: 'Activate My Card',
    },
  };
  const c = copy[locale] || copy.ar;

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8" data-testid="landing-membership-teaser">
      <div className="rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-white/10 p-7 sm:p-12 flex flex-col lg:flex-row items-center gap-8 sm:gap-12">
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{c.title}</h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md">{c.body}</p>
          <button
            type="button"
            onClick={() => setCardModalOpen(true)}
            data-testid="landing-membership-cta"
            className="mt-6 px-6 py-3.5 rounded-2xl bg-lime-400 hover:bg-lime-300 active:scale-95 text-navy-950 font-black text-sm transition-all cursor-pointer inline-flex items-center justify-center"
          >
            {c.cta}
          </button>
        </div>

        <div className="w-full max-w-[300px] shrink-0">
          <div className="dark rounded-2xl p-5 bg-navy-900 border border-gold-500/30 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-gold-300 tracking-widest">DZ PRIME ACADEMY</span>
              <QrCode className="w-7 h-7 text-white/80" />
            </div>
            <p className="text-sm font-black text-white">DZ-PRIME-••••-2026</p>
            <p className="text-[10px] text-slate-400 mt-1">{locale === 'ar' ? 'بطاقة عضوية موثّقة' : 'Carte Vérifiée'}</p>
            <div className="mt-5 pt-4 border-t border-white/10 space-y-1.5 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> contact@dzprimeacademy.live</div>
              <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> +213 (0) 555 93 54 20</div>
              <div className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> dzprimeacademy.live</div>
            </div>
          </div>
        </div>
      </div>

      <CardActivationChooser isOpen={cardModalOpen} onClose={() => setCardModalOpen(false)} />
    </section>
  );
};
