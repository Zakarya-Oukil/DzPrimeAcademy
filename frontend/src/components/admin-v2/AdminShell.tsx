'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Bank, Books, ClipboardText, GraduationCap, House, IdentificationCard, Medal, ShareNetwork, SlidersHorizontal, Student, Tag, UsersThree, VideoCamera } from '@phosphor-icons/react';
import { useAuthStore } from '@/lib/store';
import { hasAnyPermission } from '@/lib/rbac';
import { AppShell, ShellGroup } from '@/components/student-v2/AppShell';
import { useTx } from '@/components/student-v2/ui';
import { ADMIN_PERMS, ADMIN_TAB_IDS, AdminTab } from './nav';

/** Admin area shell (Figma page 31): the generic shell with grouped navigation, filtered by the staff role's permissions. */

interface AdminNav {
  active: AdminTab;
  allowed: AdminTab[];
  go: (id: AdminTab) => void;
  pendingOps: number;
}
const Ctx = createContext<AdminNav>({ active: 'home', allowed: ['home'], go: () => {}, pendingOps: 0 });
export const useAdminNav = () => useContext(Ctx);

const readHash = (): AdminTab => {
  if (typeof window === 'undefined') return 'home';
  const h = window.location.hash.replace('#', '') as AdminTab;
  return ADMIN_TAB_IDS.includes(h) ? h : 'home';
};

export const AdminShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tx, locale } = useTx();
  const { currentUser } = useAuthStore();
  const base = `/${locale}`;
  const [hash, setHash] = useState<AdminTab>('home');
  const [pendingOps, setPendingOps] = useState(0);

  useEffect(() => {
    const apply = () => setHash(readHash());
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  const allowed = useMemo(() => ADMIN_TAB_IDS.filter((id) => { const p = ADMIN_PERMS[id]; return !p || hasAnyPermission(currentUser, p); }), [currentUser]);
  // A stale #hash for a section this role may not use falls back to Home. A temporary password goes to Settings first.
  const active: AdminTab = currentUser?.mustChangePassword ? 'settings' : allowed.includes(hash) ? hash : 'home';

  const go = useCallback((id: AdminTab) => {
    setHash(id);
    window.history.replaceState(null, '', `#${id}`);
    window.scrollTo({ top: 0 });
  }, []);

  const canSeeOps = allowed.includes('operations');
  useEffect(() => {
    if (!canSeeOps) return;
    const load = () => {
      fetch('/api/operations/count').then((r) => r.json()).then((d) => { if (d && typeof d.count === 'number') setPendingOps(d.count); }).catch(() => {});
    };
    load();
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 45000);
    return () => clearInterval(t);
  }, [canSeeOps]);

  const item = (id: AdminTab, label: string, icon: React.ElementType) => ({
    id,
    href: `${base}/admin#${id}`,
    label,
    icon,
    match: () => active === id,
    onClick: () => go(id),
    dot: id === 'operations' && pendingOps > 0,
  });
  const has = (id: AdminTab) => allowed.includes(id);
  const make = (title: string, items: ReturnType<typeof item>[]): ShellGroup => ({ title, items });

  const groups: ShellGroup[] = [
    make('', [item('home', tx('الرئيسية', 'Accueil', 'Home'), House)]),
    make(tx('العمل', 'Travail', 'Work'), [
      has('operations') && item('operations', tx('الطلبات والمدفوعات', 'Demandes et paiements', 'Requests and payments'), ClipboardText),
      has('financial') && item('financial', tx('المركز المالي', 'Centre financier', 'Finance'), Bank),
    ].filter(Boolean) as ReturnType<typeof item>[]),
    make(tx('الأشخاص', 'Personnes', 'People'), [
      has('students') && item('students', tx('الطلبة والبطاقات', 'Étudiants et cartes', 'Students and cards'), Student),
      has('teachers') && item('teachers', tx('الأساتذة والمستحقات', 'Enseignants et paie', 'Teachers and pay'), GraduationCap),
      has('ambassadors') && item('ambassadors', tx('السفراء', 'Ambassadeurs', 'Ambassadors'), Medal),
      has('staff') && item('staff', tx('فريق الإدارة', "Équipe d'administration", 'Admin team'), UsersThree),
    ].filter(Boolean) as ReturnType<typeof item>[]),
    make(tx('الكتالوج', 'Catalogue', 'Catalog'), [
      has('courses') && item('courses', tx('الدورات والمقررات', 'Cours et modules', 'Courses and modules'), Books),
      has('sessions') && item('sessions', tx('الحصص المباشرة', 'Sessions en direct', 'Live sessions'), VideoCamera),
      has('bundles') && item('bundles', tx('العروض والأكواد', 'Offres et codes', 'Offers and codes'), Tag),
    ].filter(Boolean) as ReturnType<typeof item>[]),
    make(tx('الموقع', 'Site', 'Site'), [
      has('footer') && item('footer', tx('تذييل الموقع', 'Pied de page', 'Site footer'), ShareNetwork),
      item('card', tx('بطاقة الإدارة', "Carte d'administration", 'Admin card'), IdentificationCard),
      item('settings', tx('الإعدادات', 'Réglages', 'Settings'), SlidersHorizontal),
    ].filter(Boolean) as ReturnType<typeof item>[]),
  ].filter((g) => g.items.length > 0);

  return (
    <Ctx.Provider value={{ active, allowed, go, pendingOps }}>
      <AppShell
        testId="admin-shell-v2"
        homeHref={`${base}/admin`}
        homeLabel={tx('لوحة الإدارة', "Tableau d'administration", 'Admin dashboard')}
        navLabel={tx('قائمة الإدارة', "Menu d'administration", 'Admin menu')}
        groups={groups}
        top={[]}
        settingsHref={`${base}/admin`}
        routeKey={active}
      >
        {children}
      </AppShell>
    </Ctx.Provider>
  );
};
