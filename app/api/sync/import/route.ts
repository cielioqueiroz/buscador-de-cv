import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { ApiRequestError, assertSameOrigin, readJson } from '@/lib/api/request';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { CVProfileSchema } from '@/lib/providers/types';
import { ApplicationSchema } from '@/lib/application-schema';
import { SavedLetterSchema } from '@/lib/letter-schema';
import { AdaptedCVSchema } from '@/lib/cv-features';
import { upsertProfile, getProfile } from '@/lib/auth/profile';
import {
  setFavorite,
  upsertAdaptedCV,
  upsertApplication,
  upsertLetter,
} from '@/lib/auth/sync';

export const runtime = 'nodejs';

const MAX_BYTES = 1_024 * 1024; // 1 MB — tudo do localStorage de um usuário cabe aqui.

const BundleSchema = z.object({
  profile: CVProfileSchema.optional(),
  applications: z.array(ApplicationSchema).max(200).optional(),
  favorites: z.array(z.string().trim().min(1).max(500)).max(500).optional(),
  letters: z.record(z.string().max(500), SavedLetterSchema).optional(),
  adapted: z.record(z.string().max(500), AdaptedCVSchema).optional(),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
    }
    const userId = session.user.id;

    if (!(await checkRateLimit(`sync-import:${userId}:${clientIp(req)}`, 5, 60_000))) {
      return NextResponse.json({ error: 'Aguarde.' }, { status: 429 });
    }

    const bundle = await readJson(req, BundleSchema, MAX_BYTES);
    const force = new URL(req.url).searchParams.get('force') === 'true';

    // Perfil é o único campo que preserva: só substitui com `?force=true`.
    // O resto é aditivo (upsert), então importar o localStorage por cima do
    // que já tem no servidor é inofensivo.
    if (bundle.profile) {
      const existing = await getProfile(userId);
      if (existing && !force) {
        return NextResponse.json(
          { conflict: true, server: existing },
          { status: 409 },
        );
      }
      await upsertProfile(userId, bundle.profile);
    }

    if (bundle.applications) {
      for (const app of bundle.applications) {
        await upsertApplication(userId, app);
      }
    }
    if (bundle.favorites) {
      for (const jobId of bundle.favorites) {
        await setFavorite(userId, jobId, true);
      }
    }
    if (bundle.letters) {
      for (const [jobId, saved] of Object.entries(bundle.letters)) {
        await upsertLetter(userId, jobId, saved);
      }
    }
    if (bundle.adapted) {
      for (const [jobId, payload] of Object.entries(bundle.adapted)) {
        await upsertAdaptedCV(userId, jobId, payload);
      }
    }

    return NextResponse.json({
      ok: true,
      imported: {
        profile: Boolean(bundle.profile),
        applications: bundle.applications?.length ?? 0,
        favorites: bundle.favorites?.length ?? 0,
        letters: Object.keys(bundle.letters ?? {}).length,
        adapted: Object.keys(bundle.adapted ?? {}).length,
      },
    });
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
    console.error('[api/sync/import]', error);
    return NextResponse.json({ error: 'Falha ao importar.' }, { status: 500 });
  }
}
