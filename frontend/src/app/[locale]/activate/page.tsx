'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { AuthLoadingSpinner } from '@/components/layout/AuthGate';
import confetti from 'canvas-confetti';
import { useAuthStore } from '@/lib/store';
import { CardActivationChooser } from '@/components/shared/CardActivationChooser';
import { Btn } from '@/components/student-v2/ui';
import { Banner } from '@/components/shared-v2/Dialog';

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
    <div className="mx-auto flex w-full max-w-[560px] flex-1 items-start justify-center px-4 py-10 sm:py-16" dir={isAr ? 'rtl' : 'ltr'} data-testid="activate-v2">
      <div className="flex w-full flex-col gap-[18px] rounded-[32px] bg-sheet p-6 text-sheet-text sm:p-10">
        {status === 'loading' && (
          <>
            <h1 className="font-display-h text-[26px] leading-[1.3] sm:text-[32px]">{isAr ? 'جارٍ التحقق من رابط التفعيل...' : "Vérification de l'activation..."}</h1>
            <p className="text-[15px] text-sheet-muted" role="status">{isAr ? 'يرجى الانتظار بضع ثوانٍ بينما نؤكد حسابك' : 'Veuillez patienter quelques instants'}</p>
          </>
        )}
        {status === 'card' && (
          <>
            <h1 className="font-display-h text-[26px] leading-[1.3] sm:text-[32px]">{isAr ? 'تفعيل بطاقتك الرقمية' : 'Activer votre carte numérique'}</h1>
            <p className="text-[15px] text-sheet-muted">{isAr ? 'تواصل مع فريقنا عبر واتساب أو تيليغرام لتفعيل عضويتك الذهبية.' : "Contactez l'équipe par WhatsApp ou Telegram pour activer votre adhésion Gold."}</p>
            <Btn full onClick={() => setChooserOpen(true)}>{isAr ? 'فعّل بطاقتك الرقمية' : 'Activer ma carte'}</Btn>
            <CardActivationChooser isOpen={chooserOpen} onClose={() => setChooserOpen(false)} />
          </>
        )}
        {status === 'success' && (
          <>
            <h1 className="font-display-h text-[26px] leading-[1.3] sm:text-[32px]">{isAr ? `أهلاً بك يا ${userName || 'طالبنا المتميز'}` : `Félicitations ${userName || 'Étudiant'}`}</h1>
            <Banner kind="ok">{message}</Banner>
            <ul className="flex flex-col gap-2.5 rounded-[20px] bg-sheet-card p-[18px] text-[15px]">
              {[isAr ? 'تم تفعيل بطاقة الطالب الرقمية' : "Carte d'étudiant digitale activée", isAr ? 'الوصول إلى بنك مواضيع الامتحانات الوطنية' : "Accès aux sujets d'examens", isAr ? 'المشاركة في الحصص والمحاضرات المباشرة' : 'Accès aux sessions masterclass'].map((x) => (
                <li key={x} className="flex items-start gap-3"><span aria-hidden="true" className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold-500/20 text-[13px] font-semibold">✓</span><span>{x}</span></li>
              ))}
            </ul>
            <Btn full onClick={() => router.push(`/${locale}/student`)}>{isAr ? 'الانتقال إلى لوحة دراستي' : 'Accéder à mon espace'}</Btn>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="font-display-h text-[26px] leading-[1.3] sm:text-[32px]">{isAr ? 'تعذر إتمام التفعيل' : 'Échec de la validation'}</h1>
            <Banner kind="danger">{message}</Banner>
            <p className="text-[15px] text-sheet-muted">{isAr ? 'إذا كان الرابط قديماً أو انتهت صلاحيته، يمكنك تسجيل الدخول أو التواصل مع الدعم عبر واتساب.' : 'Si le lien a expiré, vous pouvez vous connecter ou contacter le support.'}</p>
            <Btn full onClick={() => router.push(`/${locale}?auth=login`)}>{isAr ? 'تسجيل الدخول إلى حسابي' : 'Se connecter à mon compte'}</Btn>
            <Btn full variant="secondary" onClick={() => router.push(`/${locale}`)}>{isAr ? 'العودة إلى الصفحة الرئيسية' : "Retour à l'accueil"}</Btn>
            <Btn full variant="text" href="https://wa.me/qr/5473INCXN3HJI1">{isAr ? 'مراسلة الدعم عبر واتساب' : 'Contacter le support WhatsApp'}</Btn>
          </>
        )}
      </div>
    </div>
  );
}

export default function AccountActivationPage() {
  return (
    <Suspense fallback={<AuthLoadingSpinner />}>
      <ActivationContent />
    </Suspense>
  );
}
