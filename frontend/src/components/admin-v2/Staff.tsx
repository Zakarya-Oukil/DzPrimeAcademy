'use client';

import React, { useEffect, useState } from 'react';
import { Btn, Empty, Field, PageHead, SearchInput, SelectInput, SkeletonRows, Tabs, TextInput, fieldClass, focus, useTx } from '@/components/student-v2/ui';
import { Banner, Dialog } from '@/components/shared-v2/Dialog';
import { useAuthStore } from '@/lib/store';
import { generateStrongPassword } from '@/lib/clientPassword';
import { WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';
import { isSuperAdmin, isHRManager, canManageUser, canAssignAdminRole } from '@/lib/rbac';
import { HierarchyChart } from '@/components/dashboard/HierarchyChart';
import { Locale, User } from '@/types';
import { Actions, Cell2, Col, ConfirmDialog, DataTable, FormGrid, H2, PasswordField, RowAction, Tile, Tiles } from './ui';

const ROLE_OPTIONS: { value: string; label: string; title: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', title: 'Directeur Général (المؤسس)' },
  { value: 'GENERAL_ADMIN', label: 'Admin Général', title: 'Admin Général (المدير العام التنفيذي)' },
  { value: 'HR_MANAGER', label: 'Chargée RH / Responsable RH', title: 'Chargée des Ressources Humaines' },
  { value: 'COMMERCIAL', label: 'Chargée Commerciale / Responsable Commercial', title: 'Chargée Commerciale' },
  { value: 'HR_EMPLOYEE', label: 'Employé RH / Collaborateur RH', title: 'Collaborateur RH & Recrutement' },
  { value: 'FINANCE', label: 'Responsable Financier', title: 'Responsable Financier' },
  { value: 'ADMIN', label: 'Administrateur Général', title: 'Administrateur' },
];
const EMPTY = { name: '', email: '', password: '', role: 'ADMIN', adminRole: '', jobTitle: '', phone: '', wilayaCode: 16, wilayaName: 'Alger', bio: '' };

/** Admin team (Figma page 31, "Staff"). Same API and permission rules as the old tab. */
export const StaffSection: React.FC = () => {
  const { tx, locale } = useTx();
  const { currentUser } = useAuthStore();
  const [list, setList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [edit, setEdit] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ jobTitle: '', adminRole: '', phone: '', bio: '' });
  const [editBusy, setEditBusy] = useState(false);
  const [editErr, setEditErr] = useState('');
  const [del, setDel] = useState<User | null>(null);
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState<string | null>(null);

  const assignable = ROLE_OPTIONS.filter((o) => currentUser && canAssignAdminRole(currentUser, o.value));
  const canAdd = isSuperAdmin(currentUser) || isHRManager(currentUser);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/staff');
      if (res.ok) setList(await res.json());
    } catch {
      /* keep the last list */
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    const first = assignable[0];
    setErr(''); setOk('');
    setForm({ ...EMPTY, adminRole: first?.value || '', jobTitle: first?.title || '' });
    setAdding(true);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(''); setOk('');
    try {
      const w = WILAYAS.find((x) => x.code === Number(form.wilayaCode));
      const payload = { ...form, wilayaCode: Number(form.wilayaCode), wilayaName: w ? getLocalizedWilayaName(w, locale as Locale) : 'Alger' };
      const res = await fetch('/api/admin/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || tx('فشل إضافة المسؤول', "Échec de l'ajout", 'Could not add the member')); return; }
      setOk(tx('تمت إضافة المسؤول بنجاح.', 'Membre ajouté avec succès.', 'Member added.'));
      load();
      setTimeout(() => { setAdding(false); setOk(''); }, 1500);
    } catch (x) {
      setErr((x as Error).message || tx('خطأ في الاتصال', 'Erreur réseau', 'Network error'));
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (s: User) => { setEditErr(''); setEdit(s); setEditForm({ jobTitle: s.jobTitle || '', adminRole: s.adminRole || '', phone: s.phone || '', bio: s.bio || '' }); };
  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    setEditBusy(true); setEditErr('');
    try {
      const body: Record<string, string> = { jobTitle: editForm.jobTitle, phone: editForm.phone, bio: editForm.bio };
      if (editForm.adminRole && editForm.adminRole !== (edit.adminRole || '')) body.adminRole = editForm.adminRole;
      const res = await fetch(`/api/admin/staff/${edit.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setEditErr(data.error || tx('فشل التعديل', 'Échec de la modification', 'Could not save'));
      else { setEdit(null); load(); }
    } catch {
      setEditErr(tx('خطأ في الاتصال', 'Erreur réseau', 'Network error'));
    } finally {
      setEditBusy(false);
    }
  };

  const remove = async () => {
    if (!del) return;
    setDelBusy(true); setDelErr(null);
    try {
      const res = await fetch(`/api/admin/staff/${del.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setDelErr(data.error || tx('فشل الحذف', 'Échec de la suppression', 'Could not delete'));
      else { setDel(null); load(); }
    } catch {
      setDelErr(tx('خطأ في الاتصال', 'Erreur réseau', 'Network error'));
    } finally {
      setDelBusy(false);
    }
  };

  const isHR = (s: User) => s.adminRole === 'HR_MANAGER' || s.adminRole === 'HR_EMPLOYEE';
  const levelLabel = (s: User) =>
    s.role === 'OWNER' || s.adminRole === 'SUPER_ADMIN' ? tx('المسؤول الأعلى', 'Super admin', 'Super admin')
    : s.adminRole === 'GENERAL_ADMIN' ? tx('المدير العام الإداري', 'Admin général', 'General admin')
    : isHR(s) ? tx('الموارد البشرية (HR)', 'Ressources humaines', 'Human resources')
    : s.adminRole === 'COMMERCIAL' ? tx('المصلحة التجارية', 'Commercial', 'Commercial')
    : s.adminRole === 'FINANCE' ? tx('المالية', 'Finances', 'Finance')
    : tx('مسؤول إداري', 'Administrateur', 'Administrator');

  const q = search.toLowerCase();
  const rows = list.filter((s) => {
    const m = (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q) || (s.jobTitle || '').toLowerCase().includes(q) || (s.studentCardId || '').toLowerCase().includes(q);
    const r = filter === 'ALL'
      || (filter === 'SUPER_ADMIN' && (s.role === 'OWNER' || s.adminRole === 'SUPER_ADMIN'))
      || (filter === 'GENERAL_ADMIN' && s.adminRole === 'GENERAL_ADMIN')
      || (filter === 'HR' && isHR(s))
      || (filter === 'COMMERCIAL' && s.adminRole === 'COMMERCIAL')
      || (filter === 'FINANCE' && s.adminRole === 'FINANCE');
    return m && r;
  });

  const cols: Col<User>[] = [
    { id: 'who', header: tx('الاسم', 'Nom', 'Name'), w: '1.7fr', cell: (s) => <Cell2 title={s.name} sub={<bdi dir="ltr">{s.email}</bdi>} /> },
    { id: 'title', header: tx('المنصب', 'Poste', 'Job title'), w: '1.6fr', cell: (s) => s.jobTitle || '—' },
    { id: 'level', header: tx('المستوى الإداري', 'Niveau', 'Level'), w: '1.3fr', cell: (s) => levelLabel(s) },
    { id: 'act', header: tx('الإجراءات', 'Actions', 'Actions'), w: '1.7fr', m: 'actions', cell: (s) => {
      const manage = currentUser ? canManageUser(currentUser, s) : false;
      return (
        <Actions>
          <RowAction href={`/${locale}/profile/${s.studentCardId || s.id}`} label={tx('معاينة الملف العام', 'Voir le profil public', 'View public profile')}>{tx('معاينة', 'Profil', 'Preview')}</RowAction>
          {manage ? <RowAction onClick={() => openEdit(s)}>{tx('تعديل', 'Modifier', 'Edit')}</RowAction> : null}
          {manage ? <RowAction danger onClick={() => { setDelErr(null); setDel(s); }}>{tx('حذف', 'Supprimer', 'Delete')}</RowAction> : null}
        </Actions>
      );
    } },
  ];

  const roleOptions = assignable.map((o) => ({ value: o.value, label: o.label }));

  return (
    <div className="flex flex-col gap-6" data-testid="admin-staff-tab">
      <PageHead
        title={tx('فريق الإدارة', "Équipe d'administration", 'Admin team')}
        sub={tx('إدارة صلاحيات الإدارة، مسؤولات ومسؤولي الموارد البشرية، المالية والمشرفين.', 'Rôles hiérarchiques, RH, commercial, finances et administrateurs.', 'Roles for admins, HR, commercial and finance staff.')}
        action={canAdd ? <Btn onClick={openAdd} data-testid="add-staff-btn">{tx('إضافة إداري أو موظف جديد', 'Ajouter un membre', 'Add a team member')}</Btn> : undefined}
      />
      <Tiles>
        <Tile label={tx('إجمالي الطاقم', 'Total équipe', 'Total team')} value={<bdi>{list.length}</bdi>} />
        <Tile label={tx('فريق الموارد البشرية (HR)', 'Équipe RH', 'HR team')} value={<bdi>{list.filter(isHR).length}</bdi>} />
        <Tile label={tx('المصلحة التجارية', 'Commercial', 'Commercial')} value={<bdi>{list.filter((s) => s.adminRole === 'COMMERCIAL').length}</bdi>} />
        <Tile label={tx('المالية والمحاسبة', 'Finances', 'Finance')} value={<bdi>{list.filter((s) => s.adminRole === 'FINANCE').length}</bdi>} />
      </Tiles>
      <p className="text-[13px] text-sheet-muted">{tx('كل دور إداري يرى في القائمة الجانبية الأقسام المسموح له بها فقط، ويطبّق الخادم القواعد نفسها.', "Chaque rôle ne voit dans le menu que les sections autorisées, et le serveur applique les mêmes règles.", 'Each role sees only the sections it may use, and the server enforces the same rules.')}</p>
      <Tabs label={tx('الدور', 'Rôle', 'Role')} value={filter} onChange={setFilter} items={[
        { id: 'ALL', label: tx('الكل', 'Tous', 'All') },
        { id: 'SUPER_ADMIN', label: tx('المسؤول الأعلى', 'Super admin', 'Super admin') },
        { id: 'GENERAL_ADMIN', label: tx('المدير العام الإداري', 'Admin général', 'General admin') },
        { id: 'HR', label: tx('الموارد البشرية (HR)', 'RH', 'HR') },
        { id: 'COMMERCIAL', label: tx('المصلحة التجارية', 'Commercial', 'Commercial') },
        { id: 'FINANCE', label: tx('المالية', 'Finances', 'Finance') },
      ]} />
      <SearchInput id="staff-search" label={tx('بحث', 'Recherche', 'Search')} value={search} onChange={setSearch} placeholder={tx('بحث بالاسم، البريد أو المنصب...', 'Nom, email ou poste…', 'Name, email or job title…')} />

      {loading ? <SkeletonRows n={4} /> : rows.length === 0 ? (
        <Empty title={tx('لم يتم العثور على أي موظف أو إداري', 'Aucun membre trouvé', 'No team members found')} body={tx('غيّر البحث أو الفلتر.', 'Changez la recherche ou le filtre.', 'Change the search or the filter.')} />
      ) : (
        <DataTable cols={cols} rows={rows} rowKey={(s) => s.id} label={tx('فريق الإدارة', "Équipe d'administration", 'Admin team')} testId="staff-table" />
      )}

      <section className="flex flex-col gap-3">
        <H2>{tx('الهيكل الإداري', 'Organigramme', 'Organisation chart')}</H2>
        <HierarchyChart />
      </section>

      <Dialog open={adding} onClose={() => setAdding(false)} size="lg" title={tx('إضافة إداري أو موظف جديد', 'Ajouter un membre', 'Add a team member')} sub={tx('تُرسل له كلمة مرور مؤقتة يجب تغييرها عند أول دخول.', 'Un mot de passe temporaire à changer à la première connexion.', 'A temporary password, to be changed at first sign-in.')} testId="add-staff-dialog">
        <form onSubmit={create} className="flex flex-col gap-4">
          {err ? <Banner kind="danger">{err}</Banner> : null}
          {ok ? <Banner kind="ok">{ok}</Banner> : null}
          <FormGrid>
            <TextInput id="sf-name" label={tx('الاسم الكامل', 'Nom complet', 'Full name')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <TextInput id="sf-email" label={tx('البريد الإلكتروني', 'Email', 'Email')} type="email" dir="ltr" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          </FormGrid>
          <PasswordField id="sf-pass" label={tx('كلمة المرور (8 أحرف على الأقل)', 'Mot de passe (8 caractères min.)', 'Password (8+ characters)')} value={form.password} onChange={(v) => setForm({ ...form, password: v })} onGenerate={() => setForm({ ...form, password: generateStrongPassword() })} />
          <SelectInput id="sf-role" label={tx('المستوى الإداري', 'Rôle hiérarchique', 'Role')} value={form.adminRole} onChange={(v) => setForm({ ...form, adminRole: v, jobTitle: ROLE_OPTIONS.find((o) => o.value === v)?.title || form.jobTitle })} options={roleOptions} />
          <TextInput id="sf-title" label={tx('المسمى الوظيفي (يظهر في البطاقة والملف)', 'Titre de poste (affiché sur la carte)', 'Job title (shown on the card)')} value={form.jobTitle} onChange={(v) => setForm({ ...form, jobTitle: v })} />
          <FormGrid>
            <TextInput id="sf-phone" label={tx('رقم الهاتف', 'Téléphone', 'Phone')} dir="ltr" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <SelectInput id="sf-wilaya" label={tx('الولاية', 'Wilaya', 'Wilaya')} value={String(form.wilayaCode)} onChange={(v) => setForm({ ...form, wilayaCode: Number(v) })} options={WILAYAS.map((w) => ({ value: String(w.code), label: `${w.code} - ${getLocalizedWilayaName(w, locale as Locale)}` }))} />
          </FormGrid>
          <Field label={tx('نبذة', 'Présentation', 'Bio')} htmlFor="sf-bio">
            <textarea id="sf-bio" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className={`${fieldClass} py-3`} />
          </Field>
          <div className="flex flex-wrap justify-end gap-2.5">
            <Btn variant="secondary" onClick={() => setAdding(false)}>{tx('إلغاء', 'Annuler', 'Cancel')}</Btn>
            <button type="submit" disabled={busy} data-testid="add-staff-submit" className={`inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold-500 px-6 text-[15px] font-semibold text-[#050505] hover:bg-gold-400 disabled:opacity-60 ${focus}`}>{busy ? '…' : tx('إضافة', 'Ajouter', 'Add')}</button>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!edit} onClose={() => setEdit(null)} title={tx('تعديل بيانات المسؤول', 'Modifier le membre', 'Edit team member')} sub={edit?.name} testId="edit-staff-dialog">
        <form onSubmit={saveEdit} className="flex flex-col gap-4">
          {editErr ? <Banner kind="danger">{editErr}</Banner> : null}
          <SelectInput id="se-role" label={tx('المستوى الإداري', 'Rôle hiérarchique', 'Role')} value={editForm.adminRole} onChange={(v) => setEditForm({ ...editForm, adminRole: v })} options={[...(!assignable.some((o) => o.value === editForm.adminRole) ? [{ value: editForm.adminRole, label: editForm.adminRole || '—' }] : []), ...roleOptions]} />
          <TextInput id="se-title" label={tx('المسمى الوظيفي', 'Titre de poste', 'Job title')} value={editForm.jobTitle} onChange={(v) => setEditForm({ ...editForm, jobTitle: v })} />
          <TextInput id="se-phone" label={tx('الهاتف', 'Téléphone', 'Phone')} dir="ltr" value={editForm.phone} onChange={(v) => setEditForm({ ...editForm, phone: v })} />
          <Field label={tx('نبذة', 'Présentation', 'Bio')} htmlFor="se-bio">
            <textarea id="se-bio" rows={3} maxLength={1000} value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} className={`${fieldClass} py-3`} />
          </Field>
          <div className="flex flex-wrap justify-end gap-2.5">
            <Btn variant="secondary" onClick={() => setEdit(null)}>{tx('إلغاء', 'Annuler', 'Cancel')}</Btn>
            <button type="submit" disabled={editBusy} className={`inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold-500 px-6 text-[15px] font-semibold text-[#050505] hover:bg-gold-400 disabled:opacity-60 ${focus}`}>{editBusy ? '…' : tx('حفظ', 'Enregistrer', 'Save')}</button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} busy={delBusy} error={delErr} title={tx('حذف نهائي', 'Suppression définitive', 'Delete permanently')} body={`${tx('هل أنت متأكد من حذف هذا المسؤول نهائياً؟', 'Supprimer ce membre définitivement ?', 'Delete this team member permanently?')} ${del?.name || ''}`} confirm={tx('حذف', 'Supprimer', 'Delete')} />
    </div>
  );
};
