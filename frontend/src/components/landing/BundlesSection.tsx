'use client';

import React, { useEffect, useState } from 'react';
import { Clock, BookOpen, ShoppingBag, Info } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { formatDZD } from '@/lib/format';
import { MockCheckoutModal } from './MockCheckoutModal';

const THEME: Record<string, string> = {
  lime: 'from-lime-100 to-white dark:from-lime-500/10 dark:to-transparent border-lime-300/50 dark:border-lime-400/20',
  gold: 'from-amber-100 to-white dark:from-gold-500/10 dark:to-transparent border-amber-300/50 dark:border-gold-500/20',
  sky: 'from-sky-100 to-white dark:from-sky-500/10 dark:to-transparent border-sky-300/50 dark:border-sky-400/20',
};

export const BundlesSection: React.FC = () => {
  const { locale } = useTranslation();
  const [bundles, setBundles] = useState<any[]>([]);
  const [activeBundle, setActiveBundle] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/bundles')
      .then((r) => r.json())
      .then(setBundles)
      .catch(() => {});
  }, []);

  if (bundles.length === 0) return null;

  return (
    <section id="bundles" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8" data-testid="landing-bundles">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">
          {locale === 'ar' ? 'حزم جاهزة للتفوق' : 'Bundles Prêts à Réussir'}
        </span>
        <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {locale === 'ar' ? 'حزم التحضير للامتحانات والمسابقات' : "Bundles de Préparation aux Examens"}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {bundles.map((b) => {
          const title = locale === 'ar' ? b.titleAr : b.titleFr || b.titleAr;
          const desc = locale === 'ar' ? b.descriptionAr : b.descriptionFr || b.descriptionAr;
          return (
            <div
              key={b.id}
              data-testid={`landing-bundle-card-${b.id}`}
              className={`p-6 rounded-3xl border bg-gradient-to-b ${THEME[b.colorTheme] || THEME.gold} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col`}
            >
              <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy-950 text-white text-[10px] font-black">
                {b.badge}
              </span>
              <h3 className="mt-3 text-sm font-black text-slate-900 dark:text-white leading-snug">{title}</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-gray-400 leading-relaxed flex-1">{desc}</p>

              <div className="mt-4 flex items-center gap-4 text-[11px] font-bold text-slate-700 dark:text-gray-300">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" /> {b.hours} {locale === 'ar' ? 'ساعة' : 'h'}</span>
                <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" /> {b.lecturesCount} {locale === 'ar' ? 'محاضرات' : 'lectures'}</span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-lg font-black text-slate-900 dark:text-white">{formatDZD(b.currentPriceDzd, locale)}</span>
                <span className="text-xs text-slate-400 line-through">{formatDZD(b.originalPriceDzd, locale)}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  data-testid={`buy-bundle-btn-${b.id}`}
                  onClick={() => setActiveBundle(b)}
                  className="py-2.5 rounded-xl bg-slate-950 dark:bg-lime-400 text-white dark:text-navy-950 font-black text-[11px] flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {locale === 'ar' ? 'اشترِ الباقة' : 'Acheter'}
                </button>
                <button
                  data-testid={`bundle-details-btn-${b.id}`}
                  onClick={() => setActiveBundle(b)}
                  className="py-2.5 rounded-xl border border-slate-300 dark:border-white/15 text-slate-700 dark:text-gray-300 font-bold text-[11px] flex items-center justify-center gap-1.5"
                >
                  <Info className="w-3.5 h-3.5" />
                  {locale === 'ar' ? 'التفاصيل' : 'Détails'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {activeBundle && <MockCheckoutModal bundle={activeBundle} onClose={() => setActiveBundle(null)} />}
    </section>
  );
};
