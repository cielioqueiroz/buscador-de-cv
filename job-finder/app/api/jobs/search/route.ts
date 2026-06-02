import { NextResponse } from 'next/server';
import { searchAllProviders } from '@/lib/providers';

export async function POST(req: Request) {
  try {
    const { queries, opts } = await req.json();
    if (!Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json({ error: 'queries obrigatórias' }, { status: 400 });
    }
    const jobs = await searchAllProviders(queries, opts ?? {});
    return NextResponse.json({ jobs });
  } catch {
    return NextResponse.json({ error: 'Falha na busca' }, { status: 500 });
  }
}
