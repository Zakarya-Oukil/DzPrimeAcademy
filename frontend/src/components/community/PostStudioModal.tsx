'use client';

import React, { useState } from 'react';
import { ImageListField } from '@/components/shared/ImageListField';
import { VideoField } from '@/components/shared/VideoField';
import {
  Video,
  Image as ImageIcon,
  Link as LinkIcon,
  Lock,
  Globe,
  Send,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Post, PostType } from '@/types';

interface PostStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: Post) => void;
  locale?: string;
  defaultType?: PostType;
}

export const PostStudioModal: React.FC<PostStudioModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
  locale = 'ar',
  defaultType = 'STUDY_TIP',
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<PostType>(defaultType);
  const [videoUrl, setVideoUrl] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMessage(locale === 'ar' ? 'يرجى إدخال العنوان والمحتوى' : 'Veuillez remplir le titre et le contenu');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          type,
          videoUrl: videoUrl.trim() || undefined,
          imageUrls,
          linkUrl: linkUrl.trim() || undefined,
          isPrivate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'حدث خطأ أثناء نشر المحتوى');
      } else {
        setSuccessMessage(locale === 'ar' ? 'تم نشر المقال/الفيديو بنجاح ✓' : 'Publication partagée avec succès ✓');
        if (onPostCreated && data.post) {
          onPostCreated(data.post);
        }
        setTimeout(() => {
          onClose();
          setTitle('');
          setContent('');
          setVideoUrl('');
          setImageUrls([]);
          setLinkUrl('');
          setIsPrivate(false);
          setSuccessMessage('');
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'خطأ في الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md font-arabic">
      <div className="dark relative w-full max-w-2xl rounded-3xl border border-gold-500/40 bg-[#0b0b0d] p-5 sm:p-7 text-white shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gold-500 text-navy-950 flex items-center justify-center font-black shadow-gold-glow">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {locale === 'ar' ? 'ستوديو النشر الأكاديمي — مقالات وفيديوهات' : 'Studio de Publication & Vidéos'}
              </h3>
              <p className="text-[11px] text-gray-400">
                {locale === 'ar'
                  ? 'شارك الدروس المصورة، مقاطع يوتيوب، نصائح الامتحانات والأحداث مع الطلبة'
                  : 'Partagez des cours vidéos YouTube, conseils examens et événements'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Post Title */}
          <div>
            <label className="block text-gray-300 font-bold mb-1.5">
              {locale === 'ar' ? 'عنوان المنشور / الفيديو *' : 'Titre de la publication / vidéo *'}
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={locale === 'ar' ? 'مثال: ملخص ميكانيك نيوتن وأفكار البكالوريا النموذجية' : 'Ex: Résumé mécanique et exercices types BAC'}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs sm:text-sm focus:outline-none focus:border-gold-400 placeholder:text-gray-500"
            />
          </div>

          {/* Type Selector */}
          <div>
            <label className="block text-gray-300 font-bold mb-1.5">
              {locale === 'ar' ? 'تصنيف المنشور' : 'Type de contenu'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'STUDY_TIP', ar: 'نصائح ومراجعة', fr: 'Conseil & Astuce' },
                { id: 'EVENT', ar: 'فعالية / ورشة', fr: 'Événement' },
                { id: 'SESSION_SCHEDULE', ar: 'جدول حصة مباشرة', fr: 'Live Session' },
                { id: 'ANNOUNCEMENT', ar: 'إعلان رسمي', fr: 'Annonce' },
              ].map((tItem) => (
                <button
                  type="button"
                  key={tItem.id}
                  onClick={() => setType(tItem.id as PostType)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    type === tItem.id
                      ? 'bg-gold-500 text-navy-950 border-gold-400 shadow-sm'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/20'
                  }`}
                >
                  {locale === 'ar' ? tItem.ar : tItem.fr}
                </button>
              ))}
            </div>
          </div>

          {/* Text Content */}
          <div>
            <label className="block text-gray-300 font-bold mb-1.5">
              {locale === 'ar' ? 'نص الشرح والتفاصيل *' : 'Description et contenu *'}
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={locale === 'ar' ? 'اكتب الشرح، النقاط الرئيسية، أو توجيهات المشاهدة للطلبة...' : 'Écrivez vos explications détaillées ici...'}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-gold-400 placeholder:text-gray-500 leading-relaxed resize-y"
            />
          </div>

          {/* Video: YouTube / Vimeo link or an uploaded MP4 / WebM */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
            <VideoField kind="post" locale={locale} value={videoUrl || null} onChange={(url) => setVideoUrl(url || '')} label={locale === 'ar' ? 'فيديو (اختياري)' : 'Vidéo (optionnel)'} />
          </div>

          {/* Images & External Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-bold mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                <span>{locale === 'ar' ? 'صور توضيحية (حتى 4)' : 'Images (jusqu’à 4)'}</span>
              </label>
              <ImageListField locale={locale} value={imageUrls} onChange={setImageUrls} />
            </div>

            <div>
              <label className="block text-gray-300 font-bold mb-1.5 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>{locale === 'ar' ? 'رابط مرفق / ملف خارجي' : 'Lien externe / Document'}</span>
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://drive.google.com/... أو https://..."
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-gold-400"
              />
            </div>
          </div>

          {/* Privacy Switch (Public vs Private to signed-in students) */}
          <div className="p-4 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {isPrivate ? (
                  <Lock className="w-4 h-4 text-amber-400" />
                ) : (
                  <Globe className="w-4 h-4 text-emerald-400" />
                )}
                <span className="font-extrabold text-sm text-white">
                  {isPrivate
                    ? (locale === 'ar' ? 'محتوى خاص بالأعضاء والطلبة المسجلين' : 'Contenu Privé (Membres uniquement)')
                    : (locale === 'ar' ? 'محتوى عام ومفتوح لجميع الزوار' : 'Contenu Public (Accessible à tous)')}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                {isPrivate
                  ? (locale === 'ar' ? 'يظهر هذا الفيديو أو المقال للطلبة والأعضاء المسجلين فقط عند تسجيل الدخول.' : 'Réservé aux étudiants connectés de la plateforme.')
                  : (locale === 'ar' ? 'يظهر للجميع على الصفحة الرئيسية وفي مجتمع الأكاديمية دون شروط.' : 'Visible par tous les visiteurs et étudiants.')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isPrivate ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-navy-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isPrivate ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs transition-colors"
            >
              {locale === 'ar' ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-black text-xs flex items-center gap-2 shadow-gold-glow active:scale-95 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? (locale === 'ar' ? 'جاري النشر...' : 'Publication...') : (locale === 'ar' ? 'نشر المحتوى الآن' : 'Publier')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostStudioModal;
