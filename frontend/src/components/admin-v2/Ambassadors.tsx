'use client';

import React, { useEffect, useState } from 'react';
import { Btn, Empty, PageHead, SearchInput, SelectInput, SkeletonRows, Status, TextInput, focus, useTx } from '@/components/student-v2/ui';
import { Banner, Dialog } from '@/components/shared-v2/Dialog';
import { formatDZD } from '@/lib/format';
import { generateStrongPassword } from '@/lib/clientPassword';
import { WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';
import { Locale } from '@/types';
import { Actions, Cell2, Col, ConfirmDialog, CredentialsDialog, DataTable, FormGrid, PasswordField, RowAction, Tile, Tiles } from './ui';

const blank = { name: '', email: '', password: '', phone: '', wilayaCode: 16, institutionNameAr: '', specialtyName: '', promoCode: '', telegramHandle: '' };
type Created = { name: string; email: string; tempPassword: string; promoCode?: string };

/** Ambassadors (Figma page 31, "Ambassadors"). Same API as the old tab. */
export const AmbassadorsSection: React.FC = () => {
  const { tx, locale } = useTx();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [wilaya, setWilaya] = useState('ALL');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [created, setCreated] = useState<Created | null>(null);
  const [del, setDel] = useState<any | null>(null);

  const load = () => {
    fetch('/api/ambassadors').then((r) => r.json()).then((d) => { if (Array.isArray(d)) setList(d); }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const commission = list.reduce((s, a) => s + (a.commissionDzd || 0), 0);
  const covered = new Set(list.map((a) => a.wilayaCode)).size;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    const w = WILAYAS.find((x) => x.code === Number(form.wilayaCode));
    const payload = { ...form, wilayaCode: Number(form.wilayaCode), wilayaNameAr: w?.nameAr, wilayaNameFr: w?.nameFr };
    try {
      const res = await fetch('/api/ambassadors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || tx('فشل إضافة السفير', "Échec de l'ajout", 'Could not add the ambassador')); return; }
      setCreated({ name: data.user?.name || form.name, email: data.user?.email || form.email, tempPassword: data.tempPassword || form.password, promoCode: data.promoCode });
      setForm(blank); setAdding(false); load();
    } catch (x) {
      setErr((x as Error).message || tx('خطأ في الاتصال بالسيرفر', 'Erreur de connexion', 'Network error'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => { if (!del) return; await fetch(`/api/ambassadors/${del.id}`, { method: 'DELETE' }); setDel(null); load(); };

  const copyText = (c: Created) => (locale === 'ar'
    ? `مرحباً بك سفيرنا المعتمد ${c.name} في منصة DZ PRIME ACADEMY\n\nتم تفعيل حسابك كسفير رسمي:\nالبريد الإلكتروني: ${c.email}\nكلمة المرور المؤقتة: ${c.tempPassword}\nكود الترويج الخاص بك: ${c.promoCode || 'مفعل'}\n\nيرجى تسجيل الدخول وتغيير كلمة المرور من إعدادات حسابك.`
    : `Bienvenue ${c.name} sur DZ PRIME ACADEMY\n\nVos identifiants :\nEmail : ${c.email}\nMot de passe : ${c.tempPassword}\nCode promo : ${c.promoCode || 'Actif'}\n\nConnectez-vous et modifiez votre mot de passe depuis vos paramètres.`);

  const q = search.toLowerCase().trim();
  const rows = list.filter((a) => {
    const s = !q || a.user?.name?.toLowerCase().includes(q) || a.user?.email?.toLowerCase().includes(q) || a.institutionNameAr?.toLowerCase().includes(q) || a.wilayaNameAr?.toLowerCase().includes(q) || a.promoCode?.toLowerCase().includes(q);
    return s && (wilaya === 'ALL' || String(a.wilayaCode) === wilaya);
  });
  const wilayaOpts = WILAYAS.map((w) => ({ value: String(w.code), label: `${w.code} - ${getLocalizedWilayaName(w, locale as Locale)}` }));

  const cols: Col<any>[] = [
    { id: 'who', header: tx('السفير والمعلومات', 'Ambassadeur', 'Ambassador'), w: '1.7fr', cell: (a) => <Cell2 title={a.user?.name} sub={<bdi dir="ltr">{a.user?.email}</bdi>} /> },
    { id: 'where', header: tx('الولاية والمؤسسة', 'Wilaya et établissement', 'Wilaya and institution'), w: '1.5fr', cell: (a) => <Cell2 title={a.institutionNameAr || a.institutionNameFr || '—'} sub={`${a.wilayaCode} - ${locale === 'ar' ? a.wilayaNameAr : a.wilayaNameFr || a.wilayaNameAr}`} /> },
    { id: 'code', header: tx('كود الترويج', 'Code promo', 'Promo code'), w: '1.1fr', cell: (a) => <bdi className="font-semibold">{a.promoCode}</bdi> },
    { id: 'refs', header: tx('الإحالات', 'Parrainages', 'Referrals'), w: '0.8fr', cell: (a) => <bdi>{a.referralsCount || 0}</bdi> },
    { id: 'comm', header: tx('العمولة (10%)', 'Commission (10 %)', 'Commission (10%)'), w: '1.1fr', cell: (a) => <bdi className="font-semibold">{formatDZD(a.commissionDzd || 0, locale)}</bdi> },
    { id: 'status', header: tx('الحالة', 'Statut', 'Status'), w: '1fr', m: 'status', cell: (a) => <Status kind={a.isVerified ? 'ok' : 'pending'}>{a.isVerified ? tx('موثّق', 'Vérifié', 'Verified') : tx('قيد المراجعة', 'En revue', 'In review')}</Status> },
    { id: 'act', header: tx('الإجراءات', 'Actions', 'Actions'), w: '1.4fr', m: 'actions', cell: (a) => (
      <Actions>
        {a.user?.studentCardId ? <RowAction href={`/${locale}/profile/${a.user.studentCardId}`} label={tx('عرض الملف العام', 'Voir le profil public', 'View public profile')}>{tx('الملف', 'Profil', 'Profile')}</RowAction> : null}
        <RowAction danger onClick={() => setDel(a)} testId={`delete-ambassador-${a.id}`}>{tx('حذف', 'Supprimer', 'Delete')}</RowAction>
      </Actions>
    ) },
  ];

  return (
    <div className="flex flex-col gap-6" data-testid="ambassadors-tab">
      <PageHead
        title={tx('السفراء', 'Ambassadeurs', 'Ambassadors')}
        sub={tx('شبكة السفراء المعتمدين عبر 58 ولاية، أكواد الترويج والعمولات.', 'Réseau des ambassadeurs (58 wilayas), codes promo et commissions.', 'Ambassador network across 58 wilayas, promo codes and commissions.')}
        action={<Btn onClick={() => { setErr(''); setAdding(true); }} data-testid="add-ambassador-btn">{tx('إضافة سفير جديد', 'Ajouter un ambassadeur', 'Add an ambassador')}</Btn>}
      />
      <Tiles cols={3}>
        <Tile label={tx('عمولات السفراء', 'Commissions ambassadeurs', 'Ambassador commissions')} value={<bdi>{formatDZD(commission, locale)}</bdi>} />
        <Tile label={tx('السفراء', 'Ambassadeurs', 'Ambassadors')} value={<bdi>{list.length}</bdi>} />
        <Tile label={tx('الولايات المغطاة', 'Wilayas couvertes', 'Wilayas covered')} value={<bdi>{covered} / 58</bdi>} />
      </Tiles>
      <div className="grid gap-3 md:grid-cols-[1fr_240px]">
        <SearchInput id="amb-search" label={tx('بحث', 'Recherche', 'Search')} value={search} onChange={setSearch} placeholder={tx('بحث بالاسم، الولاية، الكود...', 'Nom, wilaya, code…', 'Name, wilaya, code…')} />
        <SelectInput id="amb-wilaya" label={tx('الولاية', 'Wilaya', 'Wilaya')} value={wilaya} onChange={setWilaya} options={[{ value: 'ALL', label: tx('كل الولايات', 'Toutes les wilayas', 'All wilayas') }, ...wilayaOpts]} />
      </div>

      {loading ? <SkeletonRows n={4} /> : rows.length === 0 ? (
        <Empty title={search || wilaya !== 'ALL' ? tx('لا توجد نتائج مطابقة', 'Aucun résultat', 'No matches') : tx('لا يوجد سفراء بعد', 'Aucun ambassadeur', 'No ambassadors yet')} body={tx('انقر «إضافة سفير جديد» للبدء.', 'Cliquez sur « Ajouter un ambassadeur » pour commencer.', 'Use “Add an ambassador” to start.')} />
      ) : (
        <DataTable cols={cols} rows={rows} rowKey={(a) => a.id} label={tx('السفراء', 'Ambassadeurs', 'Ambassadors')} testId="ambassadors-table" />
      )}

      <Dialog open={adding} onClose={() => setAdding(false)} size="lg" title={tx('إنشاء حساب سفير جديد', 'Créer un compte ambassadeur', 'Create an ambassador account')} sub={tx('يُنشأ كود ترويج إن تركت الحقل فارغاً.', 'Un code promo est créé si le champ est vide.', 'A promo code is created if left empty.')} testId="add-ambassador-dialog">
        <form onSubmit={submit} className="flex flex-col gap-4">
          {err ? <Banner kind="danger">{err}</Banner> : null}
          <FormGrid>
            <TextInput id="am-name" label={tx('الاسم الكامل', 'Nom complet', 'Full name')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <TextInput id="am-email" label={tx('البريد الإلكتروني', 'Email', 'Email')} type="email" dir="ltr" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          </FormGrid>
          <PasswordField id="am-pass" label={tx('كلمة المرور لتسجيل الدخول', 'Mot de passe de connexion', 'Login password')} hint={tx('اتركها فارغة لتوليد كلمة مرور عشوائية.', 'Laissez vide pour en générer une.', 'Leave empty to generate one.')} value={form.password} onChange={(v) => setForm({ ...form, password: v })} onGenerate={() => setForm({ ...form, password: generateStrongPassword() })} />
          <FormGrid>
            <TextInput id="am-phone" label={tx('رقم الهاتف', 'Téléphone', 'Phone')} dir="ltr" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <SelectInput id="am-wilaya" label={tx('الولاية', 'Wilaya', 'Wilaya')} value={String(form.wilayaCode)} onChange={(v) => setForm({ ...form, wilayaCode: Number(v) })} options={wilayaOpts} />
            <TextInput id="am-inst" label={tx('الجامعة أو المؤسسة', 'Université / établissement', 'Institution')} value={form.institutionNameAr} onChange={(v) => setForm({ ...form, institutionNameAr: v })} />
            <TextInput id="am-spec" label={tx('التخصص', 'Spécialité', 'Specialty')} value={form.specialtyName} onChange={(v) => setForm({ ...form, specialtyName: v })} />
            <TextInput id="am-code" label={tx('كود الترويج (اختياري)', 'Code promo (facultatif)', 'Promo code (optional)')} dir="ltr" placeholder={`WIL${form.wilayaCode}-VIP`} value={form.promoCode} onChange={(v) => setForm({ ...form, promoCode: v.toUpperCase() })} />
            <TextInput id="am-tg" label={tx('حساب تيليغرام (بدون @)', 'Telegram (sans @)', 'Telegram (without @)')} dir="ltr" value={form.telegramHandle} onChange={(v) => setForm({ ...form, telegramHandle: v })} />
          </FormGrid>
          <div className="flex flex-wrap justify-end gap-2.5">
            <Btn variant="secondary" onClick={() => setAdding(false)}>{tx('إلغاء', 'Annuler', 'Cancel')}</Btn>
            <button type="submit" disabled={busy} data-testid="add-ambassador-submit" className={`inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold-500 px-6 text-[15px] font-semibold text-[#050505] hover:bg-gold-400 disabled:opacity-60 ${focus}`}>{busy ? '…' : tx('إنشاء الحساب', 'Créer le compte', 'Create account')}</button>
          </div>
        </form>
      </Dialog>

      <CredentialsDialog
        open={!!created}
        onClose={() => setCreated(null)}
        title={tx('تم إنشاء حساب السفير', 'Ambassadeur créé', 'Ambassador account created')}
        rows={created ? [[tx('الاسم', 'Nom', 'Name'), created.name], [tx('البريد', 'Email', 'Email'), created.email], [tx('كلمة المرور المؤقتة', 'Mot de passe temporaire', 'Temporary password'), created.tempPassword], [tx('كود الترويج', 'Code promo', 'Promo code'), created.promoCode || '—']] : []}
        copyText={created ? copyText(created) : ''}
        testId="ambassador-created-dialog"
      />

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} title={tx('حذف نهائي', 'Suppression définitive', 'Delete permanently')} body={`${tx('هل أنت متأكد من حذف حساب السفير', "Supprimer l'ambassadeur", 'Delete the ambassador account of')} ${del?.user?.name || ''}?`} confirm={tx('حذف', 'Supprimer', 'Delete')} />
    </div>
  );
};
