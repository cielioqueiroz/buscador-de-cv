import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { ApiRequestError, assertSameOrigin, readJson } from '@/lib/api/request';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { ApplicationStageSchema } from '@/lib/application-schema';
import { removeApplication, updateApplicationStage } from '@/lib/auth/sync';

export const runtime = 'nodejs';

const PatchSchema = z.object({ stage: ApplicationStageSchema });

type Params = { params: Promise<{ jobId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    assertSameOrigin(req);
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
    }
    if (!(await checkRateLimit(`apps:${session.user.id}:${clientIp(req)}`, 30, 60_000))) {
      return NextResponse.json({ error: 'Aguarde.' }, { status: 429 });
    }
    const { jobId } = await params;
    const body = await readJson(req, PatchSchema, 2_000);
    await updateApplicationStage(session.user.id, jobId, body.stage);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Estágio inválido.' }, { status: 400 });
    }
    console.error('[api/sync/applications PATCH]', error);
    return NextResponse.json({ error: 'Falha ao atualizar.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    assertSameOrigin(req);
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
    }
    const { jobId } = await params;
    await removeApplication(session.user.id, jobId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[api/sync/applications DELETE]', error);
    return NextResponse.json({ error: 'Falha ao remover.' }, { status: 500 });
  }
}
