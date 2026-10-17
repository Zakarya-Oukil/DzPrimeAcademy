'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Btn, Empty, PageHead, SearchInput, SelectInput, SkeletonRows, Status, StatusKind, Tabs, TextInput, dateFmt, focus, useTx } from '@/components/student-v2/ui';
import { Banner, Dialog } from '@/components/shared-v2/Dialog';
import { formatDZD } from '@/lib/format';
import { Actions, Cell2, Col, DangerBtn, DataTable, RowAction, Tile, Tiles } from './ui';

type Op = {
  id: string; type: string; status: 'PENDING' | 'APPROVED' | 'REJECTED'; channel: string | null; createdAt: string;
  userName?: string; userWilaya?: string; userEmail?: string; userPhone?: string; title?: string; details?: string; amountDzd: number; approvedByAdmin?: string;
};

/** Requests and payments (Figma page 31, "Operations"). Same API and rules as the old tab. */
export const OperationsSection: React.FC = () => {
  const { tx, locale } = useTx();
  const [ops, setOps] = useState<Op[]>([]);
  const [stats, setStats] = useState({ total: 0, pendingCount: 0, pendingAmount: 0, approvedAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('PENDING');
  const [type, setType] = useState('ALL');
  const [channel, setChannel] = useState('ALL');
  const [search, setSearch] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');
  const [rejecting, setRejecting] = useState<Op | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    try {
      const q = new URLSearchParams();
      if (status !== 'ALL') q.set('status', status);
      if (type !== 'ALL') q.set('type', type);
      if (channel !== 'ALL') q.set('channel', channel);
      if (search.trim()) q.set('search', search.trim());
      const res = await fetch(`/api/operations?${q.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setOps(data.operations || []);
        setStats({ total: data.total || 0, pendingCount: data.pendingCount || 0, pendingAmount: data.totalPendingAmountDzd || 0, approvedAmount: data.totalApprovedAmountDzd || 0 });
      }
    } catch {
      /* the list keeps its last rows; the refresh button retries */
    } finally {
      setLoading(false);
    }
  }, [status, type, channel, search]);

  useEffect(() => {
    setLoading(true);
    load();
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 45000);
    return () => clearInterval(t);
  }, [load]);

  const act = async (id: string, kind: 'approve' | 'reject', body?: unknown) => {
    setActingId(id); setOk(''); setErr('');
    try {
      const res = await fetch(`/api/operations/${id}/${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setOk(kind === 'approve' ? tx('تمت الموافقة وتفعيل حساب أو طلب الطالب.', "Opération approuvée et activée.", 'Approved and activated.') : tx('تم رفض الطلب.', 'Opération rejetée.', 'Request rejected.'));
        load();
        setTimeout(() => setOk(''), 4000);
      } else {
        setErr(data.error || (kind === 'approve' ? tx('فشلت الموافقة', "Échec de l'approbation", 'Approval failed') : tx('فشل الرفض', 'Échec du rejet', 'Rejection failed')));
      }
    } catch (e) {
      setErr((e as Error).message || tx('خطأ في الاتصال', 'Erreur réseau', 'Network error'));
    } finally {
      setActingId(null);
    }
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    const id = rejecting.id;
    setRejecting(null);
    await act(id, 'reject', { adminNotes: reason });
    setReason('');
  };

  const typeLabel = (t: string) =>
    t === 'ACCOUNT_ACTIVATION' ? tx('تفعيل حساب جديد', 'Création de compte', 'New account')
    : t === 'VIP_MEMBERSHIP_UPGRADE' ? tx('ترقية VIP الذهبية', 'Adhésion Gold VIP', 'Gold VIP upgrade')
    : t === 'BUNDLE_PURCHASE' ? tx('شراء باقة / عرض', 'Pack / Offre', 'Bundle purchase')
    : tx('دعم واستفسار', 'Support direct', 'Support');

  const channelLabel = (c: string | null) => (c === 'WHATSAPP' ? 'WhatsApp' : c === 'TELEGRAM' ? 'Telegram' : c === 'LINKEDIN' ? 'LinkedIn' : tx('مباشر', 'Direct', 'Direct'));
  const statusView = (s: Op['status']): { kind: StatusKind; label: string } =>
    s === 'PENDING' ? { kind: 'pending', label: tx('قيد الانتظار', 'En attente', 'Pending') }
    : s === 'APPROVED' ? { kind: 'ok', label: tx('تمت الموافقة', 'Approuvée', 'Approved') }
    : { kind: 'danger', label: tx('مرفوض', 'Rejetée', 'Rejected') };

  const cols: Col<Op>[] = [
    { id: 'who', header: tx('الطالب', 'Étudiant', 'Student'), w: '1.4fr', cell: (o) => (
      <Cell2 title={o.userName || '—'} sub={<>{o.userEmail ? <bdi dir="ltr">{o.userEmail}</bdi> : null}{o.userWilaya ? <span> {o.userWilaya}</span> : null}</>} />
    ) },
    { id: 'service', header: tx('الخدمة', 'Service', 'Service'), w: '1.5fr', cell: (o) => <Cell2 title={typeLabel(o.type)} sub={o.details || o.title} /> },
    { id: 'channel', header: tx('القناة', 'Canal', 'Channel'), w: '1fr', cell: (o) => <bdi className="whitespace-nowrap">{channelLabel(o.channel)}</bdi> },
    { id: 'amount', header: tx('المبلغ', 'Montant', 'Amount'), w: '1fr', cell: (o) => (o.amountDzd > 0 ? <bdi className="font-semibold">{formatDZD(o.amountDzd, locale)}</bdi> : <span className="text-sheet-muted">—</span>) },
    { id: 'date', header: tx('التاريخ', 'Date', 'Date'), w: '0.9fr', cell: (o) => <bdi className="text-[14px]">{dateFmt(o.createdAt, locale)}</bdi> },
    { id: 'status', header: tx('الحالة', 'Statut', 'Status'), w: '1fr', m: 'status', cell: (o) => { const v = statusView(o.status); return <Cell2 title={<Status kind={v.kind}>{v.label}</Status>} sub={o.status === 'APPROVED' && o.approvedByAdmin ? o.approvedByAdmin : undefined} />; } },
    { id: 'act', header: tx('إجراء', 'Action', 'Action'), w: '2.2fr', m: 'actions', cell: (o) => (
      <Actions>
        {o.status === 'PENDING' ? (
          <>
            <RowAction onClick={() => act(o.id, 'approve')} disabled={actingId === o.id} testId={`op-approve-${o.id}`}>{tx('موافقة', 'Approuver', 'Approve')}</RowAction>
            <RowAction danger onClick={() => { setReason(''); setRejecting(o); }} disabled={actingId === o.id} testId={`op-reject-${o.id}`}>{tx('رفض', 'Rejeter', 'Reject')}</RowAction>
          </>
        ) : null}
        {o.userPhone ? <RowAction href={`https://wa.me/${o.userPhone.replace(/[^0-9]/g, '').replace(/^0/, '213')}`} label={tx('مراسلة عبر واتساب', 'Écrire sur WhatsApp', 'Message on WhatsApp')}>WhatsApp</RowAction> : null}
      </Actions>
    ) },
  ];

  return (
    <div className="flex flex-col gap-6" data-testid="admin-operations">
      <PageHead
        title={tx('الطلبات والمدفوعات', 'Demandes et paiements', 'Requests and payments')}
        sub={tx('طلبات التفعيل والمدفوعات، بتحديث تلقائي.', 'Activations et paiements, mis à jour automatiquement.', 'Activations and payments, refreshed automatically.')}
        action={<Btn variant="secondary" onClick={() => { setLoading(true); load(); }}>{tx('تحديث فوري', 'Actualiser', 'Refresh')}</Btn>}
      />

      <Tiles>
        <Tile label={tx('المداخيل المحصّلة (المؤكدة)', 'Revenus encaissés (validés)', 'Collected revenue (confirmed)')} value={<bdi>{formatDZD(stats.approvedAmount, locale)}</bdi>} caption={tx('مدفوعات حقيقية تم اعتمادها بالمنصة', 'Paiements réels confirmés', 'Real payments approved on the platform')} />
        <Tile label={tx('المبالغ قيد الانتظار', 'Montants en attente', 'Amounts pending')} value={<bdi>{formatDZD(stats.pendingAmount, locale)}</bdi>} caption="BaridiMob, CCP" />
        <Tile label={tx('الطلبات المعلقة', 'Demandes en attente', 'Pending requests')} value={<bdi>{stats.pendingCount}</bdi>} caption={stats.pendingCount ? tx('تحتاج إجراء', 'À traiter', 'Need action') : tx('مكتمل', 'À jour', 'All caught up')} />
        <Tile label={tx('إجمالي سجل العمليات', 'Total des demandes', 'Total requests')} value={<bdi>{stats.total}</bdi>} caption={tx('تحديث تلقائي حي', 'Actualisation automatique', 'Live refresh')} />
      </Tiles>

      {ok ? <Banner kind="ok" testId="op-ok">{ok}</Banner> : null}
      {err ? <Banner kind="danger" testId="op-error">{err}</Banner> : null}

      <Tabs
        label={tx('حالة الطلب', 'Statut', 'Status')}
        value={status}
        onChange={setStatus}
        items={[
          { id: 'ALL', label: tx('الكل', 'Toutes', 'All') },
          { id: 'PENDING', label: tx('قيد الانتظار', 'En attente', 'Pending') },
          { id: 'APPROVED', label: tx('تمت الموافقة', 'Approuvées', 'Approved') },
          { id: 'REJECTED', label: tx('المرفوضة', 'Rejetées', 'Rejected') },
        ]}
      />

      <div className="grid gap-3 md:grid-cols-[1fr_200px_200px]">
        <SearchInput id="op-search" label={tx('بحث', 'Recherche', 'Search')} value={search} onChange={setSearch} placeholder={tx('ابحث باسم الطالب، البريد، الهاتف، أو الخدمة...', 'Nom, email, téléphone ou service…', 'Name, email, phone or service…')} />
        <SelectInput id="op-type" label={tx('الخدمة', 'Service', 'Service')} value={type} onChange={setType} options={[
          { value: 'ALL', label: tx('كل الخدمات', 'Tous les services', 'All services') },
          { value: 'ACCOUNT_ACTIVATION', label: typeLabel('ACCOUNT_ACTIVATION') },
          { value: 'VIP_MEMBERSHIP_UPGRADE', label: typeLabel('VIP_MEMBERSHIP_UPGRADE') },
          { value: 'BUNDLE_PURCHASE', label: typeLabel('BUNDLE_PURCHASE') },
        ]} />
        <SelectInput id="op-channel" label={tx('القناة', 'Canal', 'Channel')} value={channel} onChange={setChannel} options={[
          { value: 'ALL', label: tx('جميع القنوات', 'Tous les canaux', 'All channels') },
          { value: 'WHATSAPP', label: 'WhatsApp' },
          { value: 'TELEGRAM', label: 'Telegram' },
          { value: 'LINKEDIN', label: 'LinkedIn' },
        ]} />
      </div>

      {loading ? (
        <SkeletonRows n={4} />
      ) : ops.length === 0 ? (
        <Empty
          title={tx('لا توجد طلبات تطابق معايير البحث', 'Aucune demande trouvée', 'No requests match')}
          body={tx('عندما يطلب طالب التفعيل أو يتواصل عبر واتساب أو تيليغرام للدفع، تظهر تفاصيله هنا فوراً.', 'Les nouvelles activations et demandes de paiement apparaîtront ici.', 'New activations and payment requests show up here.')}
        />
      ) : (
        <DataTable cols={cols} rows={ops} rowKey={(o) => o.id} label={tx('الطلبات', 'Demandes', 'Requests')} testId="op-table" />
      )}

      <Dialog open={!!rejecting} onClose={() => setRejecting(null)} title={tx('رفض الطلب', 'Rejeter la demande', 'Reject request')} sub={tx('سيصبح الطلب مرفوضاً. يمكنك ذكر السبب.', 'La demande passera en rejetée. Vous pouvez indiquer le motif.', 'The request will be marked rejected. You can add a reason.')} testId="op-reject-dialog">
        <TextInput id="op-reject-reason" label={tx('سبب الرفض (اختياري)', 'Motif du refus (facultatif)', 'Reason (optional)')} value={reason} onChange={setReason} />
        <div className="flex flex-wrap justify-end gap-2.5">
          <button type="button" onClick={() => setRejecting(null)} className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-sheet-text px-6 text-[15px] font-semibold ${focus}`}>{tx('إلغاء', 'Annuler', 'Cancel')}</button>
          <DangerBtn onClick={confirmReject} testId="op-reject-confirm">{tx('تأكيد الرفض', 'Confirmer le rejet', 'Confirm rejection')}</DangerBtn>
        </div>
      </Dialog>
    </div>
  );
};
