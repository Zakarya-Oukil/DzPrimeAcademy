'use client';

import React, { useEffect, useState } from 'react';
import { Btn, Field, PageHead, SelectInput, SkeletonRows, TextInput, Toggle, fieldClass, focus, useTx } from '@/components/student-v2/ui';
import { Banner } from '@/components/shared-v2/Dialog';
import { DEFAULT_FOOTER_CONFIG, FooterConfig, FooterEcosystemItem, FooterQuickLink, FooterSocialLink, SUPPORTED_SOCIAL_PLATFORMS, SocialPlatformType } from '@/lib/footerConfig';
import { ConfirmDialog, FormGrid, RowAction } from './ui';

const QUICK_ICONS: FooterQuickLink['iconName'][] = ['link', 'bot', 'card', 'community', 'ambassadors', 'staff', 'courses'];
const ECO_ICONS: FooterEcosystemItem['iconName'][] = ['telegram', 'bot', 'globe', 'mobile', 'shield', 'card'];

/** One collapsible section of the editor. */
const Section: React.FC<{ id: string; title: string; sub?: string; open: boolean; onToggle: () => void; children: React.ReactNode }> = ({ id, title, sub, open, onToggle, children }) => (
  <section className="rounded-[24px] bg-sheet-card">
    <h2>
      <button type="button" aria-expanded={open} aria-controls={`${id}-panel`} onClick={onToggle} className={`flex min-h-[64px] w-full items-center justify-between gap-4 rounded-[24px] px-5 py-4 text-start sm:px-6 ${focus}`}>
        <span className="min-w-0">
          <span className="block text-[17px] font-semibold">{title}</span>
          {sub ? <span className="block text-[13px] font-normal text-sheet-muted">{sub}</span> : null}
        </span>
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 256 256" className={`shrink-0 text-sheet-muted transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}><path fill="currentColor" d="M213.66 101.66l-80 80a8 8 0 0 1-11.32 0l-80-80a8 8 0 0 1 11.32-11.32L128 164.69l74.34-74.35a8 8 0 0 1 11.32 11.32Z" /></svg>
      </button>
    </h2>
    {open ? <div id={`${id}-panel`} className="flex flex-col gap-4 px-5 pb-6 sm:px-6">{children}</div> : null}
  </section>
);

/** A field sitting on a card surface, so it uses the sheet colour to stay visible. */
const OnCard: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="[&_input]:bg-sheet [&_select]:bg-sheet [&_textarea]:bg-sheet">{children}</div>;

const Item: React.FC<{ children: React.ReactNode; actions: React.ReactNode; enabled: boolean; onEnabled: (v: boolean) => void; label: string }> = ({ children, actions, enabled, onEnabled, label }) => (
  <fieldset className="flex flex-col gap-3 rounded-[20px] bg-sheet p-4">
    <legend className="sr-only">{label}</legend>
    <div className="[&_input]:bg-sheet-card [&_select]:bg-sheet-card">{children}</div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><Toggle on={enabled} onChange={onEnabled} label={label} /><span className="text-[14px]">{enabled ? 'On' : 'Off'}</span></div>
      <div className="flex flex-wrap gap-1.5">{actions}</div>
    </div>
  </fieldset>
);

