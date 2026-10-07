'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  Loader2,
  Check,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Mail,
  Phone,
  Building2,
  Award,
  Lock,
  Sparkles,
  Eye,
  EyeOff,
  Pencil,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';
import { isSuperAdmin, isHRManager, getUserHierarchyLevel, canManageUser, canAssignAdminRole } from '@/lib/rbac';
import { HierarchyChart } from '@/components/dashboard/HierarchyChart';
import { Locale, User } from '@/types';

const ROLE_OPTIONS: { value: string; label: string; title: string }[] = [
  { value: 'SUPER_ADMIN', label: '👑 Super Admin (Level 100 - صلاحية كاملة ومؤسس)', title: 'Directeur Général (المؤسس)' },
  { value: 'GENERAL_ADMIN', label: '⚡ Admin Général / المدير العام (Level 95 - صلاحية تنفيذية كاملة)', title: 'Admin Général (المدير العام التنفيذي)' },
  { value: 'HR_MANAGER', label: '👩‍💼 Chargée RH / Responsable RH (Level 85 - مسؤولة الموارد البشرية وإدارة الأساتذة والسفراء والطلبة)', title: 'Chargée des Ressources Humaines' },
  { value: 'COMMERCIAL', label: '💼 Chargée Commerciale / Responsable Commercial (Level 80 - مسؤولة الدورات، الحزم والعروض الترويجية)', title: 'Chargée Commerciale' },
  { value: 'HR_EMPLOYEE', label: '🤝 Employé RH / Collaborateur RH (Level 75 - إدارة وإضافة الأساتذة والطلبة والسفراء)', title: 'Collaborateur RH & Recrutement' },
  { value: 'FINANCE', label: '💳 Responsable Financier (Level 65 - المركز المالي والمدفوعات)', title: 'Responsable Financier' },
  { value: 'ADMIN', label: '🛡️ Administrateur Général (Level 65 - إدارة عامة)', title: 'Administrateur' },
];

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'ADMIN',
  adminRole: '',
  jobTitle: '',
  phone: '',
  wilayaCode: 16,
  wilayaName: 'Alger',
  bio: '',
};

interface StaffTabProps {
  locale: Locale | string;
}

