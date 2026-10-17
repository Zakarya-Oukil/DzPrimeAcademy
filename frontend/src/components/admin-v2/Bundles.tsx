'use client';

import React, { useEffect, useState } from 'react';
import { Btn, Empty, Field, PageHead, SelectInput, Status, TextInput, Toggle, fieldClass, focus, useTx } from '@/components/student-v2/ui';
import { Banner, Dialog } from '@/components/shared-v2/Dialog';
import { ImageField } from '@/components/teacher-v2/MediaFields';
import { formatDZD } from '@/lib/format';
import { trackLabel } from '@/lib/courseDisplay';
import { Actions, CardGrid, Col, ConfirmDialog, DataTable, FormGrid, H2, InfoCard, RowAction } from './ui';

const emptyForm = {
  titleAr: '', titleFr: '', descriptionAr: '', descriptionFr: '', track: 'BAC' as string, badge: 'OFFRE SPÉCIALE',
  hours: 24, lecturesCount: 3, originalPriceDzd: 6000, currentPriceDzd: 4500, colorTheme: 'gold',
  imageUrl: null as string | null, isActive: true, sortOrder: 0,
};
const emptyPromo = { code: '', discountPercent: 20, descriptionAr: '', type: 'CAMPAIGN', applicableTrack: 'ALL' };

