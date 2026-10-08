'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GraduationCap, Sparkles, MapPin, LogIn, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { MembershipCard } from '@/components/card/MembershipCard';
import { DailySchedule } from '@/components/dashboard/DailySchedule';
import { MiniCalendar } from '@/components/dashboard/MiniCalendar';
import { ActiveCoursesProgress } from '@/components/dashboard/ActiveCoursesProgress';
import { AssignmentsList } from '@/components/dashboard/AssignmentsList';
import { NewCoursesGrid } from '@/components/dashboard/NewCoursesGrid';
import { GoPremiumBanner } from '@/components/dashboard/GoPremiumBanner';
import { LiveSessionsPanel } from '@/components/dashboard/LiveSessionsPanel';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/store';
import { usePlatformStore } from '@/lib/platformStore';
import { isGoldenMember, getHubTitle } from '@/lib/rbac';
import { UpgradeModal } from '@/components/shared/UpgradeModal';
import { AuthModal } from '@/components/auth/AuthModal';

export default function StudentDashboardPage() {
  const { t, locale } = useTranslation();
  const { currentUser } = useAuthStore();
  const { courses, sessions } = usePlatformStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'card' | 'workshops'>('dashboard');
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  const isGold = isGoldenMember(currentUser);
  const displayName = currentUser ? currentUser.name : (locale === 'ar' ? 'طالب زائر' : 'Étudiant Invité');
  const specialtyName = currentUser?.specialty || '';
  const institutionName = currentUser?.institutionName || '';
  const hubTitle = getHubTitle(currentUser?.role, displayName, locale);

  useEffect(() => {
    if (!currentUser) return;
    fetch(`/api/enrollments?studentId=${currentUser.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setEnrollments)
      .catch(() => setEnrollments([]));
  }, [currentUser]);

  return (
    <div className="py-6 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 select-none font-arabic" data-testid="student-dashboard-page">
      {!currentUser && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-lime-500/15 to-transparent border border-lime-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-lime-500/15 border border-lime-500/40 flex items-center justify-center text-lime-700 dark:text-lime-300 shrink-0 font-bold">
              
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-lime-200">
                {locale === 'ar' ? 'أنت تتصفح المنصة حالياً كـ "زائر"' : 'Vous naviguez actuellement en tant qu\'invité'}
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-gray-300">
                {locale === 'ar' ? 'سجّل الدخول لتخصيص جدولك وحفظ امتحاناتك.' : 'Connectez-vous pour personnaliser vos cours.'}
              </p>
            </div>
          </div>
          <button onClick={() => setIsAuthOpen(true)} data-testid="student-guest-login-btn" className="px-3.5 sm:px-4 py-2 rounded-xl bg-lime-400 text-navy-950 font-black text-xs flex items-center justify-center gap-1.5 shrink-0 active:scale-95 transition-all w-full sm:w-auto">
            <LogIn className="w-4 h-4" />
            <span>{t('auth.loginTab')}</span>
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 sm:pb-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{locale === 'ar' ? `مرحباً بعودتك، ${displayName.split(' ')[0]}` : `Welcome back, ${displayName.split(' ')[0]}`}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-lime-500" />
            <span>{[specialtyName, institutionName].filter(Boolean).join(' • ')}</span>
          </p>
        </div>

        {!isGold ? (
          <button onClick={() => setIsUpgradeOpen(true)} data-testid="student-upgrade-btn" className="px-4 py-2 rounded-2xl bg-lime-400 text-navy-950 font-black text-xs shadow-md flex items-center gap-1.5 hover:scale-105 transition-all">
            <Sparkles className="w-4 h-4" />
            <span>{locale === 'ar' ? 'تفعيل العضوية الذهبية VIP' : 'Passer en VIP Gold'}</span>
          </button>
        ) : (
          <div className="px-3.5 py-1.5 rounded-2xl bg-lime-400/20 border border-lime-500/40 text-lime-700 dark:text-lime-300 text-xs font-black flex items-center gap-1.5 shadow-sm">
            <Crown className="w-4 h-4 text-lime-500" />
            <span>{locale === 'ar' ? 'عضوية VIP' : 'Membre VIP'}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto no-scrollbar" data-testid="student-tabs">
        {[
          { id: 'dashboard', label: locale === 'ar' ? 'لوحة دراستي' : 'Dashboard' },
          { id: 'card', label: t('nav.membershipCard') },
          { id: 'workshops', label: locale === 'ar' ? 'الورشات والمراجعات' : 'Sessions' },
        ].map((tabItem) => (
          <button
            key={tabItem.id}
            data-testid={`student-tab-${tabItem.id}`}
            onClick={() => setActiveTab(tabItem.id as any)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === tabItem.id ? 'bg-slate-950 dark:bg-lime-400 text-white dark:text-navy-950 shadow-sm' : 'bg-white dark:bg-navy-900 border border-slate-200 dark:border-gray-800 text-slate-700 dark:text-gray-300'
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {locale === 'ar' ? 'دورات جديدة' : 'New Courses'}
              </h3>
              <Link href={`/${locale}/dawarat`} className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">
                {locale === 'ar' ? 'عرض الكل' : 'View All'} →
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3.5">
              <div className={isGold ? 'lg:col-span-4' : 'lg:col-span-3'}>
                <NewCoursesGrid courses={courses} locale={locale} />
              </div>
              {!isGold && <GoPremiumBanner locale={locale} onUpgrade={() => setIsUpgradeOpen(true)} />}
            </div>
          </div>

          <DailySchedule sessions={sessions} locale={locale} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <MiniCalendar sessions={sessions} locale={locale} />
            </div>
            <div className="lg:col-span-1">
              <ActiveCoursesProgress enrollments={enrollments} locale={locale} />
            </div>
            <div className="lg:col-span-1">
              <AssignmentsList locale={locale} />
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'card' && (
        <div className="max-w-xl mx-auto">
          <MembershipCard user={currentUser} allowExport={true} />
        </div>
      )}

      {activeTab === 'workshops' && (
        <div className="space-y-6 sm:space-y-8">
          <LiveSessionsPanel sessions={sessions} locale={locale} />

        </div>
      )}

      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}
