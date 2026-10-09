'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Tag,
  Plus,
  Trash2,
  KeyRound,
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
  AlertCircle,
  Loader2,
  Send,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDZD } from '@/lib/format';
import { generateStrongPassword } from '@/lib/clientPassword';
import { WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';
import { Locale } from '@/types';

interface AmbassadorsTabProps {
  locale: Locale | string;
}

interface CreatedAmbassadorCredentials {
  name: string;
  email: string;
  tempPassword: string;
  promoCode?: string;
  studentCardId?: string;
  institution?: string;
}

export const AmbassadorsTab: React.FC<AmbassadorsTabProps> = ({ locale }) => {
  const [ambassadors, setAmbassadors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdCred, setCreatedCred] = useState<CreatedAmbassadorCredentials | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    wilayaCode: 16,
    institutionNameAr: '',
    specialtyName: '',
    promoCode: '',
    telegramHandle: '',
  });

  const load = () => {
    fetch('/api/ambassadors')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAmbassadors(data);
      })
      .catch((err) => console.error('Failed to load ambassadors:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const generateRandomPassword = () => {
    setForm((prev) => ({ ...prev, password: generateStrongPassword() }));
  };

  const totalCommission = ambassadors.reduce((sum, a) => sum + (a.commissionDzd || 0), 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    const wilaya = WILAYAS.find((w) => w.code === Number(form.wilayaCode));
    const payload = {
      ...form,
      wilayaCode: Number(form.wilayaCode),
      wilayaNameAr: wilaya?.nameAr,
      wilayaNameFr: wilaya?.nameFr,
    };

    try {
      const res = await fetch('/api/ambassadors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || (locale === 'ar' ? 'فشل إضافة السفير' : "Échec de l'ajout"));
        setSubmitting(false);
        return;
      }

      setCreatedCred({
        name: data.user?.name || form.name,
        email: data.user?.email || form.email,
        tempPassword: data.tempPassword || form.password,
        promoCode: data.promoCode,
        studentCardId: data.user?.studentCardId,
        institution: data.institutionNameAr || form.institutionNameAr,
      });

      setForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        wilayaCode: 16,
        institutionNameAr: '',
        specialtyName: '',
        promoCode: '',
        telegramHandle: '',
      });
      setShowModal(false);
      load();
    } catch (err: any) {
      setErrorMsg(err?.message || (locale === 'ar' ? 'خطأ في الاتصال بالسيرفر' : 'Erreur de connexion'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmText = locale === 'ar'
      ? `هل أنت متأكد من حذف حساب السفير "${name}"؟`
      : `Êtes-vous sûr de vouloir supprimer l'ambassadeur "${name}" ?`;
    if (!window.confirm(confirmText)) return;

    await fetch(`/api/ambassadors/${id}`, { method: 'DELETE' });
    load();
  };

  const copyCredentialsText = () => {
    if (!createdCred) return;
    const text = locale === 'ar'
      ? `🇩🇿 مرحباً بك سفيرنا المعتمد ${createdCred.name} في منصة DZ PRIME ACADEMY\n\nتم تفعيل حسابك كسفير رسمي:\nالبريد الإلكتروني: ${createdCred.email}\nكلمة المرور المؤقتة: ${createdCred.tempPassword}\nكود الترويج الخاص بك: ${createdCred.promoCode || 'مفعل'}\n\nيرجى تسجيل الدخول وتغيير كلمة المرور من إعدادات حسابك.`
      : `🇩🇿 Bienvenue Cher Ambassadeur ${createdCred.name} sur DZ PRIME ACADEMY\n\nVos identifiants officiels :\nEmail : ${createdCred.email}\nMot de passe : ${createdCred.tempPassword}\nCode Promo : ${createdCred.promoCode || 'Actif'}\n\nConnectez-vous et modifiez votre mot de passe depuis vos paramètres.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const filteredAmbassadors = ambassadors.filter((a) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      a.user?.name?.toLowerCase().includes(q) ||
      a.user?.email?.toLowerCase().includes(q) ||
      a.institutionNameAr?.toLowerCase().includes(q) ||
      a.wilayaNameAr?.toLowerCase().includes(q) ||
      a.promoCode?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5" data-testid="ambassadors-tab">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
        <div>
          <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-lime-400" />
            <span>{locale === 'ar' ? 'شبكة السفراء المعتمدين عبر 58 ولاية' : 'National Ambassador Network (58 Wilayas)'}</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {locale === 'ar' ? `إجمالي السفراء: ${ambassadors.length} سفير • عمولة 10% على الاشتراكات` : `Total ambassadeurs : ${ambassadors.length}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={locale === 'ar' ? 'بحث بالاسم، الولاية، الكود...' : 'Recherche...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 w-44 sm:w-56"
            />
          </div>

          <span className="px-3 py-1.5 rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-300 text-xs font-mono font-bold">
            {locale === 'ar' ? 'العمولات: ' : 'Commissions: '}{formatDZD(totalCommission, locale as Locale)}
          </span>

          <button
            data-testid="add-ambassador-btn"
            onClick={() => {
              setErrorMsg('');
              setShowModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-lime-400/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{locale === 'ar' ? 'إضافة سفير جديد' : 'Ajouter un Ambassadeur'}</span>
          </button>
        </div>
      </div>

      {/* Add Ambassador Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              className="dark relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-lime-500/30 bg-[#111114] p-5 sm:p-7 text-white shadow-2xl space-y-4 font-arabic"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-lime-400/20 text-lime-400 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black">
                      {locale === 'ar' ? 'إنشاء وتفعيل حساب سفير جديد' : 'Créer un Compte Ambassadeur'}
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      {locale === 'ar' ? 'أدخل بيانات السفير وكلمة المرور وكود الترويج الخاص به' : 'Renseignez les détails du nouvel ambassadeur'}
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

              <form onSubmit={handleAdd} data-testid="add-ambassador-form" className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Name */}
                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">
                      {locale === 'ar' ? 'الاسم الكامل للسفير' : 'Nom complet'} *
                    </label>
                    <input
                      required
                      placeholder={locale === 'ar' ? 'علاء الدين بن علي' : 'Alaa Eddine Benali'}
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
                      placeholder="alaa.amb16@dzprime.academy"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono placeholder-gray-500 focus:outline-none focus:border-lime-400"
                    />
                  </div>

                  {/* Password Card */}
                  <div className="sm:col-span-2 bg-white/[0.02] p-3.5 rounded-2xl border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-gray-300 font-semibold flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-lime-400" />
                        <span>{locale === 'ar' ? 'كلمة المرور لتسجيل الدخول' : 'Mot de passe'}</span>
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
                        placeholder={locale === 'ar' ? 'اترك فارغاً لتوليد كلمة مرور عشوائية أو اكتب كلمة مخصصة (8 أحرف+)' : 'Mot de passe (min 8 car.)'}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono placeholder-gray-500 focus:outline-none focus:border-lime-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={locale === 'ar' ? 'إظهار أو إخفاء كلمة المرور' : 'Afficher ou masquer le mot de passe'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      {locale === 'ar'
                        ? 'سيتمكن السفير من تغيير كلمة المرور هذه فور تسجيل دخوله من لوحة تحكم السفير.'
                        : "L'ambassadeur pourra modifier ce mot de passe à tout moment."}
                    </p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">
                      {locale === 'ar' ? 'رقم الهاتف (واتساب)' : 'Téléphone'}
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
                      {locale === 'ar' ? 'ولاية السفير' : 'Wilaya'}
                    </label>
                    <select
                      value={form.wilayaCode}
                      onChange={(e) => setForm({ ...form, wilayaCode: Number(e.target.value) })}
                      className="dark w-full px-3.5 py-2.5 rounded-xl bg-[#111114] border border-white/10 text-white focus:outline-none focus:border-lime-400"
                    >
                      {WILAYAS.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.code} - {getLocalizedWilayaName(w, locale as Locale)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Institution */}
                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">
                      {locale === 'ar' ? 'الجامعة أو الثانوية' : 'Université ou Lycée'} *
                    </label>
                    <input
                      required
                      placeholder={locale === 'ar' ? 'جامعة باب الزوار USTHB' : 'Université USTHB'}
                      value={form.institutionNameAr}
                      onChange={(e) => setForm({ ...form, institutionNameAr: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-lime-400"
                    />
                  </div>

                  {/* Specialty */}
                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">
                      {locale === 'ar' ? 'التخصص / الشعبة' : 'Spécialité / Filière'}
                    </label>
                    <input
                      placeholder={locale === 'ar' ? 'علوم تجريبية، إعلام آلي، طب...' : 'Informatique, Médecine...'}
                      value={form.specialtyName}
                      onChange={(e) => setForm({ ...form, specialtyName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-lime-400"
                    />
                  </div>

                  {/* Promo Code */}
                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">
                      {locale === 'ar' ? 'كود الترويج (Promo Code)' : 'Code Promo'}
                    </label>
                    <input
                      placeholder={locale === 'ar' ? `مثال: WIL${form.wilayaCode}-VIP` : `Ex: WIL${form.wilayaCode}-VIP`}
                      value={form.promoCode}
                      onChange={(e) => setForm({ ...form, promoCode: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-lime-400 font-mono font-bold uppercase placeholder-gray-500 focus:outline-none focus:border-lime-400"
                    />
                  </div>

                  {/* Telegram */}
                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">
                      {locale === 'ar' ? 'معرف تليغرام (اختياري)' : 'Telegram Handle'}
                    </label>
                    <input
                      placeholder="username (sans @)"
                      value={form.telegramHandle}
                      onChange={(e) => setForm({ ...form, telegramHandle: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono placeholder-gray-500 focus:outline-none focus:border-lime-400"
                    />
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
                    data-testid="submit-ambassador-btn"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black flex items-center gap-2 shadow-lg shadow-lime-400/20 active:scale-95 transition-all disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    <span>{locale === 'ar' ? 'تأكيد وحفظ السفير' : 'Créer le Compte'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success / Created Credentials Dialog */}
      <AnimatePresence>
        {createdCred && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="dark relative w-full max-w-md rounded-3xl border border-lime-400/40 bg-[#111114] p-6 text-white shadow-2xl text-center space-y-4 font-arabic"
            >
              <div className="w-12 h-12 rounded-2xl bg-lime-400/20 text-lime-400 mx-auto flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-base font-black text-white">
                  {locale === 'ar' ? 'تم إنشاء وتفعيل حساب السفير بنجاح! 🇩🇿' : 'Ambassadeur créé avec succès ! 🇩🇿'}
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  {locale === 'ar'
                    ? 'انسخ بيانات الدخول وأرسلها للسفير لبدء إدارة الورشات ومتابعة الإحالات'
                    : 'Transmettez les identifiants de connexion à l\'ambassadeur'}
                </p>
              </div>

              {/* Credentials Card */}
              <div className="bg-white/[0.04] p-4 rounded-2xl border border-white/10 text-left space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-400 text-[11px]">{locale === 'ar' ? 'الاسم' : 'Nom'}:</span>
                  <span className="font-bold text-white font-sans">{createdCred.name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-400 text-[11px]">Email:</span>
                  <span className="text-lime-400 font-bold select-all">{createdCred.email}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-400 text-[11px]">Password:</span>
                  <span className="text-lime-300 font-bold bg-lime-400/10 px-2 py-0.5 rounded select-all">
                    {createdCred.tempPassword}
                  </span>
                </div>
                {createdCred.promoCode && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-[11px]">Code Promo:</span>
                    <span className="text-gold-400 font-bold bg-gold-400/10 px-2 py-0.5 rounded">
                      {createdCred.promoCode}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={copyCredentialsText}
                  className="w-full py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-lime-400/20"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? (locale === 'ar' ? 'تم نسخ البيانات بنجاح ✓' : 'Copié ✓') : locale === 'ar' ? 'نسخ بيانات الدخول كاملة' : 'Copier les identifiants'}</span>
                </button>

                <button
                  onClick={() => setCreatedCred(null)}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs"
                >
                  {locale === 'ar' ? 'إغلاق ومتابعة' : 'Fermer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ambassadors Table */}
      <div className="overflow-x-auto no-scrollbar rounded-2xl border border-white/10 bg-white/[0.02]">
        <table className="w-full min-w-[850px] text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-[11px] uppercase bg-white/[0.03]">
              <th className="py-3.5 px-4">{locale === 'ar' ? 'السفير والمعلومات' : 'Ambassadeur'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'الولاية والمؤسسة' : 'Wilaya & Institution'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'كود الترويج' : 'Promo Code'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'الإحالات' : 'Référrals'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'العمولة (10%)' : 'Commission (10%)'}</th>
              <th className="py-3.5 px-4 text-center">{locale === 'ar' ? 'الحالة' : 'Statut'}</th>
              <th className="py-3.5 px-4 text-center">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-200">
            {loading && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-lime-400 mb-2" />
                  <span>{locale === 'ar' ? 'جاري تحميل شبكة السفراء...' : 'Chargement...'}</span>
                </td>
              </tr>
            )}

            {!loading && filteredAmbassadors.map((a) => (
              <tr key={a.id} data-testid={`ambassador-row-${a.id}`} className="hover:bg-white/[0.03] transition-colors">
                <td className="py-3.5 px-4 font-bold text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gold-500/30 text-gold-300 flex items-center justify-center font-black border border-gold-400/30 shrink-0">
                      {a.user?.name?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-white font-bold truncate">{a.user?.name}</div>
                      <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-gold-400 shrink-0" />
                        <span className="truncate">{a.user?.email}</span>
                      </div>
                      {a.phone && (
                        <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 text-gray-400" />
                          <span>{a.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-gray-200">{a.institutionNameAr || a.institutionNameFr}</div>
                  <div className="text-[11px] text-lime-400 font-medium">{a.wilayaCode} - {locale === 'ar' ? a.wilayaNameAr : a.wilayaNameFr || a.wilayaNameAr}</div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-1 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-300 font-mono font-bold flex items-center gap-1.5 w-fit">
                    <Tag className="w-3 h-3 text-lime-400" />
                    <span>{a.promoCode}</span>
                  </span>
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-gray-200">{a.referralsCount || 0}</td>
                <td className="py-3.5 px-4 font-mono font-bold text-lime-400">{formatDZD(a.commissionDzd || 0, locale as Locale)}</td>
                <td className="py-3.5 px-4 text-center">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${a.isVerified ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
                    {a.isVerified ? (locale === 'ar' ? '✓ موثّق' : '✓ Vérifié') : (locale === 'ar' ? 'قيد المراجعة' : 'En revue')}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    {a.user?.studentCardId && (
                      <Link
                        href={`/${locale}/profile/${a.user.studentCardId}`}
                        target="_blank"
                        title={locale === 'ar' ? 'عرض الملف العام ورمز QR' : 'Voir profil public'}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gold-400 hover:text-gold-300 border border-white/10 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    <button
                      data-testid={`delete-ambassador-${a.id}`}
                      title={locale === 'ar' ? 'حذف السفير' : 'Supprimer'}
                      onClick={() => handleDelete(a.id, a.user?.name || '')}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!loading && filteredAmbassadors.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-400 text-xs">
                  {searchTerm
                    ? (locale === 'ar' ? 'لا توجد نتائج مطابقة لبحثك' : 'Aucun résultat')
                    : (locale === 'ar' ? 'لم يتم إضافة أي سفير بعد. انقر على "إضافة سفير جديد" للبدء.' : 'Aucun ambassadeur enregistré.')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
