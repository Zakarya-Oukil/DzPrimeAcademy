import { NextRequest, NextResponse } from 'next/server';
import { generateCardId } from '@/lib/cardId';
import { prisma } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { canManageUser } from '@/lib/rbac';
import { hashPassword, requirePermission } from '@/lib/auth';
import { generateTempPassword, passwordProblem } from '@/lib/passwords';

export async function GET(request: NextRequest) {
  const authResult = await requirePermission(request, 'users.manage');
  if ('error' in authResult) return authResult.error;

  await ensureSeeded();
  const users = await prisma.user.findMany({
    where: {
      role: { in: ['STUDENT_FREE', 'STUDENT_PAID'] },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      phone: true,
      wilayaCode: true,
      wilayaName: true,
      institutionName: true,
      track: true,
      specialty: true,
      academicYear: true,
      studentCardId: true,
      isVerified: true,
      createdAt: true,
    },
  });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermission(request, 'users.manage');
  if ('error' in authResult) return authResult.error;

  await ensureSeeded();
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      phone,
      wilayaCode,
      wilayaName,
      institutionName,
      track,
      specialty,
      academicYear,
      role = 'STUDENT_PAID',
    } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'الاسم والبريد الإلكتروني مطلوبان' }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: 'هذا البريد الإلكتروني مسجل مسبقاً' }, { status: 409 });
    }

    if (password && passwordProblem(String(password).trim())) {

      return NextResponse.json({ error: passwordProblem(String(password).trim()) }, { status: 400 });

    }

    const clearPassword = password && !passwordProblem(String(password).trim())
      ? String(password).trim()
      : generateTempPassword();

    const passwordHash = await hashPassword(clearPassword);
    const parsedWilaya = wilayaCode ? Number(wilayaCode) : 16;
    const cardPrefix = role === 'STUDENT_PAID' ? 'GLD' : 'STU';

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: String(name).trim(),
        passwordHash,
        mustChangePassword: true,
        role: role === 'STUDENT_PAID' ? 'STUDENT_PAID' : 'STUDENT_FREE',
        phone: phone ? String(phone).trim() : null,
        wilayaCode: parsedWilaya,
        wilayaName: wilayaName || 'Alger',
        institutionName: institutionName || 'جامعة باب الزوار USTHB',
        track: track || 'UNIVERSITY_LMD',
        specialty: specialty || null,
        academicYear: academicYear || '2025/2026',
        studentCardId: generateCardId(cardPrefix, parsedWilaya),
        isVerified: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        wilayaCode: true,
        wilayaName: true,
        institutionName: true,
        track: true,
        specialty: true,
        academicYear: true,
        studentCardId: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ...user, tempPassword: clearPassword }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'فشل إضافة الطالب' }, { status: 500 });
  }
}

const STUDENT_ROLES = ['STUDENT_FREE', 'STUDENT_PAID'] as const;

// Edits a student account. This endpoint can only touch students and can only set
// student roles: changing anyone's staff/teacher/ambassador role goes through the
// staff, teachers and ambassadors endpoints, which enforce the hierarchy.
export async function PUT(request: NextRequest) {
  const authResult = await requirePermission(request, 'users.manage');
  if ('error' in authResult) return authResult.error;

  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== 'string') {
    return NextResponse.json({ error: 'معرف الطالب مطلوب' }, { status: 400 });
  }
  const { id, ...data } = body;

  if (data.role !== undefined && !(STUDENT_ROLES as readonly string[]).includes(data.role)) {
    return NextResponse.json({ error: 'دور غير مسموح به' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, adminRole: true } });
  if (!target) {
    return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 });
  }
  if (!(STUDENT_ROLES as readonly string[]).includes(target.role) || !canManageUser(authResult.user, target)) {
    return NextResponse.json({ error: 'ليس لديك الصلاحية لتعديل هذا الحساب' }, { status: 403 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      role: data.role,
      isVerified: typeof data.isVerified === 'boolean' ? data.isVerified : undefined,
      wilayaCode: data.wilayaCode,
      wilayaName: data.wilayaName,
      institutionName: data.institutionName,
      track: data.track,
      specialty: data.specialty,
      academicYear: data.academicYear,
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      phone: true,
      wilayaCode: true,
      wilayaName: true,
      institutionName: true,
      track: true,
      specialty: true,
      academicYear: true,
      studentCardId: true,
      isVerified: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user);
}
