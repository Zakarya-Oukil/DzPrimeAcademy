'use client';

import React from 'react';
import { CircleNotch, LockKey, ShieldWarning } from '@phosphor-icons/react';
import { Btn, Panel, useTx } from '@/components/student-v2/ui';

interface AuthGateProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

const Notice: React.FC<{ testId: string; icon: React.ReactNode; title: string; sub: string; children: React.ReactNode }> = ({ testId, icon, title, sub, children }) => (
  <div className="flex min-h-[70vh] items-center justify-center px-4 py-10" data-testid={testId}>
    <Panel className="flex w-full max-w-sm flex-col items-center gap-3 text-center sm:p-8">
      <span className="mb-1 text-gold-500" aria-hidden="true">{icon}</span>
      <h2 className="text-[20px] font-semibold">{title}</h2>
      <p className="text-[15px] text-sheet-muted">{sub}</p>
      <div className="mt-4 flex w-full flex-col gap-3">{children}</div>
    </Panel>
  </div>
);

export const AuthGate: React.FC<AuthGateProps> = ({ onOpenLogin, onOpenRegister }) => {
  const { tx } = useTx();
  return (
    <Notice
      testId="auth-gate"
      icon={<LockKey size={40} weight="regular" />}
      title={tx('يجب تسجيل الدخول للوصول لهذه الصفحة', 'Connexion requise pour accéder à cette page', 'Sign in to open this page')}
      sub={tx('سجّل الدخول أو أنشئ حساباً جديداً للاستمرار.', 'Connectez-vous ou créez un compte pour continuer.', 'Sign in or create an account to continue.')}
    >
      <Btn full data-testid="auth-gate-login-btn" onClick={onOpenLogin}>{tx('تسجيل الدخول', 'Se connecter', 'Sign in')}</Btn>
      <Btn variant="secondary" full data-testid="auth-gate-register-btn" onClick={onOpenRegister}>{tx('إنشاء حساب جديد', 'Créer un compte', 'Create an account')}</Btn>
    </Notice>
  );
};

export const AccessDenied: React.FC<{ homeHref: string }> = ({ homeHref }) => {
  const { tx } = useTx();
  return (
    <Notice
      testId="access-denied"
      icon={<ShieldWarning size={40} weight="regular" />}
      title={tx('لا تملك صلاحية الوصول لهذه الصفحة', "Vous n'avez pas accès à cette page", "You don't have access to this page")}
      sub={tx('هذه الصفحة مخصصة لدور آخر في المنصة.', 'Cette page est réservée à un autre rôle.', 'This page is for a different role.')}
    >
      <Btn href={homeHref} full>{tx('الذهاب إلى لوحتي', 'Aller à mon tableau de bord', 'Go to my dashboard')}</Btn>
    </Notice>
  );
};

export const AuthLoadingSpinner: React.FC = () => (
  <div className="flex min-h-[70vh] items-center justify-center" data-testid="auth-loading-spinner" role="status" aria-label="Loading">
    <CircleNotch size={28} className="animate-spin text-gold-500 motion-reduce:animate-none" aria-hidden="true" />
  </div>
);
