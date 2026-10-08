'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, Sparkles, Mail, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/store';
import { CardActivationChooser } from '@/components/shared/CardActivationChooser';

function ActivationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isAr = locale === 'ar';
  const { setCurrentUser } = useAuthStore();

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'card'>('loading');
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [chooserOpen, setChooserOpen] = useState(true);
  const isActivatingRef = React.useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('card'); // no token: this is the digital-card activation entry point
      return;
    }

    if (isActivatingRef.current) return;
    isActivatingRef.current = true;

    fetch(`/api/auth/activate?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus('success');
          setMessage(data.message || (isAr ? 'تم تفعيل حسابك بنجاح!' : 'Votre compte a été activé avec succès !'));
          if (data.user?.name) setUserName(data.user.name);

          // Confetti celebration
          try {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.5 },
              colors: ['#f2aa34', '#f2aa34', '#38BDF8', '#FFFFFF'],
            });
          } catch (e) {}

          // Refresh current user in auth store
          if (data.user) {
            setCurrentUser(data.user);
          }
        } else {
          setStatus('error');
          setMessage(data.error || (isAr ? 'فشل تفعيل الحساب' : 'Échec de l\'activation'));
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err?.message || (isAr ? 'خطأ في الاتصال بالخادم' : 'Erreur de connexion'));
      });
  }, [token, isAr, setCurrentUser]);


  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 font-arabic">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl bg-[#111114] border border-white/10 p-6 sm:p-8 text-center shadow-2xl space-y-6 relative overflow-hidden"
      >
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />

        {status === 'loading' && (
          <div className="space-y-4 py-8">
            <Loader2 className="w-12 h-12 text-lime-400 animate-spin mx-auto" />
            <h2 className="text-lg font-black text-white">
              {isAr ? 'جارٍ التحقق من رابط التفعيل...' : 'Vérification de l\'activation...'}
            </h2>
            <p className="text-xs text-gray-400">
              {isAr ? 'يرجى الانتظار بضع ثوانٍ بينما نؤكد حسابك' : 'Veuillez patienter quelques instants'}
            </p>
          </div>
        )}

        {status === 'card' && (
          <div className="space-y-4 py-4">
            <h2 className="text-xl font-black text-white">{isAr ? 'تفعيل بطاقتك الرقمية' : 'Activer votre carte numérique'}</h2>
            <p className="text-xs text-gray-300">
              {isAr ? 'تواصل مع فريقنا عبر واتساب أو تيليغرام لتفعيل عضويتك الذهبية.' : "Contactez l'équipe par WhatsApp ou Telegram pour activer votre adhésion Gold."}
            </p>
            <button
              type="button"
              onClick={() => setChooserOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-xs"
            >
              {isAr ? 'فعّل بطاقتك الرقمية' : 'Activer ma carte'}
            </button>
            <CardActivationChooser isOpen={chooserOpen} onClose={() => setChooserOpen(false)} />
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-5">
            <div className="w-20 h-20 rounded-3xl bg-lime-400/20 border border-lime-400/40 flex items-center justify-center mx-auto shadow-lg shadow-lime-400/20">
              <CheckCircle2 className="w-10 h-10 text-lime-400" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-300 text-xs font-bold font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>DZ PRIME 2026 VERIFIED</span>
              </span>

              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isAr ? `أهلاً بك يا ${userName || 'طالبنا المتميز'}! ` : `Félicitations ${userName || 'Étudiant'} ! `}
              </h2>

              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-sm mx-auto">
                {message}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-gray-400 space-y-1.5 text-right">
              <div className="flex items-center gap-2 text-lime-300 font-bold">
                <span>✓</span>
                <span>{isAr ? 'تم تفعيل بطاقة الطالب الرقمية' : 'Carte d\'étudiant digitale activée'}</span>
              </div>
              <div className="flex items-center gap-2 text-lime-300 font-bold">
                <span>✓</span>
                <span>{isAr ? 'الوصول إلى بنك مواضيع الامتحانات الوطنية' : 'Accès aux sujets d\'examens'}</span>
              </div>
              <div className="flex items-center gap-2 text-lime-300 font-bold">
                <span>✓</span>
                <span>{isAr ? 'المشاركة في الحصص والمحاضرات المباشرة' : 'Accès aux sessions masterclass'}</span>
              </div>
            </div>

            <button
              onClick={() => router.push(`/${locale}/student`)}
              className="w-full py-3.5 rounded-2xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 active:scale-95 transition-all"
            >
              <span>{isAr ? 'الانتقال إلى لوحة دراستي' : 'Accéder à mon espace'}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-rose-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">
                {isAr ? 'تعذر إتمام التفعيل' : 'Échec de la validation'}
              </h2>
              <p className="text-xs text-rose-300 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                {message}
              </p>
            </div>

            <p className="text-xs text-gray-400">
              {isAr
                ? 'إذا كان الرابط قديماً أو انتهت صلاحيته، يمكنك تسجيل الدخول أو التواصل مع الدعم عبر واتساب.'
                : 'Si le lien a expiré, vous pouvez vous connecter ou contacter le support.'}
            </p>

            <div className="space-y-2">
              <button
                onClick={() => router.push(`/${locale}?auth=login`)}
                className="w-full py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-xs transition-all shadow-lg shadow-lime-400/20"
              >
                {isAr ? 'تسجيل الدخول إلى حسابي' : 'Se connecter à mon compte'}
              </button>

              <button
                onClick={() => router.push(`/${locale}`)}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
              >
                {isAr ? 'العودة إلى الصفحة الرئيسية' : 'Retour à l\'accueil'}
              </button>

              <a
                href="https://wa.me/qr/5473INCXN3HJI1"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-[#e8eaec]/20 hover:bg-[#e8eaec]/30 border border-[#e8eaec]/40 text-[#e8eaec] font-bold text-xs flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{isAr ? 'مراسلة الدعم عبر واتساب' : 'Contacter le support WhatsApp'}</span>
              </a>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function AccountActivationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
        </div>
      }
    >
      <ActivationContent />
    </Suspense>
  );
}
