'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { copyFor } from './copy';
import { Container, Sheet, SrOnly, Stars, TextLink, displayClass } from './ui';
import type { LandingCourse, LandingTeacher } from './LandingV2';

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current';

const titleOf = (c: LandingCourse, locale: string) =>
  locale === 'fr' ? c.titleFr || c.titleAr : locale === 'en' ? c.titleEn || c.titleFr || c.titleAr : c.titleAr;

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('');

/** Newest courses and the teachers an admin switched on. Each block hides when it has no real data. */
export const CoursesTeachers: React.FC<{ courses: LandingCourse[]; teachers: LandingTeacher[] }> = ({ courses, teachers }) => {
  const { locale } = useTranslation();
  const c = copyFor(locale).courses;
  const shown = courses.slice(0, 3);
  const people = teachers.slice(0, 6);
  if (shown.length === 0 && people.length === 0) return null;

  return (
    <Sheet labelledBy={shown.length ? 'courses-title' : 'teachers-title'} className="py-12 md:py-20">
      <Container className="flex flex-col gap-14 md:gap-20">
        {shown.length > 0 && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="courses-title" className={`${displayClass} text-[clamp(1.875rem,4vw,2.5rem)] leading-tight`}>{c.title}</h2>
              <TextLink href={`/${locale}/dawarat`}>{c.seeAll}</TextLink>
            </div>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((course) => (
                <li key={course.id}>
                  <Link href={`/${locale}/dawarat`} className={`group flex h-full flex-col gap-4 rounded-[24px] bg-sheet-card p-4 transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${focus}`}>
                    <span className="block aspect-[16/10] overflow-hidden rounded-2xl bg-navy-700">
                      {course.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={course.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      )}
                    </span>
                    <span className="flex flex-col gap-1.5 px-1 pb-1">
                      <span className="text-[18px] font-semibold leading-snug">{titleOf(course, locale)}</span>
                      {course.teacherName && <span className="text-[14px] text-sheet-muted">{c.by} {course.teacherName}</span>}
                      {course.rating != null && (
                        <span className="inline-flex items-center gap-2 text-[14px]">
                          <Stars value={course.rating} size={15} />
                          <span>{course.rating.toLocaleString(locale === 'ar' ? 'ar-DZ' : locale)}</span>
                          <span className="text-sheet-muted">({course.ratingCount})</span>
                          <SrOnly>{c.rated}</SrOnly>
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {people.length > 0 && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h2 id="teachers-title" className={`${displayClass} text-[clamp(1.875rem,4vw,2.5rem)] leading-tight`}>{c.teachersTitle}</h2>
              <p className="max-w-[52ch] text-[17px] text-sheet-muted">{c.teachersLead}</p>
            </div>
            <ul className="flex flex-wrap gap-x-8 gap-y-8">
              {people.map((t) => (
                <li key={t.id} className="flex w-[120px] flex-col items-center gap-3 text-center">
                  <span className="grid h-[104px] w-[104px] place-items-center overflow-hidden rounded-full bg-sheet-card text-[26px] font-semibold text-sheet-muted">
                    {t.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.photoUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    ) : (
                      initials(t.name)
                    )}
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[16px] font-semibold leading-snug">{t.name}</span>
                    {(t.specialty || t.university) && <span className="text-[13px] leading-snug text-sheet-muted">{t.specialty || t.university}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </Sheet>
  );
};

/** Real course ratings only: a course shows up once it has enough student ratings (the API already applies the minimum). */
export const CourseRatings: React.FC<{ courses: LandingCourse[] }> = ({ courses }) => {
  const { locale } = useTranslation();
  const c = copyFor(locale).ratings;
  const rated = courses.filter((x) => x.rating != null && x.ratingCount > 0).sort((a, b) => (b.rating! - a.rating!) || (b.ratingCount - a.ratingCount));
  if (rated.length === 0) return null;
  const total = rated.reduce((n, x) => n + x.ratingCount, 0);
  const average = Math.round((rated.reduce((n, x) => n + x.rating! * x.ratingCount, 0) / total) * 10) / 10;
  const fmt = (n: number) => n.toLocaleString(locale === 'ar' ? 'ar-DZ' : locale);

  return (
    <section aria-labelledby="ratings-title">
      <Container>
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          <div className="flex flex-col gap-8 rounded-[28px] bg-navy-700 p-8 text-[#f2f2f0] md:rounded-[32px] md:p-12">
            <h2 id="ratings-title" className={`${displayClass} text-[clamp(1.875rem,4vw,2.5rem)] leading-tight`}>{c.title}</h2>
            <div className="flex flex-col gap-2">
              <p className="text-[56px] font-semibold leading-none">{fmt(average)}<span className="ms-2 text-[20px] font-medium text-[#b0b0b0]">{c.outOf}</span></p>
              <Stars value={average} size={22} />
              <p className="text-[15px] text-[#b0b0b0]">{c.average} {c.basedOn.replace('{n}', fmt(total))}</p>
            </div>
          </div>
          <ul className="flex flex-col gap-7">
            {rated.slice(0, 3).map((x) => (
              <li key={x.id} className="flex flex-col gap-2">
                <p className="text-[18px] font-semibold">{titleOf(x, locale)}</p>
                {x.teacherName && <p className="text-[14px] text-muted">{x.teacherName}</p>}
                <p className="inline-flex items-center gap-2 text-[15px]">
                  <Stars value={x.rating!} size={16} />
                  <span>{fmt(x.rating!)}</span>
                  <span className="text-muted">({fmt(x.ratingCount)})</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
};
