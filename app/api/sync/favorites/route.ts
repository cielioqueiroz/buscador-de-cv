import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { ApiRequestError, assertSameOrigin, readJson } from '@/lib/api/request';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { listFavorites, setFavorite } from '@/lib/auth/sync';

export const runtime = 'nodejs';

const PostSchema = z.object({
  jobId: z.string().trim().min(1).max(500),
  on: z.boolean(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
  }
  try {
    return NextResponse.json({ favorites: await listFavorites(session.user.id) });
  } catch (err) {
    console.error('[api/sync/favorites GET]', err);
    return NextResponse.json({ error: 'Falha ao listar.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
    }
    if (!(await checkRateLimit(`favs:${session.user.id}:${clientIp(req)}`, 60, 60_000))) {
      return NextResponse.json({ error: 'Aguarde.' }, { status: 429 });
    }
    const body = await readJson(req, PostSchema, 2_000);
    await setFavorite(session.user.id, body.jobId, body.on);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }
    console.error('[api/sync/favorites POST]', error);
    return NextResponse.json({ error: 'Falha ao salvar.' }, { status: 500 });
  }
}
