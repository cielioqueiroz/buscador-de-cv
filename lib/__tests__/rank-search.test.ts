import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CVProfile, Job, MatchResult } from '@/lib/providers/types';

const m = vi.hoisted(() => ({
  getProfile: vi.fn(),
  loadSearch: vi.fn(),
  loadCachedScores: vi.fn(),
  saveScores: vi.fn(),
  saveRanking: vi.fn(),
  matchJobs: vi.fn(),
  listDismissedIds: vi.fn(),
}));
vi.mock('@/lib/jobs/dismissals', () => ({ listDismissedIds: m.listDismissedIds }));
vi.mock('@/lib/auth/profile', () => ({ getProfile: m.getProfile }));
vi.mock('@/lib/jobs/store', () => ({
  loadSearch: m.loadSearch,
  loadCachedScores: m.loadCachedScores,
  saveScores: m.saveScores,
  saveRanking: m.saveRanking,
}));
vi.mock('@/lib/ai/gemini', () => ({ matchJobs: m.matchJobs }));

import {
  MissingProfileError,
  MissingSearchError,
  profileHash,
  rankLatestSearch,
} from '@/lib/jobs/rank-search';
import { MAX_JOBS_PER_MATCH } from '@/lib/providers/types';

const profile: CVProfile = {
  title: 'Dev', seniority: 'pleno', skills: ['React'], areas: [], searchQueries: ['react'], rawText: 'cv',
};
const job = (id: string): Job => ({
  id, title: 'Dev', company: 'A', location: 'SP', remote: false,
  description: 'd', source: 'adzuna', applyUrl: 'https://x.com/' + id,
});
const score = (jobId: string, s: number): MatchResult => ({ jobId, score: s, reasons: [], gaps: [] });

beforeEach(() => {
  for (const fn of Object.values(m)) fn.mockReset();
  m.getProfile.mockResolvedValue(profile);
  m.loadCachedScores.mockResolvedValue(new Map());
  m.saveScores.mockResolvedValue(undefined);
  m.saveRanking.mockResolvedValue(undefined);
  m.listDismissedIds.mockResolvedValue([]);
});

describe('rankLatestSearch', () => {
  it('pontua a busca guardada contra o perfil guardado e salva notas e ranking', async () => {
    m.loadSearch.mockResolvedValue([job('a'), job('b')]);
    m.matchJobs.mockResolvedValue([score('a', 40), score('b', 90)]);

    const ranked = await rankLatestSearch('u1');

    expect(ranked.map((r) => r.job.id)).toEqual(['b', 'a']);
    expect(m.matchJobs).toHaveBeenCalledWith(profile, [job('a'), job('b')]);
    expect(m.saveScores).toHaveBeenCalledWith('u1', profileHash(profile), [score('a', 40), score('b', 90)]);
    expect(m.saveRanking).toHaveBeenCalledWith('u1', ranked);
  });

  it('só manda à IA as vagas sem nota em cache para este CV', async () => {
    m.loadSearch.mockResolvedValue([job('a'), job('b')]);
    m.loadCachedScores.mockResolvedValue(new Map([['a', score('a', 70)]]));
    m.matchJobs.mockResolvedValue([score('b', 60)]);

    await rankLatestSearch('u1');
    expect(m.matchJobs.mock.calls[0][1].map((j: Job) => j.id)).toEqual(['b']);
    expect(m.saveScores).toHaveBeenCalledWith('u1', expect.any(String), [score('b', 60)]);
  });

  it('pontua no máximo MAX_JOBS_PER_MATCH vagas (teto de custo)', async () => {
    const jobs = Array.from({ length: 70 }, (_, i) => job(`j${i}`));
    m.loadSearch.mockResolvedValue(jobs);
    m.matchJobs.mockImplementation(async (_p: CVProfile, js: Job[]) => js.map((j) => score(j.id, 50)));

    await rankLatestSearch('u1');
    expect(m.matchJobs.mock.calls[0][1]).toHaveLength(MAX_JOBS_PER_MATCH);
  });

  it('vaga descartada não é pontuada e cede o lugar no teto para a próxima', async () => {
    const jobs = Array.from({ length: MAX_JOBS_PER_MATCH + 1 }, (_, i) => job(`j${i}`));
    m.loadSearch.mockResolvedValue(jobs);
    m.listDismissedIds.mockResolvedValue(['j0']);
    m.matchJobs.mockImplementation(async (_p: CVProfile, js: Job[]) => js.map((j) => score(j.id, 50)));

    await rankLatestSearch('u1');
    const ids = m.matchJobs.mock.calls[0][1].map((j: Job) => j.id);
    expect(ids).not.toContain('j0');
    expect(ids).toContain(`j${MAX_JOBS_PER_MATCH}`);
    expect(ids).toHaveLength(MAX_JOBS_PER_MATCH);
  });

  it('sem perfil ou sem busca recente, erra com a mensagem certa e não chama a IA', async () => {
    m.getProfile.mockResolvedValue(null);
    m.loadSearch.mockResolvedValue([job('a')]);
    await expect(rankLatestSearch('u1')).rejects.toBeInstanceOf(MissingProfileError);

    m.getProfile.mockResolvedValue(profile);
    m.loadSearch.mockResolvedValue(null);
    await expect(rankLatestSearch('u1')).rejects.toBeInstanceOf(MissingSearchError);
    expect(m.matchJobs).not.toHaveBeenCalled();
  });

  it('falha ao salvar não derruba o resultado já pago', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    m.loadSearch.mockResolvedValue([job('a')]);
    m.matchJobs.mockResolvedValue([score('a', 80)]);
    m.saveScores.mockRejectedValue(new Error('db fora'));
    m.saveRanking.mockRejectedValue(new Error('db fora'));

    expect(await rankLatestSearch('u1')).toHaveLength(1);
  });

  it('a nota depende do conteúdo do CV, não das queries de busca', () => {
    const outrasQueries = { ...profile, searchQueries: ['vue'] };
    const outroCV = { ...profile, skills: ['Vue'] };
    expect(profileHash(outrasQueries)).toBe(profileHash(profile));
    expect(profileHash(outroCV)).not.toBe(profileHash(profile));
  });
});
