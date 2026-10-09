'use client';

import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { ImageUploader } from '@/components/shared/ImageUploader';

interface TeacherLandingModalProps {
  locale: string;
  teacher: { id: string; showOnLanding?: boolean; landingOrder?: number; publicBio?: string | null; photoUrl?: string | null; user?: { name?: string } };
  onClose: () => void;
  onSaved: () => void;
}

// Admin-only card for the landing page: switch, order, public bio and photo. Nothing here is shown publicly
// unless the switch is on, and the public API returns only these fields plus the name and subject.
export const TeacherLandingModal: React.FC<TeacherLandingModalProps> = ({ locale, teacher, onClose, onSaved }) => {
  const ar = locale === 'ar';
  const t = (a: string, f: string) => (ar ? a : f);
  const [show, setShow] = useState(Boolean(teacher.showOnLanding));
  const [order, setOrder] = useState(teacher.landingOrder ?? 0);
  const [bio, setBio] = useState(teacher.publicBio ?? '');
  const [photo, setPhoto] = useState<string | null>(teacher.photoUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/teachers/${teacher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showOnLanding: show, landingOrder: Math.max(0, Math.min(999, Math.round(order) || 0)), publicBio: bio, photoUrl: photo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t('تعذر الحفظ', "Échec de l'enregistrement"));
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError(t('خطأ في الاتصال بالسيرفر', 'Erreur de connexion'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 overflow-y-auto" role="dialog" aria-modal="true" aria-label={t('بطاقة الأستاذ في الصفحة الرئيسية', "Carte de l'enseignant sur l'accueil")}>
      <form onSubmit={save} data-testid="teacher-landing-form" className="dark w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#111114] p-5 text-white space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h4 className="text-sm font-black">{t('ظهور الأستاذ في الصفحة الرئيسية', "Apparition sur la page d'accueil")}</h4>
            <p className="text-gray-400 mt-0.5">{teacher.user?.name}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('إغلاق', 'Fermer')} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && <div role="alert" className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">{error}</div>}

        <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
          <span className="font-semibold text-gray-200">{t('إظهار هذا الأستاذ للزوار', 'Afficher cet enseignant aux visiteurs')}</span>
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="w-5 h-5 accent-amber-400" data-testid="teacher-landing-show" />
        </label>

        <ImageUploader kind="teacher" locale={locale} label={t('الصورة العامة', 'Photo publique')} value={photo} onChange={setPhoto} />

        <div>
          <label htmlFor="teacher-public-bio" className="block text-gray-300 mb-1 font-semibold">{t('نبذة عامة (400 حرف كحد أقصى)', 'Présentation publique (400 car. max)')}</label>
          <textarea id="teacher-public-bio" value={bio} maxLength={400} rows={4} onChange={(e) => setBio(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400" />
          <p className="text-gray-500 mt-1">{bio.length}/400</p>
        </div>

        <div>
          <label htmlFor="teacher-landing-order" className="block text-gray-300 mb-1 font-semibold">{t('الترتيب (الأصغر أولاً)', "Ordre d'affichage (le plus petit d'abord)")}</label>
          <input id="teacher-landing-order" type="number" min={0} max={999} value={order} onChange={(e) => setOrder(Number(e.target.value))} className="w-28 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400" />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold">{t('إلغاء', 'Annuler')}</button>
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black flex items-center gap-2 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{t('حفظ', 'Enregistrer')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
