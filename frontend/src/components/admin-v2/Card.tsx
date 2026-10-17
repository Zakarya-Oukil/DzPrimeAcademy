'use client';

import React from 'react';
import { Btn, PageHead, Panel, Status, useTx } from '@/components/student-v2/ui';
import { AdminMembershipCard } from '@/components/card/AdminMembershipCard';
import { useAuthStore } from '@/lib/store';
import { H2 } from './ui';

/** Admin card (Figma page 31, "Admin card"). The card art is unchanged; the facts next to it come from the signed-in account only. */
export const CardSection: React.FC = () => {
  const { tx, locale } = useTx();
  const { currentUser } = useAuthStore();
  const cardId = currentUser?.studentCardId;

  const level = (() => {
    if (currentUser?.role === 'OWNER' || currentUser?.adminRole === 'SUPER_ADMIN') return tx('المسؤول الأعلى', 'Super admin', 'Super admin');
    if (currentUser?.adminRole === 'GENERAL_ADMIN') return tx('المدير العام الإداري', 'Admin général', 'General admin');
    if (currentUser?.adminRole === 'HR_MANAGER' || currentUser?.adminRole === 'HR_EMPLOYEE') return tx('الموارد البشرية (HR)', 'Ressources humaines', 'Human resources');
    if (currentUser?.adminRole === 'COMMERCIAL') return tx('المصلحة التجارية', 'Commercial', 'Commercial');
    if (currentUser?.adminRole === 'FINANCE') return tx('المالية', 'Finances', 'Finance');
    return tx('مسؤول إداري', 'Administrateur', 'Administrator');
  })();

  return (
    <div className="flex flex-col gap-6" data-testid="admin-card-tab">
      <PageHead
        title={tx('بطاقة الإدارة', "Carte d'administration", 'Admin card')}
        sub={tx('معاينة بطاقتك الرقمية ومواصفاتها.', 'Aperçu de votre carte numérique et de ses informations.', 'Preview of your digital card and its details.')}
        action={cardId ? <Btn variant="secondary" href={`/${locale}/verify/${cardId}`}>{tx('رابط الفحص QR', 'Tester le QR', 'Test the QR link')}</Btn> : undefined}
      />
      <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel className="flex flex-col items-center gap-4">
          <AdminMembershipCard user={currentUser} allowExport={true} />
          {cardId ? <p className="text-[13px] text-sheet-muted">{tx('المعرف الرقمي المعتمد:', 'Identifiant certifié :', 'Verified ID:')} <bdi>{cardId}</bdi></p> : null}
        </Panel>
        <Panel as="section" className="flex flex-col gap-3">
          <H2>{tx('مواصفات بطاقة الإدارة', 'Détails de la carte', 'Card details')}</H2>
          <dl className="flex flex-col gap-2.5 text-[15px]">
            <div className="flex justify-between gap-4"><dt className="text-sheet-muted">{tx('مستوى الصلاحية', "Niveau d'accès", 'Access level')}</dt><dd className="font-semibold">{level}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-sheet-muted">{tx('حالة التوثيق', 'Statut', 'Status')}</dt><dd><Status kind={currentUser?.isVerified ? 'ok' : 'pending'}>{currentUser?.isVerified ? tx('معتمد رسمياً', 'Certifié', 'Verified') : tx('قيد المراجعة', 'En revue', 'In review')}</Status></dd></div>
            <div className="flex justify-between gap-4"><dt className="text-sheet-muted">{tx('التحقق المباشر', 'Vérification en direct', 'Live check')}</dt><dd>{cardId ? <a href={`/${locale}/verify/${cardId}`} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4">{tx('رابط الفحص QR', 'Tester le QR', 'Test QR link')}</a> : '—'}</dd></div>
          </dl>
        </Panel>
      </div>
    </div>
  );
};
