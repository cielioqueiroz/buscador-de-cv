import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { ApiRequestError, assertSameOrigin, readJson } from '@/lib/api/request';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { CVProfileSchema } from '@/lib/providers/types';
import { getProfile, upsertProfile } from '@/lib/auth/profile';

export const runtime = 'nodejs';

const MAX_BYTES = 32 * 1024;

const ImportSchema = z.object({
  profile: CVProfileSchema,
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Faça login para importar.' }, { status: 401 });
    }
    const userId = session.user.id;

    if (!(await checkRateLimit(`import:${userId}:${clientIp(req)}`, 5, 60_000))) {
      return NextResponse.json(
        { error: 'Aguarde antes de tentar de novo.' },
        { status: 429 },
      );
    }

    const body = await readJson(req, ImportSchema, MAX_BYTES);

    // Se o usuário já tem um perfil servidor, não sobrescreve sem pedir — a
    // decisão fica com a UI: ela pergunta antes e, se o usuário aceitar, repete
    // a chamada com `?force=true`.
    const url = new URL(req.url);
    const force = url.searchParams.get('force') === 'true';
    if (!force) {
      const existing = await getProfile(userId);
      if (existing) {
        return NextResponse.json(
          { conflict: true, server: existing },
          { status: 409 },
        );
      }
    }

    await upsertProfile(userId, body.profile);
    return NextResponse.json({ ok: true }, { status: 200 });
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
    console.error('[api/perfil/import] erro:', error);
    return NextResponse.json({ error: 'Falha ao importar perfil.' }, { status: 500 });
  }
}
