import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ApiRequestError, assertSameOrigin, readJson } from '@/lib/api/request';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { AccountUpdateSchema } from '@/lib/auth/signup-schema';
import { updateUserName } from '@/lib/auth/users';
import { checkAccountDeletion, deleteAccount, DeleteAccountSchema } from '@/lib/auth/account-data';

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

const DELETE_MESSAGES = {
  'email-mismatch': { status: 400, error: 'Digite o e-mail da sua conta para confirmar.' },
  'password-required': { status: 400, error: 'Digite sua senha para confirmar.' },
  'wrong-password': { status: 403, error: 'Senha incorreta.' },
  'not-found': { status: 404, error: 'Conta não encontrada.' },
} as const;

/** Exclui a conta e tudo que é dela. Exige confirmar o e-mail (e a senha, se houver). */
export async function DELETE(req: Request) {
  try {
    assertSameOrigin(req);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
    }
    const userId = session.user.id;

    // Pede senha: o teto baixo segura tentativa de adivinhação com sessão roubada.
    if (!(await checkRateLimit(`conta-del:${userId}`, 5, 60 * 60_000))) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde antes de tentar de novo.' }, { status: 429 });
    }

    const body = await readJson(req, DeleteAccountSchema, MAX_BYTES);
    const check = await checkAccountDeletion(userId, body);
    if (check !== 'ok') {
      const { status, error } = DELETE_MESSAGES[check];
      return NextResponse.json({ error }, { status });
    }

    await deleteAccount(userId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[api/perfil/conta] erro ao excluir:', error);
    return NextResponse.json({ error: 'Falha ao excluir a conta.' }, { status: 500 });
  }
}
