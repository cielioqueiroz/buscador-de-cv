import { NextResponse } from 'next/server';
import { extractText, SUPPORTED_EXTENSIONS } from '@/lib/cv/parser';
import { analyzeCV } from '@/lib/ai/gemini';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  if (!rateLimit(`analyze:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Muitas análises seguidas. Aguarde um minuto.' }, { status: 429 });
  }

  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 });
    }

    // O limite do cliente é conveniência; este aqui é o que de fato protege.
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Arquivo muito grande (máx. 8MB).' }, { status: 413 });
    }

    const name = file.name.toLowerCase();
    if (!SUPPORTED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      return NextResponse.json(
        { error: 'Formato não suportado. Envie PDF, DOCX ou TXT.' },
        { status: 415 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractText(buffer, file.name);
    if (!text || text.length < 30) {
      return NextResponse.json({ error: 'CV vazio ou ilegível. Tente outro formato.' }, { status: 422 });
    }

    const profile = await analyzeCV(text);
    return NextResponse.json({ profile });
  } catch (err) {
    console.error('[api/cv/analyze]', err);
    return NextResponse.json({ error: 'Falha ao analisar o CV' }, { status: 500 });
  }
}
