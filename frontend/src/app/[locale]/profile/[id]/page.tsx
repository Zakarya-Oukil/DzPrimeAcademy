'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  Phone,
  MessageCircle,
  Send,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  Globe,
  Share2,
  Award,
  GraduationCap,
  BookOpen,
  Video,
  Package,
  Calendar,
  Clock,
  Sparkles,
  Building2,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Edit3,
} from 'lucide-react';
import { MembershipCard } from '@/components/card/MembershipCard';
import { DzPrimeLogo } from '@/components/shared/DzPrimeLogo';
import { SettingsModal } from '@/components/settings/SettingsModal';
import SocialFeed from '@/components/community/SocialFeed';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { User, Role } from '@/types';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

interface ProfileResponse {
  user: User;
  teacherProfile?: {
    university: string;
    specialty?: string;
    hourlyRateDzd: number;
    hoursTaught: number;
    studentsCount: number;
  } | null;
  courses?: Array<{
    id: string;
    titleAr: string;
    titleFr?: string;
    lessonsCount: number;
    priceDzd: number;
    rating: number;
    category: string;
  }>;
  sessions?: Array<{
    id: string;
    title: string;
    scheduledAt: string;
    durationMinutes: number;
    platform: string;
    meetUrl?: string;
    status: string;
  }>;
  bundles?: Array<{
    id: string;
    titleAr: string;
    descriptionAr: string;
    currentPriceDzd: number;
    hours: number;
    lecturesCount: number;
  }>;
  ambassadorProfile?: {
    wilayaNameAr: string;
    institutionNameAr: string;
    specialtyName?: string;
    promoCode?: string;
    ratingAverage: number;
    ratingsCount: number;
  } | null;
  enrollments?: Array<{
    id: string;
    courseTitle: string;
    progressPercent: number;
  }>;
}

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const resolvedParams = use(params);
  const { locale, id } = resolvedParams;
  const { t } = useTranslation();

  const { currentUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const loadProfile = () => {
    fetch(`/api/profile/${encodeURIComponent(id)}`)
      .then((r) => {
        if (!r.ok) throw new Error('الملف الشخصي غير موجود');
        return r.json();
      })
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        setError(err.message || 'حدث خطأ أثناء تحميل الملف الشخصي');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const copyProfileLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center gap-3 bg-[#05070D] text-white">
        <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
        <p className="text-xs text-gray-400 font-mono">
          {locale === 'ar' ? 'جاري تحميل الملف الشخصي...' : 'Chargement du profil...'}
        </p>
      </div>
    );
  }

  if (error || !data || !data.user) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 bg-[#05070D] text-white font-arabic">
        <div className="w-full max-w-md p-8 rounded-3xl border border-rose-500/30 bg-[#0B0E1A] text-center shadow-2xl space-y-4">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h1 className="text-xl font-black">
            {locale === 'ar' ? 'الملف الشخصي غير موجود' : 'Profil introuvable'}
          </h1>
          <p className="text-xs text-gray-400 font-mono">{id}</p>
          <p className="text-xs text-gray-300">
            {locale === 'ar'
              ? 'لم يتم العثور على أي مستخدم مطابق لهذا المعرف أو رمز البطاقة.'
              : "Aucun utilisateur ne correspond à cet identifiant."}
          </p>
          <Link
            href={`/${locale}`}
            className="inline-flex px-6 py-2.5 rounded-xl bg-gold-500 text-navy-950 text-xs font-black shadow-gold-glow hover:bg-gold-400 transition-all"
          >
            {locale === 'ar' ? 'العودة للرئيسية' : 'Accueil'}
          </Link>
        </div>
      </div>
    );
  }

  const { user, teacherProfile, courses = [], sessions = [], bundles = [], ambassadorProfile } = data;
  const isTeacher = user.role === 'TEACHER';
  const isAmbassador = user.role === 'AMBASSADOR';
  const isStudent = user.role === 'STUDENT_FREE' || user.role === 'STUDENT_PAID';
  const isAdminOrStaff = user.role === 'OWNER' || user.role === 'ADMIN' || user.role === 'MODERATOR' || Boolean(user.adminRole);

  const isCardOwner = Boolean(
    currentUser && (currentUser.id === user.id || currentUser.studentCardId === user.studentCardId)
  );
  const isAdmin = Boolean(
    currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER')
  );
  const canExportCard = isCardOwner || isAdmin;

  const isZakarya =
    user.email === 'zakaryaoukil2003@gmail.com' ||
    user.studentCardId === 'DZ-OWN-16-0001' ||
    (user.name && user.name.toLowerCase().includes('zakar'));

  const roleTitle =
    user.jobTitle ||
    (isZakarya
      ? (locale === 'ar' ? 'المسؤول التقني الأول والشريك المؤسس (CTO & Co-Founder)' : 'Chief Technology Officer (CTO) & Co-Founder')
      : user.adminRole === 'GENERAL_ADMIN'
      ? (locale === 'ar' ? 'Admin Général (المدير العام التنفيذي)' : 'Directeur Général (Admin Général)')
      : user.adminRole === 'COMMERCIAL'
      ? (locale === 'ar' ? 'Chargée Commerciale (المسؤولة التجارية)' : 'Chargée Commerciale & Offres')
      : isTeacher
      ? (locale === 'ar' ? 'أستاذ معتمد بالمنصة' : 'Enseignant Agréé')
      : isAmbassador
      ? (locale === 'ar' ? 'سفير معتمد' : 'Ambassadeur Officiel')
      : user.role === 'STUDENT_PAID'
      ? (locale === 'ar' ? 'طالب (عضوية ذهبية)' : 'Étudiant (Membre Gold)')
      : user.role === 'OWNER'
      ? (locale === 'ar' ? 'المسؤول التقني الأول والشريك المؤسس (CTO)' : 'Chief Technology Officer (CTO)')
      : (locale === 'ar' ? 'طالب مسجل' : 'Étudiant'));

  const cleanPhone = (user.phone || '').replace(/[^0-9+]/g, '');
  const whatsappUrl = user.whatsapp
    ? `https://wa.me/${user.whatsapp.replace(/[^0-9]/g, '')}`
    : cleanPhone
    ? `https://wa.me/${cleanPhone.replace('+', '').replace(/^0/, '213')}`
    : null;

  return (
    <div className="min-h-screen bg-[#05070D] text-white font-arabic py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="relative rounded-3xl border border-gold-500/30 bg-gradient-to-br from-[#0C1224] via-[#080C18] to-[#04060E] p-6 sm:p-8 shadow-2xl overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gold-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-dzBlue-neon/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            {/* Left: Avatar & Personal Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-2 border-gold-400 bg-gradient-to-tr from-gold-600 via-amber-400 to-yellow-300 text-navy-950 flex items-center justify-center font-black text-3xl shadow-gold-glow overflow-hidden shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                {user.isVerified && (
                  <div className="absolute -bottom-2 -right-2 p-1 rounded-full bg-emerald-500 text-white shadow-md">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
                  <h1 className="text-2xl sm:text-3xl font-black text-white">{user.name}</h1>
                  <span className="px-3 py-0.5 rounded-full bg-gold-500/20 border border-gold-400/40 text-gold-300 text-xs font-bold font-mono">
                    {user.studentCardId}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start text-xs">
                  <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-gold-500 via-amber-400 to-gold-500 text-navy-950 font-black shadow-sm">
                    {roleTitle}
                  </span>

                  {user.wilayaName && (
                    <span className="flex items-center gap-1 text-gray-300 bg-white/[0.04] px-2.5 py-1 rounded-xl border border-white/10">
                      <MapPin className="w-3.5 h-3.5 text-gold-400" />
                      <span>
                        {user.wilayaCode} - {user.wilayaName}
                      </span>
                    </span>
                  )}

                  {user.institutionName && (
                    <span className="flex items-center gap-1 text-gray-300 bg-white/[0.04] px-2.5 py-1 rounded-xl border border-white/10 max-w-[260px] truncate">
                      <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="truncate">{user.institutionName}</span>
                    </span>
                  )}
                </div>

                {/* Bio */}
                {user.bio ? (
                  <p className="text-xs sm:text-sm text-gray-300 max-w-xl italic leading-relaxed pt-1">
                    &ldquo;{user.bio}&rdquo;
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 italic pt-1">
                    {locale === 'ar' ? 'عضو رسمي موثق في منصة DZ Prime Academy' : 'Membre certifié DZ Prime Academy'}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-col sm:flex-row md:flex-col items-center gap-2.5 shrink-0">
              {currentUser && (currentUser.id === user.id || currentUser.studentCardId === user.studentCardId || currentUser.role === 'OWNER') && (
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-navy-950 text-xs font-black shadow-gold-glow flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{locale === 'ar' ? 'تعديل الملف الشخصي' : 'Modifier le profil'}</span>
                </button>
              )}

              <button
                onClick={copyProfileLink}
                className="w-full px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-gold-400" />}
                <span>{copied ? (locale === 'ar' ? 'تم نسخ الرابط ✓' : 'Lien copié !') : (locale === 'ar' ? 'مشاركة الملف' : 'Partager')}</span>
              </button>

              <Link
                href={`/${locale}/verify/${user.studentCardId}`}
                className="w-full px-4 py-2 rounded-xl bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/40 text-gold-300 text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-gold-400" />
                <span>{locale === 'ar' ? 'التحقق من البطاقة' : 'Vérifier la carte'}</span>
              </Link>
            </div>
          </div>

          {/* Social Media & Direct Contact Row */}
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {user.github && (
                <a
                  href={user.github.startsWith('http') ? user.github : `https://${user.github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-600/40 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              )}

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              )}

              {user.telegram && (
                <a
                  href={`https://t.me/${user.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram</span>
                </a>
              )}

              {user.linkedin && (
                <a
                  href={user.linkedin.startsWith('http') ? user.linkedin : `https://${user.linkedin}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </a>
              )}

              {user.facebook && (
                <a
                  href={user.facebook.startsWith('http') ? user.facebook : `https://${user.facebook}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Facebook className="w-4 h-4" />
                  <span>Facebook</span>
                </a>
              )}

              {user.instagram && (
                <a
                  href={user.instagram.startsWith('http') ? user.instagram : `https://instagram.com/${user.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/40 text-pink-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </a>
              )}

              {user.youtube && (
                <a
                  href={user.youtube.startsWith('http') ? user.youtube : `https://${user.youtube}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Youtube className="w-4 h-4" />
                  <span>YouTube</span>
                </a>
              )}

              {user.website && (
                <a
                  href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-gray-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Globe className="w-4 h-4" />
                  <span>{locale === 'ar' ? 'الموقع الشخصي' : 'Site Web'}</span>
                </a>
              )}

              {user.phone && (
                <a
                  href={`tel:${cleanPhone}`}
                  className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-gold-400" />
                  <span dir="ltr">{user.phone}</span>
                </a>
              )}

              {user.email && (
              <a
                href={`mailto:${user.email}`}
                className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
              >
                <Mail className="w-3.5 h-3.5 text-gold-400" />
                <span>{user.email}</span>
              </a>
              )}
            </div>
          </div>
        </div>

        {/* Two Columns: Left Interactive Badge, Right Content details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Card Presentation */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-4">
            <div className="w-full p-6 rounded-3xl border border-white/10 bg-[#0A0E1A] shadow-xl">
              <h3 className="text-sm font-black text-gold-300 flex items-center gap-2 mb-4">
                <Award className="w-4 h-4" />
                <span>{locale === 'ar' ? 'بطاقة الاعتماد الرقمية' : 'Carte d\'Identité Numérique'}</span>
              </h3>
              <MembershipCard user={user} allowExport={canExportCard} />
            </div>
          </div>

          {/* Role-Specific Right Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* TEACHER VIEW */}
            {isTeacher && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-1">
                    <span className="text-xl font-black text-gold-400">{teacherProfile?.hoursTaught || 48}h</span>
                    <p className="text-[11px] text-gray-400">{locale === 'ar' ? 'ساعات التدريس' : 'Heures enseignées'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-1">
                    <span className="text-xl font-black text-lime-400">{teacherProfile?.studentsCount || 420}+</span>
                    <p className="text-[11px] text-gray-400">{locale === 'ar' ? 'طالب مستفيد' : 'Étudiants formés'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-1">
                    <span className="text-xl font-black text-amber-300">5.0 ★</span>
                    <p className="text-[11px] text-gray-400">{locale === 'ar' ? 'التقييم البيداغوجي' : 'Note Pédagogique'}</p>
                  </div>
                </div>

                {/* Courses */}
                <div className="p-6 rounded-3xl border border-white/10 bg-[#0A0E1A] space-y-4">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-gold-400" />
                    <span>{locale === 'ar' ? 'المقررات والدروس المعتمدة' : 'Modules & Cours Enseignés'}</span>
                  </h3>

                  {courses.length > 0 ? (
                    <div className="space-y-3">
                      {courses.map((c) => (
                        <div key={c.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3 hover:border-gold-500/40 transition-all">
                          <div className="space-y-1">
                            <h4 className="text-xs sm:text-sm font-bold text-white">{c.titleAr}</h4>
                            <p className="text-[11px] text-gray-400 flex items-center gap-2">
                              <span>{c.lessonsCount} {locale === 'ar' ? 'درس' : 'leçons'}</span>
                              <span>•</span>
                              <span className="text-gold-400 font-mono font-bold">{c.priceDzd > 0 ? `${c.priceDzd.toLocaleString()} DZD` : (locale === 'ar' ? 'مجاني' : 'Gratuit')}</span>
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-xl bg-gold-500/20 text-gold-300 text-xs font-bold shrink-0">
                            {c.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-gray-400">
                      {locale === 'ar' ? 'يتم تحضير مقررات جديدة لهذا الأستاذ للفصل الحالي.' : 'Nouveaux cours en préparation.'}
                    </div>
                  )}
                </div>

                {/* Dawarat & Live Sessions */}
                <div className="p-6 rounded-3xl border border-white/10 bg-[#0A0E1A] space-y-4">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Video className="w-5 h-5 text-emerald-400" />
                    <span>{locale === 'ar' ? 'الدورات وورشات العمل المباشرة (Dawarat)' : 'Masterclasses & Séances Live'}</span>
                  </h3>

                  {sessions.length > 0 ? (
                    <div className="space-y-3">
                      {sessions.map((s) => (
                        <div key={s.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3 hover:border-emerald-500/40 transition-all">
                          <div className="space-y-1">
                            <h4 className="text-xs sm:text-sm font-bold text-white">{s.title}</h4>
                            <div className="flex items-center gap-3 text-[11px] text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gold-400" />
                                {new Date(s.scheduledAt).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')}
                              </span>
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3 text-sky-400" />
                                {s.durationMinutes} min
                              </span>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold shrink-0">
                            {s.platform}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-gray-400">
                      {locale === 'ar' ? 'لا توجد حصص مباشرة مجدولة حالياً لهذا الأستاذ.' : 'Aucune session live actuellement programmée.'}
                    </div>
                  )}
                </div>

                {/* Packs & Bundles */}
                {bundles.length > 0 && (
                  <div className="p-6 rounded-3xl border border-white/10 bg-[#0A0E1A] space-y-4">
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Package className="w-5 h-5 text-amber-400" />
                      <span>{locale === 'ar' ? 'حزم الامتحانات والتحضير المكثف (Packs)' : 'Packs de Préparation & Examens'}</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {bundles.map((b) => (
                        <div key={b.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                          <h4 className="text-xs font-bold text-white">{b.titleAr}</h4>
                          <p className="text-[11px] text-gray-400 line-clamp-2">{b.descriptionAr}</p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-black font-mono text-gold-300">
                              {b.currentPriceDzd.toLocaleString()} DZD
                            </span>
                            <span className="text-[10px] text-gray-400">{b.hours}h • {b.lecturesCount} حصص</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STUDENT VIEW */}
            {isStudent && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl border border-white/10 bg-[#0A0E1A] space-y-4">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-gold-400" />
                    <span>{locale === 'ar' ? 'الملف الأكاديمي للطالب' : 'Profil Académique Étudiant'}</span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-gray-400">{locale === 'ar' ? 'المسار التعليمي:' : 'Filière:'}</span>
                      <span className="font-bold text-white uppercase">{user.track || 'UNIVERSITY_LMD'}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-gray-400">{locale === 'ar' ? 'التخصص الدراسي:' : 'Spécialité:'}</span>
                      <span className="font-bold text-white">{user.specialty || (locale === 'ar' ? 'جذع مشترك' : 'Tronc commun')}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-gray-400">{locale === 'ar' ? 'السنة الأكاديمية:' : 'Année Académique:'}</span>
                      <span className="font-mono text-gold-300 font-bold">{user.academicYear || '2025/2026'}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-gray-400">{locale === 'ar' ? 'نوع العضوية:' : 'Statut:'}</span>
                      <span className="px-3 py-0.5 rounded-full bg-gold-500/20 border border-gold-400/40 text-gold-300 font-bold">
                        {user.role === 'STUDENT_PAID' ? 'GOLD VIP' : 'FREE PASS'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-gold-300">
                      {locale === 'ar' ? 'بطاقة الطالب الرسمية المعتمدة' : 'Carte Étudiante Officielle'}
                    </h4>
                    <p className="text-[11px] text-gray-300 mt-1">
                      {locale === 'ar'
                        ? 'تتيح لحاملها المشاركة في الحصص الحضورية، قاعات المطالعة المعتمدة ومراجعة الامتحانات المصححة نموذجياً.'
                        : 'Accès aux masterclasses en présentiel et à la bibliothèque numérique des examens.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ADMIN / EMPLOYEE VIEW */}
            {isAdminOrStaff && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl border border-white/10 bg-[#0A0E1A] space-y-4">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-gold-400" />
                    <span>{locale === 'ar' ? 'المسؤولية الإدارية والوظيفية' : 'Responsabilité Administrative'}</span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-gray-400">{locale === 'ar' ? 'الصفة / المنصب الوظيفي:' : 'Poste & Fonction:'}</span>
                      <span className="font-extrabold text-[#F2D272] text-sm">{user.jobTitle || roleTitle}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-gray-400">{locale === 'ar' ? 'الإدارة المركزية:' : 'Direction:'}</span>
                      <span className="font-bold text-white">
                        {isZakarya || user.role === 'OWNER'
                          ? (locale === 'ar' ? 'المديرية التقنية والهندسة الرقمية (CTO)' : 'Direction Technique & CTO Office')
                          : user.adminRole === 'GENERAL_ADMIN'
                          ? (locale === 'ar' ? 'الإدارة العامة والتنفيذية' : 'Direction Générale Exécutive')
                          : user.adminRole === 'COMMERCIAL'
                          ? (locale === 'ar' ? 'المديرية التجارية وإدارة العروض والدورات' : 'Direction Commerciale & Offres')
                          : user.adminRole === 'HR_MANAGER' || user.adminRole === 'HR_EMPLOYEE'
                          ? (locale === 'ar' ? 'مديرية الموارد البشرية والتوظيف' : 'Direction des Ressources Humaines')
                          : user.adminRole === 'FINANCE'
                          ? (locale === 'ar' ? 'المديرية المالية والمحاسبة' : 'Direction Financière')
                          : (locale === 'ar' ? 'الإدارة العامة والحوكمة' : 'Direction Générale')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-gray-400">{locale === 'ar' ? 'مستوى الصلاحية:' : 'Niveau de gouvernance:'}</span>
                      <span className="font-mono text-lime-400 font-bold">
                        {user.role === 'OWNER' || isZakarya
                          ? 'SUPER ADMIN & CTO (Level 100)'
                          : user.adminRole === 'GENERAL_ADMIN'
                          ? 'ADMIN GÉNÉRAL (Level 95)'
                          : user.adminRole === 'HR_MANAGER'
                          ? 'HR MANAGER (Level 85)'
                          : user.adminRole === 'COMMERCIAL'
                          ? 'CHARGÉE COMMERCIALE (Level 80)'
                          : 'ADMIN STAFF (Authorized)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Official Seal Banner */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-gold-500/15 via-[#0C142B] to-gold-500/15 border border-gold-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-gold-300 font-bold text-xs">
                    <Award className="w-4 h-4 text-gold-400" />
                    <span>{locale === 'ar' ? 'عضو رسمي موثق في الطاقم الإداري' : 'Membre Certifié de l\'Équipe Dirigeante'}</span>
                  </div>
                  <p className="text-[11px] text-gray-300">
                    {locale === 'ar'
                      ? 'هذا الحساب مؤهل رسمياً لتمثيل أكاديمية DZ Prime في الشراكات المؤسساتية، التوظيف، تنسيق الفعاليات الأكاديمية الوطنية وخدمة الطلبة والأساتذة.'
                      : 'Ce compte est officiellement habilité à représenter DZ Prime Academy.'}
                  </p>
                </div>
              </div>
            )}

            {/* AMBASSADOR VIEW */}
            {isAmbassador && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl border border-white/10 bg-[#0A0E1A] space-y-4">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-gold-400" />
                    <span>{locale === 'ar' ? 'بيانات السفير المعتمد للولاية' : 'Ambassadeur de Wilaya'}</span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-gray-400">{locale === 'ar' ? 'الولاية الممثلة:' : 'Wilaya Représentée:'}</span>
                      <span className="font-bold text-white">{ambassadorProfile?.wilayaNameAr || user.wilayaName}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-gray-400">{locale === 'ar' ? 'رمز التخفيض المعتمد:' : 'Code Promo:'}</span>
                      <span className="font-mono text-lime-400 font-black">{ambassadorProfile?.promoCode || 'DZ-PROMO'}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-gray-400">{locale === 'ar' ? 'تقييم الطلبة:' : 'Évaluation:'}</span>
                      <span className="font-bold text-gold-300">
                        {ambassadorProfile?.ratingAverage || 5.0} ★ ({ambassadorProfile?.ratingsCount || 1} {locale === 'ar' ? 'تقييم' : 'avis'})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= SOCIAL FEED: VIDEOS & POSTS ================= */}
        {(isTeacher || isAmbassador || isAdminOrStaff) && (
          <div className="mt-12 pt-10 border-t border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white flex items-center gap-2.5">
                <Video className="w-5 h-5 text-gold-400" />
                <span>
                  {locale === 'ar'
                    ? `فيديوهات ومنشورات: ${user.name || ''}`
                    : `Publications & Vidéos de ${user.name || ''}`}
                </span>
              </h3>
            </div>
            <SocialFeed
              authorFilterId={user.id}
              showHeader={false}
              emptyMessage={
                locale === 'ar'
                  ? 'لا توجد منشورات أو فيديوهات منشورة حالياً من هذا العضو.'
                  : 'Aucune publication pour le moment.'
              }
            />
          </div>
        )}
      </div>

      <SettingsModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          loadProfile();
        }}
        defaultTab="profile"
      />
    </div>
  );
}

