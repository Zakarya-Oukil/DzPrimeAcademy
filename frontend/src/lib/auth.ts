import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './db';
import { hasAnyPermission, isSuperAdmin, Permission } from './rbac';

const TOKEN_COOKIE = 'dz_token';
const SESSION_COOKIE = 'dz_session_token';
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getJwtSecret(): string {
  return process.env.JWT_SECRET as string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

// tv = the user's tokenVersion when the token was issued. Logging out or changing the password bumps the stored
// version, which makes every older token invalid (they used to stay valid until expiry, 7 days).
export function signToken(userId: string, tokenVersion = 0): string {
  return jwt.sign({ sub: userId, tv: tokenVersion }, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyJwt(token: string): { sub: string; tv?: number } | null {
  try {
    return jwt.verify(token, getJwtSecret()) as { sub: string; tv?: number };
  } catch (e) {
    return null;
  }
}

// Ends every login of this user (all devices) and returns the new version for a fresh token.
export async function bumpTokenVersion(userId: string): Promise<number> {
  const u = await prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } }, select: { tokenVersion: true } });
  return u.tokenVersion;
}

const isProd = process.env.NODE_ENV === 'production';

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_MAX_AGE_SECONDS,
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(TOKEN_COOKIE, '', { path: '/', maxAge: 0, expires: new Date(0) });
  response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0, expires: new Date(0) });
}

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  role: true,
  jobTitle: true,
  adminRole: true,
  bio: true,
  facebook: true,
  instagram: true,
  linkedin: true,
  telegram: true,
  youtube: true,
  whatsapp: true,
  website: true,
  twitter: true,
  github: true,
  phone: true,
  wilayaCode: true,
  wilayaName: true,
  institutionId: true,
  institutionName: true,
  track: true,
  specialty: true,
  academicYear: true,
  studentCardId: true,
  isVerified: true,
  mustChangePassword: true,
  createdAt: true,
  updatedAt: true,
};

// A token is only good if its version still matches the user's current tokenVersion.
async function userFromToken(token: string) {
  const payload = verifyJwt(token);
  if (!payload?.sub) return null;
  const row = await prisma.user.findUnique({ where: { id: payload.sub }, select: { ...SAFE_USER_SELECT, tokenVersion: true } });
  if (!row || (payload.tv ?? 0) !== row.tokenVersion) return null;
  const { tokenVersion: _tv, ...user } = row;
  const isStaff = user.role === 'ADMIN' || user.role === 'OWNER';
  if (!user.isVerified && !isStaff) return null;
  return user;
}

export async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const user = await userFromToken(authHeader.substring(7).trim());
    if (user) return user;
  }

  const jwtToken = request.cookies.get(TOKEN_COOKIE)?.value;
  if (jwtToken) return userFromToken(jwtToken);

  return null;
}

export type SafeUser = Awaited<ReturnType<typeof getUserFromRequest>>;

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function checkBruteForce(identifier: string): Promise<{ locked: boolean; retryAfterMinutes?: number }> {
  const record = await prisma.loginAttempt.findUnique({ where: { identifier } });
  if (record?.lockedUntil && record.lockedUntil > new Date()) {
    const retryAfterMinutes = Math.ceil((record.lockedUntil.getTime() - Date.now()) / 60000);
    return { locked: true, retryAfterMinutes };
  }
  return { locked: false };
}

export async function recordFailedAttempt(identifier: string): Promise<void> {
  const record = await prisma.loginAttempt.upsert({
    where: { identifier },
    update: { attempts: { increment: 1 } },
    create: { identifier, attempts: 1 },
  });

  if (record.attempts + (record.lockedUntil ? 0 : 1) >= MAX_ATTEMPTS) {
    await prisma.loginAttempt.update({
      where: { identifier },
      data: { lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60000), attempts: 0 },
    });
  }
}

export async function clearFailedAttempts(identifier: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { identifier } });
}

export async function requireAuth(
  request: NextRequest
): Promise<{ user: NonNullable<SafeUser> } | { error: NextResponse }> {
  const user = await getUserFromRequest(request);
  if (!user) {
    return { error: NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 }) };
  }
  // An account still on a password someone else chose (staff-created or the seeded owner) can do nothing but
  // change it, see who it is, and sign out. Every route that authenticates through here enforces this.
  if (user.mustChangePassword && !MUST_CHANGE_ALLOWED.includes(new URL(request.url).pathname)) {
    return {
      error: NextResponse.json(
        { error: 'يجب تغيير كلمة المرور المؤقتة قبل المتابعة', code: 'MUST_CHANGE_PASSWORD' },
        { status: 403 }
      ),
    };
  }
  return { user };
}

const MUST_CHANGE_ALLOWED = ['/api/account/change-password', '/api/auth/me', '/api/auth/logout'];

export async function requireRole(
  request: NextRequest,
  roles: string[]
): Promise<{ user: NonNullable<SafeUser> } | { error: NextResponse }> {
  const authResult = await requireAuth(request);
  if ('error' in authResult) return authResult;
  if (!roles.includes(authResult.user.role)) {
    return { error: NextResponse.json({ error: 'لا تملك صلاحية الوصول لهذا الإجراء' }, { status: 403 }) };
  }
  return authResult;
}

export async function requirePermission(
  request: NextRequest,
  permission: Permission | Permission[]
): Promise<{ user: NonNullable<SafeUser> } | { error: NextResponse }> {
  const authResult = await requireAuth(request);
  if ('error' in authResult) return authResult;
  if (!hasAnyPermission(authResult.user, permission)) {
    return { error: NextResponse.json({ error: 'لا تملك صلاحية الوصول لهذا الإجراء' }, { status: 403 }) };
  }
  return authResult;
}

export async function requireOwnerOnly(
  request: NextRequest
): Promise<{ user: NonNullable<SafeUser> } | { error: NextResponse }> {
  const authResult = await requireAuth(request);
  if ('error' in authResult) return authResult;
  const { user } = authResult;
  if (isSuperAdmin(user)) {
    return { user };
  }
  return {
    error: NextResponse.json(
      { error: 'هذا الإجراء محصور حصرياً بالمسؤول الأعلى (Super Admin)' },
      { status: 403 }
    ),
  };
}

