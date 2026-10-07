import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { DEFAULT_FOOTER_CONFIG, FooterConfig } from '@/lib/footerConfig';

export async function GET() {
  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { id: 'singleton' },
      select: {
        footerConfig: true,
        whatsappNumber: true,
        telegramUsername: true,
        linkedinUrl: true,
      },
    });

    const saved = (settings?.footerConfig as unknown as FooterConfig) || null;

    if (!saved) {
      return NextResponse.json(DEFAULT_FOOTER_CONFIG);
    }

    // Merge with defaults to ensure all required fields exist
    const merged: FooterConfig = {
      brandBio: {
        descriptionAr: saved.brandBio?.descriptionAr || DEFAULT_FOOTER_CONFIG.brandBio.descriptionAr,
        descriptionFr: saved.brandBio?.descriptionFr || DEFAULT_FOOTER_CONFIG.brandBio.descriptionFr,
      },
      socialLinks: Array.isArray(saved.socialLinks) ? saved.socialLinks : DEFAULT_FOOTER_CONFIG.socialLinks,
      quickLinks: Array.isArray(saved.quickLinks) ? saved.quickLinks : DEFAULT_FOOTER_CONFIG.quickLinks,
      ecosystemItems: Array.isArray(saved.ecosystemItems) ? saved.ecosystemItems : DEFAULT_FOOTER_CONFIG.ecosystemItems,
      contactInfo: {
        phone: saved.contactInfo?.phone || DEFAULT_FOOTER_CONFIG.contactInfo.phone,
        email: saved.contactInfo?.email || DEFAULT_FOOTER_CONFIG.contactInfo.email,
        addressAr: saved.contactInfo?.addressAr || DEFAULT_FOOTER_CONFIG.contactInfo.addressAr,
        addressFr: saved.contactInfo?.addressFr || DEFAULT_FOOTER_CONFIG.contactInfo.addressFr,
      },
      bottomBar: {
        copyrightAr: saved.bottomBar?.copyrightAr || DEFAULT_FOOTER_CONFIG.bottomBar.copyrightAr,
        copyrightFr: saved.bottomBar?.copyrightFr || DEFAULT_FOOTER_CONFIG.bottomBar.copyrightFr,
        sloganAr: saved.bottomBar?.sloganAr || DEFAULT_FOOTER_CONFIG.bottomBar.sloganAr,
        sloganFr: saved.bottomBar?.sloganFr || DEFAULT_FOOTER_CONFIG.bottomBar.sloganFr,
      },
    };

    return NextResponse.json(merged);
  } catch (error: any) {
    console.error('Error fetching footer config:', error);
    return NextResponse.json(DEFAULT_FOOTER_CONFIG);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requirePermission(request, 'settings.manage');
    if ('error' in authResult) return authResult.error;

    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid configuration payload' }, { status: 400 });
    }

    // Upsert into platform settings
    const updated = await prisma.platformSettings.upsert({
      where: { id: 'singleton' },
      update: {
        footerConfig: body,
      },
      create: {
        id: 'singleton',
        footerConfig: body,
      },
    });

    return NextResponse.json({
      success: true,
      footerConfig: updated.footerConfig,
    });
  } catch (error: any) {
    console.error('Error updating footer config:', error);
    return NextResponse.json({ error: error.message || 'Failed to update footer configuration' }, { status: 500 });
  }
}
