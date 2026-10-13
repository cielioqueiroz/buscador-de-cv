import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ApiRequestError, assertSameOrigin } from '@/lib/api/request';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import {
  AVATAR_MAX_UPLOAD_BYTES,
  AvatarError,
  deleteAvatar,
  getAvatar,
  processAvatar,
  saveAvatar,
} from '@/lib/auth/avatar';

export const runtime = 'nodejs';

// Folga para os delimitadores do multipart em volta do arquivo.
const MAX_BODY_BYTES = AVATAR_MAX_UPLOAD_BYTES + 64 * 1024;

/**
 * Serve a foto de quem está logado. Sem id na URL: não há como pedir a foto
 * de outra pessoa.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
  }

  try {
    const avatar = await getAvatar(session.user.id);
    if (!avatar) {
      return NextResponse.json({ error: 'Sem foto.' }, { status: 404 });
    }
    return new Response(new Uint8Array(avatar.data), {
      status: 200,
      headers: {
        'Content-Type': avatar.mime,
        'Content-Length': String(avatar.data.byteLength),
        'Cache-Control': 'private, max-age=31536000, immutable',
        'Content-Security-Policy': "default-src 'none'",
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[api/perfil/avatar] erro ao ler:', error);
    return NextResponse.json({ error: 'Falha ao carregar a foto.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Faça login para enviar uma foto.' }, { status: 401 });
    }
    const userId = session.user.id;

    if (!(await checkRateLimit(`avatar:${userId}:${clientIp(req)}`, 10, 10 * 60_000))) {
      return NextResponse.json(
        { error: 'Muitas trocas de foto seguidas. Aguarde alguns minutos.' },
        { status: 429 },
      );
    }

    const declaredLength = Number(req.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Imagem muito grande (máx. 2MB).' }, { status: 413 });
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: 'Envio inválido.' }, { status: 400 });
    }
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Imagem obrigatória.' }, { status: 400 });
    }
    if (file.size > AVATAR_MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Imagem muito grande (máx. 2MB).' }, { status: 413 });
    }

    const encoded = await processAvatar(new Uint8Array(await file.arrayBuffer()));
    const image = await saveAvatar(userId, encoded);
    return NextResponse.json({ image }, { status: 200 });
  } catch (error) {
    if (error instanceof AvatarError || error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[api/perfil/avatar] erro ao salvar:', error);
    return NextResponse.json({ error: 'Falha ao salvar a foto.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    assertSameOrigin(req);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
    }

    await deleteAvatar(session.user.id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[api/perfil/avatar] erro ao remover:', error);
    return NextResponse.json({ error: 'Falha ao remover a foto.' }, { status: 500 });
  }
}