/** Offers and discount codes (Figma page 31, "Offers and codes"). Same API as the old tab. */
export const BundlesSection: React.FC = () => {
  const { tx, locale } = useTx();
  const [bundles, setBundles] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [bundleOpen, setBundleOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoForm, setPromoForm] = useState(emptyPromo);
  const [promoMsg, setPromoMsg] = useState('');
  const [delBundle, setDelBundle] = useState<any | null>(null);
  const [delPromo, setDelPromo] = useState<any | null>(null);

  const loadBundles = () => { fetch('/api/bundles?all=true').then((r) => r.json()).then((d) => setBundles(Array.isArray(d) ? d : [])).catch(() => {}); };
  const loadPromos = () => {
    fetch('/api/promotions').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.platformPromotions) setPromos(d.platformPromotions); }).catch(() => {});
  };
  useEffect(() => { loadBundles(); loadPromos(); }, []);

  const openNew = () => { setEditingId(null); setForm(emptyForm); setBundleOpen(true); };
  const openEdit = (b: any) => {
    setForm({ titleAr: b.titleAr, titleFr: b.titleFr || '', descriptionAr: b.descriptionAr, descriptionFr: b.descriptionFr || '', track: b.track, badge: b.badge || '', hours: b.hours, lecturesCount: b.lecturesCount, originalPriceDzd: b.originalPriceDzd, currentPriceDzd: b.currentPriceDzd, colorTheme: b.colorTheme, imageUrl: b.imageUrl ?? null, isActive: b.isActive, sortOrder: b.sortOrder });
    setEditingId(b.id); setBundleOpen(true);
  };

  const saveBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(editingId ? `/api/bundles/${editingId}` : '/api/bundles', { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setBundleOpen(false); setEditingId(null); setForm(emptyForm); loadBundles(); }
  };
  const toggleActive = async (b: any) => {
    await fetch(`/api/bundles/${b.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...b, isActive: !b.isActive }) });
    loadBundles();
  };
  const removeBundle = async () => { if (!delBundle) return; await fetch(`/api/bundles/${delBundle.id}`, { method: 'DELETE' }); setDelBundle(null); loadBundles(); };

  const savePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoMsg('');
    try {
      const res = await fetch('/api/promotions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(promoForm) });
      const data = await res.json();
      if (!res.ok) { setPromoMsg(data.error || tx('فشل إنشاء كود التخفيض', 'Échec de la création du code', 'Could not create the code')); return; }
      setPromoForm(emptyPromo); setPromoOpen(false); loadPromos();
    } catch {
      setPromoMsg(tx('خطأ في الاتصال', 'Erreur réseau', 'Network error'));
    }
  };
  const removePromo = async () => { if (!delPromo) return; await fetch(`/api/promotions?id=${delPromo.id}`, { method: 'DELETE' }); setDelPromo(null); loadPromos(); };

  const pct = form.originalPriceDzd > 0 && form.currentPriceDzd < form.originalPriceDzd ? Math.round((1 - form.currentPriceDzd / form.originalPriceDzd) * 100) : 0;
  const trackOpts = ['BAC', 'UNIVERSITY_LMD', 'MEDICAL'].map((k) => ({ value: k, label: trackLabel(k, locale) }));

  const pCols: Col<any>[] = [
    { id: 'code', header: tx('الكود', 'Code', 'Code'), w: '1.4fr', cell: (p) => <div className="min-w-0"><bdi className="font-semibold">{p.code}</bdi>{p.descriptionAr ? <p className="truncate text-[13px] text-sheet-muted">{p.descriptionAr}</p> : null}</div> },
    { id: 'disc', header: tx('التخفيض', 'Remise', 'Discount'), w: '0.8fr', cell: (p) => <bdi>-{p.discountPercent}%</bdi> },
    { id: 'use', header: tx('استخدام مسجل', 'Utilisations', 'Uses'), w: '1fr', cell: (p) => <bdi>{p.usageCount || 0}</bdi> },
    { id: 'act', header: tx('إجراء', 'Action', 'Action'), w: '0.9fr', m: 'actions', cell: (p) => <Actions><RowAction danger onClick={() => setDelPromo(p)}>{tx('حذف', 'Supprimer', 'Delete')}</RowAction></Actions> },
  ];

  return (
    <div className="flex flex-col gap-8" data-testid="bundles-tab">
      <PageHead
        title={tx('العروض والأكواد', 'Offres et codes', 'Offers and codes')}
        sub={tx('الحزم التجارية وأكواد التخفيض.', 'Packs commerciaux et codes promo.', 'Commercial bundles and discount codes.')}
        action={
          <div className="flex flex-wrap gap-2.5">
            <Btn variant="secondary" onClick={() => { setPromoMsg(''); setPromoOpen(true); }} data-testid="add-promo-btn">{tx('إنشاء كود تخفيض', 'Nouveau code promo', 'New discount code')}</Btn>
            <Btn onClick={openNew} data-testid="add-bundle-btn">{tx('إضافة حزمة أو عرض', 'Créer un pack', 'Add a bundle')}</Btn>
          </div>
        }
      />

      <section className="flex flex-col gap-3">
        <H2>{tx('الحزم والعروض', 'Packs et offres', 'Bundles and offers')}</H2>
        {bundles.length === 0 ? (
          <Empty title={tx('لا توجد حزم بعد', 'Aucun pack', 'No bundles yet')} body={tx('أنشئ أول حزمة أو عرض ترويجي.', 'Créez le premier pack ou la première offre.', 'Create the first bundle or offer.')} action={<Btn variant="secondary" onClick={openNew}>{tx('إضافة حزمة', 'Créer', 'Add')}</Btn>} />
        ) : (
          <CardGrid>
            {bundles.map((b) => (
              <InfoCard
                key={b.id}
                testId={`bundle-row-${b.id}`}
                title={locale === 'ar' ? b.titleAr : b.titleFr || b.titleAr}
                sub={b.badge}
                image={b.imageUrl}
                status={<Status kind={b.isActive ? 'ok' : 'locked'}>{b.isActive ? tx('نشطة', 'Active', 'Active') : tx('موقوفة', 'Suspendue', 'Paused')}</Status>}
                lines={[
                  [tx('المسار', 'Parcours', 'Track'), trackLabel(b.track, locale)],
                  [tx('عدد الساعات', 'Heures', 'Hours'), <bdi key="h">{b.hours}</bdi>],
                  [tx('عدد المحاضرات', 'Cours', 'Lectures'), <bdi key="l">{b.lecturesCount}</bdi>],
                  [tx('السعر الأصلي بدون تخفيض', 'Prix initial', 'Original price'), <bdi key="o">{formatDZD(b.originalPriceDzd, locale)}</bdi>],
                  [tx('السعر الترويجي بعد الخصم', 'Prix promo', 'Promo price'), <bdi key="c" className="font-semibold">{formatDZD(b.currentPriceDzd, locale)}</bdi>],
                ]}
                actions={<><RowAction onClick={() => openEdit(b)}>{tx('تعديل', 'Modifier', 'Edit')}</RowAction><RowAction onClick={() => toggleActive(b)}>{b.isActive ? tx('إيقاف', 'Suspendre', 'Pause') : tx('تفعيل', 'Activer', 'Activate')}</RowAction><RowAction danger onClick={() => setDelBundle(b)}>{tx('حذف', 'Supprimer', 'Delete')}</RowAction></>}
              />
            ))}
          </CardGrid>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <H2>{tx('أكواد التخفيض', 'Codes promo', 'Discount codes')}</H2>
        {promos.length === 0 ? <Empty title={tx('لا توجد أكواد تخفيض', 'Aucun code promo', 'No discount codes')} /> : <DataTable cols={pCols} rows={promos} rowKey={(p) => p.id} label={tx('أكواد التخفيض', 'Codes promo', 'Discount codes')} testId="promo-table" />}
      </section>

      <Dialog open={bundleOpen} onClose={() => setBundleOpen(false)} size="lg" title={editingId ? tx('تعديل بيانات الحزمة والعرض', 'Modifier le pack', 'Edit bundle') : tx('إنشاء حزمة أو عرض ترويجي جديد', 'Nouveau pack commercial', 'New bundle or offer')} testId="add-bundle-form">
        <form onSubmit={saveBundle} className="flex flex-col gap-4">
          <FormGrid>
            <TextInput id="bu-ar" label={tx('العنوان (عربي)', 'Titre (arabe)', 'Title (Arabic)')} value={form.titleAr} onChange={(v) => setForm({ ...form, titleAr: v })} required />
            <TextInput id="bu-fr" label={tx('العنوان (فرنسي)', 'Titre (français)', 'Title (French)')} dir="ltr" value={form.titleFr} onChange={(v) => setForm({ ...form, titleFr: v })} />
            <SelectInput id="bu-track" label={tx('المسار', 'Parcours', 'Track')} value={form.track} onChange={(v) => setForm({ ...form, track: v })} options={trackOpts} />
            <TextInput id="bu-badge" label={tx('شارة العرض (مثال: OFFRE -30%)', 'Badge commercial', 'Badge')} dir="ltr" value={form.badge} onChange={(v) => setForm({ ...form, badge: v })} />
            <TextInput id="bu-hours" label={tx('عدد الساعات', 'Heures', 'Hours')} type="number" min={0} dir="ltr" value={String(form.hours)} onChange={(v) => setForm({ ...form, hours: Number(v) })} />
            <TextInput id="bu-lect" label={tx('عدد المحاضرات', 'Nb. de cours', 'Lectures')} type="number" min={0} dir="ltr" value={String(form.lecturesCount)} onChange={(v) => setForm({ ...form, lecturesCount: Number(v) })} />
            <TextInput id="bu-orig" label={tx('السعر الأصلي بدون تخفيض (DZD)', 'Prix original (DZD)', 'Original price (DZD)')} type="number" min={0} dir="ltr" value={String(form.originalPriceDzd)} onChange={(v) => setForm({ ...form, originalPriceDzd: Number(v) })} />
            <TextInput id="bu-curr" label={tx('السعر الترويجي بعد الخصم (DZD)', 'Prix promo (DZD)', 'Promo price (DZD)')} type="number" min={0} dir="ltr" value={String(form.currentPriceDzd)} onChange={(v) => setForm({ ...form, currentPriceDzd: Number(v) })} hint={pct ? `${tx('نسبة التخفيض المحسوبة:', 'Remise calculée :', 'Computed discount:')} ${pct}%` : undefined} />
          </FormGrid>
          <Field label={tx('وصف العرض والمميزات (عربي)', 'Description (arabe)', 'Description (Arabic)')} htmlFor="bu-dar">
            <textarea id="bu-dar" rows={3} value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} className={`${fieldClass} py-3`} required />
          </Field>
          <Field label={tx('الوصف (فرنسي)', 'Description (français)', 'Description (French)')} htmlFor="bu-dfr">
            <textarea id="bu-dfr" rows={2} dir="ltr" value={form.descriptionFr} onChange={(e) => setForm({ ...form, descriptionFr: e.target.value })} className={`${fieldClass} py-3`} />
          </Field>
          <ImageField id="bu-img" kind="bundle" label={tx('صورة العرض', "Image de l'offre", 'Offer image')} value={form.imageUrl} onChange={(u) => setForm({ ...form, imageUrl: u })} />
          <div className="flex items-center justify-between gap-4 rounded-[14px] bg-sheet-card px-4 py-3">
            <span className="text-[15px] font-semibold">{tx('عرض نشط للطلبة', 'Offre active pour les étudiants', 'Active for students')}</span>
            <Toggle on={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label={tx('نشط', 'Actif', 'Active')} />
          </div>
          <div className="flex flex-wrap justify-end gap-2.5">
            <Btn variant="secondary" onClick={() => setBundleOpen(false)}>{tx('إلغاء', 'Annuler', 'Cancel')}</Btn>
            <button type="submit" data-testid="submit-bundle-btn" className={`inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold-500 px-6 text-[15px] font-semibold text-[#050505] hover:bg-gold-400 ${focus}`}>{editingId ? tx('حفظ تعديلات العرض', 'Enregistrer', 'Save changes') : tx('إطلاق الحزمة والعرض فوراً', 'Lancer le pack', 'Launch bundle')}</button>
          </div>
        </form>
      </Dialog>

      <Dialog open={promoOpen} onClose={() => setPromoOpen(false)} title={tx('إنشاء كود خصم رسمي جديد', 'Créer un code promo', 'Create a discount code')} testId="add-promo-form">
        <form onSubmit={savePromo} className="flex flex-col gap-4">
          {promoMsg ? <Banner kind="danger">{promoMsg}</Banner> : null}
          <FormGrid>
            <TextInput id="pr-code" label={tx('الكود', 'Code', 'Code')} dir="ltr" value={promoForm.code} onChange={(v) => setPromoForm({ ...promoForm, code: v.toUpperCase() })} required />
            <TextInput id="pr-pct" label={tx('نسبة التخفيض (%)', 'Remise (%)', 'Discount (%)')} type="number" min={1} max={100} dir="ltr" value={String(promoForm.discountPercent)} onChange={(v) => setPromoForm({ ...promoForm, discountPercent: Number(v) })} />
          </FormGrid>
          <TextInput id="pr-desc" label={tx('الوصف', 'Description', 'Description')} value={promoForm.descriptionAr} onChange={(v) => setPromoForm({ ...promoForm, descriptionAr: v })} />
          <SelectInput id="pr-track" label={tx('المسار المعني', 'Parcours concerné', 'Applies to')} value={promoForm.applicableTrack} onChange={(v) => setPromoForm({ ...promoForm, applicableTrack: v })} options={[{ value: 'ALL', label: tx('كل المسارات', 'Tous les parcours', 'All tracks') }, ...trackOpts]} />
          <div className="flex flex-wrap justify-end gap-2.5">
            <Btn variant="secondary" onClick={() => setPromoOpen(false)}>{tx('إلغاء', 'Annuler', 'Cancel')}</Btn>
            <button type="submit" className={`inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold-500 px-6 text-[15px] font-semibold text-[#050505] hover:bg-gold-400 ${focus}`}>{tx('تفعيل ونشر كود التخفيض', 'Activer le code', 'Activate code')}</button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog open={!!delBundle} onClose={() => setDelBundle(null)} onConfirm={removeBundle} title={tx('حذف الحزمة', 'Supprimer le pack', 'Delete bundle')} body={tx('هل أنت متأكد من حذف هذه الحزمة؟', 'Supprimer ce pack ?', 'Delete this bundle?')} confirm={tx('حذف', 'Supprimer', 'Delete')} />
      <ConfirmDialog open={!!delPromo} onClose={() => setDelPromo(null)} onConfirm={removePromo} title={tx('حذف كود التخفيض', 'Supprimer le code', 'Delete code')} body={tx('هل أنت متأكد من حذف كود التخفيض؟', 'Supprimer ce code promo ?', 'Delete this discount code?')} confirm={tx('حذف', 'Supprimer', 'Delete')} />
    </div>
  );
};
