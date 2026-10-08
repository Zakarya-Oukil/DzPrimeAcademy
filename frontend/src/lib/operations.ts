import { prisma } from '@/lib/db';
import { generateCardId } from '@/lib/cardId';

// Thrown for expected failures; routes turn it into a JSON error. Anything else is a 500 with no detail.
export class OpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const AMBASSADOR_DISCOUNT_PERCENT = 15;

// Same mailbox under different spellings: case, "+tag", and dots on gmail-style addresses.
export function normalizeEmail(raw: string): string {
  const [local = '', domain = ''] = raw.trim().toLowerCase().split('@');
  const base = local.split('+')[0];
  return `${/^(gmail|googlemail)\./.test(domain) ? base.replace(/\./g, '') : base}@${domain}`;
}

const digits = (v: string | null | undefined) => (v || '').replace(/\D/g, '');
const ONE_YEAR_MS = 365 * 24 * 3600 * 1000;

export type ResolvedPromo = {
  kind: 'PLATFORM' | 'AMBASSADOR';
  code: string;
  percent: number;
  type: string;
  descriptionAr: string;
  descriptionFr: string;
  ambassadorUserId?: string;
};

// The only place a discount code is interpreted. Returns null for unknown, inactive, expired, full,
// wrong-track codes and for ambassadors that staff have not verified.
export async function resolvePromo(raw: unknown, track?: string | null): Promise<ResolvedPromo | null> {
  const code = typeof raw === 'string' ? raw.trim().toUpperCase().slice(0, 40) : '';
  if (!code) return null;

  const promo = await prisma.promotion.findUnique({ where: { code } });
  if (promo) {
    const live =
      promo.isActive &&
      (!promo.expiresAt || promo.expiresAt > new Date()) &&
      (promo.maxUses == null || promo.usageCount < promo.maxUses) &&
      (promo.applicableTrack === 'ALL' || promo.applicableTrack === track);
    if (!live) return null;
    return {
      kind: 'PLATFORM',
      code: promo.code,
      percent: promo.discountPercent,
      type: promo.type,
      descriptionAr: promo.descriptionAr,
      descriptionFr: promo.descriptionFr,
    };
  }

  const amb = await prisma.ambassadorProfile.findUnique({ where: { promoCode: code } });
  if (amb && amb.isVerified) {
    return {
      kind: 'AMBASSADOR',
      code,
      percent: AMBASSADOR_DISCOUNT_PERCENT,
      type: 'AMBASSADOR',
      descriptionAr: `كود السفير المعتمد — ولاية ${amb.wilayaNameAr}`,
      descriptionFr: `Code Ambassadeur Agréé — Wilaya ${amb.wilayaCode}`,
      ambassadorUserId: amb.userId,
    };
  }
  return null;
}

// What the platform charges, from the database. The client's amount is never trusted.
export async function priceTarget(type: string, targetId: string | null) {
  if (type === 'VIP_MEMBERSHIP_UPGRADE') {
    const s = await prisma.platformSettings.findUnique({ where: { id: 'singleton' } });
    return { listPrice: s?.vipPriceDzd ?? 10000, title: null as string | null, track: null as string | null };
  }
  if (type === 'BUNDLE_PURCHASE') {
    const bundle = targetId ? await prisma.bundle.findUnique({ where: { id: targetId } }) : null;
    if (!bundle || !bundle.isActive) throw new OpError(404, 'الباقة غير متوفرة');
    return { listPrice: bundle.currentPriceDzd, title: bundle.titleAr, track: bundle.track as string };
  }
  if (type === 'COURSE_ENROLLMENT') {
    const course = targetId ? await prisma.course.findUnique({ where: { id: targetId } }) : null;
    if (!course) throw new OpError(404, 'المقرر غير موجود');
    return { listPrice: course.priceDzd, title: course.titleAr, track: course.category as string };
  }
  return { listPrice: 0, title: null as string | null, track: null as string | null };
}

export function applyDiscount(listPrice: number, percent: number) {
  const discount = Math.min(listPrice, Math.round((listPrice * percent) / 100));
  return { amount: listPrice - discount, discount };
}

