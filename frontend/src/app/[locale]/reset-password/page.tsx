'use client';

import React, { Suspense, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuthModal } from '@/lib/authModalContext';
import { Btn, TextInput } from '@/components/student-v2/ui';
import { Banner } from '@/components/shared-v2/Dialog';

// Destination of the link in the password-reset email. The server checks the link (one use, 30 minutes) and the
// password policy; this page only collects the new password and says clearly what happened.
type View = 'form' | 'done' | 'invalid';

function ResetContent() {
  const params = useParams();
  const search = useSearchParams();
  const token = search.get('token') || '';
  const locale = (params?.locale as string) || 'ar';
  const ar = locale === 'ar';
  const t = (a: string, f: string) => (ar ? a : f);
  const { openAuth } = useAuthModal();

  const [view, setView] = useState<View>(/^[0-9a-f]{64}$/.test(token) ? 'form' : 'invalid');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8 || /^\d+$/.test(password)) {
      return setError(t('كلمة المرور يجب أن تكون 8 خانات على الأقل ولا تتكون من أرقام فقط.', 'Le mot de passe doit contenir au moins 8 caractères, pas uniquement des chiffres.'));
    }
    if (password !== repeat) return setError(t('كلمتا المرور غير متطابقتين.', 'Les deux mots de passe ne correspondent pas.'));

    setSaving(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return setView('done');
      // A rejected password stays on the form; a dead link is a different screen.
      if (res.status === 400 && /رابط/.test(data.error || '')) return setView('invalid');
      setError(data.error || t('تعذر تغيير كلمة المرور. حاول مرة أخرى.', 'Impossible de changer le mot de passe. Réessayez.'));
    } catch {
      setError(t('تعذر الاتصال بالخادم. تحقق من الاتصال وحاول مرة أخرى.', 'Connexion impossible. Vérifiez votre réseau et réessayez.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-1 items-start justify-center px-4 py-10 sm:py-16" dir={ar ? 'rtl' : 'ltr'}>
      <div className="flex w-full flex-col gap-[18px] rounded-[32px] bg-sheet p-6 text-sheet-text sm:p-10">
        {view === 'form' && (
          <form onSubmit={submit} className="flex flex-col gap-[18px]" data-testid="reset-password-form">
            <h1 className="font-display-h text-[26px] leading-[1.3] sm:text-[32px]">{t('اختر كلمة مرور جديدة', 'Choisissez un nouveau mot de passe')}</h1>
            <p className="text-[15px] text-sheet-muted">{t('استعمل 8 خانات أو أكثر. الأرقام وحدها لا تكفي.', 'Utilisez au moins 8 caractères. Des chiffres seuls ne suffisent pas.')}</p>
            <TextInput id="rp-new" label={t('كلمة المرور الجديدة', 'Nouveau mot de passe')} type={show ? 'text' : 'password'} value={password} onChange={setPassword} autoComplete="new-password" dir="ltr" required />
            <TextInput id="rp-repeat" label={t('أعد كتابتها', 'Répétez-le')} type={show ? 'text' : 'password'} value={repeat} onChange={setRepeat} autoComplete="new-password" dir="ltr" required />
            <div><Btn variant="text" onClick={() => setShow(!show)} aria-pressed={show}>{show ? t('إخفاء', 'Masquer') : t('إظهار', 'Afficher')}</Btn></div>
            {error && <Banner kind="danger">{error}</Banner>}
            <Btn type="submit" full disabled={saving}>{t('حفظ كلمة المرور الجديدة', 'Enregistrer le nouveau mot de passe')}</Btn>
            <p className="text-[13px] text-sheet-muted">{t('هذا الرابط يعمل مرة واحدة وينتهي بعد 30 دقيقة من إرساله.', "Ce lien ne fonctionne qu'une fois et expire 30 minutes après son envoi.")}</p>
          </form>
        )}
        {view === 'done' && (
          <div className="flex flex-col gap-[18px]" data-testid="reset-password-done">
            <h1 className="font-display-h text-[26px] leading-[1.3] sm:text-[32px]">{t('تم تغيير كلمة المرور', 'Mot de passe modifié')}</h1>
            <Banner kind="ok">{t('تم تسجيل خروجك من كل الأجهزة الأخرى. سجّل الدخول بكلمة المرور الجديدة.', 'Vous avez été déconnecté partout ailleurs. Connectez-vous avec votre nouveau mot de passe.')}</Banner>
            <Btn full onClick={() => openAuth('login')}>{t('الذهاب إلى تسجيل الدخول', 'Aller à la connexion')}</Btn>
          </div>
        )}
        {view === 'invalid' && (
          <div className="flex flex-col gap-[18px]" data-testid="reset-password-invalid">
            <h1 className="font-display-h text-[26px] leading-[1.3] sm:text-[32px]">{t('هذا الرابط لم يعد يعمل', 'Ce lien ne fonctionne plus')}</h1>
            <p className="text-[15px] text-sheet-muted">{t('روابط إعادة التعيين تعمل مرة واحدة وتنتهي بعد 30 دقيقة. افتح تسجيل الدخول واختر «نسيت كلمة المرور» لطلب رابط جديد، ثم استعمل أحدث رسالة.', 'Les liens de réinitialisation fonctionnent une seule fois et expirent après 30 minutes. Ouvrez la connexion, choisissez « Mot de passe oublié » pour un nouveau lien, puis utilisez le dernier message.')}</p>
            <Btn full onClick={() => openAuth('login')}>{t('فتح تسجيل الدخول', 'Ouvrir la connexion')}</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetContent />
    </Suspense>
  );
}
