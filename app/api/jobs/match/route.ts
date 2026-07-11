import { NextResponse } from 'next/server';
import { rankJobs } from '@/lib/matching';
import { MatchRequestSchema, MAX_JOBS_PER_MATCH } from '@/lib/providers/types';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  // Cada request aqui dispara até 15 chamadas ao Gemini — é a rota mais cara
  // do app e a que mais precisa de freio.
  if (!rateLimit(`match:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Muitas buscas seguidas. Aguarde um minuto.' }, { status: 429 });
  }

  try {
    const parsed = MatchRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 });
    }

    const { profile, jobs } = parsed.data;
    // A busca volta com dezenas de vagas e o cliente manda todas. Cortamos aqui
    // porque cada vaga pontuada é uma chamada paga — recusar seria quebrar o
    // fluxo normal do app por causa de um limite que é nosso, não do usuário.
    const ranked = await rankJobs(profile, jobs.slice(0, MAX_JOBS_PER_MATCH));
    return NextResponse.json({ ranked });
  } catch (err) {
    console.error('[api/jobs/match]', err);
    return NextResponse.json({ error: 'Falha no matching' }, { status: 500 });
  }
}
