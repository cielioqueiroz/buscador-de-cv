import { describe, it, expect, vi, beforeEach } from 'vitest';

const { queryMock, authMock, rateLimitMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  authMock: vi.fn(),
  rateLimitMock: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  pool: { query: queryMock },
  assertDatabaseUrl: () => 'postgres://x',
}));
vi.mock('@/auth', () => ({ auth: authMock }));
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: rateLimitMock,
  clientIp: () => '127.0.0.1',
}));

import { PATCH } from '@/app/api/perfil/conta/route';

function request(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/perfil/conta', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  queryMock.mockReset();
  authMock.mockReset();
  rateLimitMock.mockReset();
  rateLimitMock.mockResolvedValue(true);
});

describe('PATCH /api/perfil/conta', () => {
  it('devolve 401 sem sessão', async () => {
    authMock.mockResolvedValueOnce(null);
    const res = await PATCH(request({ name: 'Ana' }));
    expect(res.status).toBe(401);
  });

  it('bloqueia chamada cross-site', async () => {
    const res = await PATCH(request({ name: 'Ana' }, { 'sec-fetch-site': 'cross-site' }));
    expect(res.status).toBe(400);
    expect(authMock).not.toHaveBeenCalled();
  });

  it('atualiza o nome do próprio usuário, já aparado', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 'u1', name: 'Ana Souza', email: 'a@x.com', image: null, provider: 'email' }],
    });
    const res = await PATCH(request({ name: '  Ana Souza  ' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ name: 'Ana Souza' });
    expect(queryMock.mock.calls[0][1]).toEqual(['u1', 'Ana Souza']);
  });

  it('recusa nome vazio', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    const res = await PATCH(request({ name: '   ' }));
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('ignora campos extras como e-mail ou imagem', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 'u1', name: 'Ana', email: 'a@x.com', image: null, provider: 'email' }],
    });
    const res = await PATCH(request({ name: 'Ana', email: 'outro@x.com', image: 'https://evil' }));
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][1]).toEqual(['u1', 'Ana']);
  });

  it('devolve 429 quando estoura o limite', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    rateLimitMock.mockResolvedValueOnce(false);
    const res = await PATCH(request({ name: 'Ana' }));
    expect(res.status).toBe(429);
  });
});
