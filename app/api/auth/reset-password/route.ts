import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiRequestError, assertSameOrigin, readJson } from '@/lib/api/request';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { consumeResetToken } from '@/lib/auth/reset-tokens';

export const runtime = 'nodejs';

const BodySchema = z.object({
  token: z.string().trim().min(10).max(200),
  password: z
    .string()
    .min(8, 'A senha precisa de pelo menos 8 caracteres.')
    .max(200)
    .regex(/[A-Za-z]/, 'Inclua pelo menos uma letra na senha.')
    .regex(/\d/, 'Inclua pelo menos um número na senha.'),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    if (!(await checkRateLimit(`reset:${clientIp(req)}`, 10, 60 * 60_000))) {
      return NextResponse.json({ error: 'Muitas tentativas.' }, { status: 429 });
    }
    const { token, password } = await readJson(req, BodySchema, 2_000);
    const userId = await consumeResetToken(token, password);
    if (!userId) {
      return NextResponse.json(
        { error: 'Link inválido ou expirado. Peça um novo.' },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true });
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
    console.error('[auth/reset-password]', error);
    return NextResponse.json({ error: 'Falha ao redefinir.' }, { status: 500 });
  }
}
