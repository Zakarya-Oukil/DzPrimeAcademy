'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Btn, Empty, PageHead, SearchInput, SelectInput, SkeletonRows, Status, Tabs, TextInput, focus, useTx } from '@/components/student-v2/ui';
import { Banner, Dialog } from '@/components/shared-v2/Dialog';
import { WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';
import { Locale } from '@/types';
import { Actions, Cell2, Col, ConfirmDialog, DataTable, FormGrid, RowAction } from './ui';

const blank = {
  name: '', email: '', password: '', phone: '', wilayaCode: 16, wilayaName: 'الجزائر العاصمة',
  institutionName: '', track: 'UNIVERSITY_LMD', specialty: '', role: 'STUDENT_PAID',
};

/** Students and cards (Figma page 31, "Students"). Same API as the old tab: search is server-side, filters are local. */
export const StudentsSection: React.FC = () => {
  const { tx, locale } = useTx();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [wilaya, setWilaya] = useState('ALL');
  const [tier, setTier] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const seq = useRef(0);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [addErr, setAddErr] = useState<string | null>(null);
  const [addOk, setAddOk] = useState<string | null>(null);
  const [del, setDel] = useState<any | null>(null);
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState<string | null>(null);

  const load = (append = false, q = search) => {
    const offset = append ? users.length : 0;
    if (append) setLoadingMore(true);
    const id = ++seq.current;
    return fetch(`/api/students?limit=100&offset=${offset}&q=${encodeURIComponent(q.trim())}`)
      .then(async (r) => {
        const data = await r.json();
        if (id !== seq.current) return;
        if (Array.isArray(data)) {
          setUsers((p) => (append ? [...p, ...data] : data));
          setTotal(Number(r.headers.get('X-Total-Count')) || data.length);
        }
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setLoadingMore(false); });
  };

  useEffect(() => {
    const t = setTimeout(() => load(false, search), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggleVerify = async (id: string, isVerified: boolean) => {
    setUsers((p) => p.map((u) => (u.id === id ? { ...u, isVerified: !isVerified } : u)));
    await fetch('/api/students', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isVerified: !isVerified }) });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setAddErr(null); setAddOk(null);
    try {
      const res = await fetch('/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx('فشل تسجيل الطالب', "Échec de l'inscription", 'Could not register the student'));
      setAddOk(`${tx('تم تسجيل الطالب. كلمة المرور:', 'Étudiant inscrit. Mot de passe :', 'Student registered. Password:')} ${data.tempPassword || tx('المحددة', 'définie', 'as set')}`);
      load();
    } catch (err) {
      setAddErr((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const closeAdd = () => { setAdding(false); setForm(blank); setAddErr(null); setAddOk(null); };

  const remove = async () => {
    if (!del) return;
    setDelBusy(true); setDelErr(null);
    try {
      const res = await fetch(`/api/students/${del.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setDelErr(data.error || tx('فشل حذف الطالب', 'Échec de la suppression', 'Could not delete')); return; }
      setUsers((p) => p.filter((u) => u.id !== del.id));
      setDel(null);
    } catch {
      setDelErr(tx('خطأ في الاتصال بالخادم', 'Erreur réseau', 'Network error'));
    } finally {
      setDelBusy(false);
    }
  };

  const students = users.filter((u) => u.role === 'STUDENT_FREE' || u.role === 'STUDENT_PAID');
  const q = search.toLowerCase();
  const rows = students.filter((u) => {
    const s = u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.studentCardId?.toLowerCase().includes(q);
    return s && (wilaya === 'ALL' || String(u.wilayaCode) === wilaya) && (tier === 'ALL' || u.role === tier);
  });

  const wilayaOpts = WILAYAS.map((w) => ({ value: String(w.code), label: `${w.code} - ${getLocalizedWilayaName(w, locale as Locale)}` }));

  const cols: Col<any>[] = [
    { id: 'who', header: tx('الطالب', 'Étudiant', 'Student'), w: '1.7fr', cell: (u) => <Cell2 title={u.name} sub={<bdi dir="ltr">{u.email}</bdi>} /> },
    { id: 'where', header: tx('الولاية والجامعة', 'Wilaya et université', 'Wilaya and university'), w: '1.5fr', cell: (u) => <Cell2 title={`${u.wilayaCode} - ${u.wilayaName || ''}`} sub={u.institutionName} /> },
    { id: 'tier', header: tx('الفئة', 'Catégorie', 'Tier'), w: '1fr', cell: (u) => (u.role === 'STUDENT_PAID' ? 'Gold VIP' : tx('مجاني', 'Gratuit', 'Free')) },
    { id: 'card', header: tx('رقم البطاقة', 'N° de carte', 'Card ID'), w: '1.2fr', cell: (u) => <bdi className="text-[14px]">{u.studentCardId || '—'}</bdi> },
    { id: 'status', header: tx('حالة الاعتماد', 'Statut', 'Status'), w: '1.2fr', m: 'status', cell: (u) => (
      <button type="button" onClick={() => toggleVerify(u.id, u.isVerified)} data-testid={`toggle-verify-${u.id}`} aria-pressed={!!u.isVerified} aria-label={tx('تبديل الاعتماد', "Basculer l'approbation", 'Toggle approval')} className={`inline-flex min-h-[44px] items-center rounded-full pe-2 ${focus}`}>
        <Status kind={u.isVerified ? 'ok' : 'pending'}>{u.isVerified ? tx('معتمدة', 'Vérifié', 'Verified') : tx('قيد الانتظار', 'En attente', 'Pending')}</Status>
      </button>
    ) },
    { id: 'act', header: tx('إجراءات', 'Actions', 'Actions'), w: '1.3fr', m: 'actions', cell: (u) => (
      <Actions>
        <RowAction href={`/${locale}/profile/${u.publicToken || u.id}`} label={tx('عرض الملف العام', 'Voir le profil public', 'View public profile')}>{tx('الملف', 'Profil', 'Profile')}</RowAction>
        <RowAction danger onClick={() => { setDelErr(null); setDel(u); }} label={tx('حذف الطالب', "Supprimer l'étudiant", 'Delete student')}>{tx('حذف', 'Supprimer', 'Delete')}</RowAction>
      </Actions>
    ) },
  ];

  return (
    <div className="flex flex-col gap-6" data-testid="students-tab">
      <PageHead
        title={tx('الطلبة والبطاقات', 'Étudiants et cartes', 'Students and cards')}
        sub={tx('حسابات الطلبة وبطاقات العضوية وحالة الاعتماد.', "Comptes étudiants, cartes d'adhésion et statut.", 'Student accounts, membership cards and approval.')}
        action={<Btn onClick={() => setAdding(true)} data-testid="add-student-btn">{tx('إضافة طالب جديد', 'Inscrire un étudiant', 'Add a student')}</Btn>}
      />
      <Tabs label={tx('فئة العضوية', "Catégorie d'adhésion", 'Membership tier')} value={tier} onChange={setTier} items={[
        { id: 'ALL', label: tx('الكل', 'Tous', 'All') },
        { id: 'STUDENT_PAID', label: 'Gold VIP' },
        { id: 'STUDENT_FREE', label: tx('مجاني', 'Gratuit', 'Free') },
      ]} />
      <div className="grid gap-3 md:grid-cols-[1fr_240px]">
        <SearchInput id="students-search" label={tx('بحث', 'Recherche', 'Search')} value={search} onChange={setSearch} placeholder={tx('بحث بالاسم، البريد أو رقم البطاقة...', 'Nom, email ou numéro de carte…', 'Name, email or card ID…')} />
        <SelectInput id="students-wilaya" label={tx('الولاية', 'Wilaya', 'Wilaya')} value={wilaya} onChange={setWilaya} options={[{ value: 'ALL', label: tx('كل الولايات', 'Toutes les wilayas', 'All wilayas') }, ...wilayaOpts]} />
      </div>

      {loading ? <SkeletonRows n={4} /> : rows.length === 0 ? (
        <Empty title={tx('لا يوجد طلبة مطابقون', 'Aucun étudiant trouvé', 'No students match')} body={tx('غيّر البحث أو الفلاتر، أو أضف طالباً جديداً.', 'Changez la recherche ou ajoutez un étudiant.', 'Change the search or add a student.')} />
      ) : (
        <DataTable cols={cols} rows={rows} rowKey={(u) => u.id} label={tx('الطلبة', 'Étudiants', 'Students')} testId="students-table" />
      )}

      {users.length < total ? (
        <div className="flex justify-center"><Btn variant="secondary" onClick={() => load(true)} disabled={loadingMore}>{loadingMore ? '…' : `${tx('عرض المزيد', 'Afficher plus', 'Show more')} (${users.length}/${total})`}</Btn></div>
      ) : null}

      <Dialog open={adding} onClose={closeAdd} size="lg" title={tx('تسجيل طالب جديد', 'Inscrire un étudiant', 'Register a student')} sub={tx('تُنشأ كلمة مرور مؤقتة إن تركت الحقل فارغاً.', 'Un mot de passe temporaire est créé si le champ est vide.', 'A temporary password is created if left empty.')} testId="add-student-dialog">
        <form onSubmit={submit} className="flex flex-col gap-4">
          {addErr ? <Banner kind="danger">{addErr}</Banner> : null}
          {addOk ? <Banner kind="ok" testId="add-student-ok">{addOk}</Banner> : null}
          <FormGrid>
            <TextInput id="st-name" label={tx('الاسم الكامل *', 'Nom complet *', 'Full name *')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <TextInput id="st-email" label={tx('البريد الإلكتروني *', 'Email *', 'Email *')} type="email" dir="ltr" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            <TextInput id="st-pass" label={tx('كلمة المرور (اختياري)', 'Mot de passe (facultatif)', 'Password (optional)')} type="password" dir="ltr" autoComplete="new-password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
            <TextInput id="st-phone" label={tx('رقم الهاتف', 'Téléphone', 'Phone')} dir="ltr" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <SelectInput id="st-wilaya" label={tx('الولاية', 'Wilaya', 'Wilaya')} value={String(form.wilayaCode)} onChange={(v) => { const code = Number(v); const w = WILAYAS.find((x) => x.code === code); setForm({ ...form, wilayaCode: code, wilayaName: w ? getLocalizedWilayaName(w, locale as Locale) : form.wilayaName }); }} options={wilayaOpts} />
            <SelectInput id="st-role" label={tx('فئة العضوية', "Niveau d'adhésion", 'Membership tier')} value={form.role} onChange={(v) => setForm({ ...form, role: v })} options={[{ value: 'STUDENT_PAID', label: tx('عضوية ذهبية (Gold VIP)', 'Adhésion Gold VIP', 'Gold VIP') }, { value: 'STUDENT_FREE', label: tx('عضوية مجانية', 'Accès gratuit', 'Free pass') }]} />
          </FormGrid>
          <TextInput id="st-inst" label={tx('الجامعة أو المعهد', 'Université / institut', 'University / institute')} value={form.institutionName} onChange={(v) => setForm({ ...form, institutionName: v })} />
          <FormGrid>
            <TextInput id="st-spec" label={tx('التخصص الدراسي', 'Spécialité', 'Specialty')} value={form.specialty} onChange={(v) => setForm({ ...form, specialty: v })} />
            <TextInput id="st-track" label={tx('المسار التعليمي', 'Filière', 'Track')} dir="ltr" value={form.track} onChange={(v) => setForm({ ...form, track: v })} />
          </FormGrid>
          <div className="flex flex-wrap justify-end gap-2.5">
            <Btn variant="secondary" onClick={closeAdd}>{addOk ? tx('إغلاق', 'Fermer', 'Close') : tx('إلغاء', 'Annuler', 'Cancel')}</Btn>
            {!addOk ? <button type="submit" disabled={busy} className={`inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold-500 px-6 text-[15px] font-semibold text-[#050505] hover:bg-gold-400 disabled:opacity-60 ${focus}`} data-testid="add-student-submit">{busy ? '…' : tx('تسجيل الطالب', "Inscrire", 'Register')}</button> : null}
          </div>
        </form>
      </Dialog>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} busy={delBusy} error={delErr} title={tx('حذف نهائي', 'Suppression définitive', 'Delete permanently')} body={`${tx('هل أنت متأكد من حذف', 'Supprimer définitivement', 'Delete')} ${del?.name || ''}? ${tx('لا يمكن التراجع عن هذا الإجراء.', 'Cette action est irréversible.', 'This cannot be undone.')}`} confirm={tx('حذف', 'Supprimer', 'Delete')} />
    </div>
  );
};

