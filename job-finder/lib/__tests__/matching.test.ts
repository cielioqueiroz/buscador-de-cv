import { describe, it, expect, vi } from 'vitest';
import type { Job, CVProfile } from '@/lib/providers/types';

vi.mock('@/lib/ai/claude', () => ({
  matchJob: vi.fn(async (_cv: CVProfile, job: Job) => ({
    jobId: job.id, score: job.id === 'high' ? 90 : 40,
    reasons: ['r'], gaps: ['g'],
  })),
}));

import { rankJobs } from '@/lib/matching';

const cv = { title: 'Dev', seniority: 'pleno', skills: [], areas: [], searchQueries: [], rawText: 'x' } as CVProfile;
const mk = (id: string): Job => ({
  id, title: 'Dev', company: 'A', location: 'SP', remote: false,
  description: 'd', source: 'adzuna', applyUrl: 'https://x.com/' + id,
});

describe('rankJobs', () => {
  it('ordena por score desc e anexa o match', async () => {
    const ranked = await rankJobs(cv, [mk('low'), mk('high')]);
    expect(ranked[0].job.id).toBe('high');
    expect(ranked[0].match.score).toBe(90);
    expect(ranked[1].job.id).toBe('low');
  });
});
