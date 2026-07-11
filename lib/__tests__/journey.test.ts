import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runJourney, type Stage } from '@/lib/journey';
import { loadProfile, loadRanked } from '@/lib/store';

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

const ranked = [{ job, match: { score: 85, reasons: [], gaps: [] } }];

/** Responde cada rota com o corpo dado; `null` = falha com a mensagem. */
function mockFetch(routes: Record<string, unknown>) {
  return vi.fn(async (url: string) => {
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

  it('salva perfil e ranking, para /resultados abrir pronto', async () => {
    vi.stubGlobal('fetch', mockFetch({
      '/api/cv/analyze': { profile },
      '/api/jobs/search': { jobs: [job] },
      '/api/jobs/match': { ranked },
    }));

    await runJourney(file, () => {});

    expect(loadProfile()?.title).toBe('Analista de Dados');
    expect(loadRanked()).toHaveLength(1);
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