/** Site footer (Figma page 31, "Site footer"). Same /api/settings/footer config and shape as the old editor; the live footer reads the same config. */
export const FooterSection: React.FC = () => {
  const { tx } = useTx();
  const [config, setConfig] = useState<FooterConfig>(DEFAULT_FOOTER_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'danger'; text: string } | null>(null);
  const [open, setOpen] = useState<string>('bio');
  const [reset, setReset] = useState(false);

  useEffect(() => {
    fetch('/api/settings/footer').then((r) => r.json()).then((d) => { if (d && typeof d === 'object' && d.brandBio) setConfig(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch('/api/settings/footer', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
      const data = await res.json();
      if (res.ok && data.success) {
        window.dispatchEvent(new CustomEvent('dzprime-footer-updated', { detail: config }));
        setMsg({ kind: 'ok', text: tx('تم حفظ تذييل الموقع وتحديثه فوراً.', 'Pied de page enregistré et mis à jour.', 'Footer saved and updated.') });
        setTimeout(() => setMsg(null), 4000);
      } else setMsg({ kind: 'danger', text: data.error || tx('فشل حفظ التعديلات', 'Échec de la sauvegarde', 'Could not save') });
    } catch (e) {
      setMsg({ kind: 'danger', text: (e as Error).message || tx('خطأ في الاتصال بالخادم', 'Erreur de connexion', 'Network error') });
    } finally {
      setSaving(false);
    }
  };

  const toggle = (id: string) => setOpen((o) => (o === id ? '' : id));
  const move = <T,>(list: T[], i: number, d: -1 | 1): T[] => { const j = i + d; if (j < 0 || j >= list.length) return list; const n = [...list]; [n[i], n[j]] = [n[j], n[i]]; return n; };
  const patch = <K extends 'socialLinks' | 'quickLinks' | 'ecosystemItems'>(key: K, i: number, p: Partial<FooterConfig[K][number]>) =>
    setConfig({ ...config, [key]: (config[key] as any[]).map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const drop = (key: 'socialLinks' | 'quickLinks' | 'ecosystemItems', i: number) => setConfig({ ...config, [key]: (config[key] as any[]).filter((_, j) => j !== i) });
  const reorder = (key: 'socialLinks' | 'quickLinks' | 'ecosystemItems', i: number, d: -1 | 1) => setConfig({ ...config, [key]: move(config[key] as any[], i, d) });

  const rowActions = (key: 'socialLinks' | 'quickLinks' | 'ecosystemItems', i: number, len: number, name: string) => (
    <>
      <RowAction onClick={() => reorder(key, i, -1)} disabled={i === 0} label={`${tx('أعلى', 'Monter', 'Move up')} ${name}`}>↑</RowAction>
      <RowAction onClick={() => reorder(key, i, 1)} disabled={i === len - 1} label={`${tx('أسفل', 'Descendre', 'Move down')} ${name}`}>↓</RowAction>
      <RowAction danger onClick={() => drop(key, i)} label={`${tx('حذف', 'Supprimer', 'Delete')} ${name}`}>{tx('حذف', 'Supprimer', 'Delete')}</RowAction>
    </>
  );

  const stamp = () => `${Date.now()}`;

  return (
    <div className="flex flex-col gap-6" data-testid="admin-footer-tab">
      <PageHead
        title={tx('تذييل الموقع', 'Pied de page', 'Site footer')}
        sub={tx('نبذة المنصة والروابط السريعة والمنظومة الرقمية وحقوق الملكية.', 'Présentation, liens rapides, écosystème et mentions.', 'About text, quick links, ecosystem and legal line.')}
        action={
          <div className="flex flex-wrap gap-2.5">
            <Btn variant="secondary" onClick={() => setReset(true)}>{tx('استعادة الافتراضي', 'Réinitialiser', 'Reset to defaults')}</Btn>
            <Btn onClick={save} disabled={saving} data-testid="save-footer-btn">{saving ? '…' : tx('حفظ التعديلات', 'Enregistrer', 'Save changes')}</Btn>
          </div>
        }
      />
      {msg ? <Banner kind={msg.kind}>{msg.text}</Banner> : null}

      {loading ? <SkeletonRows n={4} /> : (
        <div className="flex flex-col gap-3">
          <Section id="ft-bio" title={tx('نبذة المنصة والوصف', 'Présentation de la plateforme', 'About text')} open={open === 'bio'} onToggle={() => toggle('bio')}>
            <OnCard>
              <Field label={tx('الوصف (عربي)', 'Description (arabe)', 'Description (Arabic)')} htmlFor="ft-bio-ar"><textarea id="ft-bio-ar" rows={3} value={config.brandBio.descriptionAr} onChange={(e) => setConfig({ ...config, brandBio: { ...config.brandBio, descriptionAr: e.target.value } })} className={`${fieldClass} py-3`} /></Field>
              <div className="h-4" />
              <Field label={tx('الوصف (فرنسي)', 'Description (français)', 'Description (French)')} htmlFor="ft-bio-fr"><textarea id="ft-bio-fr" rows={3} dir="ltr" value={config.brandBio.descriptionFr} onChange={(e) => setConfig({ ...config, brandBio: { ...config.brandBio, descriptionFr: e.target.value } })} className={`${fieldClass} py-3`} /></Field>
            </OnCard>
          </Section>

          <Section id="ft-contact" title={tx('بيانات التواصل', 'Coordonnées', 'Contact details')} open={open === 'contact'} onToggle={() => toggle('contact')}>
            <OnCard>
              <FormGrid>
                <TextInput id="ft-phone" label={tx('الهاتف', 'Téléphone', 'Phone')} dir="ltr" value={config.contactInfo.phone} onChange={(v) => setConfig({ ...config, contactInfo: { ...config.contactInfo, phone: v } })} />
                <TextInput id="ft-email" label={tx('البريد الإلكتروني', 'Email', 'Email')} dir="ltr" value={config.contactInfo.email} onChange={(v) => setConfig({ ...config, contactInfo: { ...config.contactInfo, email: v } })} />
                <TextInput id="ft-addr-ar" label={tx('العنوان (عربي)', 'Adresse (arabe)', 'Address (Arabic)')} value={config.contactInfo.addressAr} onChange={(v) => setConfig({ ...config, contactInfo: { ...config.contactInfo, addressAr: v } })} />
                <TextInput id="ft-addr-fr" label={tx('العنوان (فرنسي)', 'Adresse (français)', 'Address (French)')} dir="ltr" value={config.contactInfo.addressFr} onChange={(v) => setConfig({ ...config, contactInfo: { ...config.contactInfo, addressFr: v } })} />
              </FormGrid>
            </OnCard>
          </Section>

          <Section id="ft-social" title={tx('روابط التواصل الاجتماعي', 'Réseaux sociaux', 'Social links')} open={open === 'social'} onToggle={() => toggle('social')}>
            {config.socialLinks.map((l, i) => (
              <Item key={l.id} label={l.title || l.platform} enabled={l.enabled} onEnabled={(v) => patch('socialLinks', i, { enabled: v })} actions={rowActions('socialLinks', i, config.socialLinks.length, l.title || l.platform)}>
                <FormGrid>
                  <SelectInput id={`sl-p-${i}`} label={tx('المنصة', 'Plateforme', 'Platform')} value={l.platform} onChange={(v) => patch('socialLinks', i, { platform: v as SocialPlatformType })} options={SUPPORTED_SOCIAL_PLATFORMS.map((p) => ({ value: p.type, label: p.labelEn }))} />
                  <TextInput id={`sl-t-${i}`} label={tx('العنوان', 'Titre', 'Title')} dir="ltr" value={l.title} onChange={(v) => patch('socialLinks', i, { title: v })} />
                </FormGrid>
                <div className="mt-3"><TextInput id={`sl-u-${i}`} label={tx('الرابط', 'Lien', 'URL')} dir="ltr" value={l.url} onChange={(v) => patch('socialLinks', i, { url: v })} /></div>
              </Item>
            ))}
            <div><Btn variant="secondary" onClick={() => setConfig({ ...config, socialLinks: [...config.socialLinks, { id: `sl-${stamp()}`, platform: 'facebook', title: 'Facebook Page', url: 'https://facebook.com/dzprimeacademy', enabled: true } as FooterSocialLink] })}>{tx('رابط جديد', 'Nouveau lien', 'New link')}</Btn></div>
          </Section>

          <Section id="ft-quick" title={tx('الروابط السريعة', 'Liens rapides', 'Quick links')} open={open === 'quick'} onToggle={() => toggle('quick')}>
            {config.quickLinks.map((l, i) => (
              <Item key={l.id} label={l.labelFr || l.labelAr} enabled={l.enabled} onEnabled={(v) => patch('quickLinks', i, { enabled: v })} actions={rowActions('quickLinks', i, config.quickLinks.length, l.labelFr || l.labelAr)}>
                <FormGrid>
                  <TextInput id={`ql-a-${i}`} label={tx('العنوان (عربي)', 'Titre (arabe)', 'Label (Arabic)')} value={l.labelAr} onChange={(v) => patch('quickLinks', i, { labelAr: v })} />
                  <TextInput id={`ql-f-${i}`} label={tx('العنوان (فرنسي)', 'Titre (français)', 'Label (French)')} dir="ltr" value={l.labelFr} onChange={(v) => patch('quickLinks', i, { labelFr: v })} />
                  <TextInput id={`ql-u-${i}`} label={tx('الرابط', 'Lien', 'URL')} dir="ltr" value={l.url} onChange={(v) => patch('quickLinks', i, { url: v })} />
                  <SelectInput id={`ql-i-${i}`} label={tx('الأيقونة', 'Icône', 'Icon')} value={l.iconName || 'link'} onChange={(v) => patch('quickLinks', i, { iconName: v as FooterQuickLink['iconName'] })} options={QUICK_ICONS.map((n) => ({ value: n as string, label: n as string }))} />
                </FormGrid>
              </Item>
            ))}
            <div><Btn variant="secondary" onClick={() => setConfig({ ...config, quickLinks: [...config.quickLinks, { id: `ql-${stamp()}`, labelAr: 'رابط جديد', labelFr: 'Nouveau lien', url: '/', iconName: 'link', enabled: true }] })}>{tx('رابط جديد', 'Nouveau lien', 'New link')}</Btn></div>
          </Section>

          <Section id="ft-eco" title={tx('المنظومة الرقمية', 'Écosystème numérique', 'Digital ecosystem')} open={open === 'eco'} onToggle={() => toggle('eco')}>
            {config.ecosystemItems.map((l, i) => (
              <Item key={l.id} label={l.name} enabled={l.enabled} onEnabled={(v) => patch('ecosystemItems', i, { enabled: v })} actions={rowActions('ecosystemItems', i, config.ecosystemItems.length, l.name)}>
                <FormGrid>
                  <TextInput id={`ec-n-${i}`} label={tx('الاسم', 'Nom', 'Name')} dir="ltr" value={l.name} onChange={(v) => patch('ecosystemItems', i, { name: v })} />
                  <SelectInput id={`ec-i-${i}`} label={tx('الأيقونة', 'Icône', 'Icon')} value={l.iconName} onChange={(v) => patch('ecosystemItems', i, { iconName: v as FooterEcosystemItem['iconName'] })} options={ECO_ICONS.map((n) => ({ value: n as string, label: n as string }))} />
                  <TextInput id={`ec-a-${i}`} label={tx('نص فرعي (عربي)', 'Sous-texte (arabe)', 'Sub-text (Arabic)')} value={l.subtextAr || ''} onChange={(v) => patch('ecosystemItems', i, { subtextAr: v })} />
                  <TextInput id={`ec-f-${i}`} label={tx('نص فرعي (فرنسي)', 'Sous-texte (français)', 'Sub-text (French)')} dir="ltr" value={l.subtextFr || ''} onChange={(v) => patch('ecosystemItems', i, { subtextFr: v })} />
                </FormGrid>
                <div className="mt-3"><TextInput id={`ec-u-${i}`} label={tx('الرابط (اختياري)', 'Lien (facultatif)', 'URL (optional)')} dir="ltr" value={l.url || ''} onChange={(v) => patch('ecosystemItems', i, { url: v })} /></div>
              </Item>
            ))}
            <div><Btn variant="secondary" onClick={() => setConfig({ ...config, ecosystemItems: [...config.ecosystemItems, { id: `ec-${stamp()}`, name: 'New item', iconName: 'globe', enabled: true } as FooterEcosystemItem] })}>{tx('عنصر جديد', 'Nouvel élément', 'New item')}</Btn></div>
          </Section>

          <Section id="ft-bottom" title={tx('حقوق الملكية والشعار', 'Mentions et slogan', 'Legal line and slogan')} open={open === 'bottom'} onToggle={() => toggle('bottom')}>
            <OnCard>
              <FormGrid>
                <TextInput id="bb-ca" label={tx('الحقوق (عربي)', 'Copyright (arabe)', 'Copyright (Arabic)')} value={config.bottomBar.copyrightAr} onChange={(v) => setConfig({ ...config, bottomBar: { ...config.bottomBar, copyrightAr: v } })} />
                <TextInput id="bb-cf" label={tx('الحقوق (فرنسي)', 'Copyright (français)', 'Copyright (French)')} dir="ltr" value={config.bottomBar.copyrightFr} onChange={(v) => setConfig({ ...config, bottomBar: { ...config.bottomBar, copyrightFr: v } })} />
                <TextInput id="bb-sa" label={tx('الشعار (عربي)', 'Slogan (arabe)', 'Slogan (Arabic)')} value={config.bottomBar.sloganAr} onChange={(v) => setConfig({ ...config, bottomBar: { ...config.bottomBar, sloganAr: v } })} />
                <TextInput id="bb-sf" label={tx('الشعار (فرنسي)', 'Slogan (français)', 'Slogan (French)')} dir="ltr" value={config.bottomBar.sloganFr} onChange={(v) => setConfig({ ...config, bottomBar: { ...config.bottomBar, sloganFr: v } })} />
              </FormGrid>
            </OnCard>
          </Section>
        </div>
      )}

      <ConfirmDialog open={reset} onClose={() => setReset(false)} onConfirm={() => { setConfig(DEFAULT_FOOTER_CONFIG); setReset(false); }} title={tx('استعادة الافتراضي', 'Réinitialiser', 'Reset to defaults')} body={tx('هل أنت متأكد من استعادة كافة الإعدادات الافتراضية لتذييل الموقع؟ لن يُحفظ شيء قبل ضغط «حفظ التعديلات».', 'Réinitialiser le pied de page par défaut ? Rien n’est enregistré avant « Enregistrer ».', 'Reset the footer to its defaults? Nothing is saved until you press Save.')} confirm={tx('استعادة', 'Réinitialiser', 'Reset')} />
    </div>
  );
};
