import { NextResponse } from 'next/server';
import { rankJobs } from '@/lib/matching';
import { MatchRequestSchema, MAX_JOBS_PER_MATCH } from '@/lib/providers/types';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { ApiRequestError, assertSameOrigin, readJson } from '@/lib/api/request';

export const runtime = 'nodejs';
export const maxDuration = 60;
const MAX_BODY_BYTES = 1_500_000;

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Requisição inválida.' }, { status });
  }

  // Cada request aqui dispara uma chamada de lote ao Gemini — é a rota mais
  // cara do app e a que mais precisa de freio.
  if (!rateLimit(`match:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Muitas buscas seguidas. Aguarde um minuto.' }, { status: 429 });
  }

  try {
    const { profile, jobs } = await readJson(req, MatchRequestSchema, MAX_BODY_BYTES);
    // A busca volta com dezenas de vagas e o cliente manda todas. Cortamos aqui
    // porque cada vaga pontuada é uma chamada paga — recusar seria quebrar o
    // fluxo normal do app por causa de um limite que é nosso, não do usuário.
    const ranked = await rankJobs(profile, jobs.slice(0, MAX_JOBS_PER_MATCH));
    return NextResponse.json({ ranked });
  } catch (err) {
    if (err instanceof ApiRequestError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[api/jobs/match]', err);
    return NextResponse.json({ error: 'Falha no matching' }, { status: 500 });
  }
}
