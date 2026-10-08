'use client';

import React from 'react';
import { UserPlus, Bot, Video } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

const STEPS = [
  {
    icon: UserPlus,
    ar: { title: 'سجّل مجاناً واختر مسارك', desc: 'أنشئ حسابك واختر شعبتك: BAC، جامعي LMD، أو طب — في دقيقة واحدة.' },
    fr: { title: 'Inscrivez-vous et choisissez votre filière', desc: 'Créez votre compte et choisissez BAC, LMD ou Médecine en 1 minute.' },
    en: { title: 'Register & Choose Your Track', desc: 'Create your account and pick BAC, LMD or Medicine in one minute.' },
  },
  {
    icon: Bot,
    ar: { title: 'استخدم مساعد الامتحانات والملخصات', desc: 'دعه يجهز لك ملخصات المقاييس المركزة، بطاقات القوانين، وبنك الامتحانات الشامل.' },
    fr: { title: 'Assistant examens : résumés & annales', desc: 'Accédez aux résumés de cours condensés, fiches de formules et annales officielles.' },
    en: { title: 'Exam assistant: summaries & exam bank', desc: 'Instantly get high-yield module summaries, formula cheat sheets, and verified exam archives.' },
  },
  {
    icon: Video,
    ar: { title: 'راجع الملخصات وخض الامتحانات أو تابع المباشر', desc: 'ثبّت مكتسباتك بالملخصات المركزة، حل مواضيع السنوات السابقة، أو انضم للحصص التفاعلية.' },
    fr: { title: 'Révisez vos résumés et traitez les annales', desc: 'Maîtrisez les concepts clés grâce aux résumés synthétiques ou suivez le direct interactif.' },
    en: { title: 'Study Module Summaries & Tackle Past Exams', desc: 'Master key concepts through condensed digests, practice with solved archives, or join live classes.' },
  },
];

export const ThreeStepsSection: React.FC = () => {
  const { locale } = useTranslation();

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8" data-testid="landing-three-steps">
      <div className="rounded-[2rem] sm:rounded-[2.5rem] bg-white dark:bg-[#111114] border border-slate-200 dark:border-white/10 p-7 sm:p-12">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-semibold text-gold-700 dark:text-gold-400">
            {locale === 'ar' ? 'ابدأ بثلاث خطوات فقط' : 'Commencez en 3 étapes'}
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {locale === 'ar' ? 'احصل على مسارك في 3 خطوات بسيطة' : 'Votre parcours en 3 étapes simples'}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const c = step[locale] || step.ar;
            return (
              <div key={i} data-testid={`landing-step-${i + 1}`} className="relative p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
                <span className="absolute -top-3.5 right-5 w-8 h-8 rounded-full bg-lime-400 text-navy-950 text-xs font-black flex items-center justify-center shadow-lg">
                  {i + 1}
                </span>
                <div className="w-11 h-11 rounded-2xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-gold-700 dark:text-gold-400" />
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">{c.title}</h4>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{c.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
