/**
 * Rate limit por IP, em memória.
 *
 * Vale a ressalva: o estado vive no processo, então em serverless com várias
 * instâncias cada uma tem seu próprio contador — o teto real é
 * `limite × nº de instâncias`. Segura abuso casual e scripts ingênuos, mas para
 * garantia forte é preciso um store compartilhado (Redis/Upstash).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function prune(now: number) {
  for (const [key, b] of buckets) {
    if (now > b.resetAt) buckets.delete(key);
  }
}

/** Consome uma unidade da cota. Devolve `false` quando estourou. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    if (buckets.size >= MAX_BUCKETS) prune(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** IP do chamador, atrás do proxy da Vercel. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}
