// Registration officers who activate cards by hand. Admins edit the list in Settings; it is stored as JSON on
// PlatformSettings. Only a phone number and a Telegram username are kept, never a free URL: the site builds the
// wa.me / t.me links itself, so nothing an admin types can become a hostile link.
export type Officer = {
  name: string;
  whatsapp: string; // digits with country code, e.g. 213550123456 ('' if none)
  telegram: string; // username without @ ('' if none)
  active: boolean;
};

export const MAX_OFFICERS = 10;

export function parseOfficers(v: unknown): { value: Officer[] } | { error: string } {
  if (!Array.isArray(v) || v.length > MAX_OFFICERS) return { error: `قائمة المسؤولين: حتى ${MAX_OFFICERS}` };
  const out: Officer[] = [];
  for (const raw of v) {
    const o = (raw ?? {}) as Record<string, unknown>;
    const name = typeof o.name === 'string' ? o.name.trim().slice(0, 60) : '';
    const whatsapp = typeof o.whatsapp === 'string' ? o.whatsapp.replace(/\D/g, '') : '';
    const telegram = typeof o.telegram === 'string' ? o.telegram.trim().replace(/^https?:\/\//, '').replace(/^t\.me\//, '').replace(/^@/, '') : '';
    if (!name) return { error: 'اسم المسؤول مطلوب' };
    if (whatsapp && !/^\d{8,15}$/.test(whatsapp)) return { error: `رقم واتساب غير صالح (${name})` };
    if (telegram && !/^[A-Za-z0-9_]{4,32}$/.test(telegram)) return { error: `معرّف تيليغرام غير صالح (${name})` };
    if (!whatsapp && !telegram) return { error: `أضف واتساب أو تيليغرام للمسؤول (${name})` };
    out.push({ name, whatsapp, telegram, active: o.active !== false });
  }
  return { value: out };
}

// Stored JSON -> list (a row from before the column existed has null).
export const readOfficers = (stored: unknown): Officer[] => {
  const r = parseOfficers(stored ?? []);
  return 'value' in r ? r.value : [];
};
