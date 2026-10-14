import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runJourney, searchAndRank, type Stage } from '@/lib/journey';
import type { CVProfile } from '@/lib/providers/types';

const profile = {
  title: 'Analista de Dados',
  seniority: 'pleno',
  skills: ['Power BI'],
  areas: ['dados'],
  searchQueries: ['analista de dados'],
  rawText: 'cv',
};

const job = {
  id: 'j1', title: 'Analista', company: 'Acme', location: 'Goiânia, GO',
  remote: false, description: 'd', source: 'adzuna', applyUrl: 'https://x/j1',
};

const ranked = [{ job, match: { jobId: 'j1', score: 85, reasons: [], gaps: [] } }];

/** Responde cada rota com o corpo dado; `null` = falha com a mensagem. */
function mockFetch(routes: Record<string, unknown>) {
  return vi.fn(async (url: string, _init?: RequestInit) => {
    const body = routes[url];
    if (body instanceof Error) {
      return { ok: false, json: async () => ({ error: body.message }) };
    }
    return { ok: true, json: async () => body };
  });
}

const file = new File(['cv'], 'cv.pdf', { type: 'application/pdf' });

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('runJourney', () => {
  it('percorre as quatro etapas na ordem e entrega as vagas ranqueadas', async () => {
    vi.stubGlobal('fetch', mockFetch({
      '/api/cv/analyze': { profile },
      '/api/jobs/search': { jobs: [job] },
      '/api/jobs/match': { ranked },
    }));

    const stages: Stage[] = [];
    const out = await runJourney(file, (s) => stages.push(s));

    expect(stages).toEqual(['reading', 'profiling', 'searching', 'scoring']);
    expect(out.ranked).toHaveLength(1);
    expect(out.profile.title).toBe('Analista de Dados');
  });

  // O servidor pontua a busca que ele guardou contra o perfil da conta: o
  // navegador não manda (nem pode adulterar) perfil e vagas.
  it('pede o match sem mandar perfil nem vagas', async () => {
    const fetchMock = mockFetch({
      '/api/cv/analyze': { profile },
      '/api/jobs/search': { jobs: [job] },
      '/api/jobs/match': { ranked },
    });
    vi.stubGlobal('fetch', fetchMock);

    await runJourney(file, () => {});

    const match = fetchMock.mock.calls.find((c) => c[0] === '/api/jobs/match');
    expect(JSON.parse((match![1] as RequestInit).body as string)).toEqual({});
  });

  /**
   * Zero vagas não é erro: é um resultado. A página de resultados já tem estado
   * vazio para isso. Chamar o match com lista vazia só queimaria uma ida à IA.
   */
  it('sem vagas, termina com lista vazia e nem chama o match', async () => {
    const fetchMock = mockFetch({
      '/api/cv/analyze': { profile },
      '/api/jobs/search': { jobs: [] },
    });
    vi.stubGlobal('fetch', fetchMock);

    const out = await runJourney(file, () => {});

    expect(out.ranked).toEqual([]);
    const chamadas = fetchMock.mock.calls.map((c) => c[0]);
    expect(chamadas).not.toContain('/api/jobs/match');
  });

  it.each([
    ['/api/cv/analyze', 'CV ilegível.'],
    ['/api/jobs/search', 'Fontes fora do ar.'],
    ['/api/jobs/match', 'A IA falhou.'],
  ])('propaga o erro de %s com a mensagem da API', async (rota, msg) => {
    vi.stubGlobal('fetch', mockFetch({
      '/api/cv/analyze': { profile },
      '/api/jobs/search': { jobs: [job] },
      '/api/jobs/match': { ranked },
      [rota]: new Error(msg),
    }));

    await expect(runJourney(file, () => {})).rejects.toThrow(msg);
  });
});

describe('searchAndRank (re-busca regional)', () => {
  /**
   * A razão de existir separado: os filtros de lugar re-consultam as fontes.
   * O que o formulário escolher (cidade, UF, país) precisa chegar na API.
   */
  it('manda os opts regionais para a busca e atualiza o cache', async () => {
    const fetchMock = mockFetch({
      '/api/jobs/search': { jobs: [job] },
      '/api/jobs/match': { ranked },
    });
    vi.stubGlobal('fetch', fetchMock);

    const stages: Stage[] = [];
    const out = await searchAndRank(
      profile as CVProfile,
      { location: 'Goiânia, GO', country: 'br' },
      (s) => stages.push(s),
    );

    const busca = fetchMock.mock.calls.find((c) => c[0] === '/api/jobs/search');
    const corpo = JSON.parse((busca![1] as RequestInit).body as string);
    expect(corpo.opts).toEqual({ location: 'Goiânia, GO', country: 'br' });
    expect(stages).toEqual(['searching', 'scoring']);
    expect(out).toHaveLength(1);
  });
});
