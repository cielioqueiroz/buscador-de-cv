/**
 * Rate limit por IP.
 *
 * Duas implementações atrás de uma única porta (`checkRateLimit`):
 *
 * 1. **Em memória** (padrão). Vive no processo, então em serverless com várias
 *    instâncias cada uma tem seu próprio contador — o teto real é
 *    `limite × nº de instâncias`. Segura abuso casual e scripts ingênuos.
 * 2. **Upstash Redis** (quando `UPSTASH_REDIS_REST_URL` e
 *    `UPSTASH_REDIS_REST_TOKEN` existem). Store compartilhado: o teto vale para
 *    o app inteiro, independente de quantas instâncias a Vercel suba. É o que dá
 *    garantia real num app aberto, sem login, cuja cota paga do Gemini depende
 *    deste freio ser a única barreira.
 *
 * A chamada ao Upstash é feita do servidor (API Route), então não passa pela CSP
 * do navegador. Se o Redis falhar ou ficar indisponível, caímos no limiter em
 * memória em vez de derrubar a requisição: um freio degradado é melhor que um
 * 500 na cara do usuário.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

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

/**
 * Consome uma unidade da cota no store em memória. Devolve `false` quando
 * estourou. Mantido síncrono: é o fallback e o que os testes exercitam.
 */
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

// ---------------------------------------------------------------------------
// Upstash: só é construído quando as variáveis existem. Em dev e nos testes,
// `redis` é null e tudo passa pelo limiter em memória acima.
// ---------------------------------------------------------------------------

// A integração Upstash da Vercel injeta KV_REST_API_URL / KV_REST_API_TOKEN;
// uma configuração manual do Upstash usa UPSTASH_REDIS_REST_URL / _TOKEN.
// Aceitamos os dois padrões. KV_URL e REDIS_URL são ignorados de propósito: são
// conexões TCP (rediss://), não a API REST que este SDK usa.
const redisUrl = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

// Um Ratelimit por combinação (limite, janela) — cada rota tem a sua, fixa, então
// no total são pouquíssimas instâncias. A janela deslizante do Upstash evita a
// rajada na virada que a janela fixa em memória permite.
const limiters = new Map<string, Ratelimit>();

function limiterFor(limit: number, windowMs: number): Ratelimit {
  const chave = `${limit}:${windowMs}`;
  let rl = limiters.get(chave);
  if (!rl) {
    rl = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: 'vc:rl',
    });
    limiters.set(chave, rl);
  }
  return rl;
}

/**
 * Porta única do rate limit. Usa o Upstash quando configurado; cai no limiter
 * em memória quando não há Redis ou quando a chamada ao Redis falha.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  if (!redis) return rateLimit(key, limit, windowMs);
  try {
    const { success } = await limiterFor(limit, windowMs).limit(key);
    return success;
  } catch (err) {
    console.warn('[rate-limit] Upstash indisponível, usando limiter em memória:', err);
    return rateLimit(key, limit, windowMs);
  }
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
