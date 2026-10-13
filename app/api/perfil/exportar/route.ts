import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ApiRequestError, assertSameOrigin } from '@/lib/api/request';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { exportAccountData } from '@/lib/auth/account-data';

export const runtime = 'nodejs';

/** Baixa um JSON com tudo que a conta guarda (portabilidade, LGPD art. 18). */
export async function GET(req: Request) {
  try {
    assertSameOrigin(req);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
    }
    const userId = session.user.id;

    if (!(await checkRateLimit(`export:${userId}:${clientIp(req)}`, 5, 10 * 60_000))) {
      return NextResponse.json({ error: 'Aguarde alguns minutos antes de baixar de novo.' }, { status: 429 });
    }

    const data = await exportAccountData(userId);
    if (!data) {
      return NextResponse.json({ error: 'Conta não encontrada.' }, { status: 404 });
    }

    const day = data.exportedAt.slice(0, 10);
    return new Response(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="vaga-certa-meus-dados-${day}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[api/perfil/exportar] erro:', error);
    return NextResponse.json({ error: 'Falha ao exportar os dados.' }, { status: 500 });
  }
}
