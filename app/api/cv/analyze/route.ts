import { NextResponse } from 'next/server';
import { extractText } from '@/lib/cv/parser';
import { analyzeCV } from '@/lib/ai/claude';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractText(buffer, file.name);
    if (!text || text.length < 30) {
      return NextResponse.json({ error: 'CV vazio ou ilegível. Tente outro formato.' }, { status: 422 });
    }
    const profile = await analyzeCV(text);
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: 'Falha ao analisar o CV' }, { status: 500 });
  }
}
