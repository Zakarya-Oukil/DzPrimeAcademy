'use client';

import React from 'react';
import { formatDZD } from '@/lib/format';
import { Btn, useTx } from '@/components/student-v2/ui';
import { Banner, Dialog } from './Dialog';

/** Redesigned contact dialog (Figma page 30): account activation, ambassador application, payment. Logic and API calls stay in ContactActionModal. */
export interface ContactViewProps {
  kind: 'activation' | 'ambassador' | 'payment';
  onClose: () => void;
  title?: string;
  amountDzd?: number;
  email?: string;
  ambassadorHandle: string;
  contacted: 'WHATSAPP' | 'TELEGRAM' | null;
  onContact: (c: 'WHATSAPP' | 'TELEGRAM') => void;
  resend: { busy: boolean; ok: string; error: string; cooldown: number; onResend: () => void };
}

export const ContactView: React.FC<ContactViewProps> = ({ kind, onClose, title, amountDzd, email, ambassadorHandle, contacted, onContact, resend }) => {
  const { tx, locale } = useTx();
  const handle = ambassadorHandle.replace('@', '').replace('t.me/', '');

  const heading = kind === 'activation' ? tx('تحقق من بريدك الإلكتروني لتفعيل الحساب', 'Vérifiez votre email pour activer le compte', 'Check your email to activate the account')
    : kind === 'ambassador' ? tx('التقديم لشبكة السفراء المعتمدين', 'Candidature ambassadeur officiel', 'Apply to the ambassador network')
    : tx('إتمام الدفع وتفعيل الخدمة', 'Paiement et activation immédiate', 'Complete payment and activation');

  return (
    <Dialog open onClose={onClose} title={heading} testId="contact-action-modal-backdrop" closeTestId="contact-modal-close-btn">
      {kind === 'activation' ? (
        <div className="flex flex-col gap-4">
          <p className="text-[15px] text-sheet-muted">{tx('أرسلنا رسالة تأكيد تتضمن زر تفعيل الحساب المباشر إلى بريدك:', 'Nous vous avons envoyé un lien de confirmation sécurisé à :', 'We sent a secure confirmation link to:')}</p>
          {email ? <p dir="ltr" className="w-fit rounded-full bg-sheet-card px-4 py-1.5 text-[14px] font-semibold">{email}</p> : null}
          <ol className="flex flex-col gap-2.5 rounded-[20px] bg-sheet-card p-[18px] text-[15px]">
            {[
              tx('افتح تطبيق البريد الإلكتروني أو Gmail وتفقد صندوق الوارد (Inbox).', 'Ouvrez votre application de messagerie ou Gmail.', 'Open your email app or Gmail.'),
              tx('اضغط على زر "تفعيل حسابي الآن" داخل الرسالة لبدء استخدام المنصة.', 'Cliquez sur le bouton « Activer mon compte » pour finaliser.', 'Press “Activate my account” in the message.'),
              tx('إذا لم تجد الرسالة فوراً، يرجى تفقد مجلد الرسائل غير المرغوب فيها (Spam).', 'Vérifiez également votre dossier spams.', 'Also check your spam folder.'),
            ].map((s, i) => (
              <li key={i} className="flex items-start gap-3"><span aria-hidden="true" className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold-500/20 text-[13px] font-semibold">{i + 1}</span><span>{s}</span></li>
            ))}
          </ol>
          <Btn variant="secondary" full onClick={resend.onResend} disabled={resend.busy || resend.cooldown > 0}>
            {resend.busy ? tx('جارٍ الإرسال…', 'Envoi en cours…', 'Sending…') : resend.cooldown > 0 ? tx(`إعادة الإرسال بعد (${resend.cooldown} ثانية)`, `Renvoyer dans (${resend.cooldown}s)`, `Resend in (${resend.cooldown}s)`) : tx('إعادة إرسال بريد التفعيل', "Renvoyer l'email d'activation", 'Resend the activation email')}
          </Btn>
          {resend.ok ? <Banner kind="ok">{resend.ok}</Banner> : null}
          {resend.error ? <Banner kind="danger">{resend.error}</Banner> : null}
          <p className="text-[14px] font-semibold">{tx('لم تستلم بريد التفعيل؟ تواصل معنا مباشرة وسنقوم بتفعيل حسابك فوراً:', "Vous n'avez pas reçu l'email ? Contactez-nous directement pour activation immédiate :", "Didn't get the email? Contact us directly for immediate activation:")}</p>
          <Btn full onClick={() => onContact('WHATSAPP')} data-testid="contact-modal-whatsapp-btn">{tx('تواصل عبر واتساب (WhatsApp)', 'Contacter par WhatsApp', 'Contact on WhatsApp')}</Btn>
          <Btn full variant="secondary" onClick={() => onContact('TELEGRAM')} data-testid="contact-modal-telegram-btn">{tx('تواصل عبر تيليغرام (Telegram)', 'Contacter sur Telegram', 'Contact on Telegram')}</Btn>
        </div>
      ) : kind === 'ambassador' ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 rounded-[16px] border border-sheet-line p-4 text-[14px]">
            <span className="text-sheet-muted">{tx('المسؤول المعتمد:', 'Responsable officiel :', 'Official contact:')}</span>
            <span dir="ltr" className="font-semibold">@{handle}</span>
          </div>
          <ul className="flex flex-col gap-3 rounded-[20px] bg-sheet-card p-[18px] text-[15px]">
            <li>{tx('تمثيل الأكاديمية في 58 ولاية وتنسيق العمليات الطلابية.', 'Représentation dans les 58 wilayas.', 'Represent the academy in the 58 wilayas.')}</li>
            <li>{tx('عمولات مالية وبطاقة سفير رقمية مشفرة معتمدة.', 'Commissions et carte officielle accréditée.', 'Commissions and an accredited digital ambassador card.')}</li>
          </ul>
          <Btn full onClick={() => onContact('TELEGRAM')} data-testid="contact-modal-ambassador-telegram-btn">{tx(`مراسلة إدارة السفراء عبر تيليغرام (@${handle})`, `Contacter via Telegram (@${handle})`, `Message on Telegram (@${handle})`)}</Btn>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <dl className="flex flex-col gap-3 rounded-[16px] border border-sheet-line p-4 text-[14px]">
            <div className="flex justify-between gap-4"><dt className="text-sheet-muted">{tx('الخدمة المطلوبة:', 'Service demandé :', 'Requested service:')}</dt><dd className="font-semibold">{title || tx('ترقية العضوية', 'Mise à niveau', 'Membership upgrade')}</dd></div>
            {amountDzd !== undefined && amountDzd > 0 ? <div className="flex justify-between gap-4"><dt className="text-sheet-muted">{tx('المبلغ المطلوب:', 'Montant :', 'Amount:')}</dt><dd className="font-semibold tabular-nums">{formatDZD(amountDzd, locale)}</dd></div> : null}
          </dl>
          <p className="text-[15px] text-sheet-muted">{tx('طرق الدفع المعتمدة: بريدي موب (BaridiMob) • البطاقة الذهبية • CCP', 'Modes acceptés : BaridiMob • Edahabia • CCP', 'Accepted: BaridiMob • Edahabia • CCP')}</p>
          <Banner kind="info">{tx('تفعيل فوري خلال دقائق بمجرد إرسال وصل التحويل للإدارة.', 'Activation en quelques minutes après envoi du reçu.', 'Activation within minutes once the transfer receipt is sent.')}</Banner>
          <Btn full onClick={() => onContact('WHATSAPP')} data-testid="contact-modal-whatsapp-pay-btn">{tx('الدفع والتفعيل عبر واتساب', 'Payer via WhatsApp', 'Pay via WhatsApp')}</Btn>
          <Btn full variant="secondary" onClick={() => onContact('TELEGRAM')} data-testid="contact-modal-telegram-pay-btn">{tx('الدفع والتفعيل عبر تيليغرام', 'Payer via Telegram', 'Pay via Telegram')}</Btn>
        </div>
      )}

      {contacted ? (
        <Banner kind="ok" testId="contact-contacted">{tx(`تم تسجيل طلبك لدى الإدارة وتوجيهك إلى ${contacted === 'WHATSAPP' ? 'واتساب' : 'تيليغرام'} — سيتم تفعيل حسابك فور استلام رسالتك!`, "Votre demande est enregistrée auprès de l'administration — activation dès réception de votre message !", 'Your request is logged with the administration — activation as soon as your message arrives!')}</Banner>
      ) : null}
    </Dialog>
  );
};
