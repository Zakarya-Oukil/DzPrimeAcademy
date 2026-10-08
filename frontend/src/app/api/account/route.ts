import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { isHttpsUrl } from '@/lib/safeUrl';
import { guard } from '@/lib/http';

async function GETHandler(request: NextRequest) {
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

async function PUTHandler(request: NextRequest) {
  const currentUser = await getUserFromRequest(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
  }

  const body = (await request.json()) ?? {};
  if (typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  }

  // Every free-text field is a string of sane length; every link is https; phone and wilaya have a fixed shape.
  const limits: Record<string, number> = { name: 100, jobTitle: 100, bio: 1000, telegram: 64, whatsapp: 40, phone: 30, wilayaName: 80, institutionName: 150, university: 150, specialty: 150, ccpAccount: 30, ccpCle: 4, bioAr: 1000, telegramHandle: 64, institutionNameFr: 150 };
  for (const [field, max] of Object.entries(limits)) {
    const v = body[field];
    if (v !== undefined && v !== null && (typeof v !== 'string' || v.length > max)) {
      return NextResponse.json({ error: `قيمة الحقل غير صالحة أو طويلة جداً (${field})` }, { status: 400 });
    }
  }
  for (const field of ['facebook', 'instagram', 'linkedin', 'youtube', 'website', 'twitter', 'github']) {
    if (body[field] && (typeof body[field] !== 'string' || !isHttpsUrl(body[field], 300))) {
      return NextResponse.json({ error: `الروابط يجب أن تبدأ بـ https:// (${field})` }, { status: 400 });
    }
  }
  if (body.phone && !/^[0-9+()\s-]{6,30}$/.test(body.phone)) {
    return NextResponse.json({ error: 'رقم الهاتف غير صالح' }, { status: 400 });
  }
  if (body.wilayaCode !== undefined && body.wilayaCode !== null && body.wilayaCode !== '') {
    const w = Number(body.wilayaCode);
    if (!Number.isInteger(w) || w < 1 || w > 58) return NextResponse.json({ error: 'رمز الولاية غير صالح' }, { status: 400 });
  }
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

export const GET = guard(GETHandler);
export const PUT = guard(PUTHandler);
