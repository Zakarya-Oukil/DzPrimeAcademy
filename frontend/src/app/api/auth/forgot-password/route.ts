import { NextRequest, NextResponse, after } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import { clientIp, rateLimit } from '@/lib/rateLimit';

const SAME_ANSWER = {
  success: true,
  message: 'إذا كان هذا البريد مسجلاً، ستتوصل بتعليمات إعادة تعيين كلمة المرور',
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) ?? {};
  const { email, locale = 'ar' } = body;
  if (typeof email !== 'string' || !email || email.length > 254) {
    return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  // Limits per device and per mailbox: nobody can flood a person with reset mails or use this as a mail cannon.
  if (!rateLimit(`forgot:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'محاولات كثيرة، حاول لاحقاً' }, { status: 429 });
  }
  // ponytail: someone else can use up a mailbox's quota. Keeping it at 6 an hour makes that costly; a per-mailbox
  // resend of the still-valid link (instead of silence) is the upgrade if it ever happens.
  if (!rateLimit(`forgot-mail:${normalizedEmail}`, 6, 60 * 60 * 1000)) return NextResponse.json(SAME_ANSWER);

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (user) {
    // Only the newest link works.
    await prisma.passwordResetToken.updateMany({ where: { userId: user.id, used: false }, data: { used: true } });
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt: new Date(Date.now() + 30 * 60000) },
    });
    // Sent after the answer, so a registered address does not respond slower than an unknown one.
    after(async () => {
      try {
        await sendPasswordResetEmail({ to: normalizedEmail, name: user.name, token, locale: String(locale) });
      } catch (e) {
        console.error('Failed to send password reset email:', e);
      }
    });
  }

  // Same answer whether or not the address is registered.
  return NextResponse.json(SAME_ANSWER);
}
