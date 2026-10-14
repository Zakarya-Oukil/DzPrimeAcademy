'use client';

import React from 'react';
import { Btn, useTx } from '@/components/student-v2/ui';
import { Dialog } from './Dialog';

/** Views of the redesigned VIP upgrade and card activation dialogs (Figma page 30). Their logic stays in UpgradeModal and CardActivationChooser. */

export const UpgradeView: React.FC<{ onClose: () => void; sub: string; onPay: () => void }> = ({ onClose, sub, onPay }) => {
  const { tx } = useTx();
  const features = [
    tx('أرشيف كامل لمواضيع الامتحانات من مختلف الجامعات', "Archives complètes des examens de plusieurs universités et du BAC", 'Complete exam archive from several universities and the BAC'),
    tx('حلول نموذجية مفصلة مع سلم التنقيط المعتمد من الأساتذة', 'Corrigés-types détaillés avec barèmes validés par les enseignants', 'Detailed model solutions with teacher-approved grading scales'),
    tx('بطاقة العضوية الرقمية الذهبية المعتمدة مع رمز QR قابل للتحقق', "Carte d'adhésion numérique Gold avec QR code vérifiable", 'Gold digital membership card with a verifiable QR code'),
    tx('تحميل مباشر وسريع لملفات الـ PDF دون أي قيود', 'Téléchargement direct et rapide des PDF, sans limite', 'Direct, fast PDF downloads with no limits'),
    tx('أولوية حجز المقاعد في الورشات والمراجعات الحضورية للولايات', 'Priorité de réservation aux ateliers et révisions en présentiel', 'Priority seats at in-person workshops and revision sessions'),
  ];
  return (
    <Dialog open onClose={onClose} title={tx('العضوية الذهبية VIP', 'Adhésion Gold VIP', 'Golden VIP Membership')} sub={sub} testId="upgrade-modal-v2" closeTestId="upgrade-close">
      <ul className="flex flex-col gap-3.5 rounded-[20px] bg-sheet-card p-[18px]">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-[15px]">
            <span aria-hidden="true" className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold-500/20 text-[13px] font-semibold">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Btn full onClick={onPay} data-testid="upgrade-pay">{tx('الدفع والتفعيل الفوري (واتساب / تيليغرام)', 'Payer et activer (WhatsApp / Telegram)', 'Pay and activate now (WhatsApp / Telegram)')}</Btn>
      <p className="text-[13px] text-sheet-muted">{tx('بريدي موب • الذهبية • CCP', 'BaridiMob • Edahabia • CCP', 'BaridiMob • Edahabia • CCP')}</p>
    </Dialog>
  );
};

export interface ChooserContact { name: string; whatsapp?: string; telegram?: string }
export const ChooserView: React.FC<{ onClose: () => void; contacts: ChooserContact[]; onWhatsapp: (number: string) => void; onTelegram: (handle: string) => void }> = ({ onClose, contacts, onWhatsapp, onTelegram }) => {
  const { tx } = useTx();
  return (
    <Dialog open onClose={onClose} title={tx('تفعيل بطاقتك الرقمية', 'Activer votre carte numérique', 'Activate your digital card')} sub={tx('اختر وسيلة التواصل وسنفعّل عضويتك الذهبية يدوياً بعد التحقق.', "Choisissez un canal de contact ; l'équipe active votre adhésion Gold manuellement.", 'Choose how to reach us and the team will activate your Gold membership by hand.')} testId="card-activation-chooser" closeTestId="card-activation-close">
      <div className="flex flex-col gap-5">
        {contacts.map((c) => (
          <div key={c.name} className="flex flex-col gap-2.5">
            {contacts.length > 1 ? <p className="text-[14px] font-semibold text-sheet-muted">{c.name}</p> : null}
            {c.whatsapp ? <Btn full onClick={() => onWhatsapp(c.whatsapp!)} data-testid="card-activation-whatsapp">{tx('واتساب', 'WhatsApp', 'WhatsApp')}</Btn> : null}
            {c.telegram ? <Btn full variant="secondary" onClick={() => onTelegram(c.telegram!)} data-testid="card-activation-telegram">{tx('تيليغرام', 'Telegram', 'Telegram')}</Btn> : null}
          </div>
        ))}
      </div>
    </Dialog>
  );
};
