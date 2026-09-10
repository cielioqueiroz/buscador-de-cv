import { NextResponse } from 'next/server';
import { generateCoverLetter } from '@/lib/ai/gemini';
import { CoverLetterRequestSchema } from '@/lib/cover-letter';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { ApiRequestError, assertSameOrigin, readJson } from '@/lib/api/request';

export const runtime = 'nodejs';
export const maxDuration = 60;
const MAX_BODY_BYTES = 256 * 1024;

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Requisição inválida.' }, { status });
  }

  // Uma chamada ao Gemini por carta — mais barata que /match, que dispara o
  // lote inteiro. Mas o botão "regenerar" convida a insistir, então o teto
  // existe para o dedo nervoso, não para o uso normal (uma carta por vaga).
  if (!rateLimit(`letter:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json(
      { error: 'Muitas cartas seguidas. Aguarde um minuto.' },
      { status: 429 },
    );
  }

  try {
    const { profile, job, tone, length } = await readJson(req, CoverLetterRequestSchema, MAX_BODY_BYTES);
    const letter = await generateCoverLetter(profile, job, tone, length);
    return NextResponse.json({ letter });
  } catch (err) {
    if (err instanceof ApiRequestError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[api/cover-letter]', err);
    return NextResponse.json({ error: 'Falha ao escrever a carta.' }, { status: 500 });
  }
}
