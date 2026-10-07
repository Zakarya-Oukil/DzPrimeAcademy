import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { getUserFromRequest } from '@/lib/auth';
import { guard } from '@/lib/http';
import { isStorageRef, signedDownloadUrl } from '@/lib/storageSign';

async function GETHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const moduleId = searchParams.get('moduleId');

  await ensureSeeded();
  const user = await getUserFromRequest(request);
  const hasPaidAccess = !!user && (
    user.role === 'STUDENT_PAID' ||
    user.role === 'TEACHER' ||
    user.role === 'ADMIN' ||
    user.role === 'OWNER'
  );

  const exams = await prisma.exam.findMany({
    where: moduleId ? { moduleId } : undefined,
    orderBy: [{ year: 'desc' }, { title: 'asc' }],
    take: 500,
  });

  // The tier rule is applied on the server: locked exams never leave it with a usable file link.
  const visible = await Promise.all(
    exams.map(async (exam, idx) => {
      const open = hasPaidAccess || exam.isFreeSample || idx < 2;
      if (!open) return { ...exam, fileUrl: '#locked', solutionUrl: null, isLocked: true };

      // Private files: hand out a link that expires in 5 minutes instead of a permanent address.
      const fileUrl = isStorageRef(exam.fileUrl) ? (await signedDownloadUrl(exam.fileUrl)) ?? '#unavailable' : exam.fileUrl;
      const solutionUrl = isStorageRef(exam.solutionUrl) ? await signedDownloadUrl(exam.solutionUrl) : exam.solutionUrl;
      return { ...exam, fileUrl, solutionUrl, isLocked: false };
    })
  );

  return NextResponse.json({
    success: true,
    count: visible.length,
    exams: visible,
  });
}

export const GET = guard(GETHandler);
