'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from './AppSidebar';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { FloatingBotWidget } from '@/components/bot/FloatingBotWidget';
import { AuthGate, AccessDenied, AuthLoadingSpinner } from './AuthGate';
import { AuthModal } from '@/components/auth/AuthModal';
import { AuthModalProvider } from '@/lib/authModalContext';
import { SessionReminderBanner } from '@/components/dashboard/SessionReminderBanner';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/store';
import { Role } from '@/types';

interface DashboardShellProps {
  children: React.ReactNode;
}

const PROTECTED_ROLE_MAP: Record<string, Role[]> = {
  admin: ['OWNER', 'ADMIN', 'MODERATOR'],
  teacher: ['TEACHER'],
  student: ['STUDENT_FREE', 'STUDENT_PAID'],
  ambassador: ['AMBASSADOR'],
};

const ROLE_HOME: Record<string, string> = {
  OWNER: 'admin',
  ADMIN: 'admin',
  MODERATOR: 'admin',
  TEACHER: 'teacher',
  AMBASSADOR: 'ambassador',
  STUDENT_FREE: 'student',
  STUDENT_PAID: 'student',
};

export const DashboardShell: React.FC<DashboardShellProps> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [authModal, setAuthModal] = useState<{ open: boolean; tab: 'login' | 'register' }>({ open: false, tab: 'login' });
  const { isRtl, locale } = useTranslation();
  const { currentUser, isLoaded } = useAuthStore();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const auth = params.get('auth');
      if (auth === 'login' || auth === 'register') {
        setAuthModal({ open: true, tab: auth });
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [pathname]);

  const segments = (pathname || '').split('/').filter(Boolean);
  const routeSegment = segments[1] || '';
  const requiredRoles = PROTECTED_ROLE_MAP[routeSegment];

  const isGuestLanding = !currentUser && (pathname === `/${locale}` || pathname === `/${locale}/`);

  let bodyContent: React.ReactNode = children;

  if (requiredRoles) {
    if (!isLoaded) {
      bodyContent = <AuthLoadingSpinner />;
    } else if (!currentUser) {
      bodyContent = (
        <AuthGate
          onOpenLogin={() => setAuthModal({ open: true, tab: 'login' })}
          onOpenRegister={() => setAuthModal({ open: true, tab: 'register' })}
        />
      );
    } else if (!requiredRoles.includes(currentUser.role)) {
      bodyContent = <AccessDenied homeHref={`/${locale}/${ROLE_HOME[currentUser.role] || ''}`} />;
    }
  }

  if (isGuestLanding) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-[#f4f5f6] dark:bg-[#0b0b0d] text-slate-900 dark:text-white transition-colors" data-testid="guest-landing-shell">
        <Navbar onToggleSidebar={() => setIsMobileSidebarOpen(true)} onOpenAuth={(tab) => setAuthModal({ open: true, tab })} />
        <AuthModalProvider value={{ openAuth: (tab) => setAuthModal({ open: true, tab }) }}>
          <main className="flex-1 w-full">{children}</main>
        </AuthModalProvider>
        <Footer />
        <FloatingBotWidget />
        <AuthModal isOpen={authModal.open} defaultTab={authModal.tab} onClose={() => setAuthModal({ ...authModal, open: false })} />
      </div>
    );
  }

  const isNoSidebarPage = routeSegment === 'admin' || routeSegment === 'ambassador' || routeSegment === 'teacher';

  return (
    <AuthModalProvider value={{ openAuth: (tab) => setAuthModal({ open: true, tab }) }}>
      <div className={`flex min-h-screen w-full bg-[#f4f5f6] dark:bg-[#0b0b0d] text-slate-900 dark:text-white transition-colors${routeSegment === 'admin' || routeSegment === 'ambassador' ? ' dark' : ''}`} data-testid="app-dashboard-shell">

        {currentUser && !isNoSidebarPage && (
          <AppSidebar
            isMobileOpen={isMobileSidebarOpen}
            onMobileClose={() => setIsMobileSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <Navbar
            onToggleSidebar={() => setIsMobileSidebarOpen(true)}
            onOpenAuth={(tab) => setAuthModal({ open: true, tab })}
            hideSidebarToggle={isNoSidebarPage}
          />
          {currentUser && (currentUser.role === 'STUDENT_FREE' || currentUser.role === 'STUDENT_PAID') && <SessionReminderBanner />}
          <main className="flex-1 w-full">{bodyContent}</main>
          <Footer />
        </div>

        <FloatingBotWidget />
        <AuthModal isOpen={authModal.open} defaultTab={authModal.tab} onClose={() => setAuthModal({ ...authModal, open: false })} />
      </div>
    </AuthModalProvider>
  );
};
