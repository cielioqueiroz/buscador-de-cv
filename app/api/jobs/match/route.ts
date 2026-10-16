import { NextResponse } from 'next/server';
import { MissingProfileError, MissingSearchError, rankLatestSearch } from '@/lib/jobs/rank-search';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { ApiRequestError, assertSameOrigin } from '@/lib/api/request';
import { sessionUserId, unauthorized } from '@/lib/api/auth-guard';
import { aiUnavailableResponse } from '@/lib/api/ai-unavailable';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Pontua a última busca do usuário. Sem corpo: o perfil e as vagas vêm do
 * banco (lib/jobs/rank-search.ts). Antes o navegador mandava os dois, e quem
 * editasse a requisição punha o texto que quisesse no prompt da IA.
 */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Requisição inválida.' }, { status });
  }

  const userId = await sessionUserId();
  if (!userId) return unauthorized();

  // Cada request aqui pode disparar uma chamada de lote ao Gemini — é a rota
  // mais cara do app e a que mais precisa de freio.
  if (!(await checkRateLimit(`match:${clientIp(req)}`, 5, 60_000))) {
    return NextResponse.json(
      { error: 'Muitas buscas seguidas. Aguarde um minuto.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  try {
    return NextResponse.json(await rankLatestSearch(userId));
  } catch (err) {
    const busy = aiUnavailableResponse(err);
    if (busy) return busy;
    if (err instanceof MissingProfileError || err instanceof MissingSearchError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error('[api/jobs/match]', err);
    return NextResponse.json({ error: 'Falha no matching' }, { status: 500 });
  }
}
