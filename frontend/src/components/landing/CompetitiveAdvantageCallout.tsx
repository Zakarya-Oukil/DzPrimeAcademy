'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export const CompetitiveAdvantageCallout: React.FC = () => {
  const { locale } = useTranslation();

  const copy = {
    ar: {
      title: 'ما تتضمنه الحزم',
      body: 'ملخصات لجميع المقاييس، بنك امتحانات محلولة، مساندة مجانية في البكالوريا، وبث مباشر تفاعلي.',
      cta: 'استكشف الحزم',
    },
    fr: {
      title: 'Ce que contiennent les bundles',
      body: "Des résumés de chaque module, une banque d'annales corrigées, un accompagnement BAC et du direct interactif.",
      cta: 'Explorer les Bundles',
    },
    en: {
      title: 'What the bundles include',
      body: 'Module summaries, solved exam archives, free BAC support, and interactive live classes.',
      cta: 'Explore Bundles',
    },
  };
  const c = copy[locale] || copy.ar;

  return (
    <section className="px-3 sm:px-6 lg:px-8" data-testid="landing-competitive-advantage">
      <a
        href="#bundles"
        className="group block max-w-7xl mx-auto rounded-2xl p-7 sm:p-12 relative overflow-hidden bg-gold-400"
      >

        <div className="relative z-10 max-w-xl">
          <h2 className="text-2xl sm:text-4xl font-black text-navy-950 leading-tight">{c.title}</h2>
          <p className="mt-3 text-sm text-navy-900/80 font-semibold leading-relaxed">{c.body}</p>
          <span
            data-testid="landing-competitive-advantage-cta"
            className="dark mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-navy-950 text-white font-black text-xs group-hover:gap-3 transition-all"
          >
            {c.cta}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </a>
    </section>
  );
};
