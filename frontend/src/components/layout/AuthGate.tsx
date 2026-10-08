'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface AuthGateProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onOpenLogin, onOpenRegister }) => {
  const { locale } = useTranslation();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10" data-testid="auth-gate">
      <div className="w-full max-w-sm text-center p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111114] shadow-lg">
        <div className="w-14 h-14 rounded-2xl bg-lime-400/15 border border-lime-400/30 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7 text-lime-500" />
        </div>
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
          {locale === 'ar' ? 'يجب تسجيل الدخول للوصول لهذه الصفحة' : 'Connexion requise pour accéder à cette page'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
          {locale === 'ar' ? 'سجّل الدخول أو أنشئ حساباً جديداً للاستمرار' : 'Connectez-vous ou créez un compte pour continuer'}
        </p>
        <div className="flex flex-col gap-2.5 mt-6">
          <button
            data-testid="auth-gate-login-btn"
            onClick={onOpenLogin}
            className="w-full py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>{locale === 'ar' ? 'تسجيل الدخول' : 'Se connecter'}</span>
          </button>
          <button
            data-testid="auth-gate-register-btn"
            onClick={onOpenRegister}
            className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-gray-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>{locale === 'ar' ? 'إنشاء حساب جديد' : 'Créer un compte'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface AccessDeniedProps {
  homeHref: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ homeHref }) => {
  const { locale } = useTranslation();
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10" data-testid="access-denied">
      <div className="w-full max-w-sm text-center p-6 sm:p-8 rounded-3xl border border-rose-200 dark:border-rose-500/30 bg-white dark:bg-[#111114] shadow-lg">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7 text-rose-500" />
        </div>
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
          {locale === 'ar' ? 'لا تملك صلاحية الوصول لهذه الصفحة' : "Vous n'avez pas accès à cette page"}
        </h2>
        <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
          {locale === 'ar' ? 'هذه الصفحة مخصصة لدور آخر في المنصة' : 'Cette page est réservée à un autre rôle'}
        </p>
        <Link
          href={homeHref}
          data-testid="access-denied-home-link"
          className="inline-flex mt-6 px-5 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-xs items-center justify-center gap-2 transition-all"
        >
          {locale === 'ar' ? 'الذهاب إلى لوحتي' : 'Aller à mon tableau de bord'}
        </Link>
      </div>
    </div>
  );
};

export const AuthLoadingSpinner: React.FC = () => (
  <div className="min-h-[70vh] flex items-center justify-center" data-testid="auth-loading-spinner">
    <Loader2 className="w-6 h-6 text-lime-500 animate-spin" />
  </div>
);
