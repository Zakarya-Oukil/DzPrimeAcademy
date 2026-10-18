'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AuthGate, AccessDenied, AuthLoadingSpinner } from './AuthGate';
import { AuthModal } from '@/components/auth/AuthModal';
import { AuthModalProvider } from '@/lib/authModalContext';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/store';
import { Role } from '@/types';
import { PillHeader } from '@/components/landing-v2/PillHeader';
import { SiteFooter } from '@/components/landing-v2/SiteFooter';
import { FloatingSupport } from '@/components/landing-v2/FloatingSupport';
import { StudentShell } from '@/components/student-v2/StudentShell';
import { TeacherShell } from '@/components/teacher-v2/TeacherShell';
import { AmbassadorShell } from '@/components/ambassador-v2/AmbassadorShell';
import { AdminShell } from '@/components/admin-v2/AdminShell';

/** Pages with the visitor header and footer for everyone. */
const PUBLIC_ALWAYS = ['verify', 'reset-password', 'activate'];
/** Pages that only exist in the member areas: guests are asked to sign in, staff are sent to their own area. */
const MEMBER_ONLY = ['dawarat', 'exams', 'community', 'leaderboard', 'card', 'bot'];

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
  const [authModal, setAuthModal] = useState<{ open: boolean; tab: 'login' | 'register' }>({ open: false, tab: 'login' });
  const { locale } = useTranslation();
  const { currentUser, isLoaded } = useAuthStore();
  const pathname = usePathname();

  useEffect(() => {
    const auth = new URLSearchParams(window.location.search).get('auth');
    if (auth === 'login' || auth === 'register') {
      setAuthModal({ open: true, tab: auth });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [pathname]);

  const routeSegment = (pathname || '').split('/').filter(Boolean)[1] || '';
  const requiredRoles = PROTECTED_ROLE_MAP[routeSegment];
  const isGuestLanding = !currentUser && (pathname === '/' || pathname === `/${locale}` || pathname === `/${locale}/`);
  const role = currentUser?.role;

  const openLogin = () => setAuthModal({ open: true, tab: 'login' });
  const openRegister = () => setAuthModal({ open: true, tab: 'register' });
  const modal = <AuthModal isOpen={authModal.open} defaultTab={authModal.tab} onClose={() => setAuthModal({ ...authModal, open: false })} />;

  let bodyContent: React.ReactNode = children;
  if (MEMBER_ONLY.includes(routeSegment) && isLoaded && !currentUser) {
    bodyContent = <AuthGate onOpenLogin={openLogin} onOpenRegister={openRegister} />;
  } else if (MEMBER_ONLY.includes(routeSegment) && (role === 'OWNER' || role === 'ADMIN' || role === 'MODERATOR')) {
    bodyContent = <AccessDenied homeHref={`/${locale}/admin`} />;
  } else if (requiredRoles) {
    if (!isLoaded) bodyContent = <AuthLoadingSpinner />;
    else if (!currentUser) bodyContent = <AuthGate onOpenLogin={openLogin} onOpenRegister={openRegister} />;
    else if (!requiredRoles.includes(currentUser.role)) bodyContent = <AccessDenied homeHref={`/${locale}/${ROLE_HOME[currentUser.role] || ''}`} />;
  }

  if (!isGuestLanding && !isLoaded && !PUBLIC_ALWAYS.includes(routeSegment)) {
    return <div className="min-h-screen w-full bg-background" data-testid="shell-loading" />;
  }

  if (isGuestLanding || !currentUser || PUBLIC_ALWAYS.includes(routeSegment)) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground transition-colors" data-testid="public-shell-v2">
        <PillHeader onOpenAuth={(tab) => setAuthModal({ open: true, tab })} />
        <AuthModalProvider value={{ openAuth: (tab) => setAuthModal({ open: true, tab }) }}>
          <main id="main" className="flex flex-1 w-full flex-col">{bodyContent}</main>
        </AuthModalProvider>
        {isGuestLanding ? null : <SiteFooter />}
        <FloatingSupport />
        {modal}
      </div>
    );
  }

  const Shell = role === 'TEACHER' ? TeacherShell : role === 'AMBASSADOR' ? AmbassadorShell : role === 'STUDENT_FREE' || role === 'STUDENT_PAID' ? StudentShell : AdminShell;
  return (
    <AuthModalProvider value={{ openAuth: (tab) => setAuthModal({ open: true, tab }) }}>
      <Shell>{bodyContent}</Shell>
      {modal}
    </AuthModalProvider>
  );
};
