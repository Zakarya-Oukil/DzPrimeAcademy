import { randomBytes } from 'crypto';

// No 0/O/1/I so IDs stay readable when printed on a card.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// DZ-STU-16-K7M2QX9P: 8 random characters (~40 bits) instead of the old 4 digits,
// so cards cannot be enumerated and collisions are negligible.
export function generateCardId(prefix: string, wilayaCode: number | string = 16): string {
  const wilaya = Number.isInteger(Number(wilayaCode)) && Number(wilayaCode) > 0 && Number(wilayaCode) < 100 ? Number(wilayaCode) : 16;
  const bytes = randomBytes(8);
  let suffix = '';
  for (const b of bytes) suffix += ALPHABET[b % ALPHABET.length];
  return `DZ-${prefix}-${wilaya}-${suffix}`;
}

// Matches new IDs and the legacy 4-digit ones.
const CARD_ID_PATTERN = /^DZ-[A-Z]{3}-\d{1,3}-[A-Z0-9]{4,12}$/;

// Returns the canonical (upper-case) card ID, or null if the text is not shaped like one.
// Callers must do an exact match with the result, never a pattern/ILIKE match.
export function normalizeCardId(raw: string): string | null {
  const id = raw.trim().toUpperCase();
  return CARD_ID_PATTERN.test(id) ? id : null;
}
