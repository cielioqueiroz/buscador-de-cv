import { NextResponse } from 'next/server';
import { ApiRequestError, assertSameOrigin, readJson } from '@/lib/api/request';
import { checkRateLimit } from '@/lib/rate-limit';
import { sessionUserId, unauthorized } from '@/lib/api/auth-guard';
import { DismissRequestSchema, UndismissRequestSchema } from '@/lib/dismiss-reasons';
import { dismissJob, listDismissedIds, undismissJob } from '@/lib/jobs/dismissals';

export const runtime = 'nodejs';

function fail(error: unknown, where: string) {
  if (error instanceof ApiRequestError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(`[api/sync/dismissals ${where}]`, error);
  return NextResponse.json({ error: 'Falha ao salvar.' }, { status: 500 });
}

async function guard(req: Request): Promise<string | NextResponse> {
  assertSameOrigin(req);
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  if (!(await checkRateLimit(`dismiss:${userId}`, 60, 60_000))) {
    return NextResponse.json({ error: 'Aguarde.' }, { status: 429 });
  }
  return userId;
}

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();
  try {
    return NextResponse.json({ dismissed: await listDismissedIds(userId) });
  } catch (error) {
    return fail(error, 'GET');
  }
}

/** "Não tenho interesse": a vaga some do ranking e das próximas pontuações. */
export async function POST(req: Request) {
  try {
    const userId = await guard(req);
    if (typeof userId !== 'string') return userId;
    const { jobId, reason } = await readJson(req, DismissRequestSchema, 1_000);
    await dismissJob(userId, jobId, reason);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error, 'POST');
  }
}

/** Desfazer o descarte. */
export async function DELETE(req: Request) {
  try {
    const userId = await guard(req);
    if (typeof userId !== 'string') return userId;
    const { jobId } = await readJson(req, UndismissRequestSchema, 1_000);
    await undismissJob(userId, jobId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error, 'DELETE');
  }
}