export const StaffTab: React.FC<StaffTabProps> = ({ locale }) => {
  const { currentUser } = useAuthStore();
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // New Staff Form
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // Delete modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Edit modal state
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ jobTitle: '', adminRole: '', phone: '', bio: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Only roles the signed-in actor may actually hand out (matches the server rule).
  const assignable = ROLE_OPTIONS.filter((o) => currentUser && canAssignAdminRole(currentUser, o.value));

  const openAdd = () => {
    const first = assignable[0];
    setErrorMessage('');
    setForm({ ...EMPTY_FORM, adminRole: first?.value || '', jobTitle: first?.title || '' });
    setIsAddModalOpen(true);
  };

  const openEdit = (s: User) => {
    setEditError('');
    setEditTarget(s);
    setEditForm({ jobTitle: s.jobTitle || '', adminRole: s.adminRole || '', phone: s.phone || '', bio: s.bio || '' });
  };

  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditSaving(true);
    setEditError('');
    try {
      const body: Record<string, string> = { jobTitle: editForm.jobTitle, phone: editForm.phone, bio: editForm.bio };
      if (editForm.adminRole && editForm.adminRole !== (editTarget.adminRole || '')) body.adminRole = editForm.adminRole;
      const res = await fetch(`/api/admin/staff/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEditError(data.error || 'فشل التعديل');
      } else {
        setEditTarget(null);
        fetchStaff();
      }
    } catch {
      setEditError('خطأ في الاتصال');
    } finally {
      setEditSaving(false);
    }
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/staff');
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const wilaya = WILAYAS.find((w) => w.code === Number(form.wilayaCode));
      const payload = {
        ...form,
        wilayaCode: Number(form.wilayaCode),
        wilayaName: wilaya ? getLocalizedWilayaName(wilaya, locale as any) : 'Alger',
      };

      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'فشل إضافة المسؤول');
      } else {
        setSuccessMessage(locale === 'ar' ? 'تمت إضافة المسؤول بنجاح ✓' : 'Membre ajouté avec succès ✓');
        fetchStaff();
        setTimeout(() => {
          setIsAddModalOpen(false);
          setSuccessMessage('');
          setForm({ ...EMPTY_FORM });
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'خطأ في الاتصال');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا المسؤول نهائياً؟' : 'Voulez-vous vraiment supprimer ce membre ?')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'فشل الحذف');
      } else {
        fetchStaff();
      }
    } catch (e) {
      alert('خطأ في الاتصال');
    } finally {
      setDeletingId(null);
    }
  };

  const actorIsSuper = isSuperAdmin(currentUser);
  const actorIsHR = isHRManager(currentUser);
  const canAddStaff = actorIsSuper || actorIsHR;

  // Filtered List
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.jobTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.studentCardId || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === 'ALL' ||
      (roleFilter === 'SUPER_ADMIN' && (s.role === 'OWNER' || s.adminRole === 'SUPER_ADMIN')) ||
      (roleFilter === 'GENERAL_ADMIN' && s.adminRole === 'GENERAL_ADMIN') ||
      (roleFilter === 'HR' && (s.adminRole === 'HR_MANAGER' || s.adminRole === 'HR_EMPLOYEE')) ||
      (roleFilter === 'COMMERCIAL' && s.adminRole === 'COMMERCIAL') ||
      (roleFilter === 'FINANCE' && s.adminRole === 'FINANCE') ||
      (roleFilter === 'ADMIN' && (s.role === 'ADMIN' && !s.adminRole));

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 font-arabic" data-testid="admin-staff-tab">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0C152E] via-[#101E42] to-[#0A1024] border border-gold-500/40 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-gold-500 via-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-black shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black flex items-center gap-2">
              <span>{locale === 'ar' ? 'إدارة الطاقم الإداري والموارد البشرية (HR)' : 'Gestion du Personnel & Ressources Humaines'}</span>
              <span className="px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 text-[10px] font-bold">
                HIERARCHY SYSTEM
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {locale === 'ar'
                ? 'إدارة صلاحيات الإدارة، مسؤولات ومسؤولي الموارد البشرية، المالية والمشرفين'
                : 'Gestion des rôles hiérarchiques, Chargée RH, collaborateurs et finances'}
            </p>
          </div>
        </div>

        {canAddStaff && (
          <button
            onClick={openAdd}
            data-testid="add-staff-btn"
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 via-amber-400 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-navy-950 font-black text-xs flex items-center gap-2 shadow-gold-glow active:scale-95 transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>{locale === 'ar' ? 'إضافة إداري أو موظف جديد' : 'Ajouter un Membre'}</span>
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
          <span className="text-gray-400">{locale === 'ar' ? 'إجمالي الطاقم:' : 'Total Staff:'}</span>
          <p className="text-xl font-black text-white font-mono">{staffList.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
          <span className="text-gray-400">{locale === 'ar' ? 'فريق الموارد البشرية (HR):' : 'Équipe RH:'}</span>
          <p className="text-xl font-black text-gold-400 font-mono">
            {staffList.filter((s) => s.adminRole === 'HR_MANAGER' || s.adminRole === 'HR_EMPLOYEE').length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
          <span className="text-gray-400">{locale === 'ar' ? 'المصلحة التجارية:' : 'Commercial & Offres:'}</span>
          <p className="text-xl font-black text-amber-400 font-mono">
            {staffList.filter((s) => s.adminRole === 'COMMERCIAL').length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
          <span className="text-gray-400">{locale === 'ar' ? 'المالية والمحاسبة:' : 'Finances:'}</span>
          <p className="text-xl font-black text-emerald-400 font-mono">
            {staffList.filter((s) => s.adminRole === 'FINANCE').length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
          <span className="text-gray-400">{locale === 'ar' ? 'المستوى الإداري الحالي:' : 'Votre niveau:'}</span>
          <p className="text-xs font-bold text-lime-400">
            {actorIsSuper ? 'SUPER ADMIN (Lvl 100)' : actorIsHR ? 'HR MANAGER (Lvl 85)' : 'STAFF (Authorized)'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/10">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={locale === 'ar' ? 'بحث بالاسم، البريد أو المنصب...' : 'Recherche nom, email, poste...'}
            className="w-full pr-9 pl-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs focus:outline-none focus:border-gold-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'ALL', labelAr: 'الكل', labelFr: 'Tous' },
            { id: 'SUPER_ADMIN', labelAr: 'المسؤول الأعلى', labelFr: 'Super Admin' },
            { id: 'GENERAL_ADMIN', labelAr: 'المدير العام الإداري', labelFr: 'Admin Général' },
            { id: 'HR', labelAr: 'الموارد البشرية (HR)', labelFr: 'Ressources Humaines' },
            { id: 'COMMERCIAL', labelAr: 'المصلحة التجارية (Commercial)', labelFr: 'Commercial' },
            { id: 'FINANCE', labelAr: 'المالية', labelFr: 'Finances' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setRoleFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                roleFilter === f.id
                  ? 'bg-gold-500 text-navy-950 shadow-md'
                  : 'text-gray-400 hover:text-white bg-white/5'
              }`}
            >
              {locale === 'ar' ? f.labelAr : f.labelFr}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Table / List */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 text-gold-400 animate-spin" />
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/10 text-gray-400 text-xs">
          {locale === 'ar' ? 'لم يتم العثور على أي موظف أو إداري.' : 'Aucun membre trouvé.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStaff.map((staff) => {
            const level = getUserHierarchyLevel(staff);
            const canDelete = currentUser ? canManageUser(currentUser, staff) : false;

            const isHR = staff.adminRole === 'HR_MANAGER' || staff.adminRole === 'HR_EMPLOYEE';
            const isCommercial = staff.adminRole === 'COMMERCIAL';
            const isGenAdmin = staff.adminRole === 'GENERAL_ADMIN';
            const isFin = staff.adminRole === 'FINANCE';
            const isSuper = staff.role === 'OWNER' || staff.adminRole === 'SUPER_ADMIN';

            return (
              <div
                key={staff.id}
                className="p-5 rounded-3xl border border-white/10 bg-[#0A0E1A] hover:border-gold-500/40 transition-all space-y-3.5 shadow-lg relative overflow-hidden"
              >
                {/* Top Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl border border-gold-400/60 bg-gradient-to-tr from-gold-500/20 to-amber-500/30 text-gold-300 flex items-center justify-center font-black text-lg shrink-0">
                      {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                        <span>{staff.name}</span>
                        {staff.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </h3>
                      <p className="text-xs text-gold-300 font-bold mt-0.5">
                        {staff.jobTitle || (isSuper ? 'المدير العام (المؤسس)' : isGenAdmin ? 'Admin Général (المدير العام الإداري)' : isHR ? 'مسؤول الموارد البشرية' : isCommercial ? 'Chargée Commerciale' : 'مسؤول إداري')}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-black shrink-0 ${
                      isSuper
                        ? 'bg-gold-500/20 text-gold-300 border border-gold-400/50'
                        : isGenAdmin
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/50'
                        : isHR
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-400/50'
                        : isCommercial
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                        : isFin
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                        : 'bg-white/10 text-gray-300 border border-white/10'
                    }`}
                  >
                    Level {level}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-gray-300 pt-1 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-gold-400" />
                      <span>Email:</span>
                    </span>
                    <span className="font-mono text-gray-200">{staff.email}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Award className="w-3 h-3 text-sky-400" />
                      <span>Card ID:</span>
                    </span>
                    <span className="font-mono text-gold-300 font-bold">{staff.studentCardId}</span>
                  </div>

                  {staff.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>Phone:</span>
                      </span>
                      <span className="font-mono text-gray-200" dir="ltr">{staff.phone}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <Link
                    href={`/${locale}/profile/${staff.studentCardId || staff.id}`}
                    target="_blank"
                    className="text-gold-400 hover:text-gold-300 font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>{locale === 'ar' ? 'معاينة الملف العام' : 'Voir Profil Public'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  {canDelete && (
                    <button
                      onClick={() => openEdit(staff)}
                      className="px-3 py-1.5 min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-gold-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>{locale === 'ar' ? 'تعديل' : 'Modifier'}</span>
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => handleDeleteStaff(staff.id)}
                      disabled={deletingId === staff.id}
                      className="px-3 py-1.5 min-h-[44px] rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {deletingId === staff.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      <span>{locale === 'ar' ? 'حذف' : 'Supprimer'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= ADD STAFF MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-gold-500/40 bg-[#0B0E1A] p-6 text-white shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-black text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-gold-400" />
                <span>{locale === 'ar' ? 'إضافة إداري أو موظف جديد' : 'Ajouter un Membre de l\'Équipe'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                aria-label={locale === 'ar' ? 'إغلاق' : 'Fermer'}
                className="text-gray-400 hover:text-white text-xs min-w-[44px] min-h-[44px]"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">
                  {locale === 'ar' ? 'الاسم الكامل' : 'Nom complet'} *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: نسرين بلقاسم"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">
                  {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'} *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="hr@dzprime.academy"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 font-mono text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">
                  {locale === 'ar' ? 'كلمة المرور' : 'Mot de passe'} *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="•••••••• (8+ أحرف)"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white/5 border border-white/10 font-mono text-white focus:outline-none focus:border-gold-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={locale === 'ar' ? 'إظهار/إخفاء كلمة المرور' : 'Afficher/masquer le mot de passe'}
                    className="absolute right-0 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Exact Role Hierarchy Selector */}
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">
                  {locale === 'ar' ? 'المستوى الإداري (التسلسل الهرمي)' : 'Rôle Hiérarchique'} *
                </label>
                <select
                  value={form.adminRole}
                  onChange={(e) => {
                    const r = e.target.value;
                    const defaultTitle = ROLE_OPTIONS.find((o) => o.value === r)?.title || '';
                    setForm({ ...form, adminRole: r, jobTitle: defaultTitle });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F162B] border border-white/10 text-white font-bold focus:outline-none focus:border-gold-400"
                >
                  {assignable.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Exact Job Title Input */}
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">
                  {locale === 'ar' ? 'المسمى الوظيفي الدقيق (يظهر في البطاقة والملف الشخصي)' : 'Titre de Poste Exact (affiché sur le badge)'} *
                </label>
                <input
                  required
                  value={form.jobTitle}
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                  placeholder="مثال: Chargée des Ressources Humaines"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-gold-400/40 text-gold-300 font-bold focus:outline-none focus:border-gold-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">
                    {locale === 'ar' ? 'الهاتف' : 'Téléphone'}
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0555 12 34 56"
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 font-mono text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">
                    {locale === 'ar' ? 'الولاية' : 'Wilaya'}
                  </label>
                  <select
                    value={form.wilayaCode}
                    onChange={(e) => setForm({ ...form, wilayaCode: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0F162B] border border-white/10 text-xs focus:outline-none"
                  >
                    {WILAYAS.map((w) => (
                      <option key={w.code} value={w.code}>
                        {w.code} - {getLocalizedWilayaName(w, locale as any)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">
                  {locale === 'ar' ? 'نبذة تعريفية (Bio)' : 'Bio'}
                </label>
                <textarea
                  rows={2}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder={locale === 'ar' ? 'نبذة عن المهام الإدارية...' : 'Description brève...'}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-navy-950 font-black text-xs flex items-center gap-1.5 shadow-gold-glow disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{locale === 'ar' ? 'تأكيد وإضافة المسؤول' : 'Confirmer l\'ajout'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
          <form onSubmit={handleEditStaff} className="relative w-full max-w-lg rounded-3xl border border-gold-500/40 bg-[#0B0E1A] p-6 text-white shadow-2xl space-y-3.5 text-xs max-h-[92vh] overflow-y-auto">
            <h3 className="font-black text-base">{locale === 'ar' ? 'تعديل بيانات' : 'Modifier'} {editTarget.name}</h3>
            {editError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold">{editError}</div>
            )}
            {editTarget.role !== 'OWNER' && (
              <div>
                <label htmlFor="staff-edit-role" className="block text-gray-400 mb-1 font-semibold">{locale === 'ar' ? 'المستوى الإداري' : 'Rôle Hiérarchique'}</label>
                <select
                  id="staff-edit-role"
                  value={editForm.adminRole}
                  onChange={(e) => setEditForm({ ...editForm, adminRole: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F162B] border border-white/10 text-white font-bold focus:outline-none focus:border-gold-400"
                >
                  {!assignable.some((o) => o.value === editForm.adminRole) && (
                    <option value={editForm.adminRole}>{editForm.adminRole || '—'}</option>
                  )}
                  {assignable.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="staff-edit-title" className="block text-gray-400 mb-1 font-semibold">{locale === 'ar' ? 'المسمى الوظيفي' : 'Titre de Poste'}</label>
              <input id="staff-edit-title" value={editForm.jobTitle} maxLength={120} onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-gold-400/40 text-gold-300 font-bold focus:outline-none focus:border-gold-400" />
            </div>
            <div>
              <label htmlFor="staff-edit-phone" className="block text-gray-400 mb-1 font-semibold">{locale === 'ar' ? 'الهاتف' : 'Téléphone'}</label>
              <input id="staff-edit-phone" dir="ltr" value={editForm.phone} maxLength={30} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 font-mono focus:outline-none" />
            </div>
            <div>
              <label htmlFor="staff-edit-bio" className="block text-gray-400 mb-1 font-semibold">Bio</label>
              <textarea id="staff-edit-bio" rows={2} value={editForm.bio} maxLength={1000} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:outline-none" />
            </div>
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/10">
              <button type="button" onClick={() => setEditTarget(null)} className="px-4 py-2 min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 font-bold">{locale === 'ar' ? 'إلغاء' : 'Annuler'}</button>
              <button type="submit" disabled={editSaving} className="px-5 py-2 min-h-[44px] rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-black flex items-center gap-1.5 disabled:opacity-50">
                {editSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{locale === 'ar' ? 'حفظ' : 'Enregistrer'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leadership & Governance Hierarchy Section for Admins and Staff */}
      <div className="pt-8 border-t border-white/10 space-y-4">
        <HierarchyChart />
      </div>
    </div>
  );
};
