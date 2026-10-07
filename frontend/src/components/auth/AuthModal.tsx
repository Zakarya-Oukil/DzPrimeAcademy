'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  LogIn,
  UserPlus,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Loader2,
  AlertCircle,
  RefreshCw,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';
import { getDashboardPath } from '@/lib/rbac';
import { ContactActionModal } from '@/components/shared/ContactActionModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const { login, register } = useAuthStore();
  const { locale, isRtl } = useTranslation();
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
  const [forgotSent, setForgotSent] = useState(false);
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

  return (
    <AnimatePresence>
      <div
        data-testid="auth-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-navy-950/80 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="relative w-full max-w-md max-h-[92vh] overflow-y-auto no-scrollbar rounded-3xl border border-slate-200 dark:border-lime-500/30 bg-white dark:bg-gradient-to-b dark:from-[#0D152A] dark:to-[#060913] p-5 sm:p-8 text-slate-900 dark:text-white shadow-2xl my-auto"
        >
          <button
            data-testid="auth-modal-close-btn"
            onClick={onClose}
            className={`absolute top-3 sm:top-4 ${isRtl ? 'left-3 sm:left-4' : 'right-3 sm:right-4'} p-2 rounded-full bg-slate-100 dark:bg-navy-850 hover:bg-slate-200 dark:hover:bg-navy-800 border border-slate-200 dark:border-lime-500/30 text-slate-500 dark:text-gray-300 transition-all`}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center max-w-sm mx-auto mb-5">
            <h3 className="text-lg sm:text-2xl font-black font-arabic text-slate-900 dark:text-white">
              {locale === 'ar' ? 'مرحباً بك في DZ PRIME' : locale === 'fr' ? 'Bienvenue sur DZ PRIME' : 'Welcome to DZ PRIME'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-gray-300 mt-1 font-arabic">
              {locale === 'ar' ? 'سجّل الدخول أو أنشئ حسابك للوصول إلى المنصة' : "Connectez-vous ou créez votre compte"}
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-navy-850 border border-slate-200 dark:border-lime-500/20 mb-5 text-xs font-arabic">
            <button
              data-testid="auth-tab-login"
              onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
              className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'login' ? 'bg-lime-400 text-slate-950' : 'text-slate-600 dark:text-gray-300'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{locale === 'ar' ? 'تسجيل دخول' : 'Connexion'}</span>
            </button>
            <button
              data-testid="auth-tab-register"
              onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
              className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'register' ? 'bg-lime-400 text-slate-950' : 'text-slate-600 dark:text-gray-300'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{locale === 'ar' ? 'حساب جديد' : 'Inscription'}</span>
            </button>
          </div>

          {loginNotice && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-semibold mb-4 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-amber-500 dark:text-amber-400" />
              <span>{loginNotice}</span>
            </div>
          )}

          {unverifiedAccount && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-3 mb-4">
              <div className="flex items-start gap-2 text-amber-400 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1 text-right rtl:text-right ltr:text-left">
                  <p className="font-black text-slate-900 dark:text-amber-200 text-xs">
                    {locale === 'ar' ? 'حسابك بانتظار التفعيل' : 'Compte en attente d\'activation'}
                  </p>
                  <p className="text-[11px] text-slate-700 dark:text-gray-300 font-normal leading-relaxed">
                    {locale === 'ar'
                      ? 'لا يمكنك تسجيل الدخول حتى تؤكد بريدك الإلكتروني عبر الرابط المرسل إليك، أو تتم موافقة الإدارة على حسابك.'
                      : 'Vous ne pouvez pas vous connecter tant que votre email n\'est pas vérifié ou validé par un administrateur.'}
                  </p>
                </div>
              </div>

              {resendActivationSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                  {resendActivationSuccess}
                </div>
              )}

              {resendActivationError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] font-bold">
                  {resendActivationError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResendActivation}
                  disabled={resendingActivation}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all disabled:opacity-60"
                >
                  {resendingActivation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>{locale === 'ar' ? 'إعادة إرسال رابط التفعيل' : 'Renvoyer le lien'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRegisteredUserData({
                      name: unverifiedAccount.name || '',
                      email: unverifiedAccount.email,
                      phone: unverifiedAccount.phone || '',
                      wilayaName: unverifiedAccount.wilayaName,
                    });
                    setActivationModalOpen(true);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-lime-400/20 hover:bg-lime-400/30 text-lime-700 dark:text-lime-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{locale === 'ar' ? 'طلب اعتماد من الإدارة' : 'Contacter l\'admin'}</span>
                </button>
              </div>
            </div>
          )}

          {errorMsg && !unverifiedAccount && (
            <div data-testid="auth-error-message" className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} data-testid="login-form" className="space-y-3.5 font-arabic text-xs">
              <div>
                <label className="block text-slate-700 dark:text-gray-300 mb-1 font-semibold">
                  {locale === 'ar' ? 'البريد الإلكتروني' : 'Adresse Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    data-testid="login-email-input"
                    type="email"
                    required
                    placeholder="votre.email@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-300 dark:border-lime-500/20 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-gray-300 mb-1 font-semibold">
                  {locale === 'ar' ? 'كلمة المرور' : 'Mot de passe'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    data-testid="login-password-input"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-300 dark:border-lime-500/20 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-0.5">
                <span className="text-slate-400 font-normal">{locale === 'ar' ? 'حساب شخصي مؤمّن' : 'Compte sécurisé'}</span>
                <button
                  type="button"
                  onClick={() => { setActiveTab('forgot'); setErrorMsg(''); }}
                  className="text-gold-600 dark:text-gold-400 hover:underline font-bold"
                >
                  {locale === 'ar' ? 'نسيت كلمة المرور؟' : 'Mot de passe oublié ?'}
                </button>
              </div>

              <button
                type="submit"
                data-testid="login-submit-btn"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all mt-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                <span>{locale === 'ar' ? 'دخول إلى الحساب' : 'Se Connecter'}</span>
              </button>
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} data-testid="register-form" className="space-y-3 font-arabic text-xs">
              <div>
                <label className="block text-slate-700 dark:text-gray-300 mb-1 font-semibold">
                  {locale === 'ar' ? 'الاسم الكامل' : 'Nom & Prénom'}
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    data-testid="register-name-input"
                    type="text"
                    required
                    placeholder="Walid Benali"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-300 dark:border-lime-500/20 text-slate-900 dark:text-white focus:outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-gray-300 mb-1 font-semibold">
                  {locale === 'ar' ? 'البريد الإلكتروني' : 'Adresse Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    data-testid="register-email-input"
                    type="email"
                    required
                    placeholder="walid@univ-alger.dz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-300 dark:border-lime-500/20 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-gray-300 mb-1 font-semibold">
                  {locale === 'ar' ? 'كلمة المرور' : 'Mot de passe'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    data-testid="register-password-input"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-300 dark:border-lime-500/20 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 dark:text-gray-300 mb-1 font-semibold">
                    {locale === 'ar' ? 'الهاتف' : 'Téléphone'}
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      data-testid="register-phone-input"
                      type="tel"
                      placeholder="0555 12 34 56"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      dir="ltr"
                      className="w-full pl-8 pr-2 py-2 rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-300 dark:border-lime-500/20 text-slate-900 dark:text-white font-mono text-[11px] focus:outline-none focus:border-lime-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-gray-300 mb-1 font-semibold">
                    {locale === 'ar' ? 'الولاية' : 'Wilaya'}
                  </label>
                  <select
                    data-testid="register-wilaya-select"
                    value={wilayaCode}
                    onChange={(e) => setWilayaCode(Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-300 dark:border-lime-500/20 text-slate-800 dark:text-white text-[11px] focus:outline-none"
                  >
                    {WILAYAS.map((w) => (
                      <option key={w.code} value={w.code}>
                        {w.code} - {getLocalizedWilayaName(w, locale)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                {locale === 'ar'
                  ? 'يتم إنشاء الحساب كطالب. حسابات الأساتذة والسفراء تُنشأ فقط من طرف الإدارة.'
                  : 'Le compte est créé en tant qu\'étudiant. Les comptes Enseignant/Ambassadeur sont créés uniquement par l\'administration.'}
              </p>

              <button
                type="submit"
                data-testid="register-submit-btn"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all mt-1 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>{locale === 'ar' ? 'إنشاء الحساب' : 'Créer mon Compte'}</span>
              </button>
            </form>
          )}

          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} data-testid="forgot-password-form" className="space-y-3.5 font-arabic text-xs">
              <div className="text-center space-y-1 pb-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {locale === 'ar' ? 'استعادة كلمة المرور' : 'Réinitialisation du mot de passe'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-gray-400">
                  {locale === 'ar'
                    ? 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور فوراً.'
                    : 'Entrez votre adresse email pour recevoir les instructions.'}
                </p>
              </div>

              {forgotSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs space-y-3 text-center">
                  <p className="font-bold leading-relaxed">{forgotSuccess}</p>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('login'); setForgotSuccess(''); }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-colors shadow-sm"
                  >
                    {locale === 'ar' ? 'العودة لتسجيل الدخول' : 'Retour à la connexion'}
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-slate-700 dark:text-gray-300 mb-1 font-semibold">
                      {locale === 'ar' ? 'البريد الإلكتروني المسجل' : 'Adresse Email'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        data-testid="forgot-email-input"
                        type="email"
                        required
                        placeholder="votre.email@exemple.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-300 dark:border-lime-500/20 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-lime-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    data-testid="forgot-submit-btn"
                    className="w-full py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all mt-2 disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    <span>{locale === 'ar' ? 'إرسال رابط الاستعادة' : 'Envoyer le lien'}</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
                      className="text-[11px] text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:underline font-bold"
                    >
                      {locale === 'ar' ? '← العودة لتسجيل الدخول' : '← Retour à la connexion'}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </motion.div>
      </div>

      {activationModalOpen && registeredUserData && (
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
      )}
    </AnimatePresence>
  );
};
