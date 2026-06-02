import { NextResponse } from 'next/server';
import { rankJobs } from '@/lib/matching';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { profile, jobs } = await req.json();
    if (!profile || !Array.isArray(jobs)) {
      return NextResponse.json({ error: 'profile e jobs obrigatórios' }, { status: 400 });
    }
    const ranked = await rankJobs(profile, jobs.slice(0, 15));
    return NextResponse.json({ ranked });
  } catch {
    return NextResponse.json({ error: 'Falha no matching' }, { status: 500 });
  }
}
