import { NextResponse } from 'next/server';
import { searchAllProviders } from '@/lib/providers';
import { parseProviderJobs, SearchRequestSchema } from '@/lib/providers/types';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { ApiRequestError, assertSameOrigin, readJson } from '@/lib/api/request';

const MAX_BODY_BYTES = 96 * 1024;

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Requisição inválida.' }, { status });
  }

  if (!rateLimit(`search:${clientIp(req)}`, 20, 60_000)) {
    return NextResponse.json(
      { error: 'Muitas buscas seguidas. Aguarde um minuto.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  try {
    const { queries, opts } = await readJson(req, SearchRequestSchema, MAX_BODY_BYTES);
    const jobs = await searchAllProviders(queries, opts);
    return NextResponse.json({ jobs: parseProviderJobs(jobs) });
  } catch (err) {
    if (err instanceof ApiRequestError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[api/jobs/search]', err);
    return NextResponse.json({ error: 'Falha na busca' }, { status: 500 });
  }
}
