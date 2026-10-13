import { NextResponse } from 'next/server';
import { generateCVImprovementReport } from '@/lib/ai/gemini';
import { CVImprovementRequestSchema } from '@/lib/cv-features';
import { ApiRequestError, assertSameOrigin, readJson } from '@/lib/api/request';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { sessionUserId, unauthorized } from '@/lib/api/auth-guard';

export const runtime = 'nodejs';
const MAX_BODY_BYTES = 128 * 1024;

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    if (!(await sessionUserId())) return unauthorized();
    if (!(await checkRateLimit(`report:${clientIp(req)}`, 5, 60_000))) {
      return NextResponse.json(
        { error: 'Muitos relatórios seguidos. Aguarde um minuto.' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }
    const { profile } = await readJson(req, CVImprovementRequestSchema, MAX_BODY_BYTES);
    return NextResponse.json({ report: await generateCVImprovementReport(profile) });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[api/cv/report]', error);
    return NextResponse.json({ error: 'Falha ao gerar o relatório. Tente de novo.' }, { status: 500 });
  }
}
