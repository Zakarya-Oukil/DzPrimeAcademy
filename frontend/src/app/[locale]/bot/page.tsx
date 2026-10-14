'use client';

import React from 'react';
import { DecisionTreeBot } from '@/components/bot/DecisionTreeBot';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { V2Gate } from '@/components/student-v2/Gate';
import { StudentBotV2 } from '@/components/student-v2/Bot';

function LegacyBotPage() {
  const { t } = useTranslation();

  return (
    <div className="py-8 sm:py-10 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 select-none font-arabic">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-arabic text-slate-900 dark:text-white">
          {t('bot.title')}
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-gray-300 font-arabic mt-2 max-w-2xl mx-auto">
          {t('bot.subtitle')}
        </p>
      </div>

      <DecisionTreeBot />
    </div>
  );
}

export default function BotPage() {
  return <V2Gate allow="all" v2={<StudentBotV2 />} legacy={<LegacyBotPage />} />;
}
