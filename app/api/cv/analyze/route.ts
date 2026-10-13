import { NextResponse } from 'next/server';
import { extractText, hasValidSignature, SUPPORTED_EXTENSIONS } from '@/lib/cv/parser';
import { analyzeCV } from '@/lib/ai/gemini';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { ApiRequestError, assertSameOrigin } from '@/lib/api/request';
import { sessionUserId, unauthorized } from '@/lib/api/auth-guard';
import { upsertProfile } from '@/lib/auth/profile';

export const runtime = 'nodejs';

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Requisição inválida.' }, { status });
  }

  const userId = await sessionUserId();
  if (!userId) return unauthorized();

  if (!(await checkRateLimit(`analyze:${clientIp(req)}`, 5, 60_000))) {
    return NextResponse.json(
      { error: 'Muitas análises seguidas. Aguarde um minuto.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  try {
    const declaredLength = Number(req.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BYTES + 64 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande (máx. 8MB).' }, { status: 413 });
    }

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
        { error: 'Formato não suportado. Envie PDF, Word (.doc/.docx), TXT, Markdown, RTF ou CSV.' },
        { status: 415 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidSignature(buffer, file.name)) {
      return NextResponse.json({ error: 'O conteúdo não corresponde à extensão informada.' }, { status: 415 });
    }
    const text = await extractText(buffer, file.name);
    if (!text || text.length < 30) {
      return NextResponse.json({ error: 'CV vazio ou ilegível. Tente outro formato.' }, { status: 422 });
    }

    const profile = await analyzeCV(text);

    // O servidor é a fonte de verdade do perfil. Se a gravação falhar, o
    // usuário ainda recebe o perfil e segue para as vagas nesta sessão.
    try {
      await upsertProfile(userId, profile);
    } catch (err) {
      console.error('[api/cv/analyze] falha ao persistir perfil:', err);
    }

    return NextResponse.json({ profile });
  } catch (err) {
    if (err instanceof ApiRequestError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[api/cv/analyze]', err);
    return NextResponse.json({ error: 'Falha ao analisar o CV' }, { status: 500 });
  }
}
