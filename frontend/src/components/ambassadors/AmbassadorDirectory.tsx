'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Award,
  Star,
  Calendar,
  MapPin,
  Sparkles,
  Search,
  MessageSquare,
  CheckCircle2,
  Phone,
  Send,
  ExternalLink,
  BookOpen,
  X,
  Plus,
  Filter,
  GraduationCap,
  Building2,
  Heart,
  Share2,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AmbassadorProfile, StudentReview, Region } from '@/types';
import { AMBASSADORS, WILAYAS, getLocalizedAmbassadorBio } from '@/lib/initial-data';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/store';

interface AmbassadorDirectoryProps {
  initialWilayaCode?: number;
  showAdminActions?: boolean;
  onSelectAmbassadorForAdmin?: (amb: AmbassadorProfile) => void;
}

export const AmbassadorDirectory: React.FC<AmbassadorDirectoryProps> = ({
  initialWilayaCode,
  showAdminActions = false,
  onSelectAmbassadorForAdmin,
}) => {
  const { t, locale, isRtl } = useTranslation();
  const { currentUser } = useAuthStore();

  const [ambassadorsList, setAmbassadorsList] = useState<AmbassadorProfile[]>(AMBASSADORS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<Region | 'ALL'>('ALL');
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<number | 'ALL'>(
    initialWilayaCode || 'ALL'
  );

  // Modals
  const [activeProfileAmbassador, setActiveProfileAmbassador] = useState<AmbassadorProfile | null>(null);
  const [rateModalAmbassador, setRateModalAmbassador] = useState<AmbassadorProfile | null>(null);
  const [bookModalAmbassador, setBookModalAmbassador] = useState<AmbassadorProfile | null>(null);

  // Rating Form State
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingStudentName, setRatingStudentName] = useState(currentUser?.name || '');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Booking Form State
  const [bookSessionType, setBookSessionType] = useState<'IN_PERSON' | 'ONLINE'>('IN_PERSON');
  const [bookStudentPhone, setBookStudentPhone] = useState('');
  const [bookConfirmed, setBookConfirmed] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered Ambassadors
  const filteredAmbassadors = useMemo(() => {
    return ambassadorsList.filter((amb) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = amb.user.name.toLowerCase().includes(q);
        const matchesWilaya =
          amb.wilayaNameAr.toLowerCase().includes(q) ||
          (amb.wilayaNameFr && amb.wilayaNameFr.toLowerCase().includes(q));
        const matchesInst =
          amb.institutionNameAr.toLowerCase().includes(q) ||
          (amb.institutionNameFr && amb.institutionNameFr.toLowerCase().includes(q));
        const matchesSpecialty = amb.specialtyName?.toLowerCase().includes(q);
        if (!matchesName && !matchesWilaya && !matchesInst && !matchesSpecialty) {
          return false;
        }
      }

      // Region
      if (selectedRegion !== 'ALL' && amb.region) {
        if (amb.region !== selectedRegion) return false;
      }

      // Wilaya
      if (selectedWilayaCode !== 'ALL') {
        if (amb.wilayaCode !== selectedWilayaCode) return false;
      }

      return true;
    });
  }, [ambassadorsList, searchQuery, selectedRegion, selectedWilayaCode]);

  // Submit Rating
  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateModalAmbassador || !ratingComment.trim()) return;

    const newReview: StudentReview = {
      id: `rev-${Date.now()}`,
      score: ratingScore,
      comment: ratingComment.trim(),
      studentName: ratingStudentName.trim() || (locale === 'ar' ? 'طالب جامعي' : 'Étudiant'),
      studentRole: currentUser?.role || 'STUDENT_FREE',
      institution: currentUser?.institutionName || rateModalAmbassador.institutionNameAr,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setAmbassadorsList((prev) =>
      prev.map((a) => {
        if (a.id === rateModalAmbassador.id) {
          const currentReviews = a.reviews || [];
          const newReviews = [newReview, ...currentReviews];
          const currAvg = a.ratingAverage ?? 5.0;
          const currCount = a.ratingsCount ?? 0;
          const newAvg = Number(
            (
              (currAvg * currCount + ratingScore) /
              (currCount + 1)
            ).toFixed(2)
          );
          const updated = {
            ...a,
            ratingAverage: newAvg,
            ratingsCount: currCount + 1,
            reviews: newReviews,
          };
          if (activeProfileAmbassador?.id === a.id) {
            setActiveProfileAmbassador(updated);
          }
          return updated;
        }
        return a;
      })
    );

    try {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#f2aa34', '#6db1d8', '#f2aa34'],
      });
    } catch (e) {}

    showToast(locale === 'ar' ? 'شكراً لك! تم نشر تقييمك للسفير بنجاح ' : 'Merci! Votre avis a été publié avec succès ');
    setRatingComment('');
    setRateModalAmbassador(null);
  };

  // Submit Booking
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookConfirmed(true);
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.75 },
        colors: ['#6db1d8', '#f2aa34', '#0880f0'],
      });
    } catch (e) {}

    setTimeout(() => {
      setBookConfirmed(false);
      setBookModalAmbassador(null);
      showToast(
        locale === 'ar'
          ? 'تم تأكيد حجز مقعدك في ورشة المراجعة بنجاح! تفقد بريدك/هاتفك.'
          : 'Votre réservation a été confirmée avec succès!'
      );
    }, 2000);
  };

  const regionTabs = [
    { id: 'ALL', labelAr: 'جميع ولايات الوطن (58 ولاية)', labelFr: 'Toutes les régions' },
    { id: 'CENTER', labelAr: 'الوسط (الجزائر، البليدة، تيزي وزو...)', labelFr: 'Centre' },
    { id: 'EAST', labelAr: 'الشرق (قسنطينة، سطيف، عنابة...)', labelFr: 'Est' },
    { id: 'WEST', labelAr: 'الغرب (وهران، تلمسان، مستغانم...)', labelFr: 'Ouest' },
    { id: 'SOUTH', labelAr: 'الجنوب الكبير (ورقلة، بسكرة، غرداية...)', labelFr: 'Sud' },
  ];

  return (
    <div className="w-full space-y-6 select-none font-arabic">
      {/* ================= AMBASSADOR DIRECTORY HEADER BANNER ================= */}
      <div className="relative p-5 sm:p-8 rounded-3xl bg-[#0b0b0d] border border-gold-500/35 text-white shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-gold-500/15 via-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 border border-gold-500/40 text-gold-300 text-xs font-bold shadow-sm">
              <Award className="w-3.5 h-3.5 text-gold-400" />
              <span>{locale === 'ar' ? 'شبكة النخبة وسفراء الجامعات الرسميين' : 'Réseau National des Ambassadeurs Certifiés'}</span>
            </div>

            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{t('nav.ambassadors')}</span>
              <span className="text-base sm:text-xl text-gold-400">🇩🇿</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {locale === 'ar'
                ? 'تعرف على سفير جامعتك وولايتك، احضر ورشات المراجعة الحضورية والمباشرة، احصل على نصائح التفوق، وقيم تجربة الدعم الأكاديمي.'
                : 'Découvrez les ambassadeurs DZ Prime de votre université et wilaya. Participez aux sessions de révision et accédez aux ressources certifiées.'}
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-white/5 dark:bg-black/40 p-3 sm:p-4 rounded-2xl border border-white/10 text-center shrink-0">
            <div>
              <span className="block text-lg sm:text-2xl font-black text-gold-400 font-mono">
                {ambassadorsList.length}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                {locale === 'ar' ? 'سفراء معتمدون' : 'Ambassadeurs'}
              </span>
            </div>
            <div className="border-x border-white/10 px-2">
              <span className="block text-lg sm:text-2xl font-black text-emerald-400 font-mono">
                4.92
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                {locale === 'ar' ? 'متوسط التقييم' : 'Note Globale'}
              </span>
            </div>
            <div>
              <span className="block text-lg sm:text-2xl font-black text-white font-mono">
                58
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                {locale === 'ar' ? 'ولاية مغطاة' : 'Wilayas'}
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6 relative">
          <Search className="w-5 h-5 text-gold-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              locale === 'ar'
                ? 'ابحث بالاسم، الولاية (الجزائر، وهران، قسنطينة، سطيف...)، الجامعة (USTHB, USTO...)، أو التخصص...'
                : 'Rechercher par nom, wilaya (Alger, Oran, Constantine...), université ou spécialité...'
            }
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white/10 dark:bg-black/50 border border-white/20 focus:border-gold-400 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all font-arabic"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/20 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Region Filter Tabs */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {regionTabs.map((r) => {
            const active = selectedRegion === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRegion(r.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  active
                    ? 'bg-gold-500 text-navy-950 font-black shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 hover:border-gold-500/40'
                }`}
              >
                <span>{locale === 'ar' ? r.labelAr : r.labelFr}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= AMBASSADORS GRID ================= */}
      {filteredAmbassadors.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-gray-800 space-y-3">
          <Users className="w-12 h-12 text-slate-400 mx-auto opacity-50" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            {locale === 'ar' ? 'لم يتم العثور على سفراء مطابقين لبحثك' : 'Aucun ambassadeur trouvé'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-gray-400">
            {locale === 'ar' ? 'جرب البحث عن ولاية أو جامعة أخرى.' : 'Essayez une autre recherche par région ou université.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredAmbassadors.map((amb) => (
            <motion.div
              key={amb.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-slate-800/90 hover:border-gold-500/60 dark:hover:border-gold-500/60 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Header: Avatar, Name & Verification */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gold-500 p-0.5 shadow-md">
                        <div className="w-full h-full rounded-[14px] bg-slate-900 text-gold-300 font-black flex items-center justify-center text-lg sm:text-xl font-sans">
                          {amb.user.name.charAt(0)}
                        </div>
                      </div>
                      {amb.isVerified && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm" title="Verified Ambassador">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate group-hover:text-gold-600 dark:group-hover:text-gold-300 transition-colors">
                          {amb.user.name}
                        </h3>
                      </div>
                      <p className="text-[11px] font-bold text-slate-500 dark:text-gray-400 flex items-center gap-1 truncate mt-0.5">
                        <MapPin className="w-3 h-3 text-gold-500 shrink-0" />
                        <span>Wilaya {amb.wilayaCode} ({amb.wilayaNameAr})</span>
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-gray-400 truncate">
                        {amb.specialtyName || 'Informatique & Sciences'}
                      </p>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <div className="flex flex-col items-end shrink-0">
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-gold-300 text-xs font-black font-mono shadow-sm">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{amb.ratingAverage}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 dark:text-gray-400 font-mono mt-0.5">
                      ({amb.ratingsCount} {locale === 'ar' ? 'تقييم' : 'avis'})
                    </span>
                  </div>
                </div>

                {/* Institution Tag */}
                <div className="mt-3 p-2 rounded-xl bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-gray-300 flex items-center gap-1.5 truncate">
                  <Building2 className="w-3.5 h-3.5 text-lime-600 dark:text-gold-400 shrink-0" />
                  <span className="truncate">{amb.institutionNameAr}</span>
                </div>

                {/* Badges List */}
                {amb.badges && (
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    {amb.badges.slice(0, 3).map((badge, bIdx) => (
                      <span
                        key={bIdx}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 text-[10px] font-bold"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bio Snippet */}
                <p className="mt-3 text-xs text-slate-600 dark:text-gray-300 line-clamp-2 leading-relaxed text-left">
                  {getLocalizedAmbassadorBio(amb, locale)}
                </p>

                {/* Key Metrics Row */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                  <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-navy-900/50">
                    <span className="block font-black text-slate-900 dark:text-white text-xs">
                      {amb.upcomingSessionsCount}
                    </span>
                    <span className="text-slate-400">
                      {locale === 'ar' ? 'حصص قادمة' : 'Sessions'}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-navy-900/50">
                    <span className="block font-black text-slate-900 dark:text-white text-xs">
                      {amb.materialsCuratedCount || 40}
                    </span>
                    <span className="text-slate-400">
                      {locale === 'ar' ? 'مواضيع' : 'Annales'}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-navy-900/50">
                    <span className="block font-black text-slate-900 dark:text-white text-xs">
                      {amb.studentsMentoredCount || 500}+
                    </span>
                    <span className="text-slate-400">
                      {locale === 'ar' ? 'طالب مرافَق' : 'Étudiants'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => setRateModalAmbassador(amb)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-navy-850 hover:bg-amber-500/20 hover:text-amber-500 text-slate-600 dark:text-gray-300 text-xs font-bold flex items-center gap-1 transition-all"
                  title="Rate this Ambassador"
                >
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">{locale === 'ar' ? 'تقييم' : 'Noter'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setBookModalAmbassador(amb)}
                    className="px-3 py-1.5 rounded-xl bg-lime-400 dark:bg-gold-500 text-navy-950 font-black text-xs shadow-sm hover:scale-105 transition-all"
                  >
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />
                    <span>{locale === 'ar' ? 'حجز حصة' : 'Réserver'}</span>
                  </button>

                  <button
                    onClick={() => setActiveProfileAmbassador(amb)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-all"
                  >
                    <span>{locale === 'ar' ? 'الملف الكامل' : 'Profil'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ================= FULL AMBASSADOR PROFILE MODAL ================= */}
      <AnimatePresence>
        {activeProfileAmbassador && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveProfileAmbassador(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-gold-500/40 p-5 sm:p-7 shadow-2xl text-left font-arabic z-10 space-y-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gold-500 p-0.5 shadow-md">
                    <div className="w-full h-full rounded-[14px] bg-slate-900 text-gold-300 font-black flex items-center justify-center text-xl font-sans">
                      {activeProfileAmbassador.user.name.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                        {activeProfileAmbassador.user.name}
                      </h2>
                      {activeProfileAmbassador.isVerified && (
                        <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          {locale === 'ar' ? 'سفير رسمي معتمد ✓' : 'Ambassadeur Certifié ✓'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-gray-400 mt-0.5">
                      {activeProfileAmbassador.institutionNameAr} • Wilaya {activeProfileAmbassador.wilayaCode}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveProfileAmbassador(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-slate-600 dark:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Bio & Details */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {locale === 'ar' ? 'النبذة الأكاديمية والمهام' : 'Biographie & Missions'}
                </h4>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-gray-200">
                  {getLocalizedAmbassadorBio(activeProfileAmbassador, locale)}
                </p>
              </div>

              {/* Direct Telegram / WhatsApp Channels */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-transparent border border-blue-500/30">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {locale === 'ar' ? 'التواصل المباشر مع السفير:' : 'Canal Direct:'}
                  </span>
                  <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">
                    {activeProfileAmbassador.telegramHandle || '@dzprime_ambassador'}
                  </span>
                </div>

                <a
                  href={`https://t.me/${(activeProfileAmbassador.telegramHandle || 'dzprime').replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{locale === 'ar' ? 'فتح في تيليغرام' : 'Ouvrir Telegram'}</span>
                </a>
              </div>

              {/* Student Reviews List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-gold-500" />
                    <span>{locale === 'ar' ? 'آراء وتقييمات الطلبة' : 'Avis et Retours des Étudiants'}</span>
                    <span className="text-gold-500 font-mono">({activeProfileAmbassador.reviews?.length || 0})</span>
                  </h4>

                  <button
                    onClick={() => {
                      setRateModalAmbassador(activeProfileAmbassador);
                    }}
                    className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-gold-300 text-xs font-bold hover:bg-amber-500/25 transition-all"
                  >
                    + {locale === 'ar' ? 'أضف تقييمك' : 'Laisser un avis'}
                  </button>
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {(!activeProfileAmbassador.reviews || activeProfileAmbassador.reviews.length === 0) ? (
                    <p className="text-xs text-slate-500 dark:text-gray-400 py-3 text-center">
                      {locale === 'ar' ? 'كن أول من يكتب تقييماً لهذا السفير!' : 'Soyez le premier à noter cet ambassadeur!'}
                    </p>
                  ) : (
                    activeProfileAmbassador.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-900/50 border border-slate-100 dark:border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              {rev.studentName}
                            </span>
                            <span className="text-[10px] text-slate-400">• {rev.institution}</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {[...Array(rev.score)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-500" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-gray-300">{rev.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setRateModalAmbassador(activeProfileAmbassador);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-800 dark:text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Star className="w-4 h-4 text-amber-500" />
                  <span>{locale === 'ar' ? 'تقييم السفير' : 'Évaluer'}</span>
                </button>

                <button
                  onClick={() => {
                    setBookModalAmbassador(activeProfileAmbassador);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gold-500 text-navy-950 font-black text-xs shadow-gold-glow flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{locale === 'ar' ? 'حجز مقعد في الورشة القادمة' : 'Réserver une Séance'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= RATE AMBASSADOR MODAL ================= */}
      <AnimatePresence>
        {rateModalAmbassador && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRateModalAmbassador(null)}
                  aria-label="Close"
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-gold-500/40 p-5 sm:p-6 shadow-2xl text-left font-arabic z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                  <span>{locale === 'ar' ? 'تقييم السفير:' : 'Évaluer:'} {rateModalAmbassador.user.name}</span>
                </h3>
                <button
                  onClick={() => setRateModalAmbassador(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRatingSubmit} className="space-y-4">
                {/* 5-Star Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                    {locale === 'ar' ? 'اختر الدرجة (من 1 إلى 5 نجوم):' : 'Votre note:'}
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingScore(star)}
                        className={`p-2 rounded-xl border transition-all ${
                          ratingScore >= star
                            ? 'bg-amber-500/20 border-amber-500 text-amber-500 scale-110'
                            : 'bg-slate-100 dark:bg-navy-900 border-slate-200 dark:border-gray-800 text-slate-400'
                        }`}
                      >
                        <Star className={`w-5 h-5 ${ratingScore >= star ? 'fill-amber-500' : ''}`} />
                      </button>
                    ))}
                    <span className="font-mono text-sm font-black text-gold-500 ml-2">
                      {ratingScore} / 5.0
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">
                    {locale === 'ar' ? 'اسمك أو لقبك الدراسي:' : 'Votre nom:'}
                  </label>
                  <input
                    type="text"
                    value={ratingStudentName}
                    onChange={(e) => setRatingStudentName(e.target.value)}
                    placeholder={locale === 'ar' ? 'مثال: أيمن ب. (طالب L1 MI)' : 'Ex: Aymen B.'}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-gray-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-gold-500 font-arabic"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">
                    {locale === 'ar' ? 'رأيك وملاحظاتك حول السفير:' : 'Votre commentaire:'}
                  </label>
                  <textarea
                    rows={3}
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    required
                    placeholder={
                      locale === 'ar'
                        ? 'كيف كانت تجربتك في حصص المراجعة والملخصات التي يقدمها؟'
                        : 'Partagez votre retour d\'expérience sur les séances et conseils...'
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-gray-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-gold-500 font-arabic"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRateModalAmbassador(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-gray-300 text-xs font-bold"
                  >
                    {locale === 'ar' ? 'إلغاء' : 'Annuler'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gold-500 text-navy-950 font-black text-xs shadow-gold-glow"
                  >
                    {locale === 'ar' ? 'نشر التقييم' : 'Envoyer mon avis'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= BOOK STUDY WORKSHOP MODAL ================= */}
      <AnimatePresence>
        {bookModalAmbassador && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBookModalAmbassador(null)}
                  aria-label="Close"
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-gold-500/40 p-5 sm:p-6 shadow-2xl text-left font-arabic z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-lime-500" />
                  <span>{locale === 'ar' ? 'حجز حصة مراجعة مع السفير' : 'Réserver une Séance'}</span>
                </h3>
                <button
                  onClick={() => setBookModalAmbassador(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {bookConfirmed ? (
                <div className="p-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {locale === 'ar' ? 'تم تأكيد حجز مقعدك بنجاح!' : 'Réservation Confirmée!'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    {locale === 'ar'
                      ? 'تم إرسال تفاصيل القاعة ورابط الدخول إلى بريدك وهاتفك.'
                      : 'Les détails de la salle et le lien vous ont été envoyés.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200 dark:border-gray-800 text-xs text-slate-700 dark:text-gray-300">
                    <p className="font-extrabold text-slate-900 dark:text-white">
                      {bookModalAmbassador.user.name} ({bookModalAmbassador.institutionNameAr})
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
                      {locale === 'ar' ? 'الورشة القادمة: الخميس القادم 10:00 صباحاً' : 'Prochaine session: Jeudi 10h00'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                      {locale === 'ar' ? 'نوع الحضور المرغوب:' : 'Mode de présence:'}
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setBookSessionType('IN_PERSON')}
                        className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                          bookSessionType === 'IN_PERSON'
                            ? 'bg-lime-400/20 border-lime-500 text-lime-800 dark:text-lime-300'
                            : 'bg-slate-50 dark:bg-navy-900 border-slate-200 dark:border-gray-800 text-slate-600'
                        }`}
                      >
                        {locale === 'ar' ? 'حضوري بالجامعة' : 'Présentiel (Amphi)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookSessionType('ONLINE')}
                        className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                          bookSessionType === 'ONLINE'
                            ? 'bg-lime-400/20 border-lime-500 text-lime-800 dark:text-lime-300'
                            : 'bg-slate-50 dark:bg-navy-900 border-slate-200 dark:border-gray-800 text-slate-600'
                        }`}
                      >
                        {locale === 'ar' ? 'أونلاين (زووم / ميت)' : 'En ligne (Google Meet)'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">
                      {locale === 'ar' ? 'رقم الهاتف للتأكيد (SMS / واتساب):' : 'Numéro de téléphone:'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={bookStudentPhone}
                      onChange={(e) => setBookStudentPhone(e.target.value)}
                      placeholder="+213 550 00 00 00"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-gray-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-gold-500 font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setBookModalAmbassador(null)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-gray-300 text-xs font-bold"
                    >
                      {locale === 'ar' ? 'إلغاء' : 'Annuler'}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-lime-400 text-navy-950 font-black text-xs shadow-md"
                    >
                      {locale === 'ar' ? 'تأكيد الحجز المجاني' : 'Confirmer la Réservation'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= TOAST NOTIFICATION ================= */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-bold font-arabic shadow-2xl flex items-center gap-2 border border-gold-500/30"
          >
            <Sparkles className="w-4 h-4 text-gold-400 dark:text-gold-600" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
