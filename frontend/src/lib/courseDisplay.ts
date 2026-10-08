// Display helpers so bad catalog data (one-letter titles, ratings like 99.0, raw enums) never reaches users.
const TRACKS: Record<string, { ar: string; fr: string }> = {
  BAC: { ar: 'البكالوريا', fr: 'BAC' },
  UNIVERSITY_LMD: { ar: 'جامعي (LMD)', fr: 'Université (LMD)' },
  MEDICAL: { ar: 'علوم طبية', fr: 'Médecine' },
};

export const trackLabel = (category: string, locale: string) => (TRACKS[category] ? (locale === 'ar' ? TRACKS[category].ar : TRACKS[category].fr) : '');

/** A course is shown publicly only if it has a real title (3+ letters, not just digits and dashes). */
export const isShowableCourse = (c: { titleAr?: string | null; titleFr?: string | null }) =>
  [c.titleAr, c.titleFr].some((t) => (t ?? '').replace(/[^\p{L}]/gu, '').length >= 3);

/** Rating to display, or null when it is not a valid 0-5 value. */
export const validRating = (r: unknown) => (typeof r === 'number' && r > 0 && r <= 5 ? r.toFixed(1) : null);
