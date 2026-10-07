import { prisma } from './db';
import { hashPassword } from './auth';
import { passwordProblem } from './passwords';
import { generateCardId } from './cardId';
import {
  WILAYAS,
  INSTITUTIONS,
  FACULTIES,
  SPECIALTIES,
  ACADEMIC_YEARS,
  MODULES,
  EXAMS,
} from './initial-data';

let seedingPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (seedingPromise) return seedingPromise;
  seedingPromise = runSeed().catch((err) => {
    seedingPromise = null;
    throw err;
  });
  return seedingPromise;
}

async function runSeed(): Promise<void> {
  const wilayaCount = await prisma.wilaya.count();

  if (wilayaCount === 0) {
    await prisma.wilaya.createMany({ data: WILAYAS, skipDuplicates: true });

    await prisma.institution.createMany({
      data: INSTITUTIONS.map((i) => ({ ...i })),
      skipDuplicates: true,
    });

    await prisma.faculty.createMany({ data: FACULTIES, skipDuplicates: true });
    await prisma.specialty.createMany({ data: SPECIALTIES, skipDuplicates: true });
    await prisma.academicYear.createMany({ data: ACADEMIC_YEARS, skipDuplicates: true });

    await prisma.module.createMany({
      data: MODULES.map((m) => ({
        id: m.id,
        nameAr: m.nameAr,
        nameFr: m.nameFr,
        code: m.code,
        coefficient: m.coefficient,
        academicYearId: m.academicYearId,
        examsCount: m.examsCount || 0,
      })),
      skipDuplicates: true,
    });

    await prisma.exam.createMany({
      data: EXAMS.map((e) => ({
        id: e.id,
        title: e.title,
        year: e.year,
        termType: e.termType,
        fileUrl: e.fileUrl,
        solutionUrl: e.solutionUrl,
        isFreeSample: e.isFreeSample,
        downloadsCount: e.downloadsCount,
        moduleId: e.moduleId,
        moduleName: e.moduleName,
        authorName: e.authorName,
        trackType: e.trackType,
        academicYearName: e.academicYearName,
        institutionName: e.institutionName,
        previewQuestionSnippet: e.previewQuestionSnippet,
        solutionSummary: e.solutionSummary,
      })),
      skipDuplicates: true,
    });

    await prisma.platformSettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: {
        id: 'singleton',
        academicYear: '2025/2026',
        ambassadorCommissionRate: 10,
        baridiMobEnabled: true,
        edahabiaEnabled: true,
      },
    });
  }

  const bundleCount = await prisma.bundle.count();
  if (bundleCount === 0) {
    await prisma.bundle.createMany({
      data: [
        {
          titleAr: 'حزمة الامتياز في العلوم الدقيقة',
          titleFr: "Excellence Sciences Exactes",
          descriptionAr: 'حزمة علوم الطبيعة، الرياضيات، والفيزياء وباقي فروع البكالوريا مع وثائق رقمية وبيانات تفاعلية.',
          descriptionFr: 'Sciences naturelles, mathématiques et physique avec documents numériques interactifs.',
          track: 'BAC',
          badge: 'BAC 2026',
          hours: 24,
          lecturesCount: 3,
          originalPriceDzd: 6900,
          currentPriceDzd: 5900,
          colorTheme: 'lime',
          sortOrder: 1,
        },
        {
          titleAr: 'حزمة اللغات والفلسفة المتكاملة',
          titleFr: 'Langues & Philosophie Intégrées',
          descriptionAr: 'لجميع الشعب: اللغات الأجنبية والأولى، والفلسفة، وشعب علمية تتبع المواد الأدبية.',
          descriptionFr: 'Pour toutes les filières : langues, philosophie et matières littéraires.',
          track: 'BAC',
          badge: 'BAC 2026',
          hours: 58,
          lecturesCount: 3,
          originalPriceDzd: 4500,
          currentPriceDzd: 3500,
          colorTheme: 'gold',
          sortOrder: 2,
        },
        {
          titleAr: 'حزمة الامتياز في الإعلام الآلي والرياضيات الجامعية',
          titleFr: 'Excellence Informatique & Maths (LMD MI/ST)',
          descriptionAr: 'طلبة السنة الأولى والثانية، وكذا طلبة الجذع المشترك، يتابعون دروس علوم الحاسوب، الرياضيات، والفيزياء.',
          descriptionFr: '1ère et 2ème année, tronc commun : informatique, mathématiques et physique.',
          track: 'UNIVERSITY_LMD',
          badge: 'LMD MI/ST',
          hours: 24,
          lecturesCount: 3,
          originalPriceDzd: 5500,
          currentPriceDzd: 4200,
          colorTheme: 'sky',
          sortOrder: 3,
        },
      ],
    });
  }
}

// Explicit and one-time: run "npm run db:seed" with ADMIN_EMAIL and ADMIN_PASSWORD set (and, optionally,
// ADMIN_NAME). It is never called from a request. Nothing here is hard-coded: no fallback passwords, no personal
// email or phone number. The owner must change the password at first login.
export async function seedOwner(): Promise<'created' | 'exists'> {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD to create the owner account.');
  const problem = passwordProblem(password);
  if (problem) throw new Error('ADMIN_PASSWORD rejected: ' + problem);

  if (await prisma.user.findUnique({ where: { email } })) return 'exists';
  await prisma.user.create({
    data: {
      email,
      name: process.env.ADMIN_NAME?.trim() || 'Owner',
      role: 'OWNER',
      passwordHash: await hashPassword(password),
      mustChangePassword: true,
      studentCardId: generateCardId('OWN', 16),
      isVerified: true,
    },
  });
  return 'created';
}
