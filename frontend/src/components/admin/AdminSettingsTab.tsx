'use client';

import React, { useState, useEffect } from 'react';
import { OfficersEditor } from './OfficersEditor';
import { readOfficers, type Officer } from '@/lib/officers';
import {
  ShieldAlert,
  Sliders,
  DollarSign,
  CreditCard,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  Database,
  RefreshCw,
  Sparkles,
  Server,
  Zap,
  Globe,
  Bell,
  Smartphone,
  User,
  UserCheck,
  Building2,
  Share2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';
import { Locale } from '@/types';

interface AdminSettingsTabProps {
  locale: Locale | string;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({ locale }) => {
  const { currentUser, updateProfile } = useAuthStore();

  // Admin Profile State
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    wilayaCode: currentUser?.wilayaCode || 16,
    institutionName: currentUser?.institutionName || 'DZ Prime Academy HQ',
    specialty: currentUser?.specialty || 'الإدارة العامة والتحكم المالي',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // System Config State
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [commissionRate, setCommissionRate] = useState(10);
  const [baridiMobEnabled, setBaridiMobEnabled] = useState(true);
  const [edahabiaEnabled, setEdahabiaEnabled] = useState(true);
  const [ccpReceiptsEnabled, setCcpReceiptsEnabled] = useState(true);
  const [autoVerifyCards, setAutoVerifyCards] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('https://wa.me/qr/5473INCXN3HJI1');
  const [telegramUsername, setTelegramUsername] = useState('dzprime_academy');
  const [linkedinUrl, setLinkedinUrl] = useState('https://www.linkedin.com/company/dzprimeacademy');
  const [vipPriceDzd, setVipPriceDzd] = useState(10000);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [systemSaving, setSystemSaving] = useState(false);
  const [systemSuccess, setSystemSuccess] = useState('');
  const [systemError, setSystemError] = useState('');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        wilayaCode: currentUser.wilayaCode || 16,
        institutionName: currentUser.institutionName || 'DZ Prime Academy HQ',
        specialty: currentUser.specialty || 'الإدارة العامة والتحكم المالي',
      });
    }

    // Load live platform settings from database
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          if (data.academicYear) setAcademicYear(data.academicYear);
          if (data.ambassadorCommissionRate !== undefined) setCommissionRate(data.ambassadorCommissionRate);
          if (data.baridiMobEnabled !== undefined) setBaridiMobEnabled(data.baridiMobEnabled);
          if (data.edahabiaEnabled !== undefined) setEdahabiaEnabled(data.edahabiaEnabled);
          if (data.ccpReceiptsEnabled !== undefined) setCcpReceiptsEnabled(data.ccpReceiptsEnabled);
          if (data.autoVerifyCards !== undefined) setAutoVerifyCards(data.autoVerifyCards);
          if (data.whatsappNumber) setWhatsappNumber(data.whatsappNumber);
          if (data.telegramUsername) setTelegramUsername(data.telegramUsername);
          if (data.linkedinUrl) setLinkedinUrl(data.linkedinUrl);
          if (data.vipPriceDzd !== undefined) setVipPriceDzd(data.vipPriceDzd);
          setOfficers(readOfficers(data.officers));
        }
      })
      .catch(() => {});
  }, [currentUser]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess('');
    setProfileError('');

    const wilaya = WILAYAS.find((w) => w.code === Number(profileForm.wilayaCode));
    const payload = {
      ...profileForm,
      wilayaCode: Number(profileForm.wilayaCode),
      wilayaName: wilaya ? getLocalizedWilayaName(wilaya, locale as Locale) : undefined,
    };

    const res = await updateProfile(payload);
    setProfileSaving(false);
    if (res.success) {
      setProfileSuccess(locale === 'ar' ? 'تم حفظ وتحديث بيانات المسؤول في قاعدة البيانات بنجاح ✓' : 'Profil administrateur mis à jour ✓');
      setTimeout(() => setProfileSuccess(''), 3500);
    } else {
      setProfileError(res.error || (locale === 'ar' ? 'فشل حفظ التعديلات' : 'Échec de la mise à jour'));
    }
  };

  const handleSaveSystemSettings = async (e: React.FormEvent) => {
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
          baridiMobEnabled,
          edahabiaEnabled,
          ccpReceiptsEnabled,
          autoVerifyCards,
          whatsappNumber,
          telegramUsername,
          linkedinUrl,
          officers,
          vipPriceDzd: Number(vipPriceDzd) || 10000,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSystemError(data.error || (locale === 'ar' ? 'فشل حفظ إعدادات النظام' : 'Échec de l\'enregistrement'));
      } else {
        setSystemSuccess(locale === 'ar' ? 'تم حفظ إعدادات النظام في قاعدة البيانات بنجاح ✓' : 'Paramètres système enregistrés ✓');
        setTimeout(() => setSystemSuccess(''), 3500);
      }
    } catch (err: any) {
      setSystemError(err?.message || (locale === 'ar' ? 'خطأ في الاتصال' : 'Erreur réseau'));
    } finally {
      setSystemSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword.length < 8 || /^\d+$/.test(newPassword)) {
      setPasswordError(locale === 'ar' ? 'كلمة المرور يجب أن تتكون من 8 أحرف على الأقل ولا تتكون من أرقام فقط' : 'Le mot de passe doit contenir au moins 8 caractères, pas uniquement des chiffres');
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
        setPasswordError(data.error || (locale === 'ar' ? 'فشل تغيير كلمة المرور' : 'Échec de la modification'));
      } else {
        setPasswordSuccess(locale === 'ar' ? 'تم تحديث كلمة مرور الإدارة بنجاح! ' : 'Mot de passe administrateur mis à jour ! ');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 4000);
      }
    } catch (err: any) {
      setPasswordError(err?.message || (locale === 'ar' ? 'خطأ في الاتصال' : 'Erreur réseau'));
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-arabic" data-testid="admin-settings-tab">
      {/* Header Banner */}
      <div className="dark p-5 rounded-3xl bg-[#111114] border border-lime-500/30 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-lime-400/20 text-lime-400 flex items-center justify-center font-black shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black flex items-center gap-2">
              <span>{locale === 'ar' ? 'إعدادات النظام والمنصة العامة' : 'Paramètres Généraux du Système'}</span>
              <span className="px-2 py-0.5 rounded-full bg-lime-400/20 text-lime-300 text-[10px] font-bold">
                DZ PRIME 2026
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {locale === 'ar'
                ? 'التحكم في معايير المنصة، بيانات المسؤول الشخصية، بوابات الدفع الجزائرية، وأمان الحساب'
                : 'Configuration de la plateforme, compte administrateur et sécurité'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-gray-300 flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>PostgreSQL Synchronized</span>
          </span>
        </div>
      </div>

      {/* Quick Link Card to Dedicated Footer Management */}
      <div className="p-5 rounded-3xl bg-amber-500/10 border border-gold-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gold-500/20 border border-gold-500/30 text-gold-400 flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white">
              {locale === 'ar'
                ? 'إدارة تذييل الموقع والروابط الاجتماعية (Footer Management)'
                : 'Gestion du Pied de Page & Réseaux Sociaux'}
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              {locale === 'ar'
                ? 'تحكم كامل في إضافة وحذف وتعديل منصات التواصل (فيسبوك، واتساب، تيليغرام، تيك توك، يوتيوب، لينكد إن...) وبيانات التذييل.'
                : 'Contrôlez vos réseaux sociaux (Facebook, TikTok, WhatsApp, etc.), coordonnées et liens de navigation.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            window.location.hash = '#footer';
          }}
          className="px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-gold-500/20 active:scale-95 transition-all whitespace-nowrap self-stretch sm:self-auto justify-center"
        >
          <span>{locale === 'ar' ? 'فتح لوحة إدارة التذييل ←' : 'Ouvrir le panneau Footer →'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Admin Profile Info (Saved to User in DB) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-5">
          <div className="flex items-center gap-2 text-white font-black text-sm border-b border-white/10 pb-3">
            <UserCheck className="w-4 h-4 text-lime-400" />
            <span>{locale === 'ar' ? 'بيانات المسؤول وتعديل الاسم' : 'Profil Administrateur'}</span>
          </div>

          {profileSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}
          {profileError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-3.5 text-xs">
            <div>
              <label htmlFor="as-f1" className="block text-gray-300 mb-1 font-semibold">
                {locale === 'ar' ? 'الاسم الكامل للمسؤول' : 'Nom complet'} *
              </label>
              <input id="as-f1"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="الاسم الكامل"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-lime-400"
              />
            </div>

            <div>
              <label htmlFor="as-f2" className="block text-gray-300 mb-1 font-semibold">
                {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <input id="as-f2"
                disabled
                value={currentUser?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-gray-400 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="as-f3" className="block text-gray-300 mb-1 font-semibold">
                {locale === 'ar' ? 'رقم الهاتف' : 'Téléphone'}
              </label>
              <input id="as-f3"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="0555 12 34 56"
                dir="ltr"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono focus:outline-none focus:border-lime-400"
              />
            </div>

            <div>
              <label htmlFor="as-f4" className="block text-gray-300 mb-1 font-semibold">
                {locale === 'ar' ? 'الولاية والمقر' : 'Wilaya'}
              </label>
              <select id="as-f4"
                value={profileForm.wilayaCode}
                onChange={(e) => setProfileForm({ ...profileForm, wilayaCode: Number(e.target.value) })}
                className="dark w-full px-3.5 py-2.5 rounded-xl bg-[#111114] border border-white/10 text-white focus:outline-none focus:border-lime-400"
              >
                {WILAYAS.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.code} - {getLocalizedWilayaName(w, locale as Locale)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="as-f5" className="block text-gray-300 mb-1 font-semibold">
                {locale === 'ar' ? 'المؤسسة أو الهيئة' : 'Institution'}
              </label>
              <input id="as-f5"
                value={profileForm.institutionName}
                onChange={(e) => setProfileForm({ ...profileForm, institutionName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-lime-400"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="w-full py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 active:scale-95 transition-all disabled:opacity-60"
              >
                {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{locale === 'ar' ? 'حفظ تعديل الاسم والبيانات' : 'Sauvegarder le profil'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: System & Commission Config */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-5">
          <div className="flex items-center gap-2 text-white font-black text-sm border-b border-white/10 pb-3">
            <Zap className="w-4 h-4 text-lime-400" />
            <span>{locale === 'ar' ? 'معايير المنصة والعمولات' : 'Paramètres de la Plateforme'}</span>
          </div>

          {systemSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{systemSuccess}</span>
            </div>
          )}
          {systemError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{systemError}</span>
            </div>
          )}

          <form onSubmit={handleSaveSystemSettings} className="space-y-3.5 text-xs">
            <div>
              <label htmlFor="as-f6" className="block text-gray-300 mb-1 font-semibold">
                {locale === 'ar' ? 'السنة الجامعية المعتمدة' : 'Année académique'}
              </label>
              <input id="as-f6"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono focus:outline-none focus:border-lime-400"
              />
            </div>

            <div>
              <label htmlFor="as-f7" className="block text-gray-300 mb-1 font-semibold">
                {locale === 'ar' ? 'نسبة عمولة السفراء (%)' : 'Taux commission ambassadeurs (%)'}
              </label>
              <input id="as-f7"
                type="number"
                min={1}
                max={50}
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-lime-400 font-bold font-mono focus:outline-none focus:border-lime-400"
              />
            </div>

            {/* Payment Gateways */}
            <div className="space-y-2 pt-1">
              <label className="block text-gray-300 font-semibold">
                {locale === 'ar' ? 'بوابات الدفع الإلكتروني' : 'Moyens de Paiement'}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBaridiMobEnabled(!baridiMobEnabled)}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    baridiMobEnabled
                      ? 'bg-lime-400/10 border-lime-400/40 text-lime-300'
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="font-bold">BaridiMob</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold">{baridiMobEnabled ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEdahabiaEnabled(!edahabiaEnabled)}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    edahabiaEnabled
                      ? 'bg-gold-500/10 border-gold-500/40 text-gold-300'
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span className="font-bold">Edahabia</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold">{edahabiaEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* Contact & Support Channels for Activations & Payments */}
            <div className="space-y-2.5 pt-2 border-t border-white/10">
              <label className="block text-lime-400 font-bold text-xs">
                {locale === 'ar' ? 'قنوات التواصل والدفع المباشر (تظهر للطلبة)' : 'Canaux Support & Paiements'}
              </label>

              <div>
                <label htmlFor="as-f8" className="block text-gray-300 text-[11px] mb-1">
                  {locale === 'ar' ? 'رقم واتساب الإدارة والدعم (WhatsApp)' : 'Numéro WhatsApp (Support)'}
                </label>
                <input id="as-f8"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="https://wa.me/qr/5473INCXN3HJI1"
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-lime-400"
                />
              </div>

              <div>
                <label htmlFor="as-f9" className="block text-gray-300 text-[11px] mb-1">
                  {locale === 'ar' ? 'معرّف تيليغرام الإدارة والدعم (Telegram)' : 'Nom d\'utilisateur Telegram (Support)'}
                </label>
                <input id="as-f9"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  placeholder="dzprime_academy"
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-lime-400"
                />
              </div>

              <div>
                <label htmlFor="as-f10" className="block text-gray-300 text-[11px] mb-1">
                  {locale === 'ar' ? 'سعر العضوية الذهبية VIP (دج) — يظهر بالشريط الجانبي وصفحات الترقية' : 'Prix Adhésion VIP Gold (DZD)'}
                </label>
                <div className="relative">
                  <input id="as-f10"
                    type="number"
                    min="0"
                    step="500"
                    value={vipPriceDzd}
                    onChange={(e) => setVipPriceDzd(Number(e.target.value))}
                    placeholder="10000"
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-400 font-bold"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="as-f11" className="block text-gray-300 text-[11px] mb-1">
                  {locale === 'ar' ? 'رابط حساب لينكد إن الرسمي (LinkedIn)' : 'Lien profil LinkedIn'}
                </label>
                <input id="as-f11"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/company/dzprimeacademy"
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-lime-400"
                />
              </div>

              <OfficersEditor value={officers} onChange={setOfficers} locale={locale} />
            </div>

            {/* Automation toggles */}
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-200">{locale === 'ar' ? 'التفعيل التلقائي للبطاقات' : 'Validation auto des cartes'}</div>
                  <div className="text-[10px] text-gray-400">{locale === 'ar' ? 'تفعيل بطاقات الطلبة فور رفع وصل الدفع' : 'Activer automatiquement'}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoVerifyCards(!autoVerifyCards)}
                  role="switch"
                  aria-checked={autoVerifyCards}
                  aria-label={locale === 'ar' ? 'التفعيل التلقائي للبطاقات' : 'Activation automatique des cartes'}
                  className={`w-10 h-5 rounded-full relative transition-all ${autoVerifyCards ? 'bg-lime-400' : 'bg-white/15'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${autoVerifyCards ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={systemSaving}
                className="w-full py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 active:scale-95 transition-all disabled:opacity-60"
              >
                {systemSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{locale === 'ar' ? 'حفظ إعدادات المنصة في DB' : 'Enregistrer les paramètres'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Card 3: Admin Password & Security */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-5">
          <div className="flex items-center gap-2 text-white font-black text-sm border-b border-white/10 pb-3">
            <KeyRound className="w-4 h-4 text-lime-400" />
            <span>{locale === 'ar' ? 'تغيير كلمة مرور الإدارة' : 'Modifier le mot de passe'}</span>
          </div>

          {passwordSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}
          {passwordError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3.5 text-xs">
            <div>
              <label htmlFor="as-f12" className="block text-gray-300 mb-1 font-semibold text-[11px]">
                {locale === 'ar' ? 'كلمة المرور الحالية' : 'Mot de passe actuel'}
              </label>
              <div className="relative">
                <input id="as-f12"
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white/5 border border-white/10 font-mono text-white focus:outline-none focus:border-lime-400"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  aria-label={locale === 'ar' ? 'إظهار أو إخفاء كلمة المرور' : 'Afficher ou masquer le mot de passe'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="as-f13" className="block text-gray-300 mb-1 font-semibold text-[11px]">
                {locale === 'ar' ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}
              </label>
              <div className="relative">
                <input id="as-f13"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="•••••••• (8+ أحرف)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white/5 border border-white/10 font-mono text-white focus:outline-none focus:border-lime-400"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={locale === 'ar' ? 'إظهار أو إخفاء كلمة المرور' : 'Afficher ou masquer le mot de passe'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="as-f14" className="block text-gray-300 mb-1 font-semibold text-[11px]">
                {locale === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirmer le mot de passe'}
              </label>
              <input id="as-f14"
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 font-mono text-white focus:outline-none focus:border-lime-400"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={passwordSaving}
                className="w-full py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 active:scale-95 transition-all disabled:opacity-60"
              >
                {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>{locale === 'ar' ? 'تحديث كلمة مرور الإدارة' : 'Modifier mot de passe'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
