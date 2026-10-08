import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { passwordProblem } from '@/lib/passwords';
import { clientIp, rateLimit } from '@/lib/rateLimit';

class BadLink extends Error {}

export async function POST(request: NextRequest) {
  if (!rateLimit(`reset:${clientIp(request)}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'محاولات كثيرة، حاول لاحقاً' }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) ?? {};
  const { token, newPassword } = body;
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) {
    return NextResponse.json({ error: 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية' }, { status: 400 });
  }
  const problem = passwordProblem(newPassword);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const passwordHash = await hashPassword(newPassword);
  try {
    await prisma.$transaction(async (tx) => {
      // Claim the link first: of two simultaneous uses exactly one gets count 1.
      const claim = await tx.passwordResetToken.updateMany({
        where: { token, used: false, expiresAt: { gt: new Date() } },
        data: { used: true },
      });
      if (claim.count === 0) throw new BadLink();
      const record = await tx.passwordResetToken.findUniqueOrThrow({ where: { token } });
      // New password, every existing login ended, every other pending link dead, lockouts for this account cleared.
      const user = await tx.user.update({
        where: { id: record.userId },
        // Opening the emailed link proves the person controls this mailbox, which also lets the rightful owner
        // take back an address someone else registered first with a password of their own.
        data: { passwordHash, tokenVersion: { increment: 1 }, mustChangePassword: false, isVerified: true },
        select: { email: true },
      });
      await tx.passwordResetToken.updateMany({ where: { userId: record.userId, used: false }, data: { used: true } });
      // startsWith becomes a LIKE in SQL where "_" and "%" are wildcards; match the exact prefix in code so a
      // look-alike address ("a_b" vs "aXb") never has its lockouts cleared by someone else's reset.
      const prefix = `${user.email.toLowerCase()}|`;
      const rows = await tx.loginAttempt.findMany({ where: { identifier: { startsWith: prefix } }, select: { identifier: true } });
      const exact = rows.map((r) => r.identifier).filter((id) => id.startsWith(prefix));
      if (exact.length) await tx.loginAttempt.deleteMany({ where: { identifier: { in: exact } } });
    });
  } catch (e) {
    if (e instanceof BadLink) return NextResponse.json({ error: 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية' }, { status: 400 });
    console.error('Reset password error:', e);
    return NextResponse.json({ error: 'تعذر تغيير كلمة المرور' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
