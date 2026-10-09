import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { guard } from '@/lib/http';

// Public: the teachers an admin switched on for the landing page. Public fields only, never contact,
// pay or bank data. An empty list means the landing page hides the teacher strip.
async function GETHandler() {
  const profiles = await prisma.teacherProfile.findMany({
    where: { showOnLanding: true, user: { isVerified: true } },
    orderBy: [{ landingOrder: 'asc' }, { createdAt: 'asc' }],
    take: 12,
    select: {
      id: true,
      specialty: true,
      university: true,
      publicBio: true,
      photoUrl: true,
      user: { select: { name: true } },
    },
  });

  return NextResponse.json(
    profiles.map((p) => ({
      id: p.id,
      name: p.user.name,
      specialty: p.specialty,
      university: p.university,
      bio: p.publicBio,
      photoUrl: p.photoUrl,
    })),
  );
}

export const GET = guard(GETHandler);
