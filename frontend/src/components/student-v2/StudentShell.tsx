'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Backpack, BookOpen, Crown, Exam, House, IdentificationCard, User as UserIcon, VideoCamera } from '@phosphor-icons/react';
import { useAuthStore } from '@/lib/store';
import { isGoldenMember } from '@/lib/rbac';
import { UpgradeModal } from '@/components/shared/UpgradeModal';
import { AppShell, ShellGroup } from './AppShell';
import { useTx } from './ui';

/** Student area shell (Figma pages 26 and 27): the generic shell with the Student navigation. */
export const StudentShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tx, locale } = useTx();
  const pathname = usePathname() || '';
  const { currentUser } = useAuthStore();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const isGold = isGoldenMember(currentUser);
  const base = `/${locale}`;
  const has = (seg: string) => pathname.includes(`/${seg}`);

  const groups: ShellGroup[] = [
    {
      title: tx('لوحتي', 'Mon espace', 'My space'),
      items: [
        { id: 'home', href: `${base}/student`, label: tx('الرئيسية', 'Accueil', 'Home'), icon: House, match: (p) => /\/student\/?$/.test(p) },
        { id: 'courses', href: `${base}/dawarat`, label: tx('دوراتي', 'Mes cours', 'My courses'), icon: BookOpen, match: () => has('dawarat') },
        { id: 'live', href: `${base}/student/workshops`, label: tx('الحصص المباشرة', 'Sessions en direct', 'Live sessions'), icon: VideoCamera, match: () => has('workshops') },
      ],
    },
    {
      title: tx('المراجعة', 'Révision', 'Revision'),
      items: [
        { id: 'exams', href: `${base}/exams`, label: tx('بنك الامتحانات', "Banque d'examens", 'Exam bank'), icon: Exam, match: (p) => has('exams') && !p.includes('bag') },
        { id: 'bag', href: `${base}/exams?bag=1`, label: tx('حقيبتي الدراسية', "Mon sac d'études", 'My study bag'), icon: Backpack, match: () => false },
      ],
    },
    {
      title: tx('الحساب', 'Compte', 'Account'),
      items: [
        { id: 'card', href: `${base}/card`, label: tx('بطاقة العضوية', 'Carte de membre', 'Membership card'), icon: IdentificationCard, match: () => has('card') },
        { id: 'settings', href: `${base}/student/settings`, label: tx('الملف الشخصي', 'Profil et réglages', 'Profile and settings'), icon: UserIcon, match: () => has('settings') },
      ],
    },
  ];

  const top = [
    { href: `${base}/student`, label: tx('لوحتي', 'Mon espace', 'My space'), on: /\/student(\/workshops)?\/?$/.test(pathname) },
    { href: `${base}/dawarat`, label: tx('الدورات', 'Cours', 'Courses'), on: has('dawarat') },
    { href: `${base}/exams`, label: tx('الامتحانات', 'Examens', 'Exams'), on: has('exams') },
    { href: `${base}/community`, label: tx('المجتمع', 'Communauté', 'Community'), on: has('community') || has('leaderboard') },
  ];

  const upgradeBtn = (cls: string) => (
    <button type="button" onClick={() => setUpgradeOpen(true)} className={cls} data-testid="student-upgrade-btn">
      <Crown size={18} weight="fill" aria-hidden="true" />
      {tx('ترقية إلى VIP', 'Passer en VIP', 'Upgrade to VIP')}
    </button>
  );

  return (
    <AppShell
      testId="student-shell-v2"
      homeHref={`${base}/student`}
      homeLabel={tx('لوحتي', 'Mon espace', 'My space')}
      navLabel={tx('قائمة الطالب', "Menu de l'étudiant", 'Student menu')}
      groups={groups}
      top={top}
      settingsHref={`${base}/student/settings`}
      publicProfileHref={currentUser?.id ? `${base}/profile/${currentUser.id}` : undefined}
      cta={
        !isGold ? upgradeBtn('hidden min-h-[44px] items-center gap-2 rounded-full bg-gold-500 px-5 text-[15px] font-semibold text-[#050505] hover:bg-gold-400 sm:inline-flex') : (
          <span className="hidden items-center gap-1.5 rounded-full bg-pill-tint px-4 py-2 text-[14px] font-semibold sm:inline-flex"><Crown size={16} weight="fill" aria-hidden="true" />VIP</span>
        )
      }
      mobileCta={!isGold ? upgradeBtn('inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-gold-500 px-6 text-[15px] font-semibold text-[#050505]') : undefined}
      extras={<UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />}
    >
      {children}
    </AppShell>
  );
};
