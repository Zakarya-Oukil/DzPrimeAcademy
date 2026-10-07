'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  MessageCircle,
  Send,
  Linkedin,
  Mail,
  Phone,
  User,
  Crown,
  Package,
  ShieldCheck,
  RefreshCw,
  Filter,
  DollarSign,
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDZD } from '@/lib/format';
import { Locale } from '@/types';

interface AdminOperationsTabProps {
  locale: Locale | string;
}

export const AdminOperationsTab: React.FC<AdminOperationsTabProps> = ({ locale }) => {
  const isAr = locale === 'ar';

  const [operations, setOperations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalPendingAmountDzd, setTotalPendingAmountDzd] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [totalApprovedAmountDzd, setTotalApprovedAmountDzd] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Action states
  const [actingId, setActingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const loadOperations = useCallback(async () => {
    try {
      const query = new URLSearchParams();
      if (statusFilter !== 'ALL') query.set('status', statusFilter);
      if (typeFilter !== 'ALL') query.set('type', typeFilter);
      if (channelFilter !== 'ALL') query.set('channel', channelFilter);
      if (search.trim()) query.set('search', search.trim());

      const res = await fetch(`/api/operations?${query.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setOperations(data.operations || []);
        setTotal(data.total || 0);
        setPendingCount(data.pendingCount || 0);
        setTotalPendingAmountDzd(data.totalPendingAmountDzd || 0);
        setApprovedCount(data.approvedCount || 0);
        setTotalApprovedAmountDzd(data.totalApprovedAmountDzd || 0);
      }
    } catch (err) {
      console.error('Failed to load operations:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, channelFilter, search]);

  useEffect(() => {
    setLoading(true);
    loadOperations();
    const interval = setInterval(() => { if (document.visibilityState === 'visible') loadOperations(); }, 45000); // polls only while the tab is visible // 15s auto-poll
    return () => clearInterval(interval);
  }, [loadOperations]);

  const handleApprove = async (id: string) => {
    setActingId(id);
    setActionSuccess('');
    setActionError('');

    try {
      const res = await fetch(`/api/operations/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(isAr ? 'تمت الموافقة وتفعيل حساب/طلب الطالب بنجاح! ✓' : 'Opération approuvée et activée avec succès ! ✓');
        loadOperations();
        setTimeout(() => setActionSuccess(''), 4000);
      } else {
        setActionError(data.error || (isAr ? 'فشلت الموافقة' : "Échec de l'approbation"));
      }
    } catch (err: any) {
      setActionError(err.message || (isAr ? 'خطأ في الاتصال' : 'Erreur réseau'));
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt(
      isAr ? 'سبب الرفض (اختياري):' : 'Motif du refus (facultatif) :'
    );
    if (reason === null) return; // User cancelled

    setActingId(id);
    setActionSuccess('');
    setActionError('');

    try {
      const res = await fetch(`/api/operations/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: reason }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(isAr ? 'تم رفض الطلب وتحديث الحالة بنجاح.' : 'Opération rejetée.');
        loadOperations();
        setTimeout(() => setActionSuccess(''), 4000);
      } else {
        setActionError(data.error || (isAr ? 'فشل الرفض' : 'Échec du rejet'));
      }
    } catch (err: any) {
      setActionError(err.message || (isAr ? 'خطأ في الاتصال' : 'Erreur réseau'));
    } finally {
      setActingId(null);
    }
  };

  const getChannelBadge = (channel: string | null) => {
    if (channel === 'WHATSAPP') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] text-[11px] font-bold">
          <MessageCircle className="w-3 h-3 fill-current" />
          <span>WhatsApp</span>
        </span>
      );
    }
    if (channel === 'TELEGRAM') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#229ED9]/15 border border-[#229ED9]/30 text-[#229ED9] text-[11px] font-bold">
          <Send className="w-3 h-3 fill-current" />
          <span>Telegram</span>
        </span>
      );
    }
    if (channel === 'LINKEDIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0077B5]/15 border border-[#0077B5]/30 text-[#0077B5] text-[11px] font-bold">
          <Linkedin className="w-3 h-3 fill-current" />
          <span>LinkedIn</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-[11px] font-mono">
        <Mail className="w-3 h-3" />
        <span>Direct</span>
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    if (type === 'ACCOUNT_ACTIVATION') {
      return {
        label: isAr ? 'تفعيل حساب جديد' : 'Création de compte',
        color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
        icon: User,
      };
    }
    if (type === 'VIP_MEMBERSHIP_UPGRADE') {
      return {
        label: isAr ? 'ترقية VIP الذهبية' : 'Adhésion Gold VIP',
        color: 'bg-gold-500/15 border-gold-500/40 text-gold-300',
        icon: Crown,
      };
    }
    if (type === 'BUNDLE_PURCHASE') {
      return {
        label: isAr ? 'شراء باقة / عرض' : 'Pack / Offre',
        color: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
        icon: Package,
      };
    }
    return {
      label: isAr ? 'دعم واستفسار' : 'Support direct',
      color: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
      icon: Clock,
    };
  };

  return (
    <div className="space-y-6 font-arabic" data-testid="admin-operations-tab">
      {/* Top Banner Alert */}
      {actionSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center gap-2 shadow-lg"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </motion.div>
      )}
      {actionError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black flex items-center gap-2 shadow-lg"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </motion.div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Approved & Confirmed Revenue (Real Money Collected) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#0A1A1C] to-[#070D18] border border-emerald-500/40 space-y-1 relative overflow-hidden shadow-lg shadow-emerald-500/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? 'المداخيل المحصّلة (المؤكدة)' : 'Revenus Encaissés (Validés)'}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
              {approvedCount} {isAr ? 'مقبولة' : 'validées'}
            </span>
          </div>
          <div className="text-xl sm:text-3xl font-black text-emerald-400 font-mono">
            {formatDZD(totalApprovedAmountDzd, locale)}
          </div>
          <p className="text-[10px] text-gray-400">
            {isAr ? 'مدفوعات حقيقية تم اعتمادها بالمنصة' : 'Paiements réels confirmés'}
          </p>
        </div>

        {/* Card 2: Pending Volume */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#090E1E] border border-amber-500/30 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-bold">
              {isAr ? 'المبالغ قيد الانتظار' : 'Volume financier en attente'}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
            {formatDZD(totalPendingAmountDzd, locale)}
          </div>
          <p className="text-[10px] text-gray-400">
            {isAr ? 'عبر BaridiMob / CCP / الذهبية' : 'Via BaridiMob & CCP'}
          </p>
        </div>

        {/* Card 3: Pending Count */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#090E1E] border border-white/10 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300 font-bold">
              {isAr ? 'الطلبات المعلقة' : 'En attente'}
            </span>
            <span className="text-[10px] text-gray-400 font-mono font-bold">
              {pendingCount > 0 ? (isAr ? 'تحتاج إجراء' : 'Action requise') : (isAr ? 'مكتمل' : 'À jour')}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{pendingCount}</div>
          <p className="text-[10px] text-gray-400">
            {isAr ? 'تتطلب موافقة المسؤول لتفعيل الميزات' : 'Nécessitent validation admin'}
          </p>
        </div>

        {/* Card 4: Total & Live Sync */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#090E1E] border border-white/10 flex items-center justify-between p-4 sm:p-5">
          <div>
            <span className="text-xs text-gray-300 font-bold">
              {isAr ? 'إجمالي سجل العمليات' : 'Total des requêtes'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5">{total}</div>
            <div className="text-[10px] font-bold text-lime-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-ping" />
              <span>{isAr ? 'تحديث تلقائي حي' : 'Sync Live'}</span>
            </div>
          </div>
          <button
            onClick={() => loadOperations()}
            disabled={loading}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all shadow-sm"
            title={isAr ? 'تحديث فوري' : 'Actualiser'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-lime-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-3xl bg-[#090E1E] border border-white/10 flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={
              isAr
                ? 'ابحث باسم الطالب، البريد، الهاتف، أو الخدمة...'
                : 'Rechercher par nom, email, téléphone...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-lime-400"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-lime-400 text-slate-950 font-black shadow-md shadow-lime-400/20'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {st === 'PENDING'
                ? isAr
                  ? `قيد الانتظار (${pendingCount})`
                  : `En attente (${pendingCount})`
                : st === 'APPROVED'
                ? isAr
                  ? 'تمت الموافقة'
                  : 'Approuvées'
                : st === 'REJECTED'
                ? isAr
                  ? 'المرفوضة'
                  : 'Rejetées'
                : isAr
                ? 'الكل'
                : 'Tous'}
            </button>
          ))}
        </div>

        {/* Channel Filter */}
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 focus:outline-none focus:border-lime-400 w-full md:w-auto"
        >
          <option value="ALL">{isAr ? 'جميع القنوات' : 'Tous les canaux'}</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="TELEGRAM">Telegram</option>
          <option value="LINKEDIN">LinkedIn</option>
          <option value="EMAIL_DIRECT">Direct / Email</option>
        </select>
      </div>

      {/* Operations List */}
      <div className="space-y-3">
        {loading && operations.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-lime-400 animate-spin mx-auto" />
            <p className="text-xs text-gray-400">
              {isAr ? 'جارٍ تحميل طلبات التفعيل والمدفوعات...' : 'Chargement des requêtes...'}
            </p>
          </div>
        ) : operations.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-[#090E1E] border border-white/10 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-gray-600 mx-auto" />
            <h4 className="text-base font-bold text-gray-300">
              {isAr ? 'لا توجد طلبات تطابق معايير البحث' : 'Aucune requête trouvée'}
            </h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {isAr
                ? 'عندما يقوم أي طالب بالتسجيل أو الضغط على زر التواصل عبر واتساب / تيليغرام للدفع، ستظهر تفاصيله هنا فوراً.'
                : 'Les nouvelles activations et demandes de paiement apparaîtront ici automatiquement.'}
            </p>
          </div>
        ) : (
          operations.map((op) => {
            const typeInfo = getTypeBadge(op.type);
            const TypeIcon = typeInfo.icon;
            const isPending = op.status === 'PENDING';
            const isApproved = op.status === 'APPROVED';
            const isRejected = op.status === 'REJECTED';

            return (
              <motion.div
                key={op.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                  isPending
                    ? 'bg-[#090E1E] border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : isApproved
                    ? 'bg-white/[0.02] border-emerald-500/30'
                    : 'bg-white/[0.01] border-white/10 opacity-70'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: User & Operation Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-black ${typeInfo.color}`}>
                        <TypeIcon className="w-3 h-3" />
                        <span>{typeInfo.label}</span>
                      </span>

                      {getChannelBadge(op.channel)}

                      <span className="text-[11px] text-gray-500 font-mono">
                        {new Date(op.createdAt).toLocaleString(isAr ? 'ar-DZ' : 'fr-DZ')}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-sm font-black text-white shrink-0 mt-1">
                        {op.userName ? op.userName.charAt(0).toUpperCase() : 'U'}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-white font-arabic">
                            {op.userName}
                          </h4>
                          {op.userWilaya && (
                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-gray-300 font-bold">
                              📍 {op.userWilaya}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                          {op.userEmail && (
                            <span className="flex items-center gap-1 font-mono">
                              <Mail className="w-3 h-3 text-gray-500" />
                              <a href={`mailto:${op.userEmail}`} className="hover:text-white underline">
                                {op.userEmail}
                              </a>
                            </span>
                          )}
                          {op.userPhone && (
                            <span className="flex items-center gap-1 font-mono" dir="ltr">
                              <Phone className="w-3 h-3 text-gray-500" />
                              <a href={`tel:${op.userPhone}`} className="hover:text-white">
                                {op.userPhone}
                              </a>
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-gray-300 font-bold pt-1">
                          <span>{op.title}</span>
                          {op.details && (
                            <span className="text-gray-400 font-normal mr-2">
                              — {op.details}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount, Status & Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
                    <div className="text-right">
                      {op.amountDzd > 0 ? (
                        <div className="text-lg font-black text-lime-400 font-mono">
                          {formatDZD(op.amountDzd, locale)}
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-gray-400">
                          {isAr ? 'مجاني / تفعيل حساب' : 'Gratuit / Activation'}
                        </div>
                      )}
                      <div className="text-[10px] font-bold">
                        {isPending ? (
                          <span className="text-amber-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{isAr ? 'في انتظار التحقق والموافقة' : 'En attente'}</span>
                          </span>
                        ) : isApproved ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>
                              {isAr
                                ? `تمت الموافقة (${op.approvedByAdmin || 'Admin'})`
                                : 'Approuvé'}
                            </span>
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            <span>{isAr ? 'مرفوض' : 'Rejeté'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Direct Reply WhatsApp / Telegram button */}
                      {op.userPhone && (
                        <a
                          href={`https://wa.me/${op.userPhone.replace(/[^0-9]/g, '').replace(/^0/, '213')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] text-xs font-bold flex items-center gap-1"
                          title={isAr ? 'مراسلة الطالب عبر واتساب' : 'Contacter via WhatsApp'}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      {isPending && (
                        <>
                          <button
                            onClick={() => handleApprove(op.id)}
                            disabled={actingId === op.id}
                            className="px-3.5 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-lime-400/20 active:scale-95 transition-all disabled:opacity-50"
                          >
                            {actingId === op.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>{isAr ? '✓ موافقة وتفعيل' : 'Approuver'}</span>
                          </button>

                          <button
                            onClick={() => handleReject(op.id)}
                            disabled={actingId === op.id}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-gray-400 hover:text-rose-300 font-bold text-xs active:scale-95 transition-all"
                          >
                            <span>{isAr ? '✕ رفض' : 'Rejeter'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {op.adminNotes && (
                  <div className="mt-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-gray-400">
                    <span className="font-bold text-gray-300">{isAr ? 'ملاحظة الإدارة:' : 'Note admin :'}</span>{' '}
                    {op.adminNotes}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
