import { z } from 'zod';

/**
 * Dois tetos diferentes, de propósito:
 *
 * - MAX_JOBS_IN_REQUEST: quantas vagas o corpo aceita. A busca costuma voltar
 *   com dezenas, e o cliente manda todas — recusar aqui quebraria o fluxo real.
 *   Serve só para barrar um payload absurdo.
 * - MAX_JOBS_PER_MATCH: quantas vagas a IA pontua. É o teto de custo, porque
 *   cada uma é uma chamada ao Gemini. O excedente é descartado, não recusado.
 */
export const MAX_JOBS_IN_REQUEST = 60;
export const MAX_JOBS_PER_MATCH = 15;
export const MAX_CV_CHARS = 12_000;
export const MAX_JOB_DESC_CHARS = 6_000;

export const SeniorityEnum = z.enum(['estagio', 'junior', 'pleno', 'senior', 'lead']);
export type Seniority = z.infer<typeof SeniorityEnum>;

export const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  remote: z.boolean(),
  description: z.string(),
  salary: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string(),
  }).optional(),
  postedAt: z.string().optional(),
  source: z.enum(['jsearch', 'adzuna', 'remotive']),
  applyUrl: z.string().url(),
  publisher: z.string().optional(),
});
export type Job = z.infer<typeof JobSchema>;

export const CVProfileSchema = z.object({
  title: z.string(),
  seniority: SeniorityEnum,
  skills: z.array(z.string()),
  areas: z.array(z.string()),
  searchQueries: z.array(z.string()),
  rawText: z.string(),
});
export type CVProfile = z.infer<typeof CVProfileSchema>;

export const MatchResultSchema = z.object({
  jobId: z.string(),
  score: z.number().min(0).max(100),
  reasons: z.array(z.string()),
  gaps: z.array(z.string()),
});
export type MatchResult = z.infer<typeof MatchResultSchema>;

/**
 * Schemas que a IA precisa devolver. `rawText` e `jobId` são preenchidos pelo
 * servidor, então ficam de fora do contrato mandado ao modelo.
 */
export const CVProfileAISchema = CVProfileSchema.omit({ rawText: true });

/**
 * O lote inteiro numa resposta só. A IA referencia cada vaga pelo índice que
 * recebeu no prompt — pedir o `jobId` de volta é convite para ela alucinar um
 * id que não existe. O índice é verificável; o id, não.
 */
export const MatchBatchSchema = z.object({
  matches: z.array(z.object({
    index: z.number().int().min(0),
    score: z.number().min(0).max(100),
    reasons: z.array(z.string()),
    gaps: z.array(z.string()),
  })),
});

/** Corpos de requisição das API Routes — o cliente não é confiável. */
export const SearchRequestSchema = z.object({
  queries: z.array(z.string().min(1).max(200)).min(1).max(8),
  opts: z.object({
    location: z.string().max(120).optional(),
    country: z.string().length(2).optional(),
    remoteOnly: z.boolean().optional(),
    page: z.number().int().min(1).max(10).optional(),
  }).default({}),
});

export const MatchRequestSchema = z.object({
  profile: CVProfileSchema,
  jobs: z.array(JobSchema).min(1).max(MAX_JOBS_IN_REQUEST),
});

export interface SearchOpts {
  location?: string;
  /** Código ISO de 2 letras. Default 'br' — sem ele o JSearch devolve vagas dos EUA. */
  country?: string;
  remoteOnly?: boolean;
  page?: number;
}

export interface JobProvider {
  name: 'jsearch' | 'adzuna' | 'remotive';
  search(query: string, opts: SearchOpts): Promise<Job[]>;
}

/** Gera um id estável p/ dedup. */
export function jobId(title: string, company: string, location: string): string {
  return Buffer.from(`${title}|${company}|${location}`.toLowerCase()).toString('base64url');
}
