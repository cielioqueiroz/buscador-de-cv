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

import { POST } from '@/app/api/perfil/import/route';

const profile = {
  title: 'Dev',
  seniority: 'pleno' as const,
  skills: ['react'],
  areas: ['frontend'],
  searchQueries: ['react'],
  rawText: 'cv',
};

function request(body: unknown, search = ''): Request {
  return new Request(`http://localhost/api/perfil/import${search}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  queryMock.mockReset();
  authMock.mockReset();
  rateLimitMock.mockReset();
  rateLimitMock.mockResolvedValue(true);
});

describe('POST /api/perfil/import', () => {
  it('devolve 401 quando não há sessão', async () => {
    authMock.mockResolvedValueOnce(null);
    const res = await POST(request({ profile }));
    expect(res.status).toBe(401);
  });

  it('persiste quando não há perfil servidor', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    queryMock
      .mockResolvedValueOnce({ rows: [] }) // getProfile
      .mockResolvedValueOnce({ rows: [] }); // upsert
    const res = await POST(request({ profile }));
    expect(res.status).toBe(200);
  });

  it('devolve 409 quando já existe perfil no servidor', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          title: profile.title,
          seniority: profile.seniority,
          skills: profile.skills,
          areas: profile.areas,
          search_queries: profile.searchQueries,
          raw_text: profile.rawText,
        },
      ],
    });
    const res = await POST(request({ profile }));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.conflict).toBe(true);
  });

  it('substitui quando force=true', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    queryMock.mockResolvedValueOnce({ rows: [] }); // só o upsert
    const res = await POST(request({ profile }, '?force=true'));
    expect(res.status).toBe(200);
  });

  it('devolve 400 em payload inválido', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    const res = await POST(request({ profile: { title: '' } }));
    expect(res.status).toBe(400);
  });
});
