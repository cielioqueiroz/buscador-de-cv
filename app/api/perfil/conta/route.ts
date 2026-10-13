import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ApiRequestError, assertSameOrigin, readJson } from '@/lib/api/request';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { AccountUpdateSchema } from '@/lib/auth/signup-schema';
import { updateUserName } from '@/lib/auth/users';

export const runtime = 'nodejs';

const MAX_BYTES = 2 * 1024;

export async function PATCH(req: Request) {
  try {
    assertSameOrigin(req);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
    }
    const userId = session.user.id;

    if (!(await checkRateLimit(`conta:${userId}:${clientIp(req)}`, 10, 60_000))) {
      return NextResponse.json({ error: 'Aguarde antes de tentar de novo.' }, { status: 429 });
    }

    const body = await readJson(req, AccountUpdateSchema, MAX_BYTES);
    const account = await updateUserName(userId, body.name);
    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada.' }, { status: 404 });
    }
    return NextResponse.json({ name: account.name }, { status: 200 });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[api/perfil/conta] erro:', error);
    return NextResponse.json({ error: 'Falha ao salvar.' }, { status: 500 });
  }
}
