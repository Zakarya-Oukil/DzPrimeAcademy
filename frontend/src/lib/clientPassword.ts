// Browser twin of generateTempPassword() in passwords.ts (same alphabet and shape), using crypto.getRandomValues.
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGIT = '23456789';
const SYMBOL = '!@#$%*?';

// Uniform index in [0, n) without modulo bias (rejection sampling on a 32-bit draw).
function randomIndex(n: number): number {
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % n;
}

const pick = (set: string) => set[randomIndex(set.length)];

export function generateStrongPassword(): string {
  const chars = [pick(UPPER), pick(LOWER), pick(DIGIT), pick(SYMBOL)];
  while (chars.length < 14) chars.push(pick(UPPER + LOWER + DIGIT));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
