'use client';

import { trackLabel } from '@/lib/courseDisplay';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Plus,
  Video,
  Users2,
  FolderOpen,
  BookOpen,
  Trash2,
  UserCheck,
  KeyRound,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  CreditCard,
  Building2,
  Phone,
  Mail,
  Loader2,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Download,
  UploadCloud,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/store';
import { usePlatformStore } from '@/lib/platformStore';
import { formatDZD } from '@/lib/format';
import { TeacherRosterPanel } from '@/components/dashboard/TeacherRosterPanel';
import { MembershipCard } from '@/components/card/MembershipCard';
import SocialFeed from '@/components/community/SocialFeed';
import { TeacherCoursesPanel, TeacherSessionsPanel } from '@/components/teacher/TeacherCatalogPanels';
import { WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';

type TeacherTab = 'studio' | 'courses' | 'sessions' | 'roster' | 'profile' | 'community';

export default function TeacherStudioPage() {
  const { locale, isRtl } = useTranslation();
  const { currentUser, updateProfile } = useAuthStore();
  const { courses, sessions } = usePlatformStore();
  const [tab, setTab] = useState<TeacherTab>('studio');
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Profile & Teacher Settings Form
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    wilayaCode: currentUser?.wilayaCode || 16,
    university: currentUser?.institutionName || '',
    specialty: currentUser?.specialty || '',
    ccpAccount: '',
    ccpCle: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace('#', '') as TeacherTab;
      if (['studio', 'community', 'courses', 'sessions', 'roster', 'profile'].includes(hash)) setTab(hash);
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  useEffect(() => {
    if (currentUser) {
      setProfileForm((prev) => ({
        ...prev,
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        wilayaCode: currentUser.wilayaCode || 16,
        university: currentUser.institutionName || '',
        specialty: currentUser.specialty || '',
      }));

      fetch('/api/account')
        .then((r) => r.json())
        .then((data) => {
          if (data.teacherProfile) {
            setProfileForm((prev) => ({
              ...prev,
              ccpAccount: data.teacherProfile.ccpAccount || '',
              ccpCle: data.teacherProfile.ccpCle || '',
              university: data.teacherProfile.university || prev.university,
              specialty: data.teacherProfile.specialty || prev.specialty,
            }));
          }
        })
        .catch(() => {});
    }
  }, [currentUser]);

  const myCourses = courses.filter((c) => c.teacherId === currentUser?.id);
  const mySessions = sessions.filter((s) => s.teacherId === currentUser?.id);
  const liveHours = Math.round(mySessions.reduce((t, x) => t + (x.durationMinutes || 0), 0) / 60);
  const weekDays = (() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  })();
  const sessionsPerMonth = (() => {
    const year = new Date().getFullYear();
    const counts = Array.from({ length: 12 }, () => 0);
    mySessions.forEach((x) => {
      const d = new Date(x.scheduledAt);
      if (d.getFullYear() === year) counts[d.getMonth()]++;
    });
    const max = Math.max(1, ...counts);
    return counts.map((n, i) => ({
      m: new Date(year, i, 1).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR', { month: 'short' }),
      n,
      h: (n / max) * 100,
    }));
  })();

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess('');
    setProfileError('');

    const wilaya = WILAYAS.find((w) => w.code === Number(profileForm.wilayaCode));
    const payload = {
      ...profileForm,
      wilayaCode: Number(profileForm.wilayaCode),
      wilayaName: wilaya ? getLocalizedWilayaName(wilaya, locale as any) : undefined,
      institutionName: profileForm.university,
    };

    const res = await updateProfile(payload);
    setProfileSaving(false);
    if (res.success) {
      setProfileSuccess(locale === 'ar' ? 'تم حفظ بيانات الأستاذ وحساب CCP بنجاح ✓' : 'Profil enseignant et CCP mis à jour ✓');
      setTimeout(() => setProfileSuccess(''), 3500);
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
        setPasswordError(data.error || (locale === 'ar' ? 'فشل تغيير كلمة المرور' : 'Échec du changement'));
      } else {
        setPasswordSuccess(locale === 'ar' ? 'تم تغيير كلمة المرور بنجاح! ' : 'Mot de passe mis à jour avec succès ! ');
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

  const tabs: { id: TeacherTab; icon: any; labelAr: string; labelFr: string }[] = [
    { id: 'studio', icon: Sparkles, labelAr: 'استوديو التدريس', labelFr: "Studio d'enseignement" },
    { id: 'community', icon: Video, labelAr: 'فيديوهاتي ومنشوراتي', labelFr: 'Mes Vidéos & Posts' },
    { id: 'courses', icon: BookOpen, labelAr: 'مقرراتي ومقاييسي', labelFr: 'Mes Modules' },
    { id: 'sessions', icon: Video, labelAr: 'الحصص المباشرة', labelFr: 'Sessions Live' },
    { id: 'roster', icon: Users2, labelAr: 'قائمة الطلبة والحضور', labelFr: 'Liste & Présence' },
    { id: 'profile', icon: UserCheck, labelAr: 'الملف وحساب CCP', labelFr: 'Profil & CCP' },
  ];

  return (
    <div className="min-h-screen bg-[#f4f5f6] dark:bg-[#0b0b0d] text-slate-900 dark:text-white font-arabic p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8" data-testid="teacher-crextio-studio">
      {/* ================= 1. CREXTIO STYLE TOP BAR ================= */}
      <div className="rounded-3xl bg-white dark:bg-[#111114] border border-amber-200/60 dark:border-gold-500/20 p-5 sm:p-7 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          {currentUser?.institutionName && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gold-500 " />
              <span className="text-xs font-bold tracking-wide text-gold-700 dark:text-gold-400">{currentUser.institutionName}</span>
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {locale === 'ar' ? `مرحباً، أستاذ ${currentUser?.name || ''}` : `Bonjour, Prof. ${currentUser?.name || ''}`}
          </h1>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            {currentUser?.specialty || ''}
          </p>
        </div>

        {/* Output Metrics Bar (Image 2 Style) */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <div className="text-center">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">{myCourses.length}</span>
            <span className="text-[10px] text-slate-400 uppercase block font-bold">{locale === 'ar' ? 'مقاييسي' : 'Modules'}</span>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-gray-800" />
          <div className="text-center">
            <span className="text-2xl sm:text-3xl font-black text-gold-600 dark:text-gold-400 font-mono">{mySessions.length}</span>
            <span className="text-[10px] text-slate-400 uppercase block font-bold">{locale === 'ar' ? 'حصص مباشرة' : 'Live sessions'}</span>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-gray-800" />
          <div className="text-center">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{liveHours}</span>
            <span className="text-[10px] text-slate-400 uppercase block font-bold">{locale === 'ar' ? 'ساعة تدريس' : 'Live hours'}</span>
          </div>
        </div>
      </div>

      {/* Top Pill Navigation Bar & Quick Action Tools */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-[#111114] border border-amber-200/60 dark:border-gold-500/20 overflow-x-auto no-scrollbar shadow-sm">
          {tabs.map((tItem) => {
            const Icon = tItem.icon;
            const active = tab === tItem.id;
            return (
              <button
                key={tItem.id}
                onClick={() => {
                  setTab(tItem.id);
                  window.history.replaceState(null, '', `#${tItem.id}`);
                }}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                  active
                    ? 'bg-slate-950 dark:bg-gold-500 text-white dark:text-navy-950 shadow-md font-black'
                    : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? tItem.labelAr : tItem.labelFr}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Launchers: Digital Card + Leaderboard + Bot */}
        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
          <button
            onClick={() => setIsCardModalOpen(true)}
            data-testid="teacher-header-card-btn"
            className="px-3.5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-black text-xs transition-all shadow-md flex items-center gap-2 shrink-0 group"
          >
            <CreditCard className="w-4 h-4 text-navy-950 group-hover:scale-110 transition-transform" />
            <span className="font-mono">{currentUser?.studentCardId || 'DZ-TCH-16'}</span>
            <span className="px-1.5 py-0.2 rounded bg-black/15 text-[9px] font-extrabold uppercase">VIP</span>
          </button>

          <Link
            href={`/${locale}/leaderboard`}
            className="p-2 rounded-xl bg-white dark:bg-[#111114] hover:bg-slate-100 dark:hover:bg-white/10 border border-amber-200/60 dark:border-gold-500/20 text-gold-600 dark:text-gold-400 text-xs transition-colors"
            title={locale === 'ar' ? 'لوحة الصدارة' : 'Leaderboard'}
          >
            <Award className="w-4 h-4" />
          </Link>

          <Link
            href={`/${locale}/bot`}
            className="p-2 rounded-xl bg-white dark:bg-[#111114] hover:bg-slate-100 dark:hover:bg-white/10 border border-amber-200/60 dark:border-gold-500/20 text-emerald-600 dark:text-emerald-400 text-xs transition-colors"
            title={locale === 'ar' ? 'مساعد الامتحانات' : 'Assistant examens'}
          >
            <Sparkles className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Embedded Membership Card Modal */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#111114] border border-amber-200/60 dark:border-gold-500/30 p-6 space-y-4 shadow-2xl relative text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gold-500" />
                <h3 className="font-black text-base font-arabic">
                  {locale === 'ar' ? 'بطاقة الأستاذ الرقمية المعتمدة' : 'Carte Officielle Enseignant'}
                </h3>
              </div>
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg text-xs"
              >
                ✕
              </button>
            </div>

            <div className="py-2 flex justify-center">
              <MembershipCard user={currentUser} allowExport={true} />
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. MAIN CREXTIO BENTO GRID ================= */}
      {tab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Vertical Schedule Timeline (Image 2 Style) */}
          <div className="lg:col-span-4 rounded-3xl bg-white dark:bg-[#111114] border border-amber-200/60 dark:border-gold-500/20 p-5 sm:p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {locale === 'ar' ? 'الجدول الزمني للحصص' : 'Calendrier des sessions'}
                </h3>
                <span className="text-xs text-slate-400">{locale === 'ar' ? 'حصص البث المباشر' : 'Sessions en direct'}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-600 dark:text-gold-300 text-[10px] font-bold">
                {locale === 'ar' ? 'جدولة الإدارة المركزية' : 'Programmé Admin'}
              </span>
            </div>

            {/* Calendar Mini Header: current week */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5" data-testid="teacher-week-strip">
              {weekDays.map((d) => {
                const today = d.toDateString() === new Date().toDateString();
                const loc = locale === 'ar' ? 'ar-DZ' : 'fr-FR';
                return (
                  <div
                    key={d.toDateString()}
                    className={`flex flex-col items-center justify-center rounded-xl py-1.5 sm:py-2 border ${
                      today
                        ? 'bg-slate-950 dark:bg-gold-500 text-white dark:text-navy-950 border-transparent shadow-sm'
                        : 'bg-amber-500/10 dark:bg-navy-950 border-amber-500/20 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] sm:text-[11px] font-bold leading-tight">{d.toLocaleDateString(loc, { weekday: 'short' })}</span>
                    <span className="text-sm sm:text-base font-black leading-tight">{d.getDate()}</span>
                  </div>
                );
              })}
            </div>

            {/* Vertical Timeline Nodes */}
            <div className="space-y-4 relative pl-6 border-l-2 border-slate-200 dark:border-gray-800 ml-3">
              {mySessions.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 text-xs text-slate-500 text-center font-arabic">
                  {locale === 'ar' ? 'لا توجد حصص مجدولة اليوم. يتم جدولة الحصص الوطنية وتوزيعها عبر الإدارة المركزية والمسؤولة التجارية.' : 'Aucune session aujourd\'hui. Les sessions sont gérées par l\'administration.'}
                </div>
              ) : (
                mySessions.map((ses, idx) => (
                  <div key={ses.id} className="relative group">
                    {/* Step Node Dot */}
                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white dark:bg-navy-900 border-2 border-gold-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold-500" />
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900 dark:bg-navy-950 text-white space-y-2 shadow-md">
                      <div className="flex items-center justify-between text-[10px] text-gold-400 font-mono">
                        <span>{new Date(ses.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 font-bold">
                          {ses.durationMinutes} min
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold truncate">{ses.title}</h4>
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-[11px] text-slate-400 font-mono">{ses.platform}</span>
                        {ses.meetUrl ? (
                          <a
                            href={ses.meetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1"
                          >
                            <Video className="w-3 h-3" />
                            <span>{locale === 'ar' ? 'بدء البث' : 'Lancer'}</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400">Google Meet</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CENTER COLUMN: Salary & Payout Ledger + Courses Bento (Image 2 Center) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Salary & CCP Payouts Table Card */}
            <div className="rounded-3xl bg-white dark:bg-[#111114] border border-amber-200/60 dark:border-gold-500/20 p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {locale === 'ar' ? 'مستحقات وأرباح المقاييس' : 'Revenus des modules'}
                  </h3>
                  <span className="text-xs text-slate-400">{locale === 'ar' ? 'سجل الدفعات (CCP)' : 'Registre des versements CCP'}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-600 dark:text-gold-300 text-[10px] font-bold">
                  {locale === 'ar' ? 'إدارة المقاييس المركزية' : 'Gestion Admin'}
                </span>
              </div>

              {/* Table List */}
              <div className="space-y-2.5">
                {myCourses.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-navy-950 text-center text-xs text-slate-500 font-arabic">
                    {locale === 'ar' ? 'لا توجد مقاييس مسندة بعد. يتم إسناد المقاييس وتعيين الأساتذة عبر الإدارة التجارية المركزية.' : 'Aucun module assigné pour le moment. Les modules sont attribués par l\'administration.'}
                  </div>
                ) : (
                  myCourses.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950/80 border border-slate-200 dark:border-gray-800 flex items-center justify-between gap-3 hover:border-gold-500/40 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gold-500/20 text-gold-600 dark:text-gold-400 flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {locale === 'ar' ? c.titleAr : c.titleFr}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {c.lessonsCount} {locale === 'ar' ? 'درس' : 'Leçons'} • {trackLabel(c.category, locale)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono text-xs font-black text-gold-700 dark:text-gold-400">
                          {formatDZD(c.priceDzd)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-mono">
                          Active
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Teaching Statistics Waves & Output Bento */}
            <div className="rounded-3xl bg-white dark:bg-[#111114] border border-amber-200/60 dark:border-gold-500/20 p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {locale === 'ar' ? 'الحصص المباشرة حسب الشهر' : 'Live sessions per month'}
                </h3>
                <span className="text-xs text-gold-600 dark:text-gold-400 font-mono font-bold">{new Date().getFullYear()}</span>
              </div>
              <div className="h-28 flex items-end justify-between gap-2 px-2 pt-2">
                {sessionsPerMonth.map((pt) => (
                  <div key={pt.m} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] text-slate-500 font-mono">{pt.n || ''}</span>
                    <div style={{ height: `${pt.h}%` }} className="w-full min-h-[2px] rounded-t-lg bg-gold-400/80 dark:bg-gold-500/80" />
                    <span className="text-[10px] text-slate-400 font-mono">{pt.m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 3. COURSES TAB ================= */}
      {tab === 'courses' && currentUser && <TeacherCoursesPanel locale={locale} userId={currentUser.id} />}

      {/* ================= 4. SESSIONS TAB ================= */}
      {tab === 'sessions' && currentUser && <TeacherSessionsPanel locale={locale} userId={currentUser.id} />}

      {/* ================= 5. ROSTER TAB ================= */}
      {tab === 'roster' && <TeacherRosterPanel locale={locale} />}

      {/* ================= 7. PROFILE & CCP TAB ================= */}
      {tab === 'profile' && (
        <div className="space-y-6">
          {/* Teacher Card Presentation */}
          <div className="rounded-3xl bg-white dark:bg-[#111114] border border-amber-200/60 dark:border-gold-500/20 p-6 shadow-sm flex flex-col items-center space-y-4">
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-gold-500" />
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {locale === 'ar' ? 'بطاقة الاعتماد الرقمية للأستاذ' : 'Carte d\'Identité Numérique Enseignant'}
                </h3>
              </div>
              <Link
                href={`/${locale}/profile/${currentUser?.studentCardId || currentUser?.id}`}
                className="px-3.5 py-1.5 rounded-xl bg-gold-500/20 hover:bg-gold-500/30 border border-gold-500/40 text-gold-700 dark:text-gold-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'معاينة الملف الشخصي العام' : 'Profil Public'}</span>
              </Link>
            </div>
            <MembershipCard user={currentUser || undefined} allowExport={true} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CCP & University Profile */}
          <div className="rounded-3xl bg-white dark:bg-[#111114] border border-amber-200/60 dark:border-gold-500/20 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gold-500" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {locale === 'ar' ? 'حساب تحويل المستحقات (CCP)' : 'Coordonnées Financières & CCP'}
              </h3>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-3.5 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {locale === 'ar' ? 'الاسم واللقب' : 'Nom Complet'}
                </label>
                <input aria-label={locale === 'ar' ? 'الاسم واللقب' : 'Nom Complet'}
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-gray-800 text-xs text-slate-900 dark:text-white focus:outline-none font-arabic"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {locale === 'ar' ? 'رقم حساب CCP' : 'Numéro de Compte CCP'}
                  </label>
                  <input aria-label="0012345678"
                    type="text"
                    value={profileForm.ccpAccount}
                    onChange={(e) => setProfileForm({ ...profileForm, ccpAccount: e.target.value })}
                    placeholder="0012345678"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-gray-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {locale === 'ar' ? 'المفتاح (Clé)' : 'Clé CCP'}
                  </label>
                  <input aria-label="45"
                    type="text"
                    value={profileForm.ccpCle}
                    onChange={(e) => setProfileForm({ ...profileForm, ccpCle: e.target.value })}
                    placeholder="45"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-gray-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {locale === 'ar' ? 'الجامعة / الكلية' : 'Université / Faculté'}
                </label>
                <input aria-label={locale === 'ar' ? 'الجامعة / الكلية' : 'Université / Faculté'}
                  type="text"
                  value={profileForm.university}
                  onChange={(e) => setProfileForm({ ...profileForm, university: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-gray-800 text-xs text-slate-900 dark:text-white focus:outline-none font-arabic"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {locale === 'ar' ? 'التخصص والمادة' : 'Spécialité & Matière'}
                </label>
                <input aria-label={locale === 'ar' ? 'التخصص والمادة' : 'Spécialité & Matière'}
                  type="text"
                  value={profileForm.specialty}
                  onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-gray-800 text-xs text-slate-900 dark:text-white focus:outline-none font-arabic"
                />
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="w-full py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{locale === 'ar' ? 'حفظ بيانات الحساب و CCP' : 'Enregistrer'}</span>
              </button>

              {profileSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold text-center">
                  {profileSuccess}
                </div>
              )}
            </form>
          </div>

          {/* Password Security Form */}
          <div className="rounded-3xl bg-white dark:bg-[#111114] border border-amber-200/60 dark:border-gold-500/20 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {locale === 'ar' ? 'تغيير كلمة المرور' : 'Sécurité du compte'}
              </h3>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-3.5 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {locale === 'ar' ? 'كلمة المرور الحالية' : 'Mot de passe actuel'}
                </label>
                <input aria-label={locale === 'ar' ? 'كلمة المرور الحالية' : 'Mot de passe actuel'}
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-gray-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {locale === 'ar' ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}
                </label>
                <input aria-label={locale === 'ar' ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-gray-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirmer le mot de passe'}
                </label>
                <input aria-label={locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirmer le mot de passe'}
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-gray-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={passwordSaving}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-purple-600 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                <span>{locale === 'ar' ? 'تحديث كلمة المرور' : 'Mettre à jour'}</span>
              </button>

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold text-center">
                  {passwordSuccess}
                </div>
              )}
              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-bold text-center">
                  {passwordError}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
      )}

      {/* ================= 8. COMMUNITY & VIDEO POSTING TAB ================= */}
      {tab === 'community' && (
        <div className="space-y-6">
          <SocialFeed
            authorFilterId={currentUser?.id}
            emptyMessage="لم تقم بنشر أي فيديوهات أو مقالات بعد. اضغط على الزر الذهبي أعلاه لنشر أول فيديو أو درس لك!"
          />
        </div>
      )}

    </div>
  );
}
