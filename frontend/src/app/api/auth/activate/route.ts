import { NextRequest, NextResponse, after } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import { sendActivationEmail } from '@/lib/email';
import { clientIp, rateLimit } from '@/lib/rateLimit';

const SAFE = { id: true, name: true, email: true, role: true, isVerified: true, tokenVersion: true } as const;

// The link activates the account once and signs that visit in. An old or already used link never signs anyone in:
// it only tells the person the account is active and sends them to the login form.
export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    return NextResponse.json({ error: 'رمز التفعيل مفقود أو غير مكتمل' }, { status: 400 });
  }

  const record = await prisma.accountActivationToken.findUnique({ where: { token } });
  if (!record) {
    return NextResponse.json(
      { error: 'رابط التفعيل غير صالح أو غير موجود. يرجى طلب رابط جديد أو تسجيل الدخول.' },
      { status: 404 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: record.userId }, select: SAFE });
  if (!user) {
    return NextResponse.json({ error: 'تعذر العثور على الحساب المرتبط بهذا الرابط. يرجى التواصل مع الدعم.' }, { status: 404 });
  }

  // "Already active" is only true when the account really is active. A link replaced by a newer email (resend)
  // must not claim success for an account that is still waiting.
  // Re-read the account at this moment: a simultaneous click may have activated it a few milliseconds ago.
  const alreadyActive = async () =>
    (await prisma.user.findUnique({ where: { id: user.id }, select: { isVerified: true } }))?.isVerified
      ? NextResponse.json({
          success: true,
          alreadyVerified: true,
          requiresLogin: true,
          message: 'حسابك مفعل بالفعل. سجّل الدخول للمتابعة.',
        })
      : NextResponse.json(
          { error: 'تم استبدال هذا الرابط برابط أحدث. افتح آخر رسالة وصلتك أو اطلب رابطاً جديداً من صفحة الدخول.' },
          { status: 410 }
        );

  if (record.used) return alreadyActive();
  if (record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: 'انتهت صلاحية رابط التفعيل (24 ساعة). يمكنك طلب رابط تفعيل جديد من صفحة الدخول.' },
      { status: 410 }
    );
  }

  // Claim this link (one use) and activate in ONE transaction. Of simultaneous clicks only one gets count 1; the
  // others wait for that commit, then find the link used and the account already active.
  const won = await prisma.$transaction(async (tx) => {
    const claim = await tx.accountActivationToken.updateMany({
      where: { token, used: false, expiresAt: { gt: new Date() } },
      data: { used: true },
    });
    if (claim.count === 0) return false;
    await tx.accountActivationToken.updateMany({ where: { userId: user.id, used: false }, data: { used: true } });
    if (!user.isVerified) {
      await tx.user.update({ where: { id: user.id }, data: { isVerified: true } });
      await tx.pendingOperation.updateMany({
        where: { userId: user.id, type: 'ACCOUNT_ACTIVATION', status: 'PENDING' },
        data: { status: 'APPROVED', approvedByAdmin: 'AUTO_EMAIL_VERIFIED', approvedAt: new Date() },
      });
    }
    return true;
  });
  if (!won) return alreadyActive();

  const { tokenVersion, ...publicUser } = user;
  if (user.isVerified) {
    // Verified earlier (for example approved by staff): a valid unused link still proves the mailbox, sign in.
    const response = NextResponse.json({ success: true, alreadyVerified: true, message: 'حسابك مفعل وجاهز. تم تسجيل دخولك.', user: publicUser });
    setAuthCookie(response, signToken(user.id, tokenVersion));
    return response;
  }

  const response = NextResponse.json({
    success: true,
    message: 'تم تفعيل حسابك بنجاح! يمكنك الآن الاستفادة من جميع الميزات.',
    user: { ...publicUser, isVerified: true },
  });
  setAuthCookie(response, signToken(user.id, tokenVersion));
  return response;
}

// POST: resend the activation email. The answer is the same for unknown and already active addresses, so this
// cannot be used to find out who is registered, and it is limited per device and per mailbox.
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) ?? {};
  const { email } = body;
  const locale = ['ar', 'fr', 'en'].includes(body.locale) ? (body.locale as string) : 'ar';

  if (typeof email !== 'string' || !email || email.length > 254) {
    return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 });
  }
  const normalizedEmail = email.toLowerCase().trim();
  if (!rateLimit(`resend:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'محاولات كثيرة، حاول لاحقاً' }, { status: 429 });
  }

  const same = { success: true, message: 'إذا كان الحساب بحاجة إلى تفعيل، تم إرسال رابط جديد إلى بريدك الإلكتروني' };
  if (!rateLimit(`resend-mail:${normalizedEmail}`, 6, 60 * 60 * 1000)) return NextResponse.json(same);

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || user.isVerified) return NextResponse.json(same);

  await prisma.accountActivationToken.updateMany({ where: { userId: user.id, used: false }, data: { used: true } });
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.accountActivationToken.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });

  // Sent after the answer, so a registered address does not respond slower than an unknown one.
  after(async () => {
    try {
      await sendActivationEmail({ to: normalizedEmail, name: user.name, token, locale });
    } catch (e) {
      console.error('Failed to send activation email:', e);
    }
  });

  return NextResponse.json(same);
}
