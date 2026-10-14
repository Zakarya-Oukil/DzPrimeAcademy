'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Megaphone, Newspaper, UserGear, UsersThree } from '@phosphor-icons/react';
import { useAuthStore } from '@/lib/store';
import { AppShell, ShellGroup } from '@/components/student-v2/AppShell';
import { focus, useTx } from '@/components/student-v2/ui';

/** Ambassador area shell (Figma page 29): the generic shell with the ambassador navigation. */
export const AmbassadorShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tx, locale } = useTx();
  const pathname = usePathname() || '';
  const { currentUser } = useAuthStore();
  const base = `/${locale}/ambassador`;
  const has = (seg: string) => pathname.includes(`/ambassador/${seg}`);
  const isHome = /\/ambassador\/?$/.test(pathname);

  const groups: ShellGroup[] = [
    {
      title: tx('السفير', 'Ambassadeur', 'Ambassador'),
      items: [
        { id: 'home', href: base, label: tx('لوحتي', 'Mon espace', 'My dashboard'), icon: House, match: () => isHome },
        { id: 'sessions', href: `${base}/sessions`, label: tx('الحصص والورشات', 'Sessions et ateliers', 'Sessions and workshops'), icon: Megaphone, match: () => has('sessions') },
      ],
    },
    {
      title: tx('الشبكة والنشر', 'Réseau et publications', 'Network and posts'),
      items: [
        { id: 'network', href: `${base}/network`, label: tx('شبكة 58 ولاية', 'Réseau des 58 wilayas', '58-wilaya network'), icon: UsersThree, match: () => has('network') },
        { id: 'posts', href: `${base}/posts`, label: tx('منشوراتي وفيديوهاتي', 'Mes publications', 'My posts and videos'), icon: Newspaper, match: () => has('posts') },
      ],
    },
    {
      title: tx('الحساب', 'Compte', 'Account'),
      items: [{ id: 'settings', href: `${base}/settings`, label: tx('الملف والأمان', 'Profil et sécurité', 'Profile and security'), icon: UserGear, match: () => has('settings') }],
    },
  ];

  const top = [
    { href: base, label: tx('لوحتي', 'Mon espace', 'Dashboard'), on: isHome },
    { href: `${base}/sessions`, label: tx('الحصص', 'Sessions', 'Sessions'), on: has('sessions') },
    { href: `${base}/posts`, label: tx('منشوراتي', 'Publications', 'Posts'), on: has('posts') || pathname.includes('/community') || pathname.includes('/leaderboard') },
    { href: `${base}/network`, label: tx('الشبكة', 'Réseau', 'Network'), on: has('network') },
  ];

  const newLink = (cls: string) => (
    <Link href={`${base}/sessions?new=1`} className={`${cls} ${focus}`} data-testid="ambassador-new-cta">
      <Megaphone size={18} weight="fill" aria-hidden="true" />
      {tx('إعلان جديد', 'Nouvelle annonce', 'New announcement')}
    </Link>
  );

  return (
    <AppShell
      testId="ambassador-shell-v2"
      homeHref={base}
      homeLabel={tx('لوحتي', 'Mon espace', 'My dashboard')}
      navLabel={tx('قائمة السفير', "Menu de l'ambassadeur", 'Ambassador menu')}
      groups={groups}
      top={top}
      settingsHref={`${base}/settings`}
      publicProfileHref={currentUser?.id ? `/${locale}/profile/${currentUser.id}` : undefined}
      cta={newLink('hidden min-h-[44px] items-center gap-2 rounded-full bg-gold-500 px-5 text-[15px] font-semibold text-[#050505] hover:bg-gold-400 sm:inline-flex')}
      mobileCta={newLink('inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-gold-500 px-6 text-[15px] font-semibold text-[#050505]')}
    >
      {children}
    </AppShell>
  );
};
