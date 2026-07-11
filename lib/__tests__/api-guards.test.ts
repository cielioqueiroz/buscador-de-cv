import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock é içado para o topo, então a fn precisa nascer em vi.hoisted.
const { rankJobs } = vi.hoisted(() => ({
  rankJobs: vi.fn(async (_cv: unknown, _jobs: unknown[]) => []),
}));
vi.mock('@/lib/matching', () => ({ rankJobs }));

import { POST as matchPOST } from '@/app/api/jobs/match/route';
import { rateLimit } from '@/lib/rate-limit';
import { MAX_JOBS_PER_MATCH, MAX_JOBS_IN_REQUEST } from '@/lib/providers/types';

const validProfile = {
  title: 'Dev', seniority: 'pleno', skills: [], areas: [],
  searchQueries: ['react'], rawText: 'x',
};
const job = (id: string) => ({
  id, title: 'Dev', company: 'A', location: 'SP', remote: false,
  description: 'd', source: 'adzuna', applyUrl: 'https://x.com/' + id,
});

/** Cada teste usa um IP próprio para não esbarrar no rate limit do vizinho. */
function post(body: unknown, ip: string) {
  return new Request('http://x/api/jobs/match', {
    method: 'POST',
    headers: { 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  rankJobs.mockClear();
});

describe('POST /api/jobs/match — guardas', () => {
  it('rejeita corpo sem perfil válido em vez de chamar a IA', async () => {
    const res = await matchPOST(post({ profile: { lixo: true }, jobs: [job('a')] }, '1.1.1.1'));
    expect(res.status).toBe(400);
    expect(rankJobs).not.toHaveBeenCalled();
  });

  // Regressão real: a busca devolve dezenas de vagas e o cliente manda todas.
  // Recusar isso com 400 quebrava a tela de resultados por completo.
  it('aceita o payload real da busca (dezenas de vagas) e pontua só o teto', async () => {
    const jobs = Array.from({ length: 40 }, (_, i) => job(`j${i}`));
    const res = await matchPOST(post({ profile: validProfile, jobs }, '2.2.2.2'));

    expect(res.status).toBe(200);
    // O corte é de custo: 40 vagas entram, mas só MAX_JOBS_PER_MATCH viram
    // chamada paga à IA.
    const scored = rankJobs.mock.calls.at(-1)![1] as unknown[];
    expect(scored).toHaveLength(MAX_JOBS_PER_MATCH);
  });

  it('barra um payload absurdo, que aí sim é abuso', async () => {
    const jobs = Array.from({ length: MAX_JOBS_IN_REQUEST + 1 }, (_, i) => job(`j${i}`));
    const res = await matchPOST(post({ profile: validProfile, jobs }, '2.2.2.9'));
    expect(res.status).toBe(400);
    expect(rankJobs).not.toHaveBeenCalled();
  });

  it('aceita um corpo bem formado', async () => {
    const res = await matchPOST(post({ profile: validProfile, jobs: [job('a')] }, '3.3.3.3'));
    expect(res.status).toBe(200);
    expect(rankJobs).toHaveBeenCalledOnce();
  });

  it('corta o abuso: o 6º request seguido do mesmo IP leva 429', async () => {
    const ip = '4.4.4.4';
    for (let i = 0; i < 5; i++) {
      const ok = await matchPOST(post({ profile: validProfile, jobs: [job('a')] }, ip));
      expect(ok.status).toBe(200);
    }
    const blocked = await matchPOST(post({ profile: validProfile, jobs: [job('a')] }, ip));
    expect(blocked.status).toBe(429);
  });
});

describe('rateLimit', () => {
  it('libera dentro da cota e bloqueia depois', () => {
    expect(rateLimit('k', 2, 60_000)).toBe(true);
    expect(rateLimit('k', 2, 60_000)).toBe(true);
    expect(rateLimit('k', 2, 60_000)).toBe(false);
  });
});
