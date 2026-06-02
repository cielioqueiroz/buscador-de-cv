import { matchJob } from '@/lib/ai/claude';
import { CVProfile, Job, MatchResult } from '@/lib/providers/types';

export interface RankedJob {
  job: Job;
  match: MatchResult;
}

/** Pontua cada vaga contra o CV e devolve ordenado por score desc. */
export async function rankJobs(cv: CVProfile, jobs: Job[]): Promise<RankedJob[]> {
  const results = await Promise.allSettled(
    jobs.map(async (job): Promise<RankedJob> => ({ job, match: await matchJob(cv, job) })),
  );
  return results
    .filter((r): r is PromiseFulfilledResult<RankedJob> => r.status === 'fulfilled')
    .map((r) => r.value)
    .sort((a, b) => b.match.score - a.match.score);
}
