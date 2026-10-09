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

const FEATURED_COURSES: CourseItem[] = [];

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
        if (data?.landingConfig) {
          setDynamicConfig(data.landingConfig);
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

  const st = dynamicConfig?.stats;
  const autoStats = st?.mode === 'AUTO' && !!realStats;
  const arL = locale === 'ar';
  const num = (n: unknown) => (Number(n) > 0 ? Number(n).toLocaleString() : '');
  const stats = [
    { k: 'exams', v: autoStats ? num(realStats?.examsCount) : st?.examsValue || '', l: arL ? st?.examsLabelAr || 'موضوع امتحان محلول' : st?.examsLabelFr || 'Annales Corrigées' },
    { k: 'students', v: autoStats ? num(realStats?.studentsCount) : st?.studentsValue || '', l: arL ? st?.studentsLabelAr || 'طالب نشط بالمنصة' : st?.studentsLabelFr || 'Étudiants Actifs' },
    { k: 'wilayas', v: autoStats ? num(realStats?.wilayasCount) : st?.wilayasValue || '', l: arL ? st?.wilayasLabelAr || 'ولاية مغطاة بالسفراء' : st?.wilayasLabelFr || 'Wilayas Couvertes' },
    { k: 'sat', v: autoStats ? (realStats?.satisfactionRate ? `${realStats.satisfactionRate}%` : '') : st?.satisfactionValue || '', l: arL ? st?.satisfactionLabelAr || 'نسبة رضا الطلبة' : st?.satisfactionLabelFr || 'Taux de Satisfaction' },
  ].filter((x) => x.v);

  return (
    <section id="courses-explorer" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-12 sm:space-y-16 font-arabic scroll-mt-24" data-testid="course-topic-explorer">
      {/* ================= 1. CATEGORY PILLS FILTER (Learnova style) ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
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
                    ? 'bg-gold-500 text-navy-950 shadow-md font-black'
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
      {filteredCourses.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-gray-400">
          {locale === 'ar' ? 'ستظهر الدورات هنا قريباً.' : 'Les cours seront bientôt affichés ici.'}
        </p>
      )}
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
              className="group relative rounded-3xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-gold-500/25 p-4 sm:p-5 flex flex-col justify-between hover:border-gold-500/60 dark:hover:border-gold-400 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div>
                {/* Course Card Thumbnail Image (Learnova Style) */}
                <div className="relative w-full h-36 sm:h-40 rounded-2xl overflow-hidden mb-3.5 bg-slate-100 dark:bg-navy-950">
                  <img
                    src={course.thumbnailUrl}
                    alt={locale === 'ar' ? course.titleAr : course.titleFr}
                    className="w-full h-full object-cover group- transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5 rtl:left-auto rtl:right-2.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border shadow-sm ${course.badgeColor}`}>
                      {course.badge}
                    </span>
                  </div>
                  <div className="absolute bottom-2 right-2 rtl:right-auto rtl:left-2 px-2 py-0.5 rounded-md bg-black/60 text-[10px] text-white font-mono">
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
                  {course.reviewsCount >= 3 && course.rating > 0 ? (
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{course.rating}</span>
                      <span className="text-slate-400 font-normal">({course.reviewsCount})</span>
                    </div>
                  ) : (
                    <span />
                  )}
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
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
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
            className="group relative rounded-3xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-gold-500/30 p-6 flex flex-col justify-between shadow-sm hover:border-gold-500 transition-all"
          >
            <div className="space-y-2 relative z-10">
              <div className="text-sapphire-600 dark:text-sapphire-400">
                <Bot className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white mt-3">
                {locale === 'ar' ? 'مساعد الامتحانات والملخصات' : 'Assistant examens & résumés'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                {locale === 'ar'
                  ? 'اختر جامعتك، كليتك، وتخصصك لتصل فوراً لملخصات الدروس والامتحانات المحلولة.'
                  : 'Arborescence intelligente menant à vos annales officielles et résumés.'}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-black text-sapphire-600 dark:text-sapphire-400 group-hover:gap-3 transition-all">
              <span>{locale === 'ar' ? 'افتح المساعد' : "Ouvrir l'assistant"}</span>
              <span>→</span>
            </div>
          </Link>

          {/* Tile 2: Live Excellence Dawarat */}
          <Link
            href={`/${locale}/dawarat`}
            className="group relative rounded-3xl bg-gold-500 text-navy-950 p-6 flex flex-col justify-between overflow-hidden shadow-lg transition-transform"
          >
            <div className="space-y-2 relative z-10">
              <div className="text-navy-950">
                <Video className="w-6 h-6 text-navy-950" />
              </div>
              <h4 className="text-base font-black text-navy-950 mt-3">
                {locale === 'ar' ? 'حصص البث المباشر (Dawarat Live)' : 'Sessions en Direct Live'}
              </h4>
              <p className="text-xs text-navy-950/80 leading-relaxed font-semibold">
                {locale === 'ar'
                  ? 'محاضرات تفاعلية أسبوعية مع أساتذة المنصة عبر Google Meet ومتابعة يومية.'
                  : 'Cours interactifs en temps réel avec des enseignants certifiés.'}
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
            className="group relative rounded-3xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-gold-500/30 p-6 flex flex-col justify-between shadow-sm hover:border-gold-500 transition-all"
          >
            <div className="space-y-2">
              <div className="text-sapphire-600 dark:text-sapphire-400">
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
            <div className="mt-6 flex items-center gap-2 text-xs font-black text-sapphire-600 dark:text-sapphire-400 group-hover:gap-3 transition-all">
              <span>{locale === 'ar' ? 'استعراض الصدارة' : 'Voir le Palmarès'}</span>
              <span>→</span>
            </div>
          </Link>

          {/* Tile 4: 58 Wilayas Ambassador Network */}
          <Link
            href={`/${locale}/ambassadors`}
            className="group relative rounded-3xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-gold-500/30 p-6 flex flex-col justify-between shadow-sm hover:border-gold-500 transition-all"
          >
            <div className="space-y-2">
              <div className="text-sapphire-600 dark:text-sapphire-400">
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
            <div className="mt-6 flex items-center gap-2 text-xs font-black text-sapphire-600 dark:text-sapphire-400 group-hover:gap-3 transition-all">
              <span>{locale === 'ar' ? 'دليل السفراء' : 'Trouver un Ambassadeur'}</span>
              <span>→</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Real figures only: each stat, and the whole strip, stays hidden until a real value exists. */}
      {stats.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-[#0b0b0d] border border-slate-200 dark:border-white/10 p-6 sm:p-8 flex flex-wrap justify-around gap-6 text-center">
          {stats.map((x) => (
            <div key={x.k} className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-gold-600 dark:text-gold-300 font-mono">{x.v}</div>
              <div className="text-xs text-slate-600 dark:text-gray-400 font-semibold">{x.l}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
