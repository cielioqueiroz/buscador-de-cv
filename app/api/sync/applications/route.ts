import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { ApiRequestError, assertSameOrigin, readJson } from '@/lib/api/request';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { ApplicationSchema } from '@/lib/application-schema';
import { listApplications, upsertApplication } from '@/lib/auth/sync';

export const runtime = 'nodejs';

const MAX_BYTES = 32 * 1024;

const PostSchema = z.object({ application: ApplicationSchema });

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
  }
  try {
    return NextResponse.json({
      applications: await listApplications(session.user.id),
    });
  } catch (err) {
    console.error('[api/sync/applications GET]', err);
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
    if (!(await checkRateLimit(`apps:${session.user.id}:${clientIp(req)}`, 30, 60_000))) {
      return NextResponse.json({ error: 'Aguarde.' }, { status: 429 });
    }
    const body = await readJson(req, PostSchema, MAX_BYTES);
    await upsertApplication(session.user.id, body.application);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Dados inválidos.' },
        { status: 400 },
      );
    }
    console.error('[api/sync/applications POST]', error);
    return NextResponse.json({ error: 'Falha ao salvar.' }, { status: 500 });
  }
}
