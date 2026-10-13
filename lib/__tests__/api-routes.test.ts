import { describe, it, expect, vi, beforeEach } from 'vitest';

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock('@/auth', () => ({ auth: authMock }));
vi.mock('@/lib/cv/parser', () => ({ extractText: vi.fn(async () => 'texto cv') }));
vi.mock('@/lib/ai/gemini', () => ({
  analyzeCV: vi.fn(async () => ({ title: 'Dev', seniority: 'pleno', skills: [], areas: [], searchQueries: ['react'], rawText: 'texto cv' })),
}));
vi.mock('@/lib/providers', () => ({
  searchAllProviders: vi.fn(async () => [{ id: 'a1', title: 'Dev', company: 'A', location: 'SP', remote: false, description: 'd', source: 'adzuna', applyUrl: 'https://x.com/a1' }]),
}));

import { POST as searchPOST } from '@/app/api/jobs/search/route';
import { POST as analyzePOST } from '@/app/api/cv/analyze/route';
import { POST as adaptPOST } from '@/app/api/cv/adapt/route';
import { POST as reportPOST } from '@/app/api/cv/report/route';
import { POST as matchPOST } from '@/app/api/jobs/match/route';
import { POST as letterPOST } from '@/app/api/cover-letter/route';

beforeEach(() => {
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { id: 'u1' } });
});

describe('POST /api/jobs/search', () => {
  it('retorna vagas para as queries enviadas', async () => {
    const req = new Request('http://x/api/jobs/search', {
      method: 'POST', body: JSON.stringify({ queries: ['react'], opts: {} }),
    });
    const res = await searchPOST(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.jobs).toHaveLength(1);
    expect(json.jobs[0].applyUrl).toBe('https://x.com/a1');
  });
});

describe('rotas de IA e busca exigem conta', () => {
  const routes = [
    ['/api/cv/analyze', analyzePOST],
    ['/api/cv/adapt', adaptPOST],
    ['/api/cv/report', reportPOST],
    ['/api/jobs/search', searchPOST],
    ['/api/jobs/match', matchPOST],
    ['/api/cover-letter', letterPOST],
  ] as const;

  it.each(routes)('%s devolve 401 sem sessão', async (path, handler) => {
    authMock.mockResolvedValue(null);
    const res = await handler(new Request(`http://x${path}`, { method: 'POST', body: '{}' }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toMatch(/entre na sua conta/i);
  });
});
