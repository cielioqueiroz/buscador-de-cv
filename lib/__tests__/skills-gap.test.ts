import { describe, it, expect } from 'vitest';
import { topMissingSkills } from '@/lib/skills-gap';
import type { RankedJob } from '@/lib/ranked';

const r = (id: string, missingSkills?: string[]): RankedJob => ({
  job: {
    id, title: 'Dev', company: 'A', location: 'SP', remote: false,
    description: 'd', source: 'adzuna', applyUrl: 'https://x.com/' + id,
  },
  match: { jobId: id, score: 70, reasons: [], gaps: [], missingSkills },
});

describe('topMissingSkills', () => {
  it('soma entre vagas ignorando caixa e acento, e ordena pelo total', () => {
    const top = topMissingSkills([
      r('a', ['Docker', 'Inglês avançado']),
      r('b', ['docker', 'ingles avançado', 'Kubernetes']),
      r('c', ['DOCKER']),
    ]);
    expect(top).toEqual([
      { skill: 'Docker', count: 3 },
      { skill: 'Inglês avançado', count: 2 },
    ]);
  });

  it('a mesma vaga citando duas vezes conta uma', () => {
    expect(topMissingSkills([r('a', ['SQL', 'sql']), r('b', ['SQL'])])).toEqual([{ skill: 'SQL', count: 2 }]);
  });

  it('lacuna de uma vaga só é ruído e fica de fora', () => {
    expect(topMissingSkills([r('a', ['Rust']), r('b', ['Go'])])).toEqual([]);
  });

  it('notas antigas sem o campo não quebram nada', () => {
    expect(topMissingSkills([r('a'), r('b', ['SQL']), r('c', ['SQL'])])).toEqual([{ skill: 'SQL', count: 2 }]);
  });

  it('respeita o limite', () => {
    const many = ['A', 'B', 'C', 'D'];
    expect(topMissingSkills([r('x', many), r('y', many)], 2)).toHaveLength(2);
  });
});
