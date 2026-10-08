import { NextRequest, NextResponse } from 'next/server';
import { generateCardId } from '@/lib/cardId';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { passwordProblem } from '@/lib/passwords';
import { sendActivationEmail } from '@/lib/email';
import { clientIp, rateLimit } from '@/lib/rateLimit';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[0-9+()\s-]{6,30}$/;

export async function POST(request: NextRequest) {
  if (!rateLimit(`register:${clientIp(request)}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'محاولات تسجيل كثيرة من هذا الجهاز، حاول لاحقاً' }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) ?? {};
  const { name, email, password, phone, wilayaCode, wilayaName } = body;
  const locale = ['ar', 'fr', 'en'].includes(body.locale) ? (body.locale as string) : 'ar';

  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' || !name.trim() || !email || !password) {
    return NextResponse.json({ error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' }, { status: 400 });
  }
  const cleanName = name.trim();
  if (cleanName.length < 2 || cleanName.length > 100) {
    return NextResponse.json({ error: 'الاسم يجب أن يكون بين 2 و100 حرف' }, { status: 400 });
  }
  const normalizedEmail = email.toLowerCase().trim();
  if (normalizedEmail.length > 254 || !EMAIL.test(normalizedEmail)) {
    return NextResponse.json({ error: 'البريد الإلكتروني غير صالح' }, { status: 400 });
  }
  const problem = passwordProblem(password);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  if (phone !== undefined && phone !== null && phone !== '' && !(typeof phone === 'string' && PHONE.test(phone))) {
    return NextResponse.json({ error: 'رقم الهاتف غير صالح' }, { status: 400 });
  }
  const wilaya = wilayaCode === undefined || wilayaCode === null || wilayaCode === '' ? null : Number(wilayaCode);
  if (wilaya !== null && (!Number.isInteger(wilaya) || wilaya < 1 || wilaya > 58)) {
    return NextResponse.json({ error: 'رمز الولاية غير صالح' }, { status: 400 });
  }
  const cleanWilayaName = typeof wilayaName === 'string' ? wilayaName.trim().slice(0, 80) || null : null;

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: 'هذا البريد الإلكتروني مسجل بالفعل' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const studentCardId = generateCardId('STU', wilaya || 16);

  const user = await prisma.user.create({
    data: {
      name: cleanName,
      email: normalizedEmail,
      passwordHash,
      phone: phone ? String(phone).trim() : null,
      wilayaCode: wilaya,
      wilayaName: cleanWilayaName,
      role: 'STUDENT_FREE',
      studentCardId,
      isVerified: false,
    },
    select: {
      id: true, email: true, name: true, avatar: true, role: true, phone: true,
      wilayaCode: true, wilayaName: true, institutionId: true, institutionName: true,
      track: true, specialty: true, academicYear: true, studentCardId: true,
      isVerified: true, createdAt: true, updatedAt: true,
    },
  });

  // Generate 24-hour Account Activation Token
  const activationTokenHex = crypto.randomBytes(32).toString('hex');
  await prisma.accountActivationToken.create({
    data: {
      token: activationTokenHex,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  // Dispatch activation email (Resend / Gmail SMTP / Dev console preview)
  try {
    await sendActivationEmail({
      to: normalizedEmail,
      name: user.name,
      token: activationTokenHex,
      locale,
    });
  } catch (emailErr) {
    console.error('Failed to send activation email:', emailErr);
  }

  // Create Pending Operation record for the Admin dashboard
  try {
    await prisma.pendingOperation.create({
      data: {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone,
        userWilaya: user.wilayaName || (user.wilayaCode ? `ولاية ${user.wilayaCode}` : null),
        type: 'ACCOUNT_ACTIVATION',
        status: 'PENDING',
        title: locale === 'ar' ? 'طلب تفعيل حساب جديد' : 'Activation de nouveau compte',
        details: `ID: ${studentCardId}`,
        amountDzd: 0,
      },
    });
  } catch (opErr) {
    console.error('Failed to record pending operation for registration:', opErr);
  }

  // Student account is created in unverified state (isVerified: false).
  // Do NOT issue an auth cookie: the student cannot sign in until they verify their email or get confirmed by admins.
  return NextResponse.json(
    {
      user,
      requiresActivation: true,
      message:
        locale === 'ar'
          ? 'تم إنشاء حسابك بنجاح! يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب قبل تسجيل الدخول.'
          : 'Compte créé avec succès ! Veuillez vérifier votre email pour activer votre compte avant de vous connecter.',
    },
    { status: 201 }
  );
}
