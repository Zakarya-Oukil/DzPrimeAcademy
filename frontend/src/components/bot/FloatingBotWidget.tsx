'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  X,
  Sparkles,
  Maximize2,
  Minimize2,
  RotateCcw,
  MessageSquare,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { DecisionTreeBot } from './DecisionTreeBot';
import { useTranslation } from '@/lib/i18n/useTranslation';
import Link from 'next/link';

export const FloatingBotWidget: React.FC = () => {
  const { t, locale, isRtl } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div
      className={`fixed bottom-4 sm:bottom-6 ${
        isRtl ? 'left-3 sm:left-6' : 'right-3 sm:right-6'
      } z-50 select-none print:hidden`}
    >
      {/* ================= FLOATING LAUNCHER BUTTON ================= */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen(true)}
          aria-label={t('floatingBot.launcherTitle')}
          title={t('floatingBot.launcherTitle')}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gold-500 hover:bg-gold-400 text-navy-950 shadow-lg border border-navy-950/20 transition-colors touch-target"
        >
          <Bot className="w-5 h-5" />
        </motion.button>
      )}

      {/* ================= FLOATING CHATBOT MODAL ================= */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`w-[calc(100vw-24px)] xs:w-[calc(100vw-32px)] sm:w-[560px] md:w-[620px] max-w-[95vw] ${
              isMinimized ? 'h-[64px]' : 'h-[85vh] sm:h-[680px] max-h-[92vh]'
            } rounded-3xl border-2 border-gold-500/40 bg-white/95 dark:bg-[#111114]/95 shadow-2xl flex flex-col overflow-hidden transition-all duration-300`}
          >
            {/* Widget Header Bar */}
            <div className="px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-100 dark:bg-navy-900 border-b border-slate-200 dark:border-gold-500/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gold-500 text-navy-950 flex items-center justify-center shadow-gold-glow">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 font-arabic">
                    <span>{t('floatingBot.launcherTitle')}</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-gray-400 font-arabic">
                    {t('floatingBot.launcherSubtitle')}
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/${locale}/bot`}
                  onClick={() => setIsOpen(false)}
                  title={t('floatingBot.openFull')}
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-navy-800 text-slate-600 dark:text-gray-300 transition-colors"
                >
                  <Maximize2 className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? 'Expand' : 'Minimize'}
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-navy-800 text-slate-600 dark:text-gray-300 transition-colors"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  title={t('floatingBot.close')}
                  className="p-1.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-600 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Interactive Decision-Tree Content Body */}
            {!isMinimized && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
                <DecisionTreeBot isFloating={true} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
