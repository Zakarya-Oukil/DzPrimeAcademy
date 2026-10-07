import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { getUserFromRequest, requirePermission } from '@/lib/auth';
import { hasAnyPermission } from '@/lib/rbac';
import { guard } from '@/lib/http';
import { isUnsafeUrlString, stripUnsafeUrls } from '@/lib/safeUrl';

// Public readers (checkout, contact buttons, upgrade modal) get only what they display. The rest (commission
// rate, landing and footer JSON, auto-verify) is for staff with settings.manage. A read never writes.
async function GETHandler(request: NextRequest) {
  await ensureSeeded();
  const settings = (await prisma.platformSettings.findUnique({ where: { id: 'singleton' } })) ?? {
    id: 'singleton',
    academicYear: '2025/2026',
    ambassadorCommissionRate: 10,
    baridiMobEnabled: true,
    edahabiaEnabled: true,
    ccpReceiptsEnabled: true,
    autoVerifyCards: false,
    whatsappNumber: null,
    telegramUsername: null,
    ambassadorTelegram: null,
    linkedinUrl: null,
    landingConfig: null,
    footerConfig: null,
    vipPriceDzd: 10000,
  };

  const user = await getUserFromRequest(request);
  if (user && hasAnyPermission(user, 'settings.manage')) return NextResponse.json(settings);

  const {
    academicYear, baridiMobEnabled, edahabiaEnabled, ccpReceiptsEnabled,
    whatsappNumber, telegramUsername, ambassadorTelegram, linkedinUrl, vipPriceDzd,
  } = settings;
  return NextResponse.json({
    academicYear, baridiMobEnabled, edahabiaEnabled, ccpReceiptsEnabled,
    whatsappNumber, telegramUsername, ambassadorTelegram, linkedinUrl, vipPriceDzd,
  });
}

async function PUTHandler(request: NextRequest) {
  const authResult = await requirePermission(request, 'settings.manage');
  if ('error' in authResult) return authResult.error;

  const body = (await request.json()) ?? {};
  if (typeof body !== 'object' || Array.isArray(body) || JSON.stringify(body).length > 400_000) {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  }
  // Links stored here are rendered as hrefs for every visitor: no javascript:/data: schemes anywhere.
  for (const k of ['whatsappNumber', 'linkedinUrl'] as const) {
    if (body[k] !== undefined && (typeof body[k] !== 'string' || isUnsafeUrlString(body[k]))) {
      return NextResponse.json({ error: 'رابط غير صالح' }, { status: 400 });
    }
  }
  if (body.landingConfig !== undefined) body.landingConfig = stripUnsafeUrls(body.landingConfig).value;
  if (body.footerConfig !== undefined) body.footerConfig = stripUnsafeUrls(body.footerConfig).value;
  const rate = body.ambassadorCommissionRate;
  const vip = body.vipPriceDzd;
  if ((rate !== undefined && !(Number.isInteger(Number(rate)) && Number(rate) >= 0 && Number(rate) <= 100)) ||
      (vip !== undefined && !(Number.isInteger(Number(vip)) && Number(vip) >= 0))) {
    return NextResponse.json({ error: 'نسبة العمولة بين 0 و100 وسعر VIP عدد صحيح غير سالب' }, { status: 400 });
  }

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

export const GET = guard(GETHandler);
export const PUT = guard(PUTHandler);
