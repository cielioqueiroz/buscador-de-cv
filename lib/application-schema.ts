import { z } from 'zod';
import { JobSchema, MatchResultSchema } from '@/lib/providers/types';

export const APPLICATION_STAGES = ['aplicado', 'entrevista', 'oferta', 'recusado'] as const;
export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

export const ApplicationStageSchema = z.enum(APPLICATION_STAGES);

const NOTES_MAX = 2_000;
/** "AAAA-MM-DD", do <input type="date">. */
const DateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.');

/**
 * O que dá para mudar numa candidatura já no tracker. `null` apaga o campo.
 * Pelo menos um campo precisa vir.
 */
export const ApplicationPatchSchema = z
  .object({
    stage: ApplicationStageSchema.optional(),
    notes: z.string().max(NOTES_MAX).nullable().optional(),
    interviewOn: DateOnly.nullable().optional(),
  })
  .refine((p) => p.stage !== undefined || p.notes !== undefined || p.interviewOn !== undefined, {
    message: 'Nada para atualizar.',
  });
export type ApplicationPatch = z.infer<typeof ApplicationPatchSchema>;

export const ApplicationSchema = z.object({
  id: z.string().trim().min(1).max(500),
  job: JobSchema,
  match: MatchResultSchema,
  stage: ApplicationStageSchema,
  notes: z.string().max(NOTES_MAX).optional(),
  interviewOn: DateOnly.optional(),
  createdAt: z.number().finite(),
  updatedAt: z.number().finite(),
});

export type Application = z.infer<typeof ApplicationSchema>;
