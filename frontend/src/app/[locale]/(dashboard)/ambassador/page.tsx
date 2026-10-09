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
import { WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';
import { Post, PostType, PostComment, AmbassadorProfile, Locale } from '@/types';
import { formatDZD } from '@/lib/format';

type AmbassadorTab = 'overview' | 'workshops' | 'community' | 'reviews' | 'network' | 'profile';

export default function AmbassadorDashboardPage() {
  const { t, locale, isRtl } = useTranslation();
  const { currentUser, updateProfile } = useAuthStore();

  const [activeTab, setActiveTab] = useState<AmbassadorTab>('overview');
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('SESSION_SCHEDULE');
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState('');
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

  const currentPromoCode = dbAmbassador?.promoCode || `WIL${currentUser?.wilayaCode || 16}-VIP`;
  const currentCommission = dbAmbassador?.commissionDzd ?? 0;
  const currentReferrals = dbAmbassador?.referralsCount ?? 0;

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
          colors: ['#f2aa34', '#6db1d8', '#f2aa34'],
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
          colors: ['#f2aa34', '#6db1d8', '#f2aa34'],
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

  const [postError, setPostError] = useState('');
  const [posting, setPosting] = useState(false);

  // Posts live in the database (same API as the community feed); this tab shows the session-type posts.
  useEffect(() => {
    if (!currentUser) return;
    fetch('/api/posts?limit=50')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.posts)) setPosts(d.posts);
      })
      .catch(() => {});
  }, [currentUser?.id]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || posting) return;
    setPosting(true);
    setPostError('');
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, type: postType, isOnline, location: isOnline ? undefined : location || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPostError(data.error || (locale === 'ar' ? 'تعذر نشر الإعلان' : 'Publication impossible'));
        return;
      }
      setPosts((prev) => [data.post, ...prev]);
      setTitle('');
      setContent('');
      setLocation('');
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
    } catch {
      setPostError(locale === 'ar' ? 'خطأ في الاتصال' : 'Erreur réseau');
    } finally {
      setPosting(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentText.trim();
    if (!text) return;
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.comment) return;
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments: [...(p.comments || []), data.comment] } : p))
      );
      setCommentText('');
      setActiveCommentPostId(null);
    } catch {}
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
    <div className="min-h-screen bg-navy-700 text-white font-arabic p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8" data-testid="ambassador-slesforcess-dashboard">
      {/* ================= 1. SLESFORCESS STYLE TOP BAR WITH EMBEDDED CARD & ACTIONS ================= */}
      <div className="dark rounded-3xl bg-[#111114] border border-white/10 p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gold-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="dark w-full h-full bg-[#111114] rounded-[14px] flex items-center justify-center">
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
              {[currentUser?.institutionName, currentUser?.wilayaName].filter(Boolean).join(' • ')}
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
            className="px-3.5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-black text-xs transition-all shadow-md flex items-center gap-2 shrink-0 group"
          >
            <CreditCard className="w-4 h-4 text-navy-950 group- transition-transform" />
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
            title={locale === 'ar' ? 'مساعد الامتحانات' : 'Assistant examens'}
          >
            <Sparkles className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Embedded Membership Card Modal */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="dark w-full max-w-xl rounded-3xl bg-[#111114] border border-gold-500/30 p-6 space-y-4 shadow-2xl relative text-white">
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
          {/* KPI Cards: real values from the ambassador record only */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            <div className="dark rounded-3xl bg-[#111114] border border-white/10 p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>{locale === 'ar' ? 'عدد الإحالات' : 'Referrals'}</span>
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-white font-mono tracking-tight">{currentReferrals}</div>
            </div>

            <div className="dark rounded-3xl bg-[#111114] border border-white/10 p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>{locale === 'ar' ? 'إجمالي عوائد الإحالات' : 'Commission earned'}</span>
                <div className="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-400/40 flex items-center justify-center text-gold-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-gold-400 font-mono tracking-tight">{formatDZD(currentCommission)}</div>
            </div>

            <div className="dark rounded-3xl bg-[#111114] border border-white/10 p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>{locale === 'ar' ? 'كود الخصم' : 'Promo code'}</span>
                <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black text-white font-mono tracking-widest break-all">{currentPromoCode}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            {/* Right: Quick Action Toolkit & Promo Code ("Your Activity" Image 1) */}
            <div className="dark lg:col-span-5 rounded-3xl bg-[#111114] border border-white/10 p-5 sm:p-6 space-y-4 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-white">
                  {locale === 'ar' ? 'أدواتك التسويقية السريعة' : 'Your Activity & Toolkit'}
                </h3>
                <p className="text-xs text-slate-400">
                  {locale === 'ar' ? 'انسخ كود الترويج أو رابط الإحالة فوراً' : 'Instant promo & referral tools'}
                </p>
              </div>

              {/* Promo Code Box */}
              <div className="p-4 rounded-2xl bg-gold-500/20 border border-gold-500/40 space-y-2">
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
          <div className="dark lg:col-span-5 rounded-3xl bg-[#111114] border border-white/10 p-6 space-y-4 shadow-xl h-fit">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-gold-400" />
              <h2 className="text-lg font-black text-white">
                {locale === 'ar' ? 'إعلان ورشة دراسية أو حصة مراجعة' : 'Créer une session d\'étude'}
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              {locale === 'ar' ? 'نظم حصة لطلبة ولايتك بالتعاون مع أساتذة المنصة المعتمدين.' : 'Planifiez un atelier pour les étudiants de votre campus.'}
            </p>

            <form onSubmit={handleCreatePost} className="space-y-3.5 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {locale === 'ar' ? 'عنوان الورشة / الحصة' : 'Titre de la session'}
                </label>
                <input aria-label={locale === 'ar' ? 'مثال: ورشة التحضير لامتحان الرياضيات EMD1' : 'Ex: Atelier de préparation EMD1'}
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
                  <select aria-label={locale === 'ar' ? 'نوع الفعالية' : 'Type'}
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
                  <select aria-label={locale === 'ar' ? 'طريقة البث' : 'Format'}
                    value={isOnline ? 'ONLINE' : 'IN_PERSON'}
                    onChange={(e) => setIsOnline(e.target.value === 'ONLINE')}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-gold-400 focus:outline-none font-arabic"
                  >
                    <option value="ONLINE">{locale === 'ar' ? 'أونلاين (Google Meet)' : 'En ligne'}</option>
                    <option value="IN_PERSON">{locale === 'ar' ? 'حضوري بالجامعة' : 'Présentiel'}</option>
                  </select>
                </div>
              </div>

              {!isOnline && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {locale === 'ar' ? 'المدرج أو القاعة' : 'Lieu / Salle'}
                  </label>
                  <input aria-label={locale === 'ar' ? 'مثال: مدرج C - كلية العلوم' : 'Ex: Amphithéâtre C'}
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
                  {locale === 'ar' ? 'تفاصيل ومحاور الحصة' : 'Détails & Programme'}
                </label>
                <textarea aria-label={locale === 'ar' ? 'اكتب محاور المراجعة ورابط المطبوعات...' : 'Détails de la séance...'}
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
                disabled={posting}
                className="w-full py-3 disabled:opacity-60 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{locale === 'ar' ? 'نشر الإعلان للطلبة فوراً' : 'Publier la session'}</span>
              </button>

              {postError && (
                <div role="alert" className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold text-center font-arabic">
                  {postError}
                </div>
              )}

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
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <span>{locale === 'ar' ? 'منشورات وورشات السفراء المعتمدة' : 'Fil d\'actualités des sessions'}</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">{posts.length} Posts</span>
            </div>

            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="dark rounded-3xl bg-[#111114] border border-white/10 p-5 space-y-3.5 hover:border-gold-500/30 transition-all shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gold-500/20 border border-gold-400/40 text-gold-400 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">{post.title}</h4>
                        <p className="text-[11px] text-slate-400 font-arabic">
                          {[post.authorName, post.institutionName, post.assignedTeacherName].filter(Boolean).join(' • ')}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-gold-300 shrink-0">
                      {post.isOnline ? 'Live Meet' : `${post.location || 'Campus'}`}
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
                        <input aria-label={locale === 'ar' ? 'اكتب رداً أو سؤالاً...' : 'Écrire une réponse...'}
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
          </div>

          <div className="dark rounded-3xl bg-[#111114] border border-white/10 p-8 text-center text-xs text-slate-400 font-arabic">
            {locale === 'ar' ? 'لا توجد تقييمات بعد.' : 'Aucun avis pour le moment.'}
          </div>
        </div>
      )}

      {/* ================= 6. PROFILE & SECURITY SETTINGS TAB ================= */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Ambassador Card Presentation */}
          <div className="dark rounded-3xl bg-[#111114] border border-white/10 p-6 shadow-xl flex flex-col items-center space-y-4">
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
          <div className="dark rounded-3xl bg-[#111114] border border-white/10 p-6 space-y-4 shadow-xl">
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
                <input aria-label={locale === 'ar' ? 'الاسم واللقب' : 'Nom Complet'}
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
                  <input aria-label={locale === 'ar' ? 'رقم الهاتف' : 'Téléphone'}
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
                  <select aria-label={locale === 'ar' ? 'الولاية' : 'Wilaya'}
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
                <input aria-label={locale === 'ar' ? 'الجامعة أو المعهد' : 'Université / Établissement'}
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
                <input aria-label="@username"
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
                <textarea aria-label={locale === 'ar' ? 'نبذة تعريفية (Bio)' : 'Biographie'}
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
          <div className="dark rounded-3xl bg-[#111114] border border-white/10 p-6 space-y-4 shadow-xl">
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
                  <input aria-label={locale === 'ar' ? 'كلمة المرور الحالية' : 'Mot de passe actuel'}
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-purple-400 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    aria-label={locale === 'ar' ? 'إظهار أو إخفاء كلمة المرور' : 'Afficher ou masquer le mot de passe'}
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
                  <input aria-label={locale === 'ar' ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-purple-400 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={locale === 'ar' ? 'إظهار أو إخفاء كلمة المرور' : 'Afficher ou masquer le mot de passe'}
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
                <input aria-label={locale === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirmer le mot de passe'}
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
