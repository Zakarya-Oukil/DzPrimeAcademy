'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, House, IdentificationCard, Newspaper, UserGear, UsersThree, VideoCamera } from '@phosphor-icons/react';
import { useAuthStore } from '@/lib/store';
import { AppShell, ShellGroup } from '@/components/student-v2/AppShell';
import { useTx } from '@/components/student-v2/ui';

/** Teacher area shell (Figma page 28): the generic shell with the teaching navigation. */
export const TeacherShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tx, locale } = useTx();
  const pathname = usePathname() || '';
  const { currentUser } = useAuthStore();
  const base = `/${locale}`;
  const has = (seg: string) => pathname.includes(`/teacher/${seg}`);

  const groups: ShellGroup[] = [
    {
      title: tx('التدريس', 'Enseignement', 'Teaching'),
      items: [
        { id: 'studio', href: `${base}/teacher`, label: tx('الاستوديو', 'Studio', 'Studio'), icon: House, match: (p) => /\/teacher\/?$/.test(p) },
        { id: 'modules', href: `${base}/teacher/modules`, label: tx('مقرراتي', 'Mes cours', 'My modules'), icon: BookOpen, match: () => has('modules') },
        { id: 'sessions', href: `${base}/teacher/sessions`, label: tx('حصصي المباشرة', 'Mes sessions', 'My live sessions'), icon: VideoCamera, match: () => has('sessions') },
      ],
    },
    {
      title: tx('المتابعة والنشر', 'Suivi et publication', 'Follow-up and posts'),
      items: [
        { id: 'roster', href: `${base}/teacher/roster`, label: tx('الطلبة والحضور', 'Étudiants et présence', 'Students and attendance'), icon: UsersThree, match: () => has('roster') },
        { id: 'posts', href: `${base}/teacher/posts`, label: tx('منشوراتي وفيديوهاتي', 'Mes publications', 'My posts and videos'), icon: Newspaper, match: () => has('posts') },
      ],
    },
    {
      title: tx('الحساب', 'Compte', 'Account'),
      items: [
        { id: 'card', href: `${base}/teacher/card`, label: tx('بطاقة الأستاذ', "Carte d'enseignant", 'Teacher card'), icon: IdentificationCard, match: () => has('card') },
        { id: 'settings', href: `${base}/teacher/settings`, label: tx('الملف وحساب CCP', 'Profil et compte CCP', 'Profile and CCP'), icon: UserGear, match: () => has('settings') },
      ],
    },
  ];

  const top = [
    { href: `${base}/teacher`, label: tx('الاستوديو', 'Studio', 'Studio'), on: /\/teacher\/?$/.test(pathname) },
    { href: `${base}/teacher/modules`, label: tx('مقرراتي', 'Mes cours', 'My modules'), on: has('modules') },
    { href: `${base}/teacher/sessions`, label: tx('حصصي', 'Mes sessions', 'Sessions'), on: has('sessions') || has('roster') },
    { href: `${base}/community`, label: tx('المجتمع', 'Communauté', 'Community'), on: pathname.includes('/community') || pathname.includes('/leaderboard') || has('posts') },
  ];

  const cardLink = (cls: string) => (
    <Link href={`${base}/teacher/card`} className={cls} data-testid="teacher-card-cta">
      <IdentificationCard size={18} weight="fill" aria-hidden="true" />
      {tx('بطاقة الأستاذ', "Carte d'enseignant", 'Teacher card')}
    </Link>
  );

  return (
    <AppShell
      testId="teacher-shell-v2"
      homeHref={`${base}/teacher`}
      homeLabel={tx('الاستوديو', 'Studio', 'Studio')}
      navLabel={tx('قائمة الأستاذ', "Menu de l'enseignant", 'Teacher menu')}
      groups={groups}
      top={top}
      settingsHref={`${base}/teacher/settings`}
      publicProfileHref={currentUser?.id ? `${base}/profile/${currentUser.id}` : undefined}
      cta={cardLink('hidden min-h-[44px] items-center gap-2 rounded-full bg-gold-500 px-5 text-[15px] font-semibold text-[#050505] hover:bg-gold-400 sm:inline-flex')}
      mobileCta={cardLink('inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-gold-500 px-6 text-[15px] font-semibold text-[#050505]')}
    >
      {children}
    </AppShell>
  );
};
