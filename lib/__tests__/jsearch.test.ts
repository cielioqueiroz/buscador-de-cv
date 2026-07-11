import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jsearch } from '@/lib/providers/jsearch';
import { JobSchema } from '@/lib/providers/types';

/** Resposta real da v5: vagas em `data.jobs`, com job_city e a data em null. */
const fake = {
  status: 'OK',
  data: {
    cursor: 'abc',
    jobs: [{
      job_id: 'xyz',
      job_title: 'Desenvolvimento Front-End (React)',
      employer_name: 'DBC Company',
      job_publisher: 'Indeed',
      job_apply_link: 'https://indeed.com/jobs/xyz',
      job_description: 'Atuar como referência técnica em React',
      job_is_remote: false,
      job_location: 'Brasil',
      job_city: null,
      job_state: null,
      job_country: 'BR',
      job_posted_at: 'há 3 dias',
      job_posted_at_datetime_utc: null,
    }],
  },
};

const calls = () => (fetch as unknown as { mock: { calls: string[][] } }).mock.calls;

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => fake })));
  process.env.RAPIDAPI_KEY = 'k';
});

describe('jsearch.search', () => {
  it('lê as vagas de data.jobs (formato da v5)', async () => {
    const jobs = await jsearch.search('front-end react', {});
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'Desenvolvimento Front-End (React)',
      company: 'DBC Company',
      source: 'jsearch',
      publisher: 'Indeed',
      applyUrl: 'https://indeed.com/jobs/xyz',
    });
  });

  // A v5 aposentou o /search: o caminho antigo devolve 404.
  it('bate no endpoint /search-v2', async () => {
    await jsearch.search('x', {});
    expect(calls()[0][0]).toContain('/search-v2?');
  });

  // job_city vem null na v5; o texto pronto está em job_location.
  it('usa job_location quando a cidade vem vazia', async () => {
    const jobs = await jsearch.search('x', {});
    expect(jobs[0].location).toBe('Brasil');
  });

  // O bug perigoso: a v5 devolve null aqui, e o JobSchema declara postedAt como
  // string opcional. Um null passaria pelo provider e só estouraria depois, na
  // validação da rota /jobs/match — derrubando a busca inteira com um 400.
  it('converte a data null em undefined, para não reprovar no JobSchema', async () => {
    const jobs = await jsearch.search('x', {});
    expect(jobs[0].postedAt).toBeUndefined();
    expect(() => JobSchema.parse(jobs[0])).not.toThrow();
  });

  it('descarta vaga sem link de candidatura', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { jobs: [{ ...fake.data.jobs[0], job_apply_link: null }] } }),
    })));
    expect(await jsearch.search('x', {})).toEqual([]);
  });

  it('busca no Brasil por padrão', async () => {
    await jsearch.search('backend', {});
    const url = new URL(calls()[0][0]);
    expect(url.searchParams.get('country')).toBe('br');
  });

  it('mas respeita o país quando informado', async () => {
    await jsearch.search('backend', { country: 'pt' });
    const url = new URL(calls()[0][0]);
    expect(url.searchParams.get('country')).toBe('pt');
  });

  it('retorna [] sem RAPIDAPI_KEY', async () => {
    delete process.env.RAPIDAPI_KEY;
    expect(await jsearch.search('x', {})).toEqual([]);
  });

  it('retorna [] quando a API responde erro, em vez de estourar', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })));
    expect(await jsearch.search('x', {})).toEqual([]);
  });
});
