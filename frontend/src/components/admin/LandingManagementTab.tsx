'use client';

import { ImageUploader } from '@/components/shared/ImageUploader';
import React,{ useState, useEffect, useRef } from 'react';
import {
  Globe,
  Save,
  Plus,
  Trash2,
  Edit2,
  Check,
  Loader2,
  AlertCircle,
  Upload,
  Link as LinkIcon,
  Sparkles,
  BarChart3,
  Layers,
  Award,
  Crown,
  ExternalLink,
  RotateCcw,
  Eye,
  Send,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LandingPageConfig,
  FeaturedCourseItem,
  DEFAULT_LANDING_CONFIG,
} from '@/lib/landingConfig';
import { formatDZD } from '@/lib/format';

interface LandingManagementTabProps {
  locale: string;
}

export const LandingManagementTab: React.FC<LandingManagementTabProps> = ({ locale }) => {
  const isAr = locale === 'ar';

  const [config, setConfig] = useState<LandingPageConfig>(DEFAULT_LANDING_CONFIG);
  const [ambassadorTelegram, setAmbassadorTelegram] = useState('MrK_ADMIN00');
  const [realStats, setRealStats] = useState<{
    examsCount: string;
    studentsCount: string;
    wilayasCount: string;
    satisfactionRate: string;
  }>({
    examsCount: '',
    studentsCount: '',
    wilayasCount: '',
    satisfactionRate: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Active section tab
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'courses' | 'hero' | 'ambassador' | 'finalCta'>('stats');

  // Course modal / edit state
  const [editingCourse, setEditingCourse] = useState<FeaturedCourseItem | null>(null);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<'URL' | 'FILE'>('URL');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load landing configuration
  useEffect(() => {
    fetch('/api/settings/landing')
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          if (data.landingConfig && typeof data.landingConfig === 'object') {
            setConfig({
              ...DEFAULT_LANDING_CONFIG,
              ...data.landingConfig,
              hero: { ...DEFAULT_LANDING_CONFIG.hero, ...(data.landingConfig.hero || {}) },
              stats: { ...DEFAULT_LANDING_CONFIG.stats, ...(data.landingConfig.stats || {}) },
              featuredCoursesSection: {
                ...DEFAULT_LANDING_CONFIG.featuredCoursesSection,
                ...(data.landingConfig.featuredCoursesSection || {}),
                courses: data.landingConfig.featuredCoursesSection?.courses || DEFAULT_LANDING_CONFIG.featuredCoursesSection.courses,
              },
              ambassadorBanner: { ...DEFAULT_LANDING_CONFIG.ambassadorBanner, ...(data.landingConfig.ambassadorBanner || {}) },
              finalCta: { ...DEFAULT_LANDING_CONFIG.finalCta, ...(data.landingConfig.finalCta || {}) },
            });
          }
          if (data.ambassadorTelegram) {
            setAmbassadorTelegram(data.ambassadorTelegram);
          }
          if (data.realStats) {
            setRealStats(data.realStats);
          }
        }
      })
      .catch((e) => console.error('Failed to load landing config:', e))
      .finally(() => setLoading(false));
  }, []);

  // Save changes
  const handleSaveAll = async () => {
    setSaving(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      const res = await fetch('/api/settings/landing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landingConfig: config,
          ambassadorTelegram: ambassadorTelegram.replace('@', '').replace('t.me/', ''),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const removed = Number(data.removedInlineImages) || 0;
        setSaveSuccess(
          removed > 0
            ? isAr
              ? `تم الحفظ، لكن ${removed} صورة قديمة مضمنة في الإعدادات حُذفت. ارفعها من جديد بزر الرفع.`
              : `Enregistré, mais ${removed} ancienne(s) image(s) intégrée(s) ont été retirée(s). Téléversez-les à nouveau.`
            : isAr ? 'تم حفظ وتحديث الواجهة الرئيسية للمنصة بنجاح ✓' : 'Page d\'accueil mise à jour avec succès ✓'
        );
        setTimeout(() => setSaveSuccess(''), removed > 0 ? 12000 : 4000);
      } else {
        setSaveError(data.error || (isAr ? 'فشل حفظ الإعدادات' : 'Erreur de sauvegarde'));
      }
    } catch (e) {
      setSaveError(isAr ? 'تعذر الاتصال بالخادم' : 'Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (confirm(isAr ? 'هل أنت متأكد من استعادة النصوص الافتراضية للواجهة؟' : 'Réinitialiser aux textes par défaut ?')) {
      setConfig(DEFAULT_LANDING_CONFIG);
      setAmbassadorTelegram('MrK_ADMIN00');
    }
  };

  // Save course item (Add or Edit)
  const handleSaveCourse = () => {
    if (!editingCourse) return;

    const existingIndex = config.featuredCoursesSection.courses.findIndex((c) => c.id === editingCourse.id);
    let updatedCourses: FeaturedCourseItem[];

    if (existingIndex >= 0) {
      updatedCourses = [...config.featuredCoursesSection.courses];
      updatedCourses[existingIndex] = editingCourse;
    } else {
      updatedCourses = [...config.featuredCoursesSection.courses, editingCourse];
    }

    setConfig({
      ...config,
      featuredCoursesSection: {
        ...config.featuredCoursesSection,
        courses: updatedCourses,
      },
    });

    setIsCourseModalOpen(false);
    setEditingCourse(null);
  };

  // Delete course
  const handleDeleteCourse = (id: string) => {
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذه الدورة من الواجهة الرئيسية؟' : 'Supprimer ce cours ?')) {
      setConfig({
        ...config,
        featuredCoursesSection: {
          ...config.featuredCoursesSection,
          courses: config.featuredCoursesSection.courses.filter((c) => c.id !== id),
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
        <span className="text-xs text-gray-400 font-arabic">
          {isAr ? 'جارٍ تحميل إعدادات الواجهة الرئيسية...' : 'Chargement de la configuration...'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-arabic" data-testid="landing-management-tab">
      {/* ================= TOP CONTROL BAR ================= */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[#111114] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-wider">
            <Globe className="w-4 h-4" />
            <span>{isAr ? 'لوحة تحكم الواجهة الرئيسية (Landing CMS)' : 'CMS Page d\'accueil'}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white mt-1">
            {isAr ? 'إدارة وتخصيص محتوى الصفحة الرئيسية بالكامل' : 'Gestion Intégrale de la Page d\'Accueil'}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {isAr
              ? 'تحكم في الأرقام والإحصائيات، دورات المعرض، النصوص الترويجية، وروابط تيليغرام المعتمدة.'
              : 'Gérez les statistiques, cours en vedette, textes promotionnels et Telegram.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
          <a
            href={`/${locale}`}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span>{isAr ? 'معاينة الواجهة' : 'Voir le site'}</span>
          </a>

          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            title={isAr ? 'استعادة الافتراضي' : 'Réinitialiser'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-xs shadow-lg shadow-lime-400/20 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isAr ? 'حفظ التعديلات فورياً' : 'Publier les modifications'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 shadow-lg">
          <Check className="w-4 h-4 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}
      {saveError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ================= SUB-NAVIGATION TABS ================= */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0b0b0d] border border-white/10 overflow-x-auto no-scrollbar shadow-md">
        <button
          onClick={() => setActiveSubTab('stats')}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all ${
            activeSubTab === 'stats'
              ? 'bg-gold-500 text-navy-950 shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>{isAr ? '1. شريط الإحصائيات (12,000+)' : '1. Statistiques Clés'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('courses')}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all ${
            activeSubTab === 'courses'
              ? 'bg-gold-500 text-navy-950 shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isAr ? '2. أشهر الدورات والمقاييس' : '2. Modules & Cours'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('hero')}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all ${
            activeSubTab === 'hero'
              ? 'bg-gold-500 text-navy-950 shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isAr ? '3. واجهة الترحيب (Hero)' : '3. En-tête Hero'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ambassador')}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all ${
            activeSubTab === 'ambassador'
              ? 'bg-gold-500 text-navy-950 shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>{isAr ? '4. شبكة السفراء وتيليغرام' : '4. Réseau & Ambassadeurs'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('finalCta')}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all ${
            activeSubTab === 'finalCta'
              ? 'bg-gold-500 text-navy-950 shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          <span>{isAr ? '5. القسم الختامي (Final CTA)' : '5. Appel Final'}</span>
        </button>
      </div>

      {/* ================= TAB 1: STATS & NUMBERS ================= */}
      {activeSubTab === 'stats' && (
        <div className="space-y-6">
          {/* Mode Switch Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#111114] border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-lime-400" />
                  <span>{isAr ? 'طريقة حساب وعرض الإحصائيات في الصفحة الرئيسية' : 'Mode d\'affichage des statistiques'}</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {isAr
                    ? 'اختر ما إذا كنت ترغب في عرض أرقام حقيقية محسوبة تلقائياً من قاعدة البيانات، أو إدخال أرقام مخصصة يدوياً.'
                    : 'Choisissez entre le calcul dynamique en direct depuis la base de données ou la saisie manuelle.'}
                </p>
              </div>

              {/* Mode Toggle Buttons */}
              <div className="flex items-center p-1 rounded-2xl bg-white/5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, stats: { ...config.stats, mode: 'AUTO' } })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    config.stats.mode === 'AUTO'
                      ? 'bg-lime-400 text-navy-950 font-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'تلقائي (قاعدة البيانات)' : 'Automatique (Base de données)'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, stats: { ...config.stats, mode: 'MANUAL' } })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    config.stats.mode === 'MANUAL'
                      ? 'bg-gold-400 text-navy-950 font-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'يدوي مخصص' : 'Manuel'}
                </button>
              </div>
            </div>

            {/* Current status info */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-300">
                <HelpCircle className="w-4 h-4 text-gold-400" />
                <span>
                  {config.stats.mode === 'AUTO'
                    ? isAr
                      ? 'الوضع التلقائي مفعّل: تظهر الأرقام الحقيقية من قاعدة بيانات Supabase (مواضيع الامتحانات، عدد الطلبة المسجلين، الولايات المغطاة).'
                      : 'Mode automatique actif : affichage des données réelles de Supabase.'
                    : isAr
                      ? 'الوضع اليدوي مفعّل: تظهر الأرقام والنصوص المخصصة التي تقوم بتحديدها أدناه.'
                      : 'Mode manuel actif : affichage des valeurs personnalisées ci-dessous.'}
                </span>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-white/10 text-white font-bold">
                {config.stats.mode === 'AUTO' ? 'MODE: AUTO (LIVE)' : 'MODE: MANUAL'}
              </span>
            </div>
          </div>

          {/* 4 Stats Cards Editor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stat 1: Exams */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#111114] border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-xs font-black text-gold-400">1. {isAr ? 'مواضيع الامتحانات' : 'Examens & Annales'}</span>
                {config.stats.mode === 'AUTO' && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
                    Live DB: {realStats.examsCount}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'الرقم المعروض' : 'Valeur'}</label>
                <input aria-label={isAr ? 'الرقم المعروض' : 'Valeur'}
                  disabled={config.stats.mode === 'AUTO'}
                  value={config.stats.mode === 'AUTO' ? realStats.examsCount : config.stats.examsValue}
                  onChange={(e) =>
                    setConfig({ ...config, stats: { ...config.stats, examsValue: e.target.value } })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono font-bold text-sm focus:outline-none focus:border-gold-400 disabled:opacity-70"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'النص التوضيحي (العربية)' : 'Label (Ar)'}</label>
                <input aria-label={isAr ? 'النص التوضيحي (العربية)' : 'Label (Ar)'}
                  value={config.stats.examsLabelAr}
                  onChange={(e) =>
                    setConfig({ ...config, stats: { ...config.stats, examsLabelAr: e.target.value } })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-400"
                />
              </div>
            </div>

            {/* Stat 2: Active Students */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#111114] border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-xs font-black text-emerald-400">2. {isAr ? 'المستخدمون' : 'Utilisateurs'}</span>
                {config.stats.mode === 'AUTO' && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
                    Live DB: {realStats.studentsCount}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'الرقم المعروض' : 'Valeur'}</label>
                <input aria-label={isAr ? 'الرقم المعروض' : 'Valeur'}
                  disabled={config.stats.mode === 'AUTO'}
                  value={config.stats.mode === 'AUTO' ? realStats.studentsCount : config.stats.studentsValue}
                  onChange={(e) =>
                    setConfig({ ...config, stats: { ...config.stats, studentsValue: e.target.value } })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-400 disabled:opacity-70"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'النص التوضيحي (العربية)' : 'Label (Ar)'}</label>
                <input aria-label={isAr ? 'النص التوضيحي (العربية)' : 'Label (Ar)'}
                  value={config.stats.studentsLabelAr}
                  onChange={(e) =>
                    setConfig({ ...config, stats: { ...config.stats, studentsLabelAr: e.target.value } })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Stat 3: Wilayas */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#111114] border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-xs font-black text-sky-400">3. {isAr ? 'الولايات المغطاة' : 'Wilayas'}</span>
                {config.stats.mode === 'AUTO' && (
                  <span className="text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full font-mono">
                    Live DB: {realStats.wilayasCount}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'الرقم المعروض' : 'Valeur'}</label>
                <input aria-label={isAr ? 'الرقم المعروض' : 'Valeur'}
                  disabled={config.stats.mode === 'AUTO'}
                  value={config.stats.mode === 'AUTO' ? realStats.wilayasCount : config.stats.wilayasValue}
                  onChange={(e) =>
                    setConfig({ ...config, stats: { ...config.stats, wilayasValue: e.target.value } })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono font-bold text-sm focus:outline-none focus:border-sky-400 disabled:opacity-70"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'النص التوضيحي (العربية)' : 'Label (Ar)'}</label>
                <input aria-label={isAr ? 'النص التوضيحي (العربية)' : 'Label (Ar)'}
                  value={config.stats.wilayasLabelAr}
                  onChange={(e) =>
                    setConfig({ ...config, stats: { ...config.stats, wilayasLabelAr: e.target.value } })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            {/* Stat 4: Satisfaction Rate */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#111114] border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-xs font-black text-purple-400">4. {isAr ? 'نسبة رضا الطلبة' : 'Satisfaction'}</span>
                {config.stats.mode === 'AUTO' && (
                  <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full font-mono">
                    Live: {realStats.satisfactionRate ?? '-'}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'الرقم المعروض' : 'Valeur'}</label>
                <input aria-label={isAr ? 'الرقم المعروض' : 'Valeur'}
                  disabled={config.stats.mode === 'AUTO'}
                  value={config.stats.mode === 'AUTO' ? realStats.satisfactionRate ?? '' : config.stats.satisfactionValue}
                  onChange={(e) =>
                    setConfig({ ...config, stats: { ...config.stats, satisfactionValue: e.target.value } })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono font-bold text-sm focus:outline-none focus:border-purple-400 disabled:opacity-70"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'النص التوضيحي (العربية)' : 'Label (Ar)'}</label>
                <input aria-label={isAr ? 'النص التوضيحي (العربية)' : 'Label (Ar)'}
                  value={config.stats.satisfactionLabelAr}
                  onChange={(e) =>
                    setConfig({ ...config, stats: { ...config.stats, satisfactionLabelAr: e.target.value } })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: FEATURED COURSES & MODULES ================= */}
      {activeSubTab === 'courses' && (
        <div className="space-y-6">
          {/* Section Heading Settings */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#111114] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-gold-400" />
                <span>{isAr ? 'عنوان قسم استكشف أشهر الدورات والمقاييس' : 'En-tête de la section Modules'}</span>
              </h3>
              <button
                onClick={() => {
                  setEditingCourse({
                    id: `course-${Date.now()}`,
                    titleAr: '',
                    titleFr: '',
                    category: 'BAC',
                    levelAr: 'جميع الشعب',
                    levelFr: 'Toutes Filières',
                    instructorNameAr: 'أستاذ معتمد',
                    instructorNameFr: 'Enseignant Certifié',
                    thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
                    durationHours: 30,
                    priceDzd: 4000,
                    rating: 0,
                    reviewsCount: 0,
                    badge: 'New',
                    badgeColor: 'bg-gold-500/20 text-gold-400 border-gold-500/30',
                    isPopular: true,
                  });
                  setImageInputMode('URL');
                  setIsCourseModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-lime-400/20 active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة دورة / مقياس جديد' : 'Ajouter un cours'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'العنوان الرئيسي للقسم' : 'Titre principal'}</label>
                <input aria-label={isAr ? 'العنوان الرئيسي للقسم' : 'Titre principal'}
                  value={config.featuredCoursesSection.titleAr}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      featuredCoursesSection: {
                        ...config.featuredCoursesSection,
                        titleAr: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'العنوان الفرعي (البادج الصغير)' : 'Sous-titre / Badge'}</label>
                <input aria-label={isAr ? 'العنوان الفرعي (البادج الصغير)' : 'Sous-titre / Badge'}
                  value={config.featuredCoursesSection.subtitleAr}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      featuredCoursesSection: {
                        ...config.featuredCoursesSection,
                        subtitleAr: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-400"
                />
              </div>
            </div>
          </div>

          {/* List of Courses Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.featuredCoursesSection.courses.map((course) => (
              <div
                key={course.id}
                className="p-4 rounded-3xl bg-[#111114] border border-white/10 hover:border-gold-500/40 flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Thumbnail Image Preview */}
                  <div className="relative w-full h-36 rounded-2xl overflow-hidden mb-3 bg-navy-950">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.titleAr}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${course.badgeColor || 'bg-gold-500/20 text-gold-400 border-gold-500/30'}`}>
                        {course.badge || 'Popular'}
                      </span>
                    </div>
                    <div className="absolute bottom-2 right-2 rtl:right-auto rtl:left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono">
                      {course.durationHours}h • {formatDZD(course.priceDzd, locale)}
                    </div>
                  </div>

                  <h4 className="text-xs font-black text-white line-clamp-2 leading-relaxed mb-1">
                    {course.titleAr}
                  </h4>
                  <p className="text-[11px] text-gray-400 line-clamp-1 mb-2">
                    {course.instructorNameAr} • {course.levelAr}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-lime-400 font-mono">
                    {formatDZD(course.priceDzd, locale)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingCourse({ ...course });
                        setImageInputMode(course.thumbnailUrl.startsWith('data:') ? 'FILE' : 'URL');
                        setIsCourseModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-sky-400 transition-all"
                      title={isAr ? 'تعديل' : 'Modifier'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-rose-400 transition-all"
                      title={isAr ? 'حذف' : 'Supprimer'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: HERO SECTION ================= */}
      {activeSubTab === 'hero' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[#111114] border border-white/10 space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span>{isAr ? 'نصوص واجهة الترحيب الرئيسية (Hero Section)' : 'Textes de l\'en-tête (Hero)'}</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'البادج الترويجي العلوي' : 'Badge d\'en-tête'}</label>
              <input aria-label={isAr ? 'البادج الترويجي العلوي' : 'Badge d\'en-tête'}
                value={config.hero.badgeAr}
                onChange={(e) => setConfig({ ...config, hero: { ...config.hero, badgeAr: e.target.value } })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'بداية العنوان الرئيسي' : 'Début Titre'}</label>
                <input aria-label={isAr ? 'بداية العنوان الرئيسي' : 'Début Titre'}
                  value={config.hero.titleLeadAr}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, titleLeadAr: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-400"
                />
              </div>
              <div>
                <label className="block text-gold-400 text-[11px] mb-1 font-semibold">{isAr ? 'الكلمة الذهبية المميزة' : 'Mot Clé Mis en avant'}</label>
                <input aria-label={isAr ? 'الكلمة الذهبية المميزة' : 'Mot Clé Mis en avant'}
                  value={config.hero.titleHighlightAr}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, titleHighlightAr: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs font-bold focus:outline-none focus:border-gold-400"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'نهاية العنوان الرئيسي' : 'Fin Titre'}</label>
                <input aria-label={isAr ? 'نهاية العنوان الرئيسي' : 'Fin Titre'}
                  value={config.hero.titleEndAr}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, titleEndAr: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'الوصف الترحيبي العام' : 'Description / Sous-titre'}</label>
              <textarea aria-label={isAr ? 'الوصف الترحيبي العام' : 'Description / Sous-titre'}
                rows={3}
                value={config.hero.subAr}
                onChange={(e) => setConfig({ ...config, hero: { ...config.hero, subAr: e.target.value } })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'زر الحث الأساسي (Primary CTA)' : 'Bouton Primaire'}</label>
                <input aria-label={isAr ? 'زر الحث الأساسي (Primary CTA)' : 'Bouton Primaire'}
                  value={config.hero.ctaPrimaryAr}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, ctaPrimaryAr: e.target.value } })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'زر العرض التوضيحي (Secondary CTA)' : 'Bouton Démo'}</label>
                <input aria-label={isAr ? 'زر العرض التوضيحي (Secondary CTA)' : 'Bouton Démo'}
                  value={config.hero.ctaSecondaryAr}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, ctaSecondaryAr: e.target.value } })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: AMBASSADOR BANNER & TELEGRAM ================= */}
      {activeSubTab === 'ambassador' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[#111114] border border-white/10 space-y-5">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-400" />
              <span>{isAr ? 'شبكة السفراء وتيليغرام الاعتماد الرسمي' : 'Réseau Ambassadeurs & Contact'}</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {isAr
                ? 'تحكم في الرابط الذي يتم توجيه الطلبة إليه عند الضغط على "كن سفيراً معتمداً" في الصفحة الرئيسية.'
                : 'Configurez le lien Telegram vers lequel les étudiants postulent.'}
            </p>
          </div>

          {/* Telegram Destination Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-sky-500/10 border border-sky-500/30 space-y-3">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold">
              <Send className="w-4 h-4" />
              <span>{isAr ? 'معرّف تيليغرام المخصص لاستقبال طلبات السفراء (Ambassador Applications)' : 'Identifiant Telegram Responsable'}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-2.5 rounded-xl bg-white/10 text-gray-400 font-mono text-xs font-bold">t.me/</span>
              <input aria-label="MrK_ADMIN00"
                value={ambassadorTelegram}
                onChange={(e) => setAmbassadorTelegram(e.target.value)}
                placeholder="MrK_ADMIN00"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono font-bold text-xs focus:outline-none focus:border-sky-400"
              />
            </div>
            <p className="text-[11px] text-gray-400">
              {isAr
                ? 'المعرّف الحالي: t.me/' + ambassadorTelegram + ' — سيتم فتح النافذة المنبثقة وتوجيه المتقدم مباشرة إلى هذه المحادثة.'
                : 'Lien actif : t.me/' + ambassadorTelegram}
            </p>
          </div>

          {/* Banner Texts */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'عنوان قسم السفراء' : 'Titre de la section'}</label>
              <input aria-label={isAr ? 'عنوان قسم السفراء' : 'Titre de la section'}
                value={config.ambassadorBanner.titleAr}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    ambassadorBanner: { ...config.ambassadorBanner, titleAr: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'نص الوصف' : 'Description'}</label>
              <textarea aria-label={isAr ? 'نص الوصف' : 'Description'}
                rows={2}
                value={config.ambassadorBanner.bodyAr}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    ambassadorBanner: { ...config.ambassadorBanner, bodyAr: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'نص زر دليل السفراء (الأصفر)' : 'Bouton Annuaire'}</label>
                <input aria-label={isAr ? 'نص زر دليل السفراء (الأصفر)' : 'Bouton Annuaire'}
                  value={config.ambassadorBanner.ctaPrimaryAr}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      ambassadorBanner: { ...config.ambassadorBanner, ctaPrimaryAr: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'نص زر التقديم (كن سفيراً)' : 'Bouton Candidature'}</label>
                <input aria-label={isAr ? 'نص زر التقديم (كن سفيراً)' : 'Bouton Candidature'}
                  value={config.ambassadorBanner.ctaSecondaryAr}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      ambassadorBanner: { ...config.ambassadorBanner, ctaSecondaryAr: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: FINAL CTA ================= */}
      {activeSubTab === 'finalCta' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[#111114] border border-white/10 space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <Crown className="w-4 h-4 text-lime-400" />
            <span>{isAr ? 'نصوص الصندوق الختامي (Final Call to Action)' : 'Appel à l\'action final'}</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'العنوان الكبير' : 'Titre'}</label>
              <input aria-label={isAr ? 'العنوان الكبير' : 'Titre'}
                value={config.finalCta.titleAr}
                onChange={(e) => setConfig({ ...config, finalCta: { ...config.finalCta, titleAr: e.target.value } })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-lime-400"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'نص الوصف' : 'Description'}</label>
              <input aria-label={isAr ? 'نص الوصف' : 'Description'}
                value={config.finalCta.bodyAr}
                onChange={(e) => setConfig({ ...config, finalCta: { ...config.finalCta, bodyAr: e.target.value } })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-lime-400"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'نص زر إنشاء الحساب (الأخضر)' : 'Texte du bouton'}</label>
              <input aria-label={isAr ? 'نص زر إنشاء الحساب (الأخضر)' : 'Texte du bouton'}
                value={config.finalCta.buttonTextAr}
                onChange={(e) => setConfig({ ...config, finalCta: { ...config.finalCta, buttonTextAr: e.target.value } })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-lime-400 font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= COURSE EDIT / ADD MODAL ================= */}
      <AnimatePresence>
        {isCourseModalOpen && editingCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto no-scrollbar rounded-3xl bg-[#111114] border border-gold-500/40 p-5 sm:p-6 text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-black text-gold-300">
                  {config.featuredCoursesSection.courses.some((c) => c.id === editingCourse.id)
                    ? isAr
                      ? 'تعديل بيانات الدورة / المقياس'
                      : 'Modifier le cours'
                    : isAr
                    ? 'إضافة دورة / مقياس جديد للمعرض'
                    : 'Ajouter un nouveau cours'}
                </h3>
                <button
                  onClick={() => setIsCourseModalOpen(false)}
                  className="text-gray-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Title & Level */}
              <div>
                <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'عنوان الدورة (بالعربية)' : 'Titre du cours'}</label>
                <input aria-label="المراجعة الشاملة في الرياضيات..."
                  value={editingCourse.titleAr}
                  onChange={(e) => setEditingCourse({ ...editingCourse, titleAr: e.target.value })}
                  placeholder="المراجعة الشاملة في الرياضيات..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'التصنيف (Category)' : 'Catégorie'}</label>
                  <select aria-label={isAr ? 'التصنيف (Category)' : 'Catégorie'}
                    value={editingCourse.category}
                    onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#111114] border border-white/10 text-white text-xs focus:outline-none focus:border-gold-400"
                  >
                    <option value="BAC">BAC 2026</option>
                    <option value="UNIVERSITY_LMD">جامعي LMD</option>
                    <option value="MEDICAL">علوم طبية و صيدلة</option>
                    <option value="DEVELOPMENT">برمجة وإعلام آلي</option>
                    <option value="OTHER">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'المستوى المستهدف' : 'Niveau'}</label>
                  <input aria-label="جميع الشعب العلمية"
                    value={editingCourse.levelAr}
                    onChange={(e) => setEditingCourse({ ...editingCourse, levelAr: e.target.value })}
                    placeholder="جميع الشعب العلمية"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              {/* Instructor & Duration & Price */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'اسم الأستاذ' : 'Enseignant'}</label>
                  <input aria-label="د. يوسف منصوري"
                    value={editingCourse.instructorNameAr}
                    onChange={(e) => setEditingCourse({ ...editingCourse, instructorNameAr: e.target.value })}
                    placeholder="د. يوسف منصوري"
                    className="w-full px-2.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'المدة (ساعات)' : 'Heures'}</label>
                  <input aria-label={isAr ? 'المدة (ساعات)' : 'Heures'}
                    type="number"
                    value={editingCourse.durationHours}
                    onChange={(e) => setEditingCourse({ ...editingCourse, durationHours: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'السعر (دج)' : 'Prix DZD'}</label>
                  <input aria-label={isAr ? 'السعر (دج)' : 'Prix DZD'}
                    type="number"
                    value={editingCourse.priceDzd}
                    onChange={(e) => setEditingCourse({ ...editingCourse, priceDzd: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-xl bg-white/5 border border-white/10 text-lime-400 font-mono font-bold text-xs focus:outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              {/* Image Selection (URL Link vs File Upload) */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-gold-300 text-xs font-bold flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isAr ? 'صورة الغلاف (Thumbnail)' : 'Image de couverture'}</span>
                  </label>
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/10 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('URL')}
                      className={`px-2 py-0.5 rounded font-bold ${imageInputMode === 'URL' ? 'bg-gold-500 text-navy-950' : 'text-gray-300'}`}
                    >
                      {isAr ? 'رابط مباشر' : 'Lien URL'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('FILE')}
                      className={`px-2 py-0.5 rounded font-bold ${imageInputMode === 'FILE' ? 'bg-gold-500 text-navy-950' : 'text-gray-300'}`}
                    >
                      {isAr ? 'رفع من الجهاز' : 'Fichier'}
                    </button>
                  </div>
                </div>

                {imageInputMode === 'URL' ? (
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <input aria-label="https://images.unsplash.com/..."
                      value={editingCourse.thumbnailUrl}
                      onChange={(e) => setEditingCourse({ ...editingCourse, thumbnailUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      dir="ltr"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-[11px] focus:outline-none focus:border-gold-400"
                    />
                  </div>
                ) : (
                  <ImageUploader
                    kind="landing"
                    locale={isAr ? 'ar' : 'fr'}
                    value={editingCourse.thumbnailUrl || null}
                    onChange={(url) => setEditingCourse({ ...editingCourse, thumbnailUrl: url || '' })}
                  />
                )}

                {/* Preview */}
                {editingCourse.thumbnailUrl && (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden mt-2 bg-navy-950 border border-white/10">
                    <img src={editingCourse.thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 px-2 py-0.5 rounded bg-black/70 text-[9px] text-gray-300">
                      معاينة الغلاف
                    </span>
                  </div>
                )}
              </div>

              {/* Badge & Popular */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 text-[11px] mb-1 font-semibold">{isAr ? 'نص البادج (Badge)' : 'Badge'}</label>
                  <input aria-label="Bestseller / New / Popular"
                    value={editingCourse.badge || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, badge: e.target.value })}
                    placeholder="Bestseller / New / Popular"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-400"
                  />
                </div>

                <div className="flex items-center pt-5 gap-2">
                  <input
                    type="checkbox"
                    id="isPopular"
                    checked={Boolean(editingCourse.isPopular)}
                    onChange={(e) => setEditingCourse({ ...editingCourse, isPopular: e.target.checked })}
                    className="w-4 h-4 rounded text-gold-500 accent-gold-500"
                  />
                  <label htmlFor="isPopular" className="text-xs text-gray-300 font-semibold cursor-pointer">
                    {isAr ? 'تمييز كدورة شائعة' : 'Marquer comme Populaire'}
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveCourse}
                  className="px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-black text-xs shadow-lg shadow-gold-500/20 active:scale-95 transition-all"
                >
                  {isAr ? 'حفظ الدورة في المعرض' : 'Enregistrer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
