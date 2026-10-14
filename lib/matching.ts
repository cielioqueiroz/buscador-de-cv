import { matchJobs } from '@/lib/ai/gemini';
import type { CVProfile, Job, MatchResult } from '@/lib/providers/types';
import type { RankedJob } from '@/lib/ranked';

export type { RankedJob } from '@/lib/ranked';

/**
 * Pontua as vagas contra o CV e devolve ordenado por score desc.
 *
 * `cached` traz notas já conhecidas para este CV (lib/jobs/rank-search.ts):
 * só as vagas sem nota vão à IA, numa chamada só para o lote (ver
 * `matchJobs`). `fresh` devolve as notas novas para quem quiser guardá-las.
 * Se nada puder ser pontuado, a busca falha — é isso que o usuário precisa
 * ver, em vez de uma lista vazia fingindo que não há vagas.
 */
export async function rankJobs(
  cv: CVProfile,
  jobs: Job[],
  cached: ReadonlyMap<string, MatchResult> = new Map(),
): Promise<{ ranked: RankedJob[]; fresh: MatchResult[] }> {
  if (jobs.length === 0) return { ranked: [], fresh: [] };

  const pending = jobs.filter((job) => !cached.has(job.id));
  const fresh = pending.length > 0 ? await matchJobs(cv, pending) : [];

  const porId = new Map<string, MatchResult>([...cached, ...fresh.map((m) => [m.jobId, m] as const)]);
  const ranked: RankedJob[] = [];
  for (const job of jobs) {
    const match = porId.get(job.id);
    // Vaga que a IA deixou de pontuar simplesmente não entra — inventar um score
    // seria pior do que omitir.
    if (match) ranked.push({ job, match });
  }

  if (ranked.length === 0) {
    throw new Error('Não foi possível pontuar as vagas.');
  }

  if (ranked.length < jobs.length) {
    console.warn(`[rankJobs] a IA pontuou ${ranked.length} de ${jobs.length} vagas`);
  }

  return { ranked: ranked.sort((a, b) => b.match.score - a.match.score), fresh };
}
