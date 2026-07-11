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

  /**
   * A URL do provider é cravada em /jobs/br/: numa busca internacional ele só
   * devolveria vagas brasileiras poluindo o resultado — melhor nem consultar.
   */
  it('se auto-exclui quando o país pedido não é o Brasil', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const jobs = await adzuna.search('react', { country: 'pt' });
    expect(jobs).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('continua buscando quando o país é br ou não foi informado', async () => {
    expect(await adzuna.search('react', { country: 'br' })).toHaveLength(1);
    expect(await adzuna.search('react', {})).toHaveLength(1);
  });
});
