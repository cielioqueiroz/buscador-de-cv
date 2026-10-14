import { describe, it, expect, vi } from 'vitest';
import { searchAllProviders } from '@/lib/providers';
import type { Job, JobProvider } from '@/lib/providers/types';

const mk = (id: string, source: Job['source'], over: Partial<Job> = {}): Job => ({
  id, title: `Dev ${id}`, company: 'ACME', location: 'SP', remote: false,
  description: 'd', source, applyUrl: 'https://x.com/' + source, ...over,
});

describe('searchAllProviders', () => {
  it('agrega resultados de todos os providers e deduplica por id', async () => {
    const providers = [
      { name: 'adzuna', search: vi.fn(async () => [mk('dup', 'adzuna'), mk('a1', 'adzuna')]) },
      { name: 'remotive', search: vi.fn(async () => [mk('dup', 'remotive')]) },
    ] satisfies JobProvider[];
    const jobs = await searchAllProviders(['react'], {}, providers);
    const ids = jobs.map(j => j.id).sort();
    expect(ids).toEqual(['a1', 'dup']);
  });

  it('um provider que rejeita não derruba a busca', async () => {
    const providers = [
      { name: 'adzuna', search: vi.fn(async () => [mk('a1', 'adzuna')]) },
      { name: 'jsearch', search: vi.fn(async () => { throw new Error('boom'); }) },
    ] satisfies JobProvider[];
    const jobs = await searchAllProviders(['react'], {}, providers);
    expect(jobs.map(j => j.id)).toEqual(['a1']);
  });

  it('junta a mesma vaga escrita de jeitos diferentes por fontes diferentes', async () => {
    const jsearch = mk('j1', 'jsearch', {
      title: 'Desenvolvedor Front-end Pleno', company: 'Nubank Ltda', location: 'São Paulo, SP',
    });
    const adzuna = mk('a1', 'adzuna', {
      title: 'Desenvolvedor Front End Pleno', company: 'NUBANK', location: 'Sao Paulo - SP',
      description: 'descrição bem mais completa', salary: { min: 8000, currency: 'BRL' },
    });
    const outra = mk('a2', 'adzuna', { title: 'Desenvolvedor Back-end', company: 'Nubank' });
    const providers = [
      { name: 'jsearch', search: vi.fn(async () => [jsearch]) },
      { name: 'adzuna', search: vi.fn(async () => [adzuna, outra]) },
    ] satisfies JobProvider[];
    const jobs = await searchAllProviders(['react'], {}, providers);
    // fica a versão com salário e descrição maior; a vaga diferente continua
    expect(jobs.map((j) => j.id)).toEqual(['a1', 'a2']);
  });

  it('vagas remotas da mesma empresa e cargo se juntam mesmo com locais diferentes', async () => {
    const a = mk('r1', 'remotive', { title: 'Data Engineer', company: 'Acme Inc.', location: 'Worldwide', remote: true });
    const b = mk('j2', 'jsearch', { title: 'Data Engineer', company: 'ACME', location: 'Brasil', remote: true });
    const providers = [{ name: 'remotive', search: vi.fn(async () => [a, b]) }] satisfies JobProvider[];
    expect(await searchAllProviders(['x'], {}, providers)).toHaveLength(1);
  });
});
