import { NextResponse } from 'next/server';
import { generateCVImprovementReport } from '@/lib/ai/gemini';
import { CVImprovementRequestSchema } from '@/lib/cv-features';
import { ApiRequestError, assertSameOrigin, readJson } from '@/lib/api/request';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
const MAX_BODY_BYTES = 128 * 1024;

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    if (!rateLimit(`report:${clientIp(req)}`, 5, 60_000)) {
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
    return NextResponse.json({ error: 'Falha ao analisar o currículo.' }, { status: 500 });
  }
}
