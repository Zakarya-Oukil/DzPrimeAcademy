import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import {
  hashPassword,
  verifyPassword,
  signToken,
  setAuthCookie,
  checkBruteForce,
  recordFailedAttempt,
  clearFailedAttempts,
} from '@/lib/auth';
import { clientIp, countHit, rateLimit } from '@/lib/rateLimit';

// Compared against when the email is unknown, so a missing account costs the same time as a wrong password.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= hashPassword(randomBytes(12).toString('hex')));

const BAD_LOGIN = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    if (!rateLimit(`login:${ip}`, 30, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'محاولات كثيرة من هذا الجهاز. حاول بعد قليل' }, { status: 429 });
    }

    const body = (await request.json().catch(() => null)) ?? {};
    const { email, password } = body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 });
    }
    if (email.length > 254 || password.length > 128) {
      return NextResponse.json({ error: BAD_LOGIN }, { status: 401 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    // The lockout is per (account, device address): someone typing wrong passwords for your email from their own
    // connection locks only themselves out of it, not you.
    const attemptKey = `${normalizedEmail}|${ip}`;
    const { locked, retryAfterMinutes } = await checkBruteForce(attemptKey);
    if (locked) {
      return NextResponse.json(
        { error: `تم قفل المحاولات مؤقتاً بسبب كلمات مرور خاطئة متكررة. حاول بعد ${retryAfterMinutes} دقيقة` },
        { status: 429 }
      );
    }

    // Many different addresses guessing at one account: nobody gets locked out (that would be a way to lock the
    // owner out), but every attempt on that account slows down once it is being hammered.
    if (countHit(`login-mail:${normalizedEmail}`, 60 * 60 * 1000) > 40) await new Promise((r) => setTimeout(r, 1500));

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    const valid = await verifyPassword(password, user?.passwordHash || (await getDummyHash()));
    if (!user || !user.passwordHash || !valid) {
      // Only real accounts get a database row, so random emails cannot grow the table.
      if (user) await recordFailedAttempt(attemptKey);
      if (Math.random() < 0.01) prisma.loginAttempt.deleteMany({ where: { updatedAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) } } }).catch(() => {});
      return NextResponse.json({ error: BAD_LOGIN }, { status: 401 });
    }

    await clearFailedAttempts(attemptKey);

    // Block unverified students / non-staff users from logging in
    const isStaff = user.role === 'ADMIN' || user.role === 'OWNER';
    if (!user.isVerified && !isStaff) {
      return NextResponse.json(
        {
          error: 'حسابك غير مفعّل بعد. يرجى تأكيد بريدك الإلكتروني عبر الرابط المرسل إليك أو انتظار موافقة الإدارة قبل تسجيل الدخول.',
          code: 'ACCOUNT_NOT_VERIFIED',
          requiresVerification: true,
          email: user.email,
          name: user.name,
          phone: user.phone || undefined,
          wilayaName: user.wilayaName || undefined,
        },
        { status: 403 }
      );
    }

    const { passwordHash, tokenVersion, ...safeUser } = user;
    const response = NextResponse.json({ user: safeUser });
    setAuthCookie(response, signToken(user.id, tokenVersion));
    return response;
  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.' }, { status: 500 });
  }
}
