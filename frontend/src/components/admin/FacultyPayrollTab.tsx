'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Plus,
  Landmark,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Check,
  X,
  Search,
  UserCheck,
  Mail,
  Phone,
  Building2,
  CreditCard,
  KeyRound,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDZD } from '@/lib/format';
import { WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';
import { Locale } from '@/types';

interface FacultyPayrollTabProps {
  locale: Locale | string;
  onLiabilityChange: (total: number) => void;
}

interface CreatedTeacherCredentials {
  name: string;
  email: string;
  tempPassword: string;
  studentCardId?: string;
  university?: string;
}

export const FacultyPayrollTab: React.FC<FacultyPayrollTabProps> = ({ locale, onLiabilityChange }) => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<CreatedTeacherCredentials | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    wilayaCode: 16,
    university: '',
    specialty: '',
    hourlyRateDzd: 12000,
    ccpAccount: '',
    ccpCle: '',
  });

  const load = () => {
    fetch('/api/teachers')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTeachers(data);
          const total = data
            .flatMap((t: any) => t.payouts || [])
            .filter((p: any) => p.status === 'PENDING')
            .reduce((sum: number, p: any) => sum + (p.amountDzd || 0), 0);
          onLiabilityChange(total);
        }
      })
      .catch((err) => console.error('Failed to load teachers:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = 'Prof' + Math.floor(1000 + Math.random() * 9000) + '!';
    setForm((prev) => ({ ...prev, password: pass }));
  };

  const handleApprove = async (id: string) => {
    await fetch(`/api/teachers/${id}/payout`, { method: 'POST' });
    load();
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmText = locale === 'ar' 
      ? `هل أنت متأكد من حذف حساب الأستاذ "${name}"؟` 
      : `Êtes-vous sûr de vouloir supprimer l'enseignant "${name}" ?`;
    if (!window.confirm(confirmText)) return;

    await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
    load();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    const wilaya = WILAYAS.find((w) => w.code === Number(form.wilayaCode));
    const payload = {
      ...form,
      wilayaCode: Number(form.wilayaCode),
      wilayaName: wilaya ? getLocalizedWilayaName(wilaya, locale as Locale) : undefined,
      hourlyRateDzd: Number(form.hourlyRateDzd) || 12000,
    };

    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || (locale === 'ar' ? 'فشل إضافة الأستاذ' : "Échec de l'ajout"));
        setSubmitting(false);
        return;
      }

      setCreatedCredentials({
        name: data.user?.name || form.name,
        email: data.user?.email || form.email,
        tempPassword: data.tempPassword || form.password,
        studentCardId: data.user?.studentCardId,
        university: data.university || form.university,
      });

      setForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        wilayaCode: 16,
        university: '',
        specialty: '',
        hourlyRateDzd: 12000,
        ccpAccount: '',
        ccpCle: '',
      });
      setShowModal(false);
      load();
    } catch (err: any) {
      setErrorMsg(err?.message || (locale === 'ar' ? 'خطأ في الاتصال بالسيرفر' : 'Erreur de connexion'));
    } finally {
      setSubmitting(false);
    }
  };

  const copyCredentialsText = () => {
    if (!createdCredentials) return;
    const text = locale === 'ar'
      ? `🇩🇿 مرحباً بك أستاذنا الفاضل ${createdCredentials.name} في منصة DZ PRIME ACADEMY\n\nتم تفعيل حسابك كأستاذ معتمد:\n📧 البريد الإلكتروني: ${createdCredentials.email}\n🔑 كلمة المرور المؤقتة: ${createdCredentials.tempPassword}\n\nيرجى تسجيل الدخول وتغيير كلمة المرور من إعدادات حسابك.`
      : `🇩🇿 Bienvenue Cher Enseignant ${createdCredentials.name} sur DZ PRIME ACADEMY\n\nVos identifiants :\n📧 Email : ${createdCredentials.email}\n🔑 Mot de passe : ${createdCredentials.tempPassword}\n\nConnectez-vous et modifiez votre mot de passe depuis vos paramètres.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const filteredTeachers = teachers.filter((t) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      t.user?.name?.toLowerCase().includes(q) ||
      t.user?.email?.toLowerCase().includes(q) ||
      t.university?.toLowerCase().includes(q) ||
      t.specialty?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5" data-testid="faculty-payroll-tab">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
        <div>
          <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-lime-400" />
            <span>{locale === 'ar' ? 'سجل أعضاء هيئة التدريس وتسويات المستحقات' : 'Faculty Registry & Payroll Ledger'}</span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {locale === 'ar' ? `إجمالي الأساتذة المسجلين: ${teachers.length} أستاذ معتمد` : `Total enseignants : ${teachers.length}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={locale === 'ar' ? 'بحث بالاسم، الجامعة أو التخصص...' : 'Recherche...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 w-48 sm:w-64"
            />
          </div>

          <button
            data-testid="add-teacher-btn"
            onClick={() => {
              setErrorMsg('');
              setShowModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-lime-400/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{locale === 'ar' ? 'إضافة أستاذ جديد' : 'Ajouter un Enseignant'}</span>
          </button>
        </div>
      </div>

      {/* Add Teacher Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-lime-500/30 bg-[#0C1222] p-5 sm:p-7 text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-lime-400/20 text-lime-400 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black">
                      {locale === 'ar' ? 'إنشاء وتفعيل حساب أستاذ جديد' : 'Créer un Compte Enseignant'}
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      {locale === 'ar' ? 'أدخل بيانات الأستاذ وكلمة المرور لتسجيله في المنصة' : 'Renseignez les détails et identifiants de connexion'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleAdd} data-testid="add-teacher-form" className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Name */}
                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">
                      {locale === 'ar' ? 'الاسم الكامل واللقب الأكاديمي' : 'Nom & Titre académique'} *
                    </label>
                    <input
                      required
                      placeholder={locale === 'ar' ? 'د. أسامة بلقاسم' : 'Dr. Oussama Belkacem'}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-lime-400"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">
                      {locale === 'ar' ? 'البريد الإلكتروني (لتسجيل الدخول)' : 'Adresse Email'} *
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="prof.oussama@univ-alger.dz"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono placeholder-gray-500 focus:outline-none focus:border-lime-400"
                    />
                  </div>

                  {/* Password */}
                  <div className="sm:col-span-2 bg-white/[0.02] p-3.5 rounded-2xl border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-gray-300 font-semibold flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-lime-400" />
                        <span>{locale === 'ar' ? 'كلمة المرور لتسجيل الدخول' : 'Mot de passe de connexion'}</span>
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[11px] font-bold text-lime-400 hover:text-lime-300 flex items-center gap-1 hover:underline"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{locale === 'ar' ? 'توليد كلمة مرور قوية' : 'Générer un mot de passe'}</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={locale === 'ar' ? 'اترك فارغاً لتوليد كلمة مرور عشوائية أو اكتب كلمة مخصصة (8 أحرف+)' : 'Mot de passe personnalisé (min 8 car.)'}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono placeholder-gray-500 focus:outline-none focus:border-lime-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      {locale === 'ar'
                        ? 'سيتمكن الأستاذ من تغيير كلمة المرور هذه فور تسجيل دخوله من إعدادات حسابه.'
                        : "L'enseignant pourra changer ce mot de passe à tout moment depuis ses paramètres."}
                    </p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">
                      {locale === 'ar' ? 'رقم الهاتف (واتساب)' : 'Téléphone (WhatsApp)'}
                    </label>
                    <input
                      placeholder="0555 12 34 56"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      dir="ltr"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono placeholder-gray-500 focus:outline-none focus:border-lime-400"
                    />
                  </div>

                  {/* Wilaya */}
                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">
                      {locale === 'ar' ? 'الولاية' : 'Wilaya'}
                    </label>
                    <select
                      value={form.wilayaCode}
                      onChange={(e) => setForm({ ...form, wilayaCode: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E1528] border border-white/10 text-white focus:outline-none focus:border-lime-400"
                    >
                      {WILAYAS.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.code} - {getLocalizedWilayaName(w, locale as Locale)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* University */}
                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">
                      {locale === 'ar' ? 'الجامعة / الكلية' : 'Université / Faculté'} *
                    </label>
                    <input
                      required
                      placeholder={locale === 'ar' ? 'جامعة الجزائر 1 / USTHB' : 'Université USTHB'}
                      value={form.university}
                      onChange={(e) => setForm({ ...form, university: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-lime-400"
                    />
                  </div>

                  {/* Specialty */}
                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">
                      {locale === 'ar' ? 'التخصص / المادة' : 'Spécialité / Matière'}
                    </label>
                    <input
                      placeholder={locale === 'ar' ? 'رياضيات، إعلام آلي، فيزياء...' : 'Mathématiques, Informatique...'}
                      value={form.specialty}
                      onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-lime-400"
                    />
                  </div>

                  {/* Hourly Rate */}
                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">
                      {locale === 'ar' ? 'الأجر بالساعة (د.ج)' : 'Taux horaire (DZD)'}
                    </label>
                    <input
                      type="number"
                      placeholder="12000"
                      value={form.hourlyRateDzd}
                      onChange={(e) => setForm({ ...form, hourlyRateDzd: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono focus:outline-none focus:border-lime-400"
                    />
                  </div>

                  {/* CCP Info */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-gray-300 mb-1 font-semibold">
                        {locale === 'ar' ? 'رقم حساب CCP' : 'Compte CCP'}
                      </label>
                      <input
                        placeholder="0012345678"
                        value={form.ccpAccount}
                        onChange={(e) => setForm({ ...form, ccpAccount: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono focus:outline-none focus:border-lime-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-1 font-semibold">
                        {locale === 'ar' ? 'المفتاح' : 'Clé'}
                      </label>
                      <input
                        placeholder="99"
                        maxLength={2}
                        value={form.ccpCle}
                        onChange={(e) => setForm({ ...form, ccpCle: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-center focus:outline-none focus:border-lime-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold"
                  >
                    {locale === 'ar' ? 'إلغاء' : 'Annuler'}
                  </button>
                  <button
                    type="submit"
                    data-testid="submit-teacher-btn"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black flex items-center gap-2 shadow-lg shadow-lime-400/20 active:scale-95 transition-all disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    <span>{locale === 'ar' ? 'تأكيد وحفظ الأستاذ' : 'Créer le Compte'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success / Created Credentials Dialog */}
      <AnimatePresence>
        {createdCredentials && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md rounded-3xl border border-lime-400/40 bg-gradient-to-b from-[#0D182E] to-[#080D1A] p-6 text-white shadow-2xl text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-lime-400/20 text-lime-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-base font-black text-white">
                  {locale === 'ar' ? 'تم إنشاء وتفعيل حساب الأستاذ بنجاح! 🎉' : 'Enseignant créé avec succès ! 🎉'}
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  {locale === 'ar'
                    ? 'انسخ بيانات الدخول وأرسلها للأستاذ لتسجيل الدخول إلى استوديو التدريس'
                    : 'Copiez les identifiants pour les transmettre à l\'enseignant'}
                </p>
              </div>

              {/* Credentials Card */}
              <div className="bg-white/[0.04] p-4 rounded-2xl border border-white/10 text-left space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-400 text-[11px]">👤 {locale === 'ar' ? 'الاسم' : 'Nom'}:</span>
                  <span className="font-bold text-white font-sans">{createdCredentials.name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-400 text-[11px]">📧 Email:</span>
                  <span className="text-lime-400 font-bold select-all">{createdCredentials.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-[11px]">🔑 Password:</span>
                  <span className="text-lime-300 font-bold bg-lime-400/10 px-2 py-0.5 rounded select-all">
                    {createdCredentials.tempPassword}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={copyCredentialsText}
                  className="w-full py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-lime-400/20"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? (locale === 'ar' ? 'تم نسخ البيانات بنجاح ✓' : 'Copié ✓') : locale === 'ar' ? 'نسخ بيانات الدخول كاملة' : 'Copier les identifiants'}</span>
                </button>

                <button
                  onClick={() => setCreatedCredentials(null)}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs"
                >
                  {locale === 'ar' ? 'إغلاق ومتابعة' : 'Fermer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Teachers Table */}
      <div className="overflow-x-auto no-scrollbar rounded-2xl border border-white/10 bg-white/[0.02]">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-[11px] uppercase bg-white/[0.03]">
              <th className="py-3.5 px-4">{locale === 'ar' ? 'الأستاذ والمعلومات' : 'Enseignant'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'الجامعة والتخصص' : 'Université / Spécialité'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'الساعات' : 'Heures'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'الطلبة' : 'Étudiants'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'الأجر/ساعة' : 'Taux/h'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'المستحقات الشهرية' : 'Part Mensuelle'}</th>
              <th className="py-3.5 px-4">CCP</th>
              <th className="py-3.5 px-4 text-center">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-200">
            {loading && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-lime-400 mb-2" />
                  <span>{locale === 'ar' ? 'جاري تحميل قائمة الأساتذة...' : 'Chargement...'}</span>
                </td>
              </tr>
            )}

            {!loading && filteredTeachers.map((t) => {
              const pendingPayout = (t.payouts || []).find((p: any) => p.status === 'PENDING');
              return (
                <tr key={t.id} data-testid={`teacher-row-${t.id}`} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-lime-400/30 to-emerald-500/30 text-lime-300 flex items-center justify-center font-black border border-lime-400/30 shrink-0">
                        {t.user?.name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-white font-bold truncate">{t.user?.name}</div>
                        <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-lime-400 shrink-0" />
                          <span className="truncate">{t.user?.email}</span>
                        </div>
                        {t.user?.phone && (
                          <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 text-gray-400" />
                            <span>{t.user.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-200">{t.university}</div>
                    <div className="text-[11px] text-lime-400 font-medium">{t.specialty || '-'}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono">{t.hoursTaught}h</td>
                  <td className="py-3.5 px-4 font-mono">{t.studentsCount}</td>
                  <td className="py-3.5 px-4 font-mono">{formatDZD(t.hourlyRateDzd, locale)}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-lime-400">{formatDZD(t.monthlyShareDzd, locale)}</td>
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    {t.ccpAccount ? (
                      <div>
                        <span>{t.ccpAccount}</span>
                        {t.ccpCle && <span className="text-gray-400 text-[10px]"> (Clé {t.ccpCle})</span>}
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-center gap-2">
                      {pendingPayout ? (
                        <button
                          data-testid={`approve-payout-${t.id}`}
                          onClick={() => handleApprove(t.id)}
                          className="px-3 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{locale === 'ar' ? 'صرف' : 'Payer'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                          ✓ {locale === 'ar' ? 'مستوفى' : 'Réglé'}
                        </span>
                      )}

                      {t.user?.studentCardId && (
                        <Link
                          href={`/${locale}/profile/${t.user.studentCardId}`}
                          target="_blank"
                          title={locale === 'ar' ? 'عرض الملف العام ورمز QR' : 'Voir profil public'}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gold-400 hover:text-gold-300 border border-white/10 transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}

                      <button
                        title={locale === 'ar' ? 'حذف الأستاذ' : 'Supprimer'}
                        onClick={() => handleDelete(t.id, t.user?.name || '')}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!loading && filteredTeachers.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-gray-400 text-xs">
                  {searchTerm
                    ? (locale === 'ar' ? 'لا توجد نتائج مطابقة لبحثك' : 'Aucun résultat trouvé')
                    : (locale === 'ar' ? 'لم يتم إضافة أي أستاذ بعد. انقر على "إضافة أستاذ جديد" للبدء.' : 'Aucun enseignant enregistré.')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
