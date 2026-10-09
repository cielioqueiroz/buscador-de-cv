import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { ApiRequestError, assertSameOrigin, readJson } from '@/lib/api/request';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { SavedLetterSchema } from '@/lib/letter-schema';
import { getLetter, removeLetter, upsertLetter } from '@/lib/auth/sync';

export const runtime = 'nodejs';

const MAX_BYTES = 32 * 1024;

type Params = { params: Promise<{ jobId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
  }
  const { jobId } = await params;
  try {
    const letter = await getLetter(session.user.id, jobId);
    if (!letter) return NextResponse.json({ letter: null }, { status: 404 });
    return NextResponse.json({ letter });
  } catch (err) {
    console.error('[api/sync/letters GET]', err);
    return NextResponse.json({ error: 'Falha ao carregar.' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    assertSameOrigin(req);
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
    }
    if (!(await checkRateLimit(`letters:${session.user.id}:${clientIp(req)}`, 30, 60_000))) {
      return NextResponse.json({ error: 'Aguarde.' }, { status: 429 });
    }
    const { jobId } = await params;
    const saved = await readJson(req, SavedLetterSchema, MAX_BYTES);
    await upsertLetter(session.user.id, jobId, saved);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Carta inválida.' }, { status: 400 });
    }
    console.error('[api/sync/letters PUT]', error);
    return NextResponse.json({ error: 'Falha ao salvar.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
  }
  const { jobId } = await params;
  try {
    await removeLetter(session.user.id, jobId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/sync/letters DELETE]', err);
    return NextResponse.json({ error: 'Falha ao remover.' }, { status: 500 });
  }
}
