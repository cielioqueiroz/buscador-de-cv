import { describe, it, expect } from 'vitest';
import { JobSchema } from '@/lib/providers/types';

describe('JobSchema', () => {
  it('aceita uma vaga válida', () => {
    const job = {
      id: 'abc', title: 'Dev', company: 'ACME', location: 'Remoto',
      remote: true, description: 'desc', source: 'adzuna',
      applyUrl: 'https://x.com/apply',
    };
    expect(() => JobSchema.parse(job)).not.toThrow();
  });

  it('rejeita vaga sem applyUrl', () => {
    const bad = { id: 'a', title: 'Dev', company: 'ACME', location: 'X', remote: false, description: 'd', source: 'adzuna' };
    expect(() => JobSchema.parse(bad)).toThrow();
  });
});
