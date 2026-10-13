'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useTheme } from '@/lib/theme';
import { WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';
import type { Locale } from '@/types';
import { Avatar, Btn, Field, FormPanel, PageHead, SelectInput, Tabs, fieldClass, useTx } from './ui';

/** Profile and settings (Figma page 27). Same APIs as the old settings modal: /api/account and /api/account/change-password. */

type TabId = 'profile' | 'preferences' | 'security';

const TextInput: React.FC<{ id: string; label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; dir?: 'ltr' | 'rtl'; autoComplete?: string; hint?: string }> = ({ id, label, value, onChange, type = 'text', placeholder, dir, autoComplete, hint }) => (
  <Field label={label} htmlFor={id} hint={hint}>
    <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} dir={dir} autoComplete={autoComplete} className={fieldClass} />
  </Field>
);

export const StudentSettingsV2: React.FC = () => {
  const { tx, locale } = useTx();
  const { setLocale } = useTranslation();
  const { theme, setTheme, mounted } = useTheme();
  const { currentUser, updateProfile, setCurrentUser } = useAuthStore();
  const params = useSearchParams();
  const [tab, setTab] = useState<TabId>((params.get('tab') as TabId) || 'profile');

  const u = (currentUser || {}) as Record<string, any>;
  const [f, setF] = useState({ name: '', phone: '', wilayaCode: '16', institutionName: '', specialty: '', bio: '', whatsapp: '', telegramHandle: '', linkedin: '', facebook: '', instagram: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!currentUser) return;
    setF({ name: currentUser.name || '', phone: currentUser.phone || '', wilayaCode: String(currentUser.wilayaCode || 16), institutionName: currentUser.institutionName || '', specialty: currentUser.specialty || '', bio: u.bio || '', whatsapp: u.whatsapp || '', telegramHandle: u.telegram || '', linkedin: u.linkedin || '', facebook: u.facebook || '', instagram: u.instagram || '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!currentUser) return null;

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const w = WILAYAS.find((x) => x.code === Number(f.wilayaCode));
    const res = await updateProfile({ ...f, wilayaCode: Number(f.wilayaCode), wilayaName: w ? getLocalizedWilayaName(w, locale as Locale) : undefined });
    setSaving(false);
    setMsg(res.success ? { ok: true, text: tx('تم حفظ بياناتك', 'Informations enregistrées', 'Details saved') } : { ok: false, text: res.error || tx('تعذر الحفظ', "Échec de l'enregistrement", 'Could not save') });
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pw.next.length < 8 || /^\d+$/.test(pw.next)) { setPwMsg({ ok: false, text: tx('كلمة المرور 8 أحرف على الأقل ولا تتكون من أرقام فقط', 'Au moins 8 caractères, pas uniquement des chiffres', 'At least 8 characters, not only digits') }); return; }
    if (pw.next !== pw.confirm) { setPwMsg({ ok: false, text: tx('كلمتا المرور غير متطابقتين', 'Les mots de passe ne correspondent pas', 'Passwords do not match') }); return; }
    setPwBusy(true);
    try {
      const r = await fetch('/api/account/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next, confirmPassword: pw.confirm }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setPwMsg({ ok: false, text: d.error || tx('فشل تغيير كلمة المرور', 'Échec du changement', 'Could not change the password') }); }
      else {
        setPwMsg({ ok: true, text: tx('تم تغيير كلمة المرور', 'Mot de passe mis à jour', 'Password changed') });
        if (currentUser.mustChangePassword) setCurrentUser({ ...currentUser, mustChangePassword: false });
        setPw({ current: '', next: '', confirm: '' });
      }
    } catch {
      setPwMsg({ ok: false, text: tx('خطأ في الاتصال', 'Erreur réseau', 'Network error') });
    } finally { setPwBusy(false); }
  };

  const Note: React.FC<{ m: { ok: boolean; text: string } | null }> = ({ m }) => (m ? <p role={m.ok ? 'status' : 'alert'} className={`text-[14px] font-medium ${m.ok ? '' : 'text-[#c0392b]'}`}>{m.text}</p> : <p aria-hidden="true" className="min-h-[1.25rem]" />);

  return (
    <div className="flex flex-col gap-7" data-testid="student-settings-v2">
      <PageHead title={tx('الملف الشخصي', 'Profil et réglages', 'Profile and settings')} sub={tx('معلوماتك وتفضيلاتك وأمان حسابك.', 'Vos informations, préférences et la sécurité du compte.', 'Your details, preferences and account security.')} />
      {currentUser.mustChangePassword ? <p role="alert" className="rounded-[16px] bg-strip px-5 py-4 text-[15px] font-medium text-strip-text">{tx('لديك كلمة مرور مؤقتة. غيّرها الآن لمتابعة استخدام المنصة.', 'Vous avez un mot de passe temporaire. Changez-le pour continuer.', 'You have a temporary password. Change it to continue.')}</p> : null}

      <Tabs label={tx('أقسام الإعدادات', 'Sections', 'Settings sections')} value={tab} onChange={(v) => setTab(v as TabId)} items={[
        { id: 'profile', label: tx('الملف', 'Profil', 'Profile') },
        { id: 'preferences', label: tx('التفضيلات', 'Préférences', 'Preferences') },
        { id: 'security', label: tx('الأمان', 'Sécurité', 'Security') },
      ]} />

      {tab === 'profile' ? (
        <form onSubmit={saveProfile} className="flex flex-col gap-5">
          <FormPanel title={tx('المعلومات الشخصية', 'Informations personnelles', 'Personal details')}>
            <div className="mb-5 flex items-center gap-4"><Avatar name={f.name} src={currentUser.avatar} size={72} /><p className="text-[14px] text-sheet-muted">{currentUser.email}</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput id="st-name" label={tx('الاسم الكامل', 'Nom complet', 'Full name')} value={f.name} onChange={set('name')} autoComplete="name" />
              <TextInput id="st-phone" label={tx('الهاتف', 'Téléphone', 'Phone')} value={f.phone} onChange={set('phone')} type="tel" dir="ltr" placeholder="+213" autoComplete="tel" />
              <SelectInput id="st-wilaya" label={tx('الولاية', 'Wilaya', 'Wilaya')} value={f.wilayaCode} onChange={set('wilayaCode')} options={WILAYAS.map((w) => ({ value: String(w.code), label: `${w.code} - ${getLocalizedWilayaName(w, locale as Locale)}` }))} />
              <TextInput id="st-inst" label={tx('الجامعة أو الثانوية', 'Université ou lycée', 'University or school')} value={f.institutionName} onChange={set('institutionName')} />
              <TextInput id="st-spec" label={tx('التخصص', 'Spécialité', 'Specialty')} value={f.specialty} onChange={set('specialty')} />
            </div>
            <div className="mt-4">
              <Field label={tx('نبذة عنك', 'À propos de vous', 'About you')} htmlFor="st-bio" hint={tx('تظهر في ملفك العام.', 'Visible sur votre profil public.', 'Shown on your public profile.')}>
                <textarea id="st-bio" value={f.bio} onChange={(e) => set('bio')(e.target.value)} rows={4} className={`${fieldClass} py-3`} />
              </Field>
            </div>
          </FormPanel>
          <FormPanel title={tx('روابط التواصل', 'Liens de contact', 'Contact links')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput id="st-wa" label="WhatsApp" value={f.whatsapp} onChange={set('whatsapp')} dir="ltr" placeholder="+213..." />
              <TextInput id="st-tg" label="Telegram" value={f.telegramHandle} onChange={set('telegramHandle')} dir="ltr" placeholder="@username" />
              <TextInput id="st-in" label="LinkedIn" value={f.linkedin} onChange={set('linkedin')} dir="ltr" placeholder="https://" />
              <TextInput id="st-ig" label="Instagram" value={f.instagram} onChange={set('instagram')} dir="ltr" placeholder="@username" />
              <TextInput id="st-fb" label="Facebook" value={f.facebook} onChange={set('facebook')} dir="ltr" placeholder="https://" />
            </div>
          </FormPanel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Note m={msg} />
            <Btn type="submit" disabled={saving} data-testid="settings-save">{saving ? tx('جارٍ الحفظ…', 'Enregistrement…', 'Saving…') : tx('حفظ التغييرات', 'Enregistrer', 'Save changes')}</Btn>
          </div>
        </form>
      ) : null}

      {tab === 'preferences' ? (
        <FormPanel title={tx('اللغة والمظهر', 'Langue et apparence', 'Language and appearance')}>
          <div className="flex flex-col gap-6">
            <div role="group" aria-label={tx('اللغة', 'Langue', 'Language')} className="flex flex-col gap-2">
              <p className="text-[14px] font-semibold">{tx('اللغة', 'Langue', 'Language')}</p>
              <div className="flex flex-wrap gap-2">
                {([['ar', 'العربية'], ['fr', 'Français'], ['en', 'English']] as [Locale, string][]).map(([c, l]) => (
                  <button key={c} type="button" lang={c} aria-pressed={locale === c} onClick={() => setLocale(c)} className={`min-h-[44px] rounded-full border px-5 text-[15px] font-semibold ${locale === c ? 'border-sheet-text bg-sheet-text text-sheet' : 'border-sheet-line text-sheet-muted hover:text-sheet-text'}`}>{l}</button>
                ))}
              </div>
            </div>
            <div role="group" aria-label={tx('المظهر', 'Apparence', 'Appearance')} className="flex flex-col gap-2">
              <p className="text-[14px] font-semibold">{tx('المظهر', 'Apparence', 'Appearance')}</p>
              <div className="flex flex-wrap gap-2">
                {(['light', 'dark'] as const).map((m) => {
                  const on = mounted && theme === m;
                  return <button key={m} type="button" aria-pressed={on} onClick={() => setTheme(m)} className={`min-h-[44px] rounded-full border px-5 text-[15px] font-semibold ${on ? 'border-sheet-text bg-sheet-text text-sheet' : 'border-sheet-line text-sheet-muted hover:text-sheet-text'}`}>{m === 'light' ? tx('فاتح', 'Clair', 'Light') : tx('داكن', 'Sombre', 'Dark')}</button>;
                })}
              </div>
            </div>
          </div>
        </FormPanel>
      ) : null}

      {tab === 'security' ? (
        <form onSubmit={savePassword} className="flex flex-col gap-5">
          <FormPanel title={tx('تغيير كلمة المرور', 'Changer le mot de passe', 'Change password')}>
            <div className="grid max-w-xl gap-4">
              <TextInput id="pw-cur" type="password" label={tx('كلمة المرور الحالية', 'Mot de passe actuel', 'Current password')} value={pw.current} onChange={(v) => setPw((p) => ({ ...p, current: v }))} autoComplete="current-password" />
              <TextInput id="pw-new" type="password" label={tx('كلمة المرور الجديدة', 'Nouveau mot de passe', 'New password')} value={pw.next} onChange={(v) => setPw((p) => ({ ...p, next: v }))} autoComplete="new-password" hint={tx('8 أحرف على الأقل.', '8 caractères minimum.', 'At least 8 characters.')} />
              <TextInput id="pw-cf" type="password" label={tx('تأكيد كلمة المرور', 'Confirmer le mot de passe', 'Confirm password')} value={pw.confirm} onChange={(v) => setPw((p) => ({ ...p, confirm: v }))} autoComplete="new-password" />
            </div>
          </FormPanel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Note m={pwMsg} />
            <Btn type="submit" disabled={pwBusy || !pw.current || !pw.next}>{pwBusy ? tx('جارٍ الحفظ…', 'Enregistrement…', 'Saving…') : tx('تغيير كلمة المرور', 'Changer le mot de passe', 'Change password')}</Btn>
          </div>
        </form>
      ) : null}
    </div>
  );
};
