'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';
import { getDashboardPath } from '@/lib/rbac';
import { ContactActionModal } from '@/components/shared/ContactActionModal';
import { AuthModalV2View } from './AuthModalV2';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const { login, register } = useAuthStore();
  const { locale, } = useTranslation();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [wilayaCode, setWilayaCode] = useState(16);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loginNotice, setLoginNotice] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [activationModalOpen, setActivationModalOpen] = useState(false);
  const [registeredUserData, setRegisteredUserData] = useState<{ name: string; email: string; phone: string; wilayaName?: string } | null>(null);

  // Unverified account state on login attempt
  const [unverifiedAccount, setUnverifiedAccount] = useState<{
    email: string;
    name?: string;
    phone?: string;
    wilayaName?: string;
  } | null>(null);
  const [resendingActivation, setResendingActivation] = useState(false);
  const [resendActivationSuccess, setResendActivationSuccess] = useState('');
  const [resendActivationError, setResendActivationError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setErrorMsg('');
      setLoginNotice('');
      setForgotSuccess('');
      setUnverifiedAccount(null);
      setResendActivationSuccess('');
      setResendActivationError('');
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setForgotSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      });
      const data = await res.json();
      if (res.ok) {
        setForgotSuccess(
          locale === 'ar'
            ? 'تم إرسال تعليمات ورابط إعادة التعيين بنجاح إلى بريدك الإلكتروني.'
            : 'Un lien de réinitialisation a été envoyé à votre adresse email.'
        );
      } else {
        setErrorMsg(data.error || (locale === 'ar' ? 'تعذر إرسال الرابط' : 'Échec de la demande'));
      }
    } catch {
      setErrorMsg(locale === 'ar' ? 'حدث خطأ غير متوقع' : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoginNotice('');
    setUnverifiedAccount(null);
    setResendActivationSuccess('');
    setResendActivationError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      onClose();
      if (result.user) router.push(getDashboardPath(result.user.role, locale));
    } else {
      if (result.requiresVerification) {
        setUnverifiedAccount(result.unverifiedUser || { email });
      }
      setErrorMsg(result.error || (locale === 'ar' ? 'فشل تسجيل الدخول' : 'Échec de connexion'));
    }
  };

  const handleResendActivation = async () => {
    const targetEmail = unverifiedAccount?.email || email;
    if (!targetEmail) return;
    setResendingActivation(true);
    setResendActivationSuccess('');
    setResendActivationError('');
    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResendActivationSuccess(
          locale === 'ar'
            ? '✓ تم إرسال رابط تفعيل جديد بنجاح! تفقد صندوق الوارد أو مجلد الرسائل غير المرغوب فيها (Spam).'
            : '✓ Un nouveau lien d\'activation a été envoyé ! Vérifiez votre boîte de réception et vos spams.'
        );
      } else {
        setResendActivationError(data.error || (locale === 'ar' ? 'تعذر إرسال الرابط' : 'Échec de l\'envoi'));
      }
    } catch {
      setResendActivationError(locale === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Erreur de connexion');
    } finally {
      setResendingActivation(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoginNotice('');
    if (password.length < 8 || /^\d+$/.test(password)) {
      setErrorMsg(locale === 'ar' ? 'كلمة المرور يجب أن تكون 8 خانات على الأقل ولا تتكون من أرقام فقط' : 'Le mot de passe doit contenir au moins 8 caractères, pas uniquement des chiffres');
      return;
    }
    setLoading(true);
    const wilaya = WILAYAS.find((w) => w.code === wilayaCode);
    const result = await register({
      name,
      email,
      password,
      phone,
      wilayaCode,
      wilayaName: wilaya ? getLocalizedWilayaName(wilaya, locale) : undefined,
    });
    setLoading(false);
    if (result.success) {
      setRegisteredUserData({
        name,
        email,
        phone,
        wilayaName: wilaya ? getLocalizedWilayaName(wilaya, locale) : undefined,
      });
      setActivationModalOpen(true);
    } else {
      setErrorMsg(result.error || (locale === 'ar' ? 'فشل إنشاء الحساب' : "Échec de l'inscription"));
    }
  };

  const activationModal = activationModalOpen && registeredUserData ? (
    <ContactActionModal
          isOpen={activationModalOpen}
          onClose={() => {
            setActivationModalOpen(false);
            setActiveTab('login');
            setLoginNotice(
              locale === 'ar'
                ? 'تم تسجيل طلبك بنجاح! يرجى تأكيد بريدك الإلكتروني عبر الرابط المرسل إليك، أو انتظار موافقة الإدارة لتتمكن من تسجيل الدخول.'
                : 'Votre demande a été enregistrée avec succès ! Veuillez vérifier votre email ou attendre la validation par l\'administration pour vous connecter.'
            );
          }}
          operation={{
            type: 'ACCOUNT_ACTIVATION',
            title: locale === 'ar' ? 'تفعيل حساب جديد' : 'Activation de nouveau compte',
            user: registeredUserData,
          }}
        />
  ) : null;

  return (
    <>
      <AuthModalV2View
        f={{
          onClose,
          activeTab,
          setActiveTab,
          email, setEmail, password, setPassword, name, setName, phone, setPhone, wilayaCode, setWilayaCode,
          loading,
          errorMsg, clearError: () => setErrorMsg(''),
          loginNotice,
          forgotSuccess, clearForgotSuccess: () => setForgotSuccess(''),
          unverified: !!unverifiedAccount,
          resending: resendingActivation, resendOk: resendActivationSuccess, resendError: resendActivationError,
          onLogin: handleLoginSubmit,
          onRegister: handleRegisterSubmit,
          onForgot: handleForgotSubmit,
          onResend: handleResendActivation,
          onContactAdmin: () => {
            if (!unverifiedAccount) return;
            setRegisteredUserData({ name: unverifiedAccount.name || '', email: unverifiedAccount.email, phone: unverifiedAccount.phone || '', wilayaName: unverifiedAccount.wilayaName });
            setActivationModalOpen(true);
          },
        }}
      />
      {activationModal}
    </>
  );
};
