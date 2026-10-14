import { NextResponse } from 'next/server';
import { ApiRequestError, assertSameOrigin, readJson } from '@/lib/api/request';
import { checkRateLimit } from '@/lib/rate-limit';
import { sessionUserId, unauthorized } from '@/lib/api/auth-guard';
import { getProfile, ProfileEditSchema, upsertProfile } from '@/lib/auth/profile';
import { clearRanking } from '@/lib/jobs/store';

export const runtime = 'nodejs';

const MAX_BYTES = 8 * 1024;

/**
 * Corrige o que a IA entendeu do CV (cargo, senioridade, habilidades, áreas,
 * buscas). Não chama a IA. O ranking salvo foi pontuado contra o perfil
 * anterior, então é descartado: a próxima visita a /resultados busca de novo.
 */
export async function PUT(req: Request) {
  try {
    assertSameOrigin(req);
    const userId = await sessionUserId();
    if (!userId) return unauthorized();

    if (!(await checkRateLimit(`perfil-cv:${userId}`, 20, 60_000))) {
      return NextResponse.json({ error: 'Aguarde antes de salvar de novo.' }, { status: 429 });
    }

    const edit = await readJson(req, ProfileEditSchema, MAX_BYTES);
    const current = await getProfile(userId);
    if (!current) {
      return NextResponse.json({ error: 'Envie seu currículo primeiro.' }, { status: 409 });
    }

    await upsertProfile(userId, { ...edit, rawText: current.rawText });
    await clearRanking(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[api/perfil/cv]', error);
    return NextResponse.json({ error: 'Falha ao salvar o perfil.' }, { status: 500 });
  }
}
