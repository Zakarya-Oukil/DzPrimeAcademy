'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthModal } from '@/lib/authModalContext';
import { copyFor } from './copy';
import { Container, CtaButton, Sheet, TextLink, displayClass } from './ui';
import { ExamBank } from './ExamBank';
import { CourseRatings, CoursesTeachers } from './CoursesTeachers';
import { Pricing } from './Pricing';
import { Faq } from './Faq';
import { AmbassadorsLine, FinalCta, SiteFooter } from './SiteFooter';

export interface LandingExam {
  id: string;
  title: string;
  year: number;
  institutionName?: string | null;
  moduleName?: string | null;
  isLocked: boolean;
  solutionUrl?: string | null;
}
export interface LandingCourse {
  id: string;
  titleAr: string;
  titleFr?: string | null;
  titleEn?: string | null;
  teacherName?: string | null;
  imageUrl?: string | null;
  rating: number | null;
  ratingCount: number;
}
export interface LandingTeacher {
  id: string;
  name: string;
  specialty?: string | null;
  university?: string | null;
  photoUrl?: string | null;
}

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function useLandingData() {
  const [exams, setExams] = useState<LandingExam[]>([]);
  const [courses, setCourses] = useState<LandingCourse[]>([]);
  const [teachers, setTeachers] = useState<LandingTeacher[]>([]);
  const [vipPrice, setVipPrice] = useState<number | null>(null);
  useEffect(() => {
    const get = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    Promise.all([get('/api/exams'), get('/api/courses'), get('/api/teachers/public'), get('/api/settings')]).then(([e, c, t, s]) => {
      setExams(arr<LandingExam>(e?.exams));
      setCourses(arr<LandingCourse>(c));
      setTeachers(arr<LandingTeacher>(t));
      const p = Number(s?.vipPriceDzd);
      setVipPrice(Number.isFinite(p) && p > 0 ? p : null);
    });
  }, []);
  return { exams, courses, teachers, vipPrice };
}

// Outline (percent of hero-student.png) of the parts that step out of the circle: the laptop, the hand that holds it,
// and the typing arm. Traced from the image's skin and laptop pixels so no faint background shows outside the circle.
const HERO_POP_OUT = `polygon(${[
  [74.5, 78.6], [98.9, 75], [99.1, 76.2], [84.2, 91.8], [78.8, 96.2], [78.1, 97.7], [68.4, 98.1], [61, 98.6],
  [39.1, 96.2], [31, 95.2], [24.8, 94.7], [18.4, 93.6], [13.1, 92.4], [12.6, 91.1], [12.1, 90], [11.4, 88.8],
  [10.6, 87.6], [10.3, 86.4], [10, 84.6], [10.1, 82.8], [10.5, 81.3], [19, 81.3], [21.4, 82.8], [21.4, 84.6],
  [21, 86.3], [26, 87.5], [40.3, 88.9], [54.9, 88.4], [64.7, 88.2],
].map(([x, y]) => `${x}% ${y}%`).join(', ')})`;

const heroImg ='absolute -bottom-[2%] -right-[8%] h-auto w-[112%] max-w-none';

const Hero: React.FC = () => {
  const { locale } = useTranslation();
  const c = copyFor(locale).hero;
  const { openAuth } = useAuthModal();
  return (
    <section aria-labelledby="hero-title" className="grid grid-cols-1 items-center gap-8 pt-4 md:grid-cols-[minmax(0,1fr)_clamp(300px,36vw,480px)] md:gap-10 md:pt-6 lg:gap-14">
      <div className="flex flex-col items-start gap-5 md:gap-6">
        <h1 id="hero-title" className="max-w-[18ch] text-balance text-[clamp(2.25rem,5.6vw,4.25rem)] leading-[1.15] tracking-tight">{c.title}</h1>
        <p className="max-w-[44ch] text-[18px] leading-relaxed text-muted">{c.sub}</p>
        <div className="flex flex-wrap items-center gap-3">
          <CtaButton onClick={() => openAuth('register')}>{c.cta}</CtaButton>
          <TextLink href={`/${locale}/dawarat`}>{c.browse}</TextLink>
        </div>
      </div>
      {/* Depth: the portrait is clipped by the circle, then the laptop and the hand that holds it are drawn again on top, unclipped, so they step out of the circle. */}
      <div className="relative mx-auto aspect-square w-[min(420px,78vw)] md:w-full md:max-w-[480px]">
        <div className="absolute inset-0 rounded-full bg-navy-700" />
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <Image src="/images/hero-student.png" alt={c.photoAlt} width={840} height={1050} loading="eager" fetchPriority="high" unoptimized={process.env.NODE_ENV === 'development'} className={heroImg} style={{ height: 'auto' }} />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 [filter:drop-shadow(0_10px_12px_rgba(0,0,0,0.32))]">
          <Image src="/images/hero-student.png" alt="" width={840} height={1050} loading="eager" unoptimized={process.env.NODE_ENV === 'development'} className={heroImg} style={{ height: 'auto', clipPath: HERO_POP_OUT }} />
        </div>
      </div>
    </section>
  );
};

