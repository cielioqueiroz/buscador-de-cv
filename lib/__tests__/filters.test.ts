import { describe, it, expect } from 'vitest';
import {
  jobModality,
  withinDays,
  sortRanked,
  applyFilters,
  DEFAULT_FILTERS,
} from '@/lib/filters';
import type { Job } from '@/lib/providers/types';
import type { RankedJob } from '@/lib/matching';

function job(over: Partial<Job> = {}): Job {
  return {
    id: 'j', title: 'Analista de Dados', company: 'Acme', location: 'Goiânia, GO',
    remote: false, description: 'Power BI e SQL', source: 'adzuna',
    applyUrl: 'https://x/j', ...over,
  };
}

function ranked(over: Partial<Job> = {}, score = 80): RankedJob {
  const j = job(over);
  return { job: j, match: { jobId: j.id, score, reasons: [], gaps: [] } };
}

const AGORA = new Date('2026-07-11T12:00:00Z');
const horasAtras = (h: number) => new Date(AGORA.getTime() - h * 3600_000).toISOString();

describe('jobModality', () => {
  it('remota quando a fonte marca remote', () => {
    expect(jobModality(job({ remote: true }))).toBe('remote');
  });

  it('presencial quando não é remota nem menciona híbrido', () => {
    expect(jobModality(job())).toBe('onsite');
  });

  /**
   * Nenhuma fonte tem campo "híbrido" — é heurística de texto, e a UI declara
   * isso. Vale para título, local e descrição, com e sem acento.
   */
  it.each([
    { title: 'Dev Front-end (Híbrido)' },
    { location: 'São Paulo, SP - Hybrid' },
    { description: 'Modelo de trabalho: hibrido, 2x na semana' },
  ])('híbrida quando o texto menciona: %j', (over) => {
    expect(jobModality(job(over))).toBe('hybrid');
  });

  it('híbrido ganha da flag remote — o texto é mais específico', () => {
    expect(jobModality(job({ remote: true, title: 'Dev (híbrido)' }))).toBe('hybrid');
  });
});

describe('withinDays', () => {
  it('aceita vaga dentro da janela e recusa fora dela', () => {
    expect(withinDays(job({ postedAt: horasAtras(20) }), 1, AGORA)).toBe(true);
    expect(withinDays(job({ postedAt: horasAtras(30) }), 1, AGORA)).toBe(false);
    expect(withinDays(job({ postedAt: horasAtras(24 * 6) }), 7, AGORA)).toBe(true);
    expect(withinDays(job({ postedAt: horasAtras(24 * 40) }), 30, AGORA)).toBe(false);
  });

  /**
   * O JSearch v5 quase sempre manda postedAt null. Vaga sem data não pode
   * passar num filtro de "últimas 24h": seria um filtro mentiroso.
   */
  it('vaga sem data não passa quando há período ativo', () => {
    expect(withinDays(job(), 30, AGORA)).toBe(false);
  });

  it('data inválida conta como sem data', () => {
    expect(withinDays(job({ postedAt: 'ontem' }), 7, AGORA)).toBe(false);
  });
});

describe('sortRanked', () => {
  it('por score, maior primeiro', () => {
    const xs = [ranked({ id: 'a' }, 40), ranked({ id: 'b' }, 90), ranked({ id: 'c' }, 70)];
    expect(sortRanked(xs, 'score').map((r) => r.job.id)).toEqual(['b', 'c', 'a']);
  });

  it('por recente, mais nova primeiro e sem-data no fim', () => {
    const xs = [
      ranked({ id: 'velha', postedAt: horasAtras(72) }, 95),
      ranked({ id: 'sem-data' }, 90),
      ranked({ id: 'nova', postedAt: horasAtras(2) }, 10),
    ];
    expect(sortRanked(xs, 'recent').map((r) => r.job.id)).toEqual(['nova', 'velha', 'sem-data']);
  });

  it('não muta a lista original', () => {
    const xs = [ranked({ id: 'a' }, 40), ranked({ id: 'b' }, 90)];
    sortRanked(xs, 'score');
    expect(xs[0].job.id).toBe('a');
  });
});

describe('applyFilters', () => {
  const lista = [
    ranked({ id: 'rem', remote: true, postedAt: horasAtras(2) }, 90),
    ranked({ id: 'hib', title: 'Dev híbrido', postedAt: horasAtras(24 * 5) }, 70),
    ranked({ id: 'pres', source: 'jsearch' }, 50),
  ];

  it('com defaults, deixa tudo passar', () => {
    expect(applyFilters(lista, DEFAULT_FILTERS, AGORA)).toHaveLength(3);
  });

  it('modalidade + período + fonte + score compõem', () => {
    const f = { ...DEFAULT_FILTERS, modality: 'remote' as const, maxDays: 1 as const };
    expect(applyFilters(lista, f, AGORA).map((r) => r.job.id)).toEqual(['rem']);

    const g = { ...DEFAULT_FILTERS, source: 'jsearch' as const, minScore: 60 };
    expect(applyFilters(lista, g, AGORA)).toHaveLength(0);
  });

  it('ordena conforme o pedido', () => {
    const f = { ...DEFAULT_FILTERS, order: 'recent' as const };
    expect(applyFilters(lista, f, AGORA).map((r) => r.job.id)).toEqual(['rem', 'hib', 'pres']);
  });
});
