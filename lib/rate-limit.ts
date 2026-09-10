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

function boundedIp(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 100) : null;
}

/** Consome uma unidade da cota. Devolve `false` quando estourou. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    if (buckets.size >= MAX_BUCKETS) {
      prune(now);
      // Nunca deixe uma rajada de IPs inéditos transformar o rate limiter em
      // um vazamento de memória. O store compartilhado continua sendo o
      // caminho recomendado para garantias fortes em serverless.
      if (buckets.size >= MAX_BUCKETS) return false;
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** IP do chamador, atrás do proxy da Vercel. */
export function clientIp(req: Request): string {
  // Prefira headers que a plataforma de borda controla. `x-forwarded-for` é
  // mantido como fallback para ambientes locais/proxies conhecidos, mas não
  // deve ser tratado como uma prova de identidade sem um proxy confiável.
  const trusted = [
    boundedIp(req.headers.get('x-vercel-forwarded-for')),
    boundedIp(req.headers.get('cf-connecting-ip')),
    boundedIp(req.headers.get('x-real-ip')),
  ].find((value): value is string => Boolean(value));
  if (trusted) return trusted;

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return boundedIp(forwarded.split(',')[0]) ?? 'unknown';
  return 'unknown';
}
