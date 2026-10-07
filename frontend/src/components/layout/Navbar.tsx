'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Sparkles,
  User as UserIcon,
  Shield,
  Bot,
  CreditCard,
  Crown,
  LogIn,
  LogOut,
  Search,
  Bell,
  CheckCircle2,
  GraduationCap,
  Zap,
  ChevronRight,
  Users,
  Settings,
} from 'lucide-react';
import { LanguageSwitcher } from '../shared/LanguageSwitcher';
import { ThemeToggle } from '../shared/ThemeToggle';
import { DzPrimeLogo } from '../shared/DzPrimeLogo';
import { SettingsModal } from '../settings/SettingsModal';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/store';
import { isStaff, isGoldenMember } from '@/lib/rbac';
import { UpgradeModal } from '../shared/UpgradeModal';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onOpenAuth?: (tab: 'login' | 'register') => void;
  hideSidebarToggle?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onOpenAuth, hideSidebarToggle = false }) => {
  const { t, locale, isRtl } = useTranslation();
  const { currentUser, signOut } = useAuthStore();
  const pathname = usePathname();

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempPasswordDismissed, setTempPasswordDismissed] = useState(false);
  const mustChangePassword = !!currentUser?.mustChangePassword;

  // A temporary password has to be replaced before the account can do anything else, so open the form straight away.
  useEffect(() => {
    if (mustChangePassword) setSettingsOpen(true);
  }, [mustChangePassword]);

  const isGold = isGoldenMember(currentUser);
  const displayName = currentUser ? currentUser.name : (locale === 'ar' ? 'زائر' : 'Invité');
  const specialty = currentUser?.specialty || currentUser?.institutionName || '';

  const getDashboardLink = () => {
    if (!currentUser) return `/${locale}`;
    if (isStaff(currentUser.role)) return `/${locale}/admin`;
    if (currentUser.role === 'TEACHER') return `/${locale}/teacher`;
    if (currentUser.role === 'AMBASSADOR') return `/${locale}/ambassador`;
    return `/${locale}/student`;
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-[#070D1F]/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors select-none font-arabic">
        {/* Status & Preference Bar */}
        <div className="bg-slate-100/90 dark:bg-[#0B1224] border-b border-slate-200 dark:border-slate-800/60 px-3 sm:px-6 py-1.5 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-gray-300 truncate">
              {t('hero.badge')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        {/* Main Header Bar */}
        <div className="px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-6">
          {/* Left: Mobile Menu Trigger & Greeting */}
          <div className="flex items-center gap-3 min-w-0">
            {currentUser && !hideSidebarToggle && (
              <button
                onClick={onToggleSidebar}
                data-testid="navbar-mobile-menu-btn"
                className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-navy-850 hover:bg-slate-200 dark:hover:bg-navy-800 border border-slate-300 dark:border-gray-700 text-slate-800 dark:text-gray-200 touch-target"
                aria-label="Toggle Navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="flex flex-col text-left min-w-0">
              {currentUser ? (
                <h1 className="text-sm sm:text-xl font-black font-arabic text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                  <span>{t('dashboard.welcomeBack')}, {displayName.split(' ')[0]}</span>
                  <span className="text-base sm:text-lg">👋</span>
                </h1>
              ) : (
                <h1 className="text-sm sm:text-xl font-black font-arabic text-slate-900 dark:text-white truncate">
                  DZ Prime Academy
                </h1>
              )}
              {specialty && (
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-gray-400 font-semibold truncate">
                  {specialty}
                </p>
              )}
            </div>
          </div>

          {/* Center: Search Bar with Live Quick-Results Popup */}
          <div className="hidden md:flex flex-1 max-w-md mx-2 relative">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('dashboard.searchPlaceholder')}
                className="w-full pl-10 pr-8 py-2 rounded-2xl bg-slate-100 dark:bg-navy-900/90 border border-slate-200 dark:border-gray-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-gold-500 dark:focus:border-gold-400 transition-all font-arabic"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Live Search Quick Results Dropdown */}
            {searchQuery.trim().length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-2 p-3 rounded-2xl bg-white dark:bg-[#0C1428] border border-slate-200 dark:border-gold-500/40 shadow-2xl z-50 text-left font-arabic space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <span>{locale === 'ar' ? 'نتائج سريعة مقترحة' : 'Résultats instantanés'}</span>
                  <Link
                    href={`/${locale}/exams?q=${encodeURIComponent(searchQuery)}`}
                    onClick={() => setSearchQuery('')}
                    className="text-gold-600 dark:text-gold-400 hover:underline"
                  >
                    {locale === 'ar' ? 'عرض الكل في بنك الامتحانات ←' : 'Tout afficher ←'}
                  </Link>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  <Link
                    href={`/${locale}/exams?q=${encodeURIComponent(searchQuery)}`}
                    onClick={() => setSearchQuery('')}
                    className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-800 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-gold-500" />
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {locale === 'ar' ? `البحث في بنك الامتحانات عن "${searchQuery}"` : `Rechercher "${searchQuery}" dans les examens`}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>

                  <Link
                    href={`/${locale}/ambassadors`}
                    onClick={() => setSearchQuery('')}
                    className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-800 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {locale === 'ar' ? `البحث في شبكة السفراء عن "${searchQuery}"` : `Rechercher "${searchQuery}" parmi les ambassadeurs`}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right: Actions & User Avatar */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* VIP Upgrade Button */}
            {!isGold ? (
              <button
                onClick={() => setUpgradeModalOpen(true)}
                className="px-3 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-navy-950 font-black text-xs font-arabic flex items-center gap-1.5 shadow-gold-glow active:scale-95 transition-all touch-target"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{t('nav.upgrade')}</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gold-500/20 border border-gold-500/40 text-gold-700 dark:text-gold-300 text-xs font-bold font-arabic shadow-sm">
                <Crown className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
                <span>VIP GOLD</span>
              </div>
            )}

            {/* Profile Avatar / Login */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* 1. Public Profile link with avatar */}
                <Link
                  href={`/${locale}/profile/${currentUser.studentCardId || currentUser.id}`}
                  title={locale === 'ar' ? 'معاينة ملفي الشخصي وبطاقتي الرقمية' : 'Mon profil et carte'}
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl bg-slate-100 dark:bg-navy-850 hover:bg-gold-500/15 dark:hover:bg-gold-500/20 border border-slate-300 dark:border-gray-700 hover:border-gold-500/50 text-slate-800 dark:text-gray-200 transition-all group"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-gold-500 to-amber-400 text-slate-950 font-bold flex items-center justify-center text-xs shadow-sm overflow-hidden shrink-0">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.name.charAt(0)
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col text-left leading-tight">
                    <span className="text-xs font-bold font-arabic truncate max-w-[110px]">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] text-gold-600 dark:text-gold-400 font-bold">
                      {locale === 'ar' ? 'ملفي الشخصي' : 'Profil'}
                    </span>
                  </div>
                </Link>

                {/* 2. Dashboard link */}
                <Link
                  href={getDashboardLink()}
                  title={locale === 'ar' ? 'لوحة التحكم' : 'Tableau de bord'}
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 dark:bg-navy-850 hover:bg-slate-200 dark:hover:bg-navy-800 border border-slate-300 dark:border-gray-700 text-slate-800 dark:text-gray-200 text-xs font-bold transition-all"
                >
                  <span>{locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</span>
                </Link>

                {/* 3. Settings / Edit Profile Button */}
                <button
                  onClick={() => setSettingsOpen(true)}
                  title={locale === 'ar' ? 'تعديل الملف الشخصي والإعدادات' : 'Modifier le profil'}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-navy-850 hover:bg-gold-500/20 hover:text-gold-400 text-slate-500 dark:text-gray-400 border border-slate-300 dark:border-gray-700 transition-all"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* 4. Logout Button */}
                <button
                  onClick={signOut}
                  title={t('nav.logout')}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-navy-850 hover:bg-red-500/20 hover:text-red-500 text-slate-500 dark:text-gray-400 border border-slate-300 dark:border-gray-700 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onOpenAuth?.('login')}
                data-testid="navbar-login-btn"
                className="px-3.5 sm:px-4 py-2 rounded-2xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-navy-950 font-black text-xs font-arabic flex items-center gap-1.5 shadow-sm active:scale-95 transition-all touch-target"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t('nav.login')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {mustChangePassword && !tempPasswordDismissed && (
        <div role="status" className="mx-auto my-2 flex w-[calc(100%-2rem)] max-w-7xl flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-slate-900 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-white" data-testid="temp-password-banner">
          <span>
            {locale === 'ar'
              ? 'تستعمل كلمة مرور مؤقتة وضعها الفريق. اختر كلمة مرورك الخاصة الآن.'
              : 'Vous utilisez un mot de passe temporaire défini par l\'équipe. Choisissez le vôtre maintenant.'}
          </span>
          <span className="flex gap-2">
            <button type="button" onClick={() => setSettingsOpen(true)} className="min-h-11 rounded-xl bg-gold-500 px-4 font-black text-navy-950 hover:bg-gold-400">
              {locale === 'ar' ? 'تغيير كلمة المرور' : 'Changer le mot de passe'}
            </button>
            <button type="button" onClick={() => setTempPasswordDismissed(true)} className="min-h-11 rounded-xl border border-slate-300 px-4 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
              {locale === 'ar' ? 'لاحقاً' : 'Plus tard'}
            </button>
          </span>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal isOpen={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />

      {/* Settings Modal (for viewing and editing entire profile) */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} defaultTab={mustChangePassword ? 'security' : 'profile'} />
    </>
  );
};
