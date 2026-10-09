import { z } from 'zod';
import { JobSchema, MatchResultSchema } from '@/lib/providers/types';

export const APPLICATION_STAGES = ['aplicado', 'entrevista', 'oferta'] as const;
export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

export const ApplicationStageSchema = z.enum(APPLICATION_STAGES);

export const ApplicationSchema = z.object({
  id: z.string().trim().min(1).max(500),
  job: JobSchema,
  match: MatchResultSchema,
  stage: ApplicationStageSchema,
  createdAt: z.number().finite(),
  updatedAt: z.number().finite(),
});

export type Application = z.infer<typeof ApplicationSchema>;
