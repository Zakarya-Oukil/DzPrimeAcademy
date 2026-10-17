'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Btn, Empty, PageHead, Panel, SkeletonRows, Status, StatusKind, useTx } from '@/components/student-v2/ui';
import { formatDZD } from '@/lib/format';
import { Col, DataTable, H2, Tile, Tiles } from './ui';

interface Financials {
  totalBalance: number; monthlyIncome: number; realVerifiedRevenue: number; revenueByType: Record<string, number>;
  payrollLiability: number; ambassadorCommissions: number; netMargin: number; pendingAmountDzd: number;
  approvedOpsCount: number; pendingOpsCount: number;
  monthly: { month: string; income: number; payouts: number }[];
  transactions: { id: string; nameAr: string; nameFr: string; method: string; date: string; amount: number; status: string }[];
}
type Tx = Financials['transactions'][number];

/** Finance centre (Figma page 31, "Finance"). Every figure comes from /api/admin/financial; no estimates are shown. */
export const FinanceSection: React.FC = () => {
  const { tx, locale } = useTx();
  const [data, setData] = useState<Financials | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [hide, setHide] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/financial');
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) { setData(json); setFailed(false); } else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 60000);
    return () => clearInterval(t);
  }, [load]);

  const m = (n: number | undefined) => (hide ? '••••••' : <bdi>{formatDZD(n ?? 0, locale)}</bdi>);
  const monthly = data?.monthly ?? [];
  const max = Math.max(1, ...monthly.flatMap((x) => [x.income, x.payouts]));
  const hasSeries = monthly.some((x) => x.income > 0 || x.payouts > 0);
  const monthLabel = (key: string) => new Date(`${key}-01T00:00:00Z`).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', { month: 'short', timeZone: 'UTC' });

  const kinds = [
    { type: 'VIP_MEMBERSHIP_UPGRADE', label: tx('العضوية الذهبية', 'Adhésion Gold', 'Gold membership') },
    { type: 'BUNDLE_PURCHASE', label: tx('الباقات', 'Packs', 'Bundles') },
    { type: 'COURSE_ENROLLMENT', label: tx('المقررات', 'Cours', 'Courses') },
  ].map((k) => ({ ...k, amount: data?.revenueByType?.[k.type] ?? 0 }));
  const other = Math.max(0, (data?.realVerifiedRevenue ?? 0) - kinds.reduce((s, k) => s + k.amount, 0));
  const mix = [...kinds, { type: 'OTHER', label: tx('أخرى', 'Autres', 'Other'), amount: other }];

  const txCols: Col<Tx>[] = [
    { id: 'name', header: tx('العملية', 'Opération', 'Transaction'), w: '2fr', cell: (r) => <span className="font-semibold">{locale === 'ar' ? r.nameAr : r.nameFr}</span> },
    { id: 'method', header: tx('الطريقة', 'Méthode', 'Method'), w: '1fr', cell: (r) => <bdi>{r.method}</bdi> },
    { id: 'date', header: tx('التاريخ', 'Date', 'Date'), w: '1fr', cell: (r) => <bdi className="text-[14px]">{new Date(r.date).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ')}</bdi> },
    { id: 'amount', header: tx('المبلغ', 'Montant', 'Amount'), w: '1fr', cell: (r) => <bdi className="font-semibold">{hide ? '••••••' : formatDZD(r.amount, locale)}</bdi> },
    { id: 'status', header: tx('الحالة', 'Statut', 'Status'), w: '1fr', m: 'status', cell: (r) => { const k: StatusKind = r.status === 'COMPLETE' ? 'ok' : 'pending'; return <Status kind={k}>{r.status === 'COMPLETE' ? tx('مكتملة', 'Terminée', 'Complete') : tx('معلقة', 'En attente', 'Pending')}</Status>; } },
  ];

  const header = (
    <PageHead
      title={tx('المركز المالي', 'Centre financier', 'Finance')}
      sub={tx('الإيرادات المؤكدة ناقص مستحقات الأساتذة المدفوعة.', 'Revenus validés moins les paies enseignants déjà versées.', 'Approved revenue minus teacher payouts already paid.')}
      action={
        <div className="flex flex-wrap gap-2.5">
          <Btn variant="secondary" onClick={() => { setLoading(true); load(); }}>{tx('تحديث البيانات', 'Actualiser', 'Refresh')}</Btn>
          <Btn variant="secondary" aria-pressed={hide} onClick={() => setHide((v) => !v)}>{hide ? tx('إظهار الأرقام', 'Afficher les montants', 'Show amounts') : tx('إخفاء الأرقام', 'Masquer les montants', 'Hide amounts')}</Btn>
        </div>
      }
    />
  );

  if (loading) return <div className="flex flex-col gap-6" data-testid="admin-finance">{header}<SkeletonRows n={4} /></div>;
  if (failed || !data) {
    return (
      <div className="flex flex-col gap-6" data-testid="admin-finance">
        {header}
        <Empty
          title={tx('تعذر تحميل البيانات المالية', 'Données financières indisponibles', 'Financial data could not be loaded')}
          body={tx('لا تُعرض أي أرقام تقديرية.', "Aucun chiffre estimé n'est affiché.", 'No estimated numbers are shown.')}
          action={<Btn variant="secondary" onClick={() => { setLoading(true); load(); }}>{tx('إعادة المحاولة', 'Réessayer', 'Try again')}</Btn>}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" data-testid="admin-finance">
      {header}
      <Tiles cols={3}>
        <Tile label={tx('الرصيد المالي الكلي', 'Solde total', 'Total balance')} value={m(data.totalBalance)} caption={`${data.approvedOpsCount} ${tx('عمليات مؤكدة', 'validées', 'approved')}`} />
        <Tile label={tx('إيرادات هذا الشهر', 'Revenus du mois', 'Income this month')} value={m(data.monthlyIncome)} caption={tx('من العمليات المؤكدة هذا الشهر فقط.', 'Paiements validés ce mois uniquement.', 'Payments approved this month only.')} />
        <Tile label={tx('مستحقات الأساتذة غير المدفوعة', 'Paies enseignants dues', 'Teacher payouts owed')} value={m(data.payrollLiability)} caption={tx('مجموع الدفعات المعلقة وحصص الأساتذة غير المسددة.', 'Versements en attente et parts impayées.', 'Pending payouts plus unpaid shares.')} />
        <Tile label={tx('عمولات السفراء المستحقة', 'Commissions ambassadeurs', 'Ambassador commissions')} value={m(data.ambassadorCommissions)} />
        <Tile label={tx('هامش هذا الشهر بعد المستحقات', 'Marge du mois après paies', 'Margin after payouts')} value={m(data.netMargin)} />
        <Tile label={tx('بانتظار الموافقة', "En attente d'approbation", 'Waiting for approval')} value={m(data.pendingAmountDzd)} caption={`${data.pendingOpsCount} ${tx('عملية', 'opérations', 'payments')}`} />
      </Tiles>

      <Panel as="section" className="flex flex-col gap-4">
        <div>
          <h2 className="text-[18px] font-semibold">{tx('التدفق النقدي خلال 6 أشهر', 'Trésorerie sur 6 mois', 'Cash flow, last 6 months')}</h2>
          <p className="text-[13px] text-sheet-muted">{tx('الإيرادات المؤكدة مقابل المستحقات المدفوعة لكل شهر.', 'Revenus validés contre paies versées, par mois.', 'Approved income against payouts paid, per month.')}</p>
        </div>
        {!hasSeries ? (
          <p className="rounded-[18px] bg-sheet px-5 py-10 text-center text-[14px] text-sheet-muted">{tx('لا توجد حركات مالية بعد. ستظهر الأعمدة هنا بعد الموافقة على أول دفعة من قسم العمليات.', "Aucun mouvement pour l'instant. Les barres apparaissent après la première validation.", 'No money has moved yet. Bars appear after the first approved payment.')}</p>
        ) : (
          <>
            <div className="flex h-48 items-end justify-between gap-3 rounded-[18px] bg-sheet px-4 pb-3 pt-6" role="img" aria-label={tx('مخطط الإيرادات والمستحقات الشهرية', 'Graphique mensuel', 'Monthly income and payouts chart')}>
              {monthly.map((x) => (
                <div key={x.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div className="flex h-full w-full items-end justify-center gap-1">
                    <div className="w-1/3 max-w-[22px] rounded-t-md bg-sheet-text" style={{ height: `${Math.max(2, (x.income / max) * 100)}%` }} title={formatDZD(x.income, locale)} />
                    <div className="w-1/3 max-w-[22px] rounded-t-md bg-gold-500" style={{ height: `${Math.max(2, (x.payouts / max) * 100)}%` }} title={formatDZD(x.payouts, locale)} />
                  </div>
                  <span className="text-[12px] text-sheet-muted">{monthLabel(x.month)}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-5 text-[13px]">
              <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 rounded-sm bg-sheet-text" />{tx('الإيراد', 'Revenus', 'Income')}</span>
              <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 rounded-sm bg-gold-500" />{tx('المستحقات المدفوعة', 'Paies versées', 'Payouts paid')}</span>
            </div>
          </>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel as="section" className="flex flex-col gap-3">
          <div>
            <h2 className="text-[18px] font-semibold">{tx('مصدر الإيرادات', 'Origine des revenus', 'Where income comes from')}</h2>
            <p className="text-[13px] text-sheet-muted">{tx('حسب نوع العملية المؤكدة، منذ البداية.', 'Par type de paiement validé, depuis le début.', 'By type of approved payment, all time.')}</p>
          </div>
          {data.realVerifiedRevenue <= 0 ? (
            <p className="text-[14px] text-sheet-muted">{tx('لا توجد إيرادات مؤكدة بعد.', 'Aucun revenu validé pour le moment.', 'No approved revenue yet.')}</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {mix.map((k) => (
                <li key={k.type} className="flex items-center justify-between gap-4 text-[15px]">
                  <span>{k.label}</span>
                  <span className="font-semibold tabular-nums">{m(k.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <div className="flex flex-col gap-3">
          <H2>{tx('آخر العمليات المالية', 'Dernières opérations', 'Recent transactions')}</H2>
          {data.transactions.length === 0 ? (
            <Empty title={tx('لا توجد عمليات بعد', 'Aucune opération', 'No transactions yet')} body={tx('تظهر هنا كل دفعة بعد أن يطلبها طالب في قسم العمليات.', 'Chaque paiement apparaît ici après la demande.', 'Each payment shows here after a student requests it.')} />
          ) : (
            <DataTable cols={txCols} rows={data.transactions} rowKey={(r) => r.id} label={tx('آخر العمليات المالية', 'Dernières opérations', 'Recent transactions')} />
          )}
        </div>
      </div>
    </div>
  );
};
