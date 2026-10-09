'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, CreditCard, Sparkles, QrCode, CheckCircle2, ShieldCheck, Download, X } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { isGoldenMember } from '@/lib/rbac';
import { MembershipCard } from './MembershipCard';

export const SidebarCardWidget: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { t, locale, isRtl } = useTranslation();
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  const isGold = isGoldenMember(currentUser);
  const cardId = currentUser?.studentCardId || 'DZ-STU-16-4412';
  const userName = currentUser?.name || (locale === 'ar' ? 'طالب جزائري' : 'Étudiant');

  return (
    <>
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsCardModalOpen(true)}
        className="relative group w-full p-3.5 sm:p-4 rounded-2xl bg-gold-500 text-navy-950 shadow-md cursor-pointer overflow-hidden transition-all duration-300 select-none border border-gold-600/40"
      >

        {/* Top Header: Badge & Arrow Action Button */}
        <div className="flex items-center justify-between gap-2 mb-2.5 relative z-10">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/10 text-[10px] font-black tracking-wider uppercase">
            <QrCode className="w-3 h-3 text-slate-900" />
            <span className="font-mono">{cardId}</span>
          </div>

          <div className="w-7 h-7 rounded-full bg-slate-950 text-lime-300 flex items-center justify-center shadow-sm group-hover:bg-black group- transition-all shrink-0">
            <ArrowUpRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-[-90deg]' : ''}`} />
          </div>
        </div>

        {/* Title & Description */}
        <div className="relative z-10 text-left font-arabic">
          <div className="flex items-center gap-1">
            <h4 className="text-xs sm:text-[13px] font-black text-slate-950 leading-tight">
              {t('dashboard.downloadAppCard')}
            </h4>
            {isGold && (
              <span className="px-1.5 py-0.2 rounded bg-amber-400 text-[9px] font-extrabold text-navy-950">
                VIP
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-800 font-semibold mt-0.5 line-clamp-1">
            {userName} • {currentUser?.wilayaName || 'Alger'}
          </p>
        </div>

        {/* Bottom Micro Visual Elements (like in the image) */}
        <div className="mt-2.5 pt-2 border-t border-black/10 flex items-center justify-between text-[9px] font-bold text-slate-800 relative z-10">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-800" />
            <span>{t('card.verifiedBadge')}</span>
          </span>
          <span className="text-[9px] font-mono font-black text-slate-950">
            DZ PRIME
          </span>
        </div>
      </motion.div>

      {/* Full Digital Membership Card Interactive Modal */}
      <AnimatePresence>
        {isCardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 dark:bg-navy-950/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto no-scrollbar rounded-3xl border border-slate-200 dark:border-gold-500/40 bg-white dark:bg-[#070D1F] p-4 sm:p-8 text-slate-900 dark:text-white shadow-2xl my-auto text-center"
            >
              {/* Close button */}
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 rounded-full bg-slate-100 dark:bg-navy-850 hover:bg-slate-200 dark:hover:bg-navy-800 border border-slate-200 dark:border-gold-500/30 text-slate-500 dark:text-gray-300 transition-all touch-target"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-4">
                <h3 className="text-lg sm:text-2xl font-black font-arabic text-slate-900 dark:text-white">
                  {t('card.title')}
                </h3>
              </div>

              <div className="flex justify-center my-4 overflow-hidden">
                <MembershipCard user={currentUser || undefined} allowExport={true} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
