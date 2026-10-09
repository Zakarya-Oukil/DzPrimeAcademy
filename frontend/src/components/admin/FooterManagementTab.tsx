'use client';

import React, { useState, useEffect } from 'react';
import {
  Save,
  Plus,
  Trash2,
  Edit3,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Globe,
  Share2,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Layers,
  HelpCircle,
  Bot,
  CreditCard,
  Video,
  Smartphone,
  Shield,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DEFAULT_FOOTER_CONFIG,
  FooterConfig,
  FooterSocialLink,
  FooterQuickLink,
  FooterEcosystemItem,
  SUPPORTED_SOCIAL_PLATFORMS,
  SocialPlatformType,
  getPlatformMeta,
} from '@/lib/footerConfig';
import { DzPrimeLogo } from '../shared/DzPrimeLogo';

interface FooterManagementTabProps {
  locale: string;
}

export const FooterManagementTab: React.FC<FooterManagementTabProps> = ({ locale }) => {
  const isAr = locale === 'ar';

  const [config, setConfig] = useState<FooterConfig>(DEFAULT_FOOTER_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [showLivePreview, setShowLivePreview] = useState(true);

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<
    'social' | 'contact' | 'bio' | 'quickLinks' | 'ecosystem' | 'bottomBar'
  >('social');

  // Fetch current footer configuration from API
  useEffect(() => {
    fetch('/api/settings/footer')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === 'object' && data.brandBio) {
          setConfig(data);
        }
      })
      .catch((err) => console.error('Failed to load footer configuration:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      const res = await fetch('/api/settings/footer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSaveSuccess(
          isAr
            ? 'تم حفظ كافة تعديلات تذييل الموقع وتحديثه فوراً عبر المنصة بنجاح ✓'
            : 'Le pied de page a été mis à jour avec succès ✓'
        );

        // Dispatch live event to update Footer.tsx in real-time
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('dzprime-footer-updated', { detail: config })
          );
        }

        setTimeout(() => setSaveSuccess(''), 4000);
      } else {
        setSaveError(data.error || (isAr ? 'فشل حفظ التعديلات' : 'Échec de la sauvegarde'));
      }
    } catch (err: any) {
      setSaveError(err.message || (isAr ? 'خطأ في الاتصال بالخادم' : 'Erreur de connexion'));
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (
      window.confirm(
        isAr
          ? 'هل أنت متأكد من استعادة كافة الإعدادات الافتراضية لتذييل الموقع؟'
          : 'Voulez-vous vraiment réinitialiser le pied de page par défaut ?'
      )
    ) {
      setConfig(DEFAULT_FOOTER_CONFIG);
    }
  };

  // ================= Social Links Handlers =================
  const handleAddSocialLink = () => {
    const newLink: FooterSocialLink = {
      id: `sl-${Date.now()}`,
      platform: 'facebook',
      title: 'Facebook Page',
      url: 'https://facebook.com/dzprimeacademy',
      enabled: true,
    };

    setConfig((prev) => ({
      ...prev,
      socialLinks: [newLink, ...prev.socialLinks],
    }));
  };

  const handleUpdateSocialLink = (
    id: string,
    field: keyof FooterSocialLink,
    value: any
  ) => {
    setConfig((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // If platform changed, auto-suggest title & placeholder
          if (field === 'platform') {
            const meta = getPlatformMeta(value);
            updated.title = meta.labelAr;
            if (!updated.url || updated.url === 'https://') {
              updated.url = meta.defaultPlaceholder;
            }
          }
          return updated;
        }
        return item;
      }),
    }));
  };

  const handleDeleteSocialLink = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((s) => s.id !== id),
    }));
  };

  const handleMoveSocialLink = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= config.socialLinks.length) return;

    const newLinks = [...config.socialLinks];
    const [moved] = newLinks.splice(index, 1);
    newLinks.splice(targetIndex, 0, moved);

    setConfig((prev) => ({ ...prev, socialLinks: newLinks }));
  };

  // ================= Quick Links Handlers =================
  const handleAddQuickLink = () => {
    const newQuick: FooterQuickLink = {
      id: `ql-${Date.now()}`,
      labelAr: 'رابط جديد',
      labelFr: 'Nouveau Lien',
      url: '/',
      iconName: 'link',
      enabled: true,
    };
    setConfig((prev) => ({
      ...prev,
      quickLinks: [...prev.quickLinks, newQuick],
    }));
  };

  const handleUpdateQuickLink = (id: string, field: keyof FooterQuickLink, value: any) => {
    setConfig((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.map((q) => (q.id === id ? { ...q, [field]: value } : q)),
    }));
  };

  const handleDeleteQuickLink = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.filter((q) => q.id !== id),
    }));
  };

  // ================= Ecosystem Handlers =================
  const handleAddEcosystemItem = () => {
    const newItem: FooterEcosystemItem = {
      id: `eco-${Date.now()}`,
      name: 'منصة جديدة',
      subtextAr: 'وصف الخدمة',
      subtextFr: 'Description',
      iconName: 'globe',
      url: '/',
      enabled: true,
    };
    setConfig((prev) => ({
      ...prev,
      ecosystemItems: [...prev.ecosystemItems, newItem],
    }));
  };

  const handleUpdateEcosystemItem = (id: string, field: keyof FooterEcosystemItem, value: any) => {
    setConfig((prev) => ({
      ...prev,
      ecosystemItems: prev.ecosystemItems.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  };

  const handleDeleteEcosystemItem = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      ecosystemItems: prev.ecosystemItems.filter((e) => e.id !== id),
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
        <span className="text-xs text-gray-400 font-mono">
          {isAr ? 'جارٍ تحميل إعدادات تذييل الموقع...' : 'Chargement de la configuration du footer...'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="footer-management-tab">
      {/* Tab Header Banner */}
      <div className="dark p-6 rounded-3xl bg-[#111114] border border-gold-500/20 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-gold-400">
                <Share2 className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isAr ? 'إدارة تذييل الموقع والروابط الرسمية (Footer Control)' : 'Gestion du Pied de Page & Réseaux'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 max-w-2xl leading-relaxed">
              {isAr
                ? 'أضف، عدّل أو احذف روابط منصات التواصل (فيسبوك، تيك توك، يوتيوب، تيليغرام، واتساب، لينكد إن...) مع تحديد الأيقونة تلقائياً عبر القائمة المنسدلة، وتحكم في بيانات الاتصال ونصوص التذييل.'
                : 'Ajoutez, modifiez ou supprimez les liens sociaux avec sélection automatique des icônes (WhatsApp, Telegram, Facebook, TikTok, YouTube, LinkedIn...), coordonnées et textes officiels.'}
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowLivePreview(!showLivePreview)}
              className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 transition-all"
            >
              {showLivePreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showLivePreview ? (isAr ? 'إخفاء المعاينة' : 'Masquer Aperçu') : (isAr ? 'معاينة حية' : 'Aperçu Direct')}</span>
            </button>

            <button
              onClick={handleResetToDefaults}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isAr ? 'استعادة الافتراضي' : 'Réinitialiser'}</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              data-testid="footer-save-all-btn"
              className="px-5 py-2.5 rounded-xl bg-gold-400 hover:bg-gold-500 text-navy-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-gold-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? (isAr ? 'جارٍ الحفظ...' : 'Enregistrement...') : (isAr ? 'حفظ كافة التعديلات' : 'Enregistrer les Modifications')}</span>
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>{saveSuccess}</span>
          </motion.div>
        )}
        {saveError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </motion.div>
        )}
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="dark flex items-center gap-1.5 p-1 rounded-2xl bg-[#0b0b0d] border border-white/10 overflow-x-auto no-scrollbar shadow-md">
        {[
          { id: 'social', labelAr: 'منصات التواصل الاجتماعي', labelFr: 'Réseaux Sociaux', icon: Share2, count: config.socialLinks.length },
          { id: 'contact', labelAr: 'معلومات الاتصال والعناوين', labelFr: 'Coordonnées & Adresses', icon: Phone },
          { id: 'bio', labelAr: 'نبذة المنصة والوصف', labelFr: 'Bio & Description', icon: Sparkles },
          { id: 'quickLinks', labelAr: 'الروابط السريعة', labelFr: 'Liens Rapides', icon: Layers, count: config.quickLinks.length },
          { id: 'ecosystem', labelAr: 'المنظومة الرقمية', labelFr: 'Écosystème Digital', icon: Globe, count: config.ecosystemItems.length },
          { id: 'bottomBar', labelAr: 'حقوق الملكية والشعار', labelFr: 'Copyright & Slogan', icon: Award },
        ].map((sub) => {
          const Icon = sub.icon;
          const active = activeSubTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                active
                  ? 'bg-gold-500 text-navy-950 shadow-md font-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{isAr ? sub.labelAr : sub.labelFr}</span>
              {sub.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    active ? 'bg-slate-950 text-gold-400' : 'bg-white/10 text-gray-300'
                  }`}
                >
                  {sub.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-Tab Contents */}
      <div className="grid grid-cols-1 gap-6">
        {/* ================= 1. SOCIAL MEDIA SUB-TAB ================= */}
        {activeSubTab === 'social' && (
          <div className="space-y-4" data-testid="footer-subtab-social">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{isAr ? 'قائمة منصات التواصل في التذييل' : 'Réseaux Sociaux du Footer'}</span>
                  <span className="text-xs text-gold-400 font-mono font-normal">
                    ({config.socialLinks.filter((s) => s.enabled).length} {isAr ? 'مفعلة' : 'actifs'})
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isAr
                    ? 'اختر المنصة من القائمة المنسدلة وسيقوم النظام بتعيين الأيقونة ولون العلامة التجارية تلقائياً.'
                    : 'Sélectionnez une plateforme, l\'icône et les styles officiels seront appliqués automatiquement.'}
                </p>
              </div>

              <button
                onClick={handleAddSocialLink}
                data-testid="add-social-link-btn"
                className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-gold-500/20 active:scale-95 transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'إضافة منصة جديدة' : 'Ajouter une Plateforme'}</span>
              </button>
            </div>

            {/* Social Links Cards */}
            <div className="space-y-3">
              {config.socialLinks.map((item, index) => {
                const meta = getPlatformMeta(item.platform);
                const IconComp = meta.icon;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl border transition-all ${
                      item.enabled
                        ? 'bg-[#111114] border-white/10 hover:border-gold-500/30'
                        : 'bg-white/[0.01] border-white/5 opacity-60'
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
                      {/* Platform Icon Preview & Dropdown (Cols: 4) */}
                      <div className="md:col-span-4 flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 transition-colors shadow-sm ${meta.bgLight}`}
                          title={meta.labelAr}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <label className="text-[10px] text-gray-400 block mb-1">
                            {isAr ? 'نوع المنصة (القائمة المنسدلة):' : 'Plateforme :'}
                          </label>
                          <select aria-label={isAr ? 'نوع المنصة (القائمة المنسدلة):' : 'Plateforme :'}
                            data-testid={`social-platform-select-${item.id}`}
                            value={item.platform}
                            onChange={(e) =>
                              handleUpdateSocialLink(item.id, 'platform', e.target.value as SocialPlatformType)
                            }
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-bold focus:border-gold-400 outline-none cursor-pointer"
                          >
                            {SUPPORTED_SOCIAL_PLATFORMS.map((p) => (
                              <option key={p.type} value={p.type} className="bg-slate-900 text-white">
                                {isAr ? p.labelAr : p.labelFr}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Title & URL Inputs (Cols: 5) */}
                      <div className="md:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">
                            {isAr ? 'عنوان الرابط / الوصف:' : 'Titre :'}
                          </label>
                          <input aria-label={meta.labelAr}
                            type="text"
                            value={item.title}
                            onChange={(e) => handleUpdateSocialLink(item.id, 'title', e.target.value)}
                            placeholder={meta.labelAr}
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-medium focus:border-gold-400 outline-none font-arabic"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">
                            {isAr ? 'الرابط المباشر (URL):' : 'Lien URL :'}
                          </label>
                          <div className="relative">
                            <input aria-label={meta.defaultPlaceholder}
                              type="url"
                              value={item.url}
                              onChange={(e) => handleUpdateSocialLink(item.id, 'url', e.target.value)}
                              placeholder={meta.defaultPlaceholder}
                              className="w-full px-3 py-1.5 pr-8 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono focus:border-gold-400 outline-none"
                              dir="ltr"
                            />
                            {item.url && item.url.startsWith('http') && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold-400 transition-colors"
                                title={isAr ? 'اختبار الرابط' : 'Tester le lien'}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controls: Enable, Move, Delete (Cols: 3) */}
                      <div className="md:col-span-3 flex items-center justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                        {/* Toggle Active */}
                        <button
                          type="button"
                          onClick={() => handleUpdateSocialLink(item.id, 'enabled', !item.enabled)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                            item.enabled
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-white/5 text-gray-400 border border-white/10'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${item.enabled ? 'bg-emerald-400' : 'bg-gray-500'}`}
                          />
                          <span>{item.enabled ? (isAr ? 'مفعل' : 'Actif') : (isAr ? 'معطل' : 'Inactif')}</span>
                        </button>

                        {/* Reorder Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveSocialLink(index, 'up')}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-300 transition-all"
                            title={isAr ? 'تحريك لأعلى' : 'Monter'}
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === config.socialLinks.length - 1}
                            onClick={() => handleMoveSocialLink(index, 'down')}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-300 transition-all"
                            title={isAr ? 'تحريك لأسفل' : 'Descendre'}
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSocialLink(item.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                          title={isAr ? 'حذف المنصة' : 'Supprimer'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {config.socialLinks.length === 0 && (
                <div className="p-8 text-center rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
                  <p className="text-xs text-gray-400">{isAr ? 'لا توجد منصات مضافة حالياً.' : 'Aucun réseau configuré.'}</p>
                  <button
                    onClick={handleAddSocialLink}
                    className="text-xs text-gold-400 font-bold hover:underline"
                  >
                    {isAr ? '+ أضف أول منصة تواصل الآن' : '+ Ajouter un réseau'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= 2. CONTACT DETAILS SUB-TAB ================= */}
        {activeSubTab === 'contact' && (
          <div className="dark p-6 rounded-3xl bg-[#111114] border border-white/10 space-y-5" data-testid="footer-subtab-contact">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold-400" />
                <span>{isAr ? 'بيانات الاتصال والتواصل المعتمدة' : 'Coordonnées Officielles'}</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {isAr
                  ? 'هذه المعلومات تظهر مباشرة في العمود الرابع من التذييل وفي شاشات الدعم.'
                  : 'Ces informations apparaissent dans la 4ème colonne du pied de page et les écrans de contact.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gold-400" />
                  <span>{isAr ? 'رقم الهاتف الرسمي:' : 'Numéro de Téléphone :'}</span>
                </label>
                <input aria-label="+213 (0) 555 93 54 20"
                  type="text"
                  value={config.contactInfo.phone}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, phone: e.target.value },
                    }))
                  }
                  dir="ltr"
                  placeholder="+213 (0) 555 93 54 20"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono focus:border-gold-400 outline-none"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gold-400" />
                  <span>{isAr ? 'البريد الإلكتروني الرسمي:' : 'Email Officiel :'}</span>
                </label>
                <input aria-label="contact@dzprimeacademy.live"
                  type="email"
                  value={config.contactInfo.email}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, email: e.target.value },
                    }))
                  }
                  dir="ltr"
                  placeholder="contact@dzprimeacademy.live"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono focus:border-gold-400 outline-none"
                />
              </div>

              {/* Address (Arabic) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gold-400" />
                  <span>{isAr ? 'العنوان وتغطية الولايات (بالعربية):' : 'Adresse & Couverture (Arabe) :'}</span>
                </label>
                <input aria-label="58 ولاية • الجزائر العاصمة، الجزائر"
                  type="text"
                  value={config.contactInfo.addressAr}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, addressAr: e.target.value },
                    }))
                  }
                  placeholder="58 ولاية • الجزائر العاصمة، الجزائر"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-medium focus:border-gold-400 outline-none font-arabic"
                />
              </div>

              {/* Address (French) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gold-400" />
                  <span>{isAr ? 'العنوان وتغطية الولايات (بالفرنسية):' : 'Adresse & Couverture (Français) :'}</span>
                </label>
                <input aria-label="58 Wilayas • Alger, Algérie"
                  type="text"
                  value={config.contactInfo.addressFr}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, addressFr: e.target.value },
                    }))
                  }
                  placeholder="58 Wilayas • Alger, Algérie"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-medium focus:border-gold-400 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= 3. BRAND BIO SUB-TAB ================= */}
        {activeSubTab === 'bio' && (
          <div className="dark p-6 rounded-3xl bg-[#111114] border border-white/10 space-y-5" data-testid="footer-subtab-bio">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold-400" />
                <span>{isAr ? 'نبذة المنصة والوصف التعريفي' : 'Description de la Plateforme'}</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {isAr
                  ? 'يظهر هذا النص أسفل شعار DZ Prime Academy في العمود الأول للتذييل.'
                  : 'Ce texte apparaît sous le logo DZ Prime Academy dans la 1ère colonne du pied de page.'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">
                  {isAr ? 'الوصف باللغة العربية:' : 'Description en Arabe :'}
                </label>
                <textarea aria-label={isAr ? 'الوصف باللغة العربية:' : 'Description en Arabe :'}
                  rows={3}
                  value={config.brandBio.descriptionAr}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      brandBio: { ...prev.brandBio, descriptionAr: e.target.value },
                    }))
                  }
                  className="w-full p-3.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs leading-relaxed focus:border-gold-400 outline-none font-arabic"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">
                  {isAr ? 'الوصف باللغة الفرنسية:' : 'Description en Français :'}
                </label>
                <textarea aria-label={isAr ? 'الوصف باللغة الفرنسية:' : 'Description en Français :'}
                  rows={3}
                  value={config.brandBio.descriptionFr}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      brandBio: { ...prev.brandBio, descriptionFr: e.target.value },
                    }))
                  }
                  className="w-full p-3.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs leading-relaxed focus:border-gold-400 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= 4. QUICK LINKS SUB-TAB ================= */}
        {activeSubTab === 'quickLinks' && (
          <div className="space-y-4" data-testid="footer-subtab-quicklinks">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{isAr ? 'الروابط السريعة (Quick Links)' : 'Liens Rapides du Footer'}</span>
                  <span className="text-xs text-gold-400 font-mono font-normal">
                    ({config.quickLinks.filter((q) => q.enabled).length} {isAr ? 'مفعلة' : 'actifs'})
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isAr
                    ? 'الروابط المعروضة في العمود الثاني للتنقل السريع داخل المنصة.'
                    : 'Liens affichés dans la 2ème colonne pour la navigation.'}
                </p>
              </div>

              <button
                onClick={handleAddQuickLink}
                className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-gold-500/20 active:scale-95 transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'إضافة رابط سريع' : 'Ajouter un Lien'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {config.quickLinks.map((link) => (
                <div
                  key={link.id}
                  className="dark p-4 rounded-2xl bg-[#111114] border border-white/10 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                >
                  <div className="md:col-span-3">
                    <label className="text-[10px] text-gray-400 block mb-1">
                      {isAr ? 'العنوان بالعربية:' : 'Titre (Arabe) :'}
                    </label>
                    <input aria-label={isAr ? 'العنوان بالعربية:' : 'Titre (Arabe) :'}
                      type="text"
                      value={link.labelAr}
                      onChange={(e) => handleUpdateQuickLink(link.id, 'labelAr', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-arabic focus:border-gold-400 outline-none"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-[10px] text-gray-400 block mb-1">
                      {isAr ? 'العنوان بالفرنسية:' : 'Titre (Français) :'}
                    </label>
                    <input aria-label={isAr ? 'العنوان بالفرنسية:' : 'Titre (Français) :'}
                      type="text"
                      value={link.labelFr}
                      onChange={(e) => handleUpdateQuickLink(link.id, 'labelFr', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:border-gold-400 outline-none"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-[10px] text-gray-400 block mb-1">
                      {isAr ? 'مسار الرابط (URL):' : 'Chemin URL :'}
                    </label>
                    <input aria-label={isAr ? 'مسار الرابط (URL):' : 'Chemin URL :'}
                      type="text"
                      value={link.url}
                      onChange={(e) => handleUpdateQuickLink(link.id, 'url', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono focus:border-gold-400 outline-none"
                      dir="ltr"
                    />
                  </div>

                  <div className="md:col-span-3 flex items-center justify-end gap-2 pt-2 md:pt-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuickLink(link.id, 'enabled', !link.enabled)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        link.enabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-white/5 text-gray-400 border border-white/10'
                      }`}
                    >
                      {link.enabled ? (isAr ? 'مفعل' : 'Actif') : (isAr ? 'معطل' : 'Inactif')}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteQuickLink(link.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= 5. ECOSYSTEM SUB-TAB ================= */}
        {activeSubTab === 'ecosystem' && (
          <div className="space-y-4" data-testid="footer-subtab-ecosystem">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{isAr ? 'عناصر المنظومة الرقمية (Digital Ecosystem)' : 'Écosystème Numérique'}</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isAr
                    ? 'المربعات المعروضة في العمود الثالث للتذييل (مثل: Telegram, Assistant, Web Portal, Mobile App).'
                    : 'Les tuiles affichées dans la 3ème colonne.'}
                </p>
              </div>

              <button
                onClick={handleAddEcosystemItem}
                className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-gold-500/20 active:scale-95 transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'إضافة منصة للمنظومة' : 'Ajouter un Élément'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {config.ecosystemItems.map((eco) => (
                <div
                  key={eco.id}
                  className="dark p-4 rounded-2xl bg-[#111114] border border-white/10 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                >
                  <div className="md:col-span-3">
                    <label className="text-[10px] text-gray-400 block mb-1">
                      {isAr ? 'اسم المنصة:' : 'Nom :'}
                    </label>
                    <input aria-label={isAr ? 'اسم المنصة:' : 'Nom :'}
                      type="text"
                      value={eco.name}
                      onChange={(e) => handleUpdateEcosystemItem(eco.id, 'name', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-bold focus:border-gold-400 outline-none"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-[10px] text-gray-400 block mb-1">
                      {isAr ? 'الوصف الفرعي (عربي):' : 'Sous-texte (Arabe) :'}
                    </label>
                    <input aria-label={isAr ? 'الوصف الفرعي (عربي):' : 'Sous-texte (Arabe) :'}
                      type="text"
                      value={eco.subtextAr || ''}
                      onChange={(e) => handleUpdateEcosystemItem(eco.id, 'subtextAr', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-arabic focus:border-gold-400 outline-none"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-[10px] text-gray-400 block mb-1">
                      {isAr ? 'الرابط (URL):' : 'Lien (URL) :'}
                    </label>
                    <input aria-label={isAr ? 'الرابط (URL):' : 'Lien (URL) :'}
                      type="text"
                      value={eco.url || ''}
                      onChange={(e) => handleUpdateEcosystemItem(eco.id, 'url', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono focus:border-gold-400 outline-none"
                      dir="ltr"
                    />
                  </div>

                  <div className="md:col-span-3 flex items-center justify-end gap-2 pt-2 md:pt-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateEcosystemItem(eco.id, 'enabled', !eco.enabled)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        eco.enabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-white/5 text-gray-400 border border-white/10'
                      }`}
                    >
                      {eco.enabled ? (isAr ? 'مفعل' : 'Actif') : (isAr ? 'معطل' : 'Inactif')}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteEcosystemItem(eco.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= 6. BOTTOM BAR SUB-TAB ================= */}
        {activeSubTab === 'bottomBar' && (
          <div className="dark p-6 rounded-3xl bg-[#111114] border border-white/10 space-y-5" data-testid="footer-subtab-bottombar">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-gold-400" />
                <span>{isAr ? 'الشريط السفلي، حقوق الملكية والشعار الوطني' : 'Barre Inférieure & Slogan'}</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {isAr
                  ? 'السطر الأخير في أسفل الموقع المتضمن سنة الحقوق وشعار فخر المنظومة التعليمية.'
                  : 'La dernière ligne du site avec les droits d\'auteur et le slogan.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">
                  {isAr ? 'نص الحقوق (بالعربية):' : 'Droits d\'auteur (Arabe) :'}
                </label>
                <input aria-label={isAr ? 'نص الحقوق (بالعربية):' : 'Droits d\'auteur (Arabe) :'}
                  type="text"
                  value={config.bottomBar.copyrightAr}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      bottomBar: { ...prev.bottomBar, copyrightAr: e.target.value },
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-arabic focus:border-gold-400 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">
                  {isAr ? 'نص الحقوق (بالفرنسية):' : 'Droits d\'auteur (Français) :'}
                </label>
                <input aria-label={isAr ? 'نص الحقوق (بالفرنسية):' : 'Droits d\'auteur (Français) :'}
                  type="text"
                  value={config.bottomBar.copyrightFr}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      bottomBar: { ...prev.bottomBar, copyrightFr: e.target.value },
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:border-gold-400 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">
                  {isAr ? 'الشعار الوطني (بالعربية):' : 'Slogan National (Arabe) :'}
                </label>
                <input aria-label={isAr ? 'الشعار الوطني (بالعربية):' : 'Slogan National (Arabe) :'}
                  type="text"
                  value={config.bottomBar.sloganAr}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      bottomBar: { ...prev.bottomBar, sloganAr: e.target.value },
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-arabic focus:border-gold-400 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">
                  {isAr ? 'الشعار الوطني (بالفرنسية):' : 'Slogan National (Français) :'}
                </label>
                <input aria-label={isAr ? 'الشعار الوطني (بالفرنسية):' : 'Slogan National (Français) :'}
                  type="text"
                  value={config.bottomBar.sloganFr}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      bottomBar: { ...prev.bottomBar, sloganFr: e.target.value },
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:border-gold-400 outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= 7. LIVE INTERACTIVE FOOTER PREVIEW ================= */}
      {showLivePreview && (
        <div className="space-y-3 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-gold-400 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{isAr ? 'معاينة تذييل الموقع المباشرة (Live Preview)' : 'Aperçu Direct du Pied de Page'}</span>
            </h3>
            <span className="text-[11px] text-gray-400 font-mono">
              {isAr ? 'يتم التحديث لحظياً أثناء التعديل' : 'Mise à jour en direct'}
            </span>
          </div>

          <div className="dark rounded-3xl border border-gold-500/30 overflow-hidden bg-[#0b0b0d] shadow-2xl relative">
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-6 border-b border-white/10">
                {/* Col 1 */}
                <div className="space-y-3">
                  <DzPrimeLogo size={36} showText={true} />
                  <p className="text-xs text-gray-300 leading-relaxed font-arabic">
                    {isAr ? config.brandBio.descriptionAr : config.brandBio.descriptionFr}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {config.socialLinks
                      .filter((s) => s.enabled)
                      .map((s) => {
                        const meta = getPlatformMeta(s.platform);
                        const Icon = meta.icon;
                        return (
                          <div
                            key={s.id}
                            className={`w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 ${meta.hoverClass} shadow-sm`}
                            title={s.title || meta.labelAr}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Col 2 */}
                <div className="space-y-2.5 text-xs font-arabic">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-gold-400">
                    {isAr ? 'الرئيسية ولوحة التحكم' : 'Accueil & Dashboard'}
                  </h4>
                  <ul className="space-y-1.5 text-gray-300">
                    {config.quickLinks
                      .filter((q) => q.enabled)
                      .map((q) => (
                        <li key={q.id} className="flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-gold-400" />
                          <span>{isAr ? q.labelAr : q.labelFr}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Col 3 */}
                <div className="space-y-2.5 text-xs font-arabic">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-gold-400">
                    {isAr ? 'منظومتنا الرقمية' : 'Écosystème Numérique'}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {config.ecosystemItems
                      .filter((e) => e.enabled)
                      .map((eco) => (
                        <div
                          key={eco.id}
                          className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-1.5 text-gray-300"
                        >
                          <Globe className="w-3 h-3 text-sky-400" />
                          <span className="truncate">{eco.name}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Col 4 */}
                <div className="space-y-2.5 text-xs font-arabic">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-gold-400">
                    {isAr ? 'بيانات التواصل' : 'Contact'}
                  </h4>
                  <div className="space-y-1.5 text-gray-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-gold-400" />
                      <span dir="ltr" className="font-mono text-[11px]">
                        {config.contactInfo.phone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 text-gold-400" />
                      <span className="font-mono text-[11px]">
                        {config.contactInfo.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-gold-400" />
                      <span className="text-[11px]">
                        {isAr ? config.contactInfo.addressAr : config.contactInfo.addressFr}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom bar preview */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400 font-arabic">
                <p>© {new Date().getFullYear()} DZ PRIME ACADEMY. {isAr ? config.bottomBar.copyrightAr : config.bottomBar.copyrightFr}</p>
                <p className="font-bold text-gold-400">
                  {isAr ? config.bottomBar.sloganAr : config.bottomBar.sloganFr}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Save Bar Sticky */}
      <div className="p-4 rounded-2xl bg-[#111114]/90 border border-gold-500/30 flex items-center justify-between gap-4 shadow-xl">
        <span className="text-xs text-gray-300 font-arabic hidden sm:inline">
          {isAr
            ? 'تأكد من الضغط على زر الحفظ لتطبيق التغييرات على كافة صفحات المنصة.'
            : 'N\'oubliez pas d\'enregistrer pour appliquer les modifications.'}
        </span>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gold-400 hover:bg-gold-500 text-navy-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-gold-500/25 active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? (isAr ? 'جارٍ الحفظ...' : 'Enregistrement...') : (isAr ? 'حفظ كافة التعديلات الآن' : 'Enregistrer Maintenant')}</span>
        </button>
      </div>
    </div>
  );
};
