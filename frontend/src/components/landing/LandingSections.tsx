'use client';

import { Send, Award, Globe2, MapPinned } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthModal } from '@/lib/authModalContext';
import { WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';
import { telegramUrl, useContactSettings } from '@/lib/contactLinks';

export const LandingSections: React.FC = () => {
  const { locale } = useTranslation();
  const { openAuth } = useAuthModal();
  const { ambassadorTelegram } = useContactSettings();

  const wilayaNames = WILAYAS.map((w) => getLocalizedWilayaName(w, locale));

  const copy = {
    ar: {
      badge1: 'تغطية وطنية',
      badge2: '58 ولاية',
      title: 'شبكة سفراء وأساتذة معتمدين في 58 ولاية',
      body: 'تصلك بسفراء، أساتذة، ومكوّنين معتمدين من أجل أفضل مساندة، تحضير، ومتابعة أينما كنت.',
      ctaPrimary: 'تصفح دليل السفراء في ولايتك',
      ctaSecondary: 'كن سفيراً معتمداً',
      finalTitle: 'جاهز للانطلاق مع DZ Prime؟',
      finalBody: 'انضم لآلاف الطلبة الجزائريين يحققون التميز الأكاديمي كل يوم.',
      finalCta: 'أنشئ حسابك المجاني',
    },
    fr: {
      badge1: 'Couverture Nationale',
      badge2: '58 Wilayas',
      title: 'Réseau d\'ambassadeurs et professeurs certifiés dans 58 wilayas',
      body: 'Connectez-vous avec des ambassadeurs, professeurs et formateurs certifiés pour le meilleur accompagnement.',
      ctaPrimary: 'Voir les ambassadeurs de ma wilaya',
      ctaSecondary: 'Devenir Ambassadeur',
      finalTitle: 'Prêt à décoller avec DZ Prime ?',
      finalBody: 'Rejoignez des milliers d\'étudiants algériens qui excellent chaque jour.',
      finalCta: 'Créer mon compte gratuit',
    },
    en: {
      badge1: 'Nationwide Coverage',
      badge2: '58 Wilayas',
      title: 'Certified Ambassador & Teacher Network in 58 Wilayas',
      body: 'Connect with certified ambassadors, teachers and trainers for the best support and follow-up.',
      ctaPrimary: 'Browse Ambassadors in Your Wilaya',
      ctaSecondary: 'Become an Ambassador',
      finalTitle: 'Ready to Launch with DZ Prime?',
      finalBody: 'Join thousands of Algerian students achieving academic excellence every day.',
      finalCta: 'Create My Free Account',
    },
  };
  const c = copy[locale] || copy.ar;

  return (
    <div className="space-y-16 sm:space-y-20 py-16 sm:py-20" data-testid="landing-sections">
      {/* ================= WILAYA MARQUEE + AMBASSADOR NETWORK ================= */}
      <section className="overflow-hidden" data-testid="landing-wilaya-network">
        <div className="max-w-2xl mx-auto mb-8 px-3 text-center">
          <div className="flex items-center justify-center gap-2 flex-wrap mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/40 text-gold-800 dark:text-gold-300 text-[10px] font-black">
              <Globe2 className="w-3 h-3" /> {c.badge1}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/40 text-gold-800 dark:text-gold-300 text-[10px] font-black">
              <MapPinned className="w-3 h-3" /> {c.badge2}
            </span>
          </div>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{c.title}</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">{c.body}</p>
        </div>

        <div className="space-y-3">
          <div className="marquee-track">
            {[...wilayaNames, ...wilayaNames].map((name, i) => (
              <span key={i} className="mx-2.5 px-4 py-2 rounded-full bg-white dark:bg-navy-900 border border-gold-500/30 text-gold-800 dark:text-gold-300 text-xs font-bold whitespace-nowrap">
                {name}
              </span>
            ))}
          </div>
          <div className="marquee-track marquee-track-rtl">
            {[...wilayaNames, ...wilayaNames].reverse().map((name, i) => (
              <span key={i} className="mx-2.5 px-4 py-2 rounded-full bg-white dark:bg-navy-900 border border-gold-500/30 text-gold-800 dark:text-gold-300 text-xs font-bold whitespace-nowrap">
                {name}
              </span>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto mt-10 px-3">
          <div className="p-5 sm:p-7 rounded-3xl bg-gold-500/10 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center gap-4">
            <a
              href={`/${locale}/ambassadors`}
              data-testid="landing-ambassadors-directory-btn"
              className="flex-1 w-full px-5 py-3 rounded-2xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-black text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Award className="w-3.5 h-3.5" />
              {c.ctaPrimary}
            </a>
            <a
              href={telegramUrl(ambassadorTelegram)}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="landing-ambassador-contact-btn"
              className="flex-1 w-full px-5 py-3 rounded-2xl border border-white/15 text-slate-700 dark:text-gray-200 font-black text-xs flex items-center justify-center gap-2 transition-colors hover:bg-white/10 active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{c.ctaSecondary}</span>
            </a>
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8" data-testid="landing-final-cta">
        <div className="rounded-3xl sm:rounded-[2.5rem] bg-white dark:bg-[#111114] border border-slate-200 dark:border-white/10 p-8 sm:p-14 text-center relative overflow-hidden">
          <div className="hidden" />
          <h2 className="relative z-10 text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">{c.finalTitle}</h2>
          <p className="relative z-10 mt-3 text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">{c.finalBody}</p>
          <button
            type="button"
            onClick={() => openAuth('register')}
            data-testid="landing-final-cta-btn"
            className="relative z-20 mt-6 px-8 py-3.5 rounded-2xl bg-lime-400 hover:bg-lime-300 active:scale-95 text-navy-950 font-black text-sm transition-all cursor-pointer inline-flex items-center justify-center"
          >
            {c.finalCta}
          </button>
        </div>
      </section>
    </div>
  );
};
