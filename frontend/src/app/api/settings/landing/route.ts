import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requirePermission } from '@/lib/auth';
import { stripUnsafeUrls } from '@/lib/safeUrl';

export async function GET() {
  await ensureSeeded();

  // 1. Fetch settings from database
  const settings = await prisma.platformSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });

  // 2. Compute live database metrics
  let realExamsCount = 0;
  let realStudentsCount = 0;
  let realWilayasCount = 0;

  try {
    const [examCount, studentCount, distinctWilayas] = await Promise.all([
      prisma.exam.count(),
      prisma.user.count({
        where: { role: { in: ['STUDENT_FREE', 'STUDENT_PAID'] } },
      }),
      prisma.user.findMany({
        select: { wilayaCode: true },
        distinct: ['wilayaCode'],
      }),
    ]);

    // Real counts only: nothing is added to them and no floor is applied.
    realExamsCount = examCount;
    realStudentsCount = studentCount;
    realWilayasCount = distinctWilayas.filter((w) => w.wilayaCode != null).length;
  } catch (e) {
    console.error('Error fetching real DB counts for landing page:', e);
  }

  // satisfactionRate was a hard-coded "99.8%": there is no survey behind it, so it is not reported.
  const realStats = {
    examsCount: String(realExamsCount),
    studentsCount: String(realStudentsCount),
    wilayasCount: String(realWilayasCount),
    satisfactionRate: null as string | null,
  };

  return NextResponse.json({
    landingConfig: settings.landingConfig || null,
    ambassadorTelegram: settings.ambassadorTelegram || 'MrK_ADMIN00',
    whatsappNumber: settings.whatsappNumber || 'https://wa.me/qr/5473INCXN3HJI1',
    telegramUsername: settings.telegramUsername || 'dzprime_academy',
    realStats,
  });
}

export async function PUT(request: NextRequest) {
  const authResult = await requirePermission(request, 'settings.manage');
  if ('error' in authResult) return authResult.error;

  const raw = await request.text();
  // Landing images are uploaded to storage and referenced by URL. Inline data (base64) is what made saves exceed
  // the host's 4.5MB body limit and made the public page 7MB, so it is refused here.
  if (raw.length > 200_000) {
    return NextResponse.json({ error: 'إعدادات الصفحة كبيرة جداً. ارفع الصور عبر زر الرفع بدلاً من إدراجها مباشرة' }, { status: 413 });
  }
  let body: Record<string, any>;
  try {
    body = JSON.parse(raw) ?? {};
  } catch {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  }
  // Older saves hold inline base64 images; the editor sends them back untouched, so refusing would lock the admin
  // out of every save. They are dropped (the editor shows which ones need re-uploading) and the count is returned.
  const cleaned = stripUnsafeUrls(body);
  body = cleaned.value;

  const settings = await prisma.platformSettings.upsert({
    where: { id: 'singleton' },
    update: {
      landingConfig: body.landingConfig !== undefined ? body.landingConfig : undefined,
      ambassadorTelegram: body.ambassadorTelegram !== undefined ? String(body.ambassadorTelegram) : undefined,
      whatsappNumber: body.whatsappNumber !== undefined ? String(body.whatsappNumber) : undefined,
      telegramUsername: body.telegramUsername !== undefined ? String(body.telegramUsername) : undefined,
    },
    create: {
      id: 'singleton',
      landingConfig: body.landingConfig || {},
      ambassadorTelegram: body.ambassadorTelegram || 'MrK_ADMIN00',
      whatsappNumber: body.whatsappNumber || 'https://wa.me/qr/5473INCXN3HJI1',
      telegramUsername: body.telegramUsername || 'dzprime_academy',
    },
  });

  return NextResponse.json({
    success: true,
    settings,
    removedInlineImages: cleaned.removed,
  });
}
