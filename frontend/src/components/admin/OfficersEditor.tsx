'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { MAX_OFFICERS, type Officer } from '@/lib/officers';

interface OfficersEditorProps {
  value: Officer[];
  onChange: (next: Officer[]) => void;
  locale: string;
}

const EMPTY: Officer = { name: '', whatsapp: '', telegram: '', active: true };
const input = 'w-full min-h-11 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-lime-400';

// Registration officers shown in the card-activation dialog. Admins type a name, a phone number with country
// code and/or a Telegram username; the site builds the links. Saved with the rest of the system settings.
export const OfficersEditor: React.FC<OfficersEditorProps> = ({ value, onChange, locale }) => {
  const ar = locale === 'ar';
  const t = (a: string, f: string) => (ar ? a : f);
  const set = (i: number, patch: Partial<Officer>) => onChange(value.map((o, j) => (j === i ? { ...o, ...patch } : o)));

  return (
    <div className="space-y-3" data-testid="officers-editor">
      <div>
        <p className="block text-lime-400 font-bold text-xs">{t('مسؤولو التسجيل (تفعيل البطاقات)', 'Responsables d’inscription (activation des cartes)')}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{t('يظهرون للطالب عند تفعيل بطاقته. أدخل الرقم مع رمز الدولة (213…) ومعرّف تيليغرام بدون @.', 'Affichés à l’étudiant lors de l’activation. Numéro avec indicatif (213…), identifiant Telegram sans @.')}</p>
      </div>

      {value.length === 0 && <p className="text-[11px] text-gray-500">{t('لم يُضف أي مسؤول بعد.', 'Aucun responsable pour le moment.')}</p>}

      {value.map((o, i) => (
        <fieldset key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
          <legend className="sr-only">{t(`المسؤول ${i + 1}`, `Responsable ${i + 1}`)}</legend>
          <input aria-label={t('الاسم', 'Nom')} value={o.name} maxLength={60} onChange={(e) => set(i, { name: e.target.value })} placeholder={t('الاسم الكامل', 'Nom complet')} className={input} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input aria-label="WhatsApp" dir="ltr" inputMode="tel" value={o.whatsapp} onChange={(e) => set(i, { whatsapp: e.target.value })} placeholder="213550123456" className={input} />
            <input aria-label="Telegram" dir="ltr" value={o.telegram} onChange={(e) => set(i, { telegram: e.target.value })} placeholder="username" className={input} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-[11px] text-gray-300 min-h-11">
              <input type="checkbox" checked={o.active} onChange={(e) => set(i, { active: e.target.checked })} className="w-4 h-4 rounded" />
              {t('ظاهر للطلبة', 'Visible pour les étudiants')}
            </label>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              aria-label={t(`حذف المسؤول ${o.name || i + 1}`, `Supprimer ${o.name || i + 1}`)}
              className="w-11 h-11 rounded-xl bg-white/10 hover:bg-rose-500/30 text-white flex items-center justify-center focus-visible:outline-2 focus-visible:outline-lime-400"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </fieldset>
      ))}

      {value.length < MAX_OFFICERS && (
        <button
          type="button"
          onClick={() => onChange([...value, { ...EMPTY }])}
          className="min-h-11 px-4 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/15 flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-lime-400"
        >
          <Plus className="w-4 h-4" /> {t('إضافة مسؤول', 'Ajouter un responsable')}
        </button>
      )}
    </div>
  );
};
