'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UserCircle,
  Palette,
  ShieldAlert,
  Lock,
  Sun,
  Moon,
  Bell,
  LogOut,
  Check,
  Landmark,
  Smartphone,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  Loader2,
  Sparkles,
  CreditCard,
  Award,
  Tag,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useTheme } from '@/lib/theme';
import { WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';
import { isStaff } from '@/lib/rbac';
import { Locale } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: SettingsTab;
}

export type SettingsTab = 'profile' | 'preferences' | 'system' | 'security';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, defaultTab = 'profile' }) => {
  const { currentUser, signOut, updateProfile, setCurrentUser } = useAuthStore();
  const { t, locale, setLocale } = useTranslation();
  const { theme, setTheme } = useTheme();
  const isAdmin = isStaff(currentUser?.role);
  const isTeacher = currentUser?.role === 'TEACHER';
  const isAmbassador = currentUser?.role === 'AMBASSADOR';

  const [tab, setTab] = useState<SettingsTab>(defaultTab);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [commissionRate, setCommissionRate] = useState(10);
  const [baridiMob, setBaridiMob] = useState(true);
  const [edahabia, setEdahabia] = useState(true);
  const [systemSaving, setSystemSaving] = useState(false);
  const [systemSuccess, setSystemSuccess] = useState('');
  const [systemError, setSystemError] = useState('');

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    avatar: '',
    phone: '',
    wilayaCode: 16,
    institutionName: '',
    specialty: '',
    jobTitle: '',
    bio: '',
    whatsapp: '',
    telegramHandle: '',
    linkedin: '',
    facebook: '',
    instagram: '',
    youtube: '',
    website: '',
    github: '',
    ccpAccount: '',
    ccpCle: '',
    promoCode: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
      if (currentUser) {
        setProfileForm({
          name: currentUser.name || '',
          avatar: currentUser.avatar || '',
          phone: currentUser.phone || '',
          wilayaCode: currentUser.wilayaCode || 16,
          institutionName: currentUser.institutionName || '',
          specialty: currentUser.specialty || '',
          jobTitle: (currentUser as any).jobTitle || '',
          bio: (currentUser as any).bio || '',
          whatsapp: (currentUser as any).whatsapp || '',
          telegramHandle: (currentUser as any).telegram || '',
          linkedin: (currentUser as any).linkedin || '',
          facebook: (currentUser as any).facebook || '',
          instagram: (currentUser as any).instagram || '',
          youtube: (currentUser as any).youtube || '',
          website: (currentUser as any).website || '',
          github: (currentUser as any).github || '',
          ccpAccount: '',
          ccpCle: '',
          promoCode: '',
        });
        // Fetch extended profile if teacher or ambassador
        if (currentUser.role === 'TEACHER' || currentUser.role === 'AMBASSADOR') {
          fetch('/api/account')
            .then((r) => r.json())
            .then((data) => {
              if (data.teacherProfile) {
                setProfileForm((prev) => ({
                  ...prev,
                  ccpAccount: data.teacherProfile.ccpAccount || '',
                  ccpCle: data.teacherProfile.ccpCle || '',
                  institutionName: data.teacherProfile.university || prev.institutionName,
                  specialty: data.teacherProfile.specialty || prev.specialty,
                }));
              }
              if (data.ambassadorProfile) {
                setProfileForm((prev) => ({
                  ...prev,
                  telegramHandle: data.ambassadorProfile.telegramHandle || '',
                  promoCode: data.ambassadorProfile.promoCode || '',
                  institutionName: data.ambassadorProfile.institutionNameAr || prev.institutionName,
                  specialty: data.ambassadorProfile.specialtyName || prev.specialty,
                }));
              }
            })
            .catch(() => {});
        }
      }

      if (isAdmin) {
        fetch('/api/settings')
          .then((r) => r.json())
          .then((data) => {
            if (data) {
              if (data.academicYear) setAcademicYear(data.academicYear);
              if (data.ambassadorCommissionRate !== undefined) setCommissionRate(data.ambassadorCommissionRate);
              if (data.baridiMobEnabled !== undefined) setBaridiMob(data.baridiMobEnabled);
              if (data.edahabiaEnabled !== undefined) setEdahabia(data.edahabiaEnabled);
            }
          })
          .catch(() => {});
      }

      setPasswordSuccess('');
      setPasswordError('');
      setProfileSuccess('');
      setProfileError('');
      setSystemSuccess('');
      setSystemError('');
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const tabs: { id: SettingsTab; icon: any; labelAr: string; labelFr: string }[] = [
    { id: 'profile', icon: UserCircle, labelAr: 'الملف الأكاديمي', labelFr: 'Profil' },
    { id: 'security', icon: Lock, labelAr: 'الأمان وكلمة المرور', labelFr: 'Sécurité & Mot de passe' },
    { id: 'preferences', icon: Palette, labelAr: 'اللغة والمظهر', labelFr: 'Préférences' },
    ...(isAdmin
      ? [{ id: 'system' as SettingsTab, icon: Landmark, labelAr: 'إعدادات الإدارة والنظام', labelFr: 'Système Admin' }]
      : []),
  ];

  const handleProfileSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess('');
    setProfileError('');

    const wilaya = WILAYAS.find((w) => w.code === Number(profileForm.wilayaCode));
    const payload = {
      ...profileForm,
      wilayaCode: Number(profileForm.wilayaCode),
      wilayaName: wilaya ? getLocalizedWilayaName(wilaya, locale) : undefined,
    };

    const res = await updateProfile(payload);
    setProfileSaving(false);
    if (res.success) {
      setProfileSuccess(locale === 'ar' ? 'تم حفظ بيانات الملف بنجاح ✓' : 'Profil mis à jour avec succès ✓');
      setTimeout(() => setProfileSuccess(''), 3000);
    } else {
      setProfileError(res.error || (locale === 'ar' ? 'فشل حفظ التعديلات' : 'Échec de la mise à jour'));
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword.length < 8 || /^\d+$/.test(newPassword)) {
      setPasswordError(locale === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل ولا تتكون من أرقام فقط' : 'Le mot de passe doit contenir au moins 8 caractères, pas uniquement des chiffres');
      setPasswordSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(locale === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Les mots de passe ne correspondent pas');
      setPasswordSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || (locale === 'ar' ? 'فشل تغيير كلمة المرور' : 'Échec du changement'));
      } else {
        setPasswordSuccess(locale === 'ar' ? 'تم تغيير كلمة المرور بنجاح! ' : 'Mot de passe mis à jour avec succès ! ');
        if (currentUser?.mustChangePassword) setCurrentUser({ ...currentUser, mustChangePassword: false });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 4000);
      }
    } catch (err: any) {
      setPasswordError(err?.message || (locale === 'ar' ? 'حدث خطأ في الاتصال' : 'Erreur réseau'));
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSaveSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSystemSaving(true);
    setSystemSuccess('');
    setSystemError('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYear,
          ambassadorCommissionRate: commissionRate,
          baridiMobEnabled: baridiMob,
          edahabiaEnabled: edahabia,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSystemError(data.error || (locale === 'ar' ? 'فشل حفظ إعدادات النظام' : 'Échec de l\'enregistrement'));
      } else {
        setSystemSuccess(locale === 'ar' ? 'تم حفظ إعدادات النظام بنجاح ✓' : 'Paramètres système enregistrés ✓');
        setTimeout(() => setSystemSuccess(''), 3500);
      }
    } catch (err: any) {
      setSystemError(err?.message || (locale === 'ar' ? 'خطأ في الاتصال' : 'Erreur réseau'));
    } finally {
      setSystemSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        data-testid="settings-modal-backdrop"
        className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-navy-950/85 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl border border-slate-200 dark:border-lime-500/30 bg-white dark:bg-[#111114] text-slate-900 dark:text-white shadow-2xl flex flex-col font-arabic"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
            <div>
              <h3 className="text-sm sm:text-base font-black">
                {locale === 'ar' ? 'إعدادات الحساب والأمان' : 'Paramètres du Compte & Sécurité'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">
                {currentUser?.email} ({currentUser?.role})
              </p>
            </div>
            <button
              data-testid="settings-modal-close-btn"
              onClick={onClose}
              className="p-2 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-gray-300 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-[140px] sm:w-[200px] border-r border-slate-200 dark:border-white/10 p-2 sm:p-3 space-y-1 shrink-0 overflow-y-auto bg-slate-50/50 dark:bg-black/10">
              {tabs.map((tItem) => {
                const Icon = tItem.icon;
                const active = tab === tItem.id;
                return (
                  <button
                    key={tItem.id}
                    data-testid={`settings-tab-${tItem.id}`}
                    onClick={() => setTab(tItem.id)}
                    className={`w-full flex items-center gap-2 px-2.5 sm:px-3 py-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-left ${
                      active
                        ? 'bg-lime-400 text-navy-950 shadow-md'
                        : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{locale === 'ar' ? tItem.labelAr : tItem.labelFr}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto text-xs sm:text-sm">
              {/* Profile Tab */}
              {tab === 'profile' && (
                <form onSubmit={handleProfileSubmit} className="space-y-4" data-testid="settings-tab-profile-content">
                  {profileSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>{profileSuccess}</span>
                    </div>
                  )}
                  {profileError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{profileError}</span>
                    </div>
                  )}

                  {/* Avatar & Photo */}
                  <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10">
                    <div className="w-14 h-14 rounded-2xl bg-lime-400 text-navy-950 flex items-center justify-center font-black text-xl shadow-md shrink-0 overflow-hidden">
                      {profileForm.avatar ? (
                        <img src={profileForm.avatar} alt={profileForm.name} className="w-full h-full object-cover" />
                      ) : (
                        profileForm.name ? profileForm.name.charAt(0).toUpperCase() : 'U'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-slate-500 dark:text-gray-400 mb-1 font-semibold text-[11px]">
                        {locale === 'ar' ? 'رابط الصورة الشخصية (Avatar URL)' : 'Photo de profil (URL)'}
                      </label>
                      <input
                        dir="ltr"
                        value={profileForm.avatar}
                        onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs focus:outline-none focus:border-lime-400 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-gray-400 mb-1 font-semibold text-[11px]">
                      {locale === 'ar' ? 'الاسم الكامل' : 'Nom complet'}
                    </label>
                    <input
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-lime-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-gray-400 mb-1 font-semibold text-[11px]">
                      {locale === 'ar' ? 'البريد الإلكتروني (غير قابل للتعديل)' : 'Email (non modifiable)'}
                    </label>
                    <input
                      disabled
                      value={currentUser?.email || ''}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 font-mono text-slate-400 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-gray-400 mb-1 font-semibold text-[11px]">
                      {locale === 'ar' ? 'الهاتف (واتساب)' : 'Téléphone (WhatsApp)'}
                    </label>
                    <input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      dir="ltr"
                      placeholder="0555 12 34 56"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-lime-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-gray-400 mb-1 font-semibold text-[11px]">
                      {locale === 'ar' ? 'الولاية' : 'Wilaya'}
                    </label>
                    <select
                      value={profileForm.wilayaCode}
                      onChange={(e) => setProfileForm({ ...profileForm, wilayaCode: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#111114] border border-slate-200 dark:border-white/10 focus:outline-none"
                    >
                      {WILAYAS.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.code} - {getLocalizedWilayaName(w, locale)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-gray-400 mb-1 font-semibold text-[11px]">
                      {locale === 'ar' ? 'المؤسسة / الجامعة' : 'Institution / Université'}
                    </label>
                    <input
                      value={profileForm.institutionName}
                      onChange={(e) => setProfileForm({ ...profileForm, institutionName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-lime-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-gray-400 mb-1 font-semibold text-[11px]">
                      {locale === 'ar' ? 'التخصص الأكاديمي' : 'Spécialité'}
                    </label>
                    <input
                      value={profileForm.specialty}
                      onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                      placeholder="Mathématiques, Informatique..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-lime-400"
                    />
                  </div>

                  {isTeacher && (
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                      <div className="flex items-center gap-1.5 text-lime-400 font-bold text-xs">
                        <CreditCard className="w-4 h-4" />
                        <span>{locale === 'ar' ? 'بيانات تسوية المستحقات (CCP)' : 'Compte CCP'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-gray-400 mb-1 text-[10px]">
                            {locale === 'ar' ? 'رقم حساب CCP' : 'Numéro CCP'}
                          </label>
                          <input
                            value={profileForm.ccpAccount}
                            onChange={(e) => setProfileForm({ ...profileForm, ccpAccount: e.target.value })}
                            placeholder="0012345678"
                            className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-mono text-xs focus:outline-none focus:border-lime-400"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-1 text-[10px]">
                            {locale === 'ar' ? 'المفتاح' : 'Clé'}
                          </label>
                          <input
                            maxLength={2}
                            value={profileForm.ccpCle}
                            onChange={(e) => setProfileForm({ ...profileForm, ccpCle: e.target.value })}
                            placeholder="99"
                            className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-mono text-center text-xs focus:outline-none focus:border-lime-400"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {isAmbassador && (
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-lime-400 font-bold text-xs">
                          <Award className="w-4 h-4" />
                          <span>{locale === 'ar' ? 'بيانات سفير الولاية المعتمد' : 'Profil Ambassadeur Officiel'}</span>
                        </div>
                        {profileForm.promoCode && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-lime-400/20 text-lime-300 font-mono text-xs font-bold flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {profileForm.promoCode}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1 text-[10px]">
                          {locale === 'ar' ? 'معرف تليغرام (للتواصل والتوجيه)' : 'Identifiant Telegram (sans @)'}
                        </label>
                        <input
                          dir="ltr"
                          value={profileForm.telegramHandle}
                          onChange={(e) => setProfileForm({ ...profileForm, telegramHandle: e.target.value })}
                          placeholder="username"
                          className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-mono text-xs focus:outline-none focus:border-lime-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* Job Title / Exact Role */}
                  <div>
                    <label className="block text-slate-500 dark:text-gray-400 mb-1 font-semibold text-[11px]">
                      {locale === 'ar' ? 'المسمى الوظيفي أو الصفة (يظهر في البطاقة والملف الشخصي العام)' : 'Titre de fonction / Spécialité (affiché sur le profil)'}
                    </label>
                    <input
                      value={profileForm.jobTitle}
                      onChange={(e) => setProfileForm({ ...profileForm, jobTitle: e.target.value })}
                      placeholder={locale === 'ar' ? 'مثال: Chargée des Ressources Humaines أو أستاذ معتمد' : 'Ex: Chargée des Ressources Humaines'}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-lime-400"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-slate-500 dark:text-gray-400 mb-1 font-semibold text-[11px]">
                      {locale === 'ar' ? 'النبذة التعريفية (Bio) - تظهر عند مسح رمز QR' : 'Biographie (Bio) - visible au scan QR'}
                    </label>
                    <textarea
                      rows={2}
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      placeholder={locale === 'ar' ? 'اكتب نبذة عنك وعن اهتماماتك أو مسؤولياتك...' : 'Parlez de vous...'}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-lime-400 text-xs"
                    />
                  </div>

                  {/* Social Medias & Contact Channels */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-3">
                    <div className="flex items-center gap-1.5 text-lime-500 font-bold text-xs">
                      <Sparkles className="w-4 h-4" />
                      <span>{locale === 'ar' ? 'حسابات التواصل الاجتماعي وروابط الاتصال المباشر' : 'Réseaux Sociaux & Contact'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                      <div>
                        <label className="block text-slate-500 dark:text-gray-400 mb-0.5">WhatsApp (رقم الهاتف)</label>
                        <input
                          dir="ltr"
                          value={profileForm.whatsapp}
                          onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                          placeholder="0555 12 34 56"
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 font-mono text-xs focus:outline-none focus:border-lime-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 dark:text-gray-400 mb-0.5">Telegram (@معرف تليغرام)</label>
                        <input
                          dir="ltr"
                          value={profileForm.telegramHandle}
                          onChange={(e) => setProfileForm({ ...profileForm, telegramHandle: e.target.value })}
                          placeholder="username"
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 font-mono text-xs focus:outline-none focus:border-lime-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 dark:text-gray-400 mb-0.5">LinkedIn</label>
                        <input
                          dir="ltr"
                          value={profileForm.linkedin}
                          onChange={(e) => setProfileForm({ ...profileForm, linkedin: e.target.value })}
                          placeholder="linkedin.com/in/username"
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs focus:outline-none focus:border-lime-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 dark:text-gray-400 mb-0.5">Facebook</label>
                        <input
                          dir="ltr"
                          value={profileForm.facebook}
                          onChange={(e) => setProfileForm({ ...profileForm, facebook: e.target.value })}
                          placeholder="facebook.com/profile"
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs focus:outline-none focus:border-lime-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 dark:text-gray-400 mb-0.5">Instagram</label>
                        <input
                          dir="ltr"
                          value={profileForm.instagram}
                          onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                          placeholder="instagram.com/username"
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs focus:outline-none focus:border-lime-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 dark:text-gray-400 mb-0.5">YouTube</label>
                        <input
                          dir="ltr"
                          value={profileForm.youtube}
                          onChange={(e) => setProfileForm({ ...profileForm, youtube: e.target.value })}
                          placeholder="youtube.com/@channel"
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs focus:outline-none focus:border-lime-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 dark:text-gray-400 mb-0.5">GitHub (حساب أو رابط)</label>
                        <input
                          dir="ltr"
                          value={profileForm.github}
                          onChange={(e) => setProfileForm({ ...profileForm, github: e.target.value })}
                          placeholder="github.com/username"
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs focus:outline-none focus:border-lime-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 dark:text-gray-400 mb-0.5">{locale === 'ar' ? 'الموقع الشخصي أو الرابط' : 'Site web ou lien'}</label>
                        <input
                          dir="ltr"
                          value={profileForm.website}
                          onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs focus:outline-none focus:border-lime-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      data-testid="settings-save-profile-btn"
                      className="px-5 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-60"
                    >
                      {profileSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>{locale === 'ar' ? 'حفظ تعديلات الملف' : 'Sauvegarder'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Security & Password Tab */}
              {tab === 'security' && (
                <div className="space-y-5" data-testid="settings-tab-security-content">
                  {/* Change Password Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-3.5">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                      <KeyRound className="w-4 h-4 text-lime-500" />
                      <span>{locale === 'ar' ? 'تغيير كلمة المرور' : 'Modifier le mot de passe'}</span>
                    </div>

                    {passwordSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        <span>{passwordSuccess}</span>
                      </div>
                    )}

                    {passwordError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{passwordError}</span>
                      </div>
                    )}

                    <form onSubmit={handlePasswordChange} className="space-y-3">
                      <div>
                        <label className="block text-slate-500 dark:text-gray-400 mb-1 text-[11px] font-semibold">
                          {locale === 'ar' ? 'كلمة المرور الحالية' : 'Mot de passe actuel'}
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-3 py-2 pr-10 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 font-mono text-xs focus:outline-none focus:border-lime-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                          >
                            {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-slate-500 dark:text-gray-400 mb-1 text-[11px] font-semibold">
                            {locale === 'ar' ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              required
                              placeholder="•••••••• (8+ أحرف)"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full px-3 py-2 pr-10 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 font-mono text-xs focus:outline-none focus:border-lime-400"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                              {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-500 dark:text-gray-400 mb-1 text-[11px] font-semibold">
                            {locale === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirmer le mot de passe'}
                          </label>
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 font-mono text-xs focus:outline-none focus:border-lime-400"
                          />
                        </div>
                      </div>

                      <div className="pt-1 flex justify-end">
                        <button
                          type="submit"
                          disabled={passwordSaving}
                          data-testid="settings-change-password-btn"
                          className="px-5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-60"
                        >
                          {passwordSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>{locale === 'ar' ? 'تحديث كلمة المرور' : 'Mettre à jour'}</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* 2FA Protection Status */}
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        {locale === 'ar' ? 'جلسة الأمان: نشطة ومحمية' : 'Session sécurisée'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-gray-400">
                        {locale === 'ar' ? 'يتم تشفير كلمات المرور والرموز الأكاديمية بنظام bcrypt المعتمد' : 'Chiffrement sécurisé bcrypt'}
                      </p>
                    </div>
                  </div>

                  <button
                    data-testid="settings-signout-btn"
                    onClick={() => {
                      signOut();
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'تسجيل الخروج من الحساب' : 'Se déconnecter'}</span>
                  </button>
                </div>
              )}

              {/* Preferences Tab */}
              {tab === 'preferences' && (
                <div className="space-y-5" data-testid="settings-tab-preferences-content">
                  <div>
                    <label className="block text-slate-500 dark:text-gray-400 mb-2 font-semibold text-[11px]">
                      {locale === 'ar' ? 'لغة الواجهة' : "Langue de l'interface"}
                    </label>
                    <div className="flex gap-2">
                      {(['ar', 'fr', 'en'] as Locale[]).map((l) => (
                        <button
                          key={l}
                          data-testid={`settings-locale-${l}`}
                          onClick={() => setLocale(l)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                            locale === l
                              ? 'bg-lime-400 text-navy-950 border-lime-400'
                              : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300'
                          }`}
                        >
                          {l === 'ar' ? 'العربية' : l === 'fr' ? 'Français' : 'English'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-gray-400 mb-2 font-semibold text-[11px]">
                      {locale === 'ar' ? 'المظهر' : 'Apparence'}
                    </label>
                    <div className="flex gap-2">
                      <button
                        data-testid="settings-theme-light"
                        onClick={() => setTheme('light')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                          theme === 'light' ? 'bg-lime-400 text-navy-950 border-lime-400' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5" />
                        <span>{locale === 'ar' ? 'وضع النهار' : 'Clair'}</span>
                      </button>
                      <button
                        data-testid="settings-theme-dark"
                        onClick={() => setTheme('dark')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                          theme === 'dark' ? 'bg-lime-400 text-navy-950 border-lime-400' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300'
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5" />
                        <span>{locale === 'ar' ? 'الوضع الليلي الفاخر' : 'Luxury Dark'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-lime-500" />
                      <span className="text-xs font-bold">
                        {locale === 'ar' ? 'إشعارات الحصص المباشرة' : 'Notifications Masterclasses'}
                      </span>
                    </div>
                    <button
                      data-testid="settings-notif-toggle"
                      onClick={() => setNotifEnabled(!notifEnabled)}
                      className={`w-10 h-5 rounded-full relative transition-all ${notifEnabled ? 'bg-lime-400' : 'bg-slate-300 dark:bg-white/15'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${notifEnabled ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* System Tab (Admin only) */}
              {tab === 'system' && isAdmin && (
                <form onSubmit={handleSaveSystem} className="space-y-4" data-testid="settings-tab-system-content">
                  {systemSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{systemSuccess}</span>
                    </div>
                  )}
                  {systemError && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{systemError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-500 dark:text-gray-400 mb-1 font-semibold text-[11px]">
                      {locale === 'ar' ? 'السنة الجامعية' : 'Année académique'}
                    </label>
                    <input
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-gray-400 mb-1 font-semibold text-[11px]">
                      {locale === 'ar' ? 'نسبة عمولة السفراء (%)' : 'Taux Commission Ambassadeurs (%)'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none font-mono text-xs text-lime-600 dark:text-lime-400 font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-lime-500" />
                      <span className="text-xs font-bold">BaridiMob</span>
                    </div>
                    <button
                      type="button"
                      data-testid="settings-baridimob-toggle"
                      onClick={() => setBaridiMob(!baridiMob)}
                      className={`w-10 h-5 rounded-full relative transition-all ${baridiMob ? 'bg-lime-400' : 'bg-slate-300 dark:bg-white/15'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${baridiMob ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-lime-500" />
                      <span className="text-xs font-bold">EDAHABIA</span>
                    </div>
                    <button
                      type="button"
                      data-testid="settings-edahabia-toggle"
                      onClick={() => setEdahabia(!edahabia)}
                      className={`w-10 h-5 rounded-full relative transition-all ${edahabia ? 'bg-lime-400' : 'bg-slate-300 dark:bg-white/15'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${edahabia ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={systemSaving}
                      className="w-full py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 active:scale-95 transition-all disabled:opacity-60"
                    >
                      {systemSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>{locale === 'ar' ? 'حفظ إعدادات النظام في قاعدة البيانات' : 'Sauvegarder les paramètres'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
