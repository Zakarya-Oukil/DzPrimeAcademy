'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, Crown, Exam, Gear, House, IdentificationCard, List, SignOut, User as UserIcon, VideoCamera, X, Backpack } from '@phosphor-icons/react';
import { useAuthStore } from '@/lib/store';
import { isGoldenMember } from '@/lib/rbac';
import { UpgradeModal } from '@/components/shared/UpgradeModal';
import { FloatingBotWidget } from '@/components/bot/FloatingBotWidget';
import { LanguageLinks, ThemeSegment } from '@/components/landing-v2/PillHeader';
import { Avatar, focus, useTx } from './ui';

/** Shell of the redesigned Student area: floating pill header, rounded sidebar panel, content sheet (Figma page 26 and 27). */

type NavItem = { id: string; href: string; label: string; icon: React.ElementType; match: (p: string) => boolean };

export const StudentShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tx, locale } = useTx();
  const pathname = usePathname() || '';
  const router = useRouter();
  const { currentUser, signOut } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const isGold = isGoldenMember(currentUser);
  const base = `/${locale}`;
  const has = (seg: string) => pathname.includes(`/${seg}`);

  const groups: { title: string; items: NavItem[] }[] = [
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

  // A temporary password has to be replaced before anything else.
  useEffect(() => {
    if (currentUser?.mustChangePassword && !pathname.includes('/student/settings')) router.replace(`${base}/student/settings?tab=security`);
  }, [currentUser?.mustChangePassword, pathname, base, router]);

  useEffect(() => { setMenuOpen(false); setUserOpen(false); }, [pathname]);
  useEffect(() => {
    if (!userOpen && !menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setUserOpen(false); setMenuOpen(false); } };
    const onDown = (e: MouseEvent) => { if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onDown); };
  }, [userOpen, menuOpen]);

  const name = currentUser?.name || '';

  const sidebar = (
    <nav aria-label={tx('قائمة الطالب', "Menu de l'étudiant", 'Student menu')} className="flex flex-col gap-1">
      {groups.map((g) => (
        <div key={g.title} className="mb-3 last:mb-0">
          <p className="px-3 pb-2 pt-1 text-[13px] font-medium text-strip-muted">{g.title}</p>
          <ul className="flex flex-col gap-1">
            {g.items.map((it) => {
              const on = it.match(pathname);
              const Icon = it.icon;
              return (
                <li key={it.id}>
                  <Link
                    href={it.href}
                    aria-current={on ? 'page' : undefined}
                    className={`flex min-h-[48px] items-center gap-3 rounded-[12px] px-3 text-[15px] transition-colors motion-reduce:transition-none ${on ? 'bg-strip-tint font-semibold text-strip-text' : 'font-medium text-strip-muted hover:bg-strip-tint hover:text-strip-text'} ${focus}`}
                  >
                    <Icon size={22} weight={on ? 'fill' : 'regular'} aria-hidden="true" />
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground" data-testid="student-shell-v2">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-2 focus:z-50 focus:rounded-full focus:bg-gold-500 focus:px-4 focus:py-2 focus:text-[#050505]">
        {tx('تخطي إلى المحتوى', 'Aller au contenu', 'Skip to content')}
      </a>

      <header className="pointer-events-none sticky top-0 z-40">
        <div className="px-4 pt-3 sm:px-12 sm:pt-6">
          <div className={`pointer-events-auto mx-auto max-w-[1344px] border border-transparent bg-pill text-pill-text ${menuOpen ? 'rounded-[28px]' : 'rounded-[36px]'}`}>
            <div className="flex items-center gap-1.5 px-2 py-2 sm:px-4 lg:py-3">
              <Link href={`${base}/student`} aria-label={tx('لوحتي', 'Mon espace', 'My space')} className={`flex items-center gap-2.5 rounded-full ps-1 pe-2 sm:gap-3 sm:pe-3 ${focus}`}>
                <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-[#9a6b1e] bg-[#050505]">
                  <Image src="/images/dzprime-logo-amber.png" alt="" width={38} height={38} priority className="h-[38px] w-[38px] object-contain" />
                </span>
                <span className="whitespace-nowrap text-[16px] font-semibold tracking-tight sm:text-[17px]">DZ Prime Academy</span>
              </Link>

              <ul className="hidden items-center lg:flex">
                {top.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} aria-current={l.on ? 'page' : undefined} className={`relative inline-flex min-h-[44px] items-center px-3.5 text-[15px] ${l.on ? 'font-semibold text-pill-text' : 'font-medium text-pill-muted hover:text-pill-text'} ${focus}`}>
                      {l.label}
                      {l.on ? <span aria-hidden="true" className="absolute bottom-1 start-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-pill-accent rtl:translate-x-1/2" /> : null}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="flex-1" />

              {!isGold ? (
                <button type="button" onClick={() => setUpgradeOpen(true)} className="hidden min-h-[44px] items-center gap-2 rounded-full bg-gold-500 px-5 text-[15px] font-semibold text-[#050505] hover:bg-gold-400 sm:inline-flex" data-testid="student-upgrade-btn">
                  <Crown size={18} weight="fill" aria-hidden="true" />
                  {tx('ترقية إلى VIP', 'Passer en VIP', 'Upgrade to VIP')}
                </button>
              ) : (
                <span className="hidden items-center gap-1.5 rounded-full bg-pill-tint px-4 py-2 text-[14px] font-semibold sm:inline-flex">
                  <Crown size={16} weight="fill" aria-hidden="true" />
                  VIP
                </span>
              )}

              <div ref={userRef} className="relative hidden lg:block">
                <button type="button" aria-expanded={userOpen} aria-haspopup="menu" onClick={() => setUserOpen((v) => !v)} className={`flex min-h-[44px] items-center gap-2.5 rounded-full ps-3 pe-1.5 text-[15px] font-medium ${focus}`} data-testid="student-user-menu">
                  <span className="max-w-[140px] truncate">{name}</span>
                  <Avatar name={name} src={currentUser?.avatar} size={36} />
                </button>
                {userOpen ? (
                  <div role="menu" className="absolute end-0 top-full mt-3 w-[300px] rounded-[24px] border border-pill-line bg-pill p-4 shadow-[0_6px_18px_rgba(0,0,0,0.28)]">
                    <p className="px-2 pb-1 text-[15px] font-semibold">{name}</p>
                    <p className="truncate px-2 pb-3 text-[13px] text-pill-muted">{currentUser?.email}</p>
                    <div className="flex flex-col">
                      <Link role="menuitem" href={`${base}/student/settings`} className={`flex min-h-[44px] items-center gap-3 rounded-[12px] px-2 text-[15px] font-medium hover:bg-pill-tint ${focus}`}><Gear size={20} aria-hidden="true" />{tx('الإعدادات', 'Réglages', 'Settings')}</Link>
                      {currentUser?.id ? <Link role="menuitem" href={`${base}/profile/${currentUser.id}`} className={`flex min-h-[44px] items-center gap-3 rounded-[12px] px-2 text-[15px] font-medium hover:bg-pill-tint ${focus}`}><UserIcon size={20} aria-hidden="true" />{tx('ملفي العام', 'Mon profil public', 'My public profile')}</Link> : null}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-pill-line px-1 py-3 mt-2">
                      <ThemeSegment tone="pill" />
                      <LanguageLinks tone="pill" />
                    </div>
                    <button type="button" role="menuitem" onClick={signOut} className={`flex min-h-[44px] w-full items-center gap-3 rounded-[12px] px-2 text-[15px] font-semibold hover:bg-pill-tint ${focus}`} data-testid="student-signout">
                      <SignOut size={20} aria-hidden="true" />
                      {tx('تسجيل الخروج', 'Se déconnecter', 'Sign out')}
                    </button>
                  </div>
                ) : null}
              </div>

              <button type="button" aria-expanded={menuOpen} aria-controls="student-drawer" onClick={() => setMenuOpen((v) => !v)} className={`inline-flex min-h-[44px] items-center gap-2 rounded-full bg-pill-tint px-4 text-[15px] font-semibold lg:hidden ${focus}`} data-testid="student-menu-btn">
                {menuOpen ? <X size={18} aria-hidden="true" /> : <List size={18} aria-hidden="true" />}
                {menuOpen ? tx('إغلاق', 'Fermer', 'Close') : tx('القائمة', 'Menu', 'Menu')}
              </button>
            </div>

            <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none lg:hidden ${menuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div id="student-drawer" inert={!menuOpen} className="overflow-hidden">
                <div className="px-4 pb-5">
                  <div className="rounded-[24px] bg-strip p-4 text-strip-text">{sidebar}</div>
                  <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3">
                    <ThemeSegment tone="pill" />
                    <LanguageLinks tone="pill" />
                  </div>
                  <div className="flex flex-col gap-2">
                    {!isGold ? (
                      <button type="button" onClick={() => { setMenuOpen(false); setUpgradeOpen(true); }} className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-gold-500 px-6 text-[15px] font-semibold text-[#050505]">
                        <Crown size={18} weight="fill" aria-hidden="true" />
                        {tx('ترقية إلى VIP', 'Passer en VIP', 'Upgrade to VIP')}
                      </button>
                    ) : null}
                    <button type="button" onClick={signOut} className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full text-[15px] font-semibold ${focus}`}>
                      <SignOut size={20} aria-hidden="true" />
                      {tx('تسجيل الخروج', 'Se déconnecter', 'Sign out')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 px-4 pb-10 pt-4 sm:px-12">
        <div className="mx-auto flex w-full max-w-[1344px] gap-6 lg:items-stretch">
          <aside className="hidden w-[280px] shrink-0 lg:flex">
            <div className="flex-1 rounded-[32px] bg-strip p-6 text-strip-text">{sidebar}</div>
          </aside>
          <main id="main" className="min-w-0 flex-1 rounded-[32px] bg-sheet p-5 text-sheet-text sm:rounded-[40px] sm:p-10" data-testid="student-main">
            {children}
          </main>
        </div>
      </div>

      <FloatingBotWidget />
      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
};
