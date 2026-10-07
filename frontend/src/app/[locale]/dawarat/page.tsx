'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Star, Video, Lock, Check, Loader2, Sparkles, X, Clock, User, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { usePlatformStore, PlatformCourse } from '@/lib/platformStore';
import { useAuthStore } from '@/lib/store';
import { useAuthModal } from '@/lib/authModalContext';
import { formatDZD } from '@/lib/format';
import { ContactActionModal, ContactModalOperation } from '@/components/shared/ContactActionModal';

const THEME_BG: Record<string, string> = {
  lime: 'from-lime-500/20 to-transparent text-lime-600 dark:text-lime-400',
  gold: 'from-amber-500/20 to-transparent text-amber-600 dark:text-amber-400',
  sky: 'from-sky-500/20 to-transparent text-sky-600 dark:text-sky-400',
  violet: 'from-violet-500/20 to-transparent text-violet-600 dark:text-violet-400',
  rose: 'from-rose-500/20 to-transparent text-rose-600 dark:text-rose-400',
};

type Track = 'ALL' | 'BAC' | 'UNIVERSITY_LMD' | 'MEDICAL';
const VALID_TRACKS: Track[] = ['BAC', 'UNIVERSITY_LMD', 'MEDICAL'];

export default function DawaratCatalogPage() {
  const { locale, isRtl } = useTranslation();
  const { currentUser } = useAuthStore();
  const { openAuth } = useAuthModal();
  const { courses, loaded } = usePlatformStore();
  const searchParams = useSearchParams();

  const isStudent = currentUser?.role === 'STUDENT_FREE' || currentUser?.role === 'STUDENT_PAID';
  const lockedTrack = isStudent && currentUser?.track ? (currentUser.track as Track) : null;

  const urlTrack = searchParams.get('track') as Track | null;
  const [filter, setFilter] = useState<Track>(
    lockedTrack || (urlTrack && VALID_TRACKS.includes(urlTrack) ? urlTrack : 'ALL')
  );

  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<PlatformCourse | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [contactOperation, setContactOperation] = useState<ContactModalOperation | null>(null);

  useEffect(() => {
    if (lockedTrack) setFilter(lockedTrack);
  }, [lockedTrack]);

  useEffect(() => {
    // Enrollments exist for students only; other roles would just get a 403.
    if (isStudent) {
      fetch('/api/enrollments')
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          if (Array.isArray(data)) {
            setEnrolledIds(data.map((e: any) => e.courseId));
          }
        })
        .catch(() => {});
    }
  }, [isStudent]);

  const handleEnroll = (c: PlatformCourse, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      openAuth('login');
      return;
    }
    if (enrolledIds.includes(c.id)) return;

    setSelectedCourse(null);
    setContactOperation({
      type: 'COURSE_ENROLLMENT',
      title: locale === 'ar' ? `دورة: ${c.titleAr}` : `Cours: ${c.titleFr || c.titleAr}`,
      details: `Course ID: ${c.id} | Formateur: ${c.teacherName} | ${c.category}`,
      amountDzd: c.priceDzd ?? 0,
      targetId: c.id,
      user: {
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone || undefined,
        wilayaName: currentUser.wilayaName || undefined,
      },
    });
  };

  const filtered = filter === 'ALL' ? courses : courses.filter((c) => c.category === filter);

  return (
    <div className="py-6 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 font-arabic" data-testid="dawarat-catalog-page">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-2xl flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Video className="w-6 h-6 text-lime-500" />
            <span>{locale === 'ar' ? 'دورات الامتياز (Live)' : 'Dawarat Excellence (Live)'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            {locale === 'ar'
              ? 'كل المقررات المباشرة عبر الوطن، تتحدث فورياً بمجرد نشرها من الأستاذ.'
              : 'Tous les cours live, synchronisés instantanément à la publication.'}
          </p>
        </div>

        {/* Filter Tabs */}
        {lockedTrack ? (
          <div
            data-testid="dawarat-track-locked-badge"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-lime-400/10 border border-lime-400/30 text-lime-700 dark:text-lime-300 text-[11px] font-bold shrink-0"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{locale === 'ar' ? `مقررات مسارك: ${lockedTrack}` : `Votre filière: ${lockedTrack}`}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar" data-testid="dawarat-filters">
            {(['ALL', 'BAC', 'UNIVERSITY_LMD', 'MEDICAL'] as const).map((f) => (
              <button
                key={f}
                data-testid={`dawarat-filter-${f}`}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                  filter === f ? 'bg-slate-950 dark:bg-lime-400 text-white dark:text-slate-950 shadow-sm' : 'text-slate-600 dark:text-gray-400'
                }`}
              >
                {f === 'ALL' ? (locale === 'ar' ? 'الكل' : 'Tous') : f}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="dawarat-grid">
        {filtered.map((c, idx) => {
          const isEnrolled = enrolledIds.includes(c.id);
          const isEnrolling = enrollingId === c.id;

          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              data-testid={`dawarat-card-${c.id}`}
              onClick={() => setSelectedCourse(c)}
              className="p-5 rounded-3xl bg-white dark:bg-[#0C1428] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-gold-500/40 hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className={`h-24 rounded-2xl bg-gradient-to-br ${THEME_BG[c.colorTheme] || THEME_BG.lime} flex items-center justify-center mb-3.5 relative overflow-hidden`}>
                  {c.isLive && (
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      LIVE
                    </span>
                  )}
                  <span className="text-3xl font-black">{(c.titleFr || c.titleAr).charAt(0)}</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug line-clamp-2">
                  {locale === 'ar' ? c.titleAr : c.titleFr || c.titleAr}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-1">{c.teacherName}</p>

                <div className="flex items-center justify-between mt-3">
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    {c.rating.toFixed(1)}
                  </span>
                  <span className="text-xs font-mono font-black text-lime-600 dark:text-lime-400">
                    {formatDZD(c.priceDzd, locale)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{c.lessonsCount} {locale === 'ar' ? 'حصة مسجلة وتفاعلية' : 'leçons'}</p>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCourse(c);
                  }}
                  className="px-3 py-2 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  {locale === 'ar' ? 'التفاصيل' : 'Détails'}
                </button>

                <button
                  type="button"
                  disabled={isEnrolled || isEnrolling}
                  onClick={(e) => handleEnroll(c, e)}
                  data-testid={`enroll-btn-${c.id}`}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm ${
                    isEnrolled
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                      : 'bg-lime-400 hover:bg-lime-300 text-slate-950 active:scale-95'
                  }`}
                >
                  {isEnrolling ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isEnrolled ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{locale === 'ar' ? 'مسجل بالفعل' : 'Inscrit'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{locale === 'ar' ? 'تسجيل في الدورة' : "S'inscrire"}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
        {loaded && filtered.length === 0 && (
          <p className="text-xs text-slate-400 py-10 text-center sm:col-span-3">
            {locale === 'ar' ? 'لا توجد دورات في هذا التصنيف حالياً.' : 'Aucun cours dans cette catégorie.'}
          </p>
        )}
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0C1428] border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl relative text-slate-900 dark:text-white">
            <button
              onClick={() => setSelectedCourse(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-lime-400/20 text-lime-700 dark:text-lime-300 text-[10px] font-black">
                {selectedCourse.category}
              </span>
              {selectedCourse.isLive && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black">
                  LIVE 2026
                </span>
              )}
            </div>

            <h3 className="text-lg font-black leading-snug">
              {locale === 'ar' ? selectedCourse.titleAr : selectedCourse.titleFr || selectedCourse.titleAr}
            </h3>

            <div className="space-y-2 text-xs text-slate-600 dark:text-gray-300 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gold-500 shrink-0" />
                <span>{locale === 'ar' ? 'الأستاذ المكوّن:' : 'Formateur:'} <strong>{selectedCourse.teacherName}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gold-500 shrink-0" />
                <span>{selectedCourse.lessonsCount} {locale === 'ar' ? 'محاضرة وورشة تطبيقية مع ملفات PDF' : 'cours & ateliers avec PDF'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold-500 shrink-0" />
                <span>{locale === 'ar' ? 'وصول مفتوح على مدار 24/7 طيلة السنة الدراسية' : "Accès illimité 24/7 durant toute l'année"}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">{locale === 'ar' ? 'الاشتراك الكامل' : 'Prix total'}</span>
                <span className="text-base font-black text-lime-600 dark:text-lime-400 font-mono">
                  {formatDZD(selectedCourse.priceDzd, locale)}
                </span>
              </div>

              <button
                type="button"
                disabled={enrolledIds.includes(selectedCourse.id) || enrollingId === selectedCourse.id}
                onClick={(e) => handleEnroll(selectedCourse, e)}
                className={`px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-sm ${
                  enrolledIds.includes(selectedCourse.id)
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-lime-400 hover:bg-lime-300 text-slate-950 active:scale-95'
                }`}
              >
                {enrolledIds.includes(selectedCourse.id) ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'أنت مسجل بالفعل في الدورة' : 'Déjà Inscrit'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'تأكيد التسجيل الآن' : "S'inscrire Maintenant"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {contactOperation && (
        <ContactActionModal
          isOpen={Boolean(contactOperation)}
          onClose={() => setContactOperation(null)}
          operation={contactOperation}
        />
      )}
    </div>
  );
}
