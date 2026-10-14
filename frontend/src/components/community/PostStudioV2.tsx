'use client';

import React, { useEffect, useState } from 'react';
import type { Post, PostType } from '@/types';
import { Btn, Field, TextInput, Toggle, fieldClass, useTx } from '@/components/student-v2/ui';
import { Banner, ChipGroup, Dialog } from '@/components/shared-v2/Dialog';
import { ImageField, VideoUrlField } from '@/components/teacher-v2/MediaFields';

/** Post publishing studio in 3 steps (Figma page 30): content, media, visibility and publish. Same API as before: POST /api/posts. */
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: Post) => void;
  defaultType?: PostType;
}

const EMPTY = { title: '', content: '', type: 'STUDY_TIP' as PostType, videoUrl: '', imageUrls: [] as string[], linkUrl: '', isPrivate: false };

export const PostStudioV2: React.FC<Props> = ({ isOpen, onClose, onPostCreated, defaultType = 'STUDY_TIP' }) => {
  const { tx } = useTx();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [f, setF] = useState({ ...EMPTY, type: defaultType });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => { if (isOpen) { setStep(1); setF({ ...EMPTY, type: defaultType }); setError(''); setDone(false); } }, [isOpen, defaultType]);
  if (!isOpen) return null;

  const types: { id: PostType; label: string }[] = [
    { id: 'STUDY_TIP', label: tx('نصائح ومراجعة', 'Conseil et astuce', 'Study tip') },
    { id: 'EVENT', label: tx('فعالية / ورشة', 'Événement', 'Event') },
    { id: 'SESSION_SCHEDULE', label: tx('جدول حصة مباشرة', 'Session en direct', 'Live session') },
    { id: 'ANNOUNCEMENT', label: tx('إعلان رسمي', 'Annonce', 'Announcement') },
  ];
  const stepLabels = [tx('المحتوى', 'Contenu', 'Content'), tx('الوسائط', 'Médias', 'Media'), tx('الخصوصية والنشر', 'Visibilité et publication', 'Visibility and publish')];

  const next = () => {
    if (step === 1 && (!f.title.trim() || !f.content.trim())) { setError(tx('يرجى إدخال العنوان والمحتوى', 'Veuillez remplir le titre et le contenu', 'Please fill in the title and the content')); return; }
    setError(''); setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  };
  const back = () => { setError(''); setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s)); };

  const publish = async () => {
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ title: f.title, content: f.content, type: f.type, videoUrl: f.videoUrl.trim() || undefined, imageUrls: f.imageUrls, linkUrl: f.linkUrl.trim() || undefined, isPrivate: f.isPrivate }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || tx('حدث خطأ أثناء نشر المحتوى', 'Erreur lors de la publication', 'Something went wrong while publishing')); return; }
      setDone(true);
      if (onPostCreated && data.post) onPostCreated(data.post);
      setTimeout(onClose, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : tx('خطأ في الاتصال بالخادم', 'Erreur de connexion', 'Connection error'));
    } finally { setBusy(false); }
  };

  const slots = f.imageUrls.length < 4 ? [...f.imageUrls, null] : f.imageUrls;
  const setImage = (i: number, u: string | null) => setF((p) => { const a = [...p.imageUrls]; if (u) a[i] = u; else a.splice(i, 1); return { ...p, imageUrls: a }; });

  return (
    <Dialog open onClose={onClose} size="lg" title={tx('ستوديو النشر', 'Studio de publication', 'Publishing studio')} sub={tx('شارك الدروس المصورة ومقاطع الفيديو ونصائح الامتحانات والأحداث مع الطلبة.', 'Partagez cours, vidéos, conseils et événements avec les étudiants.', 'Share lessons, videos, exam tips and events with students.')} testId="post-studio-v2" closeTestId="post-studio-close">
      <div>
        <p className="text-[14px] font-medium text-sheet-muted" data-testid="post-studio-step">{tx(`الخطوة ${step} من 3`, `Étape ${step} sur 3`, `Step ${step} of 3`)} · {stepLabels[step - 1]}</p>
        <div className="mt-2 flex gap-2" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step} aria-label={tx('تقدم النشر', 'Progression', 'Publishing progress')}>
          {[1, 2, 3].map((n) => <span key={n} className={`h-1 flex-1 rounded-full ${n <= step ? 'bg-gold-500' : 'bg-sheet-line'}`} />)}
        </div>
      </div>

      {error ? <Banner kind="danger" testId="post-studio-error">{error}</Banner> : null}
      {done ? <Banner kind="ok" testId="post-studio-done">{tx('تم نشر المقال/الفيديو بنجاح', 'Publication partagée avec succès', 'Published successfully')}</Banner> : null}

      {step === 1 ? (
        <div className="flex flex-col gap-4">
          <TextInput id="ps-title" label={tx('عنوان المنشور / الفيديو *', 'Titre de la publication ou vidéo *', 'Post or video title *')} value={f.title} onChange={(v) => setF((p) => ({ ...p, title: v }))} placeholder={tx('مثال: ملخص ميكانيك نيوتن وأفكار البكالوريا النموذجية', 'Ex : résumé de mécanique et exercices types BAC', 'e.g. Newton mechanics summary and typical BAC exercises')} />
          <Field label={tx('تصنيف المنشور', 'Type de contenu', 'Content type')} htmlFor="ps-type">
            <ChipGroup label={tx('تصنيف المنشور', 'Type de contenu', 'Content type')} items={types} value={f.type} onChange={(id) => setF((p) => ({ ...p, type: id as PostType }))} />
          </Field>
          <Field label={tx('نص الشرح والتفاصيل *', 'Description et contenu *', 'Description and details *')} htmlFor="ps-content">
            <textarea id="ps-content" rows={5} value={f.content} onChange={(e) => setF((p) => ({ ...p, content: e.target.value }))} placeholder={tx('اكتب الشرح، النقاط الرئيسية، أو توجيهات المشاهدة للطلبة...', 'Écrivez vos explications, points clés ou consignes…', 'Write the explanation, key points or viewing tips…')} className={`${fieldClass} py-3`} />
          </Field>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-5">
          <VideoUrlField id="ps-video" kind="post" label={tx('فيديو (اختياري)', 'Vidéo (facultatif)', 'Video (optional)')} value={f.videoUrl || null} onChange={(u) => setF((p) => ({ ...p, videoUrl: u || '' }))} />
          <div className="flex flex-col gap-3">
            <p className="text-[14px] font-semibold">{tx('صور توضيحية (حتى 4)', "Images (jusqu'à 4)", 'Images (up to 4)')}</p>
            {slots.map((u, i) => <ImageField key={u ?? `new-${i}`} id={`ps-img-${i}`} kind="post" label={u ? `${tx('صورة', 'Image', 'Image')} ${i + 1}` : tx('أضف صورة', 'Ajouter une image', 'Add an image')} value={u} onChange={(nu) => setImage(i, nu)} />)}
          </div>
          <TextInput id="ps-link" label={tx('رابط مرفق / ملف خارجي', 'Lien externe ou document', 'Attached link or external file')} value={f.linkUrl} onChange={(v) => setF((p) => ({ ...p, linkUrl: v }))} placeholder="https://..." dir="ltr" />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-col gap-4">
          <p className="text-[15px] text-sheet-muted">{tx('راجع منشورك، ثم اختر من يراه.', 'Relisez votre publication puis choisissez qui la voit.', 'Review your post, then choose who sees it.')}</p>
          <dl className="flex flex-col gap-2.5 rounded-[16px] border border-sheet-line p-4 text-[14px]" data-testid="post-studio-summary">
            {[
              [tx('العنوان', 'Titre', 'Title'), f.title],
              [tx('التصنيف', 'Type', 'Type'), types.find((t) => t.id === f.type)?.label || ''],
              [tx('الوسائط', 'Médias', 'Media'), [f.videoUrl ? tx('فيديو واحد', '1 vidéo', '1 video') : '', f.imageUrls.length ? `${f.imageUrls.length} ${tx('صور', 'images', 'images')}` : '', f.linkUrl ? tx('رابط', 'lien', 'link') : ''].filter(Boolean).join(' · ') || tx('بدون وسائط', 'Aucun média', 'No media')],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4"><dt className="text-sheet-muted">{k}</dt><dd className="min-w-0 truncate font-medium">{v}</dd></div>
            ))}
          </dl>
          <div className="flex items-center gap-4 rounded-[16px] bg-sheet-card p-4">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">{f.isPrivate ? tx('محتوى خاص بالأعضاء والطلبة المسجلين', 'Contenu privé (membres uniquement)', 'Private content (members only)') : tx('محتوى عام ومفتوح لجميع الزوار', 'Contenu public (accessible à tous)', 'Public content (open to everyone)')}</p>
              <p className="text-[13px] text-sheet-muted">{f.isPrivate ? tx('يظهر هذا الفيديو أو المقال للطلبة والأعضاء المسجلين فقط عند تسجيل الدخول.', 'Réservé aux étudiants connectés de la plateforme.', 'Only signed-in students and members see it.') : tx('يظهر للجميع على الصفحة الرئيسية وفي مجتمع الأكاديمية. فعّل الزر ليصبح خاصاً بالأعضاء.', "Visible par tous les visiteurs et étudiants. Activez pour le réserver aux membres.", 'Visible to everyone. Turn on to keep it for members only.')}</p>
            </div>
            <Toggle on={f.isPrivate} onChange={(v) => setF((p) => ({ ...p, isPrivate: v }))} label={tx('خاص بالأعضاء', 'Réservé aux membres', 'Members only')} />
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {step < 3 ? <Btn onClick={next} data-testid="post-studio-next">{tx('التالي', 'Suivant', 'Next')}</Btn> : <Btn onClick={publish} disabled={busy || done} data-testid="post-studio-publish">{busy ? tx('جارٍ النشر…', 'Publication…', 'Publishing…') : tx('نشر المحتوى الآن', 'Publier maintenant', 'Publish now')}</Btn>}
        {step > 1 ? <Btn variant="secondary" onClick={back}>{tx('السابق', 'Précédent', 'Back')}</Btn> : <Btn variant="text" onClick={onClose}>{tx('إلغاء', 'Annuler', 'Cancel')}</Btn>}
      </div>
    </Dialog>
  );
};
