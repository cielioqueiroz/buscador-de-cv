import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adzuna } from '@/lib/providers/adzuna';

const fakeResponse = {
  results: [{
    id: '123', title: 'Desenvolvedor React',
    company: { display_name: 'ACME' },
    location: { display_name: 'São Paulo' },
    description: 'Vaga de React e TypeScript',
    redirect_url: 'https://adzuna.com/apply/123',
    salary_min: 5000, salary_max: 9000,
    created: '2026-06-01T00:00:00Z',
  }],
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true, json: async () => fakeResponse,
  })));
  process.env.ADZUNA_APP_ID = 'id';
  process.env.ADZUNA_APP_KEY = 'key';
});

describe('adzuna.search', () => {
  it('normaliza a resposta para Job[]', async () => {
    const jobs = await adzuna.search('react', { location: 'São Paulo' });
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'Desenvolvedor React', company: 'ACME',
      source: 'adzuna', applyUrl: 'https://adzuna.com/apply/123',
    });
    expect(jobs[0].salary).toEqual({ min: 5000, max: 9000, currency: 'BRL' });
  });

  it('retorna [] quando a API falha', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })));
    const jobs = await adzuna.search('react', {});
    expect(jobs).toEqual([]);
  });
});
