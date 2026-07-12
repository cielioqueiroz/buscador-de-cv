import { NextResponse } from 'next/server';
import { generateCoverLetter } from '@/lib/ai/gemini';
import { CoverLetterRequestSchema } from '@/lib/cover-letter';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
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
    const parsed = CoverLetterRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 });
    }

    const { profile, job, tone, length } = parsed.data;
    const letter = await generateCoverLetter(profile, job, tone, length);
    return NextResponse.json({ letter });
  } catch (err) {
    console.error('[api/cover-letter]', err);
    return NextResponse.json({ error: 'Falha ao escrever a carta.' }, { status: 500 });
  }
}
