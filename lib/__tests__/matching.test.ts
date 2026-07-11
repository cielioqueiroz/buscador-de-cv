import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Job, CVProfile, MatchResult } from '@/lib/providers/types';

const { matchJobs } = vi.hoisted(() => ({
  matchJobs: vi.fn(async (_cv: CVProfile, _jobs: Job[]): Promise<MatchResult[]> => []),
}));
vi.mock('@/lib/ai/gemini', () => ({ matchJobs }));

import { rankJobs } from '@/lib/matching';

const cv = { title: 'Dev', seniority: 'pleno', skills: [], areas: [], searchQueries: [], rawText: 'x' } as CVProfile;
const mk = (id: string): Job => ({
  id, title: 'Dev', company: 'A', location: 'SP', remote: false,
  description: 'd', source: 'adzuna', applyUrl: 'https://x.com/' + id,
});
const score = (jobId: string, score: number): MatchResult => ({ jobId, score, reasons: ['r'], gaps: ['g'] });

beforeEach(() => {
  matchJobs.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('rankJobs', () => {
  it('ordena por score desc e casa cada match com a sua vaga', async () => {
    matchJobs.mockResolvedValueOnce([score('low', 40), score('high', 90)]);

    const ranked = await rankJobs(cv, [mk('low'), mk('high')]);
    expect(ranked[0].job.id).toBe('high');
    expect(ranked[0].match.score).toBe(90);
    expect(ranked[1].job.id).toBe('low');
  });

  // O free tier do Gemini permite 15 req/min. Uma chamada por vaga estourava a
  // cota (429) logo na primeira busca — o lote existe por causa disso.
  it('pontua o lote inteiro numa chamada só', async () => {
    matchJobs.mockResolvedValueOnce([score('a', 50), score('b', 60), score('c', 70)]);

    await rankJobs(cv, [mk('a'), mk('b'), mk('c')]);
    expect(matchJobs).toHaveBeenCalledTimes(1);
    expect(matchJobs.mock.calls[0][1]).toHaveLength(3);
  });

  it('omite a vaga que a IA deixou de pontuar, em vez de inventar um score', async () => {
    matchJobs.mockResolvedValueOnce([score('a', 50)]); // 'b' ficou de fora

    const ranked = await rankJobs(cv, [mk('a'), mk('b')]);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].job.id).toBe('a');
  });

  // Devolver [] faria a UI dizer "nenhuma vaga encontrada", escondendo a causa.
  it('estoura quando a IA não pontua nada', async () => {
    matchJobs.mockResolvedValueOnce([]);
    await expect(rankJobs(cv, [mk('a')])).rejects.toThrow(/pontuar as vagas/);
  });

  it('propaga a falha da IA em vez de engolir', async () => {
    matchJobs.mockRejectedValueOnce(new Error('429 quota'));
    await expect(rankJobs(cv, [mk('a')])).rejects.toThrow(/429/);
  });
});
