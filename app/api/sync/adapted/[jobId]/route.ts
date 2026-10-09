import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { ApiRequestError, assertSameOrigin, readJson } from '@/lib/api/request';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { AdaptedCVSchema } from '@/lib/cv-features';
import { getAdaptedCV, upsertAdaptedCV } from '@/lib/auth/sync';

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
    const adapted = await getAdaptedCV(session.user.id, jobId);
    if (!adapted) return NextResponse.json({ adapted: null }, { status: 404 });
    return NextResponse.json({ adapted });
  } catch (err) {
    console.error('[api/sync/adapted GET]', err);
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
    if (!(await checkRateLimit(`adapted:${session.user.id}:${clientIp(req)}`, 30, 60_000))) {
      return NextResponse.json({ error: 'Aguarde.' }, { status: 429 });
    }
    const { jobId } = await params;
    const payload = await readJson(req, AdaptedCVSchema, MAX_BYTES);
    await upsertAdaptedCV(session.user.id, jobId, payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'CV adaptado inválido.' }, { status: 400 });
    }
    console.error('[api/sync/adapted PUT]', error);
    return NextResponse.json({ error: 'Falha ao salvar.' }, { status: 500 });
  }
}
