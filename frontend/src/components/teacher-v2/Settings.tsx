'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';
import { formatDZD } from '@/lib/format';
import type { Locale } from '@/types';
import { Btn, Empty, FormPanel, PageHead, SelectInput, SkeletonRows, Status, TextInput, dateFmt, useTx } from '@/components/student-v2/ui';
import { api, useAccount } from './data';

/** Teacher profile and CCP account (Figma page 28). Same APIs as the old tab: /api/account and /api/account/change-password. */
export const TeacherSettingsV2: React.FC = () => {
  const { tx, locale } = useTx();
  const { currentUser, updateProfile, setCurrentUser } = useAuthStore();
  const account = useAccount();
  const [f, setF] = useState({ name: '', phone: '', wilayaCode: '16', university: '', specialty: '', ccpAccount: '', ccpCle: '' });
  const [saving, setSaving] = useState<'profile' | 'ccp' | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; where: 'profile' | 'ccp' } | null>(null);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!currentUser) return;
    const tp = account?.teacherProfile;
    setF({ name: currentUser.name || '', phone: currentUser.phone || '', wilayaCode: String(currentUser.wilayaCode || 16), university: tp?.university || currentUser.institutionName || '', specialty: tp?.specialty || currentUser.specialty || '', ccpAccount: tp?.ccpAccount || '', ccpCle: tp?.ccpCle || '' });
  }, [currentUser?.id, account]);

  if (!currentUser) return null;

  const save = (where: 'profile' | 'ccp') => async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(where); setMsg(null);
    const w = WILAYAS.find((x) => x.code === Number(f.wilayaCode));
    const res = await updateProfile({ ...f, wilayaCode: Number(f.wilayaCode), wilayaName: w ? getLocalizedWilayaName(w, locale as Locale) : undefined, institutionName: f.university });
    setSaving(null);
    setMsg(res.success ? { ok: true, where, text: tx('تم الحفظ', 'Enregistré', 'Saved') } : { ok: false, where, text: res.error || tx('تعذر الحفظ', "Échec de l'enregistrement", 'Could not save') });
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

  const Note: React.FC<{ ok?: boolean; text?: string }> = ({ ok, text }) => (text ? <p role={ok ? 'status' : 'alert'} className={`text-[14px] font-medium ${ok ? '' : 'text-[#c0392b]'}`}>{text}</p> : <p aria-hidden="true" className="min-h-[1.25rem]" />);
  const payouts = account?.teacherProfile?.payouts || [];
  const kind = (s: string) => (s === 'PENDING' ? 'pending' : 'ok') as 'pending' | 'ok';
  const label = (s: string) => (s === 'PENDING' ? tx('قيد المراجعة', 'En attente', 'Pending') : s === 'APPROVED' ? tx('معتمدة', 'Approuvé', 'Approved') : tx('مدفوعة', 'Payé', 'Paid'));

  return (
    <div className="flex flex-col gap-7" data-testid="teacher-settings-v2">
      <PageHead title={tx('الملف وحساب CCP', 'Profil et compte CCP', 'Profile and CCP account')} sub={tx('بياناتك الأكاديمية وحساب صرف المستحقات وأمان حسابك.', 'Vos informations, le compte de versement et la sécurité.', 'Your details, payout account and account security.')} />
      {currentUser.mustChangePassword ? <p role="alert" className="rounded-[16px] bg-strip px-5 py-4 text-[15px] font-medium text-strip-text">{tx('لديك كلمة مرور مؤقتة. غيّرها الآن لمتابعة استخدام المنصة.', 'Vous avez un mot de passe temporaire. Changez-le pour continuer.', 'You have a temporary password. Change it to continue.')}</p> : null}

      <form onSubmit={save('profile')} className="flex flex-col gap-4">
        <FormPanel title={tx('الملف الأكاديمي', 'Profil académique', 'Academic profile')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput id="tp-name" label={tx('الاسم الكامل', 'Nom complet', 'Full name')} value={f.name} onChange={set('name')} autoComplete="name" />
            <TextInput id="tp-phone" label={tx('الهاتف', 'Téléphone', 'Phone')} value={f.phone} onChange={set('phone')} type="tel" dir="ltr" placeholder="+213" autoComplete="tel" />
            <SelectInput id="tp-wilaya" label={tx('الولاية', 'Wilaya', 'Wilaya')} value={f.wilayaCode} onChange={set('wilayaCode')} options={WILAYAS.map((w) => ({ value: String(w.code), label: `${w.code} - ${getLocalizedWilayaName(w, locale as Locale)}` }))} />
            <TextInput id="tp-uni" label={tx('الجامعة أو الكلية', 'Université ou faculté', 'University or faculty')} value={f.university} onChange={set('university')} />
            <TextInput id="tp-spec" label={tx('التخصص والمادة', 'Spécialité et matière', 'Specialty and subject')} value={f.specialty} onChange={set('specialty')} className="sm:col-span-2" />
          </div>
        </FormPanel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Note ok={msg?.ok} text={msg?.where === 'profile' ? msg.text : ''} />
          <Btn type="submit" disabled={saving !== null} data-testid="teacher-save-profile">{saving === 'profile' ? tx('جارٍ الحفظ…', 'Enregistrement…', 'Saving…') : tx('حفظ الملف', 'Enregistrer le profil', 'Save profile')}</Btn>
        </div>
      </form>

      <form onSubmit={save('ccp')} className="flex flex-col gap-4">
        <FormPanel title={tx('حساب CCP', 'Compte CCP', 'CCP account')}>
          <p className="mb-4 text-[14px] text-sheet-muted">{tx('يُستخدم لصرف مستحقاتك فقط ولا يظهر لأي طالب.', 'Utilisé uniquement pour vos versements, jamais visible des étudiants.', 'Used only for your payouts and never shown to students.')}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput id="tp-ccp" label={tx('رقم حساب CCP', 'Numéro de compte CCP', 'CCP account number')} value={f.ccpAccount} onChange={set('ccpAccount')} dir="ltr" placeholder="0012345678" />
            <TextInput id="tp-cle" label={tx('مفتاح CCP', 'Clé CCP', 'CCP key')} value={f.ccpCle} onChange={set('ccpCle')} dir="ltr" placeholder="45" />
          </div>
        </FormPanel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Note ok={msg?.ok} text={msg?.where === 'ccp' ? msg.text : ''} />
          <Btn type="submit" disabled={saving !== null} data-testid="teacher-save-ccp">{saving === 'ccp' ? tx('جارٍ الحفظ…', 'Enregistrement…', 'Saving…') : tx('حفظ حساب CCP', 'Enregistrer le compte', 'Save CCP account')}</Btn>
        </div>
      </form>

      <section aria-labelledby="tp-pay" className="flex flex-col gap-3">
        <h2 id="tp-pay" className="text-[20px] font-semibold">{tx('سجل الدفعات (CCP)', 'Historique des versements', 'Payout history')}</h2>
        {account === null ? <SkeletonRows n={2} /> : payouts.length === 0 ? (
          <Empty title={tx('لا توجد دفعات بعد', 'Aucun versement pour le moment', 'No payouts yet')} body={tx('تظهر هنا آخر 5 دفعات عند اعتمادها.', 'Les 5 derniers versements apparaissent ici une fois validés.', 'Your latest 5 payouts show here once approved.')} />
        ) : (
          <ul className="flex flex-col gap-3">
            {payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-[18px] bg-sheet-card px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-medium">{tx('دفعة شهر', 'Versement de', 'Payout for')} {p.periodMonth}</p>
                  <p className="text-[13px] text-sheet-muted">{[dateFmt(p.createdAt, locale, { day: 'numeric', month: 'short', year: 'numeric' }), p.receiptRef].filter(Boolean).join('  ·  ')}</p>
                </div>
                <Status kind={kind(p.status)}>{label(p.status)}</Status>
                <span className="text-[15px] font-semibold tabular-nums">{formatDZD(p.amountDzd, locale)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={savePassword} className="flex flex-col gap-4">
        <FormPanel title={tx('تغيير كلمة المرور', 'Changer le mot de passe', 'Change password')}>
          <div className="grid max-w-xl gap-4">
            <TextInput id="tp-pw0" type="password" label={tx('كلمة المرور الحالية', 'Mot de passe actuel', 'Current password')} value={pw.current} onChange={(v) => setPw((p) => ({ ...p, current: v }))} autoComplete="current-password" />
            <TextInput id="tp-pw1" type="password" label={tx('كلمة المرور الجديدة', 'Nouveau mot de passe', 'New password')} value={pw.next} onChange={(v) => setPw((p) => ({ ...p, next: v }))} autoComplete="new-password" hint={tx('8 أحرف على الأقل.', '8 caractères minimum.', 'At least 8 characters.')} />
            <TextInput id="tp-pw2" type="password" label={tx('تأكيد كلمة المرور', 'Confirmer le mot de passe', 'Confirm password')} value={pw.confirm} onChange={(v) => setPw((p) => ({ ...p, confirm: v }))} autoComplete="new-password" />
          </div>
        </FormPanel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Note ok={pwMsg?.ok} text={pwMsg?.text} />
          <Btn type="submit" disabled={pwBusy || !pw.current || !pw.next}>{pwBusy ? tx('جارٍ الحفظ…', 'Enregistrement…', 'Saving…') : tx('تغيير كلمة المرور', 'Changer le mot de passe', 'Change password')}</Btn>
        </div>
      </form>

      <div><Btn variant="text" href={`/${locale}/teacher/card`}>{tx('عرض بطاقة الأستاذ الرقمية', "Voir ma carte d'enseignant", 'View my teacher card')}</Btn></div>
    </div>
  );
};
