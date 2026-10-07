import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requirePermission } from '@/lib/auth';

export async function GET() {
  await ensureSeeded();
  const settings = await prisma.platformSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const authResult = await requirePermission(request, 'settings.manage');
  if ('error' in authResult) return authResult.error;

  const body = await request.json();

  const settings = await prisma.platformSettings.upsert({
    where: { id: 'singleton' },
    update: {
      academicYear: body.academicYear !== undefined ? body.academicYear : undefined,
      ambassadorCommissionRate: body.ambassadorCommissionRate !== undefined ? Number(body.ambassadorCommissionRate) : undefined,
      baridiMobEnabled: body.baridiMobEnabled !== undefined ? Boolean(body.baridiMobEnabled) : undefined,
      edahabiaEnabled: body.edahabiaEnabled !== undefined ? Boolean(body.edahabiaEnabled) : undefined,
      ccpReceiptsEnabled: body.ccpReceiptsEnabled !== undefined ? Boolean(body.ccpReceiptsEnabled) : undefined,
      autoVerifyCards: body.autoVerifyCards !== undefined ? Boolean(body.autoVerifyCards) : undefined,
      whatsappNumber: body.whatsappNumber !== undefined ? String(body.whatsappNumber) : undefined,
      telegramUsername: body.telegramUsername !== undefined ? String(body.telegramUsername) : undefined,
      ambassadorTelegram: body.ambassadorTelegram !== undefined ? String(body.ambassadorTelegram) : undefined,
      linkedinUrl: body.linkedinUrl !== undefined ? String(body.linkedinUrl) : undefined,
      landingConfig: body.landingConfig !== undefined ? body.landingConfig : undefined,
      footerConfig: body.footerConfig !== undefined ? body.footerConfig : undefined,
      vipPriceDzd: body.vipPriceDzd !== undefined ? Number(body.vipPriceDzd) : undefined,
    },
    create: {
      id: 'singleton',
      academicYear: body.academicYear || '2025/2026',
      ambassadorCommissionRate: body.ambassadorCommissionRate !== undefined ? Number(body.ambassadorCommissionRate) : 10,
      baridiMobEnabled: body.baridiMobEnabled !== undefined ? Boolean(body.baridiMobEnabled) : true,
      edahabiaEnabled: body.edahabiaEnabled !== undefined ? Boolean(body.edahabiaEnabled) : true,
      ccpReceiptsEnabled: body.ccpReceiptsEnabled !== undefined ? Boolean(body.ccpReceiptsEnabled) : true,
      autoVerifyCards: body.autoVerifyCards !== undefined ? Boolean(body.autoVerifyCards) : false,
      whatsappNumber: body.whatsappNumber || 'https://wa.me/qr/5473INCXN3HJI1',
      telegramUsername: body.telegramUsername || 'dzprime_academy',
      ambassadorTelegram: body.ambassadorTelegram || 'MrK_ADMIN00',
      linkedinUrl: body.linkedinUrl || 'https://www.linkedin.com/company/dzprimeacademy',
      landingConfig: body.landingConfig || {},
      footerConfig: body.footerConfig || {},
      vipPriceDzd: body.vipPriceDzd !== undefined ? Number(body.vipPriceDzd) : 10000,
    },
  });

  return NextResponse.json(settings);
}
