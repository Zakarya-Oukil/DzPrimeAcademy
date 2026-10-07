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

// Prefer the headers the hosting platform sets itself; x-forwarded-for is client-controlled unless a proxy overwrites it.
export function clientIp(request: NextRequest): string {
  const h = request.headers;
  return h.get('x-vercel-forwarded-for')?.split(',')[0].trim() || h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}