export async function approveOperation(id: string, adminName: string, adminNotes?: string) {
  return prisma.$transaction(
    async (tx) => {
      const op = await tx.pendingOperation.findUnique({ where: { id } });
      if (!op) throw new OpError(404, 'العملية غير موجودة');

      // Claim the row first: of N concurrent approvals exactly one sees count 1; the rest wait on the
      // row lock, re-read status and get 0. Everything below therefore runs once per operation.
      const claim = await tx.pendingOperation.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'APPROVED', approvedByAdmin: adminName, approvedAt: new Date(), adminNotes: adminNotes || op.adminNotes },
      });
      if (claim.count === 0) {
        throw new OpError(409, op.status === 'APPROVED' ? 'تمت الموافقة على هذه العملية مسبقاً' : 'هذه العملية مرفوضة ولا يمكن الموافقة عليها');
      }

      if (op.type === 'ACCOUNT_ACTIVATION') {
        if (!op.userId) throw new OpError(400, 'لا يوجد حساب مرتبط بهذه العملية');
        await tx.user.update({ where: { id: op.userId }, data: { isVerified: true } });
        await tx.accountActivationToken.updateMany({ where: { userId: op.userId, used: false }, data: { used: true } });
      }

      if (op.type === 'VIP_MEMBERSHIP_UPGRADE') {
        const user = op.userId ? await tx.user.findUnique({ where: { id: op.userId } }) : null;
        if (!user) throw new OpError(400, 'لا يوجد حساب مرتبط بهذه العملية');
        if (user.role === 'STUDENT_PAID') throw new OpError(409, 'هذا الحساب يملك العضوية الذهبية مسبقاً');
        if (user.role !== 'STUDENT_FREE') throw new OpError(400, 'الترقية متاحة للطلاب المجانيين فقط');
        const cardId = user.studentCardId || generateCardId('STU', user.wilayaCode || 16);
        await tx.user.update({ where: { id: user.id }, data: { role: 'STUDENT_PAID', isVerified: true, studentCardId: cardId } });
        const endDate = new Date(Date.now() + ONE_YEAR_MS);
        await tx.subscription.upsert({
          where: { cardId },
          update: { status: 'ACTIVE', endDate },
          create: { userId: user.id, cardId, planName: 'GOLDEN_MEMBERSHIP', status: 'ACTIVE', endDate },
        });
      }

      if (op.type === 'BUNDLE_PURCHASE') {
        const bundle = op.targetId ? await tx.bundle.findUnique({ where: { id: op.targetId } }) : null;
        if (!bundle) throw new OpError(400, 'الباقة المرتبطة بالعملية غير موجودة');
        await tx.bundlePurchase.create({
          data: {
            bundleId: bundle.id,
            bundleTitleAr: bundle.titleAr,
            userId: op.userId || 'guest-student',
            userName: op.userName,
            amountDzd: op.amountDzd,
            paymentStatus: 'APPROVED_BY_ADMIN',
            operationId: op.id,
          },
        });
      }

      if (op.type === 'COURSE_ENROLLMENT') {
        const course = op.targetId ? await tx.course.findUnique({ where: { id: op.targetId } }) : null;
        if (!op.userId) throw new OpError(400, 'لا يوجد حساب مرتبط بهذه العملية');
        if (!course) throw new OpError(400, 'المقرر المرتبط بالعملية غير موجود');
        await tx.enrollment.upsert({
          where: { studentId_courseId: { studentId: op.userId, courseId: course.id } },
          update: {},
          create: {
            studentId: op.userId,
            courseId: course.id,
            courseTitle: course.titleFr || course.titleAr,
            teacherName: course.teacherName,
          },
        });
      }

      if (op.promoCode) {
        // Same precedence as resolvePromo: a platform campaign wins over an ambassador code.
        const platform = await tx.promotion.findUnique({ where: { code: op.promoCode } });
        const amb = platform ? null : await tx.ambassadorProfile.findUnique({ where: { promoCode: op.promoCode }, include: { user: { select: { email: true, phone: true } } } });
        if (amb) {
          // No self-referral: the buyer must not be the ambassador's account, mailbox or phone.
          const phone = digits(op.userPhone);
          const self =
            (op.userId && op.userId === amb.userId) ||
            (op.userEmail && normalizeEmail(op.userEmail) === normalizeEmail(amb.user.email)) ||
            (phone.length >= 8 && [digits(amb.user.phone), digits(amb.phone)].some((p) => p.length >= 8 && p.slice(-8) === phone.slice(-8)));
          if (!self && op.amountDzd > 0) {
            const settings = await tx.platformSettings.findUnique({ where: { id: 'singleton' } });
            const rate = settings?.ambassadorCommissionRate ?? 10;
            const amount = Math.round((op.amountDzd * rate) / 100);
            await tx.commissionEntry.create({ data: { ambassadorId: amb.id, operationId: op.id, amountDzd: amount, ratePercent: rate } });
            await tx.ambassadorProfile.update({ where: { id: amb.id }, data: { commissionDzd: { increment: amount }, referralsCount: { increment: 1 } } });
          }
        } else if (platform) {
          // Hard cap: the increment only happens while usageCount < maxUses, so concurrent approvals cannot overshoot.
          const used = await tx.$executeRaw`UPDATE "Promotion" SET "usageCount" = "usageCount" + 1 WHERE "id" = ${platform.id} AND ("maxUses" IS NULL OR "usageCount" < "maxUses")`;
          if (used === 0) throw new OpError(409, 'تم استنفاد الحد الأقصى لاستخدام كود التخفيض هذا');
        }
      }

      return tx.pendingOperation.findUniqueOrThrow({ where: { id } });
    },
    { timeout: 15000 }
  );
}

export async function rejectOperation(id: string, adminNotes?: string) {
  const claim = await prisma.pendingOperation.updateMany({
    where: { id, status: 'PENDING' },
    data: { status: 'REJECTED', adminNotes: adminNotes || 'تم الرفض بواسطة الإدارة' },
  });
  if (claim.count === 0) {
    const op = await prisma.pendingOperation.findUnique({ where: { id } });
    if (!op) throw new OpError(404, 'العملية غير موجودة');
    throw new OpError(409, op.status === 'APPROVED' ? 'تمت الموافقة على هذه العملية ولا يمكن رفضها' : 'هذه العملية مرفوضة مسبقاً');
  }
  return prisma.pendingOperation.findUniqueOrThrow({ where: { id } });
}
