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

import { POST } from '@/app/api/sync/import/route';

const profile = {
  title: 'Dev',
  seniority: 'pleno' as const,
  skills: ['react'],
  areas: ['frontend'],
  searchQueries: ['react'],
  rawText: 'cv',
};

const application = {
  id: 'j1',
  job: {
    id: 'j1',
    title: 'Dev',
    company: 'Acme',
    location: 'SP',
    remote: false,
    description: 'd',
    source: 'adzuna' as const,
    applyUrl: 'https://example.com/j1',
  },
  match: { jobId: 'j1', score: 80, reasons: ['forte'], gaps: [] },
  stage: 'aplicado' as const,
  createdAt: 1_000,
  updatedAt: 2_000,
};

function request(body: unknown, search = ''): Request {
  return new Request(`http://localhost/api/sync/import${search}`, {
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

describe('POST /api/sync/import', () => {
  it('nega sem sessão', async () => {
    authMock.mockResolvedValueOnce(null);
    const res = await POST(request({ profile }));
    expect(res.status).toBe(401);
  });

  it('bloqueia perfil quando já há um no servidor', async () => {
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
  });

  it('aceita bundle completo e grava cada seção', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    // getProfile vazio → upsertProfile → upsertApplication → setFavorite ×1 → upsertLetter
    queryMock
      .mockResolvedValueOnce({ rows: [] }) // getProfile
      .mockResolvedValueOnce({ rows: [] }) // upsert profile
      .mockResolvedValueOnce({ rows: [] }) // upsert application
      .mockResolvedValueOnce({ rows: [] }) // setFavorite insert
      .mockResolvedValueOnce({ rows: [] }); // upsert letter
    const letter = {
      letter: {
        greeting: 'oi',
        paragraphs: ['a', 'b'],
        closing: 'tchau',
        keywords: ['x'],
      },
      text: 'texto',
      tone: 'formal' as const,
      length: 'curta' as const,
      savedAt: 1_000,
    };
    const res = await POST(
      request({
        profile,
        applications: [application],
        favorites: ['j1'],
        letters: { j1: letter },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.imported).toEqual({
      profile: true,
      applications: 1,
      favorites: 1,
      letters: 1,
      adapted: 0,
    });
  });

  it('substitui perfil quando force=true', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    queryMock.mockResolvedValueOnce({ rows: [] }); // upsert profile direto
    const res = await POST(request({ profile }, '?force=true'));
    expect(res.status).toBe(200);
  });
});
