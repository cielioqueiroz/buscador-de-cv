import { z } from 'zod';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 413 | 415 = 400,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

/**
 * Bloqueia chamadas de navegador vindas de outro site. As rotas são públicas,
 * então requests sem Origin continuam permitidos para CLI e integrações, mas
 * formulários cross-site não conseguem disparar o custo do app em nome do
 * usuário.
 */
export function assertSameOrigin(req: Request): void {
  if (req.headers.get('sec-fetch-site') === 'cross-site') {
    throw new ApiRequestError('Origem da requisição não permitida.');
  }

  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  if (!origin || !host) return;

  try {
    if (new URL(origin).host !== host) {
      throw new ApiRequestError('Origem da requisição não permitida.');
    }
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError('Origem da requisição inválida.');
  }

}

/** Lê JSON com limite antes de entregar o corpo ao Zod. */
export async function readJson<T>(
  req: Request,
  schema: z.ZodType<T>,
  maxBytes: number,
): Promise<T> {
  const declaredLength = Number(req.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new ApiRequestError('Payload muito grande.', 413);
  }

  if (!req.body) throw new ApiRequestError('Corpo obrigatório.');

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new ApiRequestError('Payload muito grande.', 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new TextDecoder().decode(concat(chunks, total));
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new ApiRequestError('JSON inválido.');
  }

  const result = schema.safeParse(parsed);
  if (!result.success) throw new ApiRequestError('Requisição inválida.');
  return result.data;
}

function concat(chunks: Uint8Array[], total: number): Uint8Array {
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}
