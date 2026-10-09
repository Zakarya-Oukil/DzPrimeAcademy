'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  BookOpen,
  Building2,
  Calendar,
  Layers,
  FileText,
  Lock,
  Download,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Award,
  Search,
} from 'lucide-react';
import {
  BotStep,
  BotSelectionState,
  TrackType,
  ExamItem,
} from '@/types';
import {
  WILAYAS,
  INSTITUTIONS,
  FACULTIES,
  SPECIALTIES,
  ACADEMIC_YEARS,
  MODULES,
  EXAMS,
  getLocalizedItemName,
  getLocalizedWilayaName,
} from '@/lib/initial-data';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/store';
import { isGoldenMember } from '@/lib/rbac';
import { UpgradeModal } from '../shared/UpgradeModal';

interface DecisionTreeBotProps {
  isFloating?: boolean;
}

export const DecisionTreeBot: React.FC<DecisionTreeBotProps> = ({ isFloating = false }) => {
  const { t, locale, isRtl } = useTranslation();
  const { currentUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<BotStep>('TRACK');
  const [selection, setSelection] = useState<BotSelectionState>({});
  const [finalTab, setFinalTab] = useState<'SUMMARIES' | 'EXAMS'>('SUMMARIES');
  const [examFilter, setExamFilter] = useState<'ALL' | 'MIDTERM_EMD' | 'FINAL_SEMESTRIAL' | 'RATTRAPAGE'>('ALL');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [activePdfPreview, setActivePdfPreview] = useState<ExamItem | null>(null);
  const [activeSummaryPreview, setActiveSummaryPreview] = useState<any | null>(null);

  const isUserGold = isGoldenMember(currentUser);

  // Handlers for step selections
  const handleSelectTrack = (track: TrackType) => {
    setSelection({ track });
    setCurrentStep('WILAYA_OR_UNIV');
  };

  const handleSelectInstitution = (instId: string, instName: string, wilayaCode: number, wilayaName: string) => {
    setSelection((prev) => ({
      ...prev,
      institutionId: instId,
      institutionName: instName,
      wilayaCode,
      wilayaName,
    }));
    setCurrentStep('FACULTY_OR_STREAM');
  };

  const handleSelectFaculty = (facultyId: string, facultyName: string) => {
    setSelection((prev) => ({
      ...prev,
      facultyId,
      facultyName,
    }));
    setCurrentStep('SPECIALTY');
  };

  const handleSelectSpecialty = (specialtyId: string, specialtyName: string) => {
    setSelection((prev) => ({
      ...prev,
      specialtyId,
      specialtyName,
    }));
    setCurrentStep('YEAR_SEMESTER');
  };

  const handleSelectAcademicYear = (yearId: string, yearName: string) => {
    setSelection((prev) => ({
      ...prev,
      academicYearId: yearId,
      academicYearName: yearName,
    }));
    setCurrentStep('MODULE');
  };

  const handleSelectModule = (moduleId: string, moduleName: string) => {
    setSelection((prev) => ({
      ...prev,
      moduleId,
      moduleName,
    }));
    setCurrentStep('EXAMS');
  };

  const handleReset = () => {
    setSelection({});
    setCurrentStep('TRACK');
    setExamFilter('ALL');
  };

  const handleJumpToStep = (step: BotStep) => {
    setCurrentStep(step);
  };

  // Filter available options based on current selections
  const availableInstitutions = INSTITUTIONS.filter((inst) => {
    if (selection.track === 'BAC') return inst.type === 'HIGH_SCHOOL';
    return inst.type === 'UNIVERSITY';
  });

  const availableFaculties = FACULTIES.filter(
    (fac) => fac.institutionId === selection.institutionId
  );

  const availableSpecialties = SPECIALTIES.filter(
    (spec) => spec.facultyId === selection.facultyId
  );

  const availableYears = ACADEMIC_YEARS.filter(
    (year) => year.specialtyId === selection.specialtyId
  );

  const availableModules = MODULES.filter(
    (mod) => mod.academicYearId === selection.academicYearId
  );

  const availableExams = EXAMS.filter(
    (ex) => ex.moduleId === selection.moduleId
  ).filter((ex) => {
    if (examFilter === 'ALL') return true;
    return ex.termType === examFilter;
  });

  const handleApplyPreset = (preset: {
    track: TrackType;
    instId: string;
    instName: string;
    wilayaCode: number;
    wilayaName: string;
    facId: string;
    facName: string;
    specId: string;
    specName: string;
    yearId: string;
    yearName: string;
    modId: string;
    modName: string;
  }) => {
    setSelection({
      track: preset.track,
      institutionId: preset.instId,
      institutionName: preset.instName,
      wilayaCode: preset.wilayaCode,
      wilayaName: preset.wilayaName,
      facultyId: preset.facId,
      facultyName: preset.facName,
      specialtyId: preset.specId,
      specialtyName: preset.specName,
      academicYearId: preset.yearId,
      academicYearName: preset.yearName,
      moduleId: preset.modId,
      moduleName: preset.modName,
    });
    setCurrentStep('EXAMS');
  };

  const quickPresets = [
    {
      nameAr: 'تحليل 1 (USTHB L1 MI)',
      nameFr: 'Analyse 1 (USTHB)',
      track: 'UNIVERSITY_LMD' as TrackType,
      instId: 'inst-usthb',
      instName: 'Université USTHB',
      wilayaCode: 16,
      wilayaName: 'Alger',
      facId: 'fac-usthb-info',
      facName: 'Faculté d\'Informatique',
      specId: 'spec-mi-tc',
      specName: 'Tronc Commun MI',
      yearId: 'year-mi-s1',
      yearName: 'L1 S1',
      modId: 'mod-analyse1',
      modName: 'Analyse 1',
    },
    {
      nameAr: 'خوارزميات ALSD 1 (USTHB)',
      nameFr: 'Algo 1 (ALSD USTHB)',
      track: 'UNIVERSITY_LMD' as TrackType,
      instId: 'inst-usthb',
      instName: 'Université USTHB',
      wilayaCode: 16,
      wilayaName: 'Alger',
      facId: 'fac-usthb-info',
      facName: 'Faculté d\'Informatique',
      specId: 'spec-mi-tc',
      specName: 'Tronc Commun MI',
      yearId: 'year-mi-s1',
      yearName: 'L1 S1',
      modId: 'mod-algo1',
      modName: 'Algorithmique 1',
    },
    {
      nameAr: 'بكالوريا رياضيات (3AS BAC)',
      nameFr: 'Maths BAC (3AS)',
      track: 'BAC' as TrackType,
      instId: 'inst-bac-national',
      instName: 'BAC National',
      wilayaCode: 16,
      wilayaName: 'Alger',
      facId: 'fac-bac-branches',
      facName: 'Filières BAC',
      specId: 'spec-bac-scientifique',
      specName: 'Sciences Expérimentales',
      yearId: 'year-bac-sci-full',
      yearName: '3AS BAC',
      modId: 'mod-bac-math',
      modName: 'Mathématiques BAC',
    },
    {
      nameAr: 'تشريح طب 1 (Médecine Alger)',
      nameFr: 'Anatomie 1 (Médecine Alger)',
      track: 'MEDICAL' as TrackType,
      instId: 'inst-alger1',
      instName: 'Université d\'Alger 1',
      wilayaCode: 16,
      wilayaName: 'Alger',
      facId: 'fac-med-alger',
      facName: 'Faculté de Médecine',
      specId: 'spec-medecine',
      specName: 'Médecine',
      yearId: 'year-med-1',
      yearName: '1ère Année Médecine',
      modId: 'mod-med-anat',
      modName: 'Anatomie',
    },
  ];

  return (
    <div
      className={`w-full ${
        isFloating ? 'max-w-full p-2.5 sm:p-4' : 'max-w-5xl mx-auto p-3.5 sm:p-6 md:p-8 rounded-3xl'
      } border border-slate-200 dark:border-gold-500/30 bg-white/95 dark:bg-navy-900/95 shadow-xl text-slate-900 dark:text-white transition-colors duration-300 relative overflow-hidden`}
    >
      {/* Background highlight */}

      {/* Header with Title & Reset Button */}
      {!isFloating && (
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-slate-200 dark:border-gold-500/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 sm:p-2 rounded-xl bg-gold-500/15 border border-gold-500/40 text-gold-600 dark:text-gold-400">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <h2 className="dark:text-gold-400 text-lg sm:text-2xl font-extrabold font-arabic text-slate-900      ">
                {t('bot.title')}
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-gray-300 mt-1 font-arabic">
              {t('bot.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {currentStep !== 'TRACK' && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-850 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-300 dark:border-gold-500/30 text-slate-700 dark:text-gold-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 touch-target"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('bot.resetFlow')}</span>
              </button>
            )}

            {isUserGold ? (
              <div className="px-3 py-1.5 rounded-xl bg-gold-500/20 border border-gold-500/40 text-gold-700 dark:text-gold-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Award className="w-4 h-4 text-gold-600 dark:text-gold-400" />
                <span>VIP GOLD</span>
              </div>
            ) : (
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="px-3.5 sm:px-4 py-1.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 text-xs font-extrabold flex items-center gap-1.5 shadow-gold-glow transition-all active:scale-95 touch-target"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('nav.upgrade')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1-Click Fast Presets Bar */}
      <div className="relative z-10 my-3 p-3 rounded-2xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <span className="text-[11px] font-bold text-slate-500 dark:text-gray-400 shrink-0">
          {locale === 'ar' ? 'اختصارات سريعة بنقرة واحدة:' : 'Raccourcis 1-Clic:'}
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {quickPresets.map((preset, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleApplyPreset(preset)}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-navy-800 hover:bg-gold-500/20 border border-slate-200 dark:border-gray-700 text-[11px] font-bold text-slate-800 dark:text-gold-300 whitespace-nowrap transition-all active:scale-95"
            >
              {locale === 'ar' ? preset.nameAr : preset.nameFr}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Step Breadcrumbs with Horizontal Mobile Scrolling */}
      <div className="relative z-10 my-3 sm:my-4 flex items-center gap-1.5 text-xs font-arabic overflow-x-auto no-scrollbar py-1 touch-pan-x whitespace-nowrap">
        <button
          onClick={() => handleJumpToStep('TRACK')}
          className={`px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 shrink-0 ${
            currentStep === 'TRACK'
              ? 'bg-gold-500/20 border-gold-500 text-gold-700 dark:text-gold-300 font-bold shadow-sm'
              : selection.track
              ? 'bg-slate-100 dark:bg-navy-850/80 border-slate-300 dark:border-gray-700 text-slate-700 dark:text-gray-300'
              : 'bg-slate-50 dark:bg-navy-950/40 border-transparent text-slate-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[11px] sm:text-xs">
            {selection.track
              ? selection.track === 'BAC'
                ? t('bot.track_bac')
                : t('bot.track_univ')
              : t('bot.step1_title')}
          </span>
        </button>

        {selection.track && (
          <>
            <span className="text-slate-400 dark:text-gray-600 shrink-0">/</span>
            <button
              onClick={() => handleJumpToStep('WILAYA_OR_UNIV')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 shrink-0 ${
                currentStep === 'WILAYA_OR_UNIV'
                  ? 'bg-gold-500/20 border-gold-500 text-gold-700 dark:text-gold-300 font-bold shadow-sm'
                  : selection.institutionName
                  ? 'bg-slate-100 dark:bg-navy-850/80 border-slate-300 dark:border-gray-700 text-slate-700 dark:text-gray-300'
                  : 'bg-slate-50 dark:bg-navy-950/40 border-transparent text-slate-400 dark:text-gray-500'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="max-w-[120px] sm:max-w-[160px] truncate text-[11px] sm:text-xs">
                {selection.institutionName || t('bot.step2_title')}
              </span>
            </button>
          </>
        )}

        {selection.institutionId && (
          <>
            <span className="text-slate-400 dark:text-gray-600">/</span>
            <button
              onClick={() => handleJumpToStep('FACULTY_OR_STREAM')}
              className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 ${
                currentStep === 'FACULTY_OR_STREAM'
                  ? 'bg-gold-500/20 border-gold-500 text-gold-700 dark:text-gold-300 font-bold shadow-sm'
                  : selection.facultyName
                  ? 'bg-slate-100 dark:bg-navy-850/80 border-slate-300 dark:border-gray-700 text-slate-700 dark:text-gray-300'
                  : 'bg-slate-50 dark:bg-navy-950/40 border-transparent text-slate-400 dark:text-gray-500'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="max-w-[130px] truncate">
                {selection.facultyName || t('bot.step3_title')}
              </span>
            </button>
          </>
        )}

        {selection.facultyId && (
          <>
            <span className="text-slate-400 dark:text-gray-600">/</span>
            <button
              onClick={() => handleJumpToStep('SPECIALTY')}
              className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 ${
                currentStep === 'SPECIALTY'
                  ? 'bg-gold-500/20 border-gold-500 text-gold-700 dark:text-gold-300 font-bold shadow-sm'
                  : selection.specialtyName
                  ? 'bg-slate-100 dark:bg-navy-850/80 border-slate-300 dark:border-gray-700 text-slate-700 dark:text-gray-300'
                  : 'bg-slate-50 dark:bg-navy-950/40 border-transparent text-slate-400 dark:text-gray-500'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="max-w-[130px] truncate">
                {selection.specialtyName || t('bot.step4_title')}
              </span>
            </button>
          </>
        )}

        {selection.specialtyId && (
          <>
            <span className="text-slate-400 dark:text-gray-600">/</span>
            <button
              onClick={() => handleJumpToStep('YEAR_SEMESTER')}
              className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 ${
                currentStep === 'YEAR_SEMESTER'
                  ? 'bg-gold-500/20 border-gold-500 text-gold-700 dark:text-gold-300 font-bold shadow-sm'
                  : selection.academicYearName
                  ? 'bg-slate-100 dark:bg-navy-850/80 border-slate-300 dark:border-gray-700 text-slate-700 dark:text-gray-300'
                  : 'bg-slate-50 dark:bg-navy-950/40 border-transparent text-slate-400 dark:text-gray-500'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="max-w-[130px] truncate">
                {selection.academicYearName || t('bot.step5_title')}
              </span>
            </button>
          </>
        )}

        {selection.academicYearId && (
          <>
            <span className="text-slate-400 dark:text-gray-600">/</span>
            <button
              onClick={() => handleJumpToStep('MODULE')}
              className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 ${
                currentStep === 'MODULE'
                  ? 'bg-gold-500/20 border-gold-500 text-gold-700 dark:text-gold-300 font-bold shadow-sm'
                  : selection.moduleName
                  ? 'bg-slate-100 dark:bg-navy-850/80 border-slate-300 dark:border-gray-700 text-slate-700 dark:text-gray-300'
                  : 'bg-slate-50 dark:bg-navy-950/40 border-transparent text-slate-400 dark:text-gray-500'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="max-w-[130px] truncate">
                {selection.moduleName || t('bot.step6_title')}
              </span>
            </button>
          </>
        )}
      </div>

      {/* Main Stepped Interactive View */}
      <AnimatePresence mode="wait">
        {/* ================= STEP 1: TRACK ================= */}
        {currentStep === 'TRACK' && (
          <motion.div
            key="step-track"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
          >
            <h3 className="text-base sm:text-lg font-bold font-arabic text-gold-700 dark:text-gold-300">
              {t('bot.step1_title')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => handleSelectTrack('UNIVERSITY_LMD')}
                className="group p-5 sm:p-6 rounded-2xl border-2 border-slate-200 dark:border-gold-500/30 hover:border-gold-500 bg-slate-50 dark:bg-navy-850 hover:bg-amber-50/50 dark:hover:from-navy-800 dark:hover:to-navy-850 flex flex-col items-center text-center transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-2xl bg-gold-500/15 border border-gold-500/40 text-gold-600 dark:text-gold-400 flex items-center justify-center mb-3 group- transition-transform">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-gold-600 dark:group-hover:text-gold-200 font-arabic">
                  {t('bot.track_univ')}
                </h4>
                <p className="text-xs text-slate-600 dark:text-gray-400 mt-1 font-arabic max-w-xs">
                  {locale === 'ar'
                    ? 'شعب الجذع المشترك (ST, MI, SM)، كليات الطب والصيدلة، التخصصات الهندسية والإعلام الآلي.'
                    : locale === 'fr'
                    ? 'Troncs Communs (ST, MI, SM), Médecine, Pharmacie, Informatique et Ingénierie.'
                    : 'Common Cores (ST, MI, SM), Medicine, Pharmacy, Computer Science and Engineering.'}
                </p>
              </button>

              <button
                onClick={() => handleSelectTrack('BAC')}
                className="group p-5 sm:p-6 rounded-2xl border-2 border-slate-200 dark:border-gold-500/30 hover:border-gold-500 bg-slate-50 dark:bg-navy-850 hover:bg-amber-50/50 dark:hover:from-navy-800 dark:hover:to-navy-850 flex flex-col items-center text-center transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-2xl bg-gold-500/15 border border-gold-500/40 text-gold-600 dark:text-gold-400 flex items-center justify-center mb-3 group- transition-transform">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-gold-600 dark:group-hover:text-gold-200 font-arabic">
                  {t('bot.track_bac')}
                </h4>
                <p className="text-xs text-slate-600 dark:text-gray-400 mt-1 font-arabic max-w-xs">
                  {locale === 'ar'
                    ? 'جميع شعب البكالوريا الجزائرية (علوم تجريبية، رياضيات، تقني رياضي، تسيير واقتصاد).'
                    : locale === 'fr'
                    ? 'Toutes les filières officielles du Baccalauréat Algérien (Sciences, Maths, Technique, Gestion).'
                    : 'All official Algerian BAC national streams (Sciences, Mathematics, Technical, Management).'}
                </p>
              </button>
            </div>
          </motion.div>
        )}

        {/* ================= STEP 2: WILAYA / UNIVERSITY ================= */}
        {currentStep === 'WILAYA_OR_UNIV' && (
          <motion.div
            key="step-univ"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-3"
          >
            <h3 className="text-base sm:text-lg font-bold font-arabic text-gold-700 dark:text-gold-300">
              {t('bot.step2_title')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {availableInstitutions.map((inst) => {
                const wilaya = WILAYAS.find((w) => w.code === inst.wilayaCode);
                const instName = getLocalizedItemName(inst, locale);
                const wilayaName = wilaya ? getLocalizedWilayaName(wilaya, locale) : '';
                return (
                  <button
                    key={inst.id}
                    onClick={() =>
                      handleSelectInstitution(inst.id, instName, inst.wilayaCode, wilayaName)
                    }
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-gold-500/30 hover:border-gold-500 bg-slate-50 dark:bg-navy-850 hover:bg-white dark:hover:bg-navy-800 text-left flex items-start gap-3 transition-all group active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-center text-gold-600 dark:text-gold-400 shrink-0 group- transition-transform">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-gold-600 dark:group-hover:text-gold-200 font-arabic truncate">
                        {instName}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">
                        Wilaya {inst.wilayaCode} • {wilayaName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ================= STEP 3: FACULTY / STREAM ================= */}
        {currentStep === 'FACULTY_OR_STREAM' && (
          <motion.div
            key="step-faculty"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-3"
          >
            <h3 className="text-base sm:text-lg font-bold font-arabic text-gold-700 dark:text-gold-300">
              {t('bot.step3_title')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableFaculties.map((fac) => {
                const facName = getLocalizedItemName(fac, locale);
                return (
                  <button
                    key={fac.id}
                    onClick={() => handleSelectFaculty(fac.id, facName)}
                    className="p-4 rounded-xl border border-slate-200 dark:border-gold-500/30 hover:border-gold-500 bg-slate-50 dark:bg-navy-850 hover:bg-white dark:hover:bg-navy-800 flex items-center gap-3 text-left transition-all group active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-center text-gold-600 dark:text-gold-400 shrink-0 group- transition-transform">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-gold-600 dark:group-hover:text-gold-200 font-arabic">
                        {facName}
                      </h4>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ================= STEP 4: SPECIALTY ================= */}
        {currentStep === 'SPECIALTY' && (
          <motion.div
            key="step-specialty"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-3"
          >
            <h3 className="text-base sm:text-lg font-bold font-arabic text-gold-700 dark:text-gold-300">
              {t('bot.step4_title')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableSpecialties.map((spec) => {
                const specName = getLocalizedItemName(spec, locale);
                return (
                  <button
                    key={spec.id}
                    onClick={() => handleSelectSpecialty(spec.id, specName)}
                    className="p-4 rounded-xl border border-slate-200 dark:border-gold-500/30 hover:border-gold-500 bg-slate-50 dark:bg-navy-850 hover:bg-white dark:hover:bg-navy-800 flex items-center gap-3 text-left transition-all group active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-center text-gold-600 dark:text-gold-400 shrink-0 group- transition-transform">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-gold-600 dark:group-hover:text-gold-200 font-arabic">
                        {specName}
                      </h4>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ================= STEP 5: YEAR / SEMESTER ================= */}
        {currentStep === 'YEAR_SEMESTER' && (
          <motion.div
            key="step-year"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-3"
          >
            <h3 className="text-base sm:text-lg font-bold font-arabic text-gold-700 dark:text-gold-300">
              {t('bot.step5_title')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableYears.map((year) => {
                const yearName = getLocalizedItemName(year, locale);
                return (
                  <button
                    key={year.id}
                    onClick={() => handleSelectAcademicYear(year.id, yearName)}
                    className="p-4 rounded-xl border border-slate-200 dark:border-gold-500/30 hover:border-gold-500 bg-slate-50 dark:bg-navy-850 hover:bg-white dark:hover:bg-navy-800 flex items-center gap-3 text-left transition-all group active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-center text-gold-600 dark:text-gold-400 shrink-0 group- transition-transform">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-gold-600 dark:group-hover:text-gold-200 font-arabic">
                        {yearName}
                      </h4>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ================= STEP 6: MODULE ================= */}
        {currentStep === 'MODULE' && (
          <motion.div
            key="step-module"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-3"
          >
            <h3 className="text-base sm:text-lg font-bold font-arabic text-gold-700 dark:text-gold-300">
              {t('bot.step6_title')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {availableModules.map((mod) => {
                const modName = getLocalizedItemName(mod, locale);
                return (
                  <button
                    key={mod.id}
                    onClick={() => handleSelectModule(mod.id, modName)}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-gold-500/30 hover:border-gold-500 bg-slate-50 dark:bg-navy-850 hover:bg-white dark:hover:bg-navy-800 flex flex-col justify-between text-left transition-all group active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between w-full">
                      <span className="px-2 py-0.5 rounded bg-gold-500/20 text-gold-700 dark:text-gold-300 font-mono text-[10px] font-bold">
                        {mod.code}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-gray-400 font-arabic">
                        {t('bot.coefficient')}: <strong className="text-slate-900 dark:text-white">{mod.coefficient}</strong>
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-gold-600 dark:group-hover:text-gold-200 font-arabic my-2.5">
                      {modName}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-gray-400 border-t border-slate-200 dark:border-gray-800 pt-2 w-full font-arabic">
                      <span>{mod.examsCount || 5} {t('bot.availableExamsCount')}</span>
                      <span className="text-gold-600 dark:text-gold-400 group-hover:underline">→</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ================= STEP 7: MODULE REVISION SUMMARIES & EXAM ARCHIVE ================= */}
        {currentStep === 'EXAMS' && (
          <motion.div
            key="step-exams"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-5"
          >
            {/* Step Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-gold-500/20">
              <div>
                <h3 className="text-base sm:text-xl font-black font-arabic text-slate-900 dark:text-gold-200">
                  {selection.moduleName}
                </h3>
                <p className="text-xs text-slate-600 dark:text-gray-300 font-arabic mt-0.5">
                  {selection.institutionName} • {selection.academicYearName}
                </p>
              </div>

              {/* Main Sub-Tab Toggle (Summaries vs Exams) */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-navy-850 border border-slate-300 dark:border-gold-500/30">
                <button
                  onClick={() => setFinalTab('SUMMARIES')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    finalTab === 'SUMMARIES'
                      ? 'bg-gold-500 text-navy-950 shadow-sm font-black'
                      : 'text-slate-600 dark:text-gray-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{t('bot.summariesTab')}</span>
                </button>
                <button
                  onClick={() => setFinalTab('EXAMS')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    finalTab === 'EXAMS'
                      ? 'bg-gold-500 text-navy-950 shadow-sm font-black'
                      : 'text-slate-600 dark:text-gray-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t('bot.examsTab')}</span>
                </button>
              </div>
            </div>

            {/* ================= SUB-TAB 1: MODULE SUMMARIES (الملخصات والمراجعة) ================= */}
            {finalTab === 'SUMMARIES' && (
              <div className="space-y-4">
                {/* Intro Callout Banner */}
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/15 border border-gold-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center text-gold-600 dark:text-gold-400 shrink-0 mt-0.5">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-gold-200 font-arabic">
                        {t('bot.moduleSummaryTitle')}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-600 dark:text-gray-300 font-arabic mt-0.5 leading-relaxed">
                        {t('bot.moduleSummaryDesc')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFinalTab('EXAMS')}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-navy-800 dark:hover:bg-navy-700 text-gold-300 border border-gold-500/40 text-xs font-bold font-arabic shrink-0 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>{locale === 'ar' ? 'الانتقال إلى الامتحانات' : 'Voir les Examens'}</span>
                    <span>→</span>
                  </button>
                </div>

                {/* Summaries & Revision Packs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Card 1: Comprehensive Module Digest */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-850/90 border border-slate-200 dark:border-gold-500/30 shadow-sm flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-gold-500/20 text-gold-700 dark:text-gold-300 text-[10px] font-mono font-bold">
                          PDF • 24 Pages
                        </span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{locale === 'ar' ? 'معتمد رسميًا' : 'Validé'}</span>
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mt-2">
                        {locale === 'ar' ? `الملخص الشامل لمقياس ${selection.moduleName}` : `Résumé Complet : ${selection.moduleName}`}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
                        {locale === 'ar'
                          ? 'شرح مبسط لكافة المحاور، مفاهيم الدروس النظرية، وتطبيقات عملية مع أمثلة توضيحية.'
                          : 'Synthèse claire de tous les chapitres du cours avec exemples d\'application.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-gray-800">
                      <button
                        onClick={() =>
                          setActiveSummaryPreview({
                            title: locale === 'ar' ? `الملخص الشامل - ${selection.moduleName}` : `Résumé Complet - ${selection.moduleName}`,
                            desc: locale === 'ar' ? 'ملخص مركّز يغطي جميع وحدات المقرر الدراسي بطريقة منهجية.' : 'Synthèse condensée de tous les modules du semestre.',
                          })
                        }
                        className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-800 dark:text-gold-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-gold-500" />
                        <span>{t('bot.viewSummary')}</span>
                      </button>
                      <a
                        href="/sample-exam.pdf"
                        download
                        className="p-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 transition-all shadow-sm"
                        title={t('bot.downloadSummary')}
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Card 2: Formulas & Key Theorems Cheat Sheet */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-850/90 border border-slate-200 dark:border-gold-500/30 shadow-sm flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] font-mono font-bold">
                          CHEAT-SHEET • 6 Pages
                        </span>
                        <span className="text-[11px] text-gold-600 dark:text-gold-400 font-bold">
                          {t('bot.keyFormulas')}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mt-2">
                        {locale === 'ar' ? `ورقة القوانين والتعاريف الأساسية (${selection.moduleName})` : `Fiche de Formules & Théorèmes (${selection.moduleName})`}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
                        {locale === 'ar'
                          ? 'بطاقات مراجعة سريعة تحتوي على جميع القوانين الرياضية، النظريات، والنقاط الواجب حفظها للامتحان.'
                          : 'Fiche récapitulative des formules, théorèmes et définitions indispensables pour le jour J.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-gray-800">
                      <button
                        onClick={() =>
                          setActiveSummaryPreview({
                            title: locale === 'ar' ? `ورقة القوانين - ${selection.moduleName}` : `Fiche de Formules - ${selection.moduleName}`,
                            desc: locale === 'ar' ? 'ملخص القوانين والنتائج الرياضية المباشرة للاستعمال في حل التمارين.' : 'Formules mathématiques et règles de calcul clés.',
                          })
                        }
                        className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-800 dark:text-gold-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                        <span>{t('bot.viewSummary')}</span>
                      </button>
                      <a
                        href="/sample-exam.pdf"
                        download
                        className="p-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 transition-all shadow-sm"
                        title={t('bot.downloadSummary')}
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Card 3: Common Pitfalls & Exam Traps */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-850/90 border border-slate-200 dark:border-gold-500/30 shadow-sm flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold">
                          METHODOLOGY GUIDE
                        </span>
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                          {locale === 'ar' ? 'فخاخ وأخطاء الامتحانات' : 'Pièges Classiques'}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mt-2">
                        {locale === 'ar' ? 'دليل الأخطاء الشائعة ومنهجية الإجابة' : 'Guide Méthodologique & Pièges d\'Examens'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
                        {locale === 'ar'
                          ? 'أهم الهفوات التي يقع فيها الطلبة في الامتحانات السابقة مع نصائح الأساتذة المصححين لضمان العلامة الكاملة.'
                          : 'Conseils des correcteurs et astuces pour éviter les erreurs fréquentes lors des épreuves.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-gray-800">
                      <button
                        onClick={() =>
                          setActiveSummaryPreview({
                            title: locale === 'ar' ? `دليل المنهجية والأخطاء - ${selection.moduleName}` : `Guide Méthodologique - ${selection.moduleName}`,
                            desc: locale === 'ar' ? 'نصائح حصرية من أساتذة المنصة لضمان الحصول على أعلى الدرجات.' : 'Conseils exclusifs pour maximiser votre note aux examens.',
                          })
                        }
                        className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-800 dark:text-gold-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                        <span>{t('bot.viewSummary')}</span>
                      </button>
                      <a
                        href="/sample-exam.pdf"
                        download
                        className="p-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 transition-all shadow-sm"
                        title={t('bot.downloadSummary')}
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Card 4: Step-by-Step Solved Core Exercises */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-850/90 border border-slate-200 dark:border-gold-500/30 shadow-sm flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold">
                          PRACTICE SET • 15 EXERCISES
                        </span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                          {locale === 'ar' ? 'تمارين نموذجية' : 'Exercices Types'}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mt-2">
                        {locale === 'ar' ? 'سلسلة التمارين النموذجية مع الحل المفصل' : 'Série d\'Exercices Types Corrigés Pas à Pas'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
                        {locale === 'ar'
                          ? 'تمارين تطبيقية مجهزة لاختبار فهمك قبل البدء في حل مواضيع السنوات السابقة.'
                          : 'Exercices d\'entraînement conçus pour tester vos acquis avant les annales.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-gray-800">
                      <button
                        onClick={() =>
                          setActiveSummaryPreview({
                            title: locale === 'ar' ? `سلسلة التمارين النموذجية - ${selection.moduleName}` : `Exercices Types - ${selection.moduleName}`,
                            desc: locale === 'ar' ? 'حلول مفصلة خطوة بخطوة لمساعدتك على الإتقان.' : 'Corrections détaillées étape par étape.',
                          })
                        }
                        className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-800 dark:text-gold-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{t('bot.viewSummary')}</span>
                      </button>
                      <a
                        href="/sample-exam.pdf"
                        download
                        className="p-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 transition-all shadow-sm"
                        title={t('bot.downloadSummary')}
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= SUB-TAB 2: EXAMS ARCHIVE (بنك الامتحانات) ================= */}
            {finalTab === 'EXAMS' && (
              <div className="space-y-4">
                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-600 dark:text-gray-300 font-arabic">
                    {t('bot.availableExamsCount')}: <strong className="text-gold-600 dark:text-gold-400">{availableExams.length}</strong>
                  </span>

                  <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-navy-850 border border-slate-300 dark:border-gold-500/20 text-xs font-arabic">
                    {(['ALL', 'FINAL_SEMESTRIAL', 'MIDTERM_EMD', 'RATTRAPAGE'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setExamFilter(filter)}
                        className={`px-2.5 py-1 rounded-lg transition-all text-[11px] ${
                          examFilter === filter
                            ? 'bg-gold-500 text-navy-950 font-bold shadow-sm'
                            : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {filter === 'ALL'
                          ? t('common.all')
                          : filter === 'FINAL_SEMESTRIAL'
                          ? t('bot.final')
                          : filter === 'MIDTERM_EMD'
                          ? t('bot.midterm')
                          : t('bot.rattrapage')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Free vs. Paid Notice Banner */}
                {!isUserGold && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-gold-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center text-gold-600 dark:text-gold-400 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-gold-200 font-arabic">
                          {locale === 'ar'
                            ? 'الحساب المجاني: متاح لك أول موضوعين كعينة مجانية'
                            : locale === 'fr'
                            ? 'Compte Gratuit : Accès aux 2 premiers sujets d\'annales'
                            : 'Free Account: Access to 2 sample exam papers'}
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-gray-300 font-arabic">
                          {locale === 'ar'
                            ? 'فعّل العضوية الذهبية VIP للوصول غير المحدود لكافة المواضيع والحلول النموذجية.'
                            : locale === 'fr'
                            ? 'Passez en VIP Gold pour débloquer l\'intégralité des 12 000+ sujets et corrigés.'
                            : 'Upgrade to VIP Gold for unlimited access to all 12,000+ exam papers & solutions.'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsUpgradeModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-gold-500 text-navy-950 text-xs font-extrabold font-arabic shadow-gold-glow shrink-0 active:scale-95 transition-all touch-target"
                    >
                      {t('bot.upgradeBtn')}
                    </button>
                  </div>
                )}

                {/* Exam Items List */}
                <div className="space-y-2.5">
                  {availableExams.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-gray-400 rounded-2xl border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-navy-850 font-arabic text-xs">
                      {locale === 'ar'
                        ? 'لا توجد مواضيع مضافة لهذا التصنيف حالياً.'
                        : locale === 'fr'
                        ? 'Aucun sujet disponible pour cette sélection.'
                        : 'No exam papers available for this category.'}
                    </div>
                  ) : (
                    availableExams.map((exam, index) => {
                      const isLocked = !isUserGold && index >= 2;
                      return (
                        <div
                          key={exam.id}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isLocked
                              ? 'border-slate-200 dark:border-gold-500/20 bg-slate-50 dark:bg-navy-950/60 opacity-90'
                              : 'border-slate-200 dark:border-gold-500/40 bg-white dark:bg-navy-850/90 shadow-sm hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                isLocked
                                  ? 'bg-amber-500/10 dark:bg-navy-900 border-amber-400/40 text-amber-600 dark:text-gold-400'
                                  : 'bg-gold-500/15 border-gold-500/40 text-gold-600 dark:text-gold-300'
                              }`}
                            >
                              {isLocked ? (
                                <Lock className="w-4 h-4 text-amber-600 dark:text-gold-400" />
                              ) : (
                                <FileText className="w-5 h-5" />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-arabic ${
                                    exam.termType === 'FINAL_SEMESTRIAL'
                                      ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-400/30'
                                      : exam.termType === 'MIDTERM_EMD'
                                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30'
                                      : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30'
                                  }`}
                                >
                                  {exam.termType === 'FINAL_SEMESTRIAL'
                                    ? t('bot.final')
                                    : exam.termType === 'MIDTERM_EMD'
                                    ? t('bot.midterm')
                                    : t('bot.rattrapage')}
                                </span>

                                <span className="font-mono text-xs text-gold-700 dark:text-gold-400 font-semibold">
                                  {exam.year}
                                </span>

                                {isLocked && (
                                  <span className="px-2 py-0.2 rounded-md bg-gold-500/20 text-gold-700 dark:text-gold-300 font-bold font-arabic text-[9px]">
                                    VIP GOLD
                                  </span>
                                )}
                              </div>

                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-1 font-arabic">
                                {exam.title}
                              </h4>

                              <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5 font-arabic">
                                {exam.authorName || 'DZ Prime Faculty'} • {exam.downloadsCount} {t('bot.downloads')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {isLocked ? (
                              <button
                                onClick={() => setIsUpgradeModalOpen(true)}
                                className="px-3.5 py-1.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 text-xs font-bold font-arabic flex items-center gap-1.5 shadow-sm active:scale-95 touch-target"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>{locale === 'ar' ? 'فتح الموضوع (VIP)' : 'Débloquer (VIP)'}</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => setActivePdfPreview(exam)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-300 dark:border-gold-500/30 text-slate-800 dark:text-gold-200 text-xs font-semibold font-arabic flex items-center gap-1.5 transition-all touch-target"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>{t('bot.viewExam')}</span>
                                </button>

                                <a
                                  href={exam.fileUrl}
                                  download
                                  className="p-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 transition-all shadow-sm active:scale-95 touch-target"
                                  title={t('bot.downloadPdf')}
                                >
                                 <Download className="w-4 h-4" />
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Simulator Modal */}
      {activePdfPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 dark:bg-navy-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-gold-500/40 bg-white dark:bg-navy-900 p-6 text-slate-900 dark:text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold-600 dark:text-gold-400" />
                <h3 className="font-bold text-sm font-arabic truncate max-w-xs">
                  {activePdfPreview.title}
                </h3>
              </div>
              <button
                onClick={() => setActivePdfPreview(null)}
                className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-800"
              >
                ✕ {t('common.close')}
              </button>
            </div>

            <div className="my-6 p-6 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-gold-500/20 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-gold-500/10 border border-gold-400/30 text-gold-600 dark:text-gold-400 flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold font-arabic text-slate-900 dark:text-gold-200">
                {activePdfPreview.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-arabic">
                {locale === 'ar'
                  ? 'تم تدقيق هذا الموضوع والحل النموذجي ليتطابق مع المنهاج المعتمد.'
                  : locale === 'fr'
                  ? 'Sujet officiel validé conforme aux barèmes pédagogiques.'
                  : 'Official certified exam paper matching national curricula.'}
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <a
                  href={activePdfPreview.fileUrl}
                  download
                  className="px-4 py-2 rounded-xl bg-gold-500 text-navy-950 font-bold text-xs font-arabic flex items-center gap-2 shadow-gold-glow"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('bot.downloadPdf')}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
};
