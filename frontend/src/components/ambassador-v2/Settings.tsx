'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';
import type { Locale } from '@/types';
import { Btn, Field, FormPanel, PageHead, SelectInput, TextInput, fieldClass, useTx } from '@/components/student-v2/ui';
import { api, useAmbAccount } from './data';

/** Ambassador profile and security (Figma page 29). Same APIs as the old tab: PUT /api/account and POST /api/account/change-password. No payout account: ambassadors have none. */
export const AmbassadorSettingsV2: React.FC = () => {
  const { tx, locale } = useTx();
  const { currentUser, updateProfile, setCurrentUser } = useAuthStore();
  const acct = useAmbAccount();
  const [f, setF] = useState({ name: '', phone: '', wilayaCode: '16', institutionName: '', telegramHandle: '', bioAr: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!currentUser) return;
    setF({
      name: currentUser.name || '',
      phone: currentUser.phone || '',
      wilayaCode: String(currentUser.wilayaCode || 16),
      institutionName: acct?.institutionNameAr || currentUser.institutionName || '',
      telegramHandle: acct?.telegramHandle || '',
      bioAr: acct?.bioAr || '',
    });
  }, [currentUser?.id, acct]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentUser) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const w = WILAYAS.find((x) => x.code === Number(f.wilayaCode));
    const res = await updateProfile({ ...f, wilayaCode: Number(f.wilayaCode), wilayaName: w ? getLocalizedWilayaName(w, locale as Locale) : undefined });
    setSaving(false);
    setMsg(res.success ? { ok: true, text: tx('تم الحفظ', 'Enregistré', 'Saved') } : { ok: false, text: res.error || tx('تعذر الحفظ', "Échec de l'enregistrement", 'Could not save') });
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pw.next.length < 8 || /^\d+$/.test(pw.next)) { setPwMsg({ ok: false, text: tx('كلمة المرور 8 أحرف على الأقل ولا تتكون من أرقام فقط', 'Au moins 8 caractères, pas uniquement des chiffres', 'At least 8 characters, not only digits') }); return; }
    if (pw.next !== pw.confirm) { setPwMsg({ ok: false, text: tx('كلمتا المرور غير متطابقتين', 'Les mots de passe ne correspondent pas', 'Passwords do not match') }); return; }
    setPwBusy(true);
    const r = await api('/api/account/change-password', 'POST', { currentPassword: pw.current, newPassword: pw.next, confirmPassword: pw.confirm });
    setPwBusy(false);
    if (!r.ok) { setPwMsg({ ok: false, text: r.json.error || tx('فشل تغيير كلمة المرور', 'Échec du changement', 'Could not change the password') }); return; }
    setPwMsg({ ok: true, text: tx('تم تغيير كلمة المرور', 'Mot de passe mis à jour', 'Password changed') });
    if (currentUser.mustChangePassword) setCurrentUser({ ...currentUser, mustChangePassword: false });
    setPw({ current: '', next: '', confirm: '' });
  };

  const Note: React.FC<{ m: { ok: boolean; text: string } | null }> = ({ m }) => (m ? <p role={m.ok ? 'status' : 'alert'} className={`text-[14px] font-medium ${m.ok ? '' : 'text-[#c0392b]'}`}>{m.text}</p> : <p aria-hidden="true" className="min-h-[1.25rem]" />);

  return (
    <div className="flex flex-col gap-7" data-testid="ambassador-settings-v2">
      <PageHead title={tx('الملف والأمان', 'Profil et sécurité', 'Profile and security')} sub={tx('بياناتك الأكاديمية وحسابك على تيليغرام وأمان حسابك.', 'Vos informations, votre Telegram et la sécurité du compte.', 'Your details, your Telegram and account security.')} />
      {currentUser.mustChangePassword ? <p role="alert" className="rounded-[16px] bg-strip px-5 py-4 text-[15px] font-medium text-strip-text">{tx('لديك كلمة مرور مؤقتة. غيّرها الآن لمتابعة استخدام المنصة.', 'Vous avez un mot de passe temporaire. Changez-le pour continuer.', 'You have a temporary password. Change it to continue.')}</p> : null}

      <form onSubmit={save} className="flex flex-col gap-4">
        <FormPanel title={tx('الملف الأكاديمي', 'Profil académique', 'Academic profile')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput id="ap-name" label={tx('الاسم الكامل', 'Nom complet', 'Full name')} value={f.name} onChange={set('name')} autoComplete="name" />
            <TextInput id="ap-phone" label={tx('الهاتف', 'Téléphone', 'Phone')} value={f.phone} onChange={set('phone')} type="tel" dir="ltr" placeholder="+213" autoComplete="tel" />
            <SelectInput id="ap-wilaya" label={tx('الولاية', 'Wilaya', 'Wilaya')} value={f.wilayaCode} onChange={set('wilayaCode')} options={WILAYAS.map((w) => ({ value: String(w.code), label: `${w.code} - ${getLocalizedWilayaName(w, locale as Locale)}` }))} />
            <TextInput id="ap-uni" label={tx('الجامعة أو المعهد', 'Université ou institut', 'University or institute')} value={f.institutionName} onChange={set('institutionName')} />
            <TextInput id="ap-tg" label={tx('معرّف تيليغرام', 'Identifiant Telegram', 'Telegram handle')} value={f.telegramHandle} onChange={set('telegramHandle')} dir="ltr" placeholder="@username" className="sm:col-span-2" />
            <Field label={tx('نبذة تعريفية', 'Biographie', 'Bio')} htmlFor="ap-bio" className="sm:col-span-2" hint={tx('تظهر في دليل السفراء.', "Visible dans l'annuaire des ambassadeurs.", 'Shown in the ambassador directory.')}>
              <textarea id="ap-bio" rows={3} value={f.bioAr} onChange={(e) => setF((p) => ({ ...p, bioAr: e.target.value }))} className={`${fieldClass} py-3`} />
            </Field>
          </div>
        </FormPanel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Note m={msg} />
          <Btn type="submit" disabled={saving} data-testid="ambassador-save-profile">{saving ? tx('جارٍ الحفظ…', 'Enregistrement…', 'Saving…') : tx('حفظ الملف', 'Enregistrer le profil', 'Save profile')}</Btn>
        </div>
      </form>

      <form onSubmit={savePassword} className="flex flex-col gap-4">
        <FormPanel title={tx('تغيير كلمة المرور', 'Changer le mot de passe', 'Change password')}>
          <div className="grid max-w-xl gap-4">
            <TextInput id="ap-pw0" type="password" label={tx('كلمة المرور الحالية', 'Mot de passe actuel', 'Current password')} value={pw.current} onChange={(v) => setPw((p) => ({ ...p, current: v }))} autoComplete="current-password" />
            <TextInput id="ap-pw1" type="password" label={tx('كلمة المرور الجديدة', 'Nouveau mot de passe', 'New password')} value={pw.next} onChange={(v) => setPw((p) => ({ ...p, next: v }))} autoComplete="new-password" hint={tx('8 أحرف على الأقل.', '8 caractères minimum.', 'At least 8 characters.')} />
            <TextInput id="ap-pw2" type="password" label={tx('تأكيد كلمة المرور', 'Confirmer le mot de passe', 'Confirm password')} value={pw.confirm} onChange={(v) => setPw((p) => ({ ...p, confirm: v }))} autoComplete="new-password" />
          </div>
        </FormPanel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Note m={pwMsg} />
          <Btn type="submit" disabled={pwBusy || !pw.current || !pw.next}>{pwBusy ? tx('جارٍ الحفظ…', 'Enregistrement…', 'Saving…') : tx('تغيير كلمة المرور', 'Changer le mot de passe', 'Change password')}</Btn>
        </div>
      </form>
    </div>
  );
};
