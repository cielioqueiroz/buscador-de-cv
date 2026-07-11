import { matchJobs } from '@/lib/ai/gemini';
import { CVProfile, Job, MatchResult } from '@/lib/providers/types';

export interface RankedJob {
  job: Job;
  match: MatchResult;
}

/**
 * Pontua as vagas contra o CV e devolve ordenado por score desc.
 *
 * A pontuação é uma chamada só para o lote inteiro (ver `matchJobs`), então não
 * há mais nada a orquestrar aqui: nem paralelismo, nem aquecimento de cache.
 * Se a chamada falhar, a busca falha — e é isso que o usuário precisa ver, em
 * vez de uma lista vazia fingindo que não há vagas.
 */
export async function rankJobs(cv: CVProfile, jobs: Job[]): Promise<RankedJob[]> {
  if (jobs.length === 0) return [];

  const matches = await matchJobs(cv, jobs);

  const porId = new Map(matches.map((m) => [m.jobId, m]));
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

  return ranked.sort((a, b) => b.match.score - a.match.score);
}
