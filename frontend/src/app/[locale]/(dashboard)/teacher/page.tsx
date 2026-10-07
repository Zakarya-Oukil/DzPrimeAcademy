'use client';

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

type TeacherTab = 'studio' | 'courses' | 'sessions' | 'roster' | 'drive' | 'profile' | 'community';

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

  // Drive Pedagogical Resources State
  const [driveFiles, setDriveFiles] = useState([
    {
      id: 'df-1',
      titleAr: 'سلسلة تمارين رقم 01 - الجداء السلمي والمستقيم في الفضاء',
      titleFr: 'Série TD N°01 - Produit scalaire & Droites',
      module: 'Mathématiques',
      category: 'TD',
      fileSize: '2.4 MB',
      createdAt: '2026-09-01',
      downloads: 142,
    },
    {
      id: 'df-2',
      titleAr: 'ملخص القوانين والوحدات الأساسية - ميكانيك نيوتن',
      titleFr: 'Formulaire de Révision - Mécanique de Newton',
      module: 'Physique',
      category: 'RÉSUMÉ',
      fileSize: '1.8 MB',
      createdAt: '2026-08-28',
      downloads: 289,
    },
    {
      id: 'df-3',
      titleAr: 'امتحان تجريبي مقترح مع الحل النموذجي المفصل',
      titleFr: 'Sujet d\'Examen Blanc & Corrigé Détaillé',
      module: 'Sciences',
      category: 'EXAM',
      fileSize: '4.1 MB',
      createdAt: '2026-08-22',
      downloads: 415,
    },
  ]);
  const [showAddDriveModal, setShowAddDriveModal] = useState(false);
  const [newFileTitle, setNewFileTitle] = useState('');
  const [newFileModule, setNewFileModule] = useState('');
  const [newFileCategory, setNewFileCategory] = useState<'TD' | 'RÉSUMÉ' | 'EXAM' | 'COURS'>('TD');

  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace('#', '') as TeacherTab;
      if (['studio', 'community', 'courses', 'sessions', 'roster', 'drive', 'profile'].includes(hash)) setTab(hash);
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
        setPasswordSuccess(locale === 'ar' ? 'تم تغيير كلمة المرور بنجاح! 🔒' : 'Mot de passe mis à jour avec succès ! 🔒');
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
    { id: 'studio', icon: Sparkles, labelAr: 'استوديو التدريس (Bento)', labelFr: 'Studio Bento' },
    { id: 'community', icon: Video, labelAr: 'فيديوهاتي ومنشوراتي', labelFr: 'Mes Vidéos & Posts' },
    { id: 'courses', icon: BookOpen, labelAr: 'مقرراتي ومقاييسي', labelFr: 'Mes Modules' },
    { id: 'sessions', icon: Video, labelAr: 'الحصص المباشرة', labelFr: 'Sessions Live' },
    { id: 'roster', icon: Users2, labelAr: 'قائمة الطلبة والحضور', labelFr: 'Liste & Présence' },
    { id: 'drive', icon: FolderOpen, labelAr: 'المطبوعات والسلاسل', labelFr: 'Drive & Supports' },
    { id: 'profile', icon: UserCheck, labelAr: 'الملف وحساب CCP', labelFr: 'Profil & CCP' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#070B18] text-slate-900 dark:text-white font-arabic p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8" data-testid="teacher-crextio-studio">
      {/* ================= 1. CREXTIO STYLE TOP BAR ================= */}
      <div className="rounded-3xl bg-white dark:bg-[#0D1429] border border-amber-200/60 dark:border-gold-500/20 p-5 sm:p-7 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gold-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-gold-700 dark:text-gold-400">
              CREXTIO ACADEMIC WORKSPACE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {locale === 'ar' ? `مرحباً، أستاذ ${currentUser?.name || ''}` : `Hello, Prof. ${currentUser?.name || 'Valentina'}`}
          </h1>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            {currentUser?.institutionName || 'Université des Sciences et de la Technologie Houari Boumediene (USTHB)'} • {currentUser?.specialty || 'Informatique & Mathématiques'}
          </p>
        </div>

        {/* Output Metrics Bar (Image 2 Style) */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <div className="text-center">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">91</span>
            <span className="text-[10px] text-slate-400 uppercase block font-bold">{locale === 'ar' ? 'طالب نشط' : 'Students'}</span>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-gray-800" />
          <div className="text-center">
            <span className="text-2xl sm:text-3xl font-black text-gold-600 dark:text-gold-400 font-mono">104</span>
            <span className="text-[10px] text-slate-400 uppercase block font-bold">{locale === 'ar' ? 'تسجيل بالدورات' : 'Enrollments'}</span>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-gray-800" />
          <div className="text-center">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">185</span>
            <span className="text-[10px] text-slate-400 uppercase block font-bold">{locale === 'ar' ? 'ساعة تدريس' : 'Hours Live'}</span>
          </div>
        </div>
      </div>

      {/* Top Pill Navigation Bar & Quick Action Tools */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-[#0D1429] border border-amber-200/60 dark:border-gold-500/20 overflow-x-auto no-scrollbar shadow-sm">
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
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-gold-500 via-amber-400 to-yellow-400 hover:from-gold-400 hover:to-yellow-300 text-navy-950 font-black text-xs transition-all shadow-md flex items-center gap-2 shrink-0 group"
          >
            <CreditCard className="w-4 h-4 text-navy-950 group-hover:scale-110 transition-transform" />
            <span className="font-mono">{currentUser?.studentCardId || 'DZ-TCH-16'}</span>
            <span className="px-1.5 py-0.2 rounded bg-black/15 text-[9px] font-extrabold uppercase">VIP</span>
          </button>

          <Link
            href={`/${locale}/leaderboard`}
            className="p-2 rounded-xl bg-white dark:bg-[#0D1429] hover:bg-slate-100 dark:hover:bg-white/10 border border-amber-200/60 dark:border-gold-500/20 text-gold-600 dark:text-gold-400 text-xs transition-colors"
            title={locale === 'ar' ? 'لوحة الصدارة' : 'Leaderboard'}
          >
            <Award className="w-4 h-4" />
          </Link>

          <Link
            href={`/${locale}/bot`}
            className="p-2 rounded-xl bg-white dark:bg-[#0D1429] hover:bg-slate-100 dark:hover:bg-white/10 border border-amber-200/60 dark:border-gold-500/20 text-emerald-600 dark:text-emerald-400 text-xs transition-colors"
            title={locale === 'ar' ? 'بوت الامتحانات والملخصات' : 'Smart Bot'}
          >
            <Sparkles className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Embedded Membership Card Modal */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#0D1429] border border-amber-200/60 dark:border-gold-500/30 p-6 space-y-4 shadow-2xl relative text-slate-900 dark:text-white">
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
          <div className="lg:col-span-4 rounded-3xl bg-white dark:bg-[#0D1429] border border-amber-200/60 dark:border-gold-500/20 p-5 sm:p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {locale === 'ar' ? 'الجدول الزمني للحصص' : 'Schedule Timeline'}
                </h3>
                <span className="text-xs text-slate-400 font-mono">LIVE MEET SESSIONS</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-600 dark:text-gold-300 text-[10px] font-bold">
                {locale === 'ar' ? 'جدولة الإدارة المركزية' : 'Programmé Admin'}
              </span>
            </div>

            {/* Calendar Mini Header */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-amber-500/10 dark:bg-navy-950 border border-amber-500/20 text-xs font-mono">
              <span className="text-slate-500 dark:text-slate-400">Sun 22</span>
              <span className="text-slate-500 dark:text-slate-400">Mon 23</span>
              <span className="text-slate-500 dark:text-slate-400">Tue 24</span>
              <span className="font-black px-2 py-0.5 rounded-lg bg-slate-950 dark:bg-gold-500 text-white dark:text-navy-950 shadow-sm">
                Wed 25
              </span>
              <span className="text-slate-500 dark:text-slate-400">Thu 26</span>
              <span className="text-slate-500 dark:text-slate-400">Fri 27</span>
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
          <div className="lg:col-span-5 space-y-6">
            {/* Salary & CCP Payouts Table Card */}
            <div className="rounded-3xl bg-white dark:bg-[#0D1429] border border-amber-200/60 dark:border-gold-500/20 p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {locale === 'ar' ? 'مستحقات وأرباح المقاييس' : 'Salary & Module Earnings'}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">CCP PAYOUT LEDGER</span>
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
                            {c.lessonsCount} {locale === 'ar' ? 'درس' : 'Leçons'} • {c.category}
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
            <div className="rounded-3xl bg-white dark:bg-[#0D1429] border border-amber-200/60 dark:border-gold-500/20 p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {locale === 'ar' ? 'مؤشرات التفاعل الأكاديمي' : 'Teaching Analytics'}
                </h3>
                <span className="text-xs text-gold-600 dark:text-gold-400 font-mono font-bold">2026</span>
              </div>
              <div className="h-28 flex items-end justify-between gap-2 px-2 pt-2">
                {[
                  { m: 'Jan', h: 30 },
                  { m: 'Feb', h: 45 },
                  { m: 'Mar', h: 60 },
                  { m: 'Apr', h: 80 },
                  { m: 'May', h: 95 },
                  { m: 'Jun', h: 70 },
                ].map((pt) => (
                  <div key={pt.m} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div style={{ height: `${pt.h}%` }} className="w-full rounded-t-lg bg-gold-400/80 dark:bg-gold-500/80 transition-all hover:bg-gold-500" />
                    <span className="text-[10px] text-slate-400 font-mono">{pt.m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Attendance Punch-Card & Composition (Image 2 Right) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Dark Attendance Report Card with Punch Dots (Image 2 Style) */}
            <div className="rounded-3xl bg-[#090E1F] border border-white/10 text-white p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                  {locale === 'ar' ? 'تقرير الحضور' : 'Attendance Report'}
                </span>
                <ArrowUpRight className="w-4 h-4 text-gold-400" />
              </div>

              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-3xl font-black text-white">63</span>
                <span className="text-xs text-emerald-400 font-bold">↗ 12</span>
                <span className="text-[10px] text-slate-400">{locale === 'ar' ? 'حاضر اليوم' : 'Present'}</span>
              </div>

              {/* Punch-card dot matrix (4 rows x 8 cols) */}
              <div className="grid grid-cols-8 gap-2 pt-2">
                {Array.from({ length: 32 }).map((_, i) => {
                  const isGold = (i * 3 + 7) % 3 === 0;
                  return (
                    <div
                      key={i}
                      className={`w-3.5 h-3.5 rounded-full ${
                        isGold ? 'bg-gold-400 shadow-sm shadow-gold-400/50' : 'bg-slate-800'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Student Composition Circular Arc (Image 2 Style) */}
            <div className="rounded-3xl bg-white dark:bg-[#0D1429] border border-amber-200/60 dark:border-gold-500/20 p-5 sm:p-6 space-y-4 shadow-sm text-center">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                {locale === 'ar' ? 'توزع التخصصات' : 'Student Composition'}
              </span>

              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-gold-500"
                    strokeDasharray="70, 100"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black font-mono">345</span>
                  <span className="text-[9px] text-slate-400 uppercase">Total</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 text-xs font-mono text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gold-500" /> 70% LMD</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" /> 30% BAC</span>
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

      {/* ================= 6. DRIVE TAB ================= */}
      {tab === 'drive' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60 dark:border-gray-800">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-gold-500" />
                <span>{locale === 'ar' ? 'المطبوعات وسلاسل التمارين (Drive)' : 'Supports de Cours & Séries'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                {locale === 'ar'
                  ? `إجمالي الملفات المشاركة مع طلبتك: ${driveFiles.length} ملف`
                  : `${driveFiles.length} documents partagés avec vos étudiants`}
              </p>
            </div>

            <button
              onClick={() => setShowAddDriveModal(true)}
              data-testid="add-drive-file-btn"
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-navy-950 font-black text-xs flex items-center gap-2 shadow-md shadow-gold-500/20 active:scale-95 transition-all w-fit"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{locale === 'ar' ? 'رفع مطبوعة أو ملخص جديد' : 'Ajouter un Document'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {driveFiles.map((file) => (
              <div
                key={file.id}
                data-testid={`drive-file-${file.id}`}
                className="p-4 rounded-3xl bg-white dark:bg-[#0D1429] border border-amber-200/60 dark:border-gold-500/20 shadow-sm hover:border-gold-500/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-gold-500/15 border border-gold-500/30 text-gold-600 dark:text-gold-400 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-navy-900 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold">
                      {file.category}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                    {locale === 'ar' ? file.titleAr : file.titleFr || file.titleAr}
                  </h4>
                  <p className="text-[11px] text-gold-600 dark:text-gold-400 font-semibold mt-1.5">{file.module}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{file.fileSize} &bull; {file.createdAt}</span>

                  <div className="flex items-center gap-1.5">
                    <a
                      href="#download"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(locale === 'ar' ? `بدء تنزيل: ${file.titleAr}` : `Téléchargement de: ${file.titleFr || file.titleAr}`);
                      }}
                      className="p-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-gold-500 hover:text-navy-950 text-slate-600 dark:text-slate-300 transition-colors"
                      title={locale === 'ar' ? 'تحميل' : 'Télécharger'}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => setDriveFiles(driveFiles.filter((f) => f.id !== file.id))}
                      className="p-1.5 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                      title={locale === 'ar' ? 'حذف' : 'Supprimer'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Drive File Modal */}
          {showAddDriveModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0D1429] border border-amber-200/60 dark:border-gold-500/30 p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-gold-500" />
                    <span>{locale === 'ar' ? 'رفع مطبوعة أو ملخص جديد' : 'Nouveau Document Pédagogique'}</span>
                  </h3>
                  <button
                    onClick={() => setShowAddDriveModal(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newFileTitle.trim()) return;
                    const newEntry = {
                      id: `df-${Date.now()}`,
                      titleAr: newFileTitle.trim(),
                      titleFr: newFileTitle.trim(),
                      module: newFileModule.trim() || (locale === 'ar' ? 'مقياس عام' : 'Module Général'),
                      category: newFileCategory,
                      fileSize: '1.5 MB',
                      createdAt: new Date().toISOString().slice(0, 10),
                      downloads: 0,
                    };
                    setDriveFiles([newEntry, ...driveFiles]);
                    setNewFileTitle('');
                    setNewFileModule('');
                    setShowAddDriveModal(false);
                  }}
                  className="space-y-3 font-arabic text-xs"
                >
                  <div>
                    <label className="block text-slate-700 dark:text-gray-300 mb-1 font-semibold">
                      {locale === 'ar' ? 'عنوان السلسلة أو المطبوعة' : 'Titre du document'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newFileTitle}
                      onChange={(e) => setNewFileTitle(e.target.value)}
                      placeholder={locale === 'ar' ? 'مثال: سلسلة تمارين رقم 02 - التحليل' : 'Ex: Série TD N°02 - Analyse'}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-gold-500/20 text-slate-900 dark:text-white focus:outline-none focus:border-gold-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-700 dark:text-gray-300 mb-1 font-semibold">
                        {locale === 'ar' ? 'المقياس / المادة' : 'Module'}
                      </label>
                      <input
                        type="text"
                        value={newFileModule}
                        onChange={(e) => setNewFileModule(e.target.value)}
                        placeholder="Math, Physique..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-gold-500/20 text-slate-900 dark:text-white focus:outline-none focus:border-gold-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-gray-300 mb-1 font-semibold">
                        {locale === 'ar' ? 'نوع الوثيقة' : 'Catégorie'}
                      </label>
                      <select
                        value={newFileCategory}
                        onChange={(e) => setNewFileCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-gold-500/20 text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="TD">TD / تمارين</option>
                        <option value="RÉSUMÉ">ملخص / Résumé</option>
                        <option value="EXAM">امتحان / Examen</option>
                        <option value="COURS">درس / Cours</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-gold-500/30 text-center space-y-1.5 hover:bg-gold-500/5 transition-colors cursor-pointer">
                    <UploadCloud className="w-7 h-7 text-gold-500 mx-auto" />
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {locale === 'ar' ? 'اسحب ملف PDF أو اضغط للاختيار' : 'Glissez votre fichier PDF ici'}
                    </p>
                    <p className="text-[10px] text-slate-400">PDF, PPTX, DOCX (Max 25MB)</p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-gold-500/20 active:scale-95 transition-all mt-2"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{locale === 'ar' ? 'نشر الملف لجميع الطلبة' : 'Publier le document'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= 7. PROFILE & CCP TAB ================= */}
      {tab === 'profile' && (
        <div className="space-y-6">
          {/* Teacher Card Presentation */}
          <div className="rounded-3xl bg-white dark:bg-[#0D1429] border border-amber-200/60 dark:border-gold-500/20 p-6 shadow-sm flex flex-col items-center space-y-4">
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
          <div className="rounded-3xl bg-white dark:bg-[#0D1429] border border-amber-200/60 dark:border-gold-500/20 p-6 space-y-4 shadow-sm">
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
                <input
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
                  <input
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
                  <input
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
                <input
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
                <input
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
          <div className="rounded-3xl bg-white dark:bg-[#0D1429] border border-amber-200/60 dark:border-gold-500/20 p-6 space-y-4 shadow-sm">
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
                <input
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
                <input
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
                <input
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
