import { NextResponse } from 'next/server';
import { generateCVImprovementReport } from '@/lib/ai/gemini';
import { ApiRequestError, assertSameOrigin } from '@/lib/api/request';
import { checkRateLimit } from '@/lib/rate-limit';
import { sessionUserId, unauthorized } from '@/lib/api/auth-guard';
import { requireProfile } from '@/lib/jobs/user-context';
import { aiUnavailableResponse } from '@/lib/api/ai-unavailable';

export const runtime = 'nodejs';
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const userId = await sessionUserId();
    if (!userId) return unauthorized();
    if (!(await checkRateLimit(`report:${userId}`, 5, 60_000))) {
      return NextResponse.json(
        { error: 'Muitos relatórios seguidos. Aguarde um minuto.' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }
    // Sem corpo: o relatório é sobre o CV salvo na conta.
    const profile = await requireProfile(userId);
    return NextResponse.json({ report: await generateCVImprovementReport(profile) });
  } catch (error) {
    const busy = aiUnavailableResponse(error);
    if (busy) return busy;
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[api/cv/report]', error);
    return NextResponse.json({ error: 'Falha ao gerar o relatório. Tente de novo.' }, { status: 500 });
  }
}
