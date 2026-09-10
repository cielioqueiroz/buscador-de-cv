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

  it('aceita somente URLs HTTP(S) para candidatura', () => {
    const base = {
      id: 'abc', title: 'Dev', company: 'ACME', location: 'Remoto',
      remote: true, description: 'desc', source: 'adzuna',
    };

    expect(() => JobSchema.parse({ ...base, applyUrl: 'https://x.com/apply' })).not.toThrow();
    expect(() => JobSchema.parse({ ...base, applyUrl: 'javascript:alert(1)' })).toThrow();
    expect(() => JobSchema.parse({ ...base, applyUrl: 'data:text/html,<script>alert(1)</script>' })).toThrow();
  });

  it('limita campos textuais vindos de provedores externos', () => {
    const job = {
      id: 'abc', title: 'Dev', company: 'ACME', location: 'Remoto',
      remote: true, description: 'x'.repeat(50_001), source: 'adzuna',
      applyUrl: 'https://x.com/apply',
    };
    expect(() => JobSchema.parse(job)).toThrow();
  });
});
