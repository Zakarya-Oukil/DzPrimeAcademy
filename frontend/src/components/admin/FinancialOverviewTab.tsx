'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Wallet,
  Landmark,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  RefreshCw,
} from 'lucide-react';
import { formatDZD } from '@/lib/format';

interface FinancialOverviewTabProps {
  locale: string;
  /** Kept for the parent's call site; every figure shown here comes from /api/admin/financial. */
  payrollLiability?: number;
}

interface Financials {
  totalBalance: number;
  monthlyIncome: number;
  realVerifiedRevenue: number;
  revenueByType: Record<string, number>;
  payrollLiability: number;
  ambassadorCommissions: number;
  netMargin: number;
  pendingAmountDzd: number;
  approvedOpsCount: number;
  pendingOpsCount: number;
  monthly: { month: string; income: number; payouts: number }[];
  transactions: {
    id: string;
    nameAr: string;
    nameFr: string;
    method: string;
    date: string;
    amount: number;
    status: string;
  }[];
}

const REVENUE_KINDS = [
  { type: 'VIP_MEMBERSHIP_UPGRADE', ar: 'العضوية الذهبية', en: 'Gold membership', bar: 'bg-gold-400', stroke: 'text-gold-400' },
  { type: 'BUNDLE_PURCHASE', ar: 'الباقات', en: 'Bundles', bar: 'bg-emerald-400', stroke: 'text-emerald-400' },
  { type: 'COURSE_ENROLLMENT', ar: 'المقررات', en: 'Courses', bar: 'bg-sky-400', stroke: 'text-sky-400' },
] as const;

