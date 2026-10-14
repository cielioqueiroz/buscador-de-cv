import { z } from 'zod';
import { JobSchema, MatchResultSchema, type Job, type MatchResult } from '@/lib/providers/types';

/**
 * Uma vaga com a nota dela. Vive à parte de lib/matching.ts (que chama a IA)
 * porque o navegador também valida rankings — e não pode puxar o servidor junto.
 */
export interface RankedJob {
  job: Job;
  match: MatchResult;
}

export const RankedJobSchema = z.object({
  job: JobSchema,
  match: MatchResultSchema,
});

export const RankedListSchema = z.array(RankedJobSchema).max(200);
