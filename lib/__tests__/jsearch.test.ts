import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jsearch } from '@/lib/providers/jsearch';

const fake = {
  data: [{
    job_id: 'xyz', job_title: 'Backend Developer',
    employer_name: 'Initech', job_city: 'Remote', job_country: 'BR',
    job_description: 'Node.js backend', job_apply_link: 'https://linkedin.com/jobs/xyz',
    job_is_remote: true, job_publisher: 'LinkedIn',
    job_posted_at_datetime_utc: '2026-05-29T00:00:00Z',
  }],
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => fake })));
  process.env.RAPIDAPI_KEY = 'k';
});

describe('jsearch.search', () => {
  it('normaliza e preserva publisher', async () => {
    const jobs = await jsearch.search('backend', {});
    expect(jobs[0]).toMatchObject({
      title: 'Backend Developer', company: 'Initech',
      remote: true, source: 'jsearch',
      applyUrl: 'https://linkedin.com/jobs/xyz', publisher: 'LinkedIn',
    });
  });

  it('retorna [] sem RAPIDAPI_KEY', async () => {
    delete process.env.RAPIDAPI_KEY;
    const jobs = await jsearch.search('x', {});
    expect(jobs).toEqual([]);
  });

  // Sem country=br o JSearch assume os EUA e devolve vagas americanas para
  // quem está procurando emprego no Brasil.
  it('busca no Brasil por padrão', async () => {
    await jsearch.search('backend', {});
    const url = new URL((fetch as unknown as { mock: { calls: string[][] } }).mock.calls[0][0]);
    expect(url.searchParams.get('country')).toBe('br');
  });

  it('mas respeita o país quando informado', async () => {
    await jsearch.search('backend', { country: 'pt' });
    const url = new URL((fetch as unknown as { mock: { calls: string[][] } }).mock.calls[0][0]);
    expect(url.searchParams.get('country')).toBe('pt');
  });
});
