'use client';

import React, { useEffect, useState } from 'react';
import { Btn, Empty, PageHead, SkeletonRows, dateFmt, focus, useTx } from '@/components/student-v2/ui';
import { useAuthStore } from '@/lib/store';
import { formatDZD } from '@/lib/format';
import { Actions, Cell2, Col, DataTable, H2, RowAction, Tile, Tiles } from './ui';
import { useAdminNav } from './AdminShell';
import { AdminTab } from './nav';

type PendingOp = { id: string; type: string; createdAt: string; userName?: string; userEmail?: string; amountDzd: number };

/** Admin home (Figma page 31, "Home"): what needs action now. Each block appears only for roles that may see its data. */
export const HomeSection: React.FC = () => {
  const { tx, locale } = useTx();
  const { currentUser } = useAuthStore();
  const { allowed, go, pendingOps } = useAdminNav();
  const canOps = allowed.includes('operations');
  const canFin = allowed.includes('financial');
  const [fin, setFin] = useState<{ monthlyIncome: number; payrollLiability: number; ambassadorCommissions: number } | null>(null);
  const [pending, setPending] = useState<PendingOp[] | null>(null);

  useEffect(() => {
    if (canFin) fetch('/api/admin/financial').then((r) => r.json()).then((j) => { if (j?.success) setFin(j); }).catch(() => {});
    if (canOps) fetch('/api/operations?status=PENDING').then((r) => r.json()).then((j) => setPending((j.operations || []).slice(0, 5))).catch(() => setPending([]));
  }, [canFin, canOps]);

  const typeLabel = (t: string) =>
    t === 'ACCOUNT_ACTIVATION' ? tx('تفعيل حساب جديد', 'Création de compte', 'New account')
    : t === 'VIP_MEMBERSHIP_UPGRADE' ? tx('ترقية VIP الذهبية', 'Adhésion Gold VIP', 'Gold VIP upgrade')
    : t === 'BUNDLE_PURCHASE' ? tx('شراء باقة / عرض', 'Pack / Offre', 'Bundle purchase')
    : tx('دعم واستفسار', 'Support direct', 'Support');

  const cols: Col<PendingOp>[] = [
    { id: 'who', header: tx('الطالب', 'Étudiant', 'Student'), w: '1.6fr', cell: (o) => <Cell2 title={o.userName || '—'} sub={o.userEmail ? <bdi dir="ltr">{o.userEmail}</bdi> : undefined} /> },
    { id: 'service', header: tx('الخدمة', 'Service', 'Service'), w: '1.4fr', cell: (o) => typeLabel(o.type) },
    { id: 'amount', header: tx('المبلغ', 'Montant', 'Amount'), w: '1fr', cell: (o) => (o.amountDzd > 0 ? <bdi className="font-semibold">{formatDZD(o.amountDzd, locale)}</bdi> : '—') },
    { id: 'date', header: tx('التاريخ', 'Date', 'Date'), w: '1fr', cell: (o) => <bdi className="text-[14px]">{dateFmt(o.createdAt, locale)}</bdi> },
    { id: 'act', header: tx('إجراء', 'Action', 'Action'), w: '1fr', m: 'actions', cell: () => <Actions><RowAction onClick={() => go('operations')}>{tx('مراجعة', 'Examiner', 'Review')}</RowAction></Actions> },
  ];

  const shortcuts = ([
    { id: 'students', label: tx('الطلبة والبطاقات', 'Étudiants et cartes', 'Students and cards') },
    { id: 'teachers', label: tx('الأساتذة والمستحقات', 'Enseignants et paie', 'Teachers and pay') },
    { id: 'ambassadors', label: tx('السفراء', 'Ambassadeurs', 'Ambassadors') },
    { id: 'courses', label: tx('الدورات والمقررات', 'Cours et modules', 'Courses and modules') },
    { id: 'sessions', label: tx('الحصص المباشرة', 'Sessions en direct', 'Live sessions') },
    { id: 'bundles', label: tx('العروض والأكواد', 'Offres et codes', 'Offers and codes') },
    { id: 'settings', label: tx('الإعدادات', 'Réglages', 'Settings') },
  ] as { id: AdminTab; label: string }[]).filter((s) => allowed.includes(s.id));

  return (
    <div className="flex flex-col gap-6" data-testid="admin-home">
      <PageHead
        title={tx('لوحة الإدارة', "Tableau d'administration", 'Admin dashboard')}
        sub={currentUser?.name ? `${tx('مرحباً', 'Bonjour', 'Welcome')} ${currentUser.name}` : tx('ما يحتاج إجراءً الآن.', "Ce qui demande votre attention.", 'What needs action now.')}
        action={canOps ? <Btn variant="secondary" onClick={() => go('operations')}>{tx('عرض كل الطلبات', 'Voir toutes les demandes', 'View all requests')}</Btn> : undefined}
      />

      {canOps || canFin ? (
        <Tiles>
          {canOps ? <Tile label={tx('الطلبات المعلقة', 'Demandes en attente', 'Pending requests')} value={<bdi>{pendingOps}</bdi>} caption={pendingOps ? tx('تحتاج إجراء', 'À traiter', 'Need action') : tx('مكتمل', 'À jour', 'All caught up')} testId="home-pending" /> : null}
          {canFin ? <Tile label={tx('إيرادات هذا الشهر', 'Revenus du mois', 'Income this month')} value={fin ? <bdi>{formatDZD(fin.monthlyIncome, locale)}</bdi> : '—'} caption={tx('من العمليات المؤكدة هذا الشهر فقط.', 'Paiements validés ce mois uniquement.', 'Payments approved this month only.')} /> : null}
          {canFin ? <Tile label={tx('مستحقات الأساتذة غير المدفوعة', 'Paies enseignants dues', 'Teacher payouts owed')} value={fin ? <bdi>{formatDZD(fin.payrollLiability, locale)}</bdi> : '—'} /> : null}
          {canFin ? <Tile label={tx('عمولات السفراء المستحقة', 'Commissions ambassadeurs', 'Ambassador commissions')} value={fin ? <bdi>{formatDZD(fin.ambassadorCommissions, locale)}</bdi> : '—'} /> : null}
        </Tiles>
      ) : null}

      {canOps ? (
        <section className="flex flex-col gap-3">
          <H2>{tx('آخر الطلبات المعلقة', 'Dernières demandes en attente', 'Latest pending requests')}</H2>
          {pending === null ? <SkeletonRows n={3} /> : pending.length === 0 ? (
            <Empty title={tx('لا توجد طلبات معلقة', 'Aucune demande en attente', 'No pending requests')} body={tx('كل الطلبات تمت معالجتها.', 'Tout est traité.', 'Everything has been handled.')} />
          ) : (
            <DataTable cols={cols} rows={pending} rowKey={(o) => o.id} label={tx('آخر الطلبات المعلقة', 'Dernières demandes en attente', 'Latest pending requests')} />
          )}
        </section>
      ) : null}

      {shortcuts.length > 0 ? (
        <section className="flex flex-col gap-3">
          <H2>{tx('اختصارات', 'Raccourcis', 'Shortcuts')}</H2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shortcuts.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => go(s.id)} className={`flex min-h-[64px] w-full items-center rounded-[24px] bg-sheet-card px-6 text-start text-[16px] font-semibold hover:bg-sheet-line ${focus}`}>{s.label}</button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
};

