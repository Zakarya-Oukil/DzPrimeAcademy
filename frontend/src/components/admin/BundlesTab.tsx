'use client';

import React, { useEffect, useState } from 'react';
import { ImageUploader } from '@/components/shared/ImageUploader';
import {
  Package,
  Plus,
  Trash2,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Tag,
  Percent,
  Flame,
  ShieldCheck,
  CheckCircle2,
  X,
  TrendingDown,
  Gift,
} from 'lucide-react';
import { formatDZD } from '@/lib/format';

interface BundlesTabProps {
  locale: string;
}

const emptyForm = {
  titleAr: '',
  titleFr: '',
  descriptionAr: '',
  descriptionFr: '',
  track: 'BAC' as const,
  badge: 'OFFRE SPÉCIALE',
  hours: 24,
  lecturesCount: 3,
  originalPriceDzd: 6000,
  currentPriceDzd: 4500,
  colorTheme: 'gold',
  imageUrl: null as string | null,
  isActive: true,
  sortOrder: 0,
};

export const BundlesTab: React.FC<BundlesTabProps> = ({ locale }) => {
  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  // Promotions & Promo Codes State
  const [promotions, setPromotions] = useState<any[]>([]);
  const [ambassadorCodes, setAmbassadorCodes] = useState<any[]>([]);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoForm, setPromoForm] = useState({
    code: '',
    discountPercent: 20,
    descriptionAr: '',
    type: 'CAMPAIGN',
    applicableTrack: 'ALL',
  });
  const [promoMsg, setPromoMsg] = useState('');

  const loadBundles = () => {
    fetch('/api/bundles?all=true')
      .then((r) => r.json())
      .then(setBundles)
      .finally(() => setLoading(false));
  };

  const loadPromotions = () => {
    fetch('/api/promotions')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          if (data.platformPromotions) setPromotions(data.platformPromotions);
          if (data.ambassadorCodes) setAmbassadorCodes(data.ambassadorCodes);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadBundles();
    loadPromotions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/bundles/${editingId}` : '/api/bundles';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      loadBundles();
    }
  };

  const startEdit = (b: any) => {
    setForm({
      titleAr: b.titleAr,
      titleFr: b.titleFr || '',
      descriptionAr: b.descriptionAr,
      descriptionFr: b.descriptionFr || '',
      track: b.track,
      badge: b.badge || '',
      hours: b.hours,
      lecturesCount: b.lecturesCount,
      originalPriceDzd: b.originalPriceDzd,
      currentPriceDzd: b.currentPriceDzd,
      colorTheme: b.colorTheme,
      imageUrl: b.imageUrl ?? null,
      isActive: b.isActive,
      sortOrder: b.sortOrder,
    });
    setEditingId(b.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذه الحزمة؟' : 'Supprimer ce pack ?')) {
      await fetch(`/api/bundles/${id}`, { method: 'DELETE' });
      loadBundles();
    }
  };

  const toggleActive = async (b: any) => {
    await fetch(`/api/bundles/${b.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...b, isActive: !b.isActive }),
    });
    loadBundles();
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoMsg('');
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promoForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoMsg(data.error || 'فشل إنشاء كود التخفيض');
      } else {
        setPromoForm({
          code: '',
          discountPercent: 20,
          descriptionAr: '',
          type: 'CAMPAIGN',
          applicableTrack: 'ALL',
        });
        setShowPromoForm(false);
        loadPromotions();
      }
    } catch {
      setPromoMsg('خطأ في الاتصال');
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (confirm(locale === 'ar' ? 'هل أنت متأكد من حذف كود التخفيض؟' : 'Supprimer ce code promo ?')) {
      await fetch(`/api/promotions?id=${id}`, { method: 'DELETE' });
      loadPromotions();
    }
  };

  // Discount % calculation
  const discountPercent =
    form.originalPriceDzd > 0 && form.currentPriceDzd < form.originalPriceDzd
      ? Math.round((1 - form.currentPriceDzd / form.originalPriceDzd) * 100)
      : 0;

  return (
    <div className="space-y-8 font-arabic" data-testid="bundles-tab">
      {/* Top Banner */}
      <div className="dark p-6 rounded-3xl bg-[#111114] border border-amber-500/40 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-navy-950 flex items-center justify-center font-black shrink-0 shadow-lg shadow-amber-500/20">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-white">
                {locale === 'ar' ? 'مركز العروض، الحزم والترويج (Offers & Promotions)' : 'Centre des Offres & Promotions'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                CHARGÉE COMMERCIALE (Level 80)
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {locale === 'ar'
                ? 'إدارة حزم الامتحانات والعروض الترويجية، ضبط أكواد الخصم، وتحديد نسب التخفيض الوطنية'
                : 'Gestion des packs, offres spéciales, réductions et codes promo pour toute l\'Algérie'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            data-testid="add-bundle-btn"
            onClick={() => {
              setForm(emptyForm);
              setEditingId(null);
              setShowForm(!showForm);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-navy-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{locale === 'ar' ? 'إضافة حزمة أو عرض' : 'Créer un Pack'}</span>
          </button>

          <button
            onClick={() => setShowPromoForm(!showPromoForm)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-1.5 border border-white/15 transition-all"
          >
            <Tag className="w-4 h-4 text-gold-400" />
            <span>{locale === 'ar' ? 'إنشاء كود تخفيض' : 'Nouveau Code Promo'}</span>
          </button>
        </div>
      </div>

      {/* ================= 1. BUNDLES & OFFERS SECTION ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            <span>{locale === 'ar' ? 'حزم الامتحانات والعروض المجمّعة النشطة' : 'Packs d\'Examens & Offres Groupées'}</span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-gray-300 text-[10px] font-mono">
              {bundles.length}
            </span>
          </h3>
        </div>

        {/* Add/Edit Bundle Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            data-testid="add-bundle-form"
            className="dark p-5 rounded-3xl bg-[#111114] border border-amber-400/40 grid grid-cols-1 sm:grid-cols-3 gap-3.5 shadow-2xl relative"
          >
            <div className="sm:col-span-3 flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                {editingId
                  ? (locale === 'ar' ? 'تعديل بيانات الحزمة والعرض' : 'Modifier le Pack')
                  : (locale === 'ar' ? 'إنشاء حزمة أو عرض ترويجي جديد' : 'Nouveau Pack Commercial')}
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              required
              placeholder={locale === 'ar' ? 'العنوان (عربي) — مثال: حزمة الامتياز في الرياضيات' : 'Titre (AR)'}
              value={form.titleAr}
              onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 sm:col-span-2 focus:outline-none focus:border-amber-400"
            />

            <input
              placeholder={locale === 'ar' ? 'شارة العرض (مثال: OFFRE -30% أو BAC 2026)' : 'Badge Commercial'}
              value={form.badge}
              onChange={(e) => setForm({ ...form, badge: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-amber-300 font-bold placeholder-gray-500 focus:outline-none focus:border-amber-400"
            />

            <textarea
              required
              placeholder={locale === 'ar' ? 'وصف العرض والمميزات المتضمنة...' : 'Description (AR)'}
              value={form.descriptionAr}
              onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 sm:col-span-3 focus:outline-none focus:border-amber-400"
              rows={2}
            />

            <select
              value={form.track}
              onChange={(e) => setForm({ ...form, track: e.target.value as any })}
              className="dark px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-xs text-gray-200 focus:outline-none focus:border-amber-400"
            >
              <option value="BAC">BAC (البكالوريا)</option>
              <option value="UNIVERSITY_LMD">University LMD</option>
              <option value="MEDICAL">Medical (العلوم الطبية)</option>
            </select>

            <input
              type="number"
              placeholder={locale === 'ar' ? 'عدد الساعات' : 'Heures'}
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-amber-400"
            />

            <input
              type="number"
              placeholder={locale === 'ar' ? 'عدد المحاضرات' : 'Nb. Lectures'}
              value={form.lecturesCount}
              onChange={(e) => setForm({ ...form, lecturesCount: Number(e.target.value) })}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-amber-400"
            />

            <div>
              <label className="block text-[11px] text-gray-400 mb-1 font-bold">
                {locale === 'ar' ? 'السعر الأصلي بدون تخفيض (DZD):' : 'Prix Original (DZD):'}
              </label>
              <input
                required
                type="number"
                value={form.originalPriceDzd}
                onChange={(e) => setForm({ ...form, originalPriceDzd: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] text-gray-400 mb-1 font-bold">
                {locale === 'ar' ? 'السعر الترويجي بعد الخصم (DZD):' : 'Prix Promo Actuel (DZD):'}
              </label>
              <input
                required
                type="number"
                value={form.currentPriceDzd}
                onChange={(e) => setForm({ ...form, currentPriceDzd: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-lime-400 font-mono font-bold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex flex-col justify-end">
              {discountPercent > 0 && (
                <div className="px-3.5 py-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-black flex items-center justify-between">
                  <span>{locale === 'ar' ? 'نسبة التخفيض المحسوبة:' : 'Remise calculée:'}</span>
                  <span className="font-mono text-sm">-{discountPercent}%</span>
                </div>
              )}
            </div>

            <div className="sm:col-span-3 max-w-md">
              <ImageUploader
                kind="bundle"
                locale={locale}
                label={locale === 'ar' ? 'صورة العرض' : 'Image de l\'offre'}
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
              />
            </div>

            <div className="sm:col-span-3 flex justify-end pt-2">
              <button
                type="submit"
                data-testid="submit-bundle-btn"
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-navy-950 font-black text-xs shadow-md active:scale-95 transition-all"
              >
                {editingId
                  ? (locale === 'ar' ? 'حفظ تعديلات العرض ✓' : 'Enregistrer')
                  : (locale === 'ar' ? 'إطلاق الحزمة والعرض فوراً ✓' : 'Lancer le Pack')}
              </button>
            </div>
          </form>
        )}

        {/* Bundles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {!loading &&
            bundles.map((b) => {
              const packDiscount =
                b.originalPriceDzd > 0 && b.currentPriceDzd < b.originalPriceDzd
                  ? Math.round((1 - b.currentPriceDzd / b.originalPriceDzd) * 100)
                  : 0;

              return (
                <div
                  key={b.id}
                  data-testid={`bundle-card-${b.id}`}
                  className={`p-5 rounded-3xl bg-[#0b0b0d] border space-y-3 shadow-md transition-all ${
                    b.isActive ? 'border-white/10 hover:border-amber-500/40' : 'border-rose-500/30 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-400/15 text-amber-300 text-[10px] font-bold border border-amber-400/20">
                        {b.badge || b.track}
                      </span>
                      {packDiscount > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-400 text-[10px] font-black">
                          -{packDiscount}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        data-testid={`toggle-bundle-${b.id}`}
                        onClick={() => toggleActive(b)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"
                        title={b.isActive ? 'Désactiver' : 'Activer'}
                      >
                        {b.isActive ? (
                          <ToggleRight className="w-5 h-5 text-lime-400" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        data-testid={`edit-bundle-${b.id}`}
                        onClick={() => startEdit(b)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-amber-300"
                        title={locale === 'ar' ? 'تعديل' : 'Modifier'}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        data-testid={`delete-bundle-${b.id}`}
                        onClick={() => handleDelete(b.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-gray-500 hover:text-rose-400"
                        title={locale === 'ar' ? 'حذف' : 'Supprimer'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-white leading-snug">
                    {locale === 'ar' ? b.titleAr : b.titleFr || b.titleAr}
                  </h4>
                  <p className="text-[10px] text-gray-400 line-clamp-2">{b.descriptionAr}</p>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-black text-lime-400">
                        {formatDZD(b.currentPriceDzd, locale)}
                      </span>
                      <span className="text-[11px] text-gray-500 line-through mr-2">
                        {formatDZD(b.originalPriceDzd, locale)}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-gold-400 font-bold">
                      {b.purchasesCount || 0} {locale === 'ar' ? 'مبيعات' : 'achats'}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ================= 2. PROMO CODES & DISCOUNT CAMPAIGNS ================= */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-gold-400" />
              <span>{locale === 'ar' ? 'أكواد التخفيض والحملات الترويجية (Promo Codes)' : 'Codes Promo & Réductions'}</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {locale === 'ar'
                ? 'أكواد تخفيض صالحة للطلبة عند الدفع واقتناء الحزم أو العضويات'
                : 'Codes promotionnels applicables au paiement par les étudiants'}
            </p>
          </div>

          <button
            onClick={() => setShowPromoForm(!showPromoForm)}
            className="px-3.5 py-2 rounded-xl bg-gold-400/20 border border-gold-400/40 text-gold-300 font-bold text-xs flex items-center gap-1.5 hover:bg-gold-400/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{locale === 'ar' ? 'إضافة كود تخفيض' : 'Nouveau Code'}</span>
          </button>
        </div>

        {/* Promo Code Form */}
        {showPromoForm && (
          <form
            onSubmit={handleCreatePromo}
            className="dark p-5 rounded-3xl bg-[#111114] border border-gold-400/40 grid grid-cols-1 sm:grid-cols-4 gap-3 shadow-xl relative"
          >
            <div className="sm:col-span-4 flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-black text-gold-300 flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                <span>{locale === 'ar' ? 'إنشاء كود خصم رسمي جديد' : 'Créer un Code Promo'}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPromoForm(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {promoMsg && (
              <p className="sm:col-span-4 text-xs font-bold text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                {promoMsg}
              </p>
            )}

            <input
              required
              placeholder="رمز الكود (مثال: BAC20, PROMO2026)"
              value={promoForm.code}
              onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gold-300 font-mono font-black placeholder-gray-500 focus:outline-none focus:border-gold-400"
            />

            <div>
              <input
                required
                type="number"
                min="5"
                max="90"
                placeholder="نسبة الخصم %"
                value={promoForm.discountPercent}
                onChange={(e) => setPromoForm({ ...promoForm, discountPercent: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-gold-400"
              />
            </div>

            <input
              required
              placeholder="وصف الحملة الترويجية"
              value={promoForm.descriptionAr}
              onChange={(e) => setPromoForm({ ...promoForm, descriptionAr: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 sm:col-span-2 focus:outline-none focus:border-gold-400"
            />

            <div className="sm:col-span-4 flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-black text-xs shadow-md transition-all"
              >
                {locale === 'ar' ? 'تفعيل ونشر كود التخفيض ✓' : 'Activer le Code'}
              </button>
            </div>
          </form>
        )}

        {/* Promo Codes Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {promotions.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between hover:border-gold-500/30 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-gold-300 bg-gold-400/10 px-2.5 py-0.5 rounded-lg border border-gold-400/30">
                    {p.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black">
                    -{p.discountPercent}%
                  </span>
                </div>
                <p className="text-[11px] text-gray-300">{p.descriptionAr}</p>
                <p className="text-[10px] text-gray-500 font-mono">
                  {p.usageCount || 0} {locale === 'ar' ? 'استخدام مسجل' : 'utilisations'}
                </p>
              </div>

              <button
                onClick={() => handleDeletePromo(p.id)}
                className="p-2 rounded-xl hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
