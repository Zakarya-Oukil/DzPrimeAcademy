import { NextRequest } from 'next/server';

// ponytail: per-instance memory. On serverless each instance counts on its own, so the real ceiling is
// max x instances. Phase 4 swaps this for a shared store (same signature) when per-IP login limits land.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
    if (hits.size > 5000) hits.clear();
  }
  return true;
}

// Counts a hit and returns how many happened inside the window (no limit applied; callers decide what to do).
export function countHit(key: string, windowMs: number): number {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length;
}

// Forwarding headers are only believed where something we control sets them: Vercel, a proxy named by TRUST_PROXY=1,
// or local development. Anywhere else a visitor could invent an address per request and get a fresh limit each
// time, so every request shares one bucket ("unknown"), which fails closed.
const TRUST_FORWARDED = () => process.env.NODE_ENV !== 'production' || !!process.env.VERCEL || process.env.TRUST_PROXY === '1';

export function clientIp(request: NextRequest): string {
  if (!TRUST_FORWARDED()) return 'unknown';
  const h = request.headers;
  return h.get('x-vercel-forwarded-for')?.split(',')[0].trim() || h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}
