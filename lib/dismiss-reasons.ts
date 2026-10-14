import { z } from 'zod';
import { JobIdSchema } from '@/lib/providers/types';

/**
 * Motivos de "não tenho interesse". Batem com o CHECK de
 * db/migrations/0010_job_dismissals.sql. Módulo puro: o card usa no navegador.
 */
export const DismissReasonEnum = z.enum(['salario', 'modalidade', 'senioridade', 'area', 'empresa', 'outro']);
export type DismissReason = z.infer<typeof DismissReasonEnum>;

export const DISMISS_REASON_LABELS: Record<DismissReason, string> = {
  salario: 'Salário baixo',
  modalidade: 'Modalidade (presencial/remoto)',
  senioridade: 'Nível não combina',
  area: 'Fora da minha área',
  empresa: 'Não quero esta empresa',
  outro: 'Outro motivo',
};

export const DismissRequestSchema = z.object({ jobId: JobIdSchema, reason: DismissReasonEnum });
export const UndismissRequestSchema = z.object({ jobId: JobIdSchema });
