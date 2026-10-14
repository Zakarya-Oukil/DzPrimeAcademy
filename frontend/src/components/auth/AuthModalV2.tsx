'use client';

import React from 'react';
import { WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';
import type { Locale } from '@/types';
import { Btn, SelectInput, Tabs, TextInput, useTx } from '@/components/student-v2/ui';
import { Banner, Dialog } from '@/components/shared-v2/Dialog';

/** Redesigned sign in / sign up / forgot password dialog (Figma page 30). State and handlers stay in AuthModal; this is only the view. */
export interface AuthFlow {
  onClose: () => void;
  activeTab: 'login' | 'register' | 'forgot';
  setActiveTab: (t: 'login' | 'register' | 'forgot') => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  name: string; setName: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  wilayaCode: number; setWilayaCode: (v: number) => void;
  loading: boolean;
  errorMsg: string; clearError: () => void;
  loginNotice: string;
  forgotSuccess: string; clearForgotSuccess: () => void;
  unverified: boolean;
  resending: boolean; resendOk: string; resendError: string;
  onLogin: (e: React.FormEvent) => void;
  onRegister: (e: React.FormEvent) => void;
  onForgot: (e: React.FormEvent) => void;
  onResend: () => void;
  onContactAdmin: () => void;
}

export const AuthModalV2View: React.FC<{ f: AuthFlow }> = ({ f }) => {
  const { tx, locale } = useTx();
  const forgot = f.activeTab === 'forgot';
  const title = forgot ? tx('استعادة كلمة المرور', 'Réinitialisation du mot de passe', 'Reset your password') : tx('مرحباً بك في DZ PRIME', 'Bienvenue sur DZ PRIME', 'Welcome to DZ PRIME');
  const sub = forgot ? undefined : tx('سجّل الدخول أو أنشئ حسابك للوصول إلى المنصة', 'Connectez-vous ou créez votre compte', 'Sign in or create your account to reach the platform');
  const busy = (label: string) => (f.loading ? tx('جارٍ التنفيذ…', 'Un instant…', 'Working…') : label);

  return (
    <Dialog open onClose={f.onClose} title={title} sub={sub} testId="auth-modal-backdrop" closeTestId="auth-modal-close-btn">
      {!forgot ? (
        <Tabs
          label={tx('نوع الدخول', "Type d'accès", 'Access type')}
          value={f.activeTab}
          onChange={(id) => { f.setActiveTab(id as 'login' | 'register'); f.clearError(); }}
          items={[
            { id: 'login', label: tx('تسجيل دخول', 'Connexion', 'Sign in') },
            { id: 'register', label: tx('حساب جديد', 'Inscription', 'Sign up') },
          ]}
        />
      ) : null}

      {f.loginNotice ? <Banner kind="info" testId="auth-notice">{f.loginNotice}</Banner> : null}

      {f.unverified ? (
        <div className="flex flex-col gap-3" data-testid="auth-unverified">
          <Banner kind="info">
            <strong className="block">{tx('حسابك بانتظار التفعيل', "Compte en attente d'activation", 'Your account is waiting for activation')}</strong>
            <span className="mt-1 block font-normal text-sheet-muted">{tx('لا يمكنك تسجيل الدخول حتى تؤكد بريدك الإلكتروني عبر الرابط المرسل إليك، أو تتم موافقة الإدارة على حسابك.', "Vous ne pouvez pas vous connecter tant que votre email n'est pas vérifié ou validé par un administrateur.", 'You cannot sign in until your email is verified or an administrator approves your account.')}</span>
          </Banner>
          {f.resendOk ? <Banner kind="ok">{f.resendOk}</Banner> : null}
          {f.resendError ? <Banner kind="danger">{f.resendError}</Banner> : null}
          <Btn variant="secondary" full onClick={f.onResend} disabled={f.resending}>{f.resending ? tx('جارٍ الإرسال…', 'Envoi…', 'Sending…') : tx('إعادة إرسال رابط التفعيل', 'Renvoyer le lien', 'Resend the activation link')}</Btn>
          <div><Btn variant="text" onClick={f.onContactAdmin}>{tx('طلب اعتماد من الإدارة', "Contacter l'admin", 'Ask the administration to approve')}</Btn></div>
        </div>
      ) : f.errorMsg ? (
        <Banner kind="danger" testId="auth-error-message">{f.errorMsg}</Banner>
      ) : null}

      {f.activeTab === 'login' && !f.unverified ? (
        <form onSubmit={f.onLogin} data-testid="login-form" className="flex flex-col gap-4">
          <TextInput id="auth-email" label={tx('البريد الإلكتروني', 'Adresse email', 'Email')} type="email" value={f.email} onChange={f.setEmail} placeholder="votre.email@exemple.com" dir="ltr" autoComplete="email" required />
          <TextInput id="auth-password" label={tx('كلمة المرور', 'Mot de passe', 'Password')} type="password" value={f.password} onChange={f.setPassword} placeholder="••••••••" dir="ltr" autoComplete="current-password" required />
          <div><Btn variant="text" onClick={() => { f.setActiveTab('forgot'); f.clearError(); }}>{tx('نسيت كلمة المرور؟', 'Mot de passe oublié ?', 'Forgot your password?')}</Btn></div>
          <Btn type="submit" full disabled={f.loading} data-testid="login-submit-btn">{busy(tx('دخول إلى الحساب', 'Se connecter', 'Sign in'))}</Btn>
        </form>
      ) : null}

      {f.activeTab === 'register' ? (
        <form onSubmit={f.onRegister} data-testid="register-form" className="flex flex-col gap-4">
          <TextInput id="reg-name" label={tx('الاسم الكامل', 'Nom et prénom', 'Full name')} value={f.name} onChange={f.setName} placeholder={tx('الاسم واللقب', 'Nom et prénom', 'Full name')} autoComplete="name" required />
          <TextInput id="reg-email" label={tx('البريد الإلكتروني', 'Adresse email', 'Email')} type="email" value={f.email} onChange={f.setEmail} placeholder="votre.email@exemple.com" dir="ltr" autoComplete="email" required />
          <TextInput id="reg-password" label={tx('كلمة المرور', 'Mot de passe', 'Password')} type="password" value={f.password} onChange={f.setPassword} placeholder="••••••••" dir="ltr" autoComplete="new-password" hint={tx('8 خانات على الأقل ولا تتكون من أرقام فقط.', '8 caractères minimum, pas uniquement des chiffres.', 'At least 8 characters, not only digits.')} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput id="reg-phone" label={tx('الهاتف', 'Téléphone', 'Phone')} type="tel" value={f.phone} onChange={f.setPhone} placeholder="0555 12 34 56" dir="ltr" autoComplete="tel" />
            <SelectInput id="reg-wilaya" label={tx('الولاية', 'Wilaya', 'Wilaya')} value={String(f.wilayaCode)} onChange={(v) => f.setWilayaCode(Number(v))} options={WILAYAS.map((w) => ({ value: String(w.code), label: `${w.code} - ${getLocalizedWilayaName(w, locale as Locale)}` }))} />
          </div>
          <p className="text-[13px] text-sheet-muted">{tx('يتم إنشاء الحساب كطالب. حسابات الأساتذة والسفراء تُنشأ فقط من طرف الإدارة.', "Le compte est créé en tant qu'étudiant. Les comptes enseignant et ambassadeur sont créés par l'administration.", 'The account is created as a student. Teacher and ambassador accounts are created by the administration.')}</p>
          <Btn type="submit" full disabled={f.loading} data-testid="register-submit-btn">{busy(tx('إنشاء الحساب', 'Créer mon compte', 'Create account'))}</Btn>
        </form>
      ) : null}

      {forgot ? (
        <form onSubmit={f.onForgot} data-testid="forgot-password-form" className="flex flex-col gap-4">
          {f.forgotSuccess ? (
            <>
              <Banner kind="ok">{f.forgotSuccess}</Banner>
              <div><Btn variant="text" onClick={() => { f.setActiveTab('login'); f.clearForgotSuccess(); }}>{tx('العودة لتسجيل الدخول', 'Retour à la connexion', 'Back to sign in')}</Btn></div>
            </>
          ) : (
            <>
              <TextInput id="forgot-email" label={tx('البريد الإلكتروني المسجل', 'Adresse email', 'Registered email')} type="email" value={f.email} onChange={f.setEmail} placeholder="votre.email@exemple.com" dir="ltr" autoComplete="email" required />
              <Btn type="submit" full disabled={f.loading} data-testid="forgot-submit-btn">{busy(tx('إرسال رابط الاستعادة', 'Envoyer le lien', 'Send the reset link'))}</Btn>
              <div><Btn variant="text" onClick={() => { f.setActiveTab('login'); f.clearError(); }}>{tx('العودة لتسجيل الدخول', 'Retour à la connexion', 'Back to sign in')}</Btn></div>
            </>
          )}
        </form>
      ) : null}
    </Dialog>
  );
};
