'use client';

import React, { Suspense, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthModal } from '@/lib/authModalContext';

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

  const card = 'w-full max-w-[424px] rounded-3xl bg-[#0B1021] border border-white/10 p-8 space-y-4 shadow-2xl';
  const primary = 'w-full min-h-11 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400';
  const input = 'w-full min-h-11 rounded-xl bg-white/5 border border-white/20 px-3.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-gold-400';

  return (
    <main className="min-h-screen bg-[#05070D] text-white flex items-center justify-center p-4 font-arabic" dir={ar ? 'rtl' : 'ltr'}>
      {view === 'form' && (
        <form onSubmit={submit} className={card} data-testid="reset-password-form">
          <h1 className="text-xl font-black">{t('اختر كلمة مرور جديدة', 'Choisissez un nouveau mot de passe')}</h1>
          <p className="text-sm text-slate-400">{t('استعمل 8 خانات أو أكثر. الأرقام وحدها لا تكفي.', 'Utilisez au moins 8 caractères. Des chiffres seuls ne suffisent pas.')}</p>

          <div className="space-y-1.5">
            <label htmlFor="rp-new" className="block text-xs font-bold text-slate-400">{t('كلمة المرور الجديدة', 'Nouveau mot de passe')}</label>
            <div className="relative">
              <input id="rp-new" type={show ? 'text' : 'password'} autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? t('إخفاء', 'Masquer') : t('إظهار', 'Afficher')} className="absolute top-0 bottom-0 end-1 min-w-11 flex items-center justify-center text-gold-400">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="rp-repeat" className="block text-xs font-bold text-slate-400">{t('أعد كتابتها', 'Répétez-le')}</label>
            <input id="rp-repeat" type={show ? 'text' : 'password'} autoComplete="new-password" required value={repeat} onChange={(e) => setRepeat(e.target.value)} className={input} />
          </div>

          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}

          <button type="submit" disabled={saving} className={primary}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {t('حفظ كلمة المرور الجديدة', 'Enregistrer le nouveau mot de passe')}
          </button>
          <p className="text-xs text-slate-400">{t('هذا الرابط يعمل مرة واحدة وينتهي بعد 30 دقيقة من إرساله.', 'Ce lien ne fonctionne qu\'une fois et expire 30 minutes après son envoi.')}</p>
        </form>
      )}

      {view === 'done' && (
        <div className={card} data-testid="reset-password-done">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></div>
          <h1 className="text-xl font-black">{t('تم تغيير كلمة المرور', 'Mot de passe modifié')}</h1>
          <p className="text-sm text-slate-400">{t('تم تسجيل خروجك من كل الأجهزة الأخرى. سجّل الدخول بكلمة المرور الجديدة.', 'Vous avez été déconnecté partout ailleurs. Connectez-vous avec votre nouveau mot de passe.')}</p>
          <button type="button" onClick={() => openAuth('login')} className={primary}>{t('الذهاب إلى تسجيل الدخول', 'Aller à la connexion')}</button>
        </div>
      )}

      {view === 'invalid' && (
        <div className={card} data-testid="reset-password-invalid">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center"><AlertTriangle className="w-6 h-6" /></div>
          <h1 className="text-xl font-black">{t('هذا الرابط لم يعد يعمل', 'Ce lien ne fonctionne plus')}</h1>
          <p className="text-sm text-slate-400">{t('روابط إعادة التعيين تعمل مرة واحدة وتنتهي بعد 30 دقيقة. افتح تسجيل الدخول واختر «نسيت كلمة المرور» لطلب رابط جديد، ثم استعمل أحدث رسالة.', 'Les liens de réinitialisation ne fonctionnent qu\'une fois et expirent après 30 minutes. Ouvrez la connexion, choisissez « Mot de passe oublié » pour un nouveau lien, puis utilisez le dernier e-mail.')}</p>
          <button type="button" onClick={() => openAuth('login')} className={primary}>{t('فتح تسجيل الدخول', 'Ouvrir la connexion')}</button>
        </div>
      )}
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetContent />
    </Suspense>
  );
}
