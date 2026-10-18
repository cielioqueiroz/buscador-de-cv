import { NextResponse } from 'next/server';
import { adaptCV } from '@/lib/ai/gemini';
import { AdaptCVRequestSchema } from '@/lib/cv-features';
import { ApiRequestError, assertSameOrigin, readJson } from '@/lib/api/request';
import { checkRateLimit } from '@/lib/rate-limit';
import { sessionUserId, unauthorized } from '@/lib/api/auth-guard';
import { requireProfileAndJob } from '@/lib/jobs/user-context';
import { aiUnavailableResponse } from '@/lib/api/ai-unavailable';
import { aiQuotaExceeded } from '@/lib/api/ai-quota';

export const runtime = 'nodejs';
const MAX_BODY_BYTES = 1_000;

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const userId = await sessionUserId();
    if (!userId) return unauthorized();
    if (!(await checkRateLimit(`adapt:${userId}`, 8, 60_000))) {
      return NextResponse.json(
        { error: 'Muitas adaptações seguidas. Aguarde um minuto.' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }
    const { jobId } = await readJson(req, AdaptCVRequestSchema, MAX_BODY_BYTES);
    const { profile, job } = await requireProfileAndJob(userId, jobId);
    const quota = await aiQuotaExceeded(userId, 'adapt');
    if (quota) return quota;
    return NextResponse.json({ adaptedCV: await adaptCV(profile, job) });
  } catch (error) {
    const busy = aiUnavailableResponse(error);
    if (busy) return busy;
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[api/cv/adapt]', error);
    return NextResponse.json({ error: 'Falha ao adaptar o currículo.' }, { status: 500 });
  }
}
