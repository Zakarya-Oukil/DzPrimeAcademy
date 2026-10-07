'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ShieldCheck,
  UserPlus,
  Trash2,
  ExternalLink,
  Loader2,
  X,
  Check,
  GraduationCap,
} from 'lucide-react';
import { WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';
import { Locale } from '@/types';

interface StudentsTabProps {
  locale: Locale;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({ locale }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [wilayaFilter, setWilayaFilter] = useState<string>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    wilayaCode: 16,
    wilayaName: 'الجزائر العاصمة',
    institutionName: 'جامعة العلوم والتكنولوجيا هواري بومدين USTHB',
    track: 'UNIVERSITY_LMD',
    specialty: 'Informatique / علوم الحاسوب',
    role: 'STUDENT_PAID',
  });

  // Delete modal state
  const [deleteCandidate, setDeleteCandidate] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadSeq = useRef(0);

  // First page (re-run on search, debounced); "load more" appends the next page.
  const load = (append = false, q = search) => {
    const offset = append ? users.length : 0;
    if (append) setLoadingMore(true);
    const reqId = ++loadSeq.current;
    return fetch(`/api/students?limit=100&offset=${offset}&q=${encodeURIComponent(q.trim())}`)
      .then(async (r) => {
        const data = await r.json();
        if (reqId !== loadSeq.current) return; // a newer search superseded this response
        if (Array.isArray(data)) {
          setUsers((prev) => (append ? [...prev, ...data] : data));
          setTotal(Number(r.headers.get('X-Total-Count')) || data.length);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  };

  useEffect(() => {
    const t = setTimeout(() => load(false, search), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleToggleVerify = async (id: string, isVerified: boolean) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isVerified: !isVerified } : u)));
    await fetch('/api/students', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isVerified: !isVerified }),
    });
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAddError(null);
    setAddSuccess(null);

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل تسجيل الطالب');
      }

      setAddSuccess(
        locale === 'ar'
          ? `تم تسجيل الطالب بنجاح! كلمة المرور: ${data.tempPassword || 'المحددة'}`
          : `Étudiant inscrit ! Mot de passe : ${data.tempPassword || 'défini'}`
      );
      load();
      setTimeout(() => {
        setShowAddModal(false);
        setAddSuccess(null);
        setFormData({
          name: '',
          email: '',
          password: '',
          phone: '',
          wilayaCode: 16,
          wilayaName: 'الجزائر العاصمة',
          institutionName: 'جامعة العلوم والتكنولوجيا هواري بومدين USTHB',
          track: 'UNIVERSITY_LMD',
          specialty: 'Informatique / علوم الحاسوب',
          role: 'STUDENT_PAID',
        });
      }, 2000);
    } catch (err: any) {
      setAddError(err.message || 'حدث خطأ أثناء إضافة الطالب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'فشل حذف الطالب');
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setDeleteCandidate(null);
    } catch (err) {
      alert('خطأ في الاتصال بالخادم');
    } finally {
      setIsDeleting(false);
    }
  };

  const students = users.filter((u) => u.role === 'STUDENT_FREE' || u.role === 'STUDENT_PAID');

  const filtered = students.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.studentCardId?.toLowerCase().includes(search.toLowerCase());
    const matchesWilaya = wilayaFilter === 'ALL' || String(u.wilayaCode) === wilayaFilter;
    const matchesTier = tierFilter === 'ALL' || u.role === tierFilter;
    return matchesSearch && matchesWilaya && matchesTier;
  });

  return (
    <div className="space-y-4" data-testid="students-tab">
      {/* Search, Filter & Add Student Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              data-testid="students-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={locale === 'ar' ? 'بحث بالاسم، البريد أو رقم البطاقة...' : 'Rechercher par nom, email ou ID...'}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500"
            />
          </div>
          <select
            data-testid="students-wilaya-filter"
            value={wilayaFilter}
            onChange={(e) => setWilayaFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-200"
          >
            <option value="ALL">{locale === 'ar' ? 'كل الولايات' : 'Toutes Wilayas'}</option>
            {WILAYAS.map((w) => (
              <option key={w.code} value={w.code}>
                {w.code} - {getLocalizedWilayaName(w, locale)}
              </option>
            ))}
          </select>
          <select
            data-testid="students-tier-filter"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-200"
          >
            <option value="ALL">{locale === 'ar' ? 'كل الفئات' : 'Tous les Tiers'}</option>
            <option value="STUDENT_PAID">Gold VIP</option>
            <option value="STUDENT_FREE">Free</option>
          </select>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          data-testid="add-student-btn"
          className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>{locale === 'ar' ? 'إضافة طالب جديد' : 'Inscrire un étudiant'}</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto no-scrollbar rounded-2xl border border-white/10 bg-[#0A0D18]/50">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-[11px] uppercase bg-white/[0.02]">
              <th className="py-3 px-4">{locale === 'ar' ? 'الطالب' : 'Étudiant'}</th>
              <th className="py-3 px-4">{locale === 'ar' ? 'الولاية والجامعة' : 'Wilaya & Univ'}</th>
              <th className="py-3 px-4">{locale === 'ar' ? 'الفئة' : 'Tier'}</th>
              <th className="py-3 px-4">{locale === 'ar' ? 'رقم البطاقة' : 'Card ID'}</th>
              <th className="py-3 px-4 text-center">{locale === 'ar' ? 'حالة الاعتماد' : 'Statut'}</th>
              <th className="py-3 px-4 text-center">{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-lime-400" />
                  <span>{locale === 'ar' ? 'جاري تحميل قائمة الطلبة...' : 'Chargement...'}</span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  {locale === 'ar' ? 'لا يوجد طلبة مطابقون لخيارات البحث.' : 'Aucun étudiant trouvé.'}
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} data-testid={`student-row-${u.id}`} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-3 px-4 font-bold text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-lime-400/20 text-lime-300 font-bold flex items-center justify-center text-xs shrink-0">
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate">{u.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-gray-300 font-medium">
                      {u.wilayaCode} - {u.wilayaName || 'Alger'}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate max-w-[200px]">
                      {u.institutionName || 'Université'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'STUDENT_PAID' ? 'bg-lime-400/20 text-lime-300 border border-lime-400/30' : 'bg-white/10 text-gray-300'
                      }`}
                    >
                      {u.role === 'STUDENT_PAID' ? 'Gold VIP' : 'Free'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-gold-300">
                    {u.studentCardId}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      data-testid={`toggle-verify-${u.id}`}
                      onClick={() => handleToggleVerify(u.id, u.isVerified)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 transition-all ${
                        u.isVerified
                          ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>{u.isVerified ? (locale === 'ar' ? 'معتمد ✓' : 'Vérifié') : (locale === 'ar' ? 'معلّق' : 'En attente')}</span>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Public Profile Link */}
                      <Link
                        href={`/${locale}/profile/${u.studentCardId || u.id}`}
                        target="_blank"
                        title={locale === 'ar' ? 'عرض الملف العام ورمز QR' : 'Voir profil public'}
                        aria-label={locale === 'ar' ? 'عرض الملف العام ورمز QR' : 'Voir profil public'}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-gold-400" />
                      </Link>

                      {/* Delete button */}
                      <button
                        onClick={() => setDeleteCandidate(u)}
                        title={locale === 'ar' ? 'حذف الطالب' : 'Supprimer'}
                        aria-label={locale === 'ar' ? 'حذف الطالب' : 'Supprimer'}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {users.length < total && (
        <div className="flex justify-center">
          <button
            onClick={() => load(true)}
            disabled={loadingMore}
            className="px-4 py-2 min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-200 disabled:opacity-50"
          >
            {loadingMore ? '...' : locale === 'ar' ? `عرض المزيد (${users.length}/${total})` : `Afficher plus (${users.length}/${total})`}
          </button>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0C1224] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <GraduationCap className="w-4 h-4 text-lime-400" />
                <span>{locale === 'ar' ? 'تسجيل طالب جديد في المنصة' : 'Inscrire un nouvel étudiant'}</span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                {addError}
              </div>
            )}

            {addSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{addSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-3.5 text-xs text-gray-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">{locale === 'ar' ? 'الاسم الكامل *' : 'Nom Complet *'}</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: يونس بلقاسم"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-lime-400"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">{locale === 'ar' ? 'البريد الإلكتروني *' : 'Email *'}</label>
                  <input
                    required
                    type="email"
                    dir="ltr"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-lime-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">{locale === 'ar' ? 'كلمة المرور (اختياري، تُنشأ تلقائياً)' : 'Mot de passe (optionnel)'}</label>
                  <input
                    type="password"
                    dir="ltr"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-lime-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">{locale === 'ar' ? 'رقم الهاتف' : 'Téléphone'}</label>
                  <input
                    dir="ltr"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0555 12 34 56"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-lime-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">{locale === 'ar' ? 'الولاية' : 'Wilaya'}</label>
                  <select
                    value={formData.wilayaCode}
                    onChange={(e) => {
                      const code = Number(e.target.value);
                      const wObj = WILAYAS.find((item) => item.code === code);
                      setFormData({
                        ...formData,
                        wilayaCode: code,
                        wilayaName: wObj ? getLocalizedWilayaName(wObj, locale) : 'الجزائر العاصمة',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-lime-400"
                  >
                    {WILAYAS.map((w) => (
                      <option key={w.code} value={w.code} className="bg-slate-900 text-white">
                        {w.code} - {getLocalizedWilayaName(w, locale)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">{locale === 'ar' ? 'فئة العضوية' : 'Niveau d\'adhésion'}</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-lime-400"
                  >
                    <option value="STUDENT_PAID" className="bg-slate-900 text-white">عضوية ذهبية (GOLD VIP)</option>
                    <option value="STUDENT_FREE" className="bg-slate-900 text-white">عضوية مجانية (FREE PASS)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">{locale === 'ar' ? 'الجامعة أو المعهد' : 'Université / Institut'}</label>
                <input
                  value={formData.institutionName}
                  onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                  placeholder="USTHB, Mentouri..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-lime-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">{locale === 'ar' ? 'التخصص الدراسي' : 'Spécialité'}</label>
                  <input
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    placeholder="طب، إعلام آلي، حقوق..."
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-lime-400"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">{locale === 'ar' ? 'المسار التعليمي' : 'Filière'}</label>
                  <input
                    value={formData.track}
                    onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                    placeholder="LMD, Medecine, Bac..."
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>{locale === 'ar' ? 'تأكيد التسجيل' : 'Enregistrer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-rose-500/30 bg-[#0C1224] p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-black text-white">
              {locale === 'ar' ? 'تأكيد حذف حساب الطالب' : 'Confirmer la suppression'}
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              {locale === 'ar'
                ? `هل أنت متأكد من رغبتك في حذف حساب الطالب "${deleteCandidate.name}" (${deleteCandidate.email})؟ سيتم إلغاء بطاقته واشتراكاته نهائياً.`
                : `Voulez-vous vraiment supprimer le compte de ${deleteCandidate.name} ?`}
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold"
              >
                {locale === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDeleteStudent(deleteCandidate.id)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-60"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{locale === 'ar' ? 'نعم، احذف الطالب' : 'Supprimer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
