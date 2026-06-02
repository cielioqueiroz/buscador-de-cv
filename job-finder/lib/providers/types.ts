import { z } from 'zod';

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

export interface SearchOpts {
  location?: string;
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
