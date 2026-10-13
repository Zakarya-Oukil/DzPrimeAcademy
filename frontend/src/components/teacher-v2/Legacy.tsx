'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { TeacherCoursesPanel, TeacherSessionsPanel } from '@/components/teacher/TeacherCatalogPanels';
import { TeacherRosterPanel } from '@/components/dashboard/TeacherRosterPanel';
import SocialFeed from '@/components/community/SocialFeed';
import { MembershipCard } from '@/components/card/MembershipCard';
import { SettingsModal } from '@/components/settings/SettingsModal';

/** The current screens, shown on the new Teacher routes while the design switch is off. */
const Wrap: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</div>;

export const LegacyModules: React.FC = () => { const { locale } = useTranslation(); const { currentUser } = useAuthStore(); return <Wrap>{currentUser ? <TeacherCoursesPanel locale={locale} userId={currentUser.id} /> : null}</Wrap>; };
export const LegacySessions: React.FC = () => { const { locale } = useTranslation(); const { currentUser } = useAuthStore(); return <Wrap>{currentUser ? <TeacherSessionsPanel locale={locale} userId={currentUser.id} /> : null}</Wrap>; };
export const LegacyRoster: React.FC = () => { const { locale } = useTranslation(); return <Wrap><TeacherRosterPanel locale={locale} /></Wrap>; };
export const LegacyPosts: React.FC = () => { const { currentUser } = useAuthStore(); return <Wrap><SocialFeed authorFilterId={currentUser?.id} /></Wrap>; };
export const LegacyCard: React.FC = () => { const { currentUser } = useAuthStore(); return <Wrap><MembershipCard user={currentUser} allowExport /></Wrap>; };
export const LegacySettings: React.FC = () => { const router = useRouter(); return <SettingsModal isOpen onClose={() => router.back()} />; };
