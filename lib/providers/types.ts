import { z } from 'zod';

/**
 * Dois tetos diferentes, de propósito:
 *
 * - MAX_JOBS_IN_REQUEST: quantas vagas o corpo aceita. Com as três fontes
 *   ligadas, uma busca real volta com ~70 vagas (3 queries x 3 providers), e o
 *   cliente manda todas. Este teto já foi 60 e rejeitava o fluxo normal com um
 *   400 — serve para barrar payload absurdo, não para limitar o uso legítimo.
 *   Uma busca de 70 vagas pesa ~85 KB; 200 caberiam em ~240 KB, bem abaixo do
 *   limite de corpo da Vercel.
 * - MAX_JOBS_PER_MATCH: quantas vagas a IA pontua. É o teto de custo. O
 *   excedente é descartado, não recusado.
 */
export const MAX_JOBS_IN_REQUEST = 200;
export const MAX_JOBS_PER_MATCH = 15;
export const MAX_CV_CHARS = 12_000;
export const MAX_JOB_DESC_CHARS = 6_000;

const SAFE_HTTP_URL = z.string().url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === 'http:' || protocol === 'https:';
}, 'A URL precisa usar http ou https.');

const ShortText = z.string().trim().min(1).max(240);
const ExplanationText = z.string().trim().min(1).max(600);

export const SeniorityEnum = z.enum(['estagio', 'junior', 'pleno', 'senior', 'lead']);
export type Seniority = z.infer<typeof SeniorityEnum>;

export const JobSchema = z.object({
  id: ShortText.max(500),
  title: ShortText.max(240),
  company: ShortText.max(240),
  location: ShortText.max(240),
  remote: z.boolean(),
  description: z.string().max(MAX_JOB_DESC_CHARS),
  salary: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().trim().min(1).max(12),
  }).optional(),
  postedAt: z.string().max(80).optional(),
  source: z.enum(['jsearch', 'adzuna', 'remotive']),
  applyUrl: SAFE_HTTP_URL,
  publisher: z.string().trim().min(1).max(120).optional(),
});
export type Job = z.infer<typeof JobSchema>;

export const CVProfileSchema = z.object({
  title: ShortText.max(160),
  seniority: SeniorityEnum,
  skills: z.array(z.string().trim().min(1).max(100)).max(60),
  areas: z.array(z.string().trim().min(1).max(100)).max(30),
  searchQueries: z.array(z.string().trim().min(1).max(120)).min(1).max(8),
  rawText: z.string().trim().min(1).max(MAX_CV_CHARS),
});
export type CVProfile = z.infer<typeof CVProfileSchema>;

export const MatchResultSchema = z.object({
  jobId: z.string().trim().min(1).max(500),
  score: z.number().min(0).max(100),
  reasons: z.array(ExplanationText).max(8),
  gaps: z.array(ExplanationText).max(8),
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
    // O servidor filtra índices fora do lote depois do parse. Mantemos aqui
    // apenas um teto de payload, não um teto relativo ao lote atual.
    index: z.number().int().min(0).max(MAX_JOBS_IN_REQUEST - 1),
    score: z.number().min(0).max(100),
    reasons: z.array(ExplanationText).max(8),
    gaps: z.array(ExplanationText).max(8),
  })).max(MAX_JOBS_PER_MATCH),
});

/** Corpos de requisição das API Routes — o cliente não é confiável. */
export const SearchRequestSchema = z.object({
  queries: z.array(z.string().trim().min(1).max(120)).min(1).max(8),
  opts: z.object({
    location: z.string().trim().max(120).optional(),
    country: z.string().regex(/^[a-z]{2}$/i).optional(),
    remoteOnly: z.boolean().optional(),
    page: z.number().int().min(1).max(10).optional(),
  }).default({}),
});

export const MatchRequestSchema = z.object({
  profile: CVProfileSchema,
  jobs: z.array(JobSchema).min(1).max(MAX_JOBS_IN_REQUEST),
});

/** Valida a saída de um adapter antes que ela alcance outra camada. */
export function parseProviderJobs(value: unknown): Job[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate) => {
    const parsed = JobSchema.safeParse(candidate);
    return parsed.success ? [parsed.data] : [];
  });
}

/** Leitura segura de objetos JSON vindos de terceiros. */
export function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
}

export function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

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