const STATUS_STYLE: Record<string, string> = {
  COMPLETE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  PENDING: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-white/10 ${className}`} aria-hidden="true" />
);

export const FinancialOverviewTab: React.FC<FinancialOverviewTabProps> = ({ locale }) => {
  const ar = locale === 'ar';
  const t = (arText: string, enText: string) => (ar ? arText : enText);

  const [showBalance, setShowBalance] = useState(true);
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const [data, setData] = useState<Financials | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const loadFinancials = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/financial');
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setData(json);
        setFailed(false);
      } else {
        setFailed(true);
      }
    } catch (e) {
      console.error('Failed to load live financials:', e);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFinancials();
    const interval = setInterval(loadFinancials, 15000);
    return () => clearInterval(interval);
  }, [loadFinancials]);

  const monthLabel = (key: string) =>
    new Date(`${key}-01T00:00:00Z`).toLocaleDateString(ar ? 'ar-DZ' : 'fr-DZ', { month: 'short', timeZone: 'UTC' });

  const money = (n: number | undefined) => (showBalance ? formatDZD(n ?? 0) : '•••••••• DZD');
  const monthly = data?.monthly ?? [];
  const chartMax = Math.max(1, ...monthly.flatMap((m) => [m.income, m.payouts]));
  const hasChartData = monthly.some((m) => m.income > 0 || m.payouts > 0);
  const hoverMonth = monthly.find((m) => m.month === activeMonth) ?? monthly[monthly.length - 1];

  const kinds = REVENUE_KINDS.map((k) => ({ ...k, amount: data?.revenueByType?.[k.type] ?? 0 }));
  const otherRevenue = Math.max(0, (data?.realVerifiedRevenue ?? 0) - kinds.reduce((s, k) => s + k.amount, 0));
  const revenueTotal = data?.realVerifiedRevenue ?? 0;
  const mix = [...kinds, { type: 'OTHER', ar: 'أخرى', en: 'Other', bar: 'bg-slate-400', stroke: 'text-slate-400', amount: otherRevenue }];
  let offset = 0;

  const card = 'rounded-3xl bg-[#0B1021] border border-white/10 p-6 space-y-4 shadow-xl flex flex-col justify-between';

  return (
    <div className="space-y-6 font-arabic" data-testid="financial-overview-tab">
      {failed && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <span>
            {t('تعذر تحميل البيانات المالية. لا تُعرض أي أرقام تقديرية.', 'Financial data could not be loaded. No estimated numbers are shown.')}
          </span>
          <button onClick={loadFinancials} className="min-h-11 rounded-xl bg-white/10 px-4 font-bold text-white hover:bg-white/15">
            {t('إعادة المحاولة', 'Try again')}
          </button>
        </div>
      )}

      {/* Top row: balance, month income, payroll */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className={`lg:col-span-5 ${card}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gold-500/20 text-gold-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-400">{t('الرصيد المالي الكلي', 'Platform balance')}</span>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              aria-label={showBalance ? t('إخفاء الأرقام', 'Hide amounts') : t('إظهار الأرقام', 'Show amounts')}
              aria-pressed={!showBalance}
              className="h-11 w-11 flex items-center justify-center text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          <div className="space-y-2">
            {loading ? (
              <Skeleton className="h-10 w-3/4" />
            ) : (
              <h2 className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">{money(data?.totalBalance)}</h2>
            )}
            <p className="text-xs text-slate-400">
              {t('الإيرادات المؤكدة ناقص مستحقات الأساتذة المدفوعة.', 'Approved revenue minus teacher payouts already paid.')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs font-mono">
            <div>
              <span className="text-slate-500 block">{t('عمليات مؤكدة', 'Approved payments')}</span>
              <span className="text-white font-bold">{data?.approvedOpsCount ?? 0}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{t('بانتظار الموافقة', 'Waiting for approval')}</span>
              <span className="text-amber-300 font-bold">
                {data?.pendingOpsCount ?? 0} {t('عملية', 'payments')} · {money(data?.pendingAmountDzd)}
              </span>
            </div>
          </div>
        </div>

        <div className={`lg:col-span-3 ${card}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-400">{t('إيرادات هذا الشهر', 'Income this month')}</span>
          </div>

          <div>
            {loading ? (
              <Skeleton className="h-8 w-2/3" />
            ) : (
              <h3 className="text-2xl sm:text-3xl font-black text-white font-mono">{money(data?.monthlyIncome)}</h3>
            )}
            <p className="text-xs text-slate-400 mt-1">{t('من العمليات المؤكدة هذا الشهر فقط.', 'Counts payments approved this month only.')}</p>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-white/10 text-xs font-mono">
            {kinds.map((k) => (
              <div key={k.type} className="flex items-center justify-between gap-2">
                <span className="text-slate-400">{ar ? k.ar : k.en}</span>
                <span className="text-white font-bold">{money(k.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`lg:col-span-4 ${card}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-400">{t('مستحقات الأساتذة غير المدفوعة', 'Teacher payouts still owed')}</span>
          </div>

          <div>
            {loading ? (
              <Skeleton className="h-8 w-2/3" />
            ) : (
              <h3 className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">{money(data?.payrollLiability)}</h3>
            )}
            <p className="text-xs text-slate-400 mt-1">{t('مجموع الدفعات المعلقة وحصص الأساتذة غير المسددة.', 'Pending payouts plus unpaid teacher shares.')}</p>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-white/10 text-xs font-mono">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">{t('عمولات السفراء المستحقة', 'Ambassador commissions earned')}</span>
              <span className="text-white font-bold">{money(data?.ambassadorCommissions)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">{t('هامش هذا الشهر بعد المستحقات', 'This month after payouts and commissions')}</span>
              <span className={`font-bold ${(data?.netMargin ?? 0) < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{money(data?.netMargin)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle row: monthly cash flow and revenue mix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className={`lg:col-span-8 ${card}`}>
          <div>
            <h3 className="text-base font-black text-white">{t('التدفق النقدي خلال 6 أشهر', 'Cash flow, last 6 months')}</h3>
            <p className="text-xs text-slate-400">{t('الإيرادات المؤكدة مقابل المستحقات المدفوعة لكل شهر.', 'Approved income against payouts paid, per month.')}</p>
          </div>

          {!loading && !hasChartData ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 text-center text-sm text-slate-400">
              {t('لا توجد حركات مالية بعد. ستظهر الأعمدة هنا بعد الموافقة على أول دفعة من قسم العمليات.', 'No money has moved yet. Bars appear here after you approve the first payment in Operations.')}
            </div>
          ) : (
            <>
              <div className="relative h-48 flex items-end justify-between gap-3 pt-6 px-3" role="group" aria-label={t('مخطط الإيرادات والمستحقات الشهرية', 'Monthly income and payouts chart')}>
                {monthly.map((m) => (
                  <button
                    key={m.month}
                    type="button"
                    onMouseEnter={() => setActiveMonth(m.month)}
                    onFocus={() => setActiveMonth(m.month)}
                    aria-label={`${monthLabel(m.month)}: ${formatDZD(m.income)} / ${formatDZD(m.payouts)}`}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end group min-h-11"
                  >
                    <div className="w-full flex items-end justify-center gap-1.5 h-full">
                      <div style={{ height: `${(m.income / chartMax) * 100}%` }} className="w-3.5 sm:w-4 min-h-px rounded-t-lg bg-gold-400 group-hover:bg-gold-300 transition-colors" />
                      <div style={{ height: `${(m.payouts / chartMax) * 100}%` }} className="w-3.5 sm:w-4 min-h-px rounded-t-lg bg-emerald-500 group-hover:bg-emerald-400 transition-colors" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{monthLabel(m.month)}</span>
                  </button>
                ))}
              </div>
              {hoverMonth && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2 text-xs font-mono" aria-live="polite">
                  <span className="text-gold-400 font-bold">{monthLabel(hoverMonth.month)} {hoverMonth.month.slice(0, 4)}</span>
                  <span className="text-slate-300">{t('الإيراد', 'Income')}: <b className="text-white">{money(hoverMonth.income)}</b></span>
                  <span className="text-slate-300">{t('المستحقات المدفوعة', 'Payouts paid')}: <b className="text-white">{money(hoverMonth.payouts)}</b></span>
                </div>
              )}
              <div className="flex items-center justify-center gap-6 text-xs font-mono text-slate-400 pt-2 border-t border-white/5">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-gold-400" />{t('الإيراد', 'Income')}</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-emerald-500" />{t('المستحقات المدفوعة', 'Payouts paid')}</span>
              </div>
            </>
          )}
        </div>

        <div className={`lg:col-span-4 ${card}`}>
          <div>
            <h3 className="text-base font-black text-white">{t('مصدر الإيرادات', 'Where income comes from')}</h3>
            <p className="text-xs text-slate-400">{t('حسب نوع العملية المؤكدة، منذ البداية.', 'By type of approved payment, all time.')}</p>
          </div>

          {revenueTotal <= 0 ? (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 text-center text-sm text-slate-400">
              {t('لا توجد إيرادات مؤكدة بعد.', 'No approved revenue yet.')}
            </div>
          ) : (
            <>
              <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                  <circle cx="18" cy="18" r="15.9155" className="text-slate-800" strokeWidth="4" stroke="currentColor" fill="none" />
                  {mix.map((k) => {
                    const pct = (k.amount / revenueTotal) * 100;
                    if (pct <= 0) return null;
                    const el = (
                      <circle key={k.type} cx="18" cy="18" r="15.9155" className={k.stroke} strokeWidth="4.5" stroke="currentColor" fill="none" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-offset} />
                    );
                    offset += pct;
                    return el;
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                  <span className="text-sm font-black font-mono">{formatDZD(revenueTotal)}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-mono text-slate-300">
                {mix
                  .filter((k) => k.amount > 0)
                  .map((k) => (
                    <div key={k.type} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${k.bar}`} />{ar ? k.ar : k.en}</span>
                      <span className="text-white font-bold">{Math.round((k.amount / revenueTotal) * 100)}%</span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Transaction stream */}
      <div className="rounded-3xl bg-[#0B1021] border border-white/10 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-base font-black text-white">{t('آخر العمليات المالية', 'Recent transactions')}</h3>
            <p className="text-xs text-slate-400">{t('الدفعات المؤكدة والمعلقة وتحويلات الأساتذة، من قاعدة البيانات مباشرة.', 'Approved and pending payments and teacher payouts, straight from the database.')}</p>
          </div>
          <button
            onClick={() => loadFinancials()}
            disabled={loading}
            aria-label={t('تحديث البيانات', 'Refresh data')}
            className="h-11 w-11 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-gold-400' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : !data || data.transactions.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-white/10 px-5 py-8 text-sm text-slate-400">
            <Scale className="w-5 h-5 shrink-0 text-slate-500" />
            {t('لا توجد عمليات بعد. تظهر هنا كل دفعة بعد أن يطلبها طالب في قسم العمليات.', 'No transactions yet. Each payment shows up here once a student requests it and it reaches Operations.')}
          </div>
        ) : (
          <ul className="space-y-2.5">
            {data.transactions.map((tx) => {
              const isNegative = tx.amount < 0;
              return (
                <li key={tx.id} className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 flex items-center justify-between gap-3 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${isNegative ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                      {isNegative ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">{ar ? tx.nameAr : tx.nameFr}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">{[tx.method, tx.date].filter(Boolean).join(' · ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-sm sm:text-base font-black font-mono ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isNegative ? '' : '+'}
                      {formatDZD(tx.amount)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md border text-[11px] font-bold font-mono ${STATUS_STYLE[tx.status] || STATUS_STYLE.COMPLETE}`}>
                      {tx.status === 'PENDING' ? t('معلقة', 'Pending') : t('مكتملة', 'Complete')}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
