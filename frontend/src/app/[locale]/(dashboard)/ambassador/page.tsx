'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  Star,
  Calendar,
  Send,
  PlusCircle,
  Video,
  MapPin,
  Clock,
  CheckCircle2,
  Users,
  MessageSquare,
  Sparkles,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Copy,
  ExternalLink,
  CreditCard,
  Building2,
  BookOpen,
  Share2,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Phone,
  Mail,
  Tag,
  Loader2,
  TrendingUp,
  ArrowUpRight,
  ChevronRight,
  Search,
  Activity,
  DollarSign,
  PieChart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { AmbassadorDirectory } from '@/components/ambassadors/AmbassadorDirectory';
import { MembershipCard } from '@/components/card/MembershipCard';
import SocialFeed from '@/components/community/SocialFeed';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/store';
import { isAmbassador, isTeacher } from '@/lib/rbac';
import { RECENT_POSTS, AMBASSADORS, CERTIFIED_TEACHERS, WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';
import { Post, PostType, PostComment, AmbassadorProfile, Locale } from '@/types';
import { formatDZD } from '@/lib/format';

type AmbassadorTab = 'overview' | 'workshops' | 'community' | 'reviews' | 'network' | 'profile';

export default function AmbassadorDashboardPage() {
  const { t, locale, isRtl } = useTranslation();
  const { currentUser, updateProfile } = useAuthStore();

  const [activeTab, setActiveTab] = useState<AmbassadorTab>('overview');
  const [posts, setPosts] = useState<Post[]>(RECENT_POSTS);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('SESSION_SCHEDULE');
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('user-teacher');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [growthView, setGrowthView] = useState<'MONTH' | 'ANNUAL'>('MONTH');

  // Active comment input
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Ambassador Database Profile State
  const [dbAmbassador, setDbAmbassador] = useState<any>(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    wilayaCode: currentUser?.wilayaCode || 16,
    institutionName: currentUser?.institutionName || '',
    specialty: currentUser?.specialty || '',
    telegramHandle: '',
    bioAr: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Change Form State
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
      const hash = window.location.hash.replace('#', '') as AmbassadorTab;
      if (['overview', 'workshops', 'reviews', 'network', 'profile'].includes(hash)) {
        setActiveTab(hash);
      }
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
        institutionName: currentUser.institutionName || '',
        specialty: currentUser.specialty || '',
      }));

      fetch('/api/account')
        .then((r) => r.json())
        .then((data) => {
          if (data.ambassadorProfile) {
            setDbAmbassador(data.ambassadorProfile);
            setProfileForm((prev) => ({
              ...prev,
              telegramHandle: data.ambassadorProfile.telegramHandle || '',
              bioAr: data.ambassadorProfile.bioAr || '',
              institutionName: data.ambassadorProfile.institutionNameAr || prev.institutionName,
              specialty: data.ambassadorProfile.specialtyName || prev.specialty,
            }));
          }
        })
        .catch(() => {});
    }
  }, [currentUser]);

  const defaultAmbassadorProfile: AmbassadorProfile = {
    id: 'amb-default',
    userId: currentUser?.id || 'user-ambassador',
    user: {
      id: currentUser?.id || 'user-ambassador',
      name: currentUser?.name || 'Ambassadeur DZ PRIME',
      email: currentUser?.email || 'ambassador@dzprime.academy',
      role: 'AMBASSADOR',
      phone: currentUser?.phone || '0555000000',
      createdAt: currentUser?.createdAt || '2026-01-01T00:00:00.000Z',
    },
    wilayaCode: currentUser?.wilayaCode || 16,
    wilayaNameAr: currentUser?.wilayaName || 'الجزائر',
    wilayaNameFr: 'Alger',
    institutionId: 'inst-usthb',
    institutionNameAr: currentUser?.institutionName || 'جامعة العلوم والتكنولوجيا هواري بومدين (USTHB)',
    institutionNameFr: 'USTHB Bab Ezzouar',
    specialtyName: currentUser?.specialty || 'Informatique & Sciences',
    telegramHandle: '@dzprime_ambassador',
    bioAr: 'سفير معتمد لمنصة DZ PRIME ACADEMY، أرافق الطلبة للتحضير والتميز الأكاديمي.',
    bioFr: "Ambassadeur certifié DZ PRIME ACADEMY, j'accompagne les étudiants vers l'excellence.",
    ratingAverage: 5.0,
    ratingsCount: 48,
    isVerified: true,
    upcomingSessionsCount: 3,
    totalTipsShared: 12,
    studentsMentoredCount: 1240,
    reviews: [
      {
        id: 'rev-1',
        studentName: 'Yacine B.',
        institution: 'USTHB',
        comment: 'سفير متميز وحصص مراجعة في القمة!',
        score: 5,
        createdAt: '2026-02-15T00:00:00.000Z',
      },
      {
        id: 'rev-2',
        studentName: 'Amira M.',
        institution: 'Fac Centrale',
        comment: 'Disponibilité et explications très claires.',
        score: 5,
        createdAt: '2026-02-20T00:00:00.000Z',
      },
    ],
  };

  const fallbackAmbassador: AmbassadorProfile =
    AMBASSADORS.find((a) => a.userId === currentUser?.id) || (AMBASSADORS.length > 0 ? AMBASSADORS[0] : defaultAmbassadorProfile);

  const currentPromoCode = dbAmbassador?.promoCode || `WIL${currentUser?.wilayaCode || 16}-VIP`;
  const currentCommission = dbAmbassador?.commissionDzd ?? 432988;
  const currentReferrals = dbAmbassador?.referralsCount ?? 215;

  const handleTabClick = (tKey: AmbassadorTab) => {
    setActiveTab(tKey);
    window.history.replaceState(null, '', `#${tKey}`);
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/${locale}/ambassadors`);
      setCopiedLink(true);
      try {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#D4AF37', '#10B981', '#A3E635'],
        });
      } catch (e) {}
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyPromo = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentPromoCode);
      setCopiedPromo(true);
      try {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#D4AF37', '#10B981', '#A3E635'],
        });
      } catch (e) {}
      setTimeout(() => setCopiedPromo(false), 2500);
    }
  };

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
      setProfileSuccess(locale === 'ar' ? 'تم حفظ بيانات السفير بنجاح ✓' : 'Profil ambassadeur mis à jour ✓');
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

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    const teacherObj = CERTIFIED_TEACHERS.find((tch) => tch.id === selectedTeacherId);

    const newPost: Post = {
      id: `post-${Date.now()}`,
      title,
      content,
      type: postType,
      wilayaCode: currentUser?.wilayaCode || fallbackAmbassador?.wilayaCode || 16,
      wilayaName: currentUser?.wilayaName || fallbackAmbassador?.wilayaNameAr || 'Alger',
      institutionName: currentUser?.institutionName || fallbackAmbassador?.institutionNameAr || 'USTHB Bab Ezzouar',
      isOnline,
      location: isOnline ? undefined : location || 'Amphithéâtre C',
      isApproved: true,
      authorId: currentUser?.id || 'user-ambassador',
      authorName: currentUser?.name || 'Ambassadeur',
      authorRole: currentUser?.role || 'AMBASSADOR',
      assignedTeacherId: teacherObj?.id || selectedTeacherId,
      assignedTeacherName: teacherObj?.name || 'Professeur Invité',
      comments: [],
      createdAt: new Date().toISOString(),
    };

    setPosts([newPost, ...posts]);
    setTitle('');
    setContent('');
    setLocation('');
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  const handleAddComment = (postId: string) => {
    if (!commentText.trim()) return;
    const newComment: PostComment = {
      id: `cmt-${Date.now()}`,
      authorId: currentUser?.id || 'user-ambassador',
      authorName: currentUser?.name || 'Ambassadeur',
      authorRole: currentUser?.role || 'AMBASSADOR',
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
    };

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: [...(p.comments || []), newComment] } : p))
    );
    setCommentText('');
    setActiveCommentPostId(null);
  };

  const navTabs = [
    { id: 'overview', labelAr: 'نظرة عامة والأداء', labelFr: 'Overview', icon: Activity },
    { id: 'community', labelAr: 'منشوراتي وفيديوهاتي', labelFr: 'Vidéos & Posts', icon: Sparkles },
    { id: 'workshops', labelAr: 'الحصص والورشات', labelFr: 'Workshops', icon: Video },
    { id: 'network', labelAr: 'شبكة 58 ولاية', labelFr: 'Réseau 58', icon: Users },
    { id: 'reviews', labelAr: 'تقييمات الطلبة', labelFr: 'Avis & Notes', icon: Star },
    { id: 'profile', labelAr: 'الملف والأمان', labelFr: 'Profil & Sécurité', icon: ShieldCheck },
  ];
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-arabic p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8" data-testid="ambassador-slesforcess-dashboard">
      {/* ================= 1. SLESFORCESS STYLE TOP BAR WITH EMBEDDED CARD & ACTIONS ================= */}
      <div className="rounded-3xl bg-[#090E1F] border border-white/10 p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-gold-500 via-amber-400 to-yellow-300 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#090E1F] rounded-[14px] flex items-center justify-center">
              <Award className="w-6 h-6 text-gold-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {locale === 'ar' ? `فضاء السفير: ${currentUser?.name || 'سفير DZ PRIME'}` : `Espace Ambassadeur : ${currentUser?.name || 'DZ PRIME'}`}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/40 text-[10px] font-bold font-mono">
                58 WILAYAS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentUser?.institutionName || fallbackAmbassador?.institutionNameAr || 'USTHB Bab Ezzouar'} • {fallbackAmbassador?.wilayaNameAr || 'الجزائر'}
            </p>
          </div>
        </div>

        {/* Center: Pill Navigation Tabs (Image 1 Style) */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/40 border border-white/10 overflow-x-auto no-scrollbar shadow-inner">
          {navTabs.map((tabItem) => {
            const Icon = tabItem.icon;
            const active = activeTab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                onClick={() => handleTabClick(tabItem.id as AmbassadorTab)}
                className={`relative px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                  active
                    ? 'bg-white text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-slate-950' : 'text-gold-400'}`} />
                <span>{locale === 'ar' ? tabItem.labelAr : tabItem.labelFr}</span>
              </button>
            );
          })}
        </div>

        {/* Right Header Actions: Digital Card Widget Button + Quick Links */}
        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
          {/* Digital Card Button */}
          <button
            onClick={() => setIsCardModalOpen(true)}
            data-testid="ambassador-header-card-btn"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-gold-500 via-amber-400 to-yellow-400 hover:from-gold-400 hover:to-yellow-300 text-navy-950 font-black text-xs transition-all shadow-md flex items-center gap-2 shrink-0 group"
          >
            <CreditCard className="w-4 h-4 text-navy-950 group-hover:scale-110 transition-transform" />
            <span className="font-mono">{currentUser?.studentCardId || 'DZ-AMB-16'}</span>
            <span className="px-1.5 py-0.2 rounded bg-black/15 text-[9px] font-extrabold uppercase">VIP</span>
          </button>

          {/* Leaderboard Link */}
          <Link
            href={`/${locale}/leaderboard`}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gold-400 hover:text-gold-300 text-xs transition-colors"
            title={locale === 'ar' ? 'لوحة الصدارة' : 'Leaderboard'}
          >
            <Award className="w-4 h-4" />
          </Link>

          {/* Bot Link */}
          <Link
            href={`/${locale}/bot`}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-lime-400 hover:text-lime-300 text-xs transition-colors"
            title={locale === 'ar' ? 'بوت الامتحانات' : 'Smart Bot'}
          >
            <Sparkles className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Embedded Membership Card Modal */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-3xl bg-[#090E1F] border border-gold-500/30 p-6 space-y-4 shadow-2xl relative text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gold-400" />
                <h3 className="font-black text-base font-arabic">
                  {locale === 'ar' ? 'بطاقة السفير المعتمدة (VIP Gold)' : 'Carte Officielle Ambassadeur'}
                </h3>
              </div>
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-xs"
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

      {/* ================= 2. MAIN BENTO GRID: SLESFORCESS STYLE OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1: Total Insights */}
            <div className="rounded-3xl bg-[#090E1F] border border-white/10 p-5 flex flex-col justify-between space-y-4 hover:border-gold-500/40 transition-all shadow-md">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>{locale === 'ar' ? 'إجمالي المشاهدات والتفاعل' : 'Total Insights'}</span>
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-white font-mono tracking-tight">215,756</div>
                <div className="text-xs text-emerald-400 font-bold mt-1 flex items-center gap-1">
                  <span>+2.3%</span>
                  <span className="text-slate-500 font-normal">{locale === 'ar' ? 'مقارنة بالشهر الماضي' : "that's last month"}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Overall Revenue */}
            <div className="rounded-3xl bg-[#090E1F] border border-white/10 p-5 flex flex-col justify-between space-y-4 hover:border-gold-500/40 transition-all shadow-md">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>{locale === 'ar' ? 'إجمالي عوائد الإحالات' : 'Overall Revenue'}</span>
                <div className="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-400/40 flex items-center justify-center text-gold-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-gold-400 font-mono tracking-tight">
                  {formatDZD(currentCommission)}
                </div>
                <div className="text-xs text-gold-400 font-bold mt-1 flex items-center gap-1">
                  <span>+12.5%</span>
                  <span className="text-slate-500 font-normal">{locale === 'ar' ? 'مقارنة بالأسبوع الماضي' : "that's last week"}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Finance Balance & Multi-Color Progress */}
            <div className="rounded-3xl bg-[#090E1F] border border-white/10 p-5 flex flex-col justify-between space-y-4 hover:border-gold-500/40 transition-all shadow-md">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>{locale === 'ar' ? 'رصيد العمولة والهدف' : 'Finance Balance'}</span>
                <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-black text-white font-mono tracking-tight">
                  {formatDZD(currentCommission * 1.5)}
                </div>
                {/* Multi-segmented bar */}
                <div className="w-full h-3 rounded-full bg-white/10 flex overflow-hidden p-0.5">
                  <div className="bg-purple-500 h-full rounded-full w-[45%]" title="Profit" />
                  <div className="bg-gold-400 h-full rounded-full w-[35%] ml-1" title="Total Earning" />
                  <div className="bg-slate-700 h-full rounded-full w-[20%] ml-1" title="Target" />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> {locale === 'ar' ? 'أرباح' : 'Profit'}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gold-400" /> {locale === 'ar' ? 'مكتسب' : 'Earning'}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-700" /> {locale === 'ar' ? 'الهدف' : 'Target'}</span>
                </div>
              </div>
            </div>

            {/* Card 4: Conversion Rate Donut Gauge */}
            <div className="rounded-3xl bg-[#090E1F] border border-white/10 p-5 flex flex-col justify-between space-y-3 hover:border-gold-500/40 transition-all shadow-md">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>{locale === 'ar' ? 'معدل تحويل الاشتراكات' : 'Sales Conversion Rate'}</span>
                <span className="text-xs text-gold-400 font-mono font-bold">12.5%</span>
              </div>
              <div className="flex items-center justify-center py-1">
                {/* SVG Donut */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-purple-500"
                      strokeDasharray="45, 100"
                      strokeWidth="4"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-gold-400"
                      strokeDasharray="25, 100"
                      strokeDashoffset="-45"
                      strokeWidth="4"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-black font-mono">12.5%</span>
                    <span className="text-[8px] text-slate-400 uppercase">Success</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Leads</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gold-400" /> VIP Gold</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-700" /> Free</span>
              </div>
            </div>
          </div>

          {/* Middle Row: Heatmap Matrix + Growth Chart + Quick Activity Toolkit */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            {/* Left: Referral & Activity Heatmap Matrix (Image 1 Style) */}
            <div className="lg:col-span-5 rounded-3xl bg-[#090E1F] border border-white/10 p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white">
                    {locale === 'ar' ? 'مصفوفة نشاط وانضمام الطلبة' : 'Student Recruitment Matrix'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {locale === 'ar' ? 'توزع التسجيلات الأسبوعية عبر ولايتك' : 'Weekly student enrollments across 58 wilayas'}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] text-gold-400 font-mono">
                  58 WILAYAS
                </span>
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-1">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-800 border border-white/5" /> 100</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gold-950 border border-gold-800" /> 300</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gold-600 border border-gold-500" /> 500</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-lime-400 text-slate-950 font-bold" /> 1000+</span>
              </div>

              {/* Heatmap Grid (6 rows x 10 cols) */}
              <div className="grid grid-cols-10 gap-1.5 pt-2">
                {Array.from({ length: 60 }).map((_, i) => {
                  const intensity = (i * 7 + 13) % 4;
                  const bgClass =
                    intensity === 3
                      ? 'bg-lime-400 shadow-sm shadow-lime-400/30'
                      : intensity === 2
                      ? 'bg-gold-500'
                      : intensity === 1
                      ? 'bg-gold-900/60'
                      : 'bg-slate-800/80';
                  return (
                    <div
                      key={i}
                      className={`h-5 rounded-md ${bgClass} transition-all hover:scale-125 cursor-pointer`}
                      title={`Week ${Math.floor(i / 10) + 1} - Activity Level ${intensity + 1}`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-2 border-t border-white/5">
                <span>JAN</span>
                <span>MAR</span>
                <span>MAY</span>
                <span>JUL</span>
                <span>SEP</span>
                <span>NOV</span>
              </div>
            </div>

            {/* Center: Sales & Recruitment Growth Chart (Image 1 Style) */}
            <div className="lg:col-span-4 rounded-3xl bg-[#090E1F] border border-white/10 p-5 sm:p-6 space-y-4 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white">
                    {locale === 'ar' ? 'نمو الإحالات والعمولات' : 'Sales & Commission Growth'}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">DZD / MONTH</span>
                </div>

                <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10 text-[11px] font-mono">
                  <button
                    onClick={() => setGrowthView('MONTH')}
                    className={`px-2.5 py-0.5 rounded-lg font-bold transition-all ${
                      growthView === 'MONTH' ? 'bg-white text-slate-950 font-black' : 'text-slate-400'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setGrowthView('ANNUAL')}
                    className={`px-2.5 py-0.5 rounded-lg font-bold transition-all ${
                      growthView === 'ANNUAL' ? 'bg-white text-slate-950 font-black' : 'text-slate-400'
                    }`}
                  >
                    Annually
                  </button>
                </div>
              </div>

              {/* Bar Visualizer with Highlighted August Peak */}
              <div className="h-44 flex items-end justify-between gap-2 pt-4 px-2">
                {[
                  { month: 'Jun', val: 40 },
                  { month: 'Jul', val: 65 },
                  { month: 'Aug', val: 95, isPeak: true },
                  { month: 'Sep', val: 70 },
                  { month: 'Oct', val: 55 },
                  { month: 'Nov', val: 80 },
                ].map((bar) => (
                  <div key={bar.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    {bar.isPeak && (
                      <div className="px-2 py-1 rounded-lg bg-purple-500 text-white text-[10px] font-mono font-black mb-1 shadow-lg animate-bounce">
                        432,988
                      </div>
                    )}
                    <div
                      style={{ height: `${bar.val}%` }}
                      className={`w-full rounded-t-xl transition-all ${
                        bar.isPeak
                          ? 'bg-gradient-to-t from-purple-600 via-purple-500 to-lime-300 shadow-lg shadow-purple-500/30'
                          : 'bg-slate-800 group-hover:bg-slate-700'
                      }`}
                    />
                    <span className={`text-[10px] font-mono ${bar.isPeak ? 'text-lime-300 font-bold' : 'text-slate-500'}`}>
                      {bar.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Quick Action Toolkit & Promo Code ("Your Activity" Image 1) */}
            <div className="lg:col-span-3 rounded-3xl bg-[#090E1F] border border-white/10 p-5 sm:p-6 space-y-4 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-white">
                  {locale === 'ar' ? 'أدواتك التسويقية السريعة' : 'Your Activity & Toolkit'}
                </h3>
                <p className="text-xs text-slate-400">
                  {locale === 'ar' ? 'انسخ كود الترويج أو رابط الإحالة فوراً' : 'Instant promo & referral tools'}
                </p>
              </div>

              {/* Promo Code Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-gold-500/20 via-amber-500/10 to-transparent border border-gold-500/40 space-y-2">
                <span className="text-[10px] font-bold text-gold-400 uppercase tracking-wider block font-mono">
                  {locale === 'ar' ? 'كود الخصم الحصري الخاص بك' : 'YOUR EXCLUSIVE PROMO CODE'}
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg font-black font-mono text-white tracking-widest">
                    {currentPromoCode}
                  </span>
                  <button
                    onClick={handleCopyPromo}
                    className="px-3 py-1.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 text-xs font-black transition-all flex items-center gap-1 shadow-sm"
                  >
                    {copiedPromo ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPromo ? t('common.copied') : t('common.copy')}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleCopyLink}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-3.5 h-3.5 text-gold-400" />
                  <span>{copiedLink ? t('common.copied') : locale === 'ar' ? 'نسخ رابط دليل السفراء' : 'Copier le lien public'}</span>
                </button>

                <button
                  onClick={() => handleTabClick('workshops')}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-500/40 text-xs font-bold text-purple-300 transition-all flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>{locale === 'ar' ? 'إعلان ورشة / حصة جديدة' : 'Nouvelle session'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 3. WORKSHOPS & POST BROADCASTS TAB ================= */}
      {activeTab === 'workshops' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Create Workshop Form */}
          <div className="lg:col-span-5 rounded-3xl bg-[#090E1F] border border-white/10 p-6 space-y-4 shadow-xl h-fit">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-gold-400" />
              <h3 className="text-lg font-black text-white">
                {locale === 'ar' ? 'إعلان ورشة دراسية أو حصة مراجعة' : 'Créer une session d\'étude'}
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              {locale === 'ar' ? 'نظم حصة لطلبة ولايتك بالتعاون مع أساتذة المنصة المعتمدين.' : 'Planifiez un atelier pour les étudiants de votre campus.'}
            </p>

            <form onSubmit={handleCreatePost} className="space-y-3.5 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {locale === 'ar' ? 'عنوان الورشة / الحصة' : 'Titre de la session'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={locale === 'ar' ? 'مثال: ورشة التحضير لامتحان الرياضيات EMD1' : 'Ex: Atelier de préparation EMD1'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:border-gold-400 focus:outline-none font-arabic"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {locale === 'ar' ? 'نوع الفعالية' : 'Type'}
                  </label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value as PostType)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-gold-400 focus:outline-none font-arabic"
                  >
                    <option value="SESSION_SCHEDULE">{locale === 'ar' ? 'حصة مراجعة' : 'Session d\'étude'}</option>
                    <option value="EVENT">{locale === 'ar' ? 'حدث جامعي' : 'Événement'}</option>
                    <option value="STUDY_TIP">{locale === 'ar' ? 'نصيحة تفوق' : 'Conseil d\'étude'}</option>
                    <option value="ANNOUNCEMENT">{locale === 'ar' ? 'إعلان هام' : 'Annonce'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {locale === 'ar' ? 'طريقة البث' : 'Format'}
                  </label>
                  <select
                    value={isOnline ? 'ONLINE' : 'IN_PERSON'}
                    onChange={(e) => setIsOnline(e.target.value === 'ONLINE')}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-gold-400 focus:outline-none font-arabic"
                  >
                    <option value="ONLINE">🌐 {locale === 'ar' ? 'أونلاين (Google Meet)' : 'En ligne'}</option>
                    <option value="IN_PERSON">🏫 {locale === 'ar' ? 'حضوري بالجامعة' : 'Présentiel'}</option>
                  </select>
                </div>
              </div>

              {!isOnline && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {locale === 'ar' ? 'المدرج أو القاعة' : 'Lieu / Salle'}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={locale === 'ar' ? 'مثال: مدرج C - كلية العلوم' : 'Ex: Amphithéâtre C'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:border-gold-400 focus:outline-none font-arabic"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {locale === 'ar' ? 'الأستاذ المؤطر' : 'Enseignant Encadrant'}
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-gold-400 focus:outline-none font-arabic"
                >
                  {CERTIFIED_TEACHERS.map((tch) => (
                    <option key={tch.id} value={tch.id}>
                      {tch.name} ({tch.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {locale === 'ar' ? 'تفاصيل ومحاور الحصة' : 'Détails & Programme'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={locale === 'ar' ? 'اكتب محاور المراجعة ورابط المطبوعات...' : 'Détails de la séance...'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:border-gold-400 focus:outline-none font-arabic"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-navy-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{locale === 'ar' ? 'نشر الإعلان للطلبة فوراً' : 'Publier la session'}</span>
              </button>

              {isSubmitted && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center font-arabic">
                  {locale === 'ar' ? 'تم نشر الورشة بنجاح ووصلت لطلبة ولايتك! ✓' : 'Session publiée avec succès ! ✓'}
                </div>
              )}
            </form>
          </div>

          {/* Posts Stream */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <span>{locale === 'ar' ? 'منشورات وورشات السفراء المعتمدة' : 'Fil d\'actualités des sessions'}</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">{posts.length} Posts</span>
            </div>

            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-3xl bg-[#090E1F] border border-white/10 p-5 space-y-3.5 hover:border-gold-500/30 transition-all shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gold-500/20 border border-gold-400/40 text-gold-400 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">{post.title}</h4>
                        <p className="text-[11px] text-slate-400 font-arabic">
                          {post.authorName} • {post.institutionName} • {post.assignedTeacherName}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-gold-300 shrink-0">
                      {post.isOnline ? '🌐 Live Meet' : `🏫 ${post.location || 'Campus'}`}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-arabic bg-black/20 p-3.5 rounded-2xl border border-white/5">
                    {post.content}
                  </p>

                  {/* Comments Thread */}
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    {post.comments && post.comments.length > 0 && (
                      <div className="space-y-2">
                        {post.comments.map((cmt) => (
                          <div key={cmt.id} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                            <span className="font-bold text-gold-400 mr-2">{cmt.authorName}:</span>
                            <span className="text-slate-300">{cmt.content}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeCommentPostId === post.id ? (
                      <div className="flex gap-2 pt-2">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder={locale === 'ar' ? 'اكتب رداً أو سؤالاً...' : 'Écrire une réponse...'}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none font-arabic"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-gold-500 text-navy-950 font-bold text-xs font-arabic"
                        >
                          {locale === 'ar' ? 'إرسال' : 'Envoyer'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveCommentPostId(post.id)}
                        className="text-[11px] font-bold text-slate-400 hover:text-gold-400 transition-colors flex items-center gap-1 font-arabic"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{locale === 'ar' ? 'إضافة رد أو تعليق' : 'Répondre'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= 4. 58 WILAYAS NETWORK TAB ================= */}
      {activeTab === 'network' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-400" />
              <span>{locale === 'ar' ? 'دليل شبكة سفراء 58 ولاية' : 'Annuaire National des Ambassadeurs'}</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">58 Wilayas Covered</span>
          </div>
          <AmbassadorDirectory />
        </div>
      )}

      {/* ================= 5. REVIEWS TAB ================= */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-gold-400 fill-gold-400" />
              <span>{locale === 'ar' ? 'تقييمات وآراء الطلبة المعتمدة' : 'Avis et retours des étudiants'}</span>
            </h3>
            <span className="text-xs text-gold-400 font-mono font-bold">5.0 / 5.0 Rating</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(fallbackAmbassador?.reviews || defaultAmbassadorProfile.reviews || []).map((rev) => (
              <div
                key={rev.id}
                className="rounded-3xl bg-[#090E1F] border border-white/10 p-5 space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gold-500/20 text-gold-400 flex items-center justify-center font-bold text-xs font-mono">
                      {rev.studentName.slice(0, 1)}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{rev.studentName}</h4>
                      <span className="text-[10px] text-slate-400">{rev.institution}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-gold-400">
                    {Array.from({ length: rev.score }).map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-gold-400 text-gold-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-arabic bg-black/20 p-3 rounded-2xl border border-white/5">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 6. PROFILE & SECURITY SETTINGS TAB ================= */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Ambassador Card Presentation */}
          <div className="rounded-3xl bg-[#090E1F] border border-white/10 p-6 shadow-xl flex flex-col items-center space-y-4">
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-gold-400" />
                <h3 className="text-base sm:text-lg font-black text-white">
                  {locale === 'ar' ? 'بطاقة الاعتماد الرقمية للسفير' : 'Carte d\'Identité Numérique de l\'Ambassadeur'}
                </h3>
              </div>
              <Link
                href={`/${locale}/profile/${currentUser?.studentCardId || currentUser?.id}`}
                className="px-3.5 py-1.5 rounded-xl bg-gold-500/20 hover:bg-gold-500/30 border border-gold-500/40 text-gold-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'معاينة الملف الشخصي العام' : 'Profil Public'}</span>
              </Link>
            </div>
            <MembershipCard user={currentUser || undefined} allowExport={true} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Form */}
          <div className="rounded-3xl bg-[#090E1F] border border-white/10 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-gold-400" />
              <h3 className="text-lg font-black text-white">
                {locale === 'ar' ? 'الملف الأكاديمي وسفير الولاية' : 'Profil Ambassadeur'}
              </h3>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-3.5 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {locale === 'ar' ? 'الاسم واللقب' : 'Nom Complet'}
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-gold-400 focus:outline-none font-arabic"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {locale === 'ar' ? 'رقم الهاتف' : 'Téléphone'}
                  </label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-gold-400 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {locale === 'ar' ? 'الولاية' : 'Wilaya'}
                  </label>
                  <select
                    value={profileForm.wilayaCode}
                    onChange={(e) => setProfileForm({ ...profileForm, wilayaCode: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-gold-400 focus:outline-none font-arabic"
                  >
                    {WILAYAS.map((w) => (
                      <option key={w.code} value={w.code}>
                        {w.code} - {getLocalizedWilayaName(w, locale as Locale)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {locale === 'ar' ? 'الجامعة أو المعهد' : 'Université / Établissement'}
                </label>
                <input
                  type="text"
                  value={profileForm.institutionName}
                  onChange={(e) => setProfileForm({ ...profileForm, institutionName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-gold-400 focus:outline-none font-arabic"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {locale === 'ar' ? 'حساب تيليجرام للتواصل' : 'Handle Telegram'}
                </label>
                <input
                  type="text"
                  value={profileForm.telegramHandle}
                  onChange={(e) => setProfileForm({ ...profileForm, telegramHandle: e.target.value })}
                  placeholder="@username"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-gold-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {locale === 'ar' ? 'نبذة تعريفية (Bio)' : 'Biographie'}
                </label>
                <textarea
                  rows={2}
                  value={profileForm.bioAr}
                  onChange={(e) => setProfileForm({ ...profileForm, bioAr: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-gold-400 focus:outline-none font-arabic"
                />
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="w-full py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{locale === 'ar' ? 'حفظ البيانات الأكاديمية' : 'Enregistrer le profil'}</span>
              </button>

              {profileSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
                  {profileSuccess}
                </div>
              )}
            </form>
          </div>

          {/* Password & Security Form */}
          <div className="rounded-3xl bg-[#090E1F] border border-white/10 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-black text-white">
                {locale === 'ar' ? 'أمان الحساب وكلمة المرور' : 'Sécurité du compte'}
              </h3>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-3.5 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {locale === 'ar' ? 'كلمة المرور الحالية' : 'Mot de passe actuel'}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-purple-400 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {locale === 'ar' ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-purple-400 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {locale === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirmer le mot de passe'}
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-purple-400 focus:outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={passwordSaving}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                <span>{locale === 'ar' ? 'تحديث كلمة المرور' : 'Changer le mot de passe'}</span>
              </button>

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
                  {passwordSuccess}
                </div>
              )}
              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold text-center">
                  {passwordError}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
      )}

      {/* ================= 7. AMBASSADOR COMMUNITY & VIDEO POSTS ================= */}
      {activeTab === 'community' && (
        <div className="space-y-6">
          <SocialFeed
            authorFilterId={currentUser?.id}
            emptyMessage="لم تقم بنشر أي منشورات أو فيديوهات عن ولايتك بعد. اضغط على الزر الذهبي لنشر أول نشاط أو فيديو!"
          />
        </div>
      )}
    </div>
  );
}
