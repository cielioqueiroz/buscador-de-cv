import { NextResponse } from 'next/server';
import { adaptCV } from '@/lib/ai/gemini';
import { AdaptCVRequestSchema } from '@/lib/cv-features';
import { ApiRequestError, assertSameOrigin, readJson } from '@/lib/api/request';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
const MAX_BODY_BYTES = 256 * 1024;

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    if (!rateLimit(`adapt:${clientIp(req)}`, 8, 60_000)) {
      return NextResponse.json(
        { error: 'Muitas adaptações seguidas. Aguarde um minuto.' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }
    const { profile, job } = await readJson(req, AdaptCVRequestSchema, MAX_BODY_BYTES);
    return NextResponse.json({ adaptedCV: await adaptCV(profile, job) });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[api/cv/adapt]', error);
    return NextResponse.json({ error: 'Falha ao adaptar o currículo.' }, { status: 500 });
  }
}
