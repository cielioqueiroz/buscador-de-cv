import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/cv/parser', () => ({ extractText: vi.fn(async () => 'texto cv') }));
vi.mock('@/lib/ai/claude', () => ({
  analyzeCV: vi.fn(async () => ({ title: 'Dev', seniority: 'pleno', skills: [], areas: [], searchQueries: ['react'], rawText: 'texto cv' })),
}));
vi.mock('@/lib/providers', () => ({
  searchAllProviders: vi.fn(async () => [{ id: 'a1', title: 'Dev', company: 'A', location: 'SP', remote: false, description: 'd', source: 'adzuna', applyUrl: 'https://x.com/a1' }]),
}));

import { POST as searchPOST } from '@/app/api/jobs/search/route';

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
