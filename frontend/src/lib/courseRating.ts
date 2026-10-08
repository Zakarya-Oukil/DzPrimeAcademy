import { prisma } from '@/lib/db';

// A rating is only shown once this many students have rated, so one 5-star vote never reads as "5.0".
export const MIN_REVIEWS_TO_SHOW = 3;

export const roundRating = (avg: number | null) => (avg == null ? 0 : Math.round(avg * 10) / 10);

// Adds { rating, ratingCount } to each course. rating is the average of real student reviews, or null while there
// are fewer than MIN_REVIEWS_TO_SHOW of them.
export async function withRatings<T extends { id: string }>(courses: T[]) {
  const rows = courses.length
    ? await prisma.courseReview.groupBy({
        by: ['courseId'],
        where: { courseId: { in: courses.map((c) => c.id) } },
        _avg: { stars: true },
        _count: { _all: true },
      })
    : [];
  const byCourse = new Map(rows.map((r) => [r.courseId, r]));
  return courses.map((c) => {
    const r = byCourse.get(c.id);
    const ratingCount = r?._count._all ?? 0;
    return { ...c, ratingCount, rating: ratingCount >= MIN_REVIEWS_TO_SHOW ? roundRating(r?._avg.stars ?? null) : null };
  });
}
