import { prisma } from '@/lib/db';

// DZ-FND-16-0001: type prefix, wilaya code, then a 4-digit running number per prefix and wilaya.
// The number comes from an atomic counter row, so two sign-ups can never get the same card,
// and a database trigger (prisma/manual-migrations/phase8) stops a card number from being changed afterwards.
export async function generateCardId(prefix: string, wilayaCode: number | string = 16): Promise<string> {
  const wilaya = Number.isInteger(Number(wilayaCode)) && Number(wilayaCode) > 0 && Number(wilayaCode) < 100 ? Number(wilayaCode) : 16;
  const key = `${prefix}-${wilaya}`;
  const { value } = await prisma.cardCounter.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `DZ-${prefix}-${wilaya}-${String(value).padStart(4, '0')}`;
}
