'use client';

import React from 'react';
import { useAdminNav } from '@/components/admin-v2/AdminShell';
import { HomeSection } from '@/components/admin-v2/Home';
import { OperationsSection } from '@/components/admin-v2/Operations';
import { FinanceSection } from '@/components/admin-v2/Finance';
import { TeachersSection } from '@/components/admin-v2/Teachers';
import { StudentsSection } from '@/components/admin-v2/Students';
import { SessionsSection } from '@/components/admin-v2/Sessions';
import { AmbassadorsSection } from '@/components/admin-v2/Ambassadors';
import { CoursesSection } from '@/components/admin-v2/Courses';
import { BundlesSection } from '@/components/admin-v2/Bundles';
import { CardSection } from '@/components/admin-v2/Card';
import { SettingsSection } from '@/components/admin-v2/Settings';
import { StaffSection } from '@/components/admin-v2/Staff';
import { FooterSection } from '@/components/admin-v2/Footer';

/** Admin (Figma page 31). The shell owns navigation; this page renders the active section. */
export default function AdminPage() {
  const { active } = useAdminNav();

  return (
    <div data-testid="admin-command-center">
      {active === 'home' && <HomeSection />}
      {active === 'operations' && <OperationsSection />}
      {active === 'financial' && <FinanceSection />}
      {active === 'staff' && <StaffSection />}
      {active === 'teachers' && <TeachersSection />}
      {active === 'students' && <StudentsSection />}
      {active === 'sessions' && <SessionsSection />}
      {active === 'ambassadors' && <AmbassadorsSection />}
      {active === 'courses' && <CoursesSection />}
      {active === 'bundles' && <BundlesSection />}
      {active === 'card' && <CardSection />}
      {active === 'footer' && <FooterSection />}
      {active === 'settings' && <SettingsSection />}
    </div>
  );
}
