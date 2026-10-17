const DEFAULT_TIMEOUT_MS = 8_000;

/** Resposta de erro de uma fonte externa, com o status à mão para quem decide o que fazer. */
export class ProviderHttpError extends Error {
  constructor(public readonly status: number) {
    super(`HTTP ${status}`);
    this.name = 'ProviderHttpError';
  }
}

/** Fetch externo com timeout e resposta JSON tipada como dado não confiável. */
export async function fetchJson(
  input: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    if (!response.ok) throw new ProviderHttpError(response.status);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fonte fora do ar, sem cota (429), instável (5xx) ou lenta (timeout) é o dia a
 * dia de APIs de vagas: a busca segue com as outras fontes. Isso vira aviso, não
 * erro — senão o painel de erros da Vercel enche de ruído e esconde os reais.
 */
export function logProviderFailure(provider: string, err: unknown): void {
  const transitoria =
    (err instanceof ProviderHttpError && (err.status === 429 || err.status >= 500)) ||
    (err instanceof Error && err.name === 'AbortError');
  if (transitoria) console.warn(`[provider/${provider}] indisponível agora:`, err instanceof Error ? err.message : err);
  else console.error(`[provider/${provider}]`, err);
}
