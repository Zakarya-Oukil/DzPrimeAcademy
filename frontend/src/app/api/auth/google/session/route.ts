import { NextRequest, NextResponse } from 'next/server';
import { generateCardId } from '@/lib/cardId';
import { prisma } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { session_id } = await request.json();
  if (!session_id) {
    return NextResponse.json({ error: 'session_id مطلوب' }, { status: 400 });
  }

  const upstream = await fetch('https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data', {
    headers: { 'X-Session-ID': session_id },
  });

  if (!upstream.ok) {
    return NextResponse.json({ error: 'فشل التحقق من جلسة Google' }, { status: 401 });
  }

  const data = await upstream.json();
  const { email, name, picture, session_token } = data;

  if (!email || !session_token) {
    return NextResponse.json({ error: 'استجابة غير صالحة من Google' }, { status: 502 });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    const studentCardId = generateCardId('STU', 16);
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name || normalizedEmail.split('@')[0],
        avatar: picture || null,
        role: 'STUDENT_FREE',
        studentCardId,
        isVerified: false,
      },
    });
  }

  await prisma.session.create({
    data: {
      userId: user.id,
      sessionToken: session_token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const { passwordHash, ...safeUser } = user;
  const response = NextResponse.json({ user: safeUser });
  setSessionCookie(response, session_token);
  return response;
}
