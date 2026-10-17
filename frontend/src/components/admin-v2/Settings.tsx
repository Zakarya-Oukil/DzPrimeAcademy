'use client';

import React, { useEffect, useState } from 'react';
import { Btn, Field, PageHead, SelectInput, TextInput, Toggle, fieldClass, focus, useTx } from '@/components/student-v2/ui';
import { Banner } from '@/components/shared-v2/Dialog';
import { useAuthStore, setCurrentUserDirectly } from '@/lib/store';
import { hasAnyPermission } from '@/lib/rbac';
import { WILAYAS, getLocalizedWilayaName } from '@/lib/initial-data';
import { readOfficers, MAX_OFFICERS, type Officer } from '@/lib/officers';
import { Locale } from '@/types';
import { FormGrid, H2, RowAction } from './ui';

const EMPTY_OFFICER: Officer = { name: '', whatsapp: '', telegram: '', active: true };

const ToggleRow: React.FC<{ label: string; on: boolean; onChange: (v: boolean) => void }> = ({ label, on, onChange }) => (
  <div className="flex items-center justify-between gap-4 rounded-[24px] bg-sheet-card px-5 py-4">
    <span className="text-[15px] font-semibold">{label}</span>
    <Toggle on={on} onChange={onChange} label={label} />
  </div>
);

