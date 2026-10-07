'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  Star,
  Clock,
  Users,
  ArrowRight,
  Bot,
  Video,
  FileText,
  Trophy,
  ShieldCheck,
  Zap,
  TrendingUp,
  Tag,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthModal } from '@/lib/authModalContext';
import { formatDZD } from '@/lib/format';
import { LandingPageConfig } from '@/lib/landingConfig';

interface CourseItem {
  id: string;
  badge?: string;
  badgeColor?: string;
  thumbnailUrl: string;
  titleAr: string;
  titleFr: string;
  category: string;
  instructorNameAr: string;
  instructorNameFr: string;
  instructorAvatar: string;
  rating: number;
  reviewsCount: number;
  durationHours: number;
  levelAr: string;
  levelFr: string;
  priceDzd: number;
  isPopular?: boolean;
}

const FEATURED_COURSES: CourseItem[] = [
  {
    id: 'course-1',
    badge: 'Bestseller',
    badgeColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
    thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    titleAr: 'المراجعة الشاملة لمادة الرياضيات (بكالوريا 2026)',
    titleFr: 'Pack Révision Complète Mathématiques (BAC 2026)',
    category: 'BAC',
    instructorNameAr: 'د. يوسف منصوري',
    instructorNameFr: 'Dr. Youssef Mansouri',
    instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 320,
    durationHours: 35,
    levelAr: 'جميع الشعب العلمية',
    levelFr: 'Toutes Filières Scientifiques',
    priceDzd: 4500,
    isPopular: true,
  },
  {
    id: 'course-2',
    badge: 'New',
    badgeColor: 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    titleAr: 'الخوارزميات وهيكلة البيانات 1 (L1 & L2 Informatique)',
    titleFr: 'Algorithmique & Structures de Données 1 (L1/L2 Info)',
    category: 'UNIVERSITY_LMD',
    instructorNameAr: 'أ. سامي بلحاج',
    instructorNameFr: 'Pr. Sami Belhadj',
    instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewsCount: 180,
    durationHours: 28,
    levelAr: 'جامعي LMD',
    levelFr: 'Licence LMD',
    priceDzd: 3800,
  },
  {
    id: 'course-3',
    badge: 'Popular',
    badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    thumbnailUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80',
    titleAr: 'دورة التشريح البشري وعلم الأنسجة (السنة الأولى طب)',
    titleFr: 'Anatomie Humaine & Histologie Médicale (1ère Année)',
    category: 'MEDICAL',
    instructorNameAr: 'د. أمينة زروقي',
    instructorNameFr: 'Dr. Amina Zerrouki',
    instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    rating: 4.95,
    reviewsCount: 410,
    durationHours: 42,
    levelAr: 'علوم طبية',
    levelFr: 'Sciences Médicales',
    priceDzd: 5500,
    isPopular: true,
  },
  {
    id: 'course-4',
    badge: 'Trending',
    badgeColor: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&auto=format&fit=crop&q=80',
    titleAr: 'العلوم الفيزيائية والوحدات الأساسية للبكالوريا',
    titleFr: 'Physique-Chimie & Mécanique pour le BAC',
    category: 'BAC',
    instructorNameAr: 'أ. طارق قادري',
    instructorNameFr: 'Pr. Tarek Kadri',
    instructorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    rating: 4.85,
    reviewsCount: 245,
    durationHours: 30,
    levelAr: 'بكالوريا علوم & رياضي',
    levelFr: 'BAC Sciences & Math',
    priceDzd: 4000,
  },
];

