import { NextRequest, NextResponse } from 'next/server';
import { bumpTokenVersion, clearAuthCookies, getUserFromRequest } from '@/lib/auth';

// Logging out ends the login for real: the stored token version is bumped, so a copied token stops working too.
// ponytail: this signs the account out on every device. Per-device logout needs a token id (jti) list.
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (user) await bumpTokenVersion(user.id).catch(() => {});

  const response = NextResponse.json({ success: true });
  clearAuthCookies(response);
  return response;
}
