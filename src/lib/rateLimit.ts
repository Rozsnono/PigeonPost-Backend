import { NextRequest } from 'next/server';

/**
 * Egyszerű, memóriában tárolt csúszóablakos rate limiter.
 * FIGYELEM: példányonként működik (serverless/több példány esetén nem osztott);
 * brute force és spam ellen alapvédelemnek elég, szigorúbb védelemhez Redis kell.
 */
const buckets = new Map<string, number[]>();

export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  return (fwd ? fwd.split(',')[0].trim() : req.headers.get('x-real-ip')) || 'unknown';
}

/** true, ha a kérés még belefér a limitbe. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return true;
}
