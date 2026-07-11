import type { Job } from '@/lib/providers/types';
import type { RankedJob } from '@/lib/matching';

/**
 * Filtros que agem na hora sobre o ranking já carregado, sem custo.
 * Localização fica de fora de propósito: com só 15 vagas pontuadas por busca,
 * filtrar por cidade aqui quase sempre daria zero — lugar re-busca nas fontes
 * (ver searchAndRank em lib/journey.ts).
 */

export type Modality = 'remote' | 'hybrid' | 'onsite';
export type MaxDays = 1 | 7 | 30 | null;

export interface FilterState {
  modality: Modality | 'all';
  /** null = qualquer data. */
  maxDays: MaxDays;
  order: 'score' | 'recent';
  minScore: number;
  source: 'all' | 'jsearch' | 'adzuna' | 'remotive';
}

export const DEFAULT_FILTERS: FilterState = {
  modality: 'all',
  maxDays: null,
  order: 'score',
  minScore: 0,
  source: 'all',
};

/**
 * Nenhuma fonte tem campo "híbrido" — é heurística de texto, e a UI declara
 * isso ao usuário. Quando o texto diz "híbrido", ele ganha da flag `remote`:
 * é a informação mais específica que temos.
 */
const HIBRIDO = /h[íi]brid|hybrid/i;

export function jobModality(job: Job): Modality {
  if (HIBRIDO.test(`${job.title} ${job.location} ${job.description}`)) return 'hybrid';
  return job.remote ? 'remote' : 'onsite';
}

function postedTime(job: Job): number | null {
  if (!job.postedAt) return null;
  const t = Date.parse(job.postedAt);
  return Number.isNaN(t) ? null : t;
}

/**
 * Vaga sem data (comum no JSearch v5) não passa quando há período ativo:
 * "últimas 24h" mostrando vaga de data desconhecida é filtro mentiroso.
 */
export function withinDays(job: Job, days: number, now: Date = new Date()): boolean {
  const t = postedTime(job);
  if (t === null) return false;
  return now.getTime() - t <= days * 86_400_000;
}

export function sortRanked(ranked: RankedJob[], order: FilterState['order']): RankedJob[] {
  const xs = [...ranked];
  if (order === 'score') return xs.sort((a, b) => b.match.score - a.match.score);
  // Por recente: sem-data vai para o fim — não dá para fingir que é nova.
  return xs.sort((a, b) => (postedTime(b.job) ?? -Infinity) - (postedTime(a.job) ?? -Infinity));
}

export function applyFilters(
  ranked: RankedJob[],
  f: FilterState,
  now: Date = new Date(),
): RankedJob[] {
  const kept = ranked.filter((r) => {
    if (f.modality !== 'all' && jobModality(r.job) !== f.modality) return false;
    if (f.maxDays !== null && !withinDays(r.job, f.maxDays, now)) return false;
    if (f.source !== 'all' && r.job.source !== f.source) return false;
    if (r.match.score < f.minScore) return false;
    return true;
  });
  return sortRanked(kept, f.order);
}