export const CourseTopicExplorer: React.FC = () => {
  const { locale, isRtl } = useTranslation();
  const { openAuth } = useAuthModal();
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'BAC' | 'UNIVERSITY_LMD' | 'MEDICAL'>('ALL');
  const [dynamicConfig, setDynamicConfig] = useState<LandingPageConfig | null>(null);
  const [realStats, setRealStats] = useState<{
    examsCount: number;
    studentsCount: number;
    wilayasCount: number;
    satisfactionRate: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/settings/landing')
      .then((res) => res.json())
      .then((data) => {
        if (data?.config) {
          setDynamicConfig(data.config);
        }
        if (data?.realStats) {
          setRealStats(data.realStats);
        }
      })
      .catch(() => {});
  }, []);

  const categories = [
    { id: 'ALL', labelAr: 'جميع التخصصات', labelFr: 'Toutes les filières', icon: Sparkles },
    { id: 'BAC', labelAr: 'شهادة البكالوريا 2026', labelFr: 'BAC 2026', icon: GraduationCap },
    { id: 'UNIVERSITY_LMD', labelAr: 'الجامعة والـ LMD', labelFr: 'Université & LMD', icon: BookOpen },
    { id: 'MEDICAL', labelAr: 'العلوم الطبية والصيدلة', labelFr: 'Médecine & Santé', icon: ShieldCheck },
  ];

  const currentCourses =
    dynamicConfig?.featuredCoursesSection?.courses && dynamicConfig.featuredCoursesSection.courses.length > 0
      ? dynamicConfig.featuredCoursesSection.courses
      : FEATURED_COURSES;

  const filteredCourses =
    selectedCategory === 'ALL'
      ? currentCourses
      : currentCourses.filter((c) => c.category === selectedCategory);

  return (
    <section id="courses-explorer" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-12 sm:space-y-16 font-arabic scroll-mt-24" data-testid="course-topic-explorer">
      {/* ================= 1. CATEGORY PILLS FILTER (Learnova style) ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gold-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-gold-600 dark:text-gold-400">
              {locale === 'ar'
                ? dynamicConfig?.featuredCoursesSection?.subtitleAr || 'المسارات والمقاييس المعتمدة'
                : dynamicConfig?.featuredCoursesSection?.subtitleFr || 'Modules & Filières'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {locale === 'ar'
              ? dynamicConfig?.featuredCoursesSection?.titleAr || 'استكشف أشهر الدورات والمقاييس'
              : dynamicConfig?.featuredCoursesSection?.titleFr || 'Explorez nos modules populaires'}
          </h2>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-gold-500/20 overflow-x-auto no-scrollbar shadow-sm">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  active
                    ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-navy-950 shadow-md font-black'
                    : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? cat.labelAr : cat.labelFr}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= 2. POPULAR COURSES BENTO GRID (Learnova Card Style) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        <AnimatePresence mode="popLayout">
          {filteredCourses.map((course) => (
            <motion.div
              key={course.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="group relative rounded-3xl bg-white dark:bg-[#0A1022] border border-slate-200 dark:border-gold-500/25 p-4 sm:p-5 flex flex-col justify-between hover:border-gold-500/60 dark:hover:border-gold-400 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div>
                {/* Course Card Thumbnail Image (Learnova Style) */}
                <div className="relative w-full h-36 sm:h-40 rounded-2xl overflow-hidden mb-3.5 bg-slate-100 dark:bg-navy-950">
                  <img
                    src={course.thumbnailUrl}
                    alt={locale === 'ar' ? course.titleAr : course.titleFr}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5 rtl:left-auto rtl:right-2.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border backdrop-blur-md shadow-sm ${course.badgeColor}`}>
                      {course.badge}
                    </span>
                  </div>
                  <div className="absolute bottom-2 right-2 rtl:right-auto rtl:left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] text-white font-mono">
                    {course.durationHours}h Live
                  </div>
                </div>

                {/* Level Tag */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] text-slate-500 dark:text-gray-400 font-bold">
                    {locale === 'ar' ? course.levelAr : course.levelFr}
                  </span>
                </div>

                {/* Course Title */}
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug group-hover:text-gold-600 dark:group-hover:text-gold-300 transition-colors line-clamp-2">
                  {locale === 'ar' ? course.titleAr : course.titleFr}
                </h3>

                {/* Instructor Info */}
                <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-gold-500/40 relative">
                    <img
                      src={course.instructorAvatar}
                      alt="Instructor"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs text-slate-700 dark:text-gray-300 font-semibold truncate">
                    {locale === 'ar' ? course.instructorNameAr : course.instructorNameFr}
                  </span>
                </div>

                {/* Meta stats: Rating & Duration */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400 mt-3">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{course.rating}</span>
                    <span className="text-slate-400 font-normal">({course.reviewsCount})</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3 h-3 text-gold-500" />
                    <span>{course.durationHours}h Live</span>
                  </div>
                </div>
              </div>

              {/* Price & CTA Action */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-white/10">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">
                    {locale === 'ar' ? 'سعر المقياس' : 'Prix'}
                  </span>
                  <span className="text-base font-black text-gold-700 dark:text-gold-300 font-mono">
                    {formatDZD(course.priceDzd)}
                  </span>
                </div>

                <button
                  onClick={() => openAuth('register')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-navy-800 hover:bg-gold-500 hover:text-navy-950 dark:hover:bg-gold-400 text-gold-300 dark:text-gold-200 text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>{locale === 'ar' ? 'التحق الآن' : 'Rejoindre'}</span>
                  <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ================= 3. "LEARN BY TOPIC & BOT" INTERACTIVE MATRIX (Learnova Bento Style) ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gold-600 dark:text-gold-400">
              {locale === 'ar' ? 'منظومة النجاح الأكاديمي' : 'Écosystème Pédagogique'}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {locale === 'ar' ? 'تعلّم حسب محورك المفضّل' : 'Explorez par catégorie'}
            </h3>
          </div>
          <Link
            href={`/${locale}/bot`}
            className="text-xs font-black text-gold-600 dark:text-gold-400 hover:underline flex items-center gap-1"
          >
            <span>{locale === 'ar' ? 'تصفح كل الخدمات' : 'Voir tout'}</span>
            <span>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Tile 1: AI Decision Tree Exam Bot & Summaries */}
          <Link
            href={`/${locale}/bot`}
            className="group relative rounded-3xl bg-gradient-to-br from-emerald-600/90 to-teal-800 text-white p-6 flex flex-col justify-between overflow-hidden shadow-lg hover:scale-[1.02] transition-transform"
          >
            <div className="space-y-2 relative z-10">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-base font-black text-white mt-3">
                {locale === 'ar' ? 'بوت الامتحانات والملخصات الذكي' : 'Bot Examens & Résumés'}
              </h4>
              <p className="text-xs text-white/80 leading-relaxed">
                {locale === 'ar'
                  ? 'اختر جامعتك، كليتك، وتخصصك لتصل فوراً لملخصات الدروس والامتحانات المحلولة.'
                  : 'Arborescence intelligente menant à vos annales officielles et résumés.'}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-black text-white/90 group-hover:gap-3 transition-all">
              <span>{locale === 'ar' ? 'تشغيل البوت' : 'Lancer le Bot'}</span>
              <span>→</span>
            </div>
          </Link>

          {/* Tile 2: Live Excellence Dawarat */}
          <Link
            href={`/${locale}/dawarat`}
            className="group relative rounded-3xl bg-gradient-to-br from-gold-500 to-amber-600 text-navy-950 p-6 flex flex-col justify-between overflow-hidden shadow-lg hover:scale-[1.02] transition-transform"
          >
            <div className="space-y-2 relative z-10">
              <div className="w-11 h-11 rounded-2xl bg-navy-950/15 backdrop-blur-md flex items-center justify-center">
                <Video className="w-6 h-6 text-navy-950" />
              </div>
              <h4 className="text-base font-black text-navy-950 mt-3">
                {locale === 'ar' ? 'حصص البث المباشر (Dawarat Live)' : 'Sessions en Direct Live'}
              </h4>
              <p className="text-xs text-navy-950/80 leading-relaxed font-semibold">
                {locale === 'ar'
                  ? 'محاضرات تفاعلية أسبوعية مع نخبة الأساتذة عبر Google Meet ومتابعة يومية.'
                  : 'Cours interactifs en temps réel avec les meilleurs enseignants certifiés.'}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-black text-navy-950 group-hover:gap-3 transition-all">
              <span>{locale === 'ar' ? 'جدول الحصص' : 'Voir le Planning'}</span>
              <span>→</span>
            </div>
          </Link>

          {/* Tile 3: Top Honor Roll & Leadership */}
          <Link
            href={`/${locale}/leaderboard`}
            className="group relative rounded-3xl bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-gold-500/30 p-6 flex flex-col justify-between shadow-sm hover:border-gold-500 hover:scale-[1.02] transition-all"
          >
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Trophy className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white mt-3">
                {locale === 'ar' ? 'لوحة صدارة المتفوقين والمجالس' : 'Classement & Top Majors'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                {locale === 'ar'
                  ? 'قائمة الشرف لأوائل الدفعات في البكالوريا والجامعة وهيكل القيادة التنظيمي.'
                  : 'Palmarès des majors de promo et structure de leadership national.'}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-black text-purple-600 dark:text-purple-400 group-hover:gap-3 transition-all">
              <span>{locale === 'ar' ? 'استعراض الصدارة' : 'Voir le Palmarès'}</span>
              <span>→</span>
            </div>
          </Link>

          {/* Tile 4: 58 Wilayas Ambassador Network */}
          <Link
            href={`/${locale}/ambassadors`}
            className="group relative rounded-3xl bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-gold-500/30 p-6 flex flex-col justify-between shadow-sm hover:border-gold-500 hover:scale-[1.02] transition-all"
          >
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white mt-3">
                {locale === 'ar' ? 'شبكة السفراء في 58 ولاية' : 'Réseau 58 Wilayas'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                {locale === 'ar'
                  ? 'سفراء معتمدون في جميع الجامعات لمرافقتك وتفعيل بطاقتك الجامعية فورياً.'
                  : 'Des ambassadeurs certifiés sur votre campus pour vous guider au quotidien.'}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-black text-sky-600 dark:text-sky-400 group-hover:gap-3 transition-all">
              <span>{locale === 'ar' ? 'دليل السفراء' : 'Trouver un Ambassadeur'}</span>
              <span>→</span>
            </div>
          </Link>
        </div>
      </div>

      {/* ================= 4. TRUST & METRICS RIBBON ================= */}
      <div className="rounded-3xl bg-slate-100 dark:bg-[#080D1D] border border-slate-200 dark:border-gold-500/25 p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl font-black text-gold-600 dark:text-gold-300 font-mono">
            {dynamicConfig?.stats?.mode === 'AUTO' && realStats
              ? `${realStats.examsCount.toLocaleString()}+`
              : dynamicConfig?.stats?.examsValue || '12,000+'}
          </div>
          <div className="text-xs text-slate-600 dark:text-gray-400 font-semibold">
            {locale === 'ar'
              ? dynamicConfig?.stats?.examsLabelAr || 'موضوع امتحان محلول'
              : dynamicConfig?.stats?.examsLabelFr || 'Annales Corrigées'}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {dynamicConfig?.stats?.mode === 'AUTO' && realStats
              ? `${realStats.studentsCount.toLocaleString()}+`
              : dynamicConfig?.stats?.studentsValue || '50,000+'}
          </div>
          <div className="text-xs text-slate-600 dark:text-gray-400 font-semibold">
            {locale === 'ar'
              ? dynamicConfig?.stats?.studentsLabelAr || 'طالب نشط بالمنصة'
              : dynamicConfig?.stats?.studentsLabelFr || 'Étudiants Actifs'}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 font-mono">
            {dynamicConfig?.stats?.mode === 'AUTO' && realStats
              ? `${realStats.wilayasCount}`
              : dynamicConfig?.stats?.wilayasValue || '58'}
          </div>
          <div className="text-xs text-slate-600 dark:text-gray-400 font-semibold">
            {locale === 'ar'
              ? dynamicConfig?.stats?.wilayasLabelAr || 'ولاية مغطاة بالسفراء'
              : dynamicConfig?.stats?.wilayasLabelFr || 'Wilayas Couvertes'}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {dynamicConfig?.stats?.mode === 'AUTO' && realStats?.satisfactionRate
              ? `${realStats.satisfactionRate}%`
              : dynamicConfig?.stats?.satisfactionValue || '-'}
          </div>
          <div className="text-xs text-slate-600 dark:text-gray-400 font-semibold">
            {locale === 'ar'
              ? dynamicConfig?.stats?.satisfactionLabelAr || 'نسبة رضا الطلبة'
              : dynamicConfig?.stats?.satisfactionLabelFr || 'Taux de Satisfaction'}
          </div>
        </div>
      </div>
    </section>
  );
};
