'use client';

import React, { useEffect, useState } from 'react';
import { Btn, Empty, Field, PageHead, SearchInput, SelectInput, SkeletonRows, TextInput, Toggle, fieldClass, focus, useTx } from '@/components/student-v2/ui';
import { Banner, Dialog } from '@/components/shared-v2/Dialog';
import { ImageField } from '@/components/teacher-v2/MediaFields';
import { formatDZD } from '@/lib/format';
import { generateStrongPassword } from '@/lib/clientPassword';
import { WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';
import { Locale } from '@/types';
import { Actions, Cell2, Col, ConfirmDialog, CredentialsDialog, DataTable, FormGrid, PasswordField, RowAction, Tile, Tiles } from './ui';

const blank = { name: '', email: '', password: '', phone: '', wilayaCode: 16, university: '', specialty: '', hourlyRateDzd: 12000, ccpAccount: '', ccpCle: '' };
type Created = { name: string; email: string; tempPassword: string };

/** Teachers and pay (Figma page 31, "Teachers"). Same API as the old tab. */
export const TeachersSection: React.FC = () => {
  const { tx, locale } = useTx();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [wilaya, setWilaya] = useState('ALL');

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [created, setCreated] = useState<Created | null>(null);
  const [del, setDel] = useState<any | null>(null);
  const [landing, setLanding] = useState<any | null>(null);

  const load = () => {
    fetch('/api/teachers').then((r) => r.json()).then((d) => { if (Array.isArray(d)) setTeachers(d); }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const owed = teachers.flatMap((t) => t.payouts || []).filter((p: any) => p.status === 'PENDING').reduce((s: number, p: any) => s + (p.amountDzd || 0), 0);

  const settle = async (id: string) => { await fetch(`/api/teachers/${id}/payout`, { method: 'POST' }); load(); };
  const remove = async () => { if (!del) return; await fetch(`/api/teachers/${del.id}`, { method: 'DELETE' }); setDel(null); load(); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    const w = WILAYAS.find((x) => x.code === Number(form.wilayaCode));
    const payload = { ...form, wilayaCode: Number(form.wilayaCode), wilayaName: w ? getLocalizedWilayaName(w, locale as Locale) : undefined, hourlyRateDzd: Number(form.hourlyRateDzd) || 12000 };
    try {
      const res = await fetch('/api/teachers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || tx('فشل إضافة الأستاذ', "Échec de l'ajout", 'Could not add the teacher')); return; }
      setCreated({ name: data.user?.name || form.name, email: data.user?.email || form.email, tempPassword: data.tempPassword || form.password });
      setForm(blank); setAdding(false); load();
    } catch (x) {
      setErr((x as Error).message || tx('خطأ في الاتصال بالسيرفر', 'Erreur de connexion', 'Network error'));
    } finally {
      setBusy(false);
    }
  };

  const copyText = (c: Created) => (locale === 'ar'
    ? `مرحباً بك أستاذنا الفاضل ${c.name} في منصة DZ PRIME ACADEMY

تم تفعيل حسابك كأستاذ معتمد:
البريد الإلكتروني: ${c.email}
كلمة المرور المؤقتة: ${c.tempPassword}

يرجى تسجيل الدخول وتغيير كلمة المرور من إعدادات حسابك.`
    : `Bienvenue ${c.name} sur DZ PRIME ACADEMY

Vos identifiants :
Email : ${c.email}
Mot de passe : ${c.tempPassword}

Connectez-vous et modifiez votre mot de passe depuis vos paramètres.`);

  const q = search.toLowerCase().trim();
  const rows = teachers.filter((t) => {
    const s = !q || t.user?.name?.toLowerCase().includes(q) || t.user?.email?.toLowerCase().includes(q) || t.university?.toLowerCase().includes(q) || t.specialty?.toLowerCase().includes(q);
    return s && (wilaya === 'ALL' || String(t.user?.wilayaCode) === wilaya);
  });
  const wilayaOpts = WILAYAS.map((w) => ({ value: String(w.code), label: `${w.code} - ${getLocalizedWilayaName(w, locale as Locale)}` }));

  const cols: Col<any>[] = [
    { id: 'who', header: tx('الأستاذ والمعلومات', 'Enseignant', 'Teacher'), w: '1.5fr', cell: (t) => <Cell2 title={t.user?.name} sub={<bdi dir="ltr">{t.user?.email}</bdi>} /> },
    { id: 'uni', header: tx('الجامعة والتخصص', 'Université et spécialité', 'University and subject'), w: '1.2fr', cell: (t) => <Cell2 title={t.university || '—'} sub={t.specialty} /> },
    { id: 'hours', header: tx('الساعات', 'Heures', 'Hours'), w: '0.7fr', cell: (t) => <bdi>{t.hoursTaught ?? 0}h</bdi> },
    { id: 'students', header: tx('الطلبة', 'Étudiants', 'Students'), w: '0.6fr', cell: (t) => <bdi>{t.studentsCount ?? 0}</bdi> },
    { id: 'rate', header: tx('الأجر/ساعة', 'Taux/h', 'Rate/h'), w: '0.9fr', cell: (t) => <bdi>{formatDZD(t.hourlyRateDzd, locale)}</bdi> },
    { id: 'share', header: tx('المستحقات الشهرية', 'Part mensuelle', 'Monthly share'), w: '1fr', cell: (t) => <bdi className="font-semibold">{formatDZD(t.monthlyShareDzd, locale)}</bdi> },
    { id: 'ccp', header: 'CCP', w: '0.9fr', cell: (t) => (t.ccpAccount ? <bdi className="text-[14px]">{t.ccpAccount}{t.ccpCle ? ` (${t.ccpCle})` : ''}</bdi> : '—') },
    { id: 'act', header: tx('الإجراءات', 'Actions', 'Actions'), w: '2.7fr', m: 'actions', cell: (t) => {
      const pending = (t.payouts || []).find((p: any) => p.status === 'PENDING');
      return (
        <Actions>
          {pending ? <RowAction onClick={() => settle(t.id)} testId={`approve-payout-${t.id}`}>{tx('تسوية', 'Régler', 'Settle')}</RowAction> : null}
          <RowAction onClick={() => setLanding(t)} testId={`teacher-landing-btn-${t.id}`}>{tx('الصفحة الرئيسية', "Page d'accueil", 'Landing card')}</RowAction>
          <RowAction danger onClick={() => setDel(t)}>{tx('حذف', 'Supprimer', 'Delete')}</RowAction>
        </Actions>
      );
    } },
  ];

  return (
    <div className="flex flex-col gap-6" data-testid="faculty-payroll-tab">
      <PageHead
        title={tx('الأساتذة والمستحقات', 'Enseignants et paie', 'Teachers and pay')}
        sub={tx('سجل أعضاء هيئة التدريس وتسويات المستحقات.', 'Registre des enseignants et règlements.', 'Faculty registry and payout settlements.')}
        action={<Btn onClick={() => { setErr(''); setAdding(true); }} data-testid="add-teacher-btn">{tx('إضافة أستاذ جديد', 'Ajouter un enseignant', 'Add a teacher')}</Btn>}
      />
      <Tiles cols={2}>
        <Tile label={tx('مستحقات الأساتذة غير المدفوعة', 'Paies enseignants dues', 'Teacher payouts owed')} value={<bdi>{formatDZD(owed, locale)}</bdi>} caption={tx('مجموع الدفعات المعلقة.', 'Total des versements en attente.', 'Total of pending payouts.')} />
        <Tile label={tx('الأساتذة المسجلون', 'Enseignants inscrits', 'Registered teachers')} value={<bdi>{teachers.length}</bdi>} />
      </Tiles>
      <div className="grid gap-3 md:grid-cols-[1fr_240px]">
        <SearchInput id="teachers-search" label={tx('بحث', 'Recherche', 'Search')} value={search} onChange={setSearch} placeholder={tx('بحث بالاسم، الجامعة أو التخصص...', 'Nom, université ou spécialité…', 'Name, university or subject…')} />
        <SelectInput id="teachers-wilaya" label={tx('الولاية', 'Wilaya', 'Wilaya')} value={wilaya} onChange={setWilaya} options={[{ value: 'ALL', label: tx('كل الولايات', 'Toutes les wilayas', 'All wilayas') }, ...wilayaOpts]} />
      </div>

      {loading ? <SkeletonRows n={4} /> : rows.length === 0 ? (
        <Empty title={tx('لا يوجد أساتذة مطابقون', 'Aucun enseignant trouvé', 'No teachers match')} body={tx('أضف أستاذاً جديداً أو غيّر البحث.', 'Ajoutez un enseignant ou changez la recherche.', 'Add a teacher or change the search.')} />
      ) : (
        <DataTable cols={cols} rows={rows} rowKey={(t) => t.id} label={tx('الأساتذة', 'Enseignants', 'Teachers')} testId="teachers-table" />
      )}

      <Dialog open={adding} onClose={() => setAdding(false)} size="lg" title={tx('إنشاء حساب أستاذ جديد', 'Créer un compte enseignant', 'Create a teacher account')} sub={tx('أدخل بيانات الأستاذ وكلمة المرور لتسجيله في المنصة.', 'Renseignez les détails et les identifiants.', 'Enter the details and login credentials.')} testId="add-teacher-dialog">
        <form onSubmit={submit} className="flex flex-col gap-4">
          {err ? <Banner kind="danger">{err}</Banner> : null}
          <FormGrid>
            <TextInput id="tc-name" label={tx('الاسم الكامل واللقب الأكاديمي', 'Nom et titre académique', 'Name and academic title')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <TextInput id="tc-email" label={tx('البريد الإلكتروني (لتسجيل الدخول)', 'Email (connexion)', 'Email (login)')} type="email" dir="ltr" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          </FormGrid>
          <PasswordField id="tc-pass" label={tx('كلمة المرور لتسجيل الدخول', 'Mot de passe de connexion', 'Login password')} hint={tx('اتركها فارغة لتوليد كلمة مرور عشوائية.', 'Laissez vide pour en générer une.', 'Leave empty to generate one.')} value={form.password} onChange={(v) => setForm({ ...form, password: v })} onGenerate={() => setForm({ ...form, password: generateStrongPassword() })} />
          <FormGrid>
            <TextInput id="tc-phone" label={tx('رقم الهاتف (واتساب)', 'Téléphone (WhatsApp)', 'Phone (WhatsApp)')} dir="ltr" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <SelectInput id="tc-wilaya" label={tx('الولاية', 'Wilaya', 'Wilaya')} value={String(form.wilayaCode)} onChange={(v) => setForm({ ...form, wilayaCode: Number(v) })} options={wilayaOpts} />
            <TextInput id="tc-uni" label={tx('الجامعة / الكلية', 'Université / faculté', 'University / faculty')} value={form.university} onChange={(v) => setForm({ ...form, university: v })} />
            <TextInput id="tc-spec" label={tx('التخصص / المادة', 'Spécialité / matière', 'Subject')} value={form.specialty} onChange={(v) => setForm({ ...form, specialty: v })} />
            <TextInput id="tc-rate" label={tx('الأجر بالساعة (د.ج)', 'Taux horaire (DZD)', 'Hourly rate (DZD)')} type="number" min={0} dir="ltr" value={String(form.hourlyRateDzd)} onChange={(v) => setForm({ ...form, hourlyRateDzd: Number(v) })} />
            <TextInput id="tc-ccp" label={tx('حساب CCP', 'Compte CCP', 'CCP account')} dir="ltr" value={form.ccpAccount} onChange={(v) => setForm({ ...form, ccpAccount: v })} />
            <TextInput id="tc-cle" label={tx('مفتاح CCP', 'Clé CCP', 'CCP key')} dir="ltr" value={form.ccpCle} onChange={(v) => setForm({ ...form, ccpCle: v })} />
          </FormGrid>
          <div className="flex flex-wrap justify-end gap-2.5">
            <Btn variant="secondary" onClick={() => setAdding(false)}>{tx('إلغاء', 'Annuler', 'Cancel')}</Btn>
            <button type="submit" disabled={busy} data-testid="add-teacher-submit" className={`inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold-500 px-6 text-[15px] font-semibold text-[#050505] hover:bg-gold-400 disabled:opacity-60 ${focus}`}>{busy ? '…' : tx('إنشاء الحساب', 'Créer le compte', 'Create account')}</button>
          </div>
        </form>
      </Dialog>

      <CredentialsDialog
        open={!!created}
        onClose={() => setCreated(null)}
        title={tx('تم إنشاء حساب الأستاذ', 'Enseignant créé', 'Teacher account created')}
        rows={created ? [[tx('الاسم', 'Nom', 'Name'), created.name], [tx('البريد', 'Email', 'Email'), created.email], [tx('كلمة المرور المؤقتة', 'Mot de passe temporaire', 'Temporary password'), created.tempPassword]] : []}
        copyText={created ? copyText(created) : ''}
        testId="teacher-created-dialog"
      />

      <LandingCardDialog teacher={landing} onClose={() => setLanding(null)} onSaved={load} />

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} title={tx('حذف نهائي', 'Suppression définitive', 'Delete permanently')} body={`${tx('هل أنت متأكد من حذف حساب الأستاذ', "Supprimer l'enseignant", 'Delete the teacher account of')} ${del?.user?.name || ''}?`} confirm={tx('حذف', 'Supprimer', 'Delete')} />
    </div>
  );
};

/** Admin-only card for the landing page: switch, order, public bio and photo. Same API as the old modal. */
const LandingCardDialog: React.FC<{ teacher: any | null; onClose: () => void; onSaved: () => void }> = ({ teacher, onClose, onSaved }) => {
  const { tx } = useTx();
  const [show, setShow] = useState(false);
  const [order, setOrder] = useState(0);
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!teacher) return;
    setShow(Boolean(teacher.showOnLanding)); setOrder(teacher.landingOrder ?? 0); setBio(teacher.publicBio ?? ''); setPhoto(teacher.photoUrl ?? null); setError('');
  }, [teacher]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/teachers/${teacher.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ showOnLanding: show, landingOrder: Math.max(0, Math.min(999, Math.round(order) || 0)), publicBio: bio, photoUrl: photo }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || tx('تعذر الحفظ', "Échec de l'enregistrement", 'Could not save')); return; }
      onSaved(); onClose();
    } catch {
      setError(tx('خطأ في الاتصال بالسيرفر', 'Erreur de connexion', 'Network error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!teacher} onClose={onClose} title={tx('ظهور الأستاذ في الصفحة الرئيسية', "Apparition sur la page d'accueil", 'Landing page card')} sub={teacher?.user?.name} testId="teacher-landing-form">
      <form onSubmit={save} className="flex flex-col gap-4">
        {error ? <Banner kind="danger">{error}</Banner> : null}
        <div className="flex items-center justify-between gap-4 rounded-[14px] bg-sheet-card px-4 py-3">
          <span className="text-[15px] font-semibold">{tx('إظهار هذا الأستاذ للزوار', 'Afficher cet enseignant aux visiteurs', 'Show this teacher to visitors')}</span>
          <Toggle on={show} onChange={setShow} label={tx('إظهار هذا الأستاذ للزوار', 'Afficher aux visiteurs', 'Show to visitors')} />
        </div>
        <ImageField id="tl-photo" kind="teacher" label={tx('الصورة العامة', 'Photo publique', 'Public photo')} value={photo} onChange={setPhoto} />
        <Field label={tx('نبذة عامة (400 حرف كحد أقصى)', 'Présentation publique (400 car. max)', 'Public bio (400 characters max)')} htmlFor="tl-bio" hint={`${bio.length}/400`}>
          <textarea id="tl-bio" value={bio} maxLength={400} rows={4} onChange={(e) => setBio(e.target.value)} className={`${fieldClass} py-3`} />
        </Field>
        <TextInput id="tl-order" label={tx('الترتيب (الأصغر أولاً)', "Ordre d'affichage (le plus petit d'abord)", 'Order (smallest first)')} type="number" min={0} dir="ltr" value={String(order)} onChange={(v) => setOrder(Number(v))} className="max-w-[160px]" />
        <div className="flex flex-wrap justify-end gap-2.5">
          <Btn variant="secondary" onClick={onClose}>{tx('إلغاء', 'Annuler', 'Cancel')}</Btn>
          <button type="submit" disabled={saving} className={`inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold-500 px-6 text-[15px] font-semibold text-[#050505] hover:bg-gold-400 disabled:opacity-60 ${focus}`}>{saving ? '…' : tx('حفظ', 'Enregistrer', 'Save')}</button>
        </div>
      </form>
    </Dialog>
  );
};
