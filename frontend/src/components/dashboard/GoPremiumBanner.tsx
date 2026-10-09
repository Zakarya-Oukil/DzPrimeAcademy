'use client';

import React from 'react';
import { Crown, Sparkles } from 'lucide-react';

interface GoPremiumBannerProps {
  locale: string;
  onUpgrade: () => void;
}

export const GoPremiumBanner: React.FC<GoPremiumBannerProps> = ({ locale, onUpgrade }) => {
  return (
    <button
      onClick={onUpgrade}
      data-testid="go-premium-banner"
      className="dark relative w-full text-left p-5 rounded-3xl bg-[#111114] border border-lime-500/30 text-white shadow-lg overflow-hidden group transition-transform"
    >
      <div className="relative z-10 flex items-center gap-2 mb-2">
        <Crown className="w-5 h-5 text-lime-400" />
        <span className="text-xs font-black text-lime-300">Go Premium / Gold VIP</span>
      </div>
      <h4 className="text-sm font-black relative z-10">
        {locale === 'ar' ? 'وصول مدى الحياة لكل الدورات والمواضيع' : 'Accès à vie à tous les cours et sujets'}
      </h4>
      <p className="text-[11px] text-gray-400 mt-1 relative z-10 max-w-xs">
        {locale === 'ar' ? 'بطاقة عضوية ذهبية VIP معتمدة رسمياً' : 'Carte Membership Gold VIP officielle'}
      </p>
      <span className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 rounded-xl bg-lime-400 text-navy-950 text-xs font-black relative z-10">
        <Sparkles className="w-3.5 h-3.5" />
        <span>{locale === 'ar' ? 'ترقية فورية' : 'Get Access'}</span>
      </span>
    </button>
  );
};