/** Settings (Figma page 31, "Settings"): own profile and password for every staff role, platform parameters for those who may change them. Same APIs as the old tab. */
export const SettingsSection: React.FC = () => {
  const { tx, locale } = useTx();
  const { currentUser, updateProfile } = useAuthStore();
  const canPlatform = hasAnyPermission(currentUser, 'settings.manage');

  const [profile, setProfile] = useState({ name: '', phone: '', wilayaCode: 16, institutionName: '', specialty: '' });
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ kind: 'ok' | 'danger'; text: string } | null>(null);

  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [commission, setCommission] = useState(10);
  const [baridi, setBaridi] = useState(true);
  const [edahabia, setEdahabia] = useState(true);
  const [ccp, setCcp] = useState(true);
  const [autoVerify, setAutoVerify] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [telegram, setTelegram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [vipPrice, setVipPrice] = useState(10000);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [sysBusy, setSysBusy] = useState(false);
  const [sysMsg, setSysMsg] = useState<{ kind: 'ok' | 'danger'; text: string } | null>(null);

  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ kind: 'ok' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (currentUser) setProfile({ name: currentUser.name || '', phone: currentUser.phone || '', wilayaCode: currentUser.wilayaCode || 16, institutionName: currentUser.institutionName || '', specialty: currentUser.specialty || '' });
  }, [currentUser]);

  useEffect(() => {
    if (!canPlatform) return;
    fetch('/api/settings').then((r) => r.json()).then((d) => {
      if (!d) return;
      if (d.academicYear) setAcademicYear(d.academicYear);
      if (d.ambassadorCommissionRate !== undefined) setCommission(d.ambassadorCommissionRate);
      if (d.baridiMobEnabled !== undefined) setBaridi(d.baridiMobEnabled);
      if (d.edahabiaEnabled !== undefined) setEdahabia(d.edahabiaEnabled);
      if (d.ccpReceiptsEnabled !== undefined) setCcp(d.ccpReceiptsEnabled);
      if (d.autoVerifyCards !== undefined) setAutoVerify(d.autoVerifyCards);
      if (d.whatsappNumber) setWhatsapp(d.whatsappNumber);
      if (d.telegramUsername) setTelegram(d.telegramUsername);
      if (d.linkedinUrl) setLinkedin(d.linkedinUrl);
      if (d.vipPriceDzd !== undefined) setVipPrice(d.vipPriceDzd);
      setOfficers(readOfficers(d.officers));
    }).catch(() => {});
  }, [canPlatform]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileBusy(true); setProfileMsg(null);
    const w = WILAYAS.find((x) => x.code === Number(profile.wilayaCode));
    const res = await updateProfile({ ...profile, wilayaCode: Number(profile.wilayaCode), wilayaName: w ? getLocalizedWilayaName(w, locale as Locale) : undefined });
    setProfileBusy(false);
    setProfileMsg(res.success ? { kind: 'ok', text: tx('تم حفظ بيانات المسؤول.', 'Profil administrateur mis à jour.', 'Profile saved.') } : { kind: 'danger', text: res.error || tx('فشل حفظ التعديلات', 'Échec de la mise à jour', 'Could not save') });
  };

  const saveSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSysBusy(true); setSysMsg(null);
    try {
      const res = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ academicYear, ambassadorCommissionRate: commission, baridiMobEnabled: baridi, edahabiaEnabled: edahabia, ccpReceiptsEnabled: ccp, autoVerifyCards: autoVerify, whatsappNumber: whatsapp, telegramUsername: telegram, linkedinUrl: linkedin, officers, vipPriceDzd: Number(vipPrice) || 10000 }) });
      const data = await res.json();
      setSysMsg(res.ok ? { kind: 'ok', text: tx('تم حفظ إعدادات المنصة.', 'Paramètres enregistrés.', 'Platform settings saved.') } : { kind: 'danger', text: data.error || tx('فشل حفظ إعدادات النظام', "Échec de l'enregistrement", 'Could not save settings') });
    } catch (x) {
      setSysMsg({ kind: 'danger', text: (x as Error).message || tx('خطأ في الاتصال', 'Erreur réseau', 'Network error') });
    } finally {
      setSysBusy(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (next.length < 8 || /^\d+$/.test(next)) return setPwMsg({ kind: 'danger', text: tx('كلمة المرور 8 أحرف على الأقل ولا تتكون من أرقام فقط.', 'Au moins 8 caractères, pas uniquement des chiffres.', 'At least 8 characters, not digits only.') });
    if (next !== confirm) return setPwMsg({ kind: 'danger', text: tx('كلمتا المرور غير متطابقتين', 'Les mots de passe ne correspondent pas', 'Passwords do not match') });
    setPwBusy(true);
    try {
      const res = await fetch('/api/account/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: cur, newPassword: next, confirmPassword: confirm }) });
      const data = await res.json();
      if (!res.ok) setPwMsg({ kind: 'danger', text: data.error || tx('فشل تغيير كلمة المرور', 'Échec de la modification', 'Could not change the password') });
      else {
        setPwMsg({ kind: 'ok', text: tx('تم تحديث كلمة المرور.', 'Mot de passe mis à jour.', 'Password updated.') });
        setCur(''); setNext(''); setConfirm('');
        if (currentUser?.mustChangePassword) setCurrentUserDirectly({ ...currentUser, mustChangePassword: false });
      }
    } catch (x) {
      setPwMsg({ kind: 'danger', text: (x as Error).message || tx('خطأ في الاتصال', 'Erreur réseau', 'Network error') });
    } finally {
      setPwBusy(false);
    }
  };

  const setOfficer = (i: number, patch: Partial<Officer>) => setOfficers(officers.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  const primary = `inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold-500 px-6 text-[15px] font-semibold text-[#050505] hover:bg-gold-400 disabled:opacity-60 ${focus}`;

  return (
    <div className="flex flex-col gap-8" data-testid="admin-settings-tab">
      <PageHead
        title={tx('الإعدادات', 'Réglages', 'Settings')}
        sub={tx('بياناتك وكلمة المرور، ومعايير المنصة لمن يملك الصلاحية.', 'Votre profil, votre mot de passe et les paramètres de la plateforme.', 'Your profile, password and platform settings.')}
        action={canPlatform ? <button type="submit" form="admin-platform-form" disabled={sysBusy} className={primary} data-testid="save-system-btn">{sysBusy ? '…' : tx('حفظ إعدادات المنصة', 'Enregistrer les paramètres', 'Save platform settings')}</button> : undefined}
      />

      {currentUser?.mustChangePassword ? <Banner kind="info">{tx('لديك كلمة مرور مؤقتة. غيّرها الآن لمتابعة استخدام لوحة الإدارة.', 'Vous avez un mot de passe temporaire. Changez-le pour continuer.', 'You have a temporary password. Change it to keep using the admin area.')}</Banner> : null}

      <form onSubmit={saveProfile} className="flex flex-col gap-4" data-testid="admin-profile-form">
        <H2>{tx('بيانات المسؤول', 'Profil administrateur', 'Your profile')}</H2>
        {profileMsg ? <Banner kind={profileMsg.kind}>{profileMsg.text}</Banner> : null}
        <FormGrid>
          <TextInput id="ad-name" label={tx('الاسم الكامل للمسؤول', 'Nom complet', 'Full name')} value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} />
          <Field label={tx('البريد الإلكتروني', 'Email', 'Email')} htmlFor="ad-email" hint={tx('لا يمكن تغييره من هنا.', 'Non modifiable ici.', 'Cannot be changed here.')}>
            <input id="ad-email" readOnly dir="ltr" value={currentUser?.email || ''} className={`${fieldClass} opacity-70`} />
          </Field>
          <TextInput id="ad-phone" label={tx('رقم الهاتف', 'Téléphone', 'Phone')} dir="ltr" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} />
          <SelectInput id="ad-wilaya" label={tx('الولاية والمقر', 'Wilaya', 'Wilaya')} value={String(profile.wilayaCode)} onChange={(v) => setProfile({ ...profile, wilayaCode: Number(v) })} options={WILAYAS.map((w) => ({ value: String(w.code), label: `${w.code} - ${getLocalizedWilayaName(w, locale as Locale)}` }))} />
        </FormGrid>
        <TextInput id="ad-inst" label={tx('المؤسسة أو الهيئة', 'Institution', 'Institution')} value={profile.institutionName} onChange={(v) => setProfile({ ...profile, institutionName: v })} />
        <div className="flex justify-end"><button type="submit" disabled={profileBusy} className={primary}>{profileBusy ? '…' : tx('حفظ بيانات المسؤول', 'Enregistrer le profil', 'Save profile')}</button></div>
      </form>

      {canPlatform ? (
        <form id="admin-platform-form" onSubmit={saveSystem} className="flex flex-col gap-4" data-testid="admin-platform-form">
          <H2>{tx('معايير المنصة والعمولات', 'Paramètres de la plateforme', 'Platform parameters')}</H2>
          {sysMsg ? <Banner kind={sysMsg.kind}>{sysMsg.text}</Banner> : null}
          <FormGrid>
            <TextInput id="pl-year" label={tx('السنة الجامعية المعتمدة', 'Année académique', 'Academic year')} dir="ltr" value={academicYear} onChange={setAcademicYear} />
            <TextInput id="pl-comm" label={tx('نسبة عمولة السفراء (%)', 'Commission ambassadeurs (%)', 'Ambassador commission (%)')} type="number" min={0} max={100} dir="ltr" value={String(commission)} onChange={(v) => setCommission(Number(v))} />
            <TextInput id="pl-vip" label={tx('سعر العضوية الذهبية (دج)', 'Prix Gold VIP (DZD)', 'Gold VIP price (DZD)')} type="number" min={0} dir="ltr" value={String(vipPrice)} onChange={(v) => setVipPrice(Number(v))} />
            <TextInput id="pl-wa" label={tx('رقم واتساب الإدارة والدعم (WhatsApp)', 'WhatsApp du support', 'Support WhatsApp')} dir="ltr" value={whatsapp} onChange={setWhatsapp} />
            <TextInput id="pl-tg" label={tx('حساب تيليغرام (بدون @)', 'Telegram (sans @)', 'Telegram (without @)')} dir="ltr" value={telegram} onChange={setTelegram} />
            <TextInput id="pl-li" label={tx('رابط حساب لينكد إن الرسمي (LinkedIn)', 'Lien LinkedIn', 'LinkedIn link')} dir="ltr" value={linkedin} onChange={setLinkedin} />
          </FormGrid>
          <H2>{tx('بوابات الدفع الإلكتروني', 'Moyens de paiement', 'Payment methods')}</H2>
          <div className="grid gap-3 md:grid-cols-3">
            <ToggleRow label="BaridiMob" on={baridi} onChange={setBaridi} />
            <ToggleRow label="Edahabia" on={edahabia} onChange={setEdahabia} />
            <ToggleRow label={tx('وصل CCP', 'Reçu CCP', 'CCP receipt')} on={ccp} onChange={setCcp} />
          </div>
          <ToggleRow label={tx('التفعيل التلقائي للبطاقات', 'Activation automatique des cartes', 'Automatic card activation')} on={autoVerify} onChange={setAutoVerify} />

          <H2>{tx('مسؤولو التسجيل (تفعيل البطاقات)', "Responsables d'inscription (activation des cartes)", 'Registration officers (card activation)')}</H2>
          <p className="text-[13px] text-sheet-muted">{tx('يظهرون للطالب عند تفعيل بطاقته. أدخل الرقم مع رمز الدولة (213…) ومعرّف تيليغرام بدون @.', "Affichés à l'étudiant lors de l'activation. Numéro avec indicatif (213…), identifiant Telegram sans @.", 'Shown to the student when activating a card. Phone with country code (213…), Telegram username without @.')}</p>
          {officers.length === 0 ? <p className="text-[14px] text-sheet-muted">{tx('لم يُضف أي مسؤول بعد.', 'Aucun responsable pour le moment.', 'No officers yet.')}</p> : null}
          <div className="flex flex-col gap-3" data-testid="officers-editor">
            {officers.map((o, i) => (
              <fieldset key={i} className="flex flex-col gap-3 rounded-[24px] bg-sheet-card p-5">
                <legend className="sr-only">{tx(`المسؤول ${i + 1}`, `Responsable ${i + 1}`, `Officer ${i + 1}`)}</legend>
                <input aria-label={tx('الاسم', 'Nom', 'Name')} value={o.name} maxLength={60} onChange={(e) => setOfficer(i, { name: e.target.value })} placeholder={tx('الاسم الكامل', 'Nom complet', 'Full name')} className={`${fieldClass} bg-sheet`} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input aria-label="WhatsApp" dir="ltr" inputMode="tel" value={o.whatsapp} onChange={(e) => setOfficer(i, { whatsapp: e.target.value })} placeholder="213550123456" className={`${fieldClass} bg-sheet`} />
                  <input aria-label="Telegram" dir="ltr" value={o.telegram} onChange={(e) => setOfficer(i, { telegram: e.target.value })} placeholder="username" className={`${fieldClass} bg-sheet`} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3"><Toggle on={o.active} onChange={(v) => setOfficer(i, { active: v })} label={tx('ظاهر للطلبة', 'Visible pour les étudiants', 'Visible to students')} /><span className="text-[14px]">{tx('ظاهر للطلبة', 'Visible pour les étudiants', 'Visible to students')}</span></div>
                  <RowAction danger onClick={() => setOfficers(officers.filter((_, j) => j !== i))} label={tx(`حذف المسؤول ${o.name || i + 1}`, `Supprimer ${o.name || i + 1}`, `Remove ${o.name || i + 1}`)}>{tx('حذف', 'Supprimer', 'Remove')}</RowAction>
                </div>
              </fieldset>
            ))}
          </div>
          {officers.length < MAX_OFFICERS ? <div><Btn variant="secondary" onClick={() => setOfficers([...officers, { ...EMPTY_OFFICER }])}>{tx('إضافة مسؤول', 'Ajouter un responsable', 'Add an officer')}</Btn></div> : null}
        </form>
      ) : null}

      <form onSubmit={savePassword} className="flex flex-col gap-4" data-testid="admin-password-form">
        <H2>{tx('تغيير كلمة مرور الإدارة', 'Changer le mot de passe', 'Change password')}</H2>
        {pwMsg ? <Banner kind={pwMsg.kind}>{pwMsg.text}</Banner> : null}
        <FormGrid>
          <TextInput id="pw-cur" label={tx('كلمة المرور الحالية', 'Mot de passe actuel', 'Current password')} type="password" dir="ltr" autoComplete="current-password" value={cur} onChange={setCur} />
          <span className="hidden sm:block" />
          <TextInput id="pw-new" label={tx('كلمة المرور الجديدة', 'Nouveau mot de passe', 'New password')} type="password" dir="ltr" autoComplete="new-password" value={next} onChange={setNext} />
          <TextInput id="pw-confirm" label={tx('تأكيد كلمة المرور الجديدة', 'Confirmer le mot de passe', 'Confirm new password')} type="password" dir="ltr" autoComplete="new-password" value={confirm} onChange={setConfirm} />
        </FormGrid>
        <div className="flex justify-end"><button type="submit" disabled={pwBusy} className={primary}>{pwBusy ? '…' : tx('تحديث كلمة مرور الإدارة', 'Mettre à jour le mot de passe', 'Update password')}</button></div>
      </form>
    </div>
  );
};

