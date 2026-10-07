import { NextRequest, NextResponse } from 'next/server';
import { generateCardId } from '@/lib/cardId';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { sendActivationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, password, phone, wilayaCode, wilayaName, locale = 'ar' } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 خانات على الأقل' }, { status: 400 });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: 'هذا البريد الإلكتروني مسجل بالفعل' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const studentCardId = generateCardId('STU', wilayaCode || 16);

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      phone: phone || null,
      wilayaCode: wilayaCode || null,
      wilayaName: wilayaName || null,
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

