import { NextResponse } from 'next/server';
import { searchAllProviders } from '@/lib/providers';
import { SearchRequestSchema } from '@/lib/providers/types';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  if (!rateLimit(`search:${clientIp(req)}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Muitas buscas seguidas. Aguarde um minuto.' }, { status: 429 });
  }

  try {
    const parsed = SearchRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'queries obrigatórias' }, { status: 400 });
    }

    const { queries, opts } = parsed.data;
    const jobs = await searchAllProviders(queries, opts);
    return NextResponse.json({ jobs });
  } catch (err) {
    console.error('[api/jobs/search]', err);
    return NextResponse.json({ error: 'Falha na busca' }, { status: 500 });
  }
}
