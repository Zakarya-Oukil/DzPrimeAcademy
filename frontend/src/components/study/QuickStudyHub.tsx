'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  BookOpen,
  Download,
  Eye,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  CheckCircle2,
  Lock,
  Share2,
  Filter,
  FileText,
  Clock,
  Layers,
  GraduationCap,
  Award,
  Zap,
  Building2,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExamItem, TrackType, ModuleItem } from '@/types';
import { MODULES, INSTITUTIONS } from '@/lib/initial-data';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/store';
import { isGoldenMember } from '@/lib/rbac';
import { UpgradeModal } from '../shared/UpgradeModal';

interface QuickStudyHubProps {
  initialTrack?: TrackType;
}

export const QuickStudyHub: React.FC<QuickStudyHubProps> = ({ initialTrack }) => {
  const { t, locale, isRtl } = useTranslation();
  const { currentUser } = useAuthStore();
  const isGold = isGoldenMember(currentUser);

  // Exams come from the server: it applies the tier rule and signs private file links (they expire after 5 minutes).
  const [exams, setExams] = useState<ExamItem[]>([]);
  useEffect(() => {
    fetch('/api/exams')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && Array.isArray(d.exams)) setExams(d.exams); })
      .catch(() => {});
  }, [currentUser?.id, currentUser?.role]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<TrackType | 'ALL'>(initialTrack || 'ALL');
  const isTrackLocked = !!initialTrack;
  const [selectedModuleId, setSelectedModuleId] = useState<string | 'ALL'>('ALL');
  const [selectedTermType, setSelectedTermType] = useState<'ALL' | 'MIDTERM_EMD' | 'FINAL_SEMESTRIAL' | 'RATTRAPAGE'>('ALL');
  
  // Modals & Trays
  const [activePreviewExam, setActivePreviewExam] = useState<ExamItem | null>(null);
  const [previewTab, setPreviewTab] = useState<'questions' | 'solution'>('questions');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [bookmarkedExamIds, setBookmarkedExamIds] = useState<string[]>([]);
  const [showStudyBag, setShowStudyBag] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleBookmark = (exam: ExamItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedExamIds((prev) => {
      const exists = prev.includes(exam.id);
      if (exists) {
        showToast(locale === 'ar' ? 'تمت إزالة الموضوع من الحقيبة' : 'Retiré du sac d\'études');
        return prev.filter((id) => id !== exam.id);
      } else {
        // Confetti effect on save
        try {
          confetti({
            particleCount: 25,
            spread: 40,
            origin: { y: 0.85 },
            colors: ['#f2aa34', '#6db1d8', '#0880f0'],
          });
        } catch (err) {}

        showToast(locale === 'ar' ? 'تم حفظ الموضوع في حقيبتك الدراسية ' : 'Ajouté à votre sac d\'études ');
        return [...prev, exam.id];
      }
    });
  };

  const handleShare = (exam: ExamItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(
        `${window.location.origin}/${locale}?exam=${exam.id}`
      );
      showToast(locale === 'ar' ? 'تم نسخ رابط الموضوع بنجاح ' : 'Lien copié dans le presse-papiers ');
    }
  };

  // Filter available modules based on selected track
  const availableModules = useMemo(() => {
    if (selectedTrack === 'ALL') return MODULES;
    if (selectedTrack === 'BAC') {
      return MODULES.filter((m) => m.code.startsWith('BAC'));
    }
    if (selectedTrack === 'MEDICAL') {
      return MODULES.filter((m) => m.code.startsWith('MED'));
    }
    return MODULES.filter((m) => !m.code.startsWith('BAC') && !m.code.startsWith('MED'));
  }, [selectedTrack]);

  // Filter exams based on all criteria
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = exam.title.toLowerCase().includes(q);
        const matchesModule = exam.moduleName?.toLowerCase().includes(q);
        const matchesAuthor = exam.authorName?.toLowerCase().includes(q);
        const matchesSnippet = exam.previewQuestionSnippet?.toLowerCase().includes(q);
        const matchesInst = exam.institutionName?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesModule && !matchesAuthor && !matchesSnippet && !matchesInst) {
          return false;
        }
      }

      // Track filter
      if (selectedTrack !== 'ALL' && exam.trackType) {
        if (exam.trackType !== selectedTrack) return false;
      }

      // Module filter
      if (selectedModuleId !== 'ALL') {
        if (exam.moduleId !== selectedModuleId) return false;
      }

      // Term type filter
      if (selectedTermType !== 'ALL') {
        if (exam.termType !== selectedTermType) return false;
      }

      return true;
    });
  }, [exams, searchQuery, selectedTrack, selectedModuleId, selectedTermType]);

  const bookmarkedExams = useMemo(() => {
    return exams.filter((ex) => bookmarkedExamIds.includes(ex.id));
  }, [exams, bookmarkedExamIds]);

  const trackTabs = [
    { id: 'ALL', labelAr: 'الكل (جميع الشعب)', labelFr: 'Tous les niveaux', count: exams.length },
    { id: 'UNIVERSITY_LMD', labelAr: 'الإعلام الآلي والرياضيات (L1/L2)', labelFr: 'Informatique & Maths LMD', count: exams.filter((e) => e.trackType === 'UNIVERSITY_LMD').length },
    { id: 'BAC', labelAr: 'البكالوريا الوطنية (3AS BAC)', labelFr: 'Baccalauréat Algérien', count: exams.filter((e) => e.trackType === 'BAC').length },
    { id: 'MEDICAL', labelAr: 'العلوم الطبية والصيدلة', labelFr: 'Médecine & Santé', count: exams.filter((e) => e.trackType === 'MEDICAL').length },
  ];

  return (
    <div className="w-full space-y-6 select-none font-arabic">
      {/* ================= HERO SEARCH & 1-CLICK FAST BAR ================= */}
      <div className="relative p-5 sm:p-7 rounded-3xl bg-slate-900 border border-gold-500/30 text-white shadow-xl overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-gold-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 border border-gold-500/40 text-gold-300 text-[11px] font-bold">
              <Zap className="w-3.5 h-3.5 text-gold-400 " />
              <span>{locale === 'ar' ? 'البحث الذكي المباشر بدون تعقيد' : 'Accès Direct en 1 Clic'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{locale === 'ar' ? 'بنك الامتحانات والمقررات السريع' : 'Banque d\'Examens & Sujets Corrigés'}</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              {locale === 'ar'
                ? 'ابحث فوراً بالاسم، الأستاذ، الجامعة، أو الشعبة وافتح الموضوع والحل النموذجي بضغطة واحدة.'
                : 'Accédez instantanément aux annales corrigées, QCM et barèmes validés par les enseignants universitaires.'}
            </p>
          </div>

          {/* Quick Study Bag Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowStudyBag(!showStudyBag)}
              className={`px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                bookmarkedExamIds.length > 0
                  ? 'bg-gold-500 text-navy-950 border-gold-400 shadow-gold-glow font-black'
                  : 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>{locale === 'ar' ? 'حقيبتي الدراسية' : 'Mon Sac d\'Études'}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[11px] font-mono">
                {bookmarkedExamIds.length}
              </span>
            </button>
          </div>
        </div>

        {/* Live Search Input */}
        <div className="mt-5 relative">
          <Search className="w-5 h-5 text-gold-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              locale === 'ar'
                ? 'ابحث بالكلمة المفتاحية: مثل Analyse 1، Algorithmique، BAC Maths، USTHB، USTO، Dr. Kadri...'
                : 'Rechercher par mot-clé: Analyse 1, Algorithmique, BAC 2024, USTHB, USTO...'
            }
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white/10 dark:bg-black/40 border border-white/20 focus:border-gold-400 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all font-arabic"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/20 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 1-Click Fast Track Tabs */}
        {isTrackLocked ? (
          <div data-testid="study-hub-track-locked-badge" className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-lime-400/15 border border-lime-400/40 text-lime-300 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>{locale === 'ar' ? `مقررات مسارك: ${initialTrack}` : `Votre filière: ${initialTrack}`}</span>
          </div>
        ) : (
        <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {trackTabs.map((tab) => {
            const active = selectedTrack === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedTrack(tab.id as any);
                  setSelectedModuleId('ALL');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                  active
                    ? 'bg-gold-500 text-navy-950 font-black shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 hover:border-gold-500/40'
                }`}
              >
                <span>{locale === 'ar' ? tab.labelAr : tab.labelFr}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${active ? 'bg-black/20' : 'bg-white/10 text-gray-400'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
        )}
      </div>

      {/* ================= 1-CLICK MODULE CHIPS ================= */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setSelectedModuleId('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            selectedModuleId === 'ALL'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black shadow-sm'
              : 'bg-white dark:bg-navy-900 border border-slate-200 dark:border-gray-800 text-slate-700 dark:text-gray-300 hover:border-gold-500'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{locale === 'ar' ? 'جميع المقاييس' : 'Tous les modules'}</span>
        </button>

        {availableModules.map((mod) => {
          const isSelected = selectedModuleId === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => setSelectedModuleId(mod.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black shadow-sm'
                  : 'bg-white dark:bg-navy-900 border border-slate-200 dark:border-gray-800 text-slate-700 dark:text-gray-300 hover:border-gold-500'
              }`}
            >
              <span>{locale === 'ar' ? mod.nameAr : mod.nameFr}</span>
              {mod.examsCount && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isSelected ? 'bg-white/20 dark:bg-black/20' : 'bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-gray-400'}`}>
                  {mod.examsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================= TERM / EXAM TYPE FILTERS & RESULTS BAR ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500 dark:text-gray-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>{locale === 'ar' ? 'نوع الدورة:' : 'Session:'}</span>
          </span>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-navy-900 p-1 rounded-xl border border-slate-200 dark:border-gray-800">
            {[
              { id: 'ALL', labelAr: 'الكل', labelFr: 'Toutes' },
              { id: 'MIDTERM_EMD', labelAr: 'EMD 1 / تقييم', labelFr: 'EMD / Contrôle' },
              { id: 'FINAL_SEMESTRIAL', labelAr: 'امتحان شامل', labelFr: 'Final' },
              { id: 'RATTRAPAGE', labelAr: 'استدراك', labelFr: 'Rattrapage' },
            ].map((term) => (
              <button
                key={term.id}
                onClick={() => setSelectedTermType(term.id as any)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
                  selectedTermType === term.id
                    ? 'bg-white dark:bg-navy-800 text-slate-900 dark:text-white shadow-sm font-extrabold'
                    : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {locale === 'ar' ? term.labelAr : term.labelFr}
              </button>
            ))}
          </div>
        </div>

        <div className="text-slate-500 dark:text-gray-400 font-bold">
          <span>{filteredExams.length} {locale === 'ar' ? 'مواضيع متوفرة' : 'sujets trouvés'}</span>
        </div>
      </div>

      {/* ================= STUDY BAG QUICK TRAY (IF OPEN) ================= */}
      <AnimatePresence>
        {showStudyBag && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 dark:bg-gold-500/10 border border-gold-500/40 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-gold-600 dark:text-gold-400" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {locale === 'ar' ? 'حقيبتي الدراسية (المواضيع المحفوظة للمراجعة)' : 'Mon Sac d\'Études Personnalisé'}
                </h3>
              </div>
              <button
                onClick={() => setShowStudyBag(false)}
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {bookmarkedExams.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {locale === 'ar'
                  ? 'لم تقم بحفظ أي مواضيع بعد. انقر على أيقونة الإشارة المرجعية () على أي امتحان لحفظه هنا للمراجعة السريعة.'
                  : 'Aucun sujet dans votre sac. Cliquez sur l\'icône de marque-page pour épingler vos révisions ici.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {bookmarkedExams.map((ex) => (
                  <div
                    key={ex.id}
                    className="p-3 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-gray-800 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {ex.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-gray-400 font-mono">
                        {ex.moduleName} • {ex.year}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setActivePreviewExam(ex)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-gold-500/20 text-slate-700 dark:text-gold-300 transition-all"
                        title="Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => toggleBookmark(ex, e)}
                        className="p-1.5 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-600 hover:bg-red-200 transition-all"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= EXAMS GRID (1-CLICK ACCESS) ================= */}
      {filteredExams.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-gray-800 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto opacity-50" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            {locale === 'ar' ? 'لم يتم العثور على مواضيع مطابقة للبحث' : 'Aucun examen trouvé'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-gray-400 max-w-sm mx-auto">
            {locale === 'ar'
              ? 'جرب تغيير كلمة البحث أو اختيار شعبة أخرى كالإعلام الآلي أو البكالوريا.'
              : 'Essayez d\'élargir vos filtres de recherche ou de sélectionner une autre filière.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTrack('ALL');
              setSelectedModuleId('ALL');
              setSelectedTermType('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-all"
          >
            {locale === 'ar' ? 'إعادة ضبط الفلاتر' : 'Réinitialiser les filtres'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredExams.map((exam) => {
            const isBookmarked = bookmarkedExamIds.includes(exam.id);
            const isLocked = exam.isLocked ?? (!exam.isFreeSample && !isGold);

            return (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-slate-800/90 hover:border-gold-500/60 dark:hover:border-gold-500/60 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-gray-800 text-slate-800 dark:text-gold-300 text-[11px] font-black font-mono">
                        {exam.year}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        {exam.termType === 'MIDTERM_EMD'
                          ? 'EMD 1'
                          : exam.termType === 'FINAL_SEMESTRIAL'
                          ? 'Final'
                          : 'Rattrapage'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleShare(exam, e)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-all"
                        title="Share"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => toggleBookmark(exam, e)}
                        className={`p-1.5 rounded-xl transition-all ${
                          isBookmarked
                            ? 'bg-amber-500/20 text-amber-500'
                            : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-navy-800'
                        }`}
                        title="Save to Study Bag"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug group-hover:text-gold-600 dark:group-hover:text-gold-300 transition-colors line-clamp-2">
                    {exam.title}
                  </h3>

                  <p className="text-[11px] font-bold text-slate-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-lime-600 dark:text-gold-400" />
                    <span>{exam.moduleName}</span>
                    <span>•</span>
                    <span className="truncate">{exam.institutionName || 'Université'}</span>
                  </p>

                  {/* Question Snippet Preview */}
                  {exam.previewQuestionSnippet && (
                    <div className="mt-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                      {exam.previewQuestionSnippet}
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-gray-400 font-mono">
                    <Download className="w-3 h-3" />
                    <span>{exam.downloadsCount}</span>
                    {exam.solutionUrl && (
                      <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{locale === 'ar' ? 'محلول' : 'Corrigé'}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* 1-Click Direct Preview */}
                    <button
                      onClick={() => setActivePreviewExam(exam)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-800 dark:text-white text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{locale === 'ar' ? 'معاينة' : 'Aperçu'}</span>
                    </button>

                    {/* Download Button */}
                    {isLocked ? (
                      <button
                        onClick={() => setIsUpgradeModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-gold-500 text-navy-950 text-xs font-black flex items-center gap-1 shadow-sm hover:scale-105 transition-all"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>VIP</span>
                      </button>
                    ) : (
                      <a
                        href={exam.fileUrl}
                        download
                        onClick={(e) => {
                          showToast(locale === 'ar' ? 'جاري تحميل الموضوع...' : 'Téléchargement en cours...');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-gray-100 text-white dark:text-slate-900 text-xs font-black flex items-center gap-1 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{locale === 'ar' ? 'تحميل' : 'PDF'}</span>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ================= RICH PDF PREVIEW MODAL ================= */}
      <AnimatePresence>
        {activePreviewExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePreviewExam(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-gold-500/40 p-5 sm:p-7 shadow-2xl text-left font-arabic z-10 space-y-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-gold-500/20 border border-gold-500/40 text-gold-700 dark:text-gold-300 text-xs font-mono font-bold">
                      {activePreviewExam.year} • {activePreviewExam.termType}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-gray-400">
                      {activePreviewExam.moduleName}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                    {activePreviewExam.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                    {activePreviewExam.institutionName} • {activePreviewExam.authorName}
                  </p>
                </div>

                <button
                  onClick={() => setActivePreviewExam(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-600 dark:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Toggle Questions vs Solutions */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-navy-900 p-1 rounded-2xl border border-slate-200 dark:border-gray-800">
                <button
                  onClick={() => setPreviewTab('questions')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    previewTab === 'questions'
                      ? 'bg-white dark:bg-navy-800 text-slate-900 dark:text-white shadow-sm font-extrabold'
                      : 'text-slate-600 dark:text-gray-400'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{locale === 'ar' ? 'نص موضوع الامتحان' : 'Sujet d\'Examen'}</span>
                </button>

                <button
                  onClick={() => setPreviewTab('solution')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    previewTab === 'solution'
                      ? 'bg-white dark:bg-navy-800 text-slate-900 dark:text-white shadow-sm font-extrabold'
                      : 'text-slate-600 dark:text-gray-400'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{locale === 'ar' ? 'الحل النموذجي المعتمد' : 'Corrigé Type Officiel'}</span>
                </button>
              </div>

              {/* Content Panel */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                {previewTab === 'questions' ? (
                  <div className="space-y-3 text-xs leading-relaxed text-slate-800 dark:text-gray-200">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span>{locale === 'ar' ? 'المدة: ساعتان (02h00)' : 'Durée: 02h00'}</span>
                      <span>{locale === 'ar' ? 'المعامل: 4' : 'Coefficient: 4'}</span>
                      <span>{locale === 'ar' ? 'الدورة: رسمية' : 'Session: Normale'}</span>
                    </div>
                    <p className="font-semibold">
                      {activePreviewExam.previewQuestionSnippet ||
                        (locale === 'ar'
                          ? 'يتضمن الموضوع 3 تمارين تطبيقية شاملة للمقرر الدراسي مع مسألة إدماجية موجهة.'
                          : 'Sujet complet comportant 3 exercices pratiques et un problème de synthèse.')}
                    </p>
                    <div className="p-3 rounded-xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-gray-700 text-[11px] text-slate-600 dark:text-gray-300">
                      <strong>{locale === 'ar' ? 'توجيه بيداغوجي:' : 'Conseil de révision:'}</strong>{' '}
                      {locale === 'ar'
                        ? 'ينصح بحل الموضوع في ظروف الامتحان التجريبي قبل الاطلاع على نموذج الإجابة وسلم التنقيط.'
                        : 'Travaillez le sujet en temps limité avant de consulter le corrigé détaillé.'}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs leading-relaxed text-slate-800 dark:text-gray-200">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{locale === 'ar' ? 'حل نموذجي مصادق عليه من الأستاذ المشرف' : 'Solution certifiée par l\'équipe pédagogique'}</span>
                    </div>

                    <p className="font-medium">
                      {activePreviewExam.solutionSummary ||
                        (locale === 'ar'
                          ? 'شرح تفصيلي خطوة بخطوة لجميع خطوات الحل وسلم التنقيط الوزاري.'
                          : 'Corrigé pas à pas avec barème détaillé point par point.')}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={(e) => toggleBookmark(activePreviewExam, e)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-800 dark:text-white text-xs font-bold flex items-center gap-2 transition-all w-full sm:w-auto justify-center"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>
                    {bookmarkedExamIds.includes(activePreviewExam.id)
                      ? (locale === 'ar' ? 'محفوظ في الحقيبة ✓' : 'Dans votre sac ✓')
                      : (locale === 'ar' ? 'حفظ في حقيبتي' : 'Ajouter au sac')}
                  </span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {(activePreviewExam.isLocked ?? (!activePreviewExam.isFreeSample && !isGold)) ? (
                    <button
                      onClick={() => {
                        setActivePreviewExam(null);
                        setIsUpgradeModalOpen(true);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-gold-500 text-navy-950 font-black text-xs shadow-gold-glow flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{locale === 'ar' ? 'ترقية للتحميل الكامل (VIP)' : 'Débloquer en VIP'}</span>
                    </button>
                  ) : (
                    <a
                      href={previewTab === 'questions' ? activePreviewExam.fileUrl : activePreviewExam.solutionUrl || activePreviewExam.fileUrl}
                      download
                      onClick={() => {
                        showToast(locale === 'ar' ? 'جاري تحميل الملف...' : 'Téléchargement...');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all w-full sm:w-auto"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        {previewTab === 'questions'
                          ? (locale === 'ar' ? 'تحميل نص الموضوع PDF' : 'Télécharger Sujet PDF')
                          : (locale === 'ar' ? 'تحميل الحل النموذجي PDF' : 'Télécharger Corrigé PDF')}
                      </span>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= UPGRADE MODAL ================= */}
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />

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