const HowItWorks: React.FC = () => {
  const { locale } = useTranslation();
  const c = copyFor(locale).how;
  const { openAuth } = useAuthModal();
  return (
    <Sheet labelledBy="how-title" className="py-12 md:py-20">
      <Container className="flex flex-col gap-12 md:gap-16">
        <h2 id="how-title" className={`${displayClass} text-[clamp(1.875rem,4vw,2.5rem)] leading-tight`}>{c.title}</h2>

        <ol className="grid grid-cols-1 gap-9 md:grid-cols-3 md:gap-10">
          {c.steps.map((s, i) => (
            <li key={s.t} className="flex gap-4 md:flex-col">
              <div aria-hidden="true" className="flex flex-col items-center md:w-full md:flex-row">
                <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-sheet-text" />
                <span className="w-1 flex-1 rounded-full bg-[color-mix(in_srgb,var(--sheet-text)_25%,transparent)] md:h-1 md:w-auto" />
              </div>
              <div className="flex flex-col items-start gap-3">
                <h3 className={`${displayClass} text-[22px] leading-snug`}>{s.t}</h3>
                <p className="max-w-[40ch] text-[16px] leading-relaxed text-sheet-muted">{s.d}</p>
                {i === 0 && <CtaButton onClick={() => openAuth('register')}>{copyFor(locale).hero.cta}</CtaButton>}
                {i === 1 && (
                  <div className="flex flex-wrap gap-x-5">
                    <TextLink href={`/${locale}/dawarat`}>{c.browseCourses}</TextLink>
                    <TextLink href={`/${locale}/exams`}>{c.browseExams}</TextLink>
                  </div>
                )}
                {i === 2 && (
                  <div className="grid h-[84px] w-[132px] place-items-center rounded-2xl bg-navy-700 text-[13px] text-[#f2f2f0]">
                    <Image src="/images/dzprime-logo-amber.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
                    <span>{c.cardLabel}</span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="flex flex-col justify-end gap-4 rounded-[28px] bg-navy-700 p-7 text-[#f2f2f0] md:rounded-[32px] md:p-10">
            <h3 className={`${displayClass} text-[clamp(1.75rem,3.2vw,2.375rem)] leading-tight`}>{c.coursesTitle}</h3>
            <p className="text-[17px] text-[#b0b0b0]">{c.coursesSub}</p>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[c.live, c.recorded].map((x) => (
                <div key={x.t} className="rounded-[20px] bg-[rgba(242,242,240,0.08)] p-5">
                  <p className="text-[18px] font-semibold">{x.t}</p>
                  <p className="mt-1 text-[15px] text-[#b0b0b0]">{x.d}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-[28px] bg-sheet-card p-7 md:rounded-[32px] md:rounded-br-[8px] md:p-8">
            <h3 className="text-[19px] font-semibold">{c.communityTitle}</h3>
            <p className="text-[16px] text-sheet-muted">{c.communitySub}</p>
            <div className="mt-auto flex flex-col gap-2 pt-2" aria-hidden="true">
              <span className="self-start rounded-[18px] rounded-br-[4px] bg-sheet px-4 py-2.5 text-[15px] font-medium text-sheet-muted">{c.bubbleQ}</span>
              <span className="self-end rounded-[18px] rounded-bl-[4px] bg-sheet-line px-4 py-2.5 text-[15px] font-medium">{c.bubbleA}</span>
            </div>
          </div>
        </div>
      </Container>
    </Sheet>
  );
};

export const LandingV2: React.FC = () => {
  const { exams, courses, teachers, vipPrice } = useLandingData();
  return (
    <div data-testid="landing-page-v2" className="flex w-full flex-col gap-12 md:gap-20">
      <Container>
        <Hero />
      </Container>
      <HowItWorks />
      <ExamBank exams={exams} />
      <CoursesTeachers courses={courses} teachers={teachers} />
      <CourseRatings courses={courses} />
      <Pricing vipPriceDzd={vipPrice} />
      <Faq />
      <AmbassadorsLine />
      <FinalCta />
      <SiteFooter />
    </div>
  );
};
