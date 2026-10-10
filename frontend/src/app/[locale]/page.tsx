'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/store';
import { getDashboardPath } from '@/lib/rbac';
import { LandingHero } from '@/components/landing/LandingHero';
import { CourseTopicExplorer } from '@/components/landing/CourseTopicExplorer';
import { CompetitiveAdvantageCallout } from '@/components/landing/CompetitiveAdvantageCallout';
import { BundlesSection } from '@/components/landing/BundlesSection';
import { ThreeStepsSection } from '@/components/landing/ThreeStepsSection';
import { MembershipCardTeaser } from '@/components/landing/MembershipCardTeaser';
import { LandingSections } from '@/components/landing/LandingSections';
import { LandingV2 } from '@/components/landing-v2/LandingV2';
import { useNewDesign } from '@/lib/newDesign';

export default function HomePage() {
  const { locale } = useTranslation();
  const newDesign = useNewDesign();
  const { currentUser, isLoaded } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && currentUser) {
      router.replace(getDashboardPath(currentUser.role, locale));
    }
  }, [isLoaded, currentUser, locale, router]);

  if (isLoaded && currentUser) return null;

  if (newDesign) return <LandingV2 />;

  return (
    <div data-testid="landing-page" className="w-full">
      <LandingHero />
      <div className="py-10 sm:py-14 space-y-14 sm:space-y-20">
        <CourseTopicExplorer />
        <CompetitiveAdvantageCallout />
        <BundlesSection />
        <ThreeStepsSection />
        <MembershipCardTeaser />
      </div>
      <LandingSections />
    </div>
  );
}
