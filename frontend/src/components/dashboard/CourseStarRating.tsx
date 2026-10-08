'use client';

import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

// A student's own 1-5 star vote on a course they are enrolled in. The server enforces enrolment and one vote
// per student; this only shows and sends it.
export const CourseStarRating: React.FC<{ courseId: string; locale: string }> = ({ courseId, locale }) => {
  const ar = locale === 'ar';
  const [mine, setMine] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    fetch(`/api/courses/${courseId}/reviews`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && d && setMine(d.mine))
      .catch(() => {});
    return () => { live = false; };
  }, [courseId]);

  const rate = async (stars: number) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/courses/${courseId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stars }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return setError(d.error || (ar ? 'تعذر حفظ التقييم' : 'Échec de l’enregistrement'));
      setMine(d.mine);
    } catch {
      setError(ar ? 'تعذر الاتصال بالخادم' : 'Erreur de connexion');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-1" data-testid={`course-rating-${courseId}`}>
      <div role="group" aria-label={ar ? 'قيّم هذا المقرر' : 'Noter ce cours'} className="flex items-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={busy}
            onClick={() => rate(n)}
            aria-label={ar ? `${n} من 5` : `${n} sur 5`}
            aria-pressed={mine === n}
            className="w-11 h-11 flex items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-gold-400 disabled:opacity-50"
          >
            <Star className={`w-4 h-4 ${mine && n <= mine ? 'fill-amber-500 text-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
          </button>
        ))}
        <span className="ms-1 text-[10px] text-slate-400">{mine ? (ar ? 'تقييمك' : 'Votre note') : ar ? 'قيّم المقرر' : 'Notez le cours'}</span>
      </div>
      {error && <p role="alert" className="text-[10px] text-rose-500">{error}</p>}
    </div>
  );
};
