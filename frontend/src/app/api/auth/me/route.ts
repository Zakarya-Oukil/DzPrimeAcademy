import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // A guest (no auth cookie or header) is a normal answer, not an error: 200 keeps the browser console quiet.
  // A cookie that no longer works (expired, logged out elsewhere, tampered) still gets 401.
  if (!request.cookies.get('dz_token') && !request.headers.get('authorization')) {
    return NextResponse.json({ user: null });
  }
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
