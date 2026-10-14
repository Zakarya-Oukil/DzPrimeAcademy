'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy } from '@phosphor-icons/react';
import { useAuthStore } from '@/lib/store';
import { formatDZD } from '@/lib/format';
import { Btn, Empty, PageHead, Panel, SectionHead, SkeletonRows, dateFmt, focus, useTx } from '@/components/student-v2/ui';
import { isAnnouncement, promoOf, useAmbAccount, useMyPosts } from './data';

/** Ambassador home (Figma page 29): promo code and referral link first, then the real numbers and the latest announcements. */

// The old Ambassador page used #hash tabs; keep those links working.
const HASH_ROUTES: Record<string, string> = { workshops: 'sessions', community: 'posts', network: 'network', profile: 'settings' };

export const typeLabel = (t: string, tx: (ar: string, fr: string, en?: string) => string) =>
  t === 'SESSION_SCHEDULE' ? tx('حصة مراجعة', "Session d'étude", 'Study session') : t === 'EVENT' ? tx('حدث جامعي', 'Événement', 'Campus event') : t === 'STUDY_TIP' ? tx('نصيحة تفوق', "Conseil d'étude", 'Study tip') : tx('إعلان هام', 'Annonce', 'Announcement');

export const AmbassadorHomeV2: React.FC = () => {
  const { tx, locale } = useTx();
  const router = useRouter();
  const base = `/${locale}/ambassador`;
  const { currentUser } = useAuthStore();
  const acct = useAmbAccount();
  const posts = useMyPosts();
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  useEffect(() => {
    const go = () => { const h = window.location.hash.replace('#', ''); if (HASH_ROUTES[h]) router.replace(`${base}/${HASH_ROUTES[h]}`); };
    go();
    window.addEventListener('hashchange', go);
    return () => window.removeEventListener('hashchange', go);
  }, [base, router]);

  const code = promoOf(acct, currentUser?.wilayaCode);
  const copy = async (what: 'code' | 'link') => {
    const text = what === 'code' ? code : `${window.location.origin}/${locale}/ambassadors`;
    try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(null), 2200); } catch { /* clipboard blocked: the code stays selectable on screen */ }
  };

  const latest = (posts.items || []).filter(isAnnouncement).slice(0, 3);

  return (
    <div className="flex flex-col gap-9" data-testid="ambassador-home-v2">
      <PageHead title={tx('لوحة السفير', "Espace ambassadeur", 'Ambassador dashboard')} sub={tx('شارك كودك ورابطك أولاً، ثم تابع إحالاتك وعوائدك.', "Partagez d'abord votre code et votre lien, puis suivez vos parrainages.", 'Share your code and link first, then follow your referrals.')} />

      <section className="flex flex-col gap-6 rounded-[28px] bg-strip p-6 text-strip-text sm:p-8 md:flex-row md:items-center md:gap-8" aria-labelledby="ah-h" data-testid="ambassador-hero">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className="w-fit rounded-full bg-strip-tint px-3 py-1 text-[13px] font-semibold text-gold-700 dark:text-gold-500">{tx('أدواتك', 'Vos outils', 'Your tools')}</p>
          <h2 id="ah-h" className="text-[26px] font-bold leading-[1.25] sm:text-[30px]">{tx('شارك الكود والرابط مع طلبة ولايتك', 'Partagez le code et le lien avec les étudiants de votre wilaya', 'Share your code and link with students in your wilaya')}</h2>
          <p className="text-[15px] text-strip-muted">{tx('كل اشتراك بكودك يُحتسب في إحالاتك وعوائدك.', 'Chaque abonnement avec votre code compte dans vos parrainages et gains.', 'Every subscription with your code counts toward your referrals and earnings.')}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Btn onClick={() => copy('code')} data-testid="ambassador-copy-code">{copied === 'code' ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}{copied === 'code' ? tx('تم النسخ', 'Copié', 'Copied') : tx('انسخ الكود', 'Copier le code', 'Copy code')}</Btn>
            <Btn variant="secondary" tone="strip" href={`${base}/sessions?new=1`}>{tx('إعلان جديد', 'Nouvelle annonce', 'New announcement')}</Btn>
            <button type="button" onClick={() => copy('link')} className={`min-h-[44px] text-[15px] font-semibold underline underline-offset-4 ${focus}`} data-testid="ambassador-copy-link">{copied === 'link' ? tx('تم النسخ', 'Copié', 'Copied') : tx('انسخ رابط الدليل العام', "Copier le lien de l'annuaire", 'Copy public directory link')}</button>
          </div>
        </div>
        <div className="flex min-w-[220px] flex-col items-center justify-center gap-1 rounded-[22px] bg-strip-tint px-7 py-6 md:py-8">
          <span className="select-all break-all text-center text-[28px] font-bold leading-none tracking-wide tabular-nums md:text-[34px]" dir="ltr" data-testid="ambassador-code">{acct === null ? '–' : code}</span>
          <span className="text-center text-[13px] text-strip-muted">{tx('كود الخصم الحصري', 'Code promo exclusif', 'Your promo code')}</span>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap" data-testid="ambassador-quick-actions">
        <Btn href={`${base}/sessions?new=1`}>{tx('إعلان حصة أو ورشة', 'Annoncer une session', 'Announce a session')}</Btn>
        <Btn href={`${base}/posts?new=1`} variant="secondary">{tx('منشور جديد', 'Nouvelle publication', 'New post')}</Btn>
        <Btn href={`${base}/network`} variant="secondary">{tx('شبكة السفراء', 'Réseau des ambassadeurs', 'Ambassador network')}</Btn>
      </div>

      <section aria-label={tx('ملخص', 'Résumé', 'Summary')} className="grid grid-cols-2 gap-3 sm:gap-4">
        <Stat label={tx('عدد الإحالات', 'Parrainages', 'Referrals')} value={acct ? String(acct.referralsCount ?? 0) : null} />
        <Stat label={tx('إجمالي عوائد الإحالات', 'Gains de parrainage', 'Referral earnings')} value={acct ? formatDZD(acct.commissionDzd ?? 0, locale) : null} />
      </section>

      <section aria-labelledby="ah-up" className="flex flex-col gap-3">
        <SectionHead title={tx('آخر إعلاناتي', 'Mes dernières annonces', 'My latest announcements')} href={`${base}/sessions`} linkLabel={tx('كل الإعلانات', 'Toutes les annonces', 'All announcements')} />
        <h2 id="ah-up" className="sr-only">{tx('آخر إعلاناتي', 'Mes dernières annonces', 'My latest announcements')}</h2>
        {posts.items === null ? <SkeletonRows n={3} /> : latest.length === 0 ? (
          <Empty title={tx('لا توجد إعلانات بعد', 'Aucune annonce pour le moment', 'No announcements yet')} body={tx('أعلن أول حصة أو ورشة لطلبة ولايتك.', 'Annoncez votre première session aux étudiants de votre wilaya.', 'Announce your first session to students in your wilaya.')} action={<Btn href={`${base}/sessions?new=1`}>{tx('إعلان جديد', 'Nouvelle annonce', 'New announcement')}</Btn>} />
        ) : (
          <ul className="flex flex-col gap-3">
            {latest.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 rounded-[18px] bg-sheet-card p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span aria-hidden="true" className="grid h-[52px] w-[60px] shrink-0 place-items-center rounded-[14px] bg-sheet-line text-[14px] font-semibold tabular-nums">{dateFmt(p.createdAt, locale, { day: 'numeric', month: 'short' })}</span>
                  <div className="min-w-0">
                    <p className="text-[16px] font-medium">{p.title}</p>
                    <p className="text-[13px] text-sheet-muted">{[typeLabel(p.type, tx), p.isOnline ? tx('عن بُعد', 'En ligne', 'Online') : p.location || tx('حضوري', 'Présentiel', 'On site'), `${(p.comments || []).length} ${tx('ردود', 'réponses', 'replies')}`].join('  ·  ')}</p>
                  </div>
                </div>
                <Btn href={`${base}/sessions`} variant="secondary">{tx('الردود', 'Réponses', 'Replies')}</Btn>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string | null }> = ({ label, value }) => (
  <Panel className="flex flex-col gap-2 !p-4 sm:!p-6">
    <p className="text-[13px] font-medium text-sheet-muted sm:text-[14px]">{label}</p>
    <p className="text-[24px] font-bold leading-none tabular-nums sm:text-[36px]" aria-live="polite">{value ?? '–'}</p>
  </Panel>
);
