import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchJson, logProviderFailure, ProviderHttpError } from '@/lib/providers/http';

let warn: ReturnType<typeof vi.spyOn>;
let error: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  error = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('fetchJson', () => {
  it('resposta de erro vira ProviderHttpError com o status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('x', { status: 429 })));
    await expect(fetchJson('https://api.exemplo/x')).rejects.toMatchObject({ name: 'ProviderHttpError', status: 429 });
  });
});

// Regressão: 429/503 das fontes apareciam como erro de runtime na Vercel e
// enchiam o painel de ruído — é o dia a dia dessas APIs, a busca segue sem elas.
describe('logProviderFailure', () => {
  it('cota, instabilidade e timeout são aviso', () => {
    logProviderFailure('jsearch', new ProviderHttpError(429));
    logProviderFailure('adzuna', new ProviderHttpError(503));
    logProviderFailure('remotive', Object.assign(new Error('aborted'), { name: 'AbortError' }));
    expect(warn).toHaveBeenCalledTimes(3);
    expect(error).not.toHaveBeenCalled();
  });

  it('erro nosso (4xx que não é 429, payload quebrado) continua sendo erro', () => {
    logProviderFailure('adzuna', new ProviderHttpError(401));
    logProviderFailure('jsearch', new TypeError('x is not iterable'));
    expect(error).toHaveBeenCalledTimes(2);
    expect(warn).not.toHaveBeenCalled();
  });
});
