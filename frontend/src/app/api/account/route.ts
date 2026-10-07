import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { isHttpsUrl } from '@/lib/safeUrl';

export async function GET(request: NextRequest) {
  const currentUser = await getUserFromRequest(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
  }

  let teacherProfile = null;
  let ambassadorProfile = null;

  if (currentUser.role === 'TEACHER') {
    teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: currentUser.id },
      include: { payouts: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });
  } else if (currentUser.role === 'AMBASSADOR') {
    ambassadorProfile = await prisma.ambassadorProfile.findUnique({
      where: { userId: currentUser.id },
    });
  }

  return NextResponse.json({ user: currentUser, teacherProfile, ambassadorProfile });
}

export async function PUT(request: NextRequest) {
  const currentUser = await getUserFromRequest(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
  }

  const body = await request.json();
  // The avatar is shown in the feed and on cards: https only (no data:, javascript: or plain http).
  if (body.avatar && !isHttpsUrl(String(body.avatar).trim(), 500)) {
    return NextResponse.json({ error: 'رابط الصورة الشخصية يجب أن يبدأ بـ https://' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: currentUser.id },
    data: {
      name: body.name ? String(body.name).trim() : currentUser.name,
      avatar: body.avatar !== undefined ? (body.avatar ? String(body.avatar).trim() : null) : currentUser.avatar,
      jobTitle: body.jobTitle !== undefined ? (body.jobTitle ? String(body.jobTitle).trim() : null) : (currentUser as any).jobTitle,
      bio: body.bio !== undefined ? (body.bio ? String(body.bio).trim() : null) : (currentUser as any).bio,
      facebook: body.facebook !== undefined ? body.facebook : (currentUser as any).facebook,
      instagram: body.instagram !== undefined ? body.instagram : (currentUser as any).instagram,
      linkedin: body.linkedin !== undefined ? body.linkedin : (currentUser as any).linkedin,
      telegram: body.telegram !== undefined ? (body.telegram ? String(body.telegram).replace('@', '').trim() : null) : (currentUser as any).telegram,
      youtube: body.youtube !== undefined ? body.youtube : (currentUser as any).youtube,
      whatsapp: body.whatsapp !== undefined ? body.whatsapp : (currentUser as any).whatsapp,
      website: body.website !== undefined ? body.website : (currentUser as any).website,
      twitter: body.twitter !== undefined ? body.twitter : (currentUser as any).twitter,
      github: body.github !== undefined ? body.github : (currentUser as any).github,
      phone: body.phone !== undefined ? body.phone : currentUser.phone,
      wilayaCode: body.wilayaCode !== undefined ? (body.wilayaCode ? Number(body.wilayaCode) : null) : currentUser.wilayaCode,
      wilayaName: body.wilayaName !== undefined ? body.wilayaName : currentUser.wilayaName,
      institutionName: body.institutionName !== undefined ? body.institutionName : (body.university !== undefined ? body.university : currentUser.institutionName),
      specialty: body.specialty !== undefined ? body.specialty : currentUser.specialty,
    },
    select: {
      id: true, email: true, name: true, avatar: true, role: true, phone: true,
      jobTitle: true, adminRole: true, bio: true, facebook: true, instagram: true,
      linkedin: true, telegram: true, youtube: true, whatsapp: true, website: true, twitter: true, github: true,
      wilayaCode: true, wilayaName: true, institutionId: true, institutionName: true,
      track: true, specialty: true, academicYear: true, studentCardId: true,
      isVerified: true, createdAt: true, updatedAt: true,
    },
  });

  // If user is a TEACHER, update or create TeacherProfile
  let teacherProfile = null;
  if (user.role === 'TEACHER') {
    teacherProfile = await prisma.teacherProfile.upsert({
      where: { userId: user.id },
      update: {
        university: body.university || body.institutionName || user.institutionName || 'Université Algérienne',
        specialty: body.specialty !== undefined ? body.specialty : user.specialty,
        ccpAccount: body.ccpAccount !== undefined ? body.ccpAccount : undefined,
        ccpCle: body.ccpCle !== undefined ? body.ccpCle : undefined,
      },
      create: {
        userId: user.id,
        university: body.university || body.institutionName || user.institutionName || 'Université Algérienne',
        specialty: body.specialty || user.specialty || null,
        ccpAccount: body.ccpAccount || null,
        ccpCle: body.ccpCle || null,
      },
    });
  }

  // If user is an AMBASSADOR, update or create AmbassadorProfile
  let ambassadorProfile = null;
  if (user.role === 'AMBASSADOR') {
    ambassadorProfile = await prisma.ambassadorProfile.upsert({
      where: { userId: user.id },
      update: {
        institutionNameAr: body.institutionName || user.institutionName || 'الجامعة',
        institutionNameFr: body.institutionNameFr || null,
        specialtyName: body.specialty !== undefined ? body.specialty : user.specialty,
        phone: body.phone !== undefined ? body.phone : user.phone,
        telegramHandle: body.telegramHandle !== undefined ? String(body.telegramHandle).replace('@', '') : undefined,
        bioAr: body.bioAr !== undefined ? body.bioAr : undefined,
      },
      create: {
        userId: user.id,
        wilayaCode: user.wilayaCode || 16,
        wilayaNameAr: user.wilayaName || 'الجزائر',
        institutionNameAr: body.institutionName || user.institutionName || 'الجامعة',
        specialtyName: body.specialty || user.specialty || null,
        phone: body.phone || user.phone || null,
        telegramHandle: body.telegramHandle ? String(body.telegramHandle).replace('@', '') : null,
        bioAr: body.bioAr || null,
        promoCode: `WIL${user.wilayaCode || 16}-AMB${randomBytes(3).toString('hex').toUpperCase()}`,
        // Staff verify ambassadors; until then the code does not give discounts or commission.
        isVerified: false,
      },
    });
  }

  return NextResponse.json({ user, teacherProfile, ambassadorProfile });
}
