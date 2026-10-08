import { randomInt } from 'crypto';

// No look-alike characters (0/O, 1/l/I) so a password read out over the phone or printed on a card survives.
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGIT = '23456789';
const SYMBOL = '!@#$%*?';
const ALL = UPPER + LOWER + DIGIT;

const pick = (set: string) => set[randomInt(set.length)];

// 14 characters from a CSPRNG (~80 bits), always with an upper, lower, digit and symbol. Replaces "Stu"/"Prof"/"Amb"
// plus four digits (9,000 possibilities) made with Math.random.
export function generateTempPassword(): string {
  const chars = [pick(UPPER), pick(LOWER), pick(DIGIT), pick(SYMBOL)];
  while (chars.length < 14) chars.push(pick(ALL));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 128;

// Returns an Arabic error message, or null when the password is acceptable.
export function passwordProblem(pw: unknown): string | null {
  if (typeof pw !== 'string') return 'كلمة المرور غير صالحة';
  if (pw.length < MIN_PASSWORD) return `كلمة المرور يجب أن تكون ${MIN_PASSWORD} خانات على الأقل`;
  if (pw.length > MAX_PASSWORD) return 'كلمة المرور طويلة جداً';
  if (/^\d+$/.test(pw)) return 'كلمة المرور لا يمكن أن تكون أرقاماً فقط';
  return null;
}
