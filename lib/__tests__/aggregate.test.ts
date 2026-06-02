import { describe, it, expect, vi } from 'vitest';
import { searchAllProviders } from '@/lib/providers';
import type { Job } from '@/lib/providers/types';

const mk = (id: string, source: any): Job => ({
  id, title: 'Dev', company: 'ACME', location: 'SP', remote: false,
  description: 'd', source, applyUrl: 'https://x.com/' + source,
});

describe('searchAllProviders', () => {
  it('agrega resultados de todos os providers e deduplica por id', async () => {
    const providers = [
      { name: 'adzuna', search: vi.fn(async () => [mk('dup', 'adzuna'), mk('a1', 'adzuna')]) },
      { name: 'remotive', search: vi.fn(async () => [mk('dup', 'remotive')]) },
    ] as any;
    const jobs = await searchAllProviders(['react'], {}, providers);
    const ids = jobs.map(j => j.id).sort();
    expect(ids).toEqual(['a1', 'dup']);
  });

  it('um provider que rejeita não derruba a busca', async () => {
    const providers = [
      { name: 'adzuna', search: vi.fn(async () => [mk('a1', 'adzuna')]) },
      { name: 'jsearch', search: vi.fn(async () => { throw new Error('boom'); }) },
    ] as any;
    const jobs = await searchAllProviders(['react'], {}, providers);
    expect(jobs.map(j => j.id)).toEqual(['a1']);
  });
});
