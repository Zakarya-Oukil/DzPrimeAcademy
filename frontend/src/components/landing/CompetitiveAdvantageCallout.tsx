'use client';

import React from 'react';
import { Tag, ArrowUpRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export const CompetitiveAdvantageCallout: React.FC = () => {
  const { locale } = useTranslation();

  const copy = {
    ar: {
      badge: 'DZ PRIME • EXCELLENCE',
      title: 'ميزتك التنافسية للتفوق',
      body: 'برامجنا تضمن لك ملخصات حصرية لجميع المقاييس، بنك امتحانات محلولة، مساندة مجانية في البكالوريا، وبث مباشر تفاعلي.',
      cta: 'استكشف الحزم',
    },
    fr: {
      badge: 'DZ PRIME • EXCELLENCE',
      title: 'Votre avantage compétitif',
      body: 'Nos programmes vous garantissent des résumés exclusifs de chaque module, une banque d\'annales corrigées, un accompagnement BAC et du direct live interactif.',
      cta: 'Explorer les Bundles',
    },
    en: {
      badge: 'DZ PRIME • EXCELLENCE',
      title: 'Your Competitive Advantage',
      body: 'Our programs guarantee exclusive module summaries, solved exam archives, free BAC support, and interactive live classes.',
      cta: 'Explore Bundles',
    },
  };
  const c = copy[locale] || copy.ar;

  return (
    <section className="px-3 sm:px-6 lg:px-8" data-testid="landing-competitive-advantage">
      <a
        href="#bundles"
        className="group block max-w-7xl mx-auto rounded-[2rem] sm:rounded-[2.5rem] p-7 sm:p-12 relative overflow-hidden bg-gold-400"
      >
        <div className="absolute -top-10 -left-10 w-56 h-56 rounded-full bg-white/20 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-lime-300/25 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-950/10 text-navy-950 text-[10px] font-black tracking-wide">
            <Tag className="w-3 h-3" />
            {c.badge}
          </span>
          <h2 className="mt-3 text-2xl sm:text-4xl font-black text-navy-950 leading-tight">{c.title}</h2>
          <p className="mt-3 text-sm text-navy-900/80 font-semibold leading-relaxed">{c.body}</p>
          <span
            data-testid="landing-competitive-advantage-cta"
            className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-navy-950 text-white font-black text-xs group-hover:gap-3 transition-all"
          >
            {c.cta}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </a>
    </section>
  );
};
